import { beforeEach, expect, it, vi } from "vitest";
import { Prisma, type StudioDefinitionVersion, type StudioFieldValue } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { assertCapability } from "@/core/permissions/check";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import type { CustomFieldPayload } from "@/core/studio/fields/schema";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { writeFieldValue, writeFieldValueInTransaction } from "@/core/studio/fields/runtime-write";
import { fieldWriteRequestSchema, fieldWriteRequestChecksum, type FieldWriteRequest } from "@/core/studio/fields/runtime-write-contract";
const m = vi.hoisted(() => ({ authority: vi.fn(), definition: vi.fn(), extension: vi.fn(), generation: vi.fn(), slot: vi.fn(), existing: vi.fn(), create: vi.fn(), slotUpdate: vi.fn(), extensionUpdate: vi.fn(), audit: vi.fn(), findAudit: vi.fn(), raw: vi.fn(), window: vi.fn(), resulting: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: m.authority }));
vi.mock("@/core/studio/fields/runtime-write-window", () => ({ closeAffectedFieldWriteWindows: m.window }));
vi.mock("@/core/studio/fields/required-runtime", () => ({ validateResultingFieldRequirements: m.resulting }));
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
// Actual sealed compiler/registered owner; native, storage, authority/window and
// final-validator collaborators remain unit stubs. No SQL atomicity/condition-data
// or live authentication proof is inferred from this suite.
async function conditionalVersion(id = current.id, field: Partial<CustomFieldPayload["field"]> = {}) {
  const metadata = f.registry.describe("tickets.ticket", 9);
  const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const author = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.secret"]) };
  const compiled = await compileConditionalCustomField({ session: author, registry: f.registry, definitionId: f.definition.id,
    resolveMetadata: async source => source.kind === "native" ? registeredRequiredFactMetadata(author, f.registry, entity, source.fieldId)
      : Promise.reject(new Error("Unexpected unit condition source.")) }, { ...f.target.payload, entity, schemaVersion: 2,
    field: { ...f.target.payload.field, ...field }, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "absent" }] } });
  return { id, definitionId: f.definition.id, organisationId: "company", version: 2, semanticVersion: "2.0.0", schemaVersion: 2,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue,
    checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() } satisfies StudioDefinitionVersion;
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
  expect(m.raw.mock.calls[0][0].join("?")).toContain("pg_advisory_xact_lock");
  expect(m.raw.mock.calls[0].slice(1)).toEqual([f.session.organisationId,request.definitionId]);
  expect(m.raw.mock.calls[1][0].join("?")).toContain("FOR UPDATE");
  expect(m.raw.mock.invocationCallOrder[0]).toBeLessThan(m.definition.mock.invocationCallOrder[0]);
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
  m.create.mockClear(); m.window.mockClear(); m.resulting.mockClear();
  expect(await writeFieldValue(f.session, request)).toEqual({ ...result, replayed: true });
  await expect(writeFieldValue(f.session, { ...request, value: "99" })).rejects.toThrow("CONFLICT");
  expect(m.create).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled(); expect(m.resulting).not.toHaveBeenCalled();
});
it("closes untrusted request shape, revision capacity and explicit null, with canonical value idempotency", async () => {
  for (const patch of [{ organisationId: "foreign" }, { principal: {} }, { definitionRevision: 2147483647 }, { value: undefined }]) expect(() => fieldWriteRequestSchema.parse({ ...request, ...patch })).toThrow();
  expect(fieldWriteRequestChecksum(request, encodeFieldValue(f.target.payload.field, "13.50").fingerprint)).toBe(fieldWriteRequestChecksum({ ...request, value: "13.5" }, encodeFieldValue(f.target.payload.field, "13.5").fingerprint));
});

it("uses the caller's owning transaction without opening another authority boundary and retains failure/closed-input checks", async () => {
  // Explicit unit authority/storage collaborators; actual genuine bridge and
  // native-resulting-state atomic acceptance remain the owning integration gate.
  const authority = { session: f.session, registry: f.registry, transaction: tx,
    stamp: { organisationId: f.session.organisationId, userId: f.session.userId, membershipId: f.session.membershipId, authVersion: 1, sessionVersion: 1 } };
  await expect(writeFieldValueInTransaction(authority, { ...request, organisationId: "foreign" })).rejects.toThrow();
  expect(m.raw).not.toHaveBeenCalled();
  const result = await writeFieldValueInTransaction(authority, request);
  expect(result).toMatchObject({ operationId: request.operationId, replayed: false, slotRevision: 2, extensionRevision: 5 });
  expect(m.authority).not.toHaveBeenCalled();
  expect(m.window.mock.calls[0][0]).toBe(authority);
  expect(m.window.mock.calls[0][1]).toEqual({ entity: f.target.payload.entity, operationId: request.operationId, trigger: "ordinary_field_save" });
  expect(m.window.mock.invocationCallOrder[0]).toBeLessThan(m.create.mock.invocationCallOrder[0]);
  expect(m.resulting).not.toHaveBeenCalled(); // caller stages the whole batch first
  m.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("private duplicate", { code: "P2002", clientVersion: "7" }));
  await expect(writeFieldValueInTransaction(authority, request)).rejects.toThrow("CONFLICT");
  m.create.mockImplementation(async ({ data }) => data);
  m.audit.mockRejectedValue(new Error("Audit unavailable"));
  await expect(writeFieldValueInTransaction(authority, request)).rejects.toThrow("Audit unavailable");
});

it("validates the public save's complete staged state in the same transaction and propagates another field's failure", async () => {
  await writeFieldValue(f.session, request);
  expect(m.resulting).toHaveBeenCalledWith(f.session, tx,
    { entity: f.target.payload.entity, recordId: request.recordId, expectedRevision: request.recordRevision });
  expect(m.resulting.mock.invocationCallOrder[0]).toBeGreaterThan(m.extensionUpdate.mock.invocationCallOrder[0]);
  expect(m.resulting.mock.invocationCallOrder[0]).toBeGreaterThan(m.audit.mock.invocationCallOrder[0]);
  const failure = new Error("Another approved field is required.");
  m.resulting.mockRejectedValue(failure);
  await expect(writeFieldValue(f.session, request)).rejects.toBe(failure);
  // Storage is a unit collaborator. Propagation is proved here; actual rollback
  // of typed pointers, window and Audit needs the central PostgreSQL gate.
  expect(m.resulting).toHaveBeenCalledTimes(2);
});

it.each([[1, 2], [2, 1], [2, 2]])("stages current%s/written%s through the one codec/CAS/Audit engine without persisting a schema projection", async (currentSchema, writtenSchema) => {
  if (currentSchema === 2) current = await conditionalVersion();
  const written = writtenSchema === 2 ? await conditionalVersion(uuid(70)) : await version(f.target.payload, uuid(70));
  row = { ...row, versionId: written.id, schemaVersion: written };
  const result = await writeFieldValue(f.session, request);
  expect(result).toMatchObject({ replayed: false, extensionRevision: 5, valueRevision: 2 });
  expect(m.create.mock.calls[0][0].data).toMatchObject({ versionId: current.id, generationId: request.generationId, valueType: "decimal" });
  expect(m.create.mock.calls[0][0].data.decimalValue.toFixed()).toBe("13.5");
  expect(m.create.mock.calls[0][0].data).not.toHaveProperty("payload");
  expect(m.create.mock.calls[0][0].data).not.toHaveProperty("schemaVersion");
  expect(current.schemaVersion).toBe(currentSchema); expect(written.schemaVersion).toBe(writtenSchema);
  expect(m.window).toHaveBeenCalledTimes(1); expect(m.resulting).toHaveBeenCalledTimes(1);
});
it("does not relax current/written Read or Write because the conditional rule is false", async () => {
  const plain = current, written = row;
  for (const capability of ["readCapability", "writeCapability"] as const) {
    const restricted = await conditionalVersion(current.id, { [capability]: "tickets.field.secret" });
    current = restricted;
    await expect(writeFieldValue(f.session, request)).rejects.toThrow("FORBIDDEN");
    current = plain; row = { ...written, versionId: restricted.id, schemaVersion: restricted };
    await expect(writeFieldValue(f.session, request)).rejects.toThrow("FORBIDDEN");
    row = written;
  }
  expect(m.window).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled(); expect(m.resulting).not.toHaveBeenCalled();
});
it("retains ordinary native Read/Extend and existing/new reference Read for schema2", async () => {
  current = await conditionalVersion();
  f.session.capabilities.delete("tickets.ticket.read");
  await expect(writeFieldValue(f.session, request)).rejects.toThrow("FORBIDDEN");
  f.session.capabilities.add("tickets.ticket.read"); f.session.capabilities.delete("tickets.ticket.manage");
  vi.mocked(f.registry.authoriseRecord).mockImplementation(async (context, reference, raw) => {
    await f.registry.resolve(context.session, reference);
    const input = raw as { recordId: string; intent: string };
    if (input.intent === "extend") assertCapability(context.session, "tickets.ticket.manage");
    return { recordId: input.recordId, organisationId: "company", revision: 7 };
  });
  await expect(writeFieldValue(f.session, request)).rejects.toThrow("FORBIDDEN");
  f.session.capabilities.add("tickets.ticket.manage");
  const metadata = f.registry.describe("tickets.ticket", 9), entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  current = await conditionalVersion(current.id, { storage: { type: "reference", entity } });
  row = { ...row, ...encodeFieldValue({ ...f.target.payload.field, storage: { type: "reference", entity } }, "private"), schemaVersion: current };
  vi.mocked(f.registry.authoriseRecord).mockImplementation(async (_context, _ref, input) => {
    const request = input as { recordId: string }; if (request.recordId === "private") throw new Error("Private reference unavailable.");
    return { recordId: request.recordId, organisationId: "company", revision: 7 };
  });
  await expect(writeFieldValue(f.session, { ...request, value: "new" })).rejects.toThrow("Private reference");
  m.slot.mockResolvedValue(null);
  await expect(writeFieldValue(f.session, { ...request, slotRevision: null, valueRevision: null, value: "private" })).rejects.toThrow("Private reference");
  expect(m.window).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it("rejects unknown, foreign or tampered current/written sealed2 before settlement/value mutations", async () => {
  const sealed = await conditionalVersion();
  for (const patch of [{ schemaVersion: 3 }, { organisationId: "foreign" }, { definitionId: uuid(99) }, { checksum: "f".repeat(64) },
    { payload: { ...(sealed.payload as object), requiredIf: { match: "any", predicates: [] } } }]) {
    current = { ...sealed, ...patch };
    await expect(writeFieldValue(f.session, request)).rejects.toThrow();
    current = sealed; row = { ...row, schemaVersion: { ...sealed, ...patch } };
    await expect(writeFieldValue(f.session, request)).rejects.toThrow();
  }
  expect(m.window).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("replays sealed2 exactly before windows or resulting-state validation even if the current pointer moved", async () => {
  current = await conditionalVersion(); row = { ...row, schemaVersion: current };
  const written = current, result = await writeFieldValue(f.session, request), data = m.create.mock.calls[0][0].data;
  m.existing.mockResolvedValue({ ...row, ...data, jsonValue: null, schemaVersion: written, slot: { extensionId: uuid(20), extension: { recordId: "native", entityId: "tickets.ticket" } } });
  m.findAudit.mockResolvedValue({ after: Object.fromEntries(Object.entries(result).filter(([key]) => !["operationId", "replayed"].includes(key))) });
  current = await version(f.target.payload, uuid(71));
  m.definition.mockImplementation(async () => ({ ...f.definition, key: "tickets.ticket.extra", activeVersionId: current.id,
    activeVersion: current, revision: f.definition.revision + 1 }));
  m.create.mockClear(); m.window.mockClear(); m.resulting.mockClear(); m.audit.mockClear();
  expect(await writeFieldValue(f.session, request)).toEqual({ ...result, replayed: true });
  await expect(writeFieldValue(f.session, { ...request, value: "99" })).rejects.toThrow("CONFLICT");
  row = { ...row, schemaVersion: written };
  m.findAudit.mockResolvedValue(null); await expect(writeFieldValue(f.session, request)).rejects.toThrow("CONFLICT");
  expect(m.window).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled(); expect(m.resulting).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("stages schema2 transaction values but public saves require complete all-active validation and propagate hidden-field failure", async () => {
  current = await conditionalVersion(); row = { ...row, schemaVersion: current };
  const authority = { session: f.session, registry: f.registry, transaction: tx,
    stamp: { organisationId: "company", userId: "actor", membershipId: "member", authVersion: 1, sessionVersion: 1 } };
  await writeFieldValueInTransaction(authority, request);
  expect(m.resulting).not.toHaveBeenCalled(); expect(m.authority).not.toHaveBeenCalled();
  const hidden = new Error("Another hidden approved conditional field is required."); m.resulting.mockRejectedValue(hidden);
  await expect(writeFieldValue(f.session, request)).rejects.toBe(hidden);
  expect(m.resulting.mock.invocationCallOrder[0]).toBeGreaterThan(m.audit.mock.invocationCallOrder.at(-1)!);
  // Unit propagation only; central SQL establishes rollback of windows/native/
  // typed values/Audit. No input condition facts are evaluated by policy reads.
  expect(m.resulting).toHaveBeenCalledWith(f.session, tx, { entity: expect.objectContaining({ version: 9 }), recordId: "native", expectedRevision: 7 });
});
it("retains unconditional required and uniqueness for sealed2 despite a false condition", async () => {
  current = await conditionalVersion(current.id, { required: true }); m.slot.mockResolvedValue(null);
  await expect(writeFieldValue(f.session, { ...request, slotRevision: null, valueRevision: null, value: null })).rejects.toThrow("required");
  expect(m.window).not.toHaveBeenCalled();
  current = await conditionalVersion(current.id, { unique: true }); m.slot.mockImplementation(async () => ({ id: uuid(30), revision: 1, activeValueId: row.id, activeValue: row }));
  const result = await writeFieldValue(f.session, request);
  expect(m.slotUpdate.mock.calls.at(-1)?.[0].data.uniqueToken).toBe(result.fingerprint);
  m.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("private duplicate", { code: "P2002", clientVersion: "7" }));
  await expect(writeFieldValue(f.session, request)).rejects.toThrow("CONFLICT");
});
