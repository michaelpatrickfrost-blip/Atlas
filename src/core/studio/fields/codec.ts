import type { StudioFieldValue } from "@/generated/prisma/client";
import type { FieldValue } from "./schema";
import { validateFieldConstraints, validateFieldValue } from "./validation";

const columns = ["textValue", "integerValue", "decimalValue", "currency", "booleanValue", "dateValue", "instantValue", "jsonValue", "referenceValue"] as const;
export type StoredFieldValue = Pick<StudioFieldValue, "valueType" | "isNull" | typeof columns[number]>;
function invalid(): never { throw new Error("FIELD_STORAGE_INVALID: stored value does not match its written schema."); }

/** Pure decoding only. Callers must authorise native record, both field policies and references. */
export function decodeStoredFieldValue(schema: unknown, row: StoredFieldValue): FieldValue | null {
  try {
    const field = validateFieldConstraints(schema), storage = field.storage;
    if (row.valueType !== storage.type || typeof row.isNull !== "boolean") invalid();
    const present = columns.filter(column => row[column] !== null);
    if (row.isNull) {
      if (present.length) invalid();
      return validateFieldValue(field, null);
    }
    let raw: unknown;
    let expected: readonly typeof columns[number][];
    switch (storage.type) {
      case "string": case "email": case "phone": case "url": case "enum":
        expected = ["textValue"]; raw = row.textValue; break;
      case "integer": case "duration":
        expected = ["integerValue"];
        if (typeof row.integerValue !== "bigint" || row.integerValue > BigInt(Number.MAX_SAFE_INTEGER) || row.integerValue < BigInt(-Number.MAX_SAFE_INTEGER)) invalid();
        raw = Number(row.integerValue); break;
      case "decimal":
        expected = ["decimalValue"]; raw = row.decimalValue?.toFixed(); break;
      case "money":
        expected = ["decimalValue", "currency"]; raw = { amount: row.decimalValue?.toFixed(), currency: row.currency }; break;
      case "boolean":
        expected = ["booleanValue"]; raw = row.booleanValue; break;
      case "date": {
        expected = ["dateValue"];
        if (!(row.dateValue instanceof Date)) invalid();
        const instant = row.dateValue.toISOString();
        if (!instant.endsWith("T00:00:00.000Z")) invalid();
        raw = instant.slice(0, 10); break;
      }
      case "datetime":
        expected = ["instantValue"];
        if (!(row.instantValue instanceof Date)) invalid();
        raw = row.instantValue.toISOString(); break;
      case "multi_enum": case "address":
        expected = ["jsonValue"]; raw = row.jsonValue; break;
      case "reference":
        expected = ["referenceValue"]; raw = row.referenceValue; break;
    }
    if (present.length !== expected.length || expected.some(column => !present.includes(column))) invalid();
    // Retired choices remain valid historical selections; ordinary writes still
    // use the unchanged validator, which rejects selecting retired choices.
    const historical = storage.type === "enum" || storage.type === "multi_enum"
      ? { ...field, storage: { ...storage, options: storage.options.map(option => ({ ...option, retired: false })) } }
      : field;
    const value = validateFieldValue(historical, raw);
    if (value === null) invalid(); // A non-null stored blank must not silently become null.
    return value;
  } catch { invalid(); } // Do not expose persisted values or validation internals in errors.
}
