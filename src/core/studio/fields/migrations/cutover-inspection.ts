import type { Prisma } from "@/generated/prisma/client";
import { canonicalJson, checksum } from "../../registry/contracts";
import { FieldMigrationReviewError, sealFieldMigrationIntent, fieldMigrationIntentFromReview, readSealedFieldMigrationReview, type FieldMigrationIntent } from "./contracts";
import { readFieldMigrationCutoverReceipt } from "./cutover-receipt";
import { fieldMigrationExecutionPinSchema } from "./execution-contract";

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
