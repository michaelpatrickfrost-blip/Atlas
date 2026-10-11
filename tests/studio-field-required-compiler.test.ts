import { expect, it, vi } from "vitest";
import { compileRequiredCondition, requiredFactMetadataSchema, type RequiredCompilerContext } from "@/core/studio/fields/required-compiler";
import { customFieldSchema } from "@/core/studio/fields/schema";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

async function fixture() {
  const f = await retainedCutoverFixture();
  const source = { kind: "native", fieldId: "status" } as const;
  const metadata = { kind: "native", organisationId: "company", entity: f.source.payload.entity, fieldId: "status",
    classification: "confidential", storage: { type: "enum", codes: ["OPEN", "RESOLVED"] } };
  const resolveMetadata = vi.fn(async () => metadata);
  const context: RequiredCompilerContext = { session: f.session, registry: f.registry, definitionId: uuid(90), approvedNativeFacts: new Set(["status"]), resolveMetadata };
  const payload = { ...f.source.payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [
    { source, operator: "equals", value: { type: "enum", value: "RESOLVED" } },
    { source, operator: "present" },
  ] } };
  return { ...f, source, metadata, context, payload, resolveMetadata };
}
it("seals deterministic typed native conditions independently of predicate order", async () => {
  const f = await fixture(), a = await compileRequiredCondition(f.context, f.payload);
  expect(a.plan.condition.predicates).toHaveLength(2); expect(a.plan.facts).toHaveLength(1);
  expect(f.resolveMetadata).toHaveBeenCalledTimes(1);
  expect(await compileRequiredCondition(f.context, { ...f.payload, requiredIf: { ...f.payload.requiredIf, predicates: [...f.payload.requiredIf.predicates].reverse() } })).toEqual(a);
});
it("requires exact tenant/entity/native approval, contract pins and declared types", async () => {
  const f = await fixture();
  for (const metadata of [{ ...f.metadata, organisationId: "foreign" }, { ...f.metadata, fieldId: "subject" },
    { ...f.metadata, entity: { ...f.metadata.entity, contractHash: "e".repeat(64) } },
    { ...f.metadata, storage: { type: "string" } }, { ...f.metadata, classification: "public_internal" }])
    await expect(compileRequiredCondition({ ...f.context, resolveMetadata: async () => metadata }, f.payload)).rejects.toThrow();
  await expect(compileRequiredCondition({ ...f.context, approvedNativeFacts: new Set() }, f.payload)).rejects.toThrow("not approved");
});
it("checks actual owner, target field and source fact grants without granting permissions", async () => {
  const f = await fixture();
  await expect(compileRequiredCondition({ ...f.context, session: { ...f.session, capabilities: new Set(["studio.definition.publish"]) } }, f.payload)).rejects.toThrow("FORBIDDEN");
  await expect(compileRequiredCondition(f.context, { ...f.payload, field: { ...f.payload.field, writeCapability: "tickets.field.edit" } })).rejects.toThrow("FORBIDDEN");
  await expect(compileRequiredCondition({ ...f.context, resolveMetadata: async () => ({ ...f.metadata, readCapability: "tickets.field.secret" }) }, f.payload)).rejects.toThrow("FORBIDDEN");
  await expect(compileRequiredCondition(f.context, { ...f.payload, field: { ...f.payload.field, key: "status" } })).rejects.toThrow("Native fields");
});
it("rejects source sensitivity downgrade even where the principal can read it", async () => {
  const f = await fixture(), reader = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret"]) };
  await expect(compileRequiredCondition({ ...f.context, session: reader, resolveMetadata: async () => ({ ...f.metadata, classification: "restricted", readCapability: "tickets.field.secret" }) }, f.payload)).rejects.toThrow("downgrade");
});
it("fails closed when the owning module is unavailable", async () => {
  const f = await fixture(), registry = new CapabilityRegistry(async () => false);
  registry.register("tickets", ticketStudioContract);
  await expect(compileRequiredCondition({ ...f.context, registry }, f.payload)).rejects.toThrow("unavailable");
  expect(f.resolveMetadata).not.toHaveBeenCalled();
});
it("rejects wrong literal type, unknown enum code, unsupported selections and duplicate predicates", async () => {
  const f = await fixture(), predicate = f.payload.requiredIf.predicates[0];
  for (const predicates of [[{ ...predicate, value: { type: "string", value: "RESOLVED" } }],
    [{ ...predicate, value: { type: "enum", value: "PRIVATE" } }], [{ source: f.source, operator: "contains", optionId: "open" }],
    [predicate, predicate]])
    await expect(compileRequiredCondition(f.context, { ...f.payload, requiredIf: { match: "all", predicates } })).rejects.toThrow();
});
async function fieldFixture(storage: unknown = { type: "decimal", precision: 10, scale: 3 }) {
  const f = await fixture(), source = { kind: "field", definitionId: uuid(91), versionId: uuid(92), checksum: "f".repeat(64) } as const;
  const metadata = requiredFactMetadataSchema.parse({ ...source, organisationId: "company", entity: f.metadata.entity,
    generationId: uuid(93), field: customFieldSchema.parse({ key: "condition_source", label: "Source", classification: "confidential", storage }), dependencyClosure: [] });
  if (metadata.kind !== "field") throw new Error("Expected field fixture.");
  const context = { ...f.context, resolveMetadata: vi.fn(async () => metadata) };
  const payload = { ...f.payload, requiredIf: { match: "all", predicates: [{ source, operator: "equals", value: { type: "decimal", value: "1.200" } }] } };
  return { ...f, source, metadata, context, payload };
}
it("normalises field literals through the existing typed codec and checks exact immutable source pins", async () => {
  const f = await fieldFixture(), result = await compileRequiredCondition(f.context, f.payload);
  expect(result.plan.condition.predicates[0]).toMatchObject({ value: { type: "decimal", value: "1.2" } });
  for (const metadata of [{ ...f.metadata, definitionId: uuid(95) }, { ...f.metadata, versionId: uuid(95) }, { ...f.metadata, checksum: "e".repeat(64) }])
    await expect(compileRequiredCondition({ ...f.context, resolveMetadata: async () => metadata }, f.payload)).rejects.toThrow("pin changed");
  await expect(compileRequiredCondition(f.context, { ...f.payload, requiredIf: { match: "all", predicates: [{ ...f.payload.requiredIf.predicates[0], value: { type: "decimal", value: "1.2345" } }] } })).rejects.toThrow("precision");
});
it("rejects self/transitive cycles, conflicting stable keys and unreadable source fields", async () => {
  const f = await fieldFixture();
  await expect(compileRequiredCondition({ ...f.context, definitionId: f.source.definitionId }, f.payload)).rejects.toThrow("Cyclic");
  for (const metadata of [{ ...f.metadata, dependencyClosure: [f.context.definitionId] },
    { ...f.metadata, field: { ...f.metadata.field, key: f.payload.field.key } }])
    await expect(compileRequiredCondition({ ...f.context, resolveMetadata: async () => metadata }, f.payload)).rejects.toThrow("Cyclic");
  await expect(compileRequiredCondition({ ...f.context, resolveMetadata: async () => ({ ...f.metadata, field: { ...f.metadata.field, readCapability: "tickets.field.secret" } }) }, f.payload)).rejects.toThrow("FORBIDDEN");
});
it("rejects duplicate conditions after canonical codec normalisation", async () => {
  const f = await fieldFixture({ type: "email" });
  await expect(compileRequiredCondition(f.context, { ...f.payload, requiredIf: { match: "all", predicates: [
    { source: f.source, operator: "equals", value: { type: "email", value: "USER@example.invalid" } },
    { source: f.source, operator: "equals", value: { type: "email", value: "user@example.invalid" } },
  ] } })).rejects.toThrow("Duplicate");
});
it("allows presence-only references and approved retained option identities without coercion", async () => {
  const f = await fieldFixture({ type: "multi_enum", valueSetVersion: 1, options: [{ id: "old", label: "Old", retired: true }] });
  const payload = { ...f.payload, requiredIf: { match: "any", predicates: [{ source: f.source, operator: "contains", optionId: "old" }] } };
  expect((await compileRequiredCondition(f.context, payload)).plan.condition.predicates).toEqual(payload.requiredIf.predicates);
  await expect(compileRequiredCondition(f.context, { ...payload, requiredIf: { match: "any", predicates: [{ source: f.source, operator: "contains", optionId: "unknown" }] } })).rejects.toThrow();
  const reference = await fieldFixture({ type: "reference", entity: f.metadata.entity });
  expect((await compileRequiredCondition(reference.context, { ...reference.payload, requiredIf: { match: "all", predicates: [{ source: reference.source, operator: "present" }] } })).plan.facts).toHaveLength(1);
});
