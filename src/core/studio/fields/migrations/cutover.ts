import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { studioRegistry } from "../../registry/runtime";
import { compileCustomField } from "../../compiler/fields";
import { activateCompiledVersionInTransaction } from "../../definitions/activation";
import { sealFieldMigrationIntent, FieldMigrationReviewError } from "./contracts";
import { withFieldMigrationAuthority } from "./authority";
import { inspectFieldMigrationExecution } from "./execution-inspection";
import { inspectFieldMigrationCutoverIdentity } from "./cutover-inspection";
import { inspectFieldMigrationReview } from "./inspection";
import { createFieldMigrationCutoverPin, fieldMigrationCutoverRequestSchema, type FieldMigrationCutoverPin } from "./cutover-contract";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** Internal explicit reviewed cutover. Refreshed initiating authority and current
 * native/private/field/reference coverage are mandatory, including lost-response
 * replay. Receipt, publication CAS, shared activation and paired Audit commit
 * together. No public endpoint, implicit execution, normal values or native writes. */
export async function cutoverReviewedFieldMigration(session: Session, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = fieldMigrationCutoverRequestSchema.parse(input);
  const initial = await db.studioFieldMigrationPreparation.findFirst({ where: { id: request.preparationId, organisationId: session.organisationId } });
  if (!initial) changed();
  const sealed = sealFieldMigrationIntent(initial.intent), intent = sealed.intent;
  if (sealed.checksum !== initial.intentChecksum || intent.id !== initial.id || intent.organisationId !== session.organisationId) changed();
  function confirm(pin: FieldMigrationCutoverPin) {
    if (request.reviewChecksum !== pin.publication.reviewChecksum || request.definitionRevision !== pin.definitionRevision
      || request.publicationRevision !== pin.publication.revision || request.executionRevision !== pin.execution.revision) changed();
  }
  function result(pin: FieldMigrationCutoverPin, replayed: boolean) {
    return { id: intent.id, state: "ACTIVATED" as const, definitionRevision: pin.definitionRevision + 1, publicationRevision: pin.publication.revision + 1,
      executionRevision: pin.execution.revision, sourceVersionId: pin.source.versionId, targetVersionId: pin.publication.targetVersionId,
      reviewChecksum: pin.publication.reviewChecksum, replayed };
  }
  return withFieldMigrationAuthority(session, intent.principal, async authority => {
    const { session: fresh, transaction: tx, company } = authority;
    const scope = { preparationId: intent.id, organisationId: fresh.organisationId, definitionId: intent.definitionId };
    await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${intent.id}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    const receipt = await tx.studioFieldMigrationCutover.findFirst({ where: scope, select: { preparationId: true } });
    if (receipt) {
      const registry = studioRegistry(), inspected = await inspectFieldMigrationCutoverIdentity(tx, intent);
      confirm(inspected.pin);
      const compiled = await compileCustomField(fresh, intent.target.payload, registry);
      if (compiled.checksum !== intent.target.compiledChecksum) changed();
      for (const moduleId of [...new Set(compiled.plan.dependencies.map(ref => ref.ownerModuleId))].sort()) {
        await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${fresh.organisationId} AND "moduleId"=${moduleId} FOR SHARE`;
        if (!await tx.moduleState.findFirst({ where: { organisationId: fresh.organisationId, moduleId, enabled: true, entitled: true }, select: { id: true } }))
          throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
      }
      const current = await inspectFieldMigrationReview({ session: fresh, transaction: tx }, registry, company, intent, "cutover");
      if (current.checksum !== inspected.stored.checksum) changed();
      return result(inspected.pin, true);
    }
    const inspected = await inspectFieldMigrationExecution(authority, intent), x = inspected.existing;
    if (!x || x.state !== "READY") changed();
    await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
      WHERE d.id=${intent.definitionId}::uuid AND d."organisationId"=${fresh.organisationId} FOR UPDATE OF d,draft`;
    const definition = await tx.studioDefinition.findFirst({ where: { id: intent.definitionId, organisationId: fresh.organisationId },
      select: { id: true, organisationId: true, kind: true, activeVersionId: true, revision: true, latestVersion: true, retiredAt: true } });
    if (!definition) changed();
    const publicationIdentity = Object.fromEntries(Object.keys(inspected.pin.publication).map(key => [key, inspected.publication[key as keyof typeof inspected.pin.publication]]));
    const pinned = createFieldMigrationCutoverPin(inspected.stored, { preparationId: x.preparationId, organisationId: x.organisationId, definitionId: x.definitionId,
      entityId: x.entityId, pin: x.pin, pinChecksum: x.pinChecksum, state: x.state, revision: x.revision, cursor: x.cursor, processedCount: x.processedCount, failureCode: x.failureCode },
    { ...publicationIdentity, state: inspected.publication.state, revision: inspected.publication.revision }, definition);
    confirm(pinned.pin);
    const compiled = await compileCustomField(fresh, inspected.target.payload, inspected.registry);
    if (compiled.checksum !== intent.target.compiledChecksum) changed();
    await tx.studioFieldMigrationCutover.create({ data: { ...scope, sourceVersionId: pinned.pin.source.versionId, targetVersionId: pinned.pin.publication.targetVersionId,
      pin: pinned.pin, pinChecksum: pinned.checksum, createdBy: fresh.userId } });
    const transitioned = await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "PUBLISHED", revision: pinned.pin.publication.revision },
      data: { state: "CUTOVER", revision: { increment: 1 } } });
    if (transitioned.count !== 1) changed();
    await activateCompiledVersionInTransaction(tx, fresh, intent.definitionId, pinned.pin.definitionRevision, inspected.target, compiled, pinned.pin.source.versionId);
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.field.migration.cutover",
      entityType: "StudioFieldMigrationCutover", entityId: intent.id,
      after: { pinChecksum: pinned.checksum, reviewChecksum: pinned.pin.publication.reviewChecksum, sourceVersionId: pinned.pin.source.versionId,
        targetVersionId: pinned.pin.publication.targetVersionId, definitionRevision: pinned.pin.definitionRevision + 1,
        publicationRevision: pinned.pin.publication.revision + 1, executionRevision: pinned.pin.execution.revision } }, tx);
    return result(pinned.pin, false);
  });
}
