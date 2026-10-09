import { describe, expect, it } from "vitest";
import { analyseFieldEvolution, createFieldConverter, FieldConversionError, fieldConversionSchema } from "@/core/studio/fields/evolution";
import { customFieldPayloadSchema, type FieldStorage } from "@/core/studio/fields/schema";
import { validateFieldValue } from "@/core/studio/fields/validation";

const entity = { id: "tickets.ticket", version: 2, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
const sourceGeneration = "6c229c43-63f9-4bb0-ae2a-d15eb50b7191";
const targetGeneration = "2113c677-6860-4f7c-b5e6-1c0852db2080";
function payload(storage: FieldStorage, generation = sourceGeneration) {
  return customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: generation,
    field: { key: "business_detail", label: "Business detail", classification: "confidential", storage } });
}
const text = () => payload({ type: "string", minLength: 0, maxLength: 200, multiline: false });
const choice = (generation = targetGeneration) => payload({ type: "enum", valueSetVersion: 1,
  options: [{ id: "gold", label: "Gold", retired: false }, { id: "silver", label: "Silver", retired: false }] }, generation);
const utcDay = { kind: "date_to_datetime", timezone: "UTC", time: "start_of_day" };

describe("Pure reviewed field evolution analysis and conversion", () => {
  it("preserves field/entity identity and source payload while separating presentation from storage", () => {
    const source = text(), before = structuredClone(source);
    expect(analyseFieldEvolution(source, { ...source, field: { ...source.field, label: "Customer label", help: "Helpful explanation" } }).kind).toBe("cosmetic");
    expect(source).toEqual(before);
    expect(() => analyseFieldEvolution(source, { ...source, field: { ...source.field, key: "replacement" } })).toThrow("identity");
    expect(() => analyseFieldEvolution(source, { ...source, entity: { ...entity, id: "sales.order" } })).toThrow("identity");
  });
  it("requires a new generation for structural changes and reports uniqueness/index and rollback impact", () => {
    const source = text(), next = { ...source, field: { ...source.field, unique: true, indexed: true } };
    expect(() => analyseFieldEvolution(source, next)).toThrow("new storage generation");
    const result = analyseFieldEvolution(source, { ...next, storageGeneration: targetGeneration });
    expect(result).toMatchObject({ kind: "migration", requiresUniquenessCheck: true, rollbackLimit: "reverse_review_after_target_writes" });
    expect(result.indexImpact.some(impact => impact.includes("duplicates"))).toBe(true);
    expect(analyseFieldEvolution(source, { ...source, storageGeneration: targetGeneration }).kind).toBe("migration");
  });
  it("renames choices without changing IDs and enforces explicit value-set revisions", () => {
    const source = choice(sourceGeneration), next = { ...source, field: { ...source.field, storage: { type: "enum", valueSetVersion: 2,
      options: [{ id: "silver", label: "Silver", retired: false }, { id: "gold", label: "Preferred", retired: false }] } } };
    expect(analyseFieldEvolution(source, next).kind).toBe("cosmetic");
    expect(() => analyseFieldEvolution(source, { ...next, field: { ...next.field, storage: { ...next.field.storage, valueSetVersion: 1 } } })).toThrow("value-set version");
    expect(() => analyseFieldEvolution(source, { ...source, storageGeneration: targetGeneration, field: { ...next.field, storage: { ...next.field.storage, options: [{ id: "gold", label: "Preferred", retired: false }] } } })).toThrow("Retire");
  });
  it("keeps a retired choice readable in conversion while rejecting new selection", () => {
    const source = choice(sourceGeneration), target = payload({ type: "enum", valueSetVersion: 2,
      options: [{ id: "gold", label: "Gold", retired: true }, { id: "silver", label: "Silver", retired: false }] }, targetGeneration);
    expect(createFieldConverter(source, target, { kind: "same_type" })("gold")).toEqual({ value: { type: "enum", value: "gold" }, lossy: false });
    expect(() => validateFieldValue(target.field, "gold")).toThrow("current allowed");
    expect(() => createFieldConverter(text(), target, { kind: "string_to_enum", mapping: [{ from: "Preferred", to: "gold" }], unmapped: "reject" })).toThrow("current target choice");
  });
  it("preserves exact safe integers in decimal output and rejects insufficient precision or rounding", () => {
    const source = payload({ type: "integer" }), target = payload({ type: "decimal", precision: 28, scale: 10 }, targetGeneration);
    const convert = createFieldConverter(source, target, { kind: "integer_to_decimal" });
    expect(convert(Number.MAX_SAFE_INTEGER)).toEqual({ value: { type: "decimal", value: "9007199254740991" }, lossy: false });
    expect(convert(-1)).toEqual({ value: { type: "decimal", value: "-1" }, lossy: false });
    expect(() => convert(Number.MAX_SAFE_INTEGER + 1)).toThrow("source value");
    const small = createFieldConverter(source, payload({ type: "decimal", precision: 2, scale: 0 }, targetGeneration), { kind: "integer_to_decimal" });
    expect(() => small(100)).toThrow("target schema");
  });
  it("requires mappings for text, distinguishes case and makes unmapped loss explicit", () => {
    const source = text(), target = choice();
    const convert = createFieldConverter(source, target, { kind: "string_to_enum", mapping: [{ from: "Preferred", to: "gold" }], unmapped: "reject" });
    expect(convert("Preferred").value).toEqual({ type: "enum", value: "gold" });
    try { convert("preferred"); throw new Error("Expected conversion rejection"); }
    catch (error) { expect(error).toBeInstanceOf(FieldConversionError); expect((error as FieldConversionError).code).toBe("UNMAPPED_VALUE"); }
    const empty = { kind: "string_to_enum", mapping: [], unmapped: "empty" };
    expect(createFieldConverter(source, target, empty)("unmapped")).toEqual({ value: null, lossy: true });
    expect(() => createFieldConverter(source, { ...target, field: { ...target.field, required: true } }, empty)("unmapped")).toThrow("target schema");
    expect(() => fieldConversionSchema.parse({ ...empty, mapping: [{ from: "same", to: "gold" }, { from: "same", to: "silver" }] })).toThrow("Duplicate");
  });
  it("requires explicit UTC start-of-day semantics and correct calendar input", () => {
    const source = payload({ type: "date" }), target = payload({ type: "datetime", timezone: "UTC" }, targetGeneration);
    expect(createFieldConverter(source, target, utcDay)("2024-02-29")).toEqual({ value: { type: "datetime", value: "2024-02-29T00:00:00.000Z" }, lossy: false });
    expect(() => createFieldConverter(source, target, { kind: "date_to_datetime" })).toThrow();
    expect(() => createFieldConverter(source, target, { ...utcDay, timezone: "Europe/London" })).toThrow();
    expect(() => createFieldConverter(source, target, utcDay)("2025-02-29")).toThrow("source value");
  });
  it("requires reviewed time loss and does not silently reinterpret timezone offsets", () => {
    const source = payload({ type: "datetime", timezone: "UTC" }), target = payload({ type: "date" }, targetGeneration);
    const reject = createFieldConverter(source, target, { kind: "datetime_to_date", timezone: "UTC", loss: "reject" });
    expect(reject("2026-10-09T00:00:00Z")).toEqual({ value: { type: "date", value: "2026-10-09" }, lossy: false });
    expect(() => reject("2026-10-09T12:00:00Z")).toThrow("discard a time");
    expect(() => reject("2026-10-09T00:00:00+01:00")).toThrow("source value");
    expect(createFieldConverter(source, target, { kind: "datetime_to_date", timezone: "UTC", loss: "allow_time_loss" })("2026-10-09T12:00:00Z")).toEqual({ value: { type: "date", value: "2026-10-09" }, lossy: true });
  });
  it("preserves false and zero and checks nullable-to-required transitions", () => {
    const source = payload({ type: "boolean" }), target = { ...source, storageGeneration: targetGeneration, field: { ...source.field, required: true } };
    expect(createFieldConverter(source, target, { kind: "same_type" })(false).value).toEqual({ type: "boolean", value: false });
    expect(() => createFieldConverter(source, target, { kind: "same_type" })(null)).toThrow("target schema");
    const integer = payload({ type: "integer" });
    expect(createFieldConverter(integer, integer, { kind: "same_type" })(0).value).toEqual({ type: "integer", value: 0 });
  });
  it("refuses changed reference targets, currency inference and executable rules", () => {
    const source = payload({ type: "reference", entity });
    expect(() => analyseFieldEvolution(source, { ...source, storageGeneration: targetGeneration,
      field: { ...source.field, storage: { type: "reference", entity: { ...entity, id: "sales.order" } } } })).toThrow("new field");
    expect(() => createFieldConverter(payload({ type: "decimal", precision: 28, scale: 10 }), payload({ type: "money", precision: 28, scale: 10, currencies: ["GBP"] }, targetGeneration), { kind: "same_type" })).toThrow("does not match");
    expect(() => fieldConversionSchema.parse({ kind: "same_type", script: "return value" })).toThrow();
  });
});
