import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { studioRegistry } from "../../registry/runtime";
import { checksum } from "../../registry/contracts";
import { entityDetailsSchema } from "../../registry/entities";
import { compileCustomField } from "../../compiler/fields";
import { customFieldPayloadSchema } from "../schema";
import { assertFieldBinding } from "../binding";
import { fieldConversionSchema } from "../evolution";
import type { FieldMigrationPrincipal } from "../principal-contract";
import { withFieldMigrationAuthority } from "./authority";
import { assertFieldMigrationPolicies } from "./access";
import { sealFieldMigrationIntent, FieldMigrationReviewError } from "./contracts";

const requestSchema = z.strictObject({ operationId: z.uuid(), definitionId: z.uuid(),
  definitionRevision: z.number().int().nonnegative(), draftRevision: z.number().int().nonnegative(), conversion: fieldConversionSchema });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
/** Internal server service. Principal comes from capture/support, never request input. */
export async function startFieldMigrationPreparation(session: Session, serverPrincipal: FieldMigrationPrincipal, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = requestSchema.parse(input);
  return withFieldMigrationAuthority(session, serverPrincipal, async ({ session: fresh, principal, transaction: tx, company }) => {
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
  });
}
