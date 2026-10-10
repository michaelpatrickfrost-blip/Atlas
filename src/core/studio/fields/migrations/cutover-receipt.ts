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

/** Shared original lineage only. It describes immutable history, without a
 * current pointer or a fabricated transition state. Callers separately validate
 * actual ACT/terminal pairing and current native/field/reference authority. */
export function readFieldMigrationCutoverIdentity(storedReview: unknown, serverExecution: unknown, serverPublication: unknown, serverReceipt: unknown) {
  const stored = readSealedFieldMigrationReview(storedReview), review = stored.review;
  const receipt = canonical(receiptSchema.omit({ state: true, revision: true }), serverReceipt), pin = receipt.pin;
  const execution = canonical(executionSchema, serverExecution), publication = canonical(publicationIdentity, serverPublication);
  const identity = publication;
  if (receipt.pinChecksum !== checksum(pin) || execution.pinChecksum !== checksum(execution.pin)
    || canonicalJson(identity) !== canonicalJson(execution.pin.publication)
    || canonicalJson({ ...identity, revision: pin.publication.revision }) !== canonicalJson(pin.publication)
    || receipt.preparationId !== review.id || receipt.organisationId !== review.organisationId || receipt.definitionId !== review.definitionId
    || execution.preparationId !== review.id || execution.organisationId !== review.organisationId || execution.definitionId !== review.definitionId
    || publication.preparationId !== review.id || publication.organisationId !== review.organisationId || publication.definitionId !== review.definitionId
    || receipt.createdBy !== review.principal.userId || publication.publisherUserId !== review.principal.userId || publication.reviewChecksum !== stored.checksum
    || execution.entityId !== review.target.payload.entity.id || canonicalJson(execution.pin.entity) !== canonicalJson(review.target.payload.entity)
    || canonicalJson(execution.pin.cohort) !== canonicalJson(review.cohort)
    || pin.execution.checksum !== execution.pinChecksum || pin.execution.revision !== execution.revision
    || receipt.sourceVersionId !== review.source.versionId || pin.source.versionId !== review.source.versionId
    || execution.pin.sourceVersionId !== review.source.versionId || pin.source.checksum !== review.source.versionChecksum
    || execution.pin.sourceChecksum !== review.source.versionChecksum || receipt.targetVersionId !== publication.targetVersionId
    || receipt.targetVersionId === receipt.sourceVersionId || publication.sourceGenerationId !== review.source.payload.storageGeneration
    || publication.targetGenerationId !== review.target.payload.storageGeneration || publication.targetChecksum !== review.target.compiledChecksum
    || pin.definitionRevision !== review.definitionRevision + 1) changed();
  assertFieldMigrationPublicationReady(review, publication.acknowledgedLoss);
  readFieldMigrationExecutionProgress(execution.pin, { state: execution.state, revision: execution.revision, cursor: execution.cursor,
    processedCount: execution.processedCount, failureCode: execution.failureCode });
  return { pin, checksum: receipt.pinChecksum };
}

/** Existing strict post-cutover window. Historical identity never substitutes
 * for ACT/CUTOVER, exact target pointer/configuration or current data coverage. */
export function readFieldMigrationCutoverReceipt(storedReview: unknown, serverExecution: unknown, serverPublication: unknown,
  serverDefinition: unknown, serverReceipt: unknown) {
  const receipt = canonical(receiptSchema, serverReceipt), publication = canonical(publicationSchema, serverPublication);
  const definition = canonical(definitionSchema, serverDefinition);
  const identity = publicationIdentity.parse(Object.fromEntries(Object.entries(publication).filter(([key]) => key !== "state" && key !== "revision")));
  const original = receiptSchema.omit({ state: true, revision: true }).parse(Object.fromEntries(Object.entries(receipt).filter(([key]) => key !== "state" && key !== "revision")));
  const retained = readFieldMigrationCutoverIdentity(storedReview, serverExecution, identity, original);
  if (definition.id !== receipt.definitionId || definition.organisationId !== receipt.organisationId
    || definition.activeVersionId !== receipt.targetVersionId || definition.latestVersion !== publication.targetVersionNumber
    || definition.revision !== retained.pin.definitionRevision + 1 || publication.revision !== retained.pin.publication.revision + 1) changed();
  return retained;
}
