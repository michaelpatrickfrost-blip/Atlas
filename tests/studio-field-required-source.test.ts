import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinition, StudioDefinitionVersion } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { inspectSealedFieldVersion } from "@/core/studio/fields/sealed-field";
import { createRequiredMetadataProvider } from "@/core/studio/fields/required-source";
import { checksum } from "@/core/studio/registry/contracts";
const m = vi.hoisted(() => ({ refresh: vi.fn(), raw: vi.fn(), definition: vi.fn(), version: vi.fn(), generation: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
let entity: typeof f.source.payload.entity;
const root = uuid(90), definitions = new Map<string, StudioDefinition & { activeVersion?: StudioDefinitionVersion }>();
const versions = new Map<string, StudioDefinitionVersion>();
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition }, studioDefinitionVersion: { findFirst: m.version },
  studioFieldGeneration: { findFirst: m.generation } } as unknown as Prisma.TransactionClient;
async function field(id: number, payload?: unknown, resolver?: Parameters<typeof compileConditionalCustomField>[0]["resolveMetadata"]) {
  const input = payload ?? { ...f.source.payload, entity, storageGeneration: uuid(id + 200), field: { ...f.source.payload.field, key: `field_${id}` } };
  const compiled = resolver ? await compileConditionalCustomField({ session: f.session, registry: f.registry, definitionId: uuid(id), resolveMetadata: resolver }, input)
    : await compileCustomField(f.session, input, f.registry);
  const version = { id: uuid(id + 100), definitionId: uuid(id), organisationId: "company", version: 1, semanticVersion: "1.0.0", schemaVersion: compiled.plan.schemaVersion,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() };
  versions.set(version.id, version);
  const definition = { id: uuid(id), organisationId: "company", kind: "customField", key: `tickets.ticket.${compiled.payload.field.key}`, name: "Field",
    revision: 1, latestVersion: 1, activeVersionId: version.id, retiredAt: null, createdBy: "actor", createdAt: new Date(), updatedAt: new Date(), activeVersion: version };
  definitions.set(definition.id, definition);
  return { version, payload: compiled.payload, metadata: { kind: "field" as const, organisationId: "company", entity, definitionId: uuid(id), versionId: version.id,
    checksum: version.checksum, generationId: compiled.payload.storageGeneration, field: compiled.payload.field, dependencyClosure: [] as string[] },
    source: { kind: "field" as const, definitionId: uuid(id), versionId: version.id, checksum: version.checksum } };
}
beforeEach(async () => {
  vi.resetAllMocks(); definitions.clear(); versions.clear(); f = await retainedCutoverFixture();
  const e = f.registry.describe("tickets.ticket", 6); entity = { id: e.id, version: e.version, schemaHash: e.schemaHash, contractHash: e.contractHash };
  definitions.set(root, { id: root, organisationId: "company", kind: "customField", key: "tickets.ticket.rule", retiredAt: null } as StudioDefinition);
  m.refresh.mockImplementation(async session => ({ session, registry: f.registry, transaction: tx })); m.raw.mockResolvedValue([]);
  m.definition.mockImplementation(async args => definitions.get(args.where.id) ?? null);
  m.version.mockImplementation(async args => versions.get(args.where.id) ?? null);
  m.generation.mockImplementation(async args => ({ id: args.where.id }));
});
it("resolves a locked tenant-owned active/pinned legacy field and permits compatible presentation changes", async () => {
  const a = await field(1), next = await field(1, { ...a.payload, field: { ...a.payload.field, label: "New name", help: "New help" } });
  next.version.id = uuid(401); versions.set(next.version.id, next.version); versions.set(a.version.id, a.version);
  definitions.get(uuid(1))!.activeVersionId = next.version.id;
  const provider = await createRequiredMetadataProvider(f.session, tx, root, entity), result = await provider.resolveMetadata(a.source);
  expect(result).toMatchObject(a.metadata); expect(m.refresh).toHaveBeenCalledWith(f.session, tx);
  expect(m.version).toHaveBeenCalledWith({ where: { id: a.version.id, definitionId: uuid(1), organisationId: "company" } });
  expect(m.generation).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: "company", entityId: "tickets.ticket", binding: expect.objectContaining({ fieldKey: "field_1" }) }) }));
  expect(m.raw.mock.calls.map(([strings]) => strings.join("?"))).toEqual(expect.arrayContaining([expect.stringContaining("FOR SHARE"), expect.stringContaining("FOR SHARE OF b,g")]));
});
it("rejects stale hashes, foreign versions, missing bindings, retirement and structural policy/generation drift", async () => {
  const a = await field(1);
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata({ ...a.source, checksum: "f".repeat(64) })).rejects.toThrow("unavailable");
  a.version.organisationId = "foreign";
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata(a.source)).rejects.toThrow("FIELD_STORAGE_INVALID"); a.version.organisationId = "company";
  m.generation.mockResolvedValue(null);
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata(a.source)).rejects.toThrow("unavailable"); m.generation.mockImplementation(async args => ({ id: args.where.id }));
  definitions.get(uuid(1))!.retiredAt = new Date();
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata(a.source)).rejects.toThrow("unavailable"); definitions.get(uuid(1))!.retiredAt = null;
  const next = await field(1, { ...a.payload, storageGeneration: uuid(500) }); next.version.id = uuid(501); versions.set(a.version.id, a.version); definitions.get(uuid(1))!.activeVersionId = next.version.id;
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata(a.source)).rejects.toThrow("unavailable");
});
it("checks direct source current and pinned read access without source write grants", async () => {
  f.session = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret", "tickets.field.edit"]) };
  const a = await field(1, { ...f.source.payload, entity, field: { ...f.source.payload.field, key: "field_1", readCapability: "tickets.field.secret", writeCapability: "tickets.field.edit" } });
  const reader = { ...f.session, capabilities: new Set(["tickets.ticket.read"]) };
  await expect((await createRequiredMetadataProvider(reader, tx, root, entity)).resolveMetadata(a.source)).rejects.toThrow("FORBIDDEN");
  expect(await (await createRequiredMetadataProvider({ ...reader, capabilities: new Set([...reader.capabilities, "tickets.field.secret"]) }, tx, root, entity)).resolveMetadata(a.source)).toMatchObject({ definitionId: uuid(1) });
});
it("inspects a conditional source graph without evaluating or requiring its private rule inputs", async () => {
  f.session = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret"]) };
  const privateField = await field(2, { ...f.source.payload, entity, field: { ...f.source.payload.field, key: "field_2", readCapability: "tickets.field.secret" } });
  const b = await field(1, { ...f.source.payload, entity, schemaVersion: 2, field: { ...f.source.payload.field, key: "field_1" },
    requiredIf: { match: "all", predicates: [{ source: privateField.source, operator: "present" }] } }, async () => privateField.metadata);
  const invoke = vi.spyOn(f.registry, "invokeQueryInTransaction"), records = vi.spyOn(f.registry, "authoriseRecord");
  const reader = { ...f.session, capabilities: new Set(["tickets.ticket.read"]) };
  expect(await (await createRequiredMetadataProvider(reader, tx, root, entity)).resolveMetadata(b.source)).toMatchObject({ dependencyClosure: [uuid(2)] });
  expect(invoke).not.toHaveBeenCalled(); expect(records).not.toHaveBeenCalled();
});
it("rejects cycles in current versions even when a historical pinned source has no condition", async () => {
  const a = await field(1), b = await field(2);
  const conditional = (source: typeof a) => ({ ...source.payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: source === a ? b.source : a.source, operator: "present" }] } });
  const nextA = await field(1, conditional(a), async () => b.metadata); nextA.version.id = uuid(401); definitions.get(uuid(1))!.activeVersionId = nextA.version.id;
  const nextB = await field(2, conditional(b), async () => a.metadata); nextB.version.id = uuid(402); definitions.get(uuid(2))!.activeVersionId = nextB.version.id;
  versions.set(a.version.id, a.version); versions.set(b.version.id, b.version);
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata(a.source)).rejects.toThrow("unavailable");
});
it("rejects a transitive root reference and modified sealed metadata without querying business values", async () => {
  const a = await field(1), rootField = await field(90, { ...f.source.payload, entity, field: { ...f.source.payload.field, key: "rule" } });
  const next = await field(1, { ...a.payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: rootField.source, operator: "present" }] } }, async () => rootField.metadata);
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata(next.source)).rejects.toThrow("unavailable");
  next.version.compiledPlan = { changed: true };
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata(next.source)).rejects.toThrow();
});
it("rejects omitted normalization defaults and mismatched payloads even after a raw rehash", async () => {
  const a = await field(1), plan = structuredClone(a.version.compiledPlan) as unknown as { payload: { field: { help?: string } } };
  delete plan.payload.field.help;
  expect(() => inspectSealedFieldVersion(f.registry, { ...a.version, compiledPlan: plan as unknown as Prisma.JsonValue, checksum: checksum(plan) }, "company", uuid(1))).toThrow("FIELD_STORAGE_INVALID");
  expect(() => inspectSealedFieldVersion(f.registry, { ...a.version, payload: { changed: true } }, "company", uuid(1))).toThrow("FIELD_STORAGE_INVALID");
});
it("fails before metadata access when authority refresh rejects an untrusted principal", async () => {
  m.refresh.mockRejectedValue(new Error("FORBIDDEN"));
  await expect(createRequiredMetadataProvider(f.session, tx, root, entity)).rejects.toThrow("FORBIDDEN");
  expect(m.raw).not.toHaveBeenCalled(); expect(m.definition).not.toHaveBeenCalled();
});
it("bounds current graph depth even when every historical pin is an unconditional legacy field", async () => {
  const chain = [];
  for (let id = 1; id <= 21; id++) chain.push(await field(id));
  for (let index = 19; index >= 0; index--) {
    const source = chain[index], target = chain[index + 1];
    const next = await field(index + 1, { ...source.payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: target.source, operator: "present" }] } }, async () => target.metadata);
    next.version.id = uuid(800 + index); definitions.get(source.source.definitionId)!.activeVersionId = next.version.id;
    versions.set(source.version.id, source.version);
  }
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata(chain[0].source)).rejects.toThrow("unavailable");
});
it("checks sealed field dependency metadata against the actual pinned source, beyond merely matching checksums", async () => {
  const a = await field(2), b = await field(1, { ...f.source.payload, entity, schemaVersion: 2, field: { ...f.source.payload.field, key: "field_1" },
    requiredIf: { match: "all", predicates: [{ source: a.source, operator: "present" }] } }, async () => a.metadata);
  const plan = structuredClone(b.version.compiledPlan) as unknown as { requiredIf: { plan: { facts: { field: { label: string } }[] }; checksum: string } };
  plan.requiredIf.plan.facts[0].field.label = "Fabricated pin metadata";
  plan.requiredIf.checksum = checksum(plan.requiredIf.plan);
  b.version.compiledPlan = plan as unknown as Prisma.JsonValue; b.version.checksum = checksum(plan);
  await expect((await createRequiredMetadataProvider(f.session, tx, root, entity)).resolveMetadata({ ...b.source, checksum: b.version.checksum })).rejects.toThrow("unavailable");
});
