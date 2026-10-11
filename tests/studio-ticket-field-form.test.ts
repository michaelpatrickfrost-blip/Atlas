import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinitionVersion, StudioFieldBinding, StudioDefinition, StudioExtensionRecord, StudioFieldSlot, StudioFieldValue } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), transaction: vi.fn(), raw: vi.fn(), company: vi.fn(), enabled: vi.fn(), states: vi.fn(),
  bindings: vi.fn(), generation: vi.fn(), extension: vi.fn(), slots: vi.fn(), values: vi.fn(), native: vi.fn(), nativeCreate: vi.fn(), queueMember: vi.fn(), ordinary: vi.fn(), initial: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const { ticketStudioContract } = await import("@/core/service-work/studio");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => { const registry = new CapabilityRegistry(available); registry.register("tickets", ticketStudioContract); return registry; } };
});
vi.mock("@/core/studio/fields/runtime-write", () => ({ writeFieldValueInTransaction: m.ordinary, initialiseFieldValueInTransaction: m.initial }));
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { customFieldPayloadSchema, type CustomFieldPayload, type FieldValue } from "@/core/studio/fields/schema";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { ticketFieldFormManifest, ticketFieldFormManifestInTransaction, stageTicketFieldFormPacket, parseTicketFieldFormPacket } from "@/core/service-work/field-forms";
import type { TicketFieldFormManifest } from "@/core/service-work/field-form-contract";
import { createTicketWithFieldInitialisation, authoriseNewTicketFields } from "@/core/service-work/studio-create";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

// Actual authenticated session stamps, registry/owner/compiler/sealed readers.
// Membership/native/metadata/value SQL and typed writer collaborators are unit
// stubs: no PostgreSQL rollback, concurrency, HTTP or full mutation proof claim.
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company },
  moduleState: { findFirst: m.enabled, findMany: m.states }, serviceWorkItem: { findFirst: m.native, create: m.nativeCreate },
  serviceQueueMember: { findFirst: m.queueMember }, studioFieldBinding: { findMany: m.bindings }, studioFieldGeneration: { findFirst: m.generation },
  studioExtensionRecord: { findFirst: m.extension }, studioFieldSlot: { findMany: m.slots }, studioFieldValue: { findMany: m.values } } as unknown as Prisma.TransactionClient;
type Bound = StudioFieldBinding & { definition: StudioDefinition & { activeVersion: StudioDefinitionVersion | null } };
type Slot = StudioFieldSlot & { activeValue: (StudioFieldValue & { schemaVersion: StudioDefinitionVersion }) | null };
let bound: Bound[], slots: Slot[], values: (StudioFieldValue & { schemaVersion: StudioDefinitionVersion })[];
let grants: string[], restricted: boolean, nativeStatus: string;
let extension: StudioExtensionRecord | null;
beforeEach(() => {
  vi.resetAllMocks(); bound = []; slots = []; values = []; extension = null; restricted = false; nativeStatus = "NEW";
  grants = ["tickets.ticket.create", "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.read", "tickets.field.write"];
  m.member.mockImplementation(async ({ where }) => {
    const { organisationId, userId } = where.organisationId_userId;
    return { id: `${organisationId}-${userId}`, organisationId, userId, active: true, sessionVersion: 2, roles: [], grantedCapabilities: [...grants], deniedCapabilities: [],
      user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
      organisation: { id: organisationId, name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } };
  });
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  m.company.mockImplementation(async ({ where }) => ({ id: where.id, kind: "CUSTOMER" }));
  m.enabled.mockResolvedValue({ id: "enabled" }); m.states.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }]);
  m.bindings.mockImplementation(async () => bound); m.generation.mockImplementation(async ({ where }) => ({ id: where.id }));
  m.extension.mockImplementation(async () => extension); m.slots.mockImplementation(async () => slots); m.values.mockImplementation(async () => values);
  m.native.mockImplementation(async ({ where }) => ({ id: where.AND[1].id, organisationId: where.AND[0].organisationId, version: 7, kind: "TICKET", status: nativeStatus,
    mergedIntoId: null, queueId: "private", queue: { restricted } }));
  m.queueMember.mockResolvedValue({ id: "queue-member" });
  m.nativeCreate.mockImplementation(async ({ data }) => ({ ...data, id: "created", version: 1, status: "NEW", mergedIntoId: null }));
  m.transaction.mockImplementation(async operation => operation(tx));
  m.ordinary.mockImplementation(async (_authority, input) => ({ replayed: false, extensionRevision: (input.extensionRevision ?? 0) + 1 }));
  m.initial.mockImplementation(async (authority, input, proof) => { await authoriseNewTicketFields({ session: authority.session, transaction: authority.transaction }, proof);
    return { replayed: false, extensionRevision: (input.extensionRevision ?? 0) + 1 }; });
});
async function authority(organisationId = "company", userId = "actor") {
  const session = await sessionForUser(organisationId, userId); if (!session) throw new Error("Missing fixture session.");
  expect(sessionAuthorityStamp(session)).not.toBeNull(); return fieldRuntimeAuthorityInTransaction(session, tx);
}
async function field(authority: FieldRuntimeAuthority, n = 1, options: { conditional?: boolean; field?: Partial<CustomFieldPayload["field"]> } = {}) {
  const metadata = authority.registry.describe("tickets.ticket", 9), entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const definitionId = uuid(n), generationId = uuid(100 + n), versionId = uuid(200 + n), organisationId = authority.session.organisationId;
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: generationId,
    field: { key: `extra_${n}`, label: `Extra ${n}`, help: "Guidance", classification: "confidential", storage: { type: "integer" }, ...options.field } });
  const author = { ...authority.session, capabilities: new Set([...authority.session.capabilities, "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.read", "tickets.field.write"]) };
  const compiled = options.conditional ? await compileConditionalCustomField({ session: author, registry: authority.registry, definitionId,
    resolveMetadata: async source => source.kind === "native" ? registeredRequiredFactMetadata(author, authority.registry, entity, source.fieldId)
      : Promise.reject(new Error("Unexpected unit fact.")) }, { ...payload, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } })
    : await compileCustomField(author, payload, authority.registry);
  const version = { id: versionId, definitionId, organisationId, version: 1, semanticVersion: "1.0.0", schemaVersion: compiled.payload.schemaVersion,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue,
    checksum: compiled.checksum, createdBy: "author", publishedAt: new Date() } as StudioDefinitionVersion;
  const definition = { id: definitionId, organisationId, key: `tickets.ticket.${payload.field.key}`, kind: "customField", revision: 3,
    activeVersionId: version.id, activeVersion: version, retiredAt: null } as Bound["definition"];
  const binding = { organisationId, definitionId, entityId: entity.id, fieldKey: payload.field.key, originVersionId: version.id,
    initialGenerationId: generationId, definition } as Bound;
  bound.push(binding); return { binding, version, payload: compiled.payload };
}
function saved(configured: Awaited<ReturnType<typeof field>>, value: unknown = 0) {
  const { definitionId, organisationId, entityId } = configured.binding;
  extension ??= { id: uuid(400), organisationId, entityId, recordId: "first", revision: 4, updatedAt: new Date(), recordTypeAssignmentId: null };
  const row = { id: uuid(600 + values.length), ...encodeFieldValue(configured.payload.field, value), organisationId, definitionId,
    generationId: configured.payload.storageGeneration, slotId: uuid(500 + slots.length), versionId: configured.version.id, revision: 2,
    createdBy: "author", createdAt: new Date(), schemaVersion: configured.version } as StudioFieldValue & { schemaVersion: StudioDefinitionVersion };
  const slot = { id: row.slotId, organisationId, entityId, definitionId, generationId: row.generationId,
    extensionId: extension.id, revision: 2, activeValueId: row.id, uniqueToken: null, activeValue: row };
  slots.push(slot); values.push(row); return { row, slot };
}
function packet(authority: FieldRuntimeAuthority, manifest: TicketFieldFormManifest, selected: Array<{ index: number; value: FieldValue | null }>) {
  return parseTicketFieldFormPacket(authority, JSON.stringify({ schemaVersion: 1, operationId: uuid(999), manifestChecksum: manifest.manifestChecksum,
    extensionRevision: manifest.extensionRevision, fields: selected.map(({ index, value }) => { const control = manifest.fields[index];
      return { operationId: control.operationId, definitionId: control.definitionId, definitionRevision: control.definitionRevision,
        versionId: control.versionId, generationId: control.generationId, slotRevision: control.slotRevision, valueRevision: control.valueRevision, value }; }) }));
}
it("binds identical revisions/configuration to the actual record, company and actor, never random operation IDs", async () => {
  const first = await authority(); await field(first);
  const a = await ticketFieldFormManifestInTransaction(first, { operation: "update", recordId: "first" });
  const again = await ticketFieldFormManifestInTransaction(first, { operation: "update", recordId: "first" });
  const b = await ticketFieldFormManifestInTransaction(first, { operation: "update", recordId: "second" });
  const anotherActor = await ticketFieldFormManifestInTransaction(await authority("company", "other-actor"), { operation: "update", recordId: "first" });
  expect(a && again && b && anotherActor).toBeTruthy();
  expect(a!.manifestChecksum).toBe(again!.manifestChecksum); expect(a!.operationId).not.toBe(again!.operationId);
  expect(a!.manifestChecksum).not.toBe(b!.manifestChecksum); expect(a!.manifestChecksum).not.toBe(anotherActor!.manifestChecksum);
  // Deliberately equal logical UUIDs in separate unit SQL responses isolate the
  // tenant seal component; these are not duplicate persisted database fixtures.
  bound = bound.map(item => ({ ...item, organisationId: "other-company", definition: { ...item.definition, organisationId: "other-company",
    activeVersion: { ...item.definition.activeVersion!, organisationId: "other-company" } } }));
  const anotherCompany = await ticketFieldFormManifestInTransaction(await authority("other-company"), { operation: "update", recordId: "first" });
  expect(a!.manifestChecksum).not.toBe(anotherCompany!.manifestChecksum);
  const wrongRecord = packet(first, a!, [{ index: 0, value: { type: "integer", value: 1 } }]);
  await expect(stageTicketFieldFormPacket(first, b, wrongRecord, "second", 7)).rejects.toThrow("CONFLICT"); expect(m.ordinary).not.toHaveBeenCalled();
});
it("discovers sealed conditional create controls with genuine Create only, without native Read/Manage, proof, facts or private rule DTO", async () => {
  grants = ["tickets.ticket.create"]; const current = await authority(); await field(current, 1, { conditional: true });
  const invoke = vi.spyOn(current.registry, "invokeInitialRecordFacts");
  const form = await ticketFieldFormManifestInTransaction(current, { operation: "create" }); expect(form);
  expect(form!.fields[0]).toMatchObject({ conditionalRequired: true, value: null, slotRevision: null, valueRevision: null });
  for (const grant of ["tickets.ticket.read", "tickets.ticket.manage", "studio.definition.publish"]) expect(current.session.capabilities.has(grant)).toBe(false);
  expect(m.native).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled(); expect(invoke).not.toHaveBeenCalled();
  const dto = JSON.stringify(form); for (const privateKey of ["requiredIf", "predicates", "dependencies", "classification", "readCapability", "writeCapability", "organisationId", "proof"]) expect(dto).not.toContain(privateKey);
  expect(dto).not.toContain("status");
});
it("requires genuine bootstrap, current Read+Manage and receiving-team membership while closed reopen discovery does not waive Extend", async () => {
  const current = await authority(); await field(current); nativeStatus = "RESOLVED"; restricted = true;
  const manifest = await ticketFieldFormManifest(current.session, { operation: "update", recordId: "first" }); expect(manifest);
  await expect(current.registry.authoriseRecord({ session: current.session, transaction: tx }, current.registry.describe("tickets.ticket", 9),
    { recordId: "first", intent: "extend", expectedRevision: 7 })).rejects.toThrow("Reopen");
  m.queueMember.mockResolvedValue(null);
  await expect(ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" })).rejects.toThrow("receiving-team");
  m.queueMember.mockResolvedValue({ id: "member" });
  for (const removed of ["tickets.ticket.read", "tickets.ticket.manage"]) {
    grants = grants.filter(value => value !== removed);
    await expect(ticketFieldFormManifestInTransaction(await authority(), { operation: "update", recordId: "first" })).rejects.toThrow("FORBIDDEN"); grants.push(removed);
  }
  await expect(ticketFieldFormManifest({ ...current.session }, { operation: "update", recordId: "first" })).rejects.toThrow("FORBIDDEN");
});
it("hides current and written restricted fields before any typed column fetch; opaque seal includes hidden active changes", async () => {
  const author = await authority(); const shown = await field(author); const hidden = await field(author, 2, { field: { readCapability: "tickets.field.read" } }); saved(hidden);
  grants = ["tickets.ticket.read", "tickets.ticket.manage"]; const current = await authority();
  const first = await ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" }); expect(first!.fields.map(control => control.definitionId)).toEqual([shown.binding.definitionId]);
  expect(m.values).not.toHaveBeenCalled(); expect(JSON.stringify(first)).not.toContain("Extra 2");
  hidden.binding.definition.revision++;
  const changed = await ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" }); expect(changed!.manifestChecksum).not.toBe(first!.manifestChecksum);
  const written = await field(author, 3, { field: { writeCapability: "tickets.field.write" } }); saved(written);
  // Same valid current identity/storage, stricter retained written policy.
  const { writeCapability: omittedWrite, ...baseField } = written.payload.field; void omittedWrite;
  const plain = await compileCustomField(author.session, { ...written.payload, schemaVersion: 1, field: baseField }, author.registry);
  written.binding.definition.activeVersion = { ...written.version, payload: plain.payload as unknown as Prisma.JsonValue,
    compiledPlan: plain.plan as unknown as Prisma.JsonValue, checksum: plain.checksum };
  const third = await ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" });
  expect(third!.fields.map(control => control.definitionId)).toEqual([shown.binding.definitionId]); expect(m.values).not.toHaveBeenCalled();
});
it("selects only current definition/generation slots and checks written metadata before typed values/reference permissions", async () => {
  const current = await authority(); const active = await field(current, 1, { conditional: true }); const stored = saved(active);
  const result = await ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" });
  expect(result!.fields[0].value).toEqual({ type: "integer", value: 0 });
  expect(m.slots.mock.calls[0][0]).toMatchObject({ where: { organisationId: "company", extensionId: extension!.id,
    OR: [{ definitionId: active.binding.definitionId, generationId: active.payload.storageGeneration }] }, take: 100 });
  expect(m.slots.mock.calls[0][0].select.activeValue.select).not.toHaveProperty("integerValue");
  expect(m.generation.mock.invocationCallOrder[1]).toBeLessThan(m.values.mock.invocationCallOrder[0]);
  const foreign = { ...stored.slot.activeValue!, organisationId: "foreign" }; slots = [{ ...stored.slot, activeValue: foreign }]; m.values.mockClear();
  await expect(ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" })).rejects.toThrow("FIELD_STORAGE_INVALID"); expect(m.values).not.toHaveBeenCalled();
});
it("stages subset/zero/false/null in stable UUID order with advanced shared extension CAS and actual live initial proof", async () => {
  grants = ["tickets.ticket.create"]; const current = await authority();
  await field(current, 3, { field: { storage: { type: "string", minLength: 0, maxLength: 4000, multiline: false } } }); await field(current, 1); await field(current, 2, { field: { storage: { type: "boolean" } } });
  bound.sort((a, b) => a.definitionId.localeCompare(b.definitionId));
  const manifest = await ticketFieldFormManifestInTransaction(current, { operation: "create" }); expect(manifest);
  const submitted = packet(current, manifest!, [{ index: 2, value: null }, { index: 1, value: { type: "boolean", value: false } }, { index: 0, value: { type: "integer", value: 0 } }]);
  await createTicketWithFieldInitialisation({ session: current.session, transaction: tx }, { organisationId: "company", kind: "TICKET", requesterUserId: "actor", queueId: "queue", number: "N", subject: "New" },
    (authority, native, proof) => stageTicketFieldFormPacket(authority, manifest, submitted, native.id, 1, proof));
  expect(m.ordinary).not.toHaveBeenCalled(); expect(m.initial.mock.calls.map(call => call[1])).toMatchObject([
    { definitionId: uuid(1), recordId: "created", recordRevision: 1, extensionRevision: null, value: 0 },
    { definitionId: uuid(2), extensionRevision: 1, value: false }, { definitionId: uuid(3), extensionRevision: 2, value: null }]);
  expect(new Set(m.initial.mock.calls.map(call => call[2])).size).toBe(1);
  const expired = m.initial.mock.calls[0][2]; await expect(authoriseNewTicketFields({ session: current.session, transaction: tx }, expired)).rejects.toThrow("FORBIDDEN");
  m.ordinary.mockClear(); grants = ["tickets.ticket.read", "tickets.ticket.manage"];
  const editor = await authority(), editManifest = await ticketFieldFormManifestInTransaction(editor, { operation: "update", recordId: "existing" }); expect(editManifest);
  const subset = packet(editor, editManifest!, [{ index: 1, value: { type: "boolean", value: false } }]);
  await stageTicketFieldFormPacket(editor, editManifest, subset, "existing", 8);
  expect(m.ordinary).toHaveBeenCalledTimes(1); expect(m.ordinary.mock.calls[0][1]).toMatchObject({ definitionId: uuid(2), recordRevision: 8, extensionRevision: null, value: false });
});
it("rejects stale/unknown metadata, type and shared CAS without silently accepting per-field replay; propagates staged writer failure", async () => {
  const current = await authority(); await field(current); const manifest = await ticketFieldFormManifestInTransaction(current, { operation: "create" }); expect(manifest);
  const valid = packet(current, manifest!, [{ index: 0, value: { type: "integer", value: 0 } }]);
  for (const patch of [{ manifestChecksum: "f".repeat(64) }, { extensionRevision: 1 }])
    await expect(stageTicketFieldFormPacket(current, manifest, { ...valid, ...patch }, "existing", 7)).rejects.toThrow("CONFLICT");
  for (const patch of [{ definitionId: uuid(98) }, { definitionRevision: 4 }, { versionId: uuid(99) }, { generationId: uuid(97) }, { slotRevision: 1 },
    { valueRevision: 1 }, { value: { type: "boolean" as const, value: false } }])
    await expect(stageTicketFieldFormPacket(current, manifest, { ...valid, fields: [{ ...valid.fields[0], ...patch }] }, "existing", 7)).rejects.toThrow("CONFLICT");
  expect(m.ordinary).not.toHaveBeenCalled();
  m.ordinary.mockResolvedValue({ replayed: true, extensionRevision: 1 }); await expect(stageTicketFieldFormPacket(current, manifest, valid, "existing", 7)).rejects.toThrow("CONFLICT");
  const failure = new Error("Paired value Audit unavailable"); m.ordinary.mockRejectedValue(failure);
  await expect(stageTicketFieldFormPacket(current, manifest, valid, "existing", 7)).rejects.toBe(failure);
  // Final native all-active validation and transaction rollback remain caller
  // obligations. This helper neither waives hidden requireds nor claims commit.
});

it("does not return private referenced values and denies unavailable owner/configuration before typed column lookup", async () => {
  const current = await authority(), metadata = current.registry.describe("tickets.ticket", 9);
  const ref = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const configured = await field(current, 1, { field: { storage: { type: "reference", entity: ref } } }); saved(configured, "private-target");
  const nativeQuery = m.native.getMockImplementation()!;
  m.native.mockImplementation(async input => input.where.AND[1].id === "private-target" ? null : nativeQuery(input));
  await expect(ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" })).rejects.toThrow("Ticket unavailable");
  m.values.mockClear(); m.enabled.mockResolvedValue(null);
  await expect(ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" })).rejects.toThrow("DEPENDENCY_BROKEN"); expect(m.values).not.toHaveBeenCalled();
  m.enabled.mockResolvedValue({ id: "enabled" }); configured.binding.definition.activeVersion = { ...configured.version, checksum: "f".repeat(64) };
  await expect(ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "first" })).rejects.toThrow("FIELD_STORAGE_INVALID"); expect(m.values).not.toHaveBeenCalled();
});


it("stages only authorised omitted creation defaults including false/zero, never explicit clears or existing-record fills", async () => {
  grants = ["tickets.ticket.create", "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.read", "tickets.field.write"];
  const current = await authority();
  await field(current, 1, { field: { defaultValue: { type: "integer", value: 0 } } });
  await field(current, 2, { conditional: true, field: { storage: { type: "boolean" }, defaultValue: { type: "boolean", value: false } } });
  await field({ ...current, session: { ...current.session, capabilities: new Set([...current.session.capabilities, "tickets.field.hidden"]) } }, 3, { field: { defaultValue: { type: "integer", value: 7 }, writeCapability: "tickets.field.hidden" } });
  const manifest = await ticketFieldFormManifestInTransaction(current, { operation: "create" }); expect(manifest!.fields).toHaveLength(2);
  expect(manifest!.fields.map(field => field.defaultValue)).toEqual([{ type: "integer", value: 0 }, { type: "boolean", value: false }]);
  const submitted = packet(current, manifest!, [{ index: 0, value: null }]);
  const created = await createTicketWithFieldInitialisation({ session: current.session, transaction: tx }, { organisationId: "company", kind: "TICKET", requesterUserId: "actor", queueId: "queue", number: "N", subject: "New" },
    (authority, work, proof) => stageTicketFieldFormPacket(authority, manifest, submitted, work.id, 1, proof));
  expect(created.result).toHaveLength(1); expect(created.result[0].value).toEqual({ type: "boolean", value: false });
  expect(m.initial.mock.calls.map(call => call[1])).toMatchObject([{ definitionId: uuid(1), value: null, extensionRevision: null }, { definitionId: uuid(2), value: false, extensionRevision: 1 }]);
  m.initial.mockClear(); m.ordinary.mockClear();
  const editing = await ticketFieldFormManifestInTransaction(current, { operation: "update", recordId: "existing" });
  expect(editing!.fields.every(field => !("defaultValue" in field))).toBe(true);
  await stageTicketFieldFormPacket(current, editing, packet(current, editing!, []), "existing", 7);
  expect(m.initial).not.toHaveBeenCalled(); expect(m.ordinary).not.toHaveBeenCalled();
});
it("reference suggestions require independent current canonical record Read before display or staging", async () => {
  const current = await authority(), metadata = current.registry.describe("tickets.ticket", 9);
  const ref = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  await field(current, 1, { field: { storage: { type: "reference", entity: ref }, defaultValue: { type: "reference", value: "private-target" } } });
  m.native.mockResolvedValue(null);
  await expect(ticketFieldFormManifestInTransaction(current, { operation: "create" })).rejects.toThrow("Ticket unavailable");
  expect(m.initial).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled();
});
