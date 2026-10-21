import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { checksum } from "@/core/studio/registry/contracts";
import { ticketCreationTypeManifestInTransaction, stageTicketCreationType, inspectTicketCreationTypeReceipt, ticketCreationTypeOperationId } from "@/core/service-work/record-type-creation";
import { parseTicketCreationTypeSelection } from "@/core/service-work/record-type-creation-contract";
import { ticketFormReceiptSchema } from "@/core/service-work/form-receipt-contract";
const m = vi.hoisted(() => ({ stamp: vi.fn(), refresh: vi.fn(), lock: vi.fn(), inspect: vi.fn(), preflight: vi.fn(), assign: vi.fn(), enabled: vi.fn(), gate: vi.fn(),
  bindings: vi.fn(), definition: vi.fn(), extension: vi.fn(), assignment: vi.fn(), native: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: m.stamp }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/entity-lock", () => ({ lockFieldEntitiesInTransaction: m.lock }));
vi.mock("@/core/studio/record-types/runtime-profile", () => ({ inspectRecordProfileInTransaction: m.inspect, preflightRecordProfileCreationMetadata: m.preflight }));
vi.mock("@/core/studio/record-types/assignment", () => ({ assignInitialRecordTypeInTransaction: m.assign }));
vi.mock("@/core/studio/runtime-features", () => ({ isStudioRuntimeFeatureEnabled: m.enabled, assertStudioRuntimeFeatureEnabled: m.gate, STUDIO_RECORD_TYPE_FORM_FEATURE: "recordTypeForms.v1" }));
const uuid = (n: number) => `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const registry = buildRegistry(async () => true), ref = registry.describe("tickets.ticket", 9);
const entity = { id: ref.id, version: ref.version, schemaHash: ref.schemaHash, contractHash: ref.contractHash };
const pin = { kind: "recordType" as const, definitionId: uuid(2), versionId: uuid(3), schemaVersion: 1 as const, checksum: "a".repeat(64) };
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.test", membershipId: "member", organisationId: "company",
  organisationName: "Company", capabilities: new Set(["tickets.ticket.create"]) };
const tx = { studioProfileBinding: { findMany: m.bindings }, studioDefinition: { findFirst: m.definition }, studioExtensionRecord: { findFirst: m.extension },
  studioRecordTypeAssignment: { findFirst: m.assignment }, serviceWorkItem: { findFirst: m.native } } as unknown as Prisma.TransactionClient;
const stamp = { userId: "actor", organisationId: "company", membershipId: "member", authVersion: 1, sessionVersion: 1 };
const authority = { session, transaction: tx, registry, stamp } as FieldRuntimeAuthority;
const packet = { schemaVersion: 1 as const, operationId: uuid(1), manifestChecksum: "b".repeat(64), extensionRevision: null, fields: [] };
let events: string[];
// Real transport/checksums/entity metadata; issuance, sealed inspection, INSERT
// assignment and storage are explicit bounded collaborators. These cases do not
// establish true proof issuance, SQL trigger or transaction rollback behaviour.
beforeEach(() => {
  vi.restoreAllMocks(); vi.resetAllMocks(); events = [];
  session.capabilities = new Set(["tickets.ticket.create"]);
  m.enabled.mockReturnValue(true); m.stamp.mockReturnValue(stamp); m.refresh.mockResolvedValue(authority);
  m.lock.mockImplementation(async () => { events.push("lock"); });
  vi.spyOn(registry, "resolveCurrentFieldInitialisation").mockImplementation(async () => { events.push("create-policy"); return {} as never; });
  m.bindings.mockImplementation(async ({ where }) => where.kind === "entityProfile" ? [] : [{ definitionId: pin.definitionId, organisationId: "company", entityId: entity.id, kind: "recordType" }]);
  m.definition.mockImplementation(async ({ where }) => ({ id: where.id, organisationId: "company", kind: "recordType", retiredAt: null, activeVersionId: pin.versionId,
    activeVersion: { id: pin.versionId, definitionId: where.id, organisationId: "company", schemaVersion: 1 as const, checksum: pin.checksum } }));
  m.inspect.mockImplementation(async (_, actual) => ({ reference: actual, entity, payload: { label: "Customer complaint", help: "Resolve customer complaints" }, profile: { requiredFields: [] } }));
  m.preflight.mockImplementation(async () => { events.push("current-pinned-field-policies"); });
  m.extension.mockResolvedValue(null); m.assign.mockResolvedValue({ operationId: uuid(7), replayed: false });
});
it("gates the catalogue without any fixture SQL when compatibility is absent", async () => {
  m.enabled.mockReturnValue(false); expect(await ticketCreationTypeManifestInTransaction(authority)).toBeNull();
  expect(m.refresh).not.toHaveBeenCalled(); expect(m.bindings).not.toHaveBeenCalled();
});
it("uses genuine current Create only and returns friendly approved names after pinned/current field policy", async () => {
  const result = await ticketCreationTypeManifestInTransaction(authority);
  expect(events).toEqual(["create-policy", "lock", "current-pinned-field-policies"]);
  expect(result?.choices).toEqual([{ definitionId: pin.definitionId, label: "Customer complaint", help: "Resolve customer complaints", requiredFields: [] }]);
  expect(registry.resolveCurrentFieldInitialisation).toHaveBeenCalledWith(session, entity);
  expect(session.capabilities).toEqual(new Set(["tickets.ticket.create"]));
});
it.each(["unissued", "stamp", "refresh", "create"])("denies %s before catalogue access", async mode => {
  if (mode === "unissued") m.stamp.mockReturnValue(undefined);
  if (mode === "stamp") m.stamp.mockReturnValue({ ...stamp });
  if (mode === "refresh") m.refresh.mockRejectedValue(new Error("FORBIDDEN: stale membership"));
  if (mode === "create") session.capabilities.clear();
  await expect(ticketCreationTypeManifestInTransaction(authority)).rejects.toThrow("FORBIDDEN");
  expect(m.bindings).not.toHaveBeenCalled();
});
it.each(["foreign", "duplicate", "overflow", "seal", "invalid-policy"])("fails closed for %s rather than omit broken definitions", async mode => {
  if (mode === "foreign") m.bindings.mockImplementation(async ({ where }) => where.kind === "entityProfile" ? [] : [{ definitionId: pin.definitionId, organisationId: "other", entityId: entity.id, kind: "recordType" }]);
  if (mode === "duplicate" || mode === "overflow") m.bindings.mockImplementation(async ({ where }) => where.kind === "entityProfile" ? [] : Array.from({ length: mode === "duplicate" ? 2 : 101 }, () => ({ definitionId: pin.definitionId, organisationId: "company", entityId: entity.id, kind: "recordType" })));
  if (mode === "seal") m.inspect.mockRejectedValue(new Error("FORBIDDEN: malformed immutable dependency"));
  if (mode === "invalid-policy") m.preflight.mockRejectedValue(new Error("RECORD_PROFILE_INVALID"));
  await expect(ticketCreationTypeManifestInTransaction(authority)).rejects.toThrow();
});
it("omits only independent denied field policy before names are returned", async () => {
  m.preflight.mockRejectedValue(new Error("FORBIDDEN: field Write denied"));
  expect(await ticketCreationTypeManifestInTransaction(authority)).toBeNull();
});
it("passes the actual callback proof unchanged to original initial association after staged extension CAS", async () => {
  const manifest = await ticketCreationTypeManifestInTransaction(authority), proof = {};
  m.extension.mockResolvedValue({ revision: 2 });
  const selection = { schemaVersion: 1 as const, manifestChecksum: manifest!.manifestChecksum, definitionId: pin.definitionId };
  await stageTicketCreationType(authority, selection, packet, "new-native", 1, proof);
  expect(m.assign).toHaveBeenCalledWith(session, tx, { operationId: ticketCreationTypeOperationId(packet.operationId, pin), entity,
    recordId: "new-native", recordRevision: 1, extensionRevision: 2, recordType: pin }, proof);
});
it.each(["stale", "invisible", "gate", "replayed", "assignment"])("denies %s without silently substituting standard setup", async mode => {
  const manifest = await ticketCreationTypeManifestInTransaction(authority);
  const selection = { schemaVersion: 1 as const, manifestChecksum: manifest!.manifestChecksum, definitionId: pin.definitionId };
  if (mode === "stale") selection.manifestChecksum = "f".repeat(64);
  if (mode === "invisible") selection.definitionId = uuid(99);
  if (mode === "gate") m.gate.mockImplementation(() => { throw new Error("UNSUPPORTED feature"); });
  if (mode === "replayed") m.assign.mockResolvedValue({ replayed: true });
  if (mode === "assignment") m.assign.mockRejectedValue(new Error("Audit failure"));
  await expect(stageTicketCreationType(authority, selection, packet, "new-native", 1, {})).rejects.toThrow();
  if (["stale", "invisible", "gate"].includes(mode)) expect(m.assign).not.toHaveBeenCalled();
});
it.each([undefined, {}, { schemaVersion: 1, manifestChecksum: "a".repeat(64) }, { schemaVersion: 2, manifestChecksum: "a".repeat(64), definitionId: null },
  { schemaVersion: 1, manifestChecksum: "a".repeat(64), definitionId: null, organisationId: "other" }])("rejects malformed or privileged transport %j", value => {
  expect(() => parseTicketCreationTypeSelection(JSON.stringify(value))).toThrow();
});
it("distinguishes explicit standard selection and canonical operation pins; absent-selector old receipt remains exact", () => {
  const selection = parseTicketCreationTypeSelection(JSON.stringify({ schemaVersion: 1, manifestChecksum: "a".repeat(64), definitionId: null }));
  expect(selection.definitionId).toBeNull();
  expect(ticketCreationTypeOperationId(packet.operationId, pin)).not.toBe(ticketCreationTypeOperationId(packet.operationId, { ...pin, versionId: uuid(4) }));
  const legacy = { schemaVersion: 1, organisationId: "company", actorUserId: "actor", operationId: packet.operationId, operation: "create", recordId: "native",
    recordRevision: 1, requestRecordRevision: 1, fieldRecordRevision: 1, nativeRequestChecksum: "a".repeat(64), packetChecksum: "b".repeat(64), fields: [] };
  expect(ticketFormReceiptSchema.parse(legacy)).toEqual(legacy);
  expect(ticketFormReceiptSchema.safeParse({ ...legacy, typeSelection: selection }).success).toBe(false);
});
it("creation historical inspection denies a fabricated principal before record/profile access", async () => {
  m.stamp.mockReturnValue(undefined);
  await expect(inspectTicketCreationTypeReceipt(authority, packet.operationId, { schemaVersion: 1, manifestChecksum: "a".repeat(64), definitionId: null }, "native", 0, false)).rejects.toThrow("FORBIDDEN");
  expect(m.native).not.toHaveBeenCalled(); expect(m.assignment).not.toHaveBeenCalled(); expect(m.inspect).not.toHaveBeenCalled();
});

function retainedOrigin(fieldCount = 0, standard = false) {
  const base = { kind: "entityProfile" as const, definitionId: uuid(10), versionId: uuid(11), schemaVersion: 1 as const, checksum: "c".repeat(64) };
  const selectedPin = standard ? null : pin, basePin = standard ? null : base;
  const operationId = ticketCreationTypeOperationId(packet.operationId, selectedPin ?? basePin), extensionId = uuid(30), profile = { requiredFields: [] };
  const request = { operationId, entity, recordId: "native", recordRevision: 1, extensionRevision: fieldCount || null, recordType: selectedPin };
  const provenance = { schemaVersion: 1, operationId, organisationId: "company", entity, recordId: "native", nativeRevision: 1,
    extensionId, extensionRevision: fieldCount + 1, previousExtensionRevision: fieldCount || null, previousAssignmentId: null,
    recordType: selectedPin, baseProfile: basePin, resolvedProfileChecksum: basePin ? checksum(profile) : null, requestChecksum: checksum(request), createdBy: "actor" };
  const row = { id: operationId, organisationId: "company", entityId: entity.id, recordId: "native", extensionId, extensionRevision: fieldCount + 1,
    nativeRevision: 1, previousAssignmentId: null, createdBy: "actor", recordTypeDefinitionId: selectedPin?.definitionId ?? null, recordTypeVersionId: selectedPin?.versionId ?? null,
    baseProfileDefinitionId: basePin?.definitionId ?? null, baseProfileVersionId: basePin?.versionId ?? null, requestChecksum: provenance.requestChecksum, checksum: checksum(provenance), provenance };
  m.native.mockResolvedValue({ id: "native", organisationId: "company", kind: "TICKET", requesterUserId: "actor", version: 1 });
  m.extension.mockResolvedValue({ id: extensionId, organisationId: "company", entityId: entity.id, recordId: "native", revision: fieldCount + 1, recordTypeAssignmentId: operationId });
  m.assignment.mockResolvedValue(row);
  m.inspect.mockImplementation(async (_, reference) => ({ reference, entity, profile, payload: { label: "Type", help: "" } }));
  const selection = { schemaVersion: 1 as const, manifestChecksum: "f".repeat(64), definitionId: selectedPin?.definitionId ?? null };
  return { row, selection, anchor: { operationId, extensionId, extensionRevision: fieldCount + 1, requestChecksum: provenance.requestChecksum,
    checksum: row.checksum, selectionChecksum: checksum(selection) } };
}
it("rechecks original sealed and current changed type metadata on read-only replay without reassign/proof or native Read", async () => {
  const { selection, anchor } = retainedOrigin(2);
  expect(await inspectTicketCreationTypeReceipt(authority, packet.operationId, selection, "native", 2, true)).toEqual(anchor);
  m.native.mockResolvedValue({ id: "native", organisationId: "company", kind: "TICKET", requesterUserId: "actor", version: 8 });
  m.extension.mockResolvedValue({ id: uuid(30), organisationId: "company", entityId: entity.id, recordId: "native", revision: 9, recordTypeAssignmentId: uuid(99) });
  m.definition.mockResolvedValue({ id: pin.definitionId, organisationId: "company", kind: "recordType", retiredAt: null, activeVersionId: uuid(90),
    activeVersion: { id: uuid(90), definitionId: pin.definitionId, organisationId: "company", schemaVersion: 1 as const, checksum: "d".repeat(64) } });
  expect(await inspectTicketCreationTypeReceipt(authority, packet.operationId, selection, "native", 2, false, anchor)).toEqual(anchor);
  expect(m.inspect.mock.calls.map(([, actual]) => actual.versionId)).toContain(uuid(90));
  expect(m.assign).not.toHaveBeenCalled(); expect(Object.keys(tx)).not.toContain("studioFieldValue");
});
it.each(["foreign-native", "not-creator", "native-revision", "foreign-assignment", "checksum", "field-count", "head", "selection", "anchor"])("denies retained %s drift", async mode => {
  const { row, selection, anchor } = retainedOrigin();
  if (mode === "foreign-native") m.native.mockResolvedValue({ id: "native", organisationId: "foreign", kind: "TICKET", requesterUserId: "actor", version: 1 });
  if (mode === "not-creator") m.native.mockResolvedValue({ id: "native", organisationId: "company", kind: "TICKET", requesterUserId: "other", version: 1 });
  if (mode === "native-revision") m.native.mockResolvedValue({ id: "native", organisationId: "company", kind: "TICKET", requesterUserId: "actor", version: 2 });
  if (mode === "foreign-assignment") row.organisationId = "other";
  if (mode === "checksum") row.checksum = "f".repeat(64);
  if (mode === "head") m.extension.mockResolvedValue({ id: uuid(30), organisationId: "company", entityId: entity.id, recordId: "native", revision: 1, recordTypeAssignmentId: uuid(99) });
  if (mode === "selection") selection.definitionId = uuid(99);
  if (mode === "anchor") anchor.checksum = "b".repeat(64);
  await expect(inspectTicketCreationTypeReceipt(authority, packet.operationId, selection, "native", mode === "field-count" ? 1 : 0,
    mode !== "anchor", mode === "anchor" ? anchor : undefined)).rejects.toThrow("CONFLICT");
  expect(m.assign).not.toHaveBeenCalled();
});
it.each(["historical", "current"])("retains %s field Read/Write/reference policy denial before any value access", async mode => {
  const { selection, anchor } = retainedOrigin();
  let index = 0;
  m.preflight.mockImplementation(async () => { if ((mode === "historical" && ++index === 1) || (mode === "current" && ++index === 3)) throw new Error("FORBIDDEN: original reference or field policy revoked"); });
  await expect(inspectTicketCreationTypeReceipt(authority, packet.operationId, selection, "native", 0, false, anchor)).rejects.toThrow("FORBIDDEN");
  expect(m.assign).not.toHaveBeenCalled();
});

it("discovers a later canonical base for original standard/no-base replay and preflights it without new conditions or effects", async () => {
  const { selection, anchor } = retainedOrigin(0, true);
  m.bindings.mockResolvedValue([{ definitionId: uuid(10), organisationId: "company", entityId: entity.id, kind: "entityProfile" }]);
  m.definition.mockResolvedValue({ id: uuid(10), organisationId: "company", kind: "entityProfile", retiredAt: null, activeVersionId: uuid(11),
    activeVersion: { id: uuid(11), definitionId: uuid(10), organisationId: "company", schemaVersion: 1, checksum: "c".repeat(64) } });
  m.preflight.mockRejectedValue(new Error("FORBIDDEN: newly applicable current required field Read revoked"));
  await expect(inspectTicketCreationTypeReceipt(authority, packet.operationId, selection, "native", 0, false, anchor)).rejects.toThrow("FORBIDDEN");
  expect(m.bindings).toHaveBeenCalledWith({ where: { organisationId: "company", entityId: entity.id, kind: "entityProfile" },
    select: { definitionId: true, organisationId: true, entityId: true, kind: true }, take: 2 });
  expect(m.inspect).toHaveBeenCalledWith(authority, { kind: "entityProfile", definitionId: uuid(10), versionId: uuid(11), schemaVersion: 1, checksum: "c".repeat(64) });
  expect(m.assign).not.toHaveBeenCalled();
});
it.each(["foreign", "duplicate"])("denies %s current base bindings independently of originally empty base", async mode => {
  const { selection, anchor } = retainedOrigin(0, true);
  const binding = { definitionId: uuid(10), organisationId: mode === "foreign" ? "other" : "company", entityId: entity.id, kind: "entityProfile" };
  m.bindings.mockResolvedValue(mode === "foreign" ? [binding] : [binding, binding]);
  await expect(inspectTicketCreationTypeReceipt(authority, packet.operationId, selection, "native", 0, false, anchor)).rejects.toThrow("RECORD_PROFILE_INVALID");
});
