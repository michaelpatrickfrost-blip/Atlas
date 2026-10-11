import { expect, it } from "vitest";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { createFieldConverter, createRequiredFieldConverter } from "@/core/studio/fields/evolution";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: { id: "tickets.ticket", version: 9, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) },
  storageGeneration: uuid(1), field: { key: "detail", label: "Detail", classification: "confidential", storage: { type: "string" } } });
const target = conditionalFieldPayloadSchema.parse({ ...source, schemaVersion: 2, storageGeneration: uuid(2),
  field: { ...source.field, storage: { type: "enum", valueSetVersion: 1, options: [{ id: "a", label: "A", retired: false }] } },
  requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
it("preserves mapping/loss rules while rejecting an explicit empty mapping under the evaluated target requirement", () => {
  const rule = { kind: "string_to_enum", mapping: [{ from: "known", to: "a" }], unmapped: "empty" };
  const convert = createRequiredFieldConverter(source, target, rule);
  expect(convert("other", { sourceRequired: false, targetRequired: false })).toEqual({ value: null, lossy: true });
  expect(() => convert("other", { sourceRequired: false, targetRequired: true })).toThrow("evaluated target requirement");
  expect(convert("known", { sourceRequired: true, targetRequired: true })).toEqual({ value: { type: "enum", value: "a" }, lossy: false });
  expect(() => createRequiredFieldConverter(source, target, { ...rule, unmapped: "reject" })("other", { sourceRequired: false, targetRequired: false })).toThrow("explicit mapping");
  expect(() => createFieldConverter(source, target, rule)).toThrow();
});
it("never relaxes unconditional required and keeps source/type/constraint failures distinct", () => {
  const convert = createRequiredFieldConverter({ ...source, field: { ...source.field, required: true } }, target,
    { kind: "string_to_enum", mapping: [], unmapped: "empty" });
  expect(() => convert(null, { sourceRequired: false, targetRequired: false })).toThrow("source value");
  expect(() => convert(0, { sourceRequired: false, targetRequired: false })).toThrow("source value");
  const requiredTarget = { ...target, field: { ...target.field, required: true } };
  expect(() => createRequiredFieldConverter(source, requiredTarget, { kind: "string_to_enum", mapping: [], unmapped: "empty" })(null,
    { sourceRequired: false, targetRequired: false })).toThrow("evaluated target requirement");
});
