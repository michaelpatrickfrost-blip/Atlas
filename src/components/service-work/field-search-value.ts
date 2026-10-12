import { fieldFormValueSchema } from "@/core/studio/fields/value-schema";
import { fieldSearchFilterSchema } from "@/core/studio/fields/search-contract";
import type { TicketSearchField } from "@/core/service-work/field-search-contract";

export type SearchDraft = { operator: "equals" | "gte" | "lte" | "null"; text: string; currency: string };
export const supportsSearchRange = (field: TicketSearchField) => ["integer", "decimal", "money", "date", "datetime", "duration"].includes(field.storage.type);
/** Search transport, never field writes. Blank differs from explicit clear/null;
 * zero and false survive parsing. Actual field constraints stay server-owned. */
export function readFieldSearchFilter(field: TicketSearchField, draft: SearchDraft) {
  if (draft.operator === "null") return fieldSearchFilterSchema.parse({ operator: "equals", value: null });
  if (draft.operator !== "equals" && !supportsSearchRange(field)) throw new Error("Choose a comparison supported by this detail.");
  if (!draft.text) throw new Error("Enter a value, or choose Cleared value.");
  const type = field.storage.type;
  if (type === "address" || type === "multi_enum") throw new Error("This detail cannot be searched here.");
  let value: unknown = draft.text;
  if (type === "integer" || type === "duration") value = /^-?\d+$/.test(draft.text) ? Number(draft.text) : NaN;
  if (type === "boolean") value = draft.text === "yes" ? true : draft.text === "no" ? false : undefined;
  if (type === "datetime") value = `${draft.text}Z`;
  if (type === "money") {
    if (!field.storage.currencies.includes(draft.currency)) throw new Error("Choose an available currency.");
    value = { amount: draft.text, currency: draft.currency };
  }
  if (type === "enum" && !field.storage.options.some(option => option.id === draft.text)) throw new Error("Choose an available option.");
  const parsed = fieldFormValueSchema.safeParse({ type, value });
  if (!parsed.success) throw new Error(type === "datetime" ? "Enter a valid date and time in UTC." : "Check the format of the search value.");
  return fieldSearchFilterSchema.parse({ operator: draft.operator, value: parsed.data });
}
