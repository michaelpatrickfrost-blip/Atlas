import { beforeEach, expect, it, vi } from "vitest";
import { Prisma, type StudioDefinitionVersion, type StudioFieldValue } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { checksum } from "@/core/studio/registry/contracts";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { fieldWriteRequestChecksum } from "@/core/studio/fields/runtime-write-contract";
import { completeTicketFormInTransaction, replayTicketFormInTransaction, throwTicketFormReceiptError } from "@/core/service-work/form-receipt";
import { ticketFieldDefaultOperationId } from "@/core/service-work/field-defaults";
import type { FieldFormPacket } from "@/core/studio/fields/form-packet";
import { ticketFormReceiptKey, ticketFormPacketChecksum, ticketFormProcessingOrder, ticketFormReceiptSchema,
  TICKET_FORM_RECEIPT_ACTION, TICKET_FORM_RECEIPT_ENTITY, type TicketFormRequest, type TicketFormResult, type TicketFormReceipt } from "@/core/service-work/form-receipt-contract";

const m = vi.hoisted(() => ({ authority: vi.fn(), lock: vi.fn(), binding: vi.fn(), module: vi.fn(), work: vi.fn(), queue: vi.fn(),
  audit: vi.fn(), occupied: vi.fn(), insert: vi.fn(), definitions: vi.fn(), values: vi.fn(), value: vi.fn(), count: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.authority }));
vi.mock("@/core/studio/fields/entity-lock", () => ({ lockFieldEntitiesInTransaction: m.lock }));
vi.mock("@/core/studio/fields/binding", () => ({ assertFieldBinding: m.binding,
  fieldDefinitionKey: (payload: { entity: { id: string }; field: { key: string } }) => `${payload.entity.id}.${payload.field.key}` }));
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tx = { moduleState: { findFirst: m.module }, serviceWorkItem: { findFirst: m.work }, serviceQueueMember: { findFirst: m.queue },
  auditEntry: { findFirst: m.audit, findUnique: m.occupied, create: m.insert }, studioDefinition: { findMany: m.definitions },
  studioFieldValue: { findMany: m.values, findFirst: m.value, count: m.count } } as unknown as Prisma.TransactionClient;
let session: Session, registry: CapabilityRegistry, request: TicketFormRequest, result: TicketFormResult, receipt: TicketFormReceipt | null;
let definitions: { id: string; organisationId: string; key: string; revision: number; activeVersionId: string; retiredAt: null; activeVersion: StudioDefinitionVersion }[];
type ValueRow = StudioFieldValue & { schemaVersion: StudioDefinitionVersion; slot: { id: string; definitionId: string; generationId: string;
  organisationId: string; entityId: string; extensionId: string; activeValueId: string; revision: number;
  extension: { id: string; organisationId: string; entityId: string; recordId: string; revision: number } } };
let values: ValueRow[], audits: Map<string, { before: unknown; after: unknown }>, native: { id: string; organisationId: string; kind: string;
  requesterUserId: string; version: number; queueId: string; queue: { restricted: boolean } };
const authorCaps = ["tickets.ticket.create", "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.read", "tickets.field.write"];

// Real registry, compilers, sealed metadata and codecs. Genuine authority,
// transaction storage and private/native visibility are bounded collaborators;
// these tests do NOT establish SQL trigger, actual INSERT or commit atomicity.
beforeEach(() => {
  vi.resetAllMocks(); receipt = null; definitions = []; values = []; audits = new Map();
  session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", organisationId: "company", organisationName: "Company",
    membershipId: "member", capabilities: new Set(authorCaps) };
  registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
  request = { operation: "create", nativeRequestChecksum: checksum({ subject: "Original native request" }), packet: { schemaVersion: 1,
    operationId: uuid(1), manifestChecksum: "b".repeat(64), extensionRevision: null, fields: [] } };
  result = { recordId: "native", recordRevision: 1, fieldRecordRevision: 1 };
  native = { id: "native", organisationId: "company", kind: "TICKET", requesterUserId: "actor", version: 1, queueId: "queue", queue: { restricted: true } };
  m.authority.mockImplementation(async () => ({ session, registry, transaction: tx, stamp: { userId: "actor", organisationId: "company", membershipId: "member", authVersion: 1, sessionVersion: 1 } }));
  m.module.mockResolvedValue({ id: "tickets-state" }); m.queue.mockResolvedValue({ id: "queue-member" });
  m.work.mockImplementation(async input => !session.capabilities.has("tickets.ticket.read") && input.where.AND ? null : native);
  m.occupied.mockResolvedValue(null); m.count.mockResolvedValue(0);
  m.audit.mockImplementation(async input => input.where.id ? receipt && { id: input.where.id, organisationId: "company", actorUserId: "actor",
    action: TICKET_FORM_RECEIPT_ACTION, entityType: TICKET_FORM_RECEIPT_ENTITY, entityId: receipt.recordId, before: null, after: receipt } : audits.get(input.where.entityId));
  m.insert.mockImplementation(async input => { receipt = input.data.after; return { id: input.data.id }; });
  m.definitions.mockImplementation(async () => definitions); m.values.mockImplementation(async () => values);
  m.value.mockImplementation(async input => values.find(row => row.id === input.where.id));
  vi.spyOn(registry, "authoriseRecord").mockImplementation(async (_, __, input) => ({ recordId: (input as { recordId: string }).recordId, organisationId: "company", revision: 8 }));
});

async function addField(n: number, conditional = false, reference = false) {
  const metadata = registry.describe("tickets.ticket", 9), entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(100 + n), field: { key: `field_${n}`, label: `Field ${n}`,
    classification: "confidential", readCapability: "tickets.field.read", writeCapability: "tickets.field.write",
    storage: reference ? { type: "reference", entity } : { type: "string" } } });
  const compiled = conditional ? await compileConditionalCustomField({ session, registry, definitionId: uuid(10 + n),
    resolveMetadata: async fact => registeredRequiredFactMetadata(session, registry, entity, fact.kind === "native" ? fact.fieldId : "status") },
  { ...payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } })
    : await compileCustomField(session, payload, registry);
  const version: StudioDefinitionVersion = { id: uuid(200 + n), organisationId: "company", definitionId: uuid(10 + n), version: 1, semanticVersion: "1.0.0",
    schemaVersion: compiled.plan.schemaVersion, payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue,
    checksum: compiled.checksum, createdBy: "author", publishedAt: new Date() };
  definitions.push({ id: version.definitionId, organisationId: "company", key: `tickets.ticket.field_${n}`, revision: 2, activeVersionId: version.id, retiredAt: null, activeVersion: version });
  request.packet.fields.push({ operationId: uuid(300 + n), definitionId: version.definitionId, definitionRevision: 2, versionId: version.id, generationId: payload.storageGeneration,
    slotRevision: null, valueRevision: null, value: { type: reference ? "reference" : "string", value: reference ? "original_reference" : `Value ${n}` } });
  const encoded = encodeFieldValue(payload.field, reference ? "original_reference" : `Value ${n}`), slotId = uuid(400 + n), extensionId = uuid(500);
  values.push({ ...encoded, id: uuid(300 + n), organisationId: "company", definitionId: version.definitionId, generationId: payload.storageGeneration,
    versionId: version.id, slotId, revision: 1, createdBy: "actor", createdAt: new Date(), schemaVersion: version,
    jsonValue: null, slot: { id: slotId, definitionId: version.definitionId, generationId: payload.storageGeneration, organisationId: "company", entityId: "tickets.ticket",
      extensionId, activeValueId: uuid(300 + n), revision: 1, extension: { id: extensionId, organisationId: "company", entityId: "tickets.ticket", recordId: "native", revision: 0 } } });
}
function prepareAudits(entries = request.packet.fields) {
  for (const [index, entry] of ticketFormProcessingOrder({ ...request.packet, fields: entries }).entries()) {
    const row = values.find(row => row.id === entry.operationId)!;
    row.slot.extension.revision = (request.packet.extensionRevision ?? 0) + values.length;
    const extensionRevision = index === 0 ? request.packet.extensionRevision : (request.packet.extensionRevision ?? 0) + index;
    const before = { definitionRevision: entry.definitionRevision, recordRevision: result.fieldRecordRevision, extensionRevision,
      slotRevision: entry.slotRevision, valueRevision: entry.valueRevision };
    const original = { ...entry, ...before, recordId: result.recordId, value: entry.value?.value ?? null };
    audits.set(row.id, { before, after: { requestChecksum: fieldWriteRequestChecksum(original, row.fingerprint), fingerprint: row.fingerprint, versionId: row.versionId,
      generationId: row.generationId, extensionId: row.slot.extensionId, extensionRevision: (request.packet.extensionRevision ?? 0) + index + 1,
      slotId: row.slot.id, slotRevision: 1, valueRevision: 1 } });
  }
}
const complete = (defaults: FieldFormPacket["fields"] = []) => completeTicketFormInTransaction(session, tx, request, result, defaults);
const replay = () => replayTicketFormInTransaction(session, tx, request);

it("records and replays exact create-only intent without native Read, returned values, condition evaluation or new effects", async () => {
  await addField(2, true); await addField(1); request.packet.fields.reverse(); prepareAudits();
  session.capabilities = new Set(["tickets.ticket.create", "tickets.field.read", "tickets.field.write"]);
  const queries = vi.spyOn(registry, "invokeQueryInTransaction");
  expect(await complete()).toEqual({ recordId: "native", recordRevision: 1, replayed: false });
  expect(receipt?.fields.map(field => field.definitionId)).toEqual(ticketFormProcessingOrder(request.packet).map(field => field.definitionId));
  expect(receipt?.packetChecksum).toBe(checksum(request.packet));
  expect(m.insert).toHaveBeenCalledWith({ data: expect.objectContaining({ id: ticketFormReceiptKey(request.packet.operationId), action: TICKET_FORM_RECEIPT_ACTION, entityType: TICKET_FORM_RECEIPT_ENTITY }) });
  expect(await replay()).toEqual({ recordId: "native", recordRevision: 1, replayed: true });
  expect(m.work.mock.calls.every(([arg]) => arg.where.requesterUserId === "actor" && !arg.where.AND)).toBe(true);
  expect(m.insert).toHaveBeenCalledTimes(1); expect(queries).not.toHaveBeenCalled(); expect(registry.authoriseRecord).not.toHaveBeenCalled();
});
it("supports both active→final and reopen-after-CAS field staging baselines without replaying the transition", async () => {
  request = { ...request, operation: "update", recordId: "native", recordRevision: 7 }; result = { recordId: "native", recordRevision: 8, fieldRecordRevision: 8 };
  native.version = 8; await addField(1); prepareAudits();
  expect(await complete()).toMatchObject({ replayed: false }); expect(receipt?.fieldRecordRevision).toBe(8);
  native.version = 12; values[0].slot.activeValueId = uuid(900); values[0].slot.revision = 4; values[0].slot.extension.revision = 5;
  expect(await replay()).toMatchObject({ replayed: true, recordRevision: 8 });
  receipt = null; result.fieldRecordRevision = 7; native.version = 8; values[0].slot.activeValueId = values[0].id; values[0].slot.revision = 1; prepareAudits();
  expect(await complete()).toMatchObject({ replayed: false }); expect(m.insert.mock.calls.at(-1)?.[0].data.after.fieldRecordRevision).toBe(7);
});
it("empty packet still records one native operation and exact receipt, with no typed field query", async () => {
  expect(await replay()).toBeNull(); expect(await complete()).toMatchObject({ replayed: false }); expect(await replay()).toMatchObject({ replayed: true });
  expect(m.definitions).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
});
it.each(["native", "manifest", "order", "value", "partial", "revision", "field_operation"])("rejects changed %s request before native or typed inspection/effects", async mode => {
  await addField(1); await addField(2); prepareAudits(); await complete(); vi.clearAllMocks();
  if (mode === "native") request.nativeRequestChecksum = "c".repeat(64);
  if (mode === "manifest") request.packet.manifestChecksum = "d".repeat(64);
  if (mode === "order") request.packet.fields.reverse();
  if (mode === "value") request.packet.fields[0].value = { type: "string", value: "Changed" };
  if (mode === "partial") request.packet.fields.pop();
  if (mode === "revision") request.packet.extensionRevision = 1;
  if (mode === "field_operation") request.packet.fields[0].operationId = uuid(999);
  await expect(replay()).rejects.toThrow("CONFLICT:"); expect(m.work).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled(); expect(m.insert).not.toHaveBeenCalled();
});
it.each(["actor", "tenant", "action", "entity", "result", "baseline"])("rejects retained %s receipt corruption before owner access", async mode => {
  await complete(); vi.clearAllMocks();
  if (mode === "actor") receipt!.actorUserId = "foreign";
  if (mode === "tenant") receipt!.organisationId = "foreign";
  if (mode === "result") receipt!.recordId = "foreign";
  if (mode === "baseline") receipt!.fieldRecordRevision = 2;
  if (mode === "action" || mode === "entity" || mode === "result") m.audit.mockImplementation(async input => ({ id: input.where.id,
    organisationId: "company", actorUserId: "actor", action: mode === "action" ? "foreign" : TICKET_FORM_RECEIPT_ACTION,
    entityType: mode === "entity" ? "foreign" : TICKET_FORM_RECEIPT_ENTITY, entityId: "native", before: null, after: receipt }));
  await expect(replay()).rejects.toThrow("CONFLICT:"); expect(m.work).not.toHaveBeenCalled();
});
it("denies occupied foreign/global keys and partial field operations before any owning effects", async () => {
  m.occupied.mockResolvedValue({ id: ticketFormReceiptKey(request.packet.operationId) }); await expect(replay()).rejects.toThrow("CONFLICT:");
  m.occupied.mockResolvedValue(null); await addField(1); m.count.mockResolvedValue(1); await expect(replay()).rejects.toThrow("CONFLICT:");
  expect(m.work).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled(); expect(m.insert).not.toHaveBeenCalled();
});
it.each(["create", "read", "write", "module", "stamp"])("refreshes current %s denial before protected typed columns", async mode => {
  await addField(1); prepareAudits(); await complete(); vi.clearAllMocks();
  if (mode === "create") session.capabilities.delete("tickets.ticket.create");
  if (mode === "read") session.capabilities.delete("tickets.field.read");
  if (mode === "write") session.capabilities.delete("tickets.field.write");
  if (mode === "module") m.module.mockResolvedValue(null);
  if (mode === "stamp") m.authority.mockRejectedValue(new Error("FORBIDDEN: current authenticated company access is required."));
  await expect(replay()).rejects.toThrow(/FORBIDDEN|DEPENDENCY_BROKEN/); expect(m.value).not.toHaveBeenCalled(); expect(m.insert).not.toHaveBeenCalled();
  if (mode === "create" || mode === "module" || mode === "stamp") expect(m.audit).not.toHaveBeenCalled();
});
it("rechecks original reference target despite overwrite and denies revoked reference visibility", async () => {
  await addField(1, false, true); prepareAudits(); await complete(); values[0].slot.activeValueId = uuid(900); values[0].slot.revision = 3;
  vi.mocked(registry.authoriseRecord).mockRejectedValue(new Error("Ticket unavailable."));
  m.value.mockClear();
  await expect(replay()).rejects.toThrow("Ticket unavailable");
  expect(m.value).not.toHaveBeenCalled();
  expect(registry.authoriseRecord).toHaveBeenLastCalledWith(expect.objectContaining({ session, transaction: tx }), expect.objectContaining({ id: "tickets.ticket" }),
    { recordId: "original_reference", intent: "read" });
  expect(m.insert).toHaveBeenCalledTimes(1);
});
it("requires independent current field grants even when written metadata retained old grants", async () => {
  await addField(1); prepareAudits(); await complete();
  const old = definitions[0].activeVersion, payload = customFieldPayloadSchema.parse(old.payload);
  const compiled = await compileCustomField({ ...session, capabilities: new Set([...session.capabilities, "tickets.field.current"]) },
    { ...payload, field: { ...payload.field, writeCapability: "tickets.field.current" } }, registry);
  definitions[0].activeVersion = { ...old, id: uuid(999), payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  definitions[0].activeVersionId = uuid(999);
  await expect(replay()).rejects.toThrow("tickets.field.current");
});
it("requires retained written field grants after the current policy becomes less restrictive", async () => {
  await addField(1); prepareAudits(); await complete();
  const old = definitions[0].activeVersion, payload = customFieldPayloadSchema.parse(old.payload);
  const field = { ...payload.field }; delete field.writeCapability;
  const compiled = await compileCustomField(session, { ...payload, field }, registry);
  definitions[0].activeVersion = { ...old, id: uuid(999), payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  definitions[0].activeVersionId = uuid(999); session.capabilities.delete("tickets.field.write");
  m.value.mockClear(); await expect(replay()).rejects.toThrow("tickets.field.write"); expect(m.value).not.toHaveBeenCalled();
});
it("denies retired submitted definitions and altered native creator without reminting creation authority", async () => {
  await addField(1); prepareAudits(); await complete();
  const retained = definitions; definitions = []; await expect(replay()).rejects.toThrow("CONFLICT");
  definitions = retained; native.requesterUserId = "foreign"; await expect(replay()).rejects.toThrow("CONFLICT");
  expect(m.insert).toHaveBeenCalledTimes(1);
});
it.each(["queue", "read", "manage"])("update replay requires current %s authority without terminal Extend", async mode => {
  request = { ...request, operation: "update", recordId: "native", recordRevision: 7 }; result = { recordId: "native", recordRevision: 8, fieldRecordRevision: 7 }; native.version = 8;
  await complete();
  if (mode === "queue") m.queue.mockResolvedValue(null);
  if (mode === "read") session.capabilities.delete("tickets.ticket.read");
  if (mode === "manage") session.capabilities.delete("tickets.ticket.manage");
  await expect(replay()).rejects.toThrow(/FORBIDDEN|CONFLICT/); expect(m.insert).toHaveBeenCalledTimes(1);
});
it.each(["written", "value", "source_record", "slot", "audit", "result"])("completion rejects mismatched actual %s anchors", async mode => {
  await addField(1); prepareAudits();
  if (mode === "written") values[0].schemaVersion = { ...values[0].schemaVersion, checksum: "f".repeat(64) };
  if (mode === "value") values[0].textValue = "Corrupt";
  if (mode === "source_record") values[0].slot.extension.recordId = "foreign";
  if (mode === "slot") values[0].slot.activeValueId = uuid(999);
  if (mode === "audit") audits.set(values[0].id, { before: {}, after: {} });
  if (mode === "result") native.version = 2;
  await expect(complete()).rejects.toThrow(/CONFLICT|FIELD_STORAGE_INVALID/); expect(m.insert).not.toHaveBeenCalled();
});
it("preflights ALL current/written fields before any protected value columns", async () => {
  await addField(1); await addField(2); prepareAudits(); definitions[1].activeVersion = { ...definitions[1].activeVersion, checksum: "f".repeat(64) };
  await expect(complete()).rejects.toThrow("FIELD_STORAGE_INVALID"); expect(m.value).not.toHaveBeenCalled();
  expect(m.values).toHaveBeenCalledWith(expect.objectContaining({ select: expect.not.objectContaining({ textValue: true, referenceValue: true }) }));
  expect(m.values.mock.calls[0][0].select).not.toHaveProperty("fingerprint");
  expect(m.values.mock.calls[0][0].select.slot.select).not.toHaveProperty("uniqueToken");
});
it("casefolds receipt keys and field identities while retaining exact transport fingerprint", async () => {
  request.packet.operationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa".toUpperCase();
  await complete(); expect(m.insert.mock.calls[0][0].data.id).toBe("studio-ticket-form:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  const hash = receipt!.packetChecksum; request.packet.operationId = request.packet.operationId.toLowerCase();
  expect(ticketFormPacketChecksum(request.packet)).not.toBe(hash); await expect(replay()).rejects.toThrow("CONFLICT");
});
it("receipt schema rejects new keys, unsorted/duplicate identities and unsupported revision baseline", async () => {
  await addField(1); await addField(2); prepareAudits(); await complete();
  expect(() => ticketFormReceiptSchema.parse({ ...receipt, extra: true })).toThrow();
  expect(() => ticketFormReceiptSchema.parse({ ...receipt, fields: [...receipt!.fields].reverse() })).toThrow();
  expect(() => ticketFormReceiptSchema.parse({ ...receipt, fields: [receipt!.fields[0], receipt!.fields[0]] })).toThrow();
  expect(() => ticketFormReceiptSchema.parse({ ...receipt, fieldRecordRevision: 3 })).toThrow();
});
it.each(["P2002", "P2034", "40001", "40P01"])("propagates %s as conflict without automatically retrying writes", async code => {
  m.insert.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Storage conflict", { clientVersion: "7", code: code.startsWith("P") ? code : "P2010",
    meta: code.startsWith("P") ? undefined : { driverAdapterError: { cause: { originalCode: code } } } }));
  await expect(complete()).rejects.toThrow("CONFLICT"); expect(m.insert).toHaveBeenCalledTimes(1);
});
it("preserves unrelated storage errors and prevents a second completion even for an exact receipt", async () => {
  const unrelated = new Error("Audit storage unavailable"); expect(() => throwTicketFormReceiptError(unrelated)).toThrow(unrelated);
  await complete(); await expect(complete()).rejects.toThrow("CONFLICT"); expect(m.insert).toHaveBeenCalledTimes(1);
});


async function retainedDefault(n: number, reference = false) {
  await addField(n, false, reference);
  const entry = request.packet.fields.pop()!, row = values.at(-1)!, definition = definitions.at(-1)!;
  const payload = customFieldPayloadSchema.parse(row.schemaVersion.payload);
  const compiled = await compileCustomField(session, { ...payload, field: { ...payload.field, defaultValue: entry.value } }, registry);
  const version = { ...row.schemaVersion, payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  definition.activeVersion = version; row.schemaVersion = version;
  entry.operationId = ticketFieldDefaultOperationId(request.packet.operationId, entry.definitionId, entry.versionId);
  row.id = entry.operationId; row.slot.activeValueId = entry.operationId;
  return entry;
}
it.each(["changed", "removed"])("retains server default anchors/raw client fingerprint; retry follows written literal after later %s default", async mode => {
  await addField(2); const defaults = [await retainedDefault(1)]; prepareAudits([...request.packet.fields, ...defaults]);
  const original = ticketFormPacketChecksum(request.packet);
  expect(await complete(defaults)).toMatchObject({ replayed: false }); expect(receipt!.packetChecksum).toBe(original);
  expect(receipt!.fields.map(field => field.defaulted ?? false)).toEqual([true, false]);
  const retained = definitions[1].activeVersion, payload = customFieldPayloadSchema.parse(retained.payload);
  const field = { ...payload.field };
  if (mode === "changed") field.defaultValue = { type: "string", value: "New default" }; else delete field.defaultValue;
  const compiled = await compileCustomField(session, { ...payload, storageGeneration: uuid(998), field }, registry);
  definitions[1].activeVersion = { ...retained, id: uuid(999), payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  definitions[1].activeVersionId = uuid(999); definitions[1].revision += 3;
  values[1].slot.activeValueId = uuid(997); values[1].slot.revision = 4; values[1].slot.extension.revision = 6;
  expect(await replay()).toMatchObject({ replayed: true }); expect(m.insert).toHaveBeenCalledTimes(1);
  expect(values[1].textValue).toBe("Value 1"); expect(ticketFormPacketChecksum(request.packet)).toBe(original);
});
it.each(["operation", "literal", "duplicate", "update", "written_checksum", "retained_origin"])("denies corrupted %s default origin/anchors without a new effect", async mode => {
  const defaults = [await retainedDefault(1)]; prepareAudits(defaults);
  if (mode === "operation") { defaults[0].operationId = uuid(999); values[0].id = uuid(999); }
  if (mode === "literal") defaults[0].value = { type: "string", value: "Forged" };
  if (mode === "duplicate") request.packet.fields.push(defaults[0]);
  if (mode === "update") { request = { ...request, operation: "update", recordId: "native", recordRevision: 1 }; result = { recordId: "native", recordRevision: 2, fieldRecordRevision: 1 }; native.version = 2; }
  if (mode === "written_checksum") values[0].schemaVersion = { ...values[0].schemaVersion, checksum: "f".repeat(64) };
  if (mode === "retained_origin") {
    await complete(defaults); delete receipt!.fields[0].defaulted;
    await expect(replay()).rejects.toThrow("CONFLICT"); expect(m.insert).toHaveBeenCalledTimes(1); return;
  }
  await expect(complete(defaults)).rejects.toThrow(); expect(m.insert).not.toHaveBeenCalled();
});
it.each(["current", "written", "reference"])("rechecks independent %s rights for a default retry before a new operation", async mode => {
  const defaults = [await retainedDefault(1, mode === "reference")]; prepareAudits(defaults); await complete(defaults);
  const retained = definitions[0].activeVersion, payload = customFieldPayloadSchema.parse(retained.payload);
  if (mode !== "reference") {
    const field = { ...payload.field };
    if (mode === "current") field.writeCapability = "tickets.field.current"; else delete field.writeCapability;
    const compiled = await compileCustomField({ ...session, capabilities: new Set([...session.capabilities, "tickets.field.current"]) }, { ...payload, field }, registry);
    definitions[0].activeVersion = { ...retained, id: uuid(999), payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
    definitions[0].activeVersionId = uuid(999); if (mode === "written") session.capabilities.delete("tickets.field.write");
  } else vi.mocked(registry.authoriseRecord).mockRejectedValue(new Error("Reference unavailable."));
  m.value.mockClear(); await expect(replay()).rejects.toThrow(mode === "reference" ? "Reference unavailable" : "tickets.field.");
  expect(m.value).not.toHaveBeenCalled(); expect(m.insert).toHaveBeenCalledTimes(1);
});
