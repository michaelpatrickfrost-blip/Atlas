import { z } from "zod";
import { friendlyFieldConversionSchema } from "./field-evolution-contract";
const uuid = z.uuid().transform(value => value.toLowerCase());
const revision = z.number().int().nonnegative().max(2147483646);
const savedRevision = z.number().int().nonnegative().max(2147483647);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const prepareAdditionalFieldMigrationSchema = z.strictObject({ operationId: uuid, definitionId: uuid,
  definitionRevision: revision, draftRevision: revision, sourceVersionId: uuid, conversion: friendlyFieldConversionSchema });
const scope = { definitionId: uuid, preparationId: uuid, revision };
export const collectAdditionalFieldMigrationSchema = z.strictObject({ ...scope, expectedState: z.literal("PREPARING"),
  limit: z.number().int().min(1).max(50).default(25) });
export const sealAdditionalFieldMigrationSchema = z.strictObject({ ...scope, expectedState: z.enum(["PREPARING", "REVIEWED"]) });
export const additionalFieldMigrationPreparedSchema = z.strictObject({ preparationId: uuid, revision: savedRevision,
  state: z.enum(["PREPARING", "REVIEWED"]) });
export const additionalFieldMigrationCollectedSchema = z.strictObject({ preparationId: uuid, revision: savedRevision,
  state: z.literal("PREPARING"), replayed: z.boolean(), appended: z.number().int().min(0).max(50), cursorExhausted: z.boolean().nullable() });
export const additionalFieldMigrationSealedSchema = z.strictObject({ preparationId: uuid, revision: savedRevision, state: z.literal("REVIEWED"),
  reviewChecksum: z.string().regex(/^[a-f0-9]{64}$/), affectedCount: count, valid: count, invalid: count, lossy: count,
  indexImpact: z.array(z.string().max(500)).max(10), rollbackLimit: z.literal("reverse_review_after_target_writes"), replayed: z.boolean() });
export type AdditionalFieldMigrationPrepared = z.infer<typeof additionalFieldMigrationPreparedSchema>;
export type AdditionalFieldMigrationCollected = z.infer<typeof additionalFieldMigrationCollectedSchema>;
export type AdditionalFieldMigrationSealed = z.infer<typeof additionalFieldMigrationSealedSchema>;
