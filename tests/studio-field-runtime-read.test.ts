import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinitionVersion, StudioFieldValue } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { checksum } from "@/core/studio/registry/contracts";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { readCurrentFieldValue, readFieldValueHistory } from "@/core/studio/fields/runtime-read";
const m = vi.hoisted(() => ({ authority: vi.fn(), definition: vi.fn(), extension: vi.fn(), generation: vi.fn(), slot: vi.fn(), values: vi.fn(), raw: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: m.authority }));
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
let written: StudioDefinitionVersion;
let current: StudioDefinitionVersion;
let row: StudioFieldValue & { schemaVersion: StudioDefinitionVersion };
let retiredAt: Date | null;
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition }, studioExtensionRecord: { findFirst: m.extension },
  studioFieldGeneration: { findFirst: m.generation }, studioFieldSlot: { findFirst: m.slot }, studioFieldValue: { findMany: m.values } } as unknown as Prisma.TransactionClient;
const request = () => ({ definitionId: f.definition.id, recordId: "native" });
async function version(payload: typeof f.source.payload, id: string): Promise<StudioDefinitionVersion> {
  const compiled = await compileCustomField({ ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret"]) }, payload, f.registry);
  return { id, definitionId: f.definition.id, organisationId: f.session.organisationId, version: 1, semanticVersion: "1.0.0", schemaVersion: 1,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() };
}
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture(); retiredAt = null;
  current = await version(f.target.payload, uuid(8)); written = current;
  row = { id: uuid(40), organisationId: "company", definitionId: f.definition.id, generationId: f.target.payload.storageGeneration, slotId: uuid(30),
    versionId: written.id, revision: 1, ...encodeFieldValue(f.target.payload.field, "12.5"), createdBy: "actor", createdAt: new Date(), schemaVersion: written };
  m.raw.mockResolvedValue([]); m.definition.mockImplementation(async args => args.where.retiredAt === null && retiredAt ? null : { ...f.definition, key: "tickets.ticket.extra", retiredAt, activeVersion: current });
  m.extension.mockResolvedValue({ id: uuid(20), revision: 4 });
  m.generation.mockImplementation(async args => args.where.binding ? { id: f.source.payload.storageGeneration, originVersion: written } : { id: args.where.id });
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
