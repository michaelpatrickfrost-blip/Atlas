import assert from "node:assert/strict";
import { z } from "zod";
export const fieldSearchIndexColumns = {
  studio_field_fingerprint_idx: "fingerprint", studio_field_integer_idx: "integerValue",
  studio_field_decimal_idx: "decimalValue", studio_field_date_idx: "dateValue",
} as const;
export type FieldSearchIndexName = keyof typeof fieldSearchIndexColumns;
const entry = z.strictObject({ name: z.string(), method: z.literal("btree"), valid: z.literal(true), ready: z.literal(true),
  live: z.literal(true), immediate: z.literal(true), plain: z.literal(true), complete: z.literal(true),
  defaultKeys: z.literal(true), keyCount: z.literal(4), attributeCount: z.literal(4), columns: z.array(z.string()).length(4) });
/** Actual catalogue proof, independent of which competing index a tiny fixture's
 * planner chooses. This does not establish performance on a production workload. */
export function assertFieldSearchIndex(input: unknown, name: FieldSearchIndexName) {
  const [index] = z.array(entry).length(1).parse(input);
  assert.equal(index.name, name);
  assert.deepEqual(index.columns, ["organisationId", "definitionId", "generationId", fieldSearchIndexColumns[name]]);
  return index;
}
