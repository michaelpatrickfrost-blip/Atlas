import { z } from "zod";
import { canonicalJson, checksum } from "../../registry/contracts";
import { FieldMigrationReviewError, readSealedFieldMigrationReview } from "./contracts";
import { fieldMigrationExecutionPinSchema, readFieldMigrationExecutionProgress } from "./execution-contract";
import { assertFieldMigrationPublicationReady } from "./publication-contract";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const revision = z.number().int().nonnegative().max(2147483647);
// Leave capacity for the activation and a subsequent guarded rollback.
const transitionRevision = revision.max(2147483645);
const publicationSchema = fieldMigrationExecutionPinSchema.shape.publication;
const publishedSchema = z.strictObject({ ...publicationSchema.shape, state: z.literal("PUBLISHED"), revision: transitionRevision });
const definitionSchema = z.strictObject({ id: z.uuid(), organisationId: z.string().min(1).max(100), kind: z.literal("customField"),
  activeVersionId: z.uuid(), revision: transitionRevision, latestVersion: revision.min(1), retiredAt: z.null() });
const executionSchema = z.strictObject({ preparationId: z.uuid(), organisationId: z.string().min(1).max(100), definitionId: z.uuid(), entityId: z.string(),
  pin: fieldMigrationExecutionPinSchema, pinChecksum: digest, state: z.literal("READY"), revision,
  cursor: z.string().nullable(), processedCount: revision, failureCode: z.null() });

/** Integrity identity only. Rollback requires unchanged native/source/target
 * coverage and current access; this policy never promises reverse conversion. */
export const fieldMigrationCutoverPinSchema = z.strictObject({ schemaVersion: z.literal(1),
  publication: z.strictObject({ ...publicationSchema.shape, revision: transitionRevision }),
  execution: z.strictObject({ checksum: digest, revision }),
  source: z.strictObject({ versionId: z.uuid(), checksum: digest }),
  definitionRevision: transitionRevision, rollbackPolicy: z.literal("unchanged_reviewed_representation") });
export type FieldMigrationCutoverPin = z.infer<typeof fieldMigrationCutoverPinSchema>;

/** An explicit confirmation of server state, without tenant, target IDs, grants,
 * stage or a caller-supplied pin. Services must refresh authority before use. */
export const fieldMigrationCutoverRequestSchema = z.strictObject({ preparationId: z.uuid(), reviewChecksum: digest,
  definitionRevision: transitionRevision, publicationRevision: transitionRevision, executionRevision: revision });

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function canonical<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.parse(input);
  if (canonicalJson(result) !== canonicalJson(input)) changed();
  return result;
}

/** Pure pre-cutover pin, not readiness/coverage/permission authority. Caller must
 * reload the exact tenant rows, inspect the execution under current native and
 * field/reference authority, and atomically activate with a retained receipt and
 * Audit. No source/target value, native record or active pointer changes here. */
export function createFieldMigrationCutoverPin(storedReview: unknown, serverExecution: unknown, serverPublication: unknown, serverDefinition: unknown)
  : { pin: FieldMigrationCutoverPin; checksum: string } {
  const sealed = readSealedFieldMigrationReview(storedReview), review = sealed.review;
  const execution = canonical(executionSchema, serverExecution), publication = canonical(publishedSchema, serverPublication);
  const definition = canonical(definitionSchema, serverDefinition), pinned = execution.pin;
  if (execution.pinChecksum !== checksum(pinned)
    || execution.preparationId !== review.id || execution.organisationId !== review.organisationId || execution.definitionId !== review.definitionId
    || execution.entityId !== review.target.payload.entity.id
    || canonicalJson(pinned.publication) !== canonicalJson(publicationSchema.parse(Object.fromEntries(Object.entries(publication).filter(([key]) => key !== "state" && key !== "revision"))))
    || publication.preparationId !== review.id || publication.organisationId !== review.organisationId || publication.definitionId !== review.definitionId
    || publication.reviewChecksum !== sealed.checksum || publication.publisherUserId !== review.principal.userId
    || publication.sourceGenerationId !== review.source.payload.storageGeneration || publication.targetGenerationId !== review.target.payload.storageGeneration
    || publication.targetChecksum !== review.target.compiledChecksum || publication.targetVersionId === review.source.versionId
    || pinned.sourceVersionId !== review.source.versionId || pinned.sourceChecksum !== review.source.versionChecksum
    || canonicalJson(pinned.entity) !== canonicalJson(review.target.payload.entity) || canonicalJson(pinned.cohort) !== canonicalJson(review.cohort)
    || definition.id !== review.definitionId || definition.organisationId !== review.organisationId
    || definition.activeVersionId !== review.source.versionId || definition.revision !== review.definitionRevision + 1
    || definition.latestVersion !== publication.targetVersionNumber) changed();
  assertFieldMigrationPublicationReady(review, publication.acknowledgedLoss);
  readFieldMigrationExecutionProgress(pinned, { state: execution.state, revision: execution.revision, cursor: execution.cursor,
    processedCount: execution.processedCount, failureCode: execution.failureCode });
  const pin = fieldMigrationCutoverPinSchema.parse({ schemaVersion: 1, publication: { ...pinned.publication, revision: publication.revision },
    execution: { checksum: execution.pinChecksum, revision: execution.revision },
    source: { versionId: pinned.sourceVersionId, checksum: pinned.sourceChecksum }, definitionRevision: definition.revision,
    rollbackPolicy: "unchanged_reviewed_representation" });
  return { pin, checksum: checksum(pin) };
}
