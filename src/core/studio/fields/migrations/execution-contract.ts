import { z } from "zod";
import { referenceSchema } from "../../compiler/kernel";
import { canonicalJson, checksum } from "../../registry/contracts";
import { entityDetailsSchema } from "../../registry/entities";
import type { ContractMetadata } from "../../registry/types";
import { FieldMigrationReviewError, fieldMigrationObservationSchema, readSealedFieldMigrationReview } from "./contracts";
import { reviewedFieldPublicationPin } from "./publication-contract";

const digest = z.string().regex(/^[a-f0-9]{64}$/), count = z.number().int().nonnegative().max(2147483647);
const recordId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const publicationPinSchema = z.strictObject({ preparationId: z.uuid(), organisationId: z.string().min(1).max(100), definitionId: z.uuid(),
  reviewChecksum: digest, sourceGenerationId: z.uuid(), targetGenerationId: z.uuid(), targetVersionId: z.uuid(),
  targetVersionNumber: count.min(1), targetChecksum: digest, publisherUserId: z.string().min(1).max(100), acknowledgedLoss: z.boolean() });
export const fieldMigrationExecutionPinSchema = z.strictObject({ schemaVersion: z.literal(1), publication: publicationPinSchema,
  sourceVersionId: z.uuid(), sourceChecksum: digest, entity: referenceSchema, ownerApproval: referenceSchema,
  cohort: z.strictObject({ recordCount: count, observationDigest: digest }) });
export type FieldMigrationExecutionPin = z.infer<typeof fieldMigrationExecutionPinSchema>;
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function canonical<T>(schema: z.ZodType<T>, input: unknown): T {
  const value = schema.parse(input); if (canonicalJson(value) !== canonicalJson(input)) changed(); return value;
}

/** Pure integrity only. Caller resolves both owner descriptors under refreshed
 * authority and proves current source/native coverage before any persistence. */
export function createFieldMigrationExecutionPin(storedReview: unknown, serverTarget: unknown, serverPublication: unknown,
  serverOwner: ContractMetadata, serverApproval: ContractMetadata): { pin: FieldMigrationExecutionPin; checksum: string } {
  const { review } = readSealedFieldMigrationReview(storedReview), publication = canonical(publicationPinSchema, serverPublication);
  const expected = reviewedFieldPublicationPin(storedReview, serverTarget, publication.publisherUserId, publication.acknowledgedLoss);
  if (canonicalJson(expected) !== canonicalJson(publication)) changed();
  const details = entityDetailsSchema.parse(serverOwner.details), representation = details.record?.migrationRepresentation;
  const target = review.target.payload.entity;
  if (serverOwner.kind !== "entity" || serverOwner.id !== target.id || serverOwner.version !== target.version
    || serverOwner.schemaHash !== target.schemaHash || serverOwner.contractHash !== target.contractHash
    || checksum(details) !== serverOwner.schemaHash || !representation
    || !representation.sourceVersions.includes(review.source.payload.entity.version)
    || serverApproval.ownerModuleId !== serverOwner.ownerModuleId || serverApproval.kind !== "query"
    || serverApproval.id !== representation.query.id || serverApproval.version !== representation.query.version
    || serverApproval.capability !== details.record!.writeCapability || serverApproval.details.transaction !== "required") changed();
  const pin = fieldMigrationExecutionPinSchema.parse({ schemaVersion: 1, publication, sourceVersionId: review.source.versionId,
    sourceChecksum: review.source.versionChecksum, entity: target,
    ownerApproval: { id: serverApproval.id, version: serverApproval.version, schemaHash: serverApproval.schemaHash, contractHash: serverApproval.contractHash },
    cohort: review.cohort });
  return { pin, checksum: checksum(pin) };
}

const storedObservationSchema = z.strictObject({ id: z.uuid(), preparationId: z.uuid(), organisationId: z.string().min(1).max(100),
  definitionId: z.uuid(), entityId: z.string(), sourceGenerationId: z.uuid(), recordId, nativeRevision: count.min(1),
  observation: fieldMigrationObservationSchema });
export const fieldMigrationOutcomePinSchema = z.strictObject({ schemaVersion: z.literal(1), executionChecksum: digest,
  preparationId: z.uuid(), organisationId: z.string().min(1).max(100), definitionId: z.uuid(), entityId: z.string(),
  sourceGenerationId: z.uuid(), targetGenerationId: z.uuid(), targetVersionId: z.uuid(),
  observationId: z.uuid(), observationChecksum: digest, recordId, nativeRevision: count.min(1),
  target: z.strictObject({ extensionId: z.uuid(), extensionRevision: count.min(1), slotId: z.uuid(), valueId: z.uuid(),
    valueRevision: z.literal(1), fingerprint: digest, isNull: z.boolean() }) });
export type FieldMigrationOutcomePin = z.infer<typeof fieldMigrationOutcomePinSchema>;

/** Closed success lineage, not a write grant. Target value/slot/outcome and Audit
 * must commit together. Actual owner/access/source checks are mandatory first. */
export function createFieldMigrationOutcomePin(serverExecution: unknown, serverObservation: unknown, serverTargetIds: unknown): FieldMigrationOutcomePin {
  const pin = canonical(fieldMigrationExecutionPinSchema, serverExecution), observation = canonical(storedObservationSchema, serverObservation);
  const ids = z.strictObject({ extensionId: z.uuid(), slotId: z.uuid(), valueId: z.uuid() }).parse(serverTargetIds);
  const publication = pin.publication, body = observation.observation;
  if (observation.preparationId !== publication.preparationId || observation.organisationId !== publication.organisationId
    || observation.definitionId !== publication.definitionId || observation.entityId !== pin.entity.id
    || observation.sourceGenerationId !== publication.sourceGenerationId || observation.recordId !== body.recordId
    || observation.nativeRevision !== body.nativeRevision || body.result.kind !== "valid"
    || (body.extension && (ids.extensionId !== body.extension.id || body.extension.revision >= 2147483647))
    || ids.slotId === body.extension?.slot?.id || ids.valueId === body.extension?.slot?.value?.id) changed();
  return fieldMigrationOutcomePinSchema.parse({ schemaVersion: 1, executionChecksum: checksum(pin),
    preparationId: publication.preparationId, organisationId: publication.organisationId, definitionId: publication.definitionId,
    entityId: pin.entity.id, sourceGenerationId: publication.sourceGenerationId, targetGenerationId: publication.targetGenerationId,
    targetVersionId: publication.targetVersionId, observationId: observation.id, observationChecksum: checksum(body),
    recordId: body.recordId, nativeRevision: body.nativeRevision,
    target: { ...ids, extensionRevision: (body.extension?.revision ?? 0) + 1, valueRevision: 1,
      fingerprint: body.result.targetFingerprint, isNull: body.result.isNull } });
}

export const fieldMigrationExecutionBatchSchema = z.strictObject({ preparationId: z.uuid(), revision: count.max(2147483646),
  limit: z.number().int().min(1).max(50).default(25) });
export const fieldMigrationExecutionFailureSchema = z.enum(["REVIEW_CHANGED", "ACCESS_CHANGED", "INTEGRITY_CHANGED", "WRITE_FAILED"]);
const progressSchema = z.strictObject({ state: z.enum(["RUNNING", "READY", "FAILED", "CANCELLED"]), revision: count,
  cursor: recordId.nullable(), processedCount: count, failureCode: fieldMigrationExecutionFailureSchema.nullable() });
export type FieldMigrationExecutionProgress = z.infer<typeof progressSchema>;
/** Counts/progress remain private until current owner/field authority is checked. */
export function readFieldMigrationExecutionProgress(serverPin: unknown, input: unknown): FieldMigrationExecutionProgress {
  const pin = canonical(fieldMigrationExecutionPinSchema, serverPin), progress = canonical(progressSchema, input);
  if (progress.processedCount > pin.cohort.recordCount || (progress.processedCount === 0) !== (progress.cursor === null)
    || (progress.state === "READY" && progress.processedCount !== pin.cohort.recordCount)
    || (progress.state === "FAILED") !== (progress.failureCode !== null)
    || (progress.revision === 0 && (progress.state !== "RUNNING" || progress.processedCount !== 0))) changed();
  return progress;
}
