import { expect, it, vi } from "vitest";
import { compileConditionalCustomField, conditionalFieldPlanSchema } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileDefinition } from "@/core/studio/compiler";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { checksum } from "@/core/studio/registry/contracts";
import { evaluateRequiredCondition } from "@/core/studio/fields/required-evaluator";
import { inspectSealedFieldVersion } from "@/core/studio/fields/sealed-field";
import type { Prisma, StudioDefinitionVersion } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
async function fixture() {
  const f = await retainedCutoverFixture(), m = f.registry.describe("tickets.ticket", 6);
  const entity = { id: m.id, version: m.version, schemaHash: m.schemaHash, contractHash: m.contractHash };
  const payload = { ...f.source.payload, schemaVersion: 2, entity, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } }] } };
  const resolveMetadata = vi.fn(async (source: { kind: string; fieldId?: string }) => registeredRequiredFactMetadata(f.session, f.registry, entity, source.fieldId ?? "invalid"));
  const context = { session: f.session, registry: f.registry, definitionId: uuid(90), resolveMetadata };
  return { ...f, context, payload, resolveMetadata };
}
it("seals a full isolated v2 plan containing exact native entity/query hashes and canonical rule metadata", async () => {
  const f = await fixture(), compiled = await compileConditionalCustomField(f.context, f.payload);
  expect(compiled.plan.schemaVersion).toBe(2); expect(conditionalFieldPlanSchema.parse(compiled.plan)).toEqual(compiled.plan);
  expect(compiled.checksum).toBe(checksum(compiled.plan)); expect(compiled.payload.requiredIf).toEqual(compiled.plan.requiredIf.plan.condition);
  expect(compiled.plan.fieldDependencies).toEqual([]);
  expect(compiled.plan.dependencies.map(d => [d.id, d.version, d.kind])).toEqual([["tickets.ticket", 6, "entity"], ["tickets.ticket.required_facts", 1, "query"]]);
  expect(compiled.plan.dependencies[1].contractHash).toBe(f.registry.describe("tickets.ticket.required_facts", 1).contractHash);
  expect((await evaluateRequiredCondition(compiled.plan.requiredIf, async () => ({ type: "enum", value: "RESOLVED" }))).required).toBe(true);
});
it("validates rule metadata for target readers without write grants, keeping the exact writer plan", async () => {
  const f = await fixture(), payload = { ...f.payload, field: { ...f.payload.field, writeCapability: "tickets.field.edit" } };
  const writer = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.edit"]) };
  const compiled = await compileConditionalCustomField({ ...f.context, session: writer }, payload);
  await expect(compileConditionalCustomField(f.context, payload)).rejects.toThrow("FORBIDDEN");
  expect(await compileConditionalCustomField({ ...f.context, intent: "read" }, payload)).toEqual(compiled);
});
it("checks actual source read grants even with target metadata read intent", async () => {
  const f = await fixture(), source = { kind: "field", definitionId: uuid(91), versionId: uuid(92), checksum: "e".repeat(64) };
  const metadata = { ...source, organisationId: "company", entity: f.payload.entity, generationId: uuid(93), dependencyClosure: [],
    field: { ...f.source.payload.field, key: "source_field", readCapability: "tickets.field.secret", writeCapability: "tickets.field.edit" } };
  const payload = { ...f.payload, requiredIf: { match: "all", predicates: [{ source, operator: "present" }] } };
  const context = { ...f.context, intent: "read" as const, resolveMetadata: async () => metadata };
  await expect(compileConditionalCustomField(context, payload)).rejects.toThrow("FORBIDDEN");
  const session = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret"]) };
  const compiled = await compileConditionalCustomField({ ...context, session }, payload);
  expect(compiled.plan.fieldDependencies).toEqual([{ definitionId: source.definitionId, versionId: source.versionId, checksum: source.checksum }]);
  expect(compiled.plan.dependencies).toHaveLength(1);
});
it("rejects unapproved native inputs, supplied native code-set changes and foreign field pins", async () => {
  const f = await fixture();
  await expect(compileConditionalCustomField(f.context, { ...f.payload, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "subject" }, operator: "present" }] } })).rejects.toThrow("not approved");
  const context = { ...f.context, resolveMetadata: async () => ({ ...(await f.resolveMetadata({ kind: "native", fieldId: "status" })), storage: { type: "enum", codes: ["RESOLVED", "EXECUTE"] } }) };
  await expect(compileConditionalCustomField(context, f.payload)).rejects.toThrow("differs");
  await expect(compileConditionalCustomField({ ...f.context, resolveMetadata: async () => ({ ...(await f.resolveMetadata({ kind: "native", fieldId: "status" })), organisationId: "foreign" }) }, f.payload)).rejects.toThrow("business");
});
it("performs no native query/command invocation while compiling metadata", async () => {
  const f = await fixture(), query = vi.spyOn(f.registry, "invokeQueryInTransaction"), invoke = vi.spyOn(f.registry, "invoke"), records = vi.spyOn(f.registry, "authoriseRecord");
  await compileConditionalCustomField(f.context, f.payload);
  expect(query).not.toHaveBeenCalled(); expect(invoke).not.toHaveBeenCalled(); expect(records).not.toHaveBeenCalled();
});
it("preserves exact old v1 compilation and leaves v2 outside definition authoring dispatch", async () => {
  const f = await fixture(), before = await compileCustomField(f.session, f.source.payload, f.registry);
  expect(before.checksum).toBe(f.source.checksum);
  expect(() => customFieldPayloadSchema.parse(f.payload)).toThrow();
  await expect(compileDefinition(f.session, "customField", f.payload, f.registry)).rejects.toThrow();
  expect(await compileCustomField(f.session, f.source.payload, f.registry)).toEqual(before);
});
it("seals exact v7 creation query hashes without requiring an author's native create permission", async () => {
  const f = await fixture(), owner = f.registry.describe("tickets.ticket", 7);
  const entity = { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash };
  const session = { ...f.session, capabilities: new Set(["tickets.ticket.read"]) };
  const compiled = await compileConditionalCustomField({ ...f.context, session, resolveMetadata: async source => registeredRequiredFactMetadata(session, f.registry, entity, source.kind === "native" ? source.fieldId : "invalid") }, { ...f.payload, entity });
  expect(compiled.plan.dependencies.map(d => d.id)).toEqual(["tickets.ticket", "tickets.ticket.initial_required_facts", "tickets.ticket.required_facts"]);
  const version = { id: uuid(99), definitionId: f.context.definitionId, organisationId: "company", schemaVersion: 2, payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum } as StudioDefinitionVersion;
  expect(inspectSealedFieldVersion(f.registry, version, "company", f.context.definitionId)).toEqual(compiled.plan);
});
