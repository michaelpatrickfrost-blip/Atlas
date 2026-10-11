import { expect, it } from "vitest";
import { checksum } from "@/core/studio/registry/contracts";
import { customFieldSchema, type FieldValue } from "@/core/studio/fields/schema";
import { encodeFieldValue, encodeFieldRepresentation, decodeStoredFieldValue } from "@/core/studio/fields/codec";
const field = (storage: unknown, extra: Record<string, unknown> = {}) => customFieldSchema.parse({ key: "example", label: "Example", classification: "confidential", storage, ...extra });
const reference = { id: "tickets.ticket", version: 2, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
const cases: Array<[unknown, unknown, FieldValue]> = [
  [{ type: "string" }, "Hello", { type: "string", value: "Hello" }],
  [{ type: "integer" }, Number.MAX_SAFE_INTEGER, { type: "integer", value: Number.MAX_SAFE_INTEGER }],
  [{ type: "decimal", precision: 28, scale: 0 }, "9999999999999999999999999999", { type: "decimal", value: "9999999999999999999999999999" }],
  [{ type: "money", precision: 28, scale: 10, currencies: ["GBP"] }, { amount: "123456789012345678.1234567890", currency: "GBP" }, { type: "money", value: { amount: "123456789012345678.123456789", currency: "GBP" } }],
  [{ type: "boolean" }, false, { type: "boolean", value: false }],
  [{ type: "date" }, "2024-02-29", { type: "date", value: "2024-02-29" }],
  [{ type: "datetime", timezone: "UTC" }, "2024-02-29T11:23:45.678Z", { type: "datetime", value: "2024-02-29T11:23:45.678Z" }],
  [{ type: "duration", unit: "seconds" }, 0, { type: "duration", value: 0 }],
  [{ type: "email" }, "A@example.test", { type: "email", value: "a@example.test" }],
  [{ type: "url" }, "https://example.test", { type: "url", value: "https://example.test/" }],
  [{ type: "phone", format: "E164" }, "+447700900123", { type: "phone", value: "+447700900123" }],
  [{ type: "enum", valueSetVersion: 1, options: [{ id: "yes", label: "Yes" }] }, "yes", { type: "enum", value: "yes" }],
  [{ type: "multi_enum", valueSetVersion: 1, options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] }, ["b", "a"], { type: "multi_enum", value: ["a", "b"] }],
  [{ type: "reference", entity: reference }, "record_123", { type: "reference", value: "record_123" }],
  [{ type: "address", countries: ["GB"] }, { line1: "1 Example Road", city: "Example", country: "GB" }, { type: "address", value: { line1: "1 Example Road", line2: "", city: "Example", region: "", postalCode: "", country: "GB" } }],
];
it("roundtrips all 15 storage families with exact normalized fingerprints and no extra columns", () => {
  for (const [storage, raw, expected] of cases) {
    const schema = field(storage), encoded = encodeFieldValue(schema, raw);
    expect(decodeStoredFieldValue(schema, encoded)).toEqual(expected);
    expect(encoded.fingerprint).toBe(checksum(expected));
    expect(encodeFieldRepresentation(schema, expected)).toEqual(encoded);
  }
  expect(encodeFieldValue(field({ type: "integer" }), Number.MAX_SAFE_INTEGER).integerValue).toBe(9007199254740991n);
  expect(encodeFieldValue(field({ type: "decimal", precision: 28, scale: 0 }), cases[2][1]).decimalValue?.toFixed()).toBe(cases[2][1]);
  expect(encodeFieldValue(field({ type: "date" }), "2024-02-29").dateValue?.toISOString()).toBe("2024-02-29T00:00:00.000Z");
});
it("stores null in empty families, keeps false/zero distinct, and enforces required null in both paths", () => {
  for (const [storage] of cases) {
    const schema = field(storage), encoded = encodeFieldValue(schema, null);
    expect(encoded.isNull).toBe(true); expect(encoded.fingerprint).toBe(checksum(null));
    expect(Object.entries(encoded).filter(([key]) => !["valueType", "isNull", "fingerprint"].includes(key)).every(([, value]) => value === null)).toBe(true);
    expect(encodeFieldRepresentation(schema, null)).toEqual(encoded);
    expect(() => encodeFieldValue(field(storage, { required: true }), null)).toThrow("required");
    expect(() => encodeFieldRepresentation(field(storage, { required: true }), null)).toThrow("required");
  }
  expect(encodeFieldValue(field({ type: "boolean" }), false).isNull).toBe(false);
  expect(encodeFieldValue(field({ type: "integer" }), 0).integerValue).toBe(0n);
});
it("retains known retired choices only on the representation path without mutating normal selection policy", () => {
  for (const type of ["enum", "multi_enum"] as const) {
    const schema = field({ type, valueSetVersion: 2, options: [{ id: "old", label: "Old", retired: true }, { id: "new", label: "New" }] });
    const before = JSON.stringify(schema), raw = type === "enum" ? "old" : ["old"];
    const typed: FieldValue = type === "enum" ? { type, value: "old" } : { type, value: ["old"] };
    expect(() => encodeFieldValue(schema, raw)).toThrow("current allowed");
    expect(decodeStoredFieldValue(schema, encodeFieldRepresentation(schema, typed))).toEqual(typed);
    expect(() => encodeFieldRepresentation(schema, type === "enum" ? { type, value: "unknown" } : { type, value: ["unknown"] })).toThrow();
    expect(JSON.stringify(schema)).toBe(before); expect(() => encodeFieldValue(schema, raw)).toThrow("current allowed");
  }
});
it("rejects coercion, precision loss, inferred currencies, invalid dates and unsafe reference shapes", () => {
  const invalid: Array<[unknown, unknown]> = [
    [{ type: "integer" }, "12"], [{ type: "integer" }, Number.MAX_SAFE_INTEGER + 1],
    [{ type: "boolean" }, "false"], [{ type: "duration", unit: "seconds" }, -1],
    [{ type: "decimal", precision: 6, scale: 2 }, "12.345"],
    [{ type: "money", precision: 6, scale: 2, currencies: ["GBP"] }, { amount: "12.34" }],
    [{ type: "money", precision: 6, scale: 2, currencies: ["GBP"] }, { amount: "12.34", currency: "USD" }],
    [{ type: "date" }, "2023-02-29"], [{ type: "datetime", timezone: "UTC" }, "2024-01-01T12:00:00"],
    [{ type: "reference", entity: reference }, "foreign/unsafe"],
  ];
  for (const [storage, raw] of invalid) expect(() => encodeFieldValue(field(storage), raw)).toThrow();
});
it("rejects wrong or noncanonical typed representation results instead of changing a reviewed fingerprint", () => {
  for (const [storage, value] of [
    [{ type: "string" }, { type: "integer", value: 1 }],
    [{ type: "string" }, { type: "string", value: "" }],
    [{ type: "decimal", precision: 6, scale: 2 }, { type: "decimal", value: "1.00" }],
    [{ type: "email" }, { type: "email", value: "A@example.test" }],
  ] as Array<[unknown, FieldValue]>) expect(() => encodeFieldRepresentation(field(storage), value)).toThrow("FIELD_STORAGE_INVALID");
});
