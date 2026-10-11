import { beforeEach, expect, it, vi } from "vitest";
import { Prisma, type ServiceWorkItem, type StudioDefinitionVersion, type StudioExtensionRecord, type StudioFieldSlot, type StudioFieldValue } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), states: vi.fn(), enabled: vi.fn(), nativeCreate: vi.fn(), nativeRow: vi.fn(), transaction: vi.fn(),
  definition: vi.fn(), generation: vi.fn(), extension: vi.fn(), extensionCreate: vi.fn(), extensionUpdate: vi.fn(), slot: vi.fn(), slotCreate: vi.fn(), slotUpdate: vi.fn(),
  existing: vi.fn(), valueCreate: vi.fn(), audit: vi.fn(), findAudit: vi.fn(), window: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const { ticketStudioContract } = await import("@/core/service-work/studio");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => { const registry = new CapabilityRegistry(available); registry.register("tickets", ticketStudioContract); return registry; } };
});
vi.mock("@/core/studio/fields/runtime-write-window", () => ({ closeAffectedFieldWriteWindows: m.window }));
import { sessionForUser } from "@/core/auth/session";
import { createTicketWithFieldInitialisation, authoriseNewTicketFields } from "@/core/service-work/studio-create";
import { compileCustomFieldForInitialisation } from "@/core/studio/compiler/fields";
import { initialiseFieldValueInTransaction } from "@/core/studio/fields/runtime-write";
import { type FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { type FieldWriteRequest } from "@/core/studio/fields/runtime-write-contract";
import { customFieldPayloadSchema, type CustomFieldPayload } from "@/core/studio/fields/schema";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

// Genuine authenticated sessions, registered owner/compiler and real live WeakMap
// INSERT proofs; storage/window collaborators are unit stubs. These tests prove
// authorization, guard ordering, CAS/replay and failure propagation, not SQL atomic
// rollback, PostgreSQL concurrency or complete migration-window integration.
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company }, moduleState: { findMany: m.states, findFirst: m.enabled },
  serviceWorkItem: { create: m.nativeCreate, findFirst: m.nativeRow }, studioDefinition: { findFirst: m.definition }, studioFieldGeneration: { findFirst: m.generation },
  studioExtensionRecord: { findFirst: m.extension, create: m.extensionCreate, updateMany: m.extensionUpdate }, studioFieldSlot: { findFirst: m.slot, create: m.slotCreate, updateMany: m.slotUpdate },
  studioFieldValue: { findFirst: m.existing, create: m.valueCreate }, auditEntry: { create: m.audit, findFirst: m.findAudit } } as unknown as Prisma.TransactionClient;
const data: Prisma.ServiceWorkItemUncheckedCreateInput = { organisationId: "company", kind: "TICKET", requesterUserId: "actor", queueId: "queue", number: "TKT-1", subject: "Created" };
const work = { ...data, id: "new", version: 1, status: "NEW", mergedIntoId: null, priority: "HIGH" } as unknown as ServiceWorkItem;
const member = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true, grantedCapabilities: ["tickets.ticket.create"], deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
let current: StudioDefinitionVersion, payload: CustomFieldPayload, request: FieldWriteRequest;
let extension: StudioExtensionRecord | null, slot: StudioFieldSlot | null;
let value: StudioFieldValue;
let definitionRevision: number;
beforeEach(() => {
  vi.resetAllMocks(); current = undefined!; extension = null; slot = null; definitionRevision = 5;
  m.member.mockImplementation(async () => structuredClone(member()));
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  m.company.mockResolvedValue({ id: "company" }); m.states.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }]); m.enabled.mockResolvedValue({ id: "enabled" });
  m.nativeCreate.mockResolvedValue(work); m.nativeRow.mockResolvedValue(work);
  m.definition.mockImplementation(async () => ({ id: request.definitionId, organisationId: "company", kind: "customField", key: `tickets.ticket.${payload.field.key}`,
    revision: definitionRevision, activeVersionId: current.id, activeVersion: current, retiredAt: null }));
  m.generation.mockImplementation(async ({ where }) => ({ id: where.id })); m.extension.mockImplementation(async () => extension); m.existing.mockResolvedValue(null);
  m.extensionCreate.mockImplementation(async ({ data: values }) => extension = { ...values, id: uuid(20), revision: 0, createdAt: new Date() });
  m.extensionUpdate.mockImplementation(async ({ data: values }) => { if (extension) extension = { ...extension, revision: values.revision }; return { count: 1 }; });
  m.slot.mockImplementation(async () => slot);
  m.slotCreate.mockImplementation(async ({ data: values }) => slot = { ...values, id: uuid(30), revision: 0, activeValueId: null, uniqueToken: null });
  m.slotUpdate.mockImplementation(async ({ data: values }) => { if (slot) slot = { ...slot, ...values }; return { count: 1 }; });
  m.valueCreate.mockImplementation(async ({ data: values }) => value = { ...values, jsonValue: null, createdAt: new Date() }); m.audit.mockResolvedValue({ id: "audit" });
});
async function owning(operation: (authority: FieldRuntimeAuthority, proof: object) => Promise<unknown>) {
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("Missing fixture actor.");
  return createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _created, proof) => operation(authority, proof));
}
async function setup(authority: FieldRuntimeAuthority, field: Partial<CustomFieldPayload["field"]> = {}, suffix = 0) {
  const { id, version, schemaHash, contractHash } = authority.registry.describe("tickets.ticket", 2);
  payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: { id, version, schemaHash, contractHash }, storageGeneration: uuid(90 + suffix),
    field: { key: suffix ? "other" : "extra", label: "Additional detail", classification: "confidential", storage: { type: "integer" }, ...field } });
  const compiled = await compileCustomFieldForInitialisation({ ...authority.session, capabilities: new Set([...authority.session.capabilities, "tickets.field.read", "tickets.field.write", "tickets.ticket.read"]) }, payload, authority.registry, "write");
  current = { id: uuid(10 + suffix), definitionId: uuid(1 + suffix), organisationId: "company", version: 1, semanticVersion: "1.0.0", schemaVersion: 1,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() };
  payload = compiled.payload;
  request = { operationId: uuid(60 + suffix), definitionId: current.definitionId, versionId: current.id, generationId: payload.storageGeneration,
    definitionRevision, recordId: "new", recordRevision: 1, extensionRevision: extension?.revision ?? null, slotRevision: null, valueRevision: null, value: 0 };
}
function replayRow() {
  if (!slot || !extension) throw new Error("Missing saved fixture.");
  return { ...value, schemaVersion: current, slot: { ...slot, extension } };
}
it("initialises typed zero for an actual create-only actor with paired CAS/Audit and facts before value lookup", async () => {
  await owning(async (authority, proof) => {
    await setup(authority); const ordinary = vi.spyOn(authority.registry, "authoriseRecord");
    const result = await initialiseFieldValueInTransaction(authority, request, proof);
    expect(result).toMatchObject({ replayed: false, valueRevision: 1, slotRevision: 1, extensionRevision: 1 });
    expect(m.valueCreate.mock.calls[0][0].data).toMatchObject({ id: request.operationId, organisationId: "company", versionId: current.id, integerValue: 0n, createdBy: "actor" });
    expect(m.slotUpdate.mock.calls[0][0]).toMatchObject({ where: { organisationId: "company", revision: 0 }, data: { activeValueId: request.operationId, revision: 1 } });
    expect(m.nativeRow.mock.invocationCallOrder[0]).toBeLessThan(m.existing.mock.invocationCallOrder[0]);
    expect(m.window.mock.invocationCallOrder[0]).toBeLessThan(m.valueCreate.mock.invocationCallOrder[0]);
    expect(m.window.mock.calls[0][0]).toBe(authority); expect(m.audit.mock.calls[0][0].data).toMatchObject({ action: "studio.field.value.saved", entityId: request.operationId, after: { requestChecksum: result.requestChecksum } });
    for (const grant of ["tickets.ticket.read", "tickets.ticket.manage", "studio.definition.publish"]) expect(authority.session.capabilities.has(grant)).toBe(false);
    expect(ordinary).not.toHaveBeenCalled(); expect(m.transaction).not.toHaveBeenCalled();
  });
});
it("retains exact extension CAS when another field has initialised the same new record", async () => {
  await owning(async (authority, proof) => {
    await setup(authority); await initialiseFieldValueInTransaction(authority, request, proof);
    slot = null; await setup(authority, { storage: { type: "boolean" } }, 1); request = { ...request, value: false };
    expect(request.extensionRevision).toBe(1);
    expect(await initialiseFieldValueInTransaction(authority, request, proof)).toMatchObject({ extensionRevision: 2, slotRevision: 1 });
    expect(m.valueCreate.mock.calls[1][0].data.booleanValue).toBe(false);
    expect(m.extensionCreate).toHaveBeenCalledTimes(1); expect(m.valueCreate).toHaveBeenCalledTimes(2);
    slot = null; await setup(authority, {}, 2);
    await expect(initialiseFieldValueInTransaction(authority, { ...request, extensionRevision: 1 }, proof)).rejects.toThrow("CONFLICT");
    expect(m.valueCreate).toHaveBeenCalledTimes(2);
  });
});
it("enforces independent field Read and Write before value lookup despite owning Create proof", async () => {
  await owning(async (authority, proof) => {
    for (const field of [{ readCapability: "tickets.field.read" }, { writeCapability: "tickets.field.write" }]) {
      await setup(authority, field);
      await expect(initialiseFieldValueInTransaction(authority, request, proof)).rejects.toThrow("FORBIDDEN");
    }
    expect(m.existing).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled(); expect(m.valueCreate).not.toHaveBeenCalled();
  });
});
it("requires ordinary existing-reference Read without exchanging creation proof for native access", async () => {
  await owning(async (authority, proof) => {
    const { id, version, schemaHash, contractHash } = authority.registry.describe("tickets.ticket", 2), ref = { id, version, schemaHash, contractHash };
    await setup(authority, { storage: { type: "reference", entity: ref } });
    await expect(initialiseFieldValueInTransaction(authority, { ...request, value: "private" }, proof)).rejects.toThrow("FORBIDDEN");
    authority.session.capabilities.add("tickets.ticket.read");
    const ordinary = vi.spyOn(authority.registry, "authoriseRecord").mockRejectedValue(new Error("Ticket unavailable."));
    await expect(initialiseFieldValueInTransaction(authority, { ...request, value: "private" }, proof)).rejects.toThrow("unavailable");
    expect(ordinary).toHaveBeenCalledWith({ session: authority.session, transaction: tx }, payload.field.storage.type === "reference" ? payload.field.storage.entity : ref, { recordId: "private", intent: "read" });
    expect(m.window).not.toHaveBeenCalled(); expect(m.valueCreate).not.toHaveBeenCalled();
  });
});
it("checks actual still-new native state even for schema1 before any value lookup", async () => {
  await owning(async (authority, proof) => {
    await setup(authority);
    for (const changed of [{ ...work, status: "RESOLVED" }, { ...work, version: 2 }, { ...work, requesterUserId: "other" }, { ...work, mergedIntoId: "other" }, { ...work, organisationId: "foreign" }]) {
      m.nativeRow.mockResolvedValue(changed); await expect(initialiseFieldValueInTransaction(authority, request, proof)).rejects.toThrow("unavailable or changed");
    }
    expect(m.existing).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled(); expect(m.valueCreate).not.toHaveBeenCalled();
  });
});
it("rejects copied, absent, foreign-transaction/principal and expired proofs rather than falling back", async () => {
  let retained: object | undefined, savedAuthority: FieldRuntimeAuthority | undefined;
  await owning(async (authority, proof) => {
    await setup(authority); retained = proof; savedAuthority = authority;
    for (const invalid of [{}, { ...proof }, JSON.parse(JSON.stringify(proof)), undefined, null])
      await expect(initialiseFieldValueInTransaction(authority, request, invalid as object)).rejects.toThrow("FORBIDDEN");
    await expect(initialiseFieldValueInTransaction({ ...authority, transaction: { ...tx } }, request, proof)).rejects.toThrow("FORBIDDEN");
    await expect(initialiseFieldValueInTransaction({ ...authority, session: { ...authority.session } }, request, proof)).rejects.toThrow("FORBIDDEN");
    expect(m.existing).not.toHaveBeenCalled(); expect(m.valueCreate).not.toHaveBeenCalled();
  });
  await expect(initialiseFieldValueInTransaction(savedAuthority!, request, retained!)).rejects.toThrow("FORBIDDEN");
});
it("closes client shape and requires exact native/current published metadata and fresh slot revisions", async () => {
  await owning(async (authority, proof) => {
    await setup(authority);
    for (const patch of [{ organisationId: "foreign" }, { proof }, { nativePatch: {} }, { recordRevision: 2 }, { slotRevision: 0 }, { valueRevision: 1 },
      { definitionRevision: 4 }, { versionId: uuid(99) }, { generationId: uuid(98) }, { recordId: "existing" }])
      await expect(initialiseFieldValueInTransaction(authority, { ...request, ...patch }, proof)).rejects.toThrow();
    expect(m.existing).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled(); expect(m.valueCreate).not.toHaveBeenCalled();
  });
});
it("rejects any occupied field slot and preserves typed null/required and uniqueness constraints", async () => {
  await owning(async (authority, proof) => {
    await setup(authority); await initialiseFieldValueInTransaction(authority, request, proof);
    await expect(initialiseFieldValueInTransaction(authority, { ...request, operationId: uuid(61), extensionRevision: 1 }, proof)).rejects.toThrow("CONFLICT");
    slot = null; await setup(authority, { required: true }, 1);
    await expect(initialiseFieldValueInTransaction(authority, { ...request, value: null }, proof)).rejects.toThrow("required");
    await setup(authority, { unique: true }, 1); const result = await initialiseFieldValueInTransaction(authority, request, proof);
    expect(m.slotUpdate.mock.calls.at(-1)?.[0].data.uniqueToken).toBe(result.fingerprint);
    slot = null; await setup(authority, {}, 2);
    await initialiseFieldValueInTransaction(authority, { ...request, value: null }, proof);
    expect(m.valueCreate.mock.calls.at(-1)?.[0].data).toMatchObject({ isNull: true, integerValue: null });
  });
});
it("replays only the exact live-proved current slot operation, allowing later other-field extension revisions", async () => {
  await owning(async (authority, proof) => {
    await setup(authority); const firstRequest = request, result = await initialiseFieldValueInTransaction(authority, request, proof), savedRow = replayRow();
    extension = { ...extension!, revision: 4 }; m.existing.mockResolvedValue(savedRow);
    const { operationId: _operationId, replayed: _replayed, ...after } = result; void [_operationId, _replayed]; m.findAudit.mockResolvedValue({ after });
    m.valueCreate.mockClear(); m.window.mockClear(); m.audit.mockClear();
    expect(await initialiseFieldValueInTransaction(authority, firstRequest, proof)).toEqual({ ...result, replayed: true });
    await expect(initialiseFieldValueInTransaction(authority, { ...firstRequest, value: 1 }, proof)).rejects.toThrow("CONFLICT");
    for (const patch of [{ createdBy: "other" }, { slot: { ...savedRow.slot, activeValueId: uuid(88) } }, { slot: { ...savedRow.slot, revision: 2 } },
      { slot: { ...savedRow.slot, organisationId: "foreign" } }, { slot: { ...savedRow.slot, generationId: uuid(89) } }, { slot: { ...savedRow.slot, id: uuid(87) } }]) {
      m.existing.mockResolvedValue({ ...savedRow, ...patch }); await expect(initialiseFieldValueInTransaction(authority, firstRequest, proof)).rejects.toThrow("CONFLICT");
    }
    m.existing.mockResolvedValue(savedRow);
    m.findAudit.mockResolvedValue(null);
    await expect(initialiseFieldValueInTransaction(authority, firstRequest, proof)).rejects.toThrow("CONFLICT");
    m.findAudit.mockResolvedValue({ after: { ...after, requestChecksum: "f".repeat(64) } });
    await expect(initialiseFieldValueInTransaction(authority, firstRequest, proof)).rejects.toThrow("CONFLICT");
    m.findAudit.mockResolvedValue({ after }); definitionRevision++;
    await expect(initialiseFieldValueInTransaction(authority, firstRequest, proof)).rejects.toThrow("CONFLICT");
    expect(m.valueCreate).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  });
});
it("rejects missing/foreign/drifted published schema before stored value access", async () => {
  await owning(async (authority, proof) => {
    await setup(authority); const retained = current;
    m.definition.mockResolvedValueOnce(null);
    await expect(initialiseFieldValueInTransaction(authority, request, proof)).rejects.toThrow("FIELD_UNAVAILABLE");
    for (const patch of [{ organisationId: "foreign" }, { definitionId: uuid(99) }, { checksum: "f".repeat(64) }]) {
      current = { ...retained, ...patch };
      await expect(initialiseFieldValueInTransaction(authority, request, proof)).rejects.toThrow("FIELD_STORAGE_INVALID");
    }
    expect(m.existing).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled(); expect(m.valueCreate).not.toHaveBeenCalled();
  });
});
it("propagates window, value/pointer/Audit failures to the owning INSERT and sanitises unique conflict", async () => {
  for (const stage of ["window", "value", "slot", "extension", "audit", "unique"] as const) {
    let authority: FieldRuntimeAuthority | undefined, retained: object | undefined;
    await expect(owning(async (currentAuthority, proof) => {
      authority = currentAuthority; retained = proof; extension = null; slot = null; await setup(currentAuthority);
      if (stage === "window") m.window.mockRejectedValueOnce(new Error("Window unavailable"));
      if (stage === "value") m.valueCreate.mockRejectedValueOnce(new Error("Value unavailable"));
      if (stage === "slot") m.slotUpdate.mockResolvedValueOnce({ count: 0 });
      if (stage === "extension") m.extensionUpdate.mockResolvedValueOnce({ count: 0 });
      if (stage === "audit") m.audit.mockRejectedValueOnce(new Error("Audit unavailable"));
      if (stage === "unique") m.valueCreate.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("other private value", { code: "P2002", clientVersion: "7" }));
      return initialiseFieldValueInTransaction(currentAuthority, request, proof);
    })).rejects.toThrow(stage === "window" ? "Window unavailable" : stage === "value" ? "Value unavailable" : stage === "audit" ? "Audit unavailable" : "CONFLICT");
    await expect(authoriseNewTicketFields({ session: authority!.session, transaction: tx }, retained!)).rejects.toThrow("FORBIDDEN");
  }
  expect(m.transaction).not.toHaveBeenCalled();
});
it("explicitly blocks genuine sealed conditional initial metadata until owning enforcement exists", async () => {
  await owning(async (authority, proof) => {
    await setup(authority); const { id, version, schemaHash, contractHash } = authority.registry.describe("tickets.ticket", 9), ref = { id, version, schemaHash, contractHash };
    const author = { ...authority.session, capabilities: new Set([...authority.session.capabilities, "tickets.ticket.read", "tickets.ticket.manage"]) };
    const compiled = await compileConditionalCustomField({ session: author, registry: authority.registry, definitionId: current.definitionId,
      resolveMetadata: async fact => fact.kind === "native" ? registeredRequiredFactMetadata(author, authority.registry, ref, fact.fieldId) : Promise.reject(new Error("Unexpected fixture fact")) },
    { ...payload, entity: ref, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
    current = { ...current, schemaVersion: 2, payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
    await expect(initialiseFieldValueInTransaction(authority, request, proof)).rejects.toThrow("conditional initial writes");
    expect(m.existing).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled(); expect(m.valueCreate).not.toHaveBeenCalled();
  });
});
