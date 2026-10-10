import { z } from "zod";
import { canonicalJson, checksum } from "../../registry/contracts";
import { FieldMigrationReviewError, readSealedFieldMigrationReview } from "./contracts";
import { fieldMigrationExecutionPinSchema, readFieldMigrationExecutionProgress } from "./execution-contract";
import { fieldMigrationCutoverPinSchema } from "./cutover-contract";
import { assertFieldMigrationPublicationReady } from "./publication-contract";

const revision = z.number().int().nonnegative().max(2147483647);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const publicationIdentity = fieldMigrationExecutionPinSchema.shape.publication;
const publicationSchema = z.strictObject({ ...publicationIdentity.shape, state: z.literal("CUTOVER"), revision });
const executionSchema = z.strictObject({ preparationId: z.uuid(), organisationId: z.string(), definitionId: z.uuid(), entityId: z.string(),
  pin: fieldMigrationExecutionPinSchema, pinChecksum: digest, state: z.literal("READY"), revision,
  cursor: z.string().nullable(), processedCount: revision, failureCode: z.null() });
const definitionSchema = z.strictObject({ id: z.uuid(), organisationId: z.string(), kind: z.literal("customField"),
  activeVersionId: z.uuid(), revision, latestVersion: revision.min(1), retiredAt: z.null() });
const receiptSchema = z.strictObject({ preparationId: z.uuid(), organisationId: z.string(), definitionId: z.uuid(), sourceVersionId: z.uuid(),
  targetVersionId: z.uuid(), pin: fieldMigrationCutoverPinSchema, pinChecksum: digest, state: z.literal("ACTIVATED"), revision: z.literal(0), createdBy: z.string() });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function canonical<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.parse(input);
  if (canonicalJson(result) !== canonicalJson(input)) changed();
  return result;
}

/** Validate actual post-cutover identity without simulating a source-active
 * definition/publication. Integrity only: callers still refresh authority and
 * inspect native/private/current/written/reference/source/target coverage.
 * Accepts server-selected closed projections, never a client receipt or stage. */
export function readFieldMigrationCutoverReceipt(storedReview: unknown, serverExecution: unknown, serverPublication: unknown,
  serverDefinition: unknown, serverReceipt: unknown) {
  const stored = readSealedFieldMigrationReview(storedReview), review = stored.review;
  const receipt = canonical(receiptSchema, serverReceipt), pin = receipt.pin;
  const execution = canonical(executionSchema, serverExecution), publication = canonical(publicationSchema, serverPublication);
  const definition = canonical(definitionSchema, serverDefinition);
  const identity = publicationIdentity.parse(Object.fromEntries(Object.entries(publication).filter(([key]) => key !== "state" && key !== "revision")));
  if (receipt.pinChecksum !== checksum(pin) || execution.pinChecksum !== checksum(execution.pin)
    || canonicalJson(identity) !== canonicalJson(execution.pin.publication)
    || canonicalJson({ ...identity, revision: pin.publication.revision }) !== canonicalJson(pin.publication)
    || receipt.preparationId !== review.id || receipt.organisationId !== review.organisationId || receipt.definitionId !== review.definitionId
    || execution.preparationId !== review.id || execution.organisationId !== review.organisationId || execution.definitionId !== review.definitionId
    || publication.preparationId !== review.id || publication.organisationId !== review.organisationId || publication.definitionId !== review.definitionId
    || definition.id !== review.definitionId || definition.organisationId !== review.organisationId
    || receipt.createdBy !== review.principal.userId || publication.publisherUserId !== review.principal.userId || publication.reviewChecksum !== stored.checksum
    || execution.entityId !== review.target.payload.entity.id || canonicalJson(execution.pin.entity) !== canonicalJson(review.target.payload.entity)
    || canonicalJson(execution.pin.cohort) !== canonicalJson(review.cohort)
    || pin.execution.checksum !== execution.pinChecksum || pin.execution.revision !== execution.revision
    || receipt.sourceVersionId !== review.source.versionId || pin.source.versionId !== review.source.versionId
    || execution.pin.sourceVersionId !== review.source.versionId || pin.source.checksum !== review.source.versionChecksum
    || execution.pin.sourceChecksum !== review.source.versionChecksum || receipt.targetVersionId !== publication.targetVersionId
    || receipt.targetVersionId === receipt.sourceVersionId || publication.sourceGenerationId !== review.source.payload.storageGeneration
    || publication.targetGenerationId !== review.target.payload.storageGeneration || publication.targetChecksum !== review.target.compiledChecksum
    || definition.activeVersionId !== receipt.targetVersionId || definition.latestVersion !== publication.targetVersionNumber
    || pin.definitionRevision !== review.definitionRevision + 1 || definition.revision !== pin.definitionRevision + 1
    || publication.revision !== pin.publication.revision + 1) changed();
  assertFieldMigrationPublicationReady(review, publication.acknowledgedLoss);
  readFieldMigrationExecutionProgress(execution.pin, { state: execution.state, revision: execution.revision, cursor: execution.cursor,
    processedCount: execution.processedCount, failureCode: execution.failureCode });
  return { pin, checksum: receipt.pinChecksum };
}
