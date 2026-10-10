import { Prisma, type StudioFieldValue } from "@/generated/prisma/client";
import type { FieldValue } from "./schema";
import { validateFieldConstraints, validateFieldValue } from "./validation";
import { checksum } from "../registry/contracts";

const columns = ["textValue", "integerValue", "decimalValue", "currency", "booleanValue", "dateValue", "instantValue", "jsonValue", "referenceValue"] as const;
export type StoredFieldValue = Pick<StudioFieldValue, "valueType" | "isNull" | typeof columns[number]>;
export type EncodedFieldValue = StoredFieldValue & { fingerprint: string };
function invalid(): never { throw new Error("FIELD_STORAGE_INVALID: stored value does not match its written schema."); }

/** Pure columns only, never record or reference authority. JSON null here means
 * database NULL; the persistence boundary must map it to Prisma.DbNull. */
function encodeValidatedValue(valueType: string, value: FieldValue | null): EncodedFieldValue {
  const row: EncodedFieldValue = { valueType, isNull: value === null, textValue: null, integerValue: null,
    decimalValue: null, currency: null, booleanValue: null, dateValue: null, instantValue: null,
    jsonValue: null, referenceValue: null, fingerprint: checksum(value) };
  if (value === null) return row;
  switch (value.type) {
    case "string": case "email": case "url": case "phone": case "enum": row.textValue = value.value; break;
    case "integer": case "duration": row.integerValue = BigInt(value.value); break;
    case "decimal": row.decimalValue = new Prisma.Decimal(value.value); break;
    case "money": row.decimalValue = new Prisma.Decimal(value.value.amount); row.currency = value.value.currency; break;
    case "boolean": row.booleanValue = value.value; break;
    case "date": row.dateValue = new Date(`${value.value}T00:00:00.000Z`); break;
    case "datetime": row.instantValue = new Date(value.value); break;
    case "reference": row.referenceValue = value.value; break;
    case "multi_enum": case "address": row.jsonValue = value.value; break;
  }
  return row;
}

/** Ordinary saves use current choices and constraints. No coercion, inferred
 * currency, rounding, database operation or access grant. */
export function encodeFieldValue(schema: unknown, raw: unknown): EncodedFieldValue {
  const field = validateFieldConstraints(schema);
  return encodeValidatedValue(field.storage.type, validateFieldValue(field, raw));
}

/** Internal representation path for an already owner/policy-approved converter
 * result. Retained retired IDs do not become eligible for ordinary selection.
 * The caller still proves the source observation, conversion and target rights. */
export function encodeFieldRepresentation(schema: unknown, approvedValue: FieldValue | null): EncodedFieldValue {
  const field = validateFieldConstraints(schema), storage = field.storage;
  if (approvedValue !== null && approvedValue.type !== storage.type) invalid();
  const retained = storage.type === "enum" || storage.type === "multi_enum"
    ? { ...field, storage: { ...storage, options: storage.options.map(option => ({ ...option, retired: false })) } } : field;
  const checked = validateFieldValue(retained, approvedValue?.value ?? null);
  // A caller cannot turn a non-null blank or noncanonical typed result into a
  // different persisted value/fingerprint under the reviewed operation.
  if (checksum(checked) !== checksum(approvedValue)) invalid();
  return encodeValidatedValue(storage.type, checked);
}

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
