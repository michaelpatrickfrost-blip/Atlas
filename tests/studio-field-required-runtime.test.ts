import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinition, StudioDefinitionVersion, StudioFieldValue } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { evaluateExistingFieldRequirement, validateResultingFieldRequirements } from "@/core/studio/fields/required-runtime";
import { encodeFieldValue } from "@/core/studio/fields/codec";
const m = vi.hoisted(() => ({ refresh: vi.fn(), raw: vi.fn(), definition: vi.fn(), definitions: vi.fn(), version: vi.fn(), generation: vi.fn(), extension: vi.fn(), slot: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
let entity: typeof f.source.payload.entity;
let row: StudioFieldValue & { schemaVersion: StudioDefinitionVersion };
let source: { version: StudioDefinitionVersion; payload: typeof f.source.payload; metadata: Parameters<Parameters<typeof compileConditionalCustomField>[0]["resolveMetadata"]>[0] & Record<string, unknown> };
const definitions = new Map<string, StudioDefinition & { activeVersion: StudioDefinitionVersion }>();
const versions = new Map<string, StudioDefinitionVersion>();
const rootId = uuid(90), sourceId = uuid(2), extensionId = uuid(20), slotId = uuid(30);
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition, findMany: m.definitions }, studioDefinitionVersion: { findFirst: m.version },
  studioFieldGeneration: { findFirst: m.generation }, studioExtensionRecord: { findFirst: m.extension }, studioFieldSlot: { findFirst: m.slot } } as unknown as Prisma.TransactionClient;
const request = () => ({ definitionId: rootId, recordId: "native", expectedRevision: 7 });
function stored(id: string, definitionId: string, compiled: Awaited<ReturnType<typeof compileCustomField>> | Awaited<ReturnType<typeof compileConditionalCustomField>>): StudioDefinitionVersion {
  const version = { id, definitionId, organisationId: "company", version: 1, semanticVersion: "1.0.0", schemaVersion: compiled.plan.schemaVersion,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() };
  versions.set(id, version); definitions.set(definitionId, { id: definitionId, organisationId: "company", kind: "customField", key: `tickets.ticket.${compiled.payload.field.key}`, name: "Field",
    revision: 1, latestVersion: 1, activeVersionId: id, retiredAt: null, createdBy: "actor", createdAt: new Date(), updatedAt: new Date(), activeVersion: version });
  return version;
}
async function root(required = false) {
  const compiled = await compileConditionalCustomField({ session: f.session, registry: f.registry, definitionId: rootId,
    resolveMetadata: async input => input.kind === "native" ? registeredRequiredFactMetadata(f.session, f.registry, entity, input.fieldId) : source.metadata },
  { ...f.source.payload, schemaVersion: 2, entity, field: { ...f.source.payload.field, key: "rule", required }, requiredIf: { match: "all", predicates: [
    { source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } },
    { source: { kind: "field", definitionId: sourceId, versionId: source.version.id, checksum: source.version.checksum }, operator: "equals", value: { type: "boolean", value: true } },
  ] } });
  return stored(uuid(190), rootId, compiled);
}
beforeEach(async () => {
  vi.resetAllMocks(); definitions.clear(); versions.clear(); f = await retainedCutoverFixture();
  const e = f.registry.describe("tickets.ticket", 6); entity = { id: e.id, version: e.version, schemaHash: e.schemaHash, contractHash: e.contractHash };
  const payload = { ...f.source.payload, entity, storageGeneration: uuid(202), field: { ...f.source.payload.field, key: "flag", storage: { type: "boolean" as const }, writeCapability: "tickets.field.edit" } };
  const writer = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.edit"]) }, compiled = await compileCustomField(writer, payload, f.registry);
  const version = stored(uuid(102), sourceId, compiled);
  source = { version, payload: compiled.payload, metadata: { kind: "field", definitionId: sourceId, versionId: version.id, checksum: version.checksum,
    organisationId: "company", entity, generationId: uuid(202), field: compiled.payload.field, dependencyClosure: [] } };
  row = { id: uuid(40), organisationId: "company", definitionId: sourceId, generationId: uuid(202), slotId, versionId: version.id, revision: 1,
    ...encodeFieldValue(compiled.payload.field, true), createdBy: "actor", createdAt: new Date(), schemaVersion: version };
  m.refresh.mockImplementation(async session => ({ session, registry: f.registry, transaction: tx })); m.raw.mockResolvedValue([]);
  m.definition.mockImplementation(async args => definitions.get(args.where.id) ?? null);
  m.definitions.mockImplementation(async () => [...definitions.values()].sort((a, b) => a.id.localeCompare(b.id)));
  m.version.mockImplementation(async args => versions.get(args.where.id) ?? null);
  m.generation.mockImplementation(async args => ({ id: args.where.id }));
  m.extension.mockResolvedValue({ id: extensionId, revision: 4 });
  m.slot.mockImplementation(async () => ({ id: slotId, revision: 1, activeValueId: row.id, activeValue: row }));
  vi.spyOn(f.registry, "authoriseRecord").mockImplementation(async (context, reference, input) => {
    await f.registry.resolve(context.session, reference);
    return { recordId: (input as { recordId: string }).recordId, organisationId: "company", revision: 7 };
  });
  vi.spyOn(f.registry, "invokeQueryInTransaction").mockResolvedValue({ recordId: "native", organisationId: "company", revision: 7, fields: { status: "RESOLVED", priority: "NORMAL" } });
  await root();
});
it("validates all resulting requirements after staged native/typed changes, accepting zero as a present required value", async () => {
  let target: typeof row | null = null;
  m.slot.mockImplementation(async args => {
    const value = args.where.definitionId === sourceId ? row : target;
    return value ? { id: value.slotId, revision: value.revision, activeValueId: value.id, activeValue: value } : null;
  });
  const input = { entity, recordId: "native", expectedRevision: 7 };
  await expect(validateResultingFieldRequirements(f.session, tx, input)).rejects.toThrow("Extra is required");
  const version = definitions.get(rootId)!.activeVersion;
  target = { ...row, id: uuid(41), definitionId: rootId, generationId: f.source.payload.storageGeneration, slotId: uuid(31),
    versionId: version.id, ...encodeFieldValue(f.source.payload.field, 0), schemaVersion: version };
  const filled = await validateResultingFieldRequirements(f.session, tx, input);
  expect(filled).toMatchObject({ fieldsChecked: 2, recordRevision: 7, extensionRevision: 4 });
  target = null; row = { ...row, ...encodeFieldValue(source.payload.field, false) }; m.extension.mockResolvedValue({ id: extensionId, revision: 5 });
  const cleared = await validateResultingFieldRequirements(f.session, tx, input);
  expect(cleared.fingerprint).not.toBe(filled.fingerprint);
  expect(cleared).toMatchObject({ extensionRevision: 5 });
});
it("does not relax unconditional requirements and rejects changing global extension state during validation", async () => {
  m.slot.mockImplementation(async args => args.where.definitionId === sourceId ? { id: slotId, revision: 1, activeValueId: row.id, activeValue: row } : null);
  row = { ...row, ...encodeFieldValue(source.payload.field, false) }; await root(true);
  const input = { entity, recordId: "native", expectedRevision: 7 };
  await expect(validateResultingFieldRequirements(f.session, tx, input)).rejects.toThrow("Extra is required");
  await root(false);
  m.extension.mockResolvedValueOnce({ id: extensionId, revision: 4 }).mockResolvedValue({ id: extensionId, revision: 5 });
  await expect(validateResultingFieldRequirements(f.session, tx, input)).rejects.toThrow("FIELD_REQUIREMENT_INVALID");
});
it("evaluates current owner facts and typed field values without field write or Studio authoring grants", async () => {
  const reader = { ...f.session, capabilities: new Set(["tickets.ticket.read"]) };
  const result = await evaluateExistingFieldRequirement(reader, tx, request());
  expect(result).toMatchObject({ required: true, recordRevision: 7, extensionRevision: 4, definitionId: rootId });
  expect(Object.keys(result).sort()).toEqual(["definitionId", "extensionRevision", "fingerprint", "recordRevision", "required", "versionId"]);
  expect(f.registry.invokeQueryInTransaction).toHaveBeenCalledTimes(1);
  expect(f.registry.invokeQueryInTransaction).toHaveBeenCalledWith(expect.objectContaining({ transaction: tx }), expect.objectContaining({ id: "tickets.ticket.required_facts", version: 1 }), { recordId: "native", expectedRevision: 7 });
});
it("treats false and an authorised missing value as absent/false appropriately, never relaxing unconditional required", async () => {
  row = { ...row, ...encodeFieldValue(source.payload.field, false) };
  expect((await evaluateExistingFieldRequirement(f.session, tx, request())).required).toBe(false);
  m.slot.mockResolvedValue(null);
  expect((await evaluateExistingFieldRequirement(f.session, tx, request())).required).toBe(false);
  await root(true);
  expect((await evaluateExistingFieldRequirement(f.session, tx, request())).required).toBe(true);
  expect(f.registry.invokeQueryInTransaction).toHaveBeenCalledTimes(3);
});
it("fails stale native revisions and owning private-record denial before extension input lookup", async () => {
  m.extension.mockClear();
  await expect(evaluateExistingFieldRequirement(f.session, tx, { ...request(), expectedRevision: 8 })).rejects.toThrow("CONFLICT");
  expect(m.extension).not.toHaveBeenCalled(); expect(m.slot).not.toHaveBeenCalled();
  vi.mocked(f.registry.authoriseRecord).mockRejectedValue(new Error("Ticket unavailable"));
  await expect(evaluateExistingFieldRequirement(f.session, tx, request())).rejects.toThrow("unavailable"); expect(m.slot).not.toHaveBeenCalled();
});
it("rejects foreign/stale/missing/unapproved native facts instead of making a rule false", async () => {
  for (const output of [
    { recordId: "native", organisationId: "foreign", revision: 7, fields: { status: "RESOLVED" } },
    { recordId: "native", organisationId: "company", revision: 8, fields: { status: "RESOLVED" } },
    { recordId: "native", organisationId: "company", revision: 7, fields: {} },
    { recordId: "native", organisationId: "company", revision: 7, fields: { status: "EXECUTE" } },
  ]) {
    vi.mocked(f.registry.invokeQueryInTransaction).mockResolvedValue(output);
    await expect(evaluateExistingFieldRequirement(f.session, tx, request())).rejects.toThrow("FIELD_REQUIREMENT_INVALID");
  }
});
it("retains independent written field access and immutable pointer/fingerprint checks", async () => {
  const writer = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.edit", "tickets.field.secret"]) };
  const compiled = await compileCustomField(writer, { ...source.payload, field: { ...source.payload.field, readCapability: "tickets.field.secret" } }, f.registry);
  const written = { ...source.version, id: uuid(103), payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  row = { ...row, versionId: written.id, schemaVersion: written };
  await expect(evaluateExistingFieldRequirement(f.session, tx, request())).rejects.toThrow("FORBIDDEN");
  row = { ...row, versionId: source.version.id, schemaVersion: source.version, fingerprint: "f".repeat(64) };
  await expect(evaluateExistingFieldRequirement(f.session, tx, request())).rejects.toThrow("FIELD_STORAGE_INVALID");
});
it("rejects client tenant/native-value injection and a failed genuine authority refresh", async () => {
  await expect(evaluateExistingFieldRequirement(f.session, tx, { ...request(), organisationId: "foreign" })).rejects.toThrow();
  await expect(evaluateExistingFieldRequirement(f.session, tx, { ...request(), fields: { status: "NEW" } })).rejects.toThrow();
  m.raw.mockClear(); m.refresh.mockRejectedValue(new Error("FORBIDDEN"));
  await expect(evaluateExistingFieldRequirement(f.session, tx, request())).rejects.toThrow("FORBIDDEN"); expect(m.raw).not.toHaveBeenCalled();
});
it("reads a v2 source value without executing its own rule or fetching its private inputs", async () => {
  const writer = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.edit", "tickets.field.secret"]) };
  const privateCompiled = await compileCustomField(writer, { ...source.payload, storageGeneration: uuid(203), field: { ...source.payload.field, key: "private_flag", readCapability: "tickets.field.secret" } }, f.registry);
  const privateVersion = stored(uuid(103), uuid(3), privateCompiled);
  const metadata = { kind: "field", organisationId: "company", entity, definitionId: uuid(3), versionId: privateVersion.id, checksum: privateVersion.checksum,
    generationId: uuid(203), field: privateCompiled.payload.field, dependencyClosure: [] };
  const compiled = await compileConditionalCustomField({ session: writer, registry: f.registry, definitionId: sourceId, resolveMetadata: async () => metadata },
    { ...source.payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: { kind: "field", definitionId: uuid(3), versionId: privateVersion.id, checksum: privateVersion.checksum }, operator: "present" }] } });
  source.version = stored(uuid(104), sourceId, compiled); source.metadata = { ...source.metadata, versionId: source.version.id, checksum: source.version.checksum };
  row = { ...row, versionId: source.version.id, schemaVersion: source.version };
  await root();
  const reader = { ...f.session, capabilities: new Set(["tickets.ticket.read"]) };
  expect((await evaluateExistingFieldRequirement(reader, tx, request())).required).toBe(true);
  expect(m.slot.mock.calls.every(([args]) => args.where.definitionId === sourceId)).toBe(true);
  expect(f.registry.invokeQueryInTransaction).toHaveBeenCalledTimes(1);
});
it("independently authorises reference targets before using a source value as a condition fact", async () => {
  const writer = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.edit"]) };
  const compiled = await compileCustomField(writer, { ...source.payload, field: { ...source.payload.field, storage: { type: "reference", entity } } }, f.registry);
  source.version = stored(uuid(104), sourceId, compiled); source.payload = compiled.payload;
  source.metadata = { ...source.metadata, versionId: source.version.id, checksum: source.version.checksum, field: compiled.payload.field };
  row = { ...row, ...encodeFieldValue(compiled.payload.field, "hidden_target"), versionId: source.version.id, schemaVersion: source.version };
  const target = await compileConditionalCustomField({ session: f.session, registry: f.registry, definitionId: rootId, resolveMetadata: async () => source.metadata },
    { ...f.source.payload, schemaVersion: 2, entity, field: { ...f.source.payload.field, key: "rule" }, requiredIf: { match: "all", predicates: [
      { source: { kind: "field", definitionId: sourceId, versionId: source.version.id, checksum: source.version.checksum }, operator: "present" },
    ] } });
  stored(uuid(190), rootId, target);
  vi.mocked(f.registry.authoriseRecord).mockImplementation(async (_, __, input) => {
    const recordId = (input as { recordId: string }).recordId;
    if (recordId === "hidden_target") throw new Error("Reference unavailable");
    return { recordId, organisationId: "company", revision: 7 };
  });
  await expect(evaluateExistingFieldRequirement(f.session, tx, request())).rejects.toThrow("Reference unavailable");
});
