import { z } from "zod";
import { recordAnchorSchema } from "../registry/entities";
import { fieldFormValueSchema } from "./form-packet";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
/** Cursor advances SCANNED accessible native records, not matched result count.
 * Empty records with next is valid. No total or private cohort count is exposed. */
export const fieldSearchWindowSchema = z.strictObject({ after: recordId.optional(), limit: z.number().int().min(1).max(50).default(25) });
export const fieldSearchWindowResultSchema = z.strictObject({ records: z.array(recordAnchorSchema).max(50), next: recordId.nullable() });
export const fieldSearchFilterSchema = z.discriminatedUnion("operator", [
  z.strictObject({ operator: z.literal("equals"), value: fieldFormValueSchema.nullable() }),
  z.strictObject({ operator: z.enum(["gte", "lte"]), value: fieldFormValueSchema }),
]);
export const fieldSearchRequestSchema = z.strictObject({ definitionId: z.uuid(), definitionRevision: z.number().int().nonnegative().max(2147483646),
  versionId: z.uuid(), generationId: z.uuid(), filter: fieldSearchFilterSchema,
  cursor: z.strictObject({ after: recordId, checksum: hash }).optional(), limit: z.number().int().min(1).max(50).default(25) });
export type FieldSearchRequest = z.infer<typeof fieldSearchRequestSchema>;
export type FieldSearchResult = { records: z.infer<typeof recordAnchorSchema>[]; next: { after: string; checksum: string } | null };
