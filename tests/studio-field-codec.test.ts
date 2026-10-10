import { expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { customFieldSchema } from "@/core/studio/fields/schema";
import { validateFieldValue } from "@/core/studio/fields/validation";
import { decodeStoredFieldValue, type StoredFieldValue } from "@/core/studio/fields/codec";
const field = (storage: unknown, extra: Record<string, unknown> = {}) => customFieldSchema.parse({ key: "example", label: "Example", classification: "confidential", storage, ...extra });
const row = (valueType: string, extra: Partial<StoredFieldValue> = {}): StoredFieldValue => ({ valueType, isNull: false,
  textValue: null, integerValue: null, decimalValue: null, currency: null, booleanValue: null, dateValue: null, instantValue: null, jsonValue: null, referenceValue: null, ...extra });
it("preserves all 28 decimal digits and exact allowed-currency money, without number conversion or rounding", () => {
  const decimal = field({ type: "decimal", precision: 28, scale: 0 });
  expect(decodeStoredFieldValue(decimal, row("decimal", { decimalValue: new Prisma.Decimal("9999999999999999999999999999") }))).toEqual({ type: "decimal", value: "9999999999999999999999999999" });
  const money = field({ type: "money", precision: 10, scale: 2, currencies: ["GBP"] });
  expect(decodeStoredFieldValue(money, row("money", { decimalValue: new Prisma.Decimal("0"), currency: "GBP" }))).toEqual({ type: "money", value: { amount: "0", currency: "GBP" } });
  for (const bad of [{ decimalValue: new Prisma.Decimal("12.345"), currency: "GBP" }, { decimalValue: new Prisma.Decimal("12.34"), currency: "USD" }])
    expect(() => decodeStoredFieldValue(money, row("money", bad))).toThrow("FIELD_STORAGE_INVALID");
});
it("distinguishes zero and false from null and enforces safe integer/duration bounds", () => {
  expect(decodeStoredFieldValue(field({ type: "integer" }), row("integer", { integerValue: 0n }))).toEqual({ type: "integer", value: 0 });
  expect(decodeStoredFieldValue(field({ type: "boolean" }), row("boolean", { booleanValue: false }))).toEqual({ type: "boolean", value: false });
  expect(decodeStoredFieldValue(field({ type: "duration", unit: "seconds" }), row("duration", { integerValue: 60n }))).toEqual({ type: "duration", value: 60 });
  expect(() => decodeStoredFieldValue(field({ type: "integer" }), row("integer", { integerValue: 9007199254740992n }))).toThrow("FIELD_STORAGE_INVALID");
  expect(() => decodeStoredFieldValue(field({ type: "duration", unit: "seconds" }), row("duration", { integerValue: -1n }))).toThrow("FIELD_STORAGE_INVALID");
  expect(decodeStoredFieldValue(field({ type: "boolean" }), row("boolean", { isNull: true }))).toBeNull();
  expect(() => decodeStoredFieldValue(field({ type: "boolean" }, { required: true }), row("boolean", { isNull: true }))).toThrow("FIELD_STORAGE_INVALID");
});
it("preserves UTC calendar/instant semantics and rejects invalid/non-midnight calendar representations", () => {
  expect(decodeStoredFieldValue(field({ type: "date" }), row("date", { dateValue: new Date("2024-02-29T00:00:00Z") }))).toEqual({ type: "date", value: "2024-02-29" });
  expect(decodeStoredFieldValue(field({ type: "datetime", timezone: "UTC" }), row("datetime", { instantValue: new Date("2024-02-29T11:23:45.678Z") }))).toEqual({ type: "datetime", value: "2024-02-29T11:23:45.678Z" });
  for (const dateValue of [new Date("invalid"), new Date("2024-02-29T01:00:00Z")])
    expect(() => decodeStoredFieldValue(field({ type: "date" }), row("date", { dateValue }))).toThrow("FIELD_STORAGE_INVALID");
});
it("retains known retired enum IDs for historical decoding without relaxing new selections or mutating schema", () => {
  const enumField = field({ type: "enum", valueSetVersion: 2, options: [{ id: "old", label: "Old", retired: true }, { id: "new", label: "New", retired: false }] });
  const snapshot = JSON.stringify(enumField);
  expect(decodeStoredFieldValue(enumField, row("enum", { textValue: "old" }))).toEqual({ type: "enum", value: "old" });
  expect(() => validateFieldValue(enumField, "old")).toThrow("current allowed");
  expect(() => decodeStoredFieldValue(enumField, row("enum", { textValue: "unrecognised" }))).toThrow("FIELD_STORAGE_INVALID");
  expect(JSON.stringify(enumField)).toBe(snapshot);
  const multi = field({ ...enumField.storage, type: "multi_enum", maxSelections: 2 });
  expect(decodeStoredFieldValue(multi, row("multi_enum", { jsonValue: ["old", "new"] }))).toEqual({ type: "multi_enum", value: ["new", "old"] });
  expect(() => decodeStoredFieldValue(multi, row("multi_enum", { jsonValue: ["old", "old"] }))).toThrow("FIELD_STORAGE_INVALID");
});
it("validates approved text/contact/URL and reference shapes; decoding itself grants no target access", () => {
  for (const [type, text] of [["string", "A text value"], ["email", "a@example.test"], ["phone", "+447700900123"], ["url", "https://example.test/"]] as const)
    expect(decodeStoredFieldValue(field({ type, ...(type === "phone" ? { format: "E164" } : {}) }), row(type, { textValue: text }))).toEqual({ type, value: text });
  const target = { id: "tickets.ticket", version: 2, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
  const reference = field({ type: "reference", entity: target });
  expect(decodeStoredFieldValue(reference, row("reference", { referenceValue: "record_123" }))).toEqual({ type: "reference", value: "record_123" });
  expect(() => decodeStoredFieldValue(reference, row("reference", { referenceValue: "foreign/unsafe" }))).toThrow("FIELD_STORAGE_INVALID");
});
it("validates structured addresses under the written country policy", () => {
  const address = field({ type: "address", countries: ["GB"] });
  const value = { line1: "1 Example Road", line2: "", region: "", city: "Example", postalCode: "EX1 1AA", country: "GB" };
  expect(decodeStoredFieldValue(address, row("address", { jsonValue: value }))).toEqual({ type: "address", value });
  expect(() => decodeStoredFieldValue(address, row("address", { jsonValue: { ...value, country: "US" } }))).toThrow("FIELD_STORAGE_INVALID");
});
it("fails closed for wrong type, missing/extra families, non-null blanks and redacts stored contents", () => {
  const string = field({ type: "string" });
  for (const bad of [row("integer", { textValue: "secret-value" }), row("string"), row("string", { textValue: "secret-value", booleanValue: false }), row("string", { textValue: "" }), row("string", { isNull: true, textValue: "secret-value" })]) {
    expect(() => decodeStoredFieldValue(string, bad)).toThrow("FIELD_STORAGE_INVALID");
    try { decodeStoredFieldValue(string, bad); } catch (error) { expect(String(error)).not.toContain("secret-value"); }
  }
});
