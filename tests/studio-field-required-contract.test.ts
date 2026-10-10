import { expect, it } from "vitest";
import { requiredConditionSchema, conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { checksum } from "@/core/studio/registry/contracts";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

const native = { kind: "native", fieldId: "status" } as const;
const condition = { match: "all", predicates: [{ source: native, operator: "equals", value: { type: "enum", value: "RESOLVED" } }] };
it("accepts closed typed native codes, field version pins, presence and multi-selection predicates", () => {
  expect(requiredConditionSchema.parse(condition)).toEqual(condition);
  const field = { kind: "field", definitionId: uuid(90), versionId: uuid(91), checksum: "e".repeat(64) };
  const predicates = [{ source: field, operator: "present" }, { source: field, operator: "absent" }, { source: field, operator: "contains", optionId: "priority_customer" },
    { source: field, operator: "not_equals", value: { type: "boolean", value: false } }];
  expect(requiredConditionSchema.parse({ match: "any", predicates }).predicates).toHaveLength(4);
});
it("rejects recursive/oversized/empty rules and executable/untrusted source shapes", () => {
  for (const invalid of [{ match: "all", predicates: [] }, { ...condition, predicates: Array(21).fill(condition.predicates[0]) },
    { match: "all", predicates: [{ ...condition.predicates[0], operator: "eval", script: "return true" }] },
    { match: "all", predicates: [condition] }, { ...condition, organisationId: "foreign" },
    { match: "all", predicates: [{ source: { ...native, sql: "select *" }, operator: "present" }] },
    { match: "all", predicates: [{ source: { kind: "field", definitionId: uuid(90), versionId: uuid(91) }, operator: "present" }] }])
    expect(() => requiredConditionSchema.parse(invalid)).toThrow();
});
it("never coerces typed literal data or accepts arbitrary reference/address comparison values", () => {
  for (const value of [{ type: "integer", value: "2" }, { type: "boolean", value: "false" }, { type: "decimal", value: 2.5 },
    { type: "money", value: { amount: "12", currency: "gbp" } }, { type: "date", value: "2026-02-30" },
    { type: "reference", value: "private_record" }, { type: "address", value: { line1: "private" } }])
    expect(() => requiredConditionSchema.parse({ match: "all", predicates: [{ source: native, operator: "equals", value }] })).toThrow();
});
it("keeps v1 metadata and sealed hashes unchanged, with v2 intentionally unwired to authoring", async () => {
  const f = await retainedCutoverFixture(), before = await compileCustomField(f.session, f.source.payload, f.registry);
  expect(before.checksum).toBe(f.source.checksum); expect(checksum(before.plan)).toBe(f.source.checksum);
  const v2 = { ...f.source.payload, schemaVersion: 2, requiredIf: condition };
  expect(conditionalFieldPayloadSchema.parse(v2)).toEqual(v2);
  expect(() => customFieldPayloadSchema.parse(v2)).toThrow();
  await expect(compileCustomField(f.session, v2, f.registry)).rejects.toThrow();
  expect(await compileCustomField(f.session, f.source.payload, f.registry)).toEqual(before);
});
