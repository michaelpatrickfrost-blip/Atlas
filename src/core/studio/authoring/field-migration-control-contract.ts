import { z } from "zod";
const uuid = z.uuid().transform(value => value.toLowerCase());
const revision = z.number().int().nonnegative().max(2147483646);
const savedRevision = z.number().int().nonnegative().max(2147483647);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const identity = { definitionId: uuid, preparationId: uuid };
export const publishAdditionalFieldMigrationSchema = z.strictObject({ ...identity, revision, reviewChecksum: digest,
  acknowledgeWarnings: z.boolean(), acknowledgeLoss: z.boolean() });
export const startAdditionalFieldMigrationExecutionSchema = z.strictObject({ ...identity, publicationRevision: revision, reviewChecksum: digest });
export const executeAdditionalFieldMigrationBatchSchema = z.strictObject({ ...identity, revision, expectedState: z.enum(["RUNNING", "FAILED"]),
  limit: z.number().int().min(1).max(50).default(25) });
export const cutoverAdditionalFieldMigrationSchema = z.strictObject({ ...identity, reviewChecksum: digest,
  definitionRevision: revision, publicationRevision: revision, executionRevision: revision });
export const cancelAdditionalFieldMigrationSchema = z.strictObject({ ...identity, revision });
export const settleAdditionalFieldMigrationSchema = z.strictObject({ ...identity, cutoverChecksum: digest,
  cutoverRevision: z.literal(0), definitionRevision: revision, publicationRevision: revision });
export const readAdditionalFieldMigrationStatusSchema = z.strictObject(identity);
export const readAdditionalFieldMigrationRecoveryStatusSchema = z.strictObject(identity);
/** Metadata-only recovery: never labels, native identities, totals or progress. */
export const additionalFieldMigrationRecoveryStatusSchema = z.strictObject({ ...identity,
  preparationState: z.enum(["PREPARING", "REVIEWED", "CANCELLED"]),
  publicationState: z.enum(["PUBLISHED", "CUTOVER", "CANCELLED", "ROLLED_BACK", "COMPLETED"]).nullable(),
  publicationRevision: savedRevision.nullable(),
}).refine(value => (value.publicationState === null) === (value.publicationRevision === null)
  && (value.publicationState === null || value.preparationState === "REVIEWED"), "Invalid recovery identity");
export type AdditionalFieldMigrationRecoveryStatus = z.infer<typeof additionalFieldMigrationRecoveryStatusSchema>;
const failure = z.enum(["REVIEW_CHANGED", "ACCESS_CHANGED", "INTEGRITY_CHANGED", "WRITE_FAILED"]);
export const additionalFieldMigrationPublishedSchema = z.strictObject({ preparationId: uuid, state: z.literal("PUBLISHED"),
  preparationRevision: savedRevision, publicationRevision: savedRevision, reviewChecksum: digest, replayed: z.boolean() });
export const additionalFieldMigrationExecutedSchema = z.strictObject({ preparationId: uuid, state: z.enum(["RUNNING", "READY", "FAILED", "CANCELLED"]),
  revision: savedRevision, processedCount: count, failureCode: failure.nullable(), replayed: z.boolean(), appended: z.number().int().min(0).max(50) });
export const additionalFieldMigrationCutoverSchema = z.strictObject({ preparationId: uuid, state: z.literal("ACTIVATED"),
  definitionRevision: savedRevision, publicationRevision: savedRevision, executionRevision: savedRevision, reviewChecksum: digest, replayed: z.boolean() });
export const additionalFieldMigrationCancelledSchema = z.strictObject({ preparationId: uuid, revision: savedRevision, state: z.literal("CANCELLED"), replayed: z.boolean() });
export const additionalFieldMigrationSettledSchema = z.strictObject({ preparationId: uuid, state: z.enum(["ROLLED_BACK", "FINALIZED"]),
  settlementChecksum: digest, replayed: z.boolean() });
export const additionalFieldMigrationStatusSchema = z.strictObject({ ...identity,
  preparationState: z.enum(["PREPARING", "REVIEWED", "CANCELLED"]), preparationRevision: savedRevision,
  fieldLabel: z.string().min(1).max(200).nullable(),
  review: z.strictObject({ checksum: digest, affectedCount: count, valid: count, invalid: count, lossy: count }).nullable(),
  publication: z.strictObject({ state: z.enum(["PUBLISHED", "CUTOVER", "CANCELLED", "ROLLED_BACK", "COMPLETED"]), revision: savedRevision }).nullable(),
  execution: z.strictObject({ state: z.enum(["RUNNING", "READY", "FAILED", "CANCELLED"]), revision: savedRevision,
    processedCount: count, affectedCount: count, failureCode: failure.nullable() }).nullable(),
  cutover: z.strictObject({ state: z.enum(["ACTIVATED", "ROLLED_BACK", "FINALIZED"]), revision: z.union([z.literal(0), z.literal(1)]),
    checksum: digest, confirmation: z.strictObject({ cutoverRevision: z.literal(0), definitionRevision: revision, publicationRevision: revision }),
    settlementChecksum: digest.nullable() }).nullable(),
  // Today's pointer is explicitly separate from immutable operation confirmation.
  currentHead: z.strictObject({ definitionRevision: savedRevision, versionLabel: z.string().min(1).max(40) }).nullable(),
});
export type AdditionalFieldMigrationStatus = z.infer<typeof additionalFieldMigrationStatusSchema>;

export type AdditionalFieldMigrationPublished = z.infer<typeof additionalFieldMigrationPublishedSchema>;
export type AdditionalFieldMigrationExecuted = z.infer<typeof additionalFieldMigrationExecutedSchema>;
export type AdditionalFieldMigrationCutover = z.infer<typeof additionalFieldMigrationCutoverSchema>;
export type AdditionalFieldMigrationCancelled = z.infer<typeof additionalFieldMigrationCancelledSchema>;
export type AdditionalFieldMigrationSettled = z.infer<typeof additionalFieldMigrationSettledSchema>;
