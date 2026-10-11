import { expect, it, vi } from "vitest";
import { compileRequiredCondition, requiredFactMetadataSchema } from "@/core/studio/fields/required-compiler";
import { evaluateRequiredCondition } from "@/core/studio/fields/required-evaluator";
import { checksum } from "@/core/studio/registry/contracts";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

const status = { kind: "native", fieldId: "status" } as const, priority = { kind: "native", fieldId: "priority" } as const;
const resolved = { source: status, operator: "equals", value: { type: "enum", value: "RESOLVED" } };
const high = { source: priority, operator: "equals", value: { type: "enum", value: "HIGH" } };
async function native(match = "all", predicates: unknown[] = [resolved, high]) {
  const f = await retainedCutoverFixture();
  return compileRequiredCondition({ session: f.session, registry: f.registry, definitionId: uuid(90), approvedNativeFacts: new Set(["status", "priority"]),
    resolveMetadata: async source => ({ kind: "native", organisationId: "company", entity: f.source.payload.entity,
      fieldId: source.kind === "native" ? source.fieldId : "invalid", classification: "confidential", storage: { type: "enum", codes: source.kind === "native" && source.fieldId === "status" ? ["OPEN", "RESOLVED"] : ["LOW", "HIGH"] } }) },
  { ...f.source.payload, schemaVersion: 2, requiredIf: { match, predicates } });
}
it("evaluates all/any using exact typed approved facts and deterministic fingerprints", async () => {
  const all = await native(), any = await native("any");
  const read = vi.fn(async source => ({ type: "enum", value: source.fieldId === "status" ? "OPEN" : "HIGH" }));
  const a = await evaluateRequiredCondition(all, read); expect(a.required).toBe(false); expect(a.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  expect((await evaluateRequiredCondition(any, read)).required).toBe(true);
  expect(await evaluateRequiredCondition(all, read)).toEqual(a);
  expect((await evaluateRequiredCondition(all, async source => ({ type: "enum", value: source.kind === "native" && source.fieldId === "status" ? "RESOLVED" : "HIGH" }))).required).toBe(true);
});
it("never short circuits fact authorisation even when another predicate decides any/all", async () => {
  for (const match of ["all", "any"]) {
    const sealed = await native(match), read = vi.fn(async source => {
      if (source.fieldId === "status") throw new Error("FORBIDDEN: private fact");
      return { type: "enum", value: match === "all" ? "LOW" : "HIGH" };
    });
    await expect(evaluateRequiredCondition(sealed, read)).rejects.toThrow("FORBIDDEN"); expect(read).toHaveBeenCalledTimes(2);
  }
});
it("fails closed on missing/unavailable, wrong type, unapproved code and client-shaped values", async () => {
  const sealed = await native("all", [resolved]);
  for (const value of [undefined, "RESOLVED", { type: "string", value: "RESOLVED" }, { type: "enum", value: "EXECUTE" },
    { type: "enum", value: "RESOLVED", organisationId: "foreign" }])
    await expect(evaluateRequiredCondition(sealed, async () => value)).rejects.toThrow();
});
const fieldSource = { kind: "field", definitionId: uuid(91), versionId: uuid(92), checksum: "e".repeat(64) } as const;
async function field(storage: unknown, operator: string, value?: unknown) {
  const f = await retainedCutoverFixture();
  const metadata = requiredFactMetadataSchema.parse({ ...fieldSource, organisationId: "company", entity: f.source.payload.entity,
    generationId: uuid(93), dependencyClosure: [], field: { key: "source_value", label: "Source", classification: "confidential", storage } });
  return compileRequiredCondition({ session: f.session, registry: f.registry, definitionId: uuid(90), approvedNativeFacts: new Set(), resolveMetadata: async () => metadata },
    { ...f.source.payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: fieldSource, operator, ...(value === undefined ? {} : operator === "contains" ? { optionId: value } : { value }) }] } });
}
it("treats false and zero as present, empty selection/null as absent and absence comparisons explicitly", async () => {
  for (const [storage, value] of [[{ type: "boolean" }, { type: "boolean", value: false }], [{ type: "integer" }, { type: "integer", value: 0 }]]) {
    expect((await evaluateRequiredCondition(await field(storage, "present"), async () => value)).required).toBe(true);
    expect((await evaluateRequiredCondition(await field(storage, "absent"), async () => value)).required).toBe(false);
  }
  const selection = { type: "multi_enum", valueSetVersion: 1, options: [{ id: "old", label: "Old", retired: true }] };
  expect((await evaluateRequiredCondition(await field(selection, "absent"), async () => ({ type: "multi_enum", value: [] }))).required).toBe(true);
  expect((await evaluateRequiredCondition(await field({ type: "boolean" }, "absent"), async () => null)).required).toBe(true);
  for (const operator of ["equals", "not_equals"]) expect((await evaluateRequiredCondition(await field({ type: "boolean" }, operator, { type: "boolean", value: false }), async () => null)).required).toBe(false);
  const absent = await field({ type: "boolean" }, "absent");
  for (const invalid of [{ type: "boolean" }, { type: "boolean", value: null }]) await expect(evaluateRequiredCondition(absent, async () => invalid)).rejects.toThrow();
});
it("uses exact field codecs for decimal/money/date values without number/currency inference", async () => {
  const decimal = await field({ type: "decimal", precision: 10, scale: 3 }, "equals", { type: "decimal", value: "1.200" });
  expect((await evaluateRequiredCondition(decimal, async () => ({ type: "decimal", value: "1.2" }))).required).toBe(true);
  await expect(evaluateRequiredCondition(decimal, async () => ({ type: "decimal", value: 1.2 }))).rejects.toThrow();
  const money = await field({ type: "money", currencies: ["GBP", "EUR"] }, "not_equals", { type: "money", value: { amount: "12.00", currency: "GBP" } });
  expect((await evaluateRequiredCondition(money, async () => ({ type: "money", value: { amount: "12", currency: "EUR" } }))).required).toBe(true);
  await expect(evaluateRequiredCondition(money, async () => ({ type: "money", value: { amount: "12" } }))).rejects.toThrow();
  const date = await field({ type: "date" }, "present");
  await expect(evaluateRequiredCondition(date, async () => ({ type: "date", value: "2026-02-30" }))).rejects.toThrow();
});
it("supports approved retained selections and presence-only references through typed values", async () => {
  const selection = await field({ type: "multi_enum", valueSetVersion: 1, options: [{ id: "old", label: "Old", retired: true }] }, "contains", "old");
  expect((await evaluateRequiredCondition(selection, async () => ({ type: "multi_enum", value: ["old"] }))).required).toBe(true);
  expect((await evaluateRequiredCondition(selection, async () => ({ type: "multi_enum", value: [] }))).required).toBe(false);
  await expect(evaluateRequiredCondition(selection, async () => ({ type: "multi_enum", value: ["unknown"] }))).rejects.toThrow();
  const f = await retainedCutoverFixture(), reference = await field({ type: "reference", entity: f.source.payload.entity }, "present");
  expect((await evaluateRequiredCondition(reference, async () => ({ type: "reference", value: "authorised_record" }))).required).toBe(true);
  await expect(evaluateRequiredCondition(reference, async () => { throw new Error("FORBIDDEN: reference owner denied"); })).rejects.toThrow("FORBIDDEN");
});
it("rejects changed/missing/extra/foreign plan metadata and duplicate predicates before requesting values", async () => {
  const sealed = await native(), read = vi.fn();
  await expect(evaluateRequiredCondition({ ...sealed, checksum: "e".repeat(64) }, read)).rejects.toThrow();
  for (const plan of [{ ...sealed.plan, facts: sealed.plan.facts.slice(1) }, { ...sealed.plan, facts: [...sealed.plan.facts, sealed.plan.facts[0]] },
    { ...sealed.plan, facts: sealed.plan.facts.map((fact, n) => n ? { ...fact, organisationId: "foreign" } : fact) },
    { ...sealed.plan, condition: { ...sealed.plan.condition, predicates: [sealed.plan.condition.predicates[0], sealed.plan.condition.predicates[0]] } }])
    await expect(evaluateRequiredCondition({ plan, checksum: checksum(plan) }, read)).rejects.toThrow();
  expect(read).not.toHaveBeenCalled();
});
it("includes every observed fact in its internal fingerprint and never grants record or publication access", async () => {
  const sealed = await native("any"), read = async (source: { kind: string; fieldId?: string }) => ({ type: "enum", value: source.fieldId === "status" ? "OPEN" : "HIGH" });
  const a = await evaluateRequiredCondition(sealed, read), b = await evaluateRequiredCondition(sealed, async source => source.kind === "native" && source.fieldId === "status" ? { type: "enum", value: "RESOLVED" } : read(source));
  expect(a.required).toBe(true); expect(b.required).toBe(true); expect(a.fingerprint).not.toBe(b.fingerprint);
  expect(Object.keys(a).sort()).toEqual(["fingerprint", "required"]);
});
it("does not let schema default insertion make altered stored metadata appear sealed", async () => {
  const sealed = await field({ type: "boolean" }, "present"), read = vi.fn();
  const plan = structuredClone(sealed.plan);
  for (const fact of plan.facts) if (fact.kind === "field") Reflect.deleteProperty(fact.field, "required");
  await expect(evaluateRequiredCondition({ ...sealed, plan }, read)).rejects.toThrow("FIELD_REQUIREMENT_INVALID");
  expect(read).not.toHaveBeenCalled();
});
