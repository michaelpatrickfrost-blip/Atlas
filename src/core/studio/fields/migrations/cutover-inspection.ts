import type { Prisma } from "@/generated/prisma/client";
import { canonicalJson, checksum } from "../../registry/contracts";
import { FieldMigrationReviewError, sealFieldMigrationIntent, fieldMigrationIntentFromReview, readSealedFieldMigrationReview, type FieldMigrationIntent } from "./contracts";
import { readRequiredFieldMigrationCutoverReceipt, readFieldMigrationCutoverReceipt } from "./cutover-receipt";
import { fieldMigrationExecutionPinSchema } from "./execution-contract";
import { sealRequiredFieldMigrationIntent, type RequiredFieldMigrationIntent } from "./required-contracts";
import { readStoredFieldMigrationIntent, readStoredFieldMigrationReview } from "./stored-protocol";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
const versionSelect = { id: true, organisationId: true, definitionId: true, version: true, payload: true, compiledPlan: true, checksum: true } as const;

/** Internal identity inspection from actual tenant rows. No permission/readiness
 * grant: caller must refresh principal and reuse owner/field/reference coverage.
 * Original source-active predicates stay unchanged. No fabricated pre-cutover
 * state, client stage, reverse conversion or value/native writes. */
export async function inspectFieldMigrationCutoverIdentity(tx: Prisma.TransactionClient, serverIntent: FieldMigrationIntent) {
  const sealed = sealFieldMigrationIntent(serverIntent), intent = sealed.intent;
  const scope = { preparationId: intent.id, organisationId: intent.organisationId, definitionId: intent.definitionId };
  await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${intent.id}::uuid AND "organisationId"=${intent.organisationId} FOR UPDATE`;
  const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: intent.id, organisationId: intent.organisationId, definitionId: intent.definitionId }, include: { review: true } });
  if (!preparation?.review || preparation.state !== "REVIEWED" || preparation.intentChecksum !== sealed.checksum || checksum(preparation.intent) !== sealed.checksum) changed();
  const stored = readSealedFieldMigrationReview({ review: preparation.review.review, checksum: preparation.review.checksum });
  if (checksum(fieldMigrationIntentFromReview(stored.review)) !== sealed.checksum) changed();
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${intent.organisationId} FOR UPDATE`;
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_executions WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${intent.organisationId} FOR UPDATE`;
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_cutovers WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${intent.organisationId} FOR SHARE`;
  await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
    WHERE d.id=${intent.definitionId}::uuid AND d."organisationId"=${intent.organisationId} FOR SHARE OF d,draft`;
  const publication = await tx.studioFieldMigrationPublication.findFirst({ where: scope });
  const existing = await tx.studioFieldMigrationExecution.findFirst({ where: scope });
  const receipt = await tx.studioFieldMigrationCutover.findFirst({ where: scope,
    select: { preparationId: true, organisationId: true, definitionId: true, sourceVersionId: true, targetVersionId: true, pin: true, pinChecksum: true, state: true, revision: true, createdBy: true } });
  const definition = await tx.studioDefinition.findFirst({ where: { id: intent.definitionId, organisationId: intent.organisationId },
    select: { id: true, organisationId: true, kind: true, activeVersionId: true, revision: true, latestVersion: true, retiredAt: true } });
  if (!publication || !existing || !receipt || !definition) changed();
  const executionPin = fieldMigrationExecutionPinSchema.parse(existing.pin);
  const publicationIdentity = Object.fromEntries(Object.keys(executionPin.publication).map(key => [key, publication[key as keyof typeof executionPin.publication]]));
  const pinned = readFieldMigrationCutoverReceipt(stored, { preparationId: existing.preparationId, organisationId: existing.organisationId, definitionId: existing.definitionId,
    entityId: existing.entityId, pin: existing.pin, pinChecksum: existing.pinChecksum, state: existing.state, revision: existing.revision, cursor: existing.cursor,
    processedCount: existing.processedCount, failureCode: existing.failureCode }, { ...publicationIdentity, state: publication.state, revision: publication.revision }, definition, receipt);
  const draft = await tx.studioDraft.findFirst({ where: { id: intent.target.draftId, definitionId: intent.definitionId, organisationId: intent.organisationId },
    select: { revision: true, baseVersionId: true, payload: true } });
  const source = await tx.studioDefinitionVersion.findFirst({ where: { id: receipt.sourceVersionId, definitionId: intent.definitionId, organisationId: intent.organisationId }, select: versionSelect });
  const target = await tx.studioDefinitionVersion.findFirst({ where: { id: receipt.targetVersionId, definitionId: intent.definitionId, organisationId: intent.organisationId }, select: versionSelect });
  if (!draft || draft.revision !== intent.target.draftRevision + 1 || draft.baseVersionId !== receipt.targetVersionId || canonicalJson(draft.payload) !== canonicalJson(intent.target.payload)
    || !source || source.checksum !== intent.source.versionChecksum || checksum(source.compiledPlan) !== source.checksum || canonicalJson(source.payload) !== canonicalJson(intent.source.payload)
    || !target || target.version !== publication.targetVersionNumber || target.checksum !== intent.target.compiledChecksum
    || checksum(target.compiledPlan) !== target.checksum || canonicalJson(target.payload) !== canonicalJson(intent.target.payload)) changed();
  const rows = await tx.$queryRaw<Array<{ fresh: boolean }>>`SELECT atlas_studio_execution_source_fresh(pub) AND atlas_studio_execution_targets_fresh(pub) AS fresh
    FROM studio_field_migration_publications pub WHERE pub."preparationId"=${intent.id}::uuid AND pub."organisationId"=${intent.organisationId}
      AND pub."definitionId"=${intent.definitionId}::uuid AND pub.state='CUTOVER'`;
  if (rows.length !== 1 || rows[0].fresh !== true) changed();
  return { intent, stored, publication, existing, receipt, definition, source, target, executionPin, ...pinned };
}

/** Shared closed2 stored metadata only. Caller must already own refreshed tenant
 * and current owner/private/field/reference authority; hashes grant none. */
export async function inspectRequiredFieldMigrationStoredIdentity(tx: Prisma.TransactionClient, serverIntent: RequiredFieldMigrationIntent) {
  const sealed = sealRequiredFieldMigrationIntent(serverIntent), intent = sealed.intent;
  await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${intent.id}::uuid AND "organisationId"=${intent.organisationId} FOR UPDATE`;
  const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: intent.id, organisationId: intent.organisationId, definitionId: intent.definitionId }, include: { review: true } });
  if (!preparation?.review || preparation.state !== "REVIEWED" || preparation.definitionId !== intent.definitionId) changed();
  const actualIntent = readStoredFieldMigrationIntent(preparation, intent.organisationId), stored = readStoredFieldMigrationReview(preparation.review, intent.organisationId);
  if (actualIntent.intent.schemaVersion !== 2 || stored.review.schemaVersion !== 2 || actualIntent.checksum !== sealed.checksum
    || stored.review.id !== intent.id || stored.review.definitionId !== intent.definitionId) changed();
  const { cohort, summary, ...reviewIntent } = stored.review; void cohort; void summary;
  if (checksum(reviewIntent) !== sealed.checksum) changed();
  return { intent, stored: { review: stored.review, checksum: stored.checksum } };
}

/** Actual immutable tenant versions, independent of today's active pointer and
 * draft. Supports rule removal to schema1 without changing the review protocol. */
export async function inspectRequiredFieldMigrationVersions(tx: Prisma.TransactionClient, intent: RequiredFieldMigrationIntent,
  sourceVersionId: string, targetVersionId: string, targetVersionNumber: number, publisherUserId: string) {
  const select = { ...versionSelect, schemaVersion: true, createdBy: true } as const;
  const source = await tx.studioDefinitionVersion.findFirst({ where: { id: sourceVersionId, definitionId: intent.definitionId, organisationId: intent.organisationId }, select });
  const target = await tx.studioDefinitionVersion.findFirst({ where: { id: targetVersionId, definitionId: intent.definitionId, organisationId: intent.organisationId }, select });
  if (!source || source.id !== intent.source.versionId || source.organisationId !== intent.organisationId || source.definitionId !== intent.definitionId
    || source.schemaVersion !== intent.source.payload.schemaVersion || source.checksum !== intent.source.versionChecksum
    || checksum(source.compiledPlan) !== source.checksum || canonicalJson(source.payload) !== canonicalJson(intent.source.payload)
    || !target || target.id !== targetVersionId || target.organisationId !== intent.organisationId || target.definitionId !== intent.definitionId
    || target.schemaVersion !== intent.target.payload.schemaVersion || target.createdBy !== publisherUserId
    || target.version !== targetVersionNumber || target.checksum !== intent.target.compiledChecksum
    || checksum(target.compiledPlan) !== target.checksum || canonicalJson(target.payload) !== canonicalJson(intent.target.payload)) changed();
  return { source, target };
}

/** Separate actual conditional post-cutover identity, never a fabricated
 * source-active stage or a permission grant. Legacy entry stays closed1. */
export async function inspectRequiredFieldMigrationCutoverIdentity(tx: Prisma.TransactionClient, serverIntent: RequiredFieldMigrationIntent) {
  const { intent, stored } = await inspectRequiredFieldMigrationStoredIdentity(tx, serverIntent);
  const scope = { preparationId: intent.id, organisationId: intent.organisationId, definitionId: intent.definitionId };
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${intent.organisationId} FOR UPDATE`;
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_executions WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${intent.organisationId} FOR UPDATE`;
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_cutovers WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${intent.organisationId} FOR SHARE`;
  await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
    WHERE d.id=${intent.definitionId}::uuid AND d."organisationId"=${intent.organisationId} FOR SHARE OF d,draft`;
  const publication = await tx.studioFieldMigrationPublication.findFirst({ where: scope });
  const existing = await tx.studioFieldMigrationExecution.findFirst({ where: scope });
  const receipt = await tx.studioFieldMigrationCutover.findFirst({ where: scope,
    select: { preparationId: true, organisationId: true, definitionId: true, sourceVersionId: true, targetVersionId: true, pin: true, pinChecksum: true, state: true, revision: true, createdBy: true } });
  const definition = await tx.studioDefinition.findFirst({ where: { id: intent.definitionId, organisationId: intent.organisationId },
    select: { id: true, organisationId: true, kind: true, activeVersionId: true, revision: true, latestVersion: true, retiredAt: true } });
  if (!publication || !existing || !receipt || !definition) changed();
  const executionPin = fieldMigrationExecutionPinSchema.parse(existing.pin);
  const publicationIdentity = Object.fromEntries(Object.keys(executionPin.publication).map(key => [key, publication[key as keyof typeof executionPin.publication]]));
  const pinned = readRequiredFieldMigrationCutoverReceipt(stored, { preparationId: existing.preparationId, organisationId: existing.organisationId, definitionId: existing.definitionId,
    entityId: existing.entityId, pin: existing.pin, pinChecksum: existing.pinChecksum, state: existing.state, revision: existing.revision, cursor: existing.cursor,
    processedCount: existing.processedCount, failureCode: existing.failureCode }, { ...publicationIdentity, state: publication.state, revision: publication.revision }, definition, receipt);
  const draft = await tx.studioDraft.findFirst({ where: { id: intent.target.draftId, definitionId: intent.definitionId, organisationId: intent.organisationId },
    select: { revision: true, baseVersionId: true, payload: true } });
  if (!draft || draft.revision !== intent.target.draftRevision + 1 || draft.baseVersionId !== receipt.targetVersionId || canonicalJson(draft.payload) !== canonicalJson(intent.target.payload)) changed();
  const versions = await inspectRequiredFieldMigrationVersions(tx, intent, receipt.sourceVersionId, receipt.targetVersionId, publication.targetVersionNumber, publication.publisherUserId);
  const rows = await tx.$queryRaw<Array<{ fresh: boolean }>>`SELECT atlas_studio_execution_source_fresh(pub) AND atlas_studio_execution_targets_fresh(pub) AS fresh
    FROM studio_field_migration_publications pub WHERE pub."preparationId"=${intent.id}::uuid AND pub."organisationId"=${intent.organisationId}
      AND pub."definitionId"=${intent.definitionId}::uuid AND pub.state='CUTOVER'`;
  if (rows.length !== 1 || rows[0].fresh !== true) changed();
  return { intent, stored, publication, existing, receipt, definition, ...versions, executionPin, ...pinned };
}
