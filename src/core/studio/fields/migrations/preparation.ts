import { z } from "zod";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { Prisma } from "@/generated/prisma/client";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { studioRegistry } from "../../registry/runtime";
import { checksum } from "../../registry/contracts";
import { entityDetailsSchema } from "../../registry/entities";
import { compileCustomField } from "../../compiler/fields";
import { customFieldPayloadSchema } from "../schema";
import { assertFieldBinding } from "../binding";
import { fieldConversionSchema } from "../evolution";
import { resolveFieldMigrationPrincipal } from "../principal";
import { fieldMigrationPrincipalSchema, type FieldMigrationPrincipal } from "../principal-contract";
import { assertFieldMigrationPolicies } from "./access";
import { sealFieldMigrationIntent, FieldMigrationReviewError } from "./contracts";

const requestSchema = z.strictObject({ operationId: z.uuid(), definitionId: z.uuid(),
  definitionRevision: z.number().int().nonnegative(), draftRevision: z.number().int().nonnegative(), conversion: fieldConversionSchema });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function sameActor(session: Session, principal: FieldMigrationPrincipal) {
  if (session.organisationId !== principal.organisationId || session.userId !== principal.userId || session.membershipId !== principal.membershipId)
    throw new Error("FORBIDDEN: preparation requires the authenticated company data principal.");
}

/** Internal server service. Principal comes from capture/support, never request input. */
export async function startFieldMigrationPreparation(session: Session, serverPrincipal: FieldMigrationPrincipal, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = requestSchema.parse(input), principal = fieldMigrationPrincipalSchema.parse(serverPrincipal);
  sameActor(session, principal);
  sameActor(await resolveFieldMigrationPrincipal(principal), principal);
  try { return await db.$transaction(async tx => {
    // Keep the current identity, profile assignments and company/source policy
    // stable while refreshing permissions and persisting the immutable intent.
    await tx.$queryRaw`SELECT m.id FROM memberships m JOIN users u ON u.id=m."userId" JOIN organisations o ON o.id=m."organisationId"
      WHERE m.id=${principal.membershipId} AND m."organisationId"=${principal.organisationId} AND m."userId"=${principal.userId}
      FOR SHARE OF m,u,o`;
    await tx.$queryRaw`SELECT r.id FROM roles r JOIN roles_on_memberships rm ON rm."roleId"=r.id
      WHERE rm."membershipId"=${principal.membershipId} AND r."organisationId"=${principal.organisationId} FOR SHARE OF r,rm`;
    if (principal.authority === "staff_support")
      await tx.$queryRaw`SELECT id FROM platform_administrators WHERE "userId"=${principal.userId} FOR SHARE`;
    const fresh = await resolveFieldMigrationPrincipal(principal); sameActor(fresh, principal);
    const membership = await tx.membership.findFirst({ where: { id: principal.membershipId, organisationId: principal.organisationId, userId: principal.userId, active: true },
      select: { sessionVersion: true, user: { select: { authVersion: true } } } });
    if (!membership || membership.sessionVersion !== principal.sessionVersion || membership.user.authVersion !== principal.authVersion)
      throw new Error("FORBIDDEN: preparation authority changed.");
    await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${fresh.organisationId} AND "moduleId"='studio' FOR SHARE`;
    if (!await tx.moduleState.findFirst({ where: { organisationId: fresh.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("DEPENDENCY_BROKEN: Studio is unavailable.");
    const company = await tx.organisation.findFirst({ where: { id: fresh.organisationId }, select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
    if (!company) throw new Error("FORBIDDEN: current company data access is required.");
    await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
      WHERE d.id=${request.definitionId}::uuid AND d."organisationId"=${fresh.organisationId} FOR SHARE OF d,draft`;
    const definition = await tx.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: fresh.organisationId,
      kind: "customField", retiredAt: null, revision: request.definitionRevision }, include: { draft: true, activeVersion: true } });
    if (!definition?.activeVersion || !definition.draft || definition.draft.revision !== request.draftRevision) changed();
    const source = definition.activeVersion, draft = definition.draft;
    const current = customFieldPayloadSchema.parse(source.payload), target = customFieldPayloadSchema.parse(draft.payload);
    assertFieldMigrationPolicies(fresh, company, current);
    const registry = studioRegistry(), compiledSource = await compileCustomField(fresh, current, registry), compiledTarget = await compileCustomField(fresh, target, registry);
    if (source.checksum !== checksum(source.compiledPlan) || source.checksum !== compiledSource.checksum) changed();
    await assertFieldBinding(tx, fresh, definition.id, current);
    const owner = await registry.resolve(fresh, target.entity), policy = entityDetailsSchema.parse(owner.details).record?.migrationSnapshot;
    if (!policy || !policy.sourceVersions.includes(current.entity.version) || current.entity.id !== target.entity.id)
      throw new Error("MIGRATION_OWNER_REQUIRED: this owner has not approved the source field snapshot protocol.");
    const ownerQuery = registry.describe(policy.query.id, policy.query.version);
    // Source/ref module availability cannot race compilation or preparation.
    for (const id of [...new Set([...compiledSource.plan.dependencies, ...compiledTarget.plan.dependencies].map(ref => ref.ownerModuleId))].sort()) {
      await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${fresh.organisationId} AND "moduleId"=${id} FOR SHARE`;
      if (!await tx.moduleState.findFirst({ where: { organisationId: fresh.organisationId, moduleId: id, enabled: true, entitled: true }, select: { id: true } }))
        throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
    }
    const sealed = sealFieldMigrationIntent({ schemaVersion: 1, id: request.operationId, organisationId: fresh.organisationId,
      definitionId: definition.id, definitionRevision: definition.revision, principal,
      source: { versionId: source.id, versionChecksum: source.checksum, payload: current },
      target: { draftId: draft.id, draftRevision: draft.revision, compiledChecksum: compiledTarget.checksum, payload: compiledTarget.payload },
      conversion: request.conversion, ownerQuery: { id: ownerQuery.id, version: ownerQuery.version, schemaHash: ownerQuery.schemaHash, contractHash: ownerQuery.contractHash } });
    await registry.invokeQueryInTransaction({ session: fresh, transaction: tx }, sealed.intent.ownerQuery, { mode: "preflight" });
    const existing = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: request.operationId, organisationId: fresh.organisationId } });
    if (existing) {
      if (existing.state === "CANCELLED" || existing.intentChecksum !== sealed.checksum || checksum(existing.intent) !== sealed.checksum) changed();
      return { id: existing.id, revision: existing.revision, state: existing.state };
    }
    const preparation = await tx.studioFieldMigrationPreparation.create({ data: { id: request.operationId, organisationId: fresh.organisationId,
      definitionId: definition.id, entityId: current.entity.id, sourceVersionId: source.id, sourceGenerationId: current.storageGeneration,
      draftId: draft.id, targetGenerationId: target.storageGeneration, intent: sealed.intent, intentChecksum: sealed.checksum }, select: { id: true, revision: true, state: true } });
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.field.migration.prepared",
      entityType: "StudioFieldMigrationPreparation", entityId: preparation.id, after: { definitionId: definition.id, sourceVersionId: source.id, draftRevision: draft.revision, intentChecksum: sealed.checksum } }, tx);
    return preparation;
  }, { isolationLevel: "Serializable" }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) changed();
    throw error;
  }
}
