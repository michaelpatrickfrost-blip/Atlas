import { z } from "zod";
import { friendlyFieldConversionSchema } from "./field-evolution-contract";
import { additionalFieldSetupSchema } from "./field-setup-contract";
import { fieldFormValueSchema } from "../fields/value-schema";

const revision = z.number().int().nonnegative().max(2147483646);
const uuid = z.uuid().transform(value => value.toLowerCase());
const cursor = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const page = { cursor: cursor.optional(), limit: z.number().int().min(1).max(50).default(25) };
export const additionalFieldMigrationPreviewRequestSchema = z.strictObject({ definitionId: uuid,
  definitionRevision: revision, draftRevision: revision, sourceVersionId: uuid,
  conversion: friendlyFieldConversionSchema, ...page });
export const additionalFieldMigrationDetailRequestSchema = z.strictObject({ definitionId: uuid, preparationId: uuid, ...page });
const issue = z.enum(["INVALID_SOURCE", "INVALID_TARGET", "UNMAPPED_VALUE", "LOSS_REQUIRES_REVIEW", "FIELD_STORAGE_INVALID"]);
export const fieldMigrationExampleSchema = z.strictObject({ label: z.string().min(1).max(30),
  before: fieldFormValueSchema.nullable(), after: fieldFormValueSchema.nullable(),
  beforeDisplay: z.string().min(1).max(4000), afterDisplay: z.string().min(1).max(4000),
  result: z.enum(["ready", "loss", "invalid"]), issue: issue.nullable() });
export const additionalFieldMigrationPreviewSchema = z.strictObject({ definitionId: uuid, definitionRevision: revision,
  draftRevision: revision, sourceVersionId: uuid, fieldLabel: z.string().min(1).max(200),
  affectedCount: z.number().int().nonnegative(), countsScope: z.literal("this_page"),
  pageCounts: z.strictObject({ valid: revision, invalid: revision, lossy: revision }),
  examples: z.array(fieldMigrationExampleSchema).max(50), nextCursor: cursor.nullable(),
  impact: z.strictObject({ index: z.array(z.string()).max(10), uniquenessCheck: z.boolean(),
    rollbackLimit: z.literal("reverse_review_after_target_writes") }),
  notice: z.literal("Preview only. Collect and seal the complete review before publishing."),
});
export type AdditionalFieldMigrationPreview = z.infer<typeof additionalFieldMigrationPreviewSchema>;
export const additionalFieldMigrationDetailSchema = z.strictObject({ definitionId: uuid, preparationId: uuid,
  revision, state: z.enum(["PREPARING", "REVIEWED", "CANCELLED"]), fieldLabel: z.string().min(1).max(200),
  currentAffectedCount: revision, review: z.strictObject({ checksum: z.string().regex(/^[a-f0-9]{64}$/),
    affectedCount: revision, valid: revision, invalid: revision, lossy: revision }).nullable(),
  rows: z.array(z.strictObject({ label: z.string().min(1).max(30), result: z.enum(["ready", "loss", "invalid"]), issue: issue.nullable() })).max(50),
  nextCursor: cursor.nullable(), countsScope: z.literal("sealed_review_or_unavailable"),
  impact: z.strictObject({ index: z.array(z.string()).max(10), uniquenessCheck: z.boolean(), rollbackLimit: z.literal("reverse_review_after_target_writes") }),
});
export type AdditionalFieldMigrationDetail = z.infer<typeof additionalFieldMigrationDetailSchema>;

const settingsProjection = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("editable"), initial: additionalFieldSetupSchema }),
  z.strictObject({ kind: z.literal("read_only"), reason: z.string().min(1).max(500) }),
]);
export const additionalFieldMigrationSetupRequestSchema = z.strictObject({ definitionId: uuid });
export const additionalFieldMigrationSetupSchema = z.strictObject({ definitionId: uuid, definitionRevision: revision,
  draftRevision: revision, sourceVersionId: uuid, source: settingsProjection, target: settingsProjection,
  sourceChoiceLabels: z.array(z.string().min(1).max(200)).max(200),
  targetChoiceSourceIndexes: z.array(z.number().int().min(0).max(199).nullable()).max(200),
});
export type AdditionalFieldMigrationSetup = z.infer<typeof additionalFieldMigrationSetupSchema>;
