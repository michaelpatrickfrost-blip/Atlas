import { beforeEach, expect, it, vi } from "vitest";
import { Prisma, type StudioDefinitionVersion, type StudioFieldValue } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { writeFieldValue } from "@/core/studio/fields/runtime-write";
import { fieldWriteRequestSchema, fieldWriteRequestChecksum, type FieldWriteRequest } from "@/core/studio/fields/runtime-write-contract";
const m = vi.hoisted(() => ({ authority: vi.fn(), definition: vi.fn(), extension: vi.fn(), generation: vi.fn(), slot: vi.fn(), existing: vi.fn(), create: vi.fn(), slotUpdate: vi.fn(), extensionUpdate: vi.fn(), audit: vi.fn(), findAudit: vi.fn(), raw: vi.fn(), window: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: m.authority }));
vi.mock("@/core/studio/fields/runtime-write-window", () => ({ closeFieldWriteWindow: m.window }));
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
let current: StudioDefinitionVersion;
let row: StudioFieldValue & { schemaVersion: StudioDefinitionVersion };
let request: FieldWriteRequest;
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition }, studioExtensionRecord: { findFirst: m.extension, updateMany: m.extensionUpdate },
  studioFieldGeneration: { findFirst: m.generation }, studioFieldSlot: { findFirst: m.slot, updateMany: m.slotUpdate },
  studioFieldValue: { findFirst: m.existing, create: m.create }, auditEntry: { create: m.audit, findFirst: m.findAudit } } as unknown as Prisma.TransactionClient;
async function version(payload: typeof f.target.payload, id: string): Promise<StudioDefinitionVersion> {
  const compiled = await compileCustomField({ ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret"]) }, payload, f.registry);
  return { id, definitionId: f.definition.id, organisationId: "company", version: 2, semanticVersion: "2.0.0", schemaVersion: 1, payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() };
}
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture(); f.session.capabilities.delete("studio.definition.publish");
  current = await version(f.target.payload, f.target.id);
  row = { id: uuid(40), organisationId: "company", definitionId: f.definition.id, generationId: f.target.payload.storageGeneration, slotId: uuid(30), versionId: current.id,
    revision: 1, ...encodeFieldValue(f.target.payload.field, "12.5"), createdBy: "actor", createdAt: new Date(), schemaVersion: current };
  request = { operationId: uuid(60), definitionId: f.definition.id, versionId: current.id, generationId: row.generationId, definitionRevision: f.definition.revision,
    recordId: "native", recordRevision: 7, extensionRevision: 4, slotRevision: 1, valueRevision: 1, value: "13.50" };
  m.raw.mockResolvedValue([]); m.definition.mockImplementation(async () => ({ ...f.definition, key: "tickets.ticket.extra", activeVersion: current }));
  m.extension.mockResolvedValue({ id: uuid(20), revision: 4 }); m.generation.mockResolvedValue({ id: row.generationId });
  m.slot.mockImplementation(async () => ({ id: uuid(30), revision: 1, activeValueId: row.id, activeValue: row })); m.existing.mockResolvedValue(null);
  m.create.mockImplementation(async ({ data }) => data); m.slotUpdate.mockResolvedValue({ count: 1 }); m.extensionUpdate.mockResolvedValue({ count: 1 }); m.audit.mockResolvedValue({ id: "audit" });
  vi.spyOn(f.registry, "authoriseRecord").mockImplementation(async (context, reference, raw) => {
    await f.registry.resolve(context.session, reference); const input = raw as { recordId: string; expectedRevision?: number };
    if (input.expectedRevision !== undefined && input.expectedRevision !== 7) throw new Error("Native record changed.");
    return { recordId: input.recordId, organisationId: "company", revision: 7 };
  });
  m.authority.mockImplementation(async (session, operation) => operation({ session, registry: f.registry, transaction: tx }));
});
it("commits one typed immutable value, CAS pointers and Audit using only ordinary native/field authority", async () => {
  const result = await writeFieldValue(f.session, request);
  expect(result).toMatchObject({ operationId: request.operationId, replayed: false, slotRevision: 2, extensionRevision: 5 });
  expect(m.create.mock.calls[0][0].data).toMatchObject({ id: request.operationId, organisationId: "company", definitionId: request.definitionId, versionId: request.versionId, revision: 2 });
  expect(m.create.mock.calls[0][0].data.decimalValue.toFixed()).toBe("13.5");
  expect(m.slotUpdate).toHaveBeenCalledWith({ where: { id: uuid(30), organisationId: "company", revision: 1 }, data: { revision: 2, activeValueId: request.operationId, uniqueToken: null } });
  expect(m.extensionUpdate).toHaveBeenCalledWith({ where: { id: uuid(20), organisationId: "company", revision: 4 }, data: { revision: 5 } });
  expect(m.audit.mock.calls[0][0].data).toMatchObject({ action: "studio.field.value.saved", entityId: request.operationId, after: { requestChecksum: result.requestChecksum } });
  expect(JSON.stringify(m.audit.mock.calls[0][0])).not.toContain("13.50");
  expect(f.session.capabilities.has("studio.definition.publish")).toBe(false);
});
it("rejects stale native/config/generation/value revisions before settlement or mutations", async () => {
  for (const patch of [{ recordRevision: 6 }, { definitionRevision: 1 }, { versionId: uuid(91) }, { generationId: uuid(92) }, { extensionRevision: null }, { slotRevision: null }, { valueRevision: 4 }])
    await expect(writeFieldValue(f.session, { ...request, ...patch })).rejects.toThrow(/changed|CONFLICT/);
  expect(m.window).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("enforces current and written write restrictions independently", async () => {
  const written = await version({ ...f.target.payload, field: { ...f.target.payload.field, writeCapability: "tickets.field.secret" } }, uuid(70));
  row = { ...row, versionId: written.id, schemaVersion: written };
  await expect(writeFieldValue(f.session, request)).rejects.toThrow("FORBIDDEN");
  row = { ...row, versionId: current.id, schemaVersion: current };
  current = written; await expect(writeFieldValue(f.session, { ...request, versionId: written.id })).rejects.toThrow("FORBIDDEN");
  expect(m.window).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it("rejects new inaccessible references and required null before any settlement or write", async () => {
  current = await version({ ...f.target.payload, field: { ...f.target.payload.field, required: true, storage: { type: "reference", entity: f.source.payload.entity } } }, current.id);
  m.slot.mockResolvedValue(null);
  const freshRequest = { ...request, slotRevision: null, valueRevision: null };
  vi.mocked(f.registry.authoriseRecord).mockImplementation(async (_, __, raw) => {
    const input = raw as { recordId: string }; if (input.recordId === "privateTarget") throw new Error("Ticket unavailable.");
    return { recordId: input.recordId, organisationId: "company", revision: 7 };
  });
  await expect(writeFieldValue(f.session, { ...freshRequest, value: null })).rejects.toThrow("required");
  await expect(writeFieldValue(f.session, { ...freshRequest, value: "privateTarget" })).rejects.toThrow("unavailable");
  expect(m.window).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it("sets uniqueness from validated policy and maps duplicate conflicts without disclosing other values", async () => {
  current = await version({ ...f.target.payload, field: { ...f.target.payload.field, unique: true } }, current.id);
  await writeFieldValue(f.session, request);
  expect(m.slotUpdate.mock.calls[0][0].data.uniqueToken).toBe(encodeFieldValue(f.target.payload.field, request.value).fingerprint);
  m.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("another private value", { code: "P2002", clientVersion: "7" }));
  await expect(writeFieldValue(f.session, request)).rejects.toThrow("CONFLICT");
});
it("propagates paired Audit failure and refuses a lost pointer CAS", async () => {
  m.audit.mockRejectedValue(new Error("Audit unavailable")); await expect(writeFieldValue(f.session, request)).rejects.toThrow("Audit unavailable");
  m.slotUpdate.mockResolvedValue({ count: 0 }); m.audit.mockClear(); await expect(writeFieldValue(f.session, request)).rejects.toThrow("CONFLICT"); expect(m.audit).not.toHaveBeenCalled();
});
it("replays the exact recorded operation without treating it as today's current pointer", async () => {
  const result = await writeFieldValue(f.session, request), data = m.create.mock.calls[0][0].data;
  m.existing.mockResolvedValue({ ...row, ...data, jsonValue: null, schemaVersion: current, slot: { extensionId: uuid(20), extension: { recordId: "native", entityId: "tickets.ticket" } } });
  m.findAudit.mockResolvedValue({ after: Object.fromEntries(Object.entries(result).filter(([key]) => !["operationId", "replayed"].includes(key))) });
  m.create.mockClear(); m.window.mockClear();
  expect(await writeFieldValue(f.session, request)).toEqual({ ...result, replayed: true });
  await expect(writeFieldValue(f.session, { ...request, value: "99" })).rejects.toThrow("CONFLICT");
  expect(m.create).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled();
});
it("closes untrusted request shape, revision capacity and explicit null, with canonical value idempotency", async () => {
  for (const patch of [{ organisationId: "foreign" }, { principal: {} }, { definitionRevision: 2147483647 }, { value: undefined }]) expect(() => fieldWriteRequestSchema.parse({ ...request, ...patch })).toThrow();
  expect(fieldWriteRequestChecksum(request, encodeFieldValue(f.target.payload.field, "13.50").fingerprint)).toBe(fieldWriteRequestChecksum({ ...request, value: "13.5" }, encodeFieldValue(f.target.payload.field, "13.5").fingerprint));
});
