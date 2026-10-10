import type { FieldMigrationAuthority } from "./authority";
import type { FieldMigrationIntent } from "./contracts";
import { FieldMigrationReviewError, sealFieldMigrationIntent, fieldMigrationIntentFromReview, readSealedFieldMigrationReview } from "./contracts";
import { checksum, canonicalJson } from "../../registry/contracts";
import { studioRegistry } from "../../registry/runtime";
import { entityDetailsSchema } from "../../registry/entities";
import { compileCustomField } from "../../compiler/fields";
import { inspectFieldMigrationReview } from "./inspection";
import { createFieldMigrationExecutionPin, readFieldMigrationExecutionProgress } from "./execution-contract";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
const targetSelect = { id: true, organisationId: true, definitionId: true, version: true, payload: true, compiledPlan: true, checksum: true } as const;

/** Shared server inspection for start and subsequent batches. No client stage,
 * progress or pin is accepted. Caller owns refreshed Serializable authority. */
export async function inspectFieldMigrationExecution(authority: FieldMigrationAuthority, serverIntent: FieldMigrationIntent) {
  const { session, transaction: tx, company } = authority, sealedIntent = sealFieldMigrationIntent(serverIntent), intent = sealedIntent.intent;
  if (intent.organisationId !== session.organisationId || intent.principal.userId !== session.userId || intent.principal.membershipId !== session.membershipId) changed();
  const scope = { preparationId: intent.id, organisationId: session.organisationId, definitionId: intent.definitionId };
  await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: intent.id, organisationId: session.organisationId, definitionId: intent.definitionId }, include: { review: true } });
  if (!preparation?.review || preparation.state !== "REVIEWED" || preparation.intentChecksum !== sealedIntent.checksum || checksum(preparation.intent) !== sealedIntent.checksum) changed();
  const stored = readSealedFieldMigrationReview({ review: preparation.review.review, checksum: preparation.review.checksum });
  if (checksum(fieldMigrationIntentFromReview(stored.review)) !== sealedIntent.checksum) changed();
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const publication = await tx.studioFieldMigrationPublication.findFirst({ where: scope });
  if (!publication || publication.state !== "PUBLISHED" || publication.publisherUserId !== session.userId || publication.reviewChecksum !== stored.checksum) changed();
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_executions WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const existing = await tx.studioFieldMigrationExecution.findFirst({ where: scope });
  if (existing && !["RUNNING", "READY", "FAILED"].includes(existing.state)) changed();
  const registry = studioRegistry(), compiled = await compileCustomField(session, intent.target.payload, registry);
  if (compiled.checksum !== intent.target.compiledChecksum) changed();
  for (const moduleId of [...new Set(compiled.plan.dependencies.map(ref => ref.ownerModuleId))].sort()) {
    await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${session.organisationId} AND "moduleId"=${moduleId} FOR SHARE`;
    if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId, enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
  }
  const inspected = await inspectFieldMigrationReview({ session, transaction: tx }, registry, company, intent, existing ? "execution" : "publication");
  if (inspected.checksum !== stored.checksum) changed();
  const target = await tx.studioDefinitionVersion.findFirst({ where: { id: publication.targetVersionId, organisationId: session.organisationId, definitionId: intent.definitionId }, select: targetSelect });
  if (!target || target.checksum !== compiled.checksum || checksum(target.compiledPlan) !== compiled.checksum) changed();
  const owner = await registry.resolve(session, intent.target.payload.entity), policy = entityDetailsSchema.parse(owner.details).record?.migrationRepresentation;
  if (!policy || !policy.sourceVersions.includes(intent.source.payload.entity.version)) changed();
  const described = registry.describe(policy.query.id, policy.query.version);
  const approval = await registry.resolve(session, { id: described.id, version: described.version, schemaHash: described.schemaHash, contractHash: described.contractHash });
  const publicationPin = { preparationId: publication.preparationId, organisationId: publication.organisationId, definitionId: publication.definitionId,
    reviewChecksum: publication.reviewChecksum, sourceGenerationId: publication.sourceGenerationId, targetGenerationId: publication.targetGenerationId,
    targetVersionId: publication.targetVersionId, targetVersionNumber: publication.targetVersionNumber, targetChecksum: publication.targetChecksum,
    publisherUserId: publication.publisherUserId, acknowledgedLoss: publication.acknowledgedLoss };
  const pinned = createFieldMigrationExecutionPin(stored, target, publicationPin, owner, approval);
  if (existing && (existing.entityId !== intent.target.payload.entity.id || existing.pinChecksum !== pinned.checksum || canonicalJson(existing.pin) !== canonicalJson(pinned.pin))) changed();
  const progress = existing ? readFieldMigrationExecutionProgress(pinned.pin, { state: existing.state, revision: existing.revision, cursor: existing.cursor,
    processedCount: existing.processedCount, failureCode: existing.failureCode }) : null;
  return { intent, stored, publication, target, registry, pin: pinned.pin, pinChecksum: pinned.checksum, existing, progress };
}
