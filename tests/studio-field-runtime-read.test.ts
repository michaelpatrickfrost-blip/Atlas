import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinitionVersion, StudioFieldValue } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { checksum } from "@/core/studio/registry/contracts";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { readCurrentFieldValue, readFieldValueHistory, readFieldPlanInTransaction, readFieldContextInTransaction, readFieldValueInTransaction } from "@/core/studio/fields/runtime-read";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
const m = vi.hoisted(() => ({ authority: vi.fn(), definition: vi.fn(), extension: vi.fn(), generation: vi.fn(), slot: vi.fn(), values: vi.fn(), raw: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: m.authority }));
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
let written: StudioDefinitionVersion;
let current: StudioDefinitionVersion;
let row: StudioFieldValue & { schemaVersion: StudioDefinitionVersion };
let retiredAt: Date | null;
let origin: StudioDefinitionVersion | null;
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition }, studioExtensionRecord: { findFirst: m.extension },
  studioFieldGeneration: { findFirst: m.generation }, studioFieldSlot: { findFirst: m.slot }, studioFieldValue: { findMany: m.values } } as unknown as Prisma.TransactionClient;
const request = () => ({ definitionId: f.definition.id, recordId: "native" });
async function version(payload: typeof f.source.payload, id: string): Promise<StudioDefinitionVersion> {
  const compiled = await compileCustomField({ ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret"]) }, payload, f.registry);
  return { id, definitionId: f.definition.id, organisationId: f.session.organisationId, version: 1, semanticVersion: "1.0.0", schemaVersion: 1,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() };
}
// Real compilers/registry/sealed metadata and codec; authority, owner record
// visibility and transaction rows are bounded collaborators, not live SQL proof.
async function conditionalVersion(base: typeof f.source.payload, id: string, privateInput = false): Promise<StudioDefinitionVersion> {
  const metadata = f.registry.describe("tickets.ticket", 6);
  const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const session = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret", "tickets.field.edit"]) };
  const source = privateInput ? { kind: "field", definitionId: uuid(90), versionId: uuid(91), checksum: "e".repeat(64) }
    : { kind: "native", fieldId: "status" };
  const compiled = await compileConditionalCustomField({ session, registry: f.registry, definitionId: f.definition.id,
    resolveMetadata: async fact => fact.kind === "native" ? registeredRequiredFactMetadata(session, f.registry, entity, fact.fieldId)
      : { ...fact, organisationId: session.organisationId, entity, generationId: uuid(92), dependencyClosure: [],
        field: { ...f.source.payload.field, key: "private_condition", readCapability: "tickets.field.secret" } },
  }, { ...base, schemaVersion: 2, entity, requiredIf: { match: "all", predicates: [{ source, operator: "present" }] } });
  return { ...current, id, schemaVersion: 2, payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
}
function setWrittenFixture(next: StudioDefinitionVersion) {
  written = next; row = { ...row, versionId: written.id, schemaVersion: written };
}
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture(); retiredAt = null; origin = null;
  current = await version(f.target.payload, uuid(8)); written = current;
  row = { id: uuid(40), organisationId: "company", definitionId: f.definition.id, generationId: f.target.payload.storageGeneration, slotId: uuid(30),
    versionId: written.id, revision: 1, ...encodeFieldValue(f.target.payload.field, "12.5"), createdBy: "actor", createdAt: new Date(), schemaVersion: written };
  m.raw.mockResolvedValue([]); m.definition.mockImplementation(async args => args.where.retiredAt === null && retiredAt ? null : { ...f.definition, key: "tickets.ticket.extra", retiredAt, activeVersionId: current.id, activeVersion: current });
  m.extension.mockResolvedValue({ id: uuid(20), revision: 4 });
  m.generation.mockImplementation(async args => args.include?.originVersion ? { id: args.where.id, originVersion: origin ?? written } : { id: args.where.id });
  m.slot.mockImplementation(async () => ({ id: uuid(30), revision: 1, activeValueId: row.id, activeValue: row }));
  m.values.mockImplementation(async () => [row]);
  vi.spyOn(f.registry, "authoriseRecord").mockImplementation(async (context, reference, input) => {
    await f.registry.resolve(context.session, reference);
    const request = input as { recordId: string }; return { recordId: request.recordId, organisationId: "company", revision: 7 };
  });
  m.authority.mockImplementation(async (session, operation) => operation({ session, transaction: tx, registry: f.registry }));
});
it("reads only the active generation with ordinary current and written read access", async () => {
  const reader = { ...f.session, capabilities: new Set(["tickets.ticket.read"]) };
  expect(await readCurrentFieldValue(reader, request())).toMatchObject({ generationId: f.target.payload.storageGeneration, recordRevision: 7, extensionRevision: 4, state: "set", value: { type: "decimal", value: "12.5" } });
  expect(m.slot).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: "company", generationId: f.target.payload.storageGeneration }) }));
  expect(f.registry.authoriseRecord).toHaveBeenCalledTimes(2);
});
it("authorises native/private access before reading extension or value storage", async () => {
  vi.mocked(f.registry.authoriseRecord).mockRejectedValue(new Error("Ticket unavailable."));
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("unavailable");
  expect(m.extension).not.toHaveBeenCalled(); expect(m.slot).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled();
});
it("applies today's and the written field restrictions separately without leaking historical values", async () => {
  written = await version({ ...f.target.payload, field: { ...f.target.payload.field, readCapability: "tickets.field.secret" } }, uuid(60));
  row = { ...row, versionId: written.id, schemaVersion: written };
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FORBIDDEN");
  written = current; row = { ...row, versionId: written.id, schemaVersion: written };
  current = await version({ ...f.target.payload, field: { ...f.target.payload.field, readCapability: "tickets.field.secret" } }, uuid(61));
  m.extension.mockClear(); await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FORBIDDEN"); expect(m.extension).not.toHaveBeenCalled();
});
it("returns an authorised missing value without fabricating a stored null or anchor", async () => {
  m.extension.mockResolvedValue(null);
  expect(await readCurrentFieldValue(f.session, request())).toMatchObject({ state: "missing", value: null, extensionRevision: null, slotRevision: null, valueRevision: null });
  expect(m.slot).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled();
});
it("fails closed for corrupt immutable plan, fingerprint, written generation or current pointer", async () => {
  const saved = { ...row }, original = current;
  current = { ...original, compiledPlan: { unsafe: true } }; await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_STORAGE_INVALID"); current = original;
  row = { ...saved, fingerprint: "f".repeat(64) }; await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_STORAGE_INVALID");
  row = { ...saved, generationId: uuid(99) }; await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_STORAGE_INVALID"); row = saved;
  m.slot.mockResolvedValue({ id: uuid(30), revision: 1, activeValueId: uuid(99), activeValue: row });
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_STORAGE_INVALID");
});
it("allows retained source history after cutover and retirement, never as the current value", async () => {
  written = await version(f.source.payload, uuid(5));
  row = { ...row, ...encodeFieldValue(f.source.payload.field, 12), generationId: f.source.payload.storageGeneration, versionId: written.id, schemaVersion: written };
  retiredAt = new Date();
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_UNAVAILABLE");
  expect(await readFieldValueHistory(f.session, { ...request(), generationId: f.source.payload.storageGeneration })).toMatchObject({ retired: true, currentGeneration: false, items: [{ value: { type: "integer", value: 12 } }] });
  expect(m.values).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: "company", generationId: f.source.payload.storageGeneration, slotId: uuid(30) }), take: 21 }));
});
it("bounds and validates history pagination, including the extra row's written access", async () => {
  written = await version(f.source.payload, uuid(5));
  row = { ...row, ...encodeFieldValue(f.source.payload.field, 12), generationId: f.source.payload.storageGeneration, versionId: written.id, schemaVersion: written };
  m.values.mockResolvedValue([{ ...row, revision: 3 }, { ...row, revision: 2 }, { ...row, revision: 1 }]);
  const result = await readFieldValueHistory(f.session, { ...request(), generationId: f.source.payload.storageGeneration, beforeRevision: 4, limit: 2 });
  expect(result.items.map(item => item.revision)).toEqual([3, 2]); expect(result.nextBeforeRevision).toBe(2);
  await expect(readFieldValueHistory(f.session, { ...request(), generationId: f.source.payload.storageGeneration, limit: 1000 })).rejects.toThrow();
  await expect(readCurrentFieldValue(f.session, { ...request(), organisationId: "foreign" })).rejects.toThrow();
});
it("rechecks the written reference target independently before returning its identity", async () => {
  const reference = f.source.payload.entity, payload = { ...f.target.payload, field: { ...f.target.payload.field, storage: { type: "reference" as const, entity: reference } } };
  current = await version(payload, uuid(8)); written = current;
  row = { ...row, ...encodeFieldValue(payload.field, "target"), versionId: written.id, schemaVersion: written };
  vi.mocked(f.registry.authoriseRecord).mockImplementation(async (_, __, raw) => {
    const input = raw as { recordId: string }; if (input.recordId === "target") throw new Error("Ticket unavailable.");
    return { recordId: input.recordId, organisationId: "company", revision: 7 };
  });
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("unavailable");
  expect(f.registry.authoriseRecord).toHaveBeenCalledWith(expect.anything(), reference, { recordId: "target", intent: "read" });
  expect(checksum({ type: "reference", value: "target" })).toBe(row.fingerprint);
});
it("reads sealed schema2 with native/field read access only, without fetching private condition inputs", async () => {
  current = await conditionalVersion({ ...f.target.payload, field: { ...f.target.payload.field, writeCapability: "tickets.field.edit" } }, uuid(80), true);
  setWrittenFixture(current);
  const reader = { ...f.session, capabilities: new Set(["tickets.ticket.read"]) };
  const query = vi.spyOn(f.registry, "invokeQueryInTransaction"), invoke = vi.spyOn(f.registry, "invoke");
  expect(await readCurrentFieldValue(reader, request())).toMatchObject({ versionId: current.id, generationId: f.target.payload.storageGeneration,
    recordRevision: 7, state: "set", value: { type: "decimal", value: "12.5" } });
  expect(query).not.toHaveBeenCalled(); expect(invoke).not.toHaveBeenCalled();
  expect(m.definition).toHaveBeenCalledTimes(1); expect(f.registry.authoriseRecord).toHaveBeenCalledTimes(2);
  expect(m.definition).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: reader.organisationId, retiredAt: null }) }));
  expect(m.extension).toHaveBeenCalledWith({ where: { organisationId: reader.organisationId, entityId: "tickets.ticket", recordId: "native" } });
});
it("leaves ordinary writer plan/context/value aliases closed1 when public schema2 reads are available", async () => {
  current = await conditionalVersion(f.target.payload, uuid(80)); setWrittenFixture(current);
  const authority = { session: f.session, registry: f.registry, transaction: tx, stamp: { userId: f.session.userId, organisationId: f.session.organisationId, membershipId: f.session.membershipId, authVersion: 3, sessionVersion: 2 } };
  await expect(readFieldPlanInTransaction(authority, current, f.definition.id)).rejects.toThrow("FIELD_STORAGE_INVALID");
  await expect(readFieldContextInTransaction(authority, request(), false)).rejects.toThrow("FIELD_STORAGE_INVALID");
  await expect(readFieldValueInTransaction(authority, f.target.payload, f.definition.id, row.generationId, row.slotId, "native", row)).rejects.toThrow("FIELD_STORAGE_INVALID");
  expect(m.extension).not.toHaveBeenCalled();
  expect(await readCurrentFieldValue(f.session, request())).toMatchObject({ state: "set" });
});
it.each([1, 2])("reads mixed written schema1/2 history from origin schema%i, with a schema2 current definition", async schema => {
  const old = current;
  current = await conditionalVersion(f.target.payload, uuid(80));
  origin = schema === 1 ? old : current;
  setWrittenFixture(current);
  m.values.mockResolvedValue([{ ...row, revision: 3 }, { ...row, revision: 2, versionId: old.id, schemaVersion: old }]);
  const result = await readFieldValueHistory({ ...f.session, capabilities: new Set(["tickets.ticket.read"]) }, { ...request(), generationId: f.target.payload.storageGeneration });
  expect(result).toMatchObject({ currentGeneration: true, retired: false, nextBeforeRevision: null });
  expect(result.items.map(item => [item.revision, item.value])).toEqual([[3, { type: "decimal", value: "12.5" }], [2, { type: "decimal", value: "12.5" }]]);
  expect(m.values).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "company", definitionId: f.definition.id, generationId: f.target.payload.storageGeneration, slotId: uuid(30) }, take: 21 }));
});
it("reads retained schema2 origin/written history after rule removal to current schema1 and retirement", async () => {
  origin = await conditionalVersion(f.source.payload, uuid(70)); setWrittenFixture(origin);
  row = { ...row, generationId: f.source.payload.storageGeneration, ...encodeFieldValue(f.source.payload.field, 12) };
  retiredAt = new Date();
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_UNAVAILABLE");
  expect(await readFieldValueHistory(f.session, { ...request(), generationId: f.source.payload.storageGeneration })).toMatchObject({ retired: true, currentGeneration: false,
    items: [{ versionId: origin.id, value: { type: "integer", value: 12 } }] });
});
it("requires current and written field read grants independently for schema2, without Studio/write substitutes", async () => {
  current = await conditionalVersion(f.target.payload, uuid(80));
  setWrittenFixture(await conditionalVersion({ ...f.target.payload, field: { ...f.target.payload.field, readCapability: "tickets.field.secret" } }, uuid(60)));
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FORBIDDEN");
  setWrittenFixture(current);
  current = await conditionalVersion({ ...f.target.payload, field: { ...f.target.payload.field, readCapability: "tickets.field.secret" } }, uuid(61));
  m.extension.mockClear();
  await expect(readCurrentFieldValue({ ...f.session, capabilities: new Set(["tickets.ticket.read", "tickets.field.edit", "studio.definition.publish"]) }, request())).rejects.toThrow("FORBIDDEN");
  expect(m.extension).not.toHaveBeenCalled();
  await expect(readCurrentFieldValue({ ...f.session, capabilities: new Set(["tickets.field.secret", "tickets.field.edit", "studio.definition.publish"]) }, request())).rejects.toThrow("FORBIDDEN");
  expect(m.extension).not.toHaveBeenCalled();
});
it("requires the retained generation's origin field read grant before scanning schema2 history", async () => {
  current = await conditionalVersion(f.target.payload, uuid(80)); setWrittenFixture(current);
  origin = await conditionalVersion({ ...f.target.payload, field: { ...f.target.payload.field, readCapability: "tickets.field.secret" } }, uuid(60));
  await expect(readFieldValueHistory(f.session, { ...request(), generationId: f.target.payload.storageGeneration })).rejects.toThrow("FORBIDDEN");
  expect(m.values).not.toHaveBeenCalled();
});
it("checks the schema2 pagination sentinel's written grant before returning any page", async () => {
  current = await conditionalVersion(f.target.payload, uuid(80)); origin = current; setWrittenFixture(current);
  const secret = await conditionalVersion({ ...f.target.payload, field: { ...f.target.payload.field, readCapability: "tickets.field.secret" } }, uuid(60));
  m.values.mockResolvedValue([{ ...row, revision: 2 }, { ...row, revision: 1, versionId: secret.id, schemaVersion: secret }]);
  await expect(readFieldValueHistory(f.session, { ...request(), generationId: f.target.payload.storageGeneration, limit: 1, beforeRevision: 3 })).rejects.toThrow("FORBIDDEN");
  expect(m.values).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ revision: { lt: 3 } }), take: 2 }));
});
it.each(["written", "current"])("independently checks the %s schema2 reference target policy", async denied => {
  const base = f.target.payload, writtenTarget = f.source.payload.entity, currentTarget = base.entity;
  const target = (entity: typeof writtenTarget) => ({ ...base, field: { ...base.field, storage: { type: "reference" as const, entity } } });
  current = await conditionalVersion(target(currentTarget), uuid(80));
  setWrittenFixture(await conditionalVersion(target(writtenTarget), uuid(60)));
  row = { ...row, ...encodeFieldValue(target(writtenTarget).field, "target") };
  vi.mocked(f.registry.authoriseRecord).mockImplementation(async (context, reference, raw) => {
    await f.registry.resolve(context.session, reference);
    const input = raw as { recordId: string };
    if (input.recordId === "target" && reference.version === (denied === "written" ? writtenTarget.version : currentTarget.version)) throw new Error("Ticket unavailable.");
    return { recordId: input.recordId, organisationId: "company", revision: 7 };
  });
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("unavailable");
  expect(f.registry.authoriseRecord).toHaveBeenCalledWith(expect.anything(), writtenTarget, { recordId: "target", intent: "read" });
  if (denied === "current") expect(f.registry.authoriseRecord).toHaveBeenCalledWith(expect.anything(), currentTarget, { recordId: "target", intent: "read" });
});
it.each(["current", "written", "origin"])("fails unknown or corrupt schema2 %s metadata closed", async stage => {
  current = await conditionalVersion(f.target.payload, uuid(80)); setWrittenFixture(current); origin = current;
  const good = current;
  const payload = good.payload as Record<string, Prisma.JsonValue>;
  const mutations: StudioDefinitionVersion[] = [{ ...good, schemaVersion: 3 }, { ...good, schemaVersion: 1 },
    { ...good, compiledPlan: { unsafe: true } }, { ...good, checksum: "f".repeat(64) },
    { ...good, payload: { ...payload, requiredIf: null } }, { ...good, organisationId: "foreign" }, { ...good, definitionId: uuid(99) }];
  for (const invalid of mutations) {
    current = stage === "current" ? invalid : good; setWrittenFixture(stage === "written" ? invalid : good); origin = stage === "origin" ? invalid : good;
    const read = stage === "origin" ? readFieldValueHistory(f.session, { ...request(), generationId: f.target.payload.storageGeneration }) : readCurrentFieldValue(f.session, request());
    await expect(read).rejects.toThrow();
  }
});
it("denies schema2 native/private and module access before extension storage", async () => {
  current = await conditionalVersion(f.target.payload, uuid(80)); setWrittenFixture(current);
  vi.mocked(f.registry.authoriseRecord).mockRejectedValue(new Error("Ticket unavailable."));
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("unavailable"); expect(m.extension).not.toHaveBeenCalled();
  vi.mocked(f.registry.authoriseRecord).mockResolvedValue({ recordId: "native", organisationId: "foreign", revision: 7 });
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_STORAGE_INVALID"); expect(m.extension).not.toHaveBeenCalled();
  const disabled = new CapabilityRegistry(async () => false); disabled.register("tickets", ticketStudioContract); f.registry = disabled;
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("unavailable"); expect(m.extension).not.toHaveBeenCalled();
  expect(m.slot).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled();
});
it("preserves missing, pointer, binding and typed value integrity checks for schema2", async () => {
  current = await conditionalVersion(f.target.payload, uuid(80)); setWrittenFixture(current);
  const saved = { ...row };
  m.slot.mockResolvedValue({ id: uuid(30), revision: 1, activeValueId: null, activeValue: null });
  expect(await readCurrentFieldValue(f.session, request())).toMatchObject({ state: "missing", value: null, valueRevision: null });
  m.slot.mockResolvedValue({ id: uuid(30), revision: 1, activeValueId: null, activeValue: saved });
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_STORAGE_INVALID");
  m.slot.mockResolvedValue({ id: uuid(30), revision: 1, activeValueId: uuid(99), activeValue: saved });
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_STORAGE_INVALID");
  m.slot.mockImplementation(async () => ({ id: uuid(30), revision: 1, activeValueId: row.id, activeValue: row }));
  for (const invalid of [{ ...saved, fingerprint: "f".repeat(64) }, { ...saved, organisationId: "foreign" }, { ...saved, versionId: uuid(99) },
    { ...saved, generationId: uuid(99) }, { ...saved, slotId: uuid(99) }, { ...saved, valueType: "integer" as const }]) {
    row = invalid; await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("FIELD_STORAGE_INVALID");
  }
  row = saved; m.generation.mockResolvedValue(null);
  await expect(readCurrentFieldValue(f.session, request())).rejects.toThrow("DEPENDENCY_BROKEN");
});
it("rejects client schema/tenant overrides and wrong retained generation identities for schema2", async () => {
  current = await conditionalVersion(f.target.payload, uuid(80)); origin = current; setWrittenFixture(current);
  for (const extra of [{ schemaVersion: 1 }, { organisationId: "foreign" }])
    await expect(readCurrentFieldValue(f.session, { ...request(), ...extra })).rejects.toThrow();
  expect(m.authority).not.toHaveBeenCalled();
  origin = await conditionalVersion(f.source.payload, uuid(70));
  await expect(readFieldValueHistory(f.session, { ...request(), generationId: f.target.payload.storageGeneration })).rejects.toThrow("FIELD_STORAGE_INVALID");
  expect(m.values).not.toHaveBeenCalled();
  m.generation.mockResolvedValue(null);
  await expect(readFieldValueHistory(f.session, { ...request(), generationId: uuid(99) })).rejects.toThrow("DEPENDENCY_BROKEN");
});
