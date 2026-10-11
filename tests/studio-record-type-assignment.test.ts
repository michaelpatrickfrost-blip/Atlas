import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { checksum } from "@/core/studio/registry/contracts";
import { recordTypeAssignmentProvenanceSchema } from "@/core/studio/record-types/assignment-contract";
import { assignRecordTypeInTransaction, assignInitialRecordTypeInTransaction } from "@/core/studio/record-types/assignment";
const m = vi.hoisted(() => ({ refresh: vi.fn(), lock: vi.fn(), inspect: vi.fn(), preflight: vi.fn(), window: vi.fn(), validate: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/entity-lock", () => ({ lockFieldEntitiesInTransaction: m.lock }));
vi.mock("@/core/studio/record-types/runtime-profile", () => ({ inspectRecordProfileInTransaction: m.inspect, preflightRecordProfileFields: m.preflight }));
vi.mock("@/core/studio/fields/runtime-write-window", () => ({ closeAffectedFieldWriteWindows: m.window }));
vi.mock("@/core/studio/fields/required-runtime", () => ({ validateResultingFieldRequirements: m.validate }));
vi.mock("@/core/audit/log", () => ({ writeAudit: m.audit }));
const uuid = (n: number) => `40000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: Session = { userId: "current-actor", userName: "Actor", userEmail: "actor@example.test", organisationId: "company",
  organisationName: "Company", membershipId: "member", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const registry = buildRegistry(async () => true), source = registry.describe("tickets.ticket", 9);
const entity = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash };
const typePin = { kind: "recordType" as const, definitionId: uuid(3), versionId: uuid(103), schemaVersion: 1 as const, checksum: "a".repeat(64) };
const basePin = { kind: "entityProfile" as const, definitionId: uuid(1), versionId: uuid(101), schemaVersion: 1 as const, checksum: "b".repeat(64) };
const request = { operationId: uuid(90), entity, recordId: "native", recordRevision: 7, extensionRevision: 4, recordType: typePin };
const extension = vi.fn(), createExtension = vi.fn(), cas = vi.fn(), definition = vi.fn(), bases = vi.fn(), existing = vi.fn(), create = vi.fn();
const tx = { studioExtensionRecord: { findFirst: extension, create: createExtension, updateMany: cas }, studioDefinition: { findFirst: definition },
  studioProfileBinding: { findMany: bases }, studioRecordTypeAssignment: { findFirst: existing, create } } as unknown as Prisma.TransactionClient;
let events: string[];
beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks(); events = [];
  m.refresh.mockResolvedValue({ session, transaction: tx, registry }); m.lock.mockImplementation(async () => { events.push("entity-lock"); });
  vi.spyOn(registry, "authoriseRecord").mockImplementation(async (_, __, input) => { events.push("owner-extend"); expect(input).toMatchObject({ intent: "extend", expectedRevision: 7 });
    return { recordId: "native", organisationId: "company", revision: 7 }; });
  m.inspect.mockResolvedValue({ reference: typePin, baseProfile: basePin, entity, profile: { page: null, requiredFields: [], allowedProcesses: [], defaultDecisions: [] } });
  m.preflight.mockImplementation(async () => { events.push("field-policy"); }); m.window.mockImplementation(async () => { events.push("windows"); });
  extension.mockResolvedValue({ id: uuid(80), organisationId: "company", entityId: entity.id, recordId: "native", revision: 4, recordTypeAssignmentId: null });
  createExtension.mockResolvedValue({ id: uuid(80), revision: 0, recordTypeAssignmentId: null }); cas.mockImplementation(async () => { events.push("head-cas"); return { count: 1 }; });
  definition.mockResolvedValue({ activeVersionId: typePin.versionId }); existing.mockResolvedValue(null); bases.mockResolvedValue([]);
  create.mockImplementation(async () => { events.push("history"); }); m.validate.mockImplementation(async () => { events.push("final-values"); }); m.audit.mockImplementation(async () => { events.push("audit"); });
});
it("coordinates canonical owner Extend, fields, all windows, CAS and final validation in one caller-owned transaction", async () => {
  expect(await assignRecordTypeInTransaction(session, tx, request)).toMatchObject({ operationId: request.operationId, extensionId: uuid(80), extensionRevision: 5, replayed: false });
  expect(events).toEqual(["entity-lock", "owner-extend", "field-policy", "windows", "history", "head-cas", "final-values", "audit"]);
  expect(m.lock).toHaveBeenCalledWith(tx, "company", [entity.id]);
  expect(create.mock.calls[0][0].data).toMatchObject({ createdBy: "current-actor", previousAssignmentId: null,
    recordTypeDefinitionId: typePin.definitionId, recordTypeVersionId: typePin.versionId, baseProfileDefinitionId: basePin.definitionId, baseProfileVersionId: basePin.versionId });
  expect(m.validate).toHaveBeenCalledWith(session, tx, { entity, recordId: "native", expectedRevision: 7 }, undefined);
  expect(m.audit.mock.calls[0][1]).toBe(tx); expect(m.audit.mock.calls[0][0]).toMatchObject({ actorUserId: "current-actor", organisationId: "company",
    entityType: "StudioRecordTypeAssignment", entityId: request.operationId, action: "studio.record_type.assigned" });
});
it("allows actual INSERT-proof initial association without borrowing ordinary owner Read or Manage", async () => {
  const initial = { ...session, capabilities: new Set(["tickets.ticket.create"]) }, proof = {};
  m.refresh.mockResolvedValue({ session: initial, transaction: tx, registry });
  const initialAnchor = vi.spyOn(registry, "authoriseCurrentFieldInitialisation").mockResolvedValue({ recordId: "native", organisationId: "company", revision: 7 });
  await assignInitialRecordTypeInTransaction(initial, tx, request, proof);
  expect(registry.authoriseRecord).not.toHaveBeenCalled(); expect(initialAnchor).toHaveBeenCalledWith({ session: initial, transaction: tx }, entity, proof);
  expect(m.validate).toHaveBeenCalledWith(initial, tx, { entity, recordId: "native", expectedRevision: 7 }, proof);
  expect(m.preflight.mock.calls[0][3]).toEqual({ kind: "initial", proof });
});
it("retains an explicit unassignment and the active exact base provenance", async () => {
  bases.mockResolvedValue([{ definitionId: basePin.definitionId }]);
  definition.mockResolvedValue({ id: basePin.definitionId, retiredAt: null, activeVersionId: basePin.versionId,
    activeVersion: { id: basePin.versionId, schemaVersion: 1, checksum: basePin.checksum } });
  m.inspect.mockResolvedValue({ reference: basePin, baseProfile: basePin, entity, profile: { page: null, requiredFields: [], allowedProcesses: [], defaultDecisions: [] } });
  await assignRecordTypeInTransaction(session, tx, { ...request, recordType: null });
  expect(create.mock.calls[0][0].data).toMatchObject({ recordTypeDefinitionId: null, recordTypeVersionId: null,
    baseProfileDefinitionId: basePin.definitionId, baseProfileVersionId: basePin.versionId });
});
it.each(["private", "field-policy", "stale-native", "stale-extension", "inactive-type", "foreign-profile", "frozen"])("denies %s before history/head/Audit effects", async mode => {
  if (mode === "private") vi.mocked(registry.authoriseRecord).mockRejectedValue(new Error("private queue"));
  if (mode === "field-policy") m.preflight.mockRejectedValue(new Error("FORBIDDEN"));
  if (mode === "stale-native") vi.mocked(registry.authoriseRecord).mockResolvedValue({ recordId: "native", organisationId: "company", revision: 8 });
  if (mode === "stale-extension") extension.mockResolvedValue({ id: uuid(80), revision: 5 });
  if (mode === "inactive-type") definition.mockResolvedValue({ activeVersionId: uuid(999) });
  if (mode === "foreign-profile") m.inspect.mockResolvedValue({ reference: typePin, baseProfile: basePin, entity: { ...entity, id: "other.entity" }, profile: {} });
  if (mode === "frozen") m.window.mockRejectedValue(new Error("FIELD_MIGRATION_IN_PROGRESS"));
  await expect(assignRecordTypeInTransaction(session, tx, request)).rejects.toThrow();
  expect(create).not.toHaveBeenCalled(); expect(cas).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("propagates CAS, resulting requirement and Audit failure for the owning transaction to roll back", async () => {
  cas.mockResolvedValue({ count: 0 }); await expect(assignRecordTypeInTransaction(session, tx, request)).rejects.toThrow("CONFLICT");
  expect(m.validate).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  cas.mockResolvedValue({ count: 1 }); m.validate.mockRejectedValue(new Error("Count is required"));
  await expect(assignRecordTypeInTransaction(session, tx, request)).rejects.toThrow("required"); expect(m.audit).not.toHaveBeenCalled();
  m.validate.mockResolvedValue({}); m.audit.mockRejectedValue(new Error("Audit failure"));
  await expect(assignRecordTypeInTransaction(session, tx, request)).rejects.toThrow("Audit failure");
});
it("returns a readonly exact fresh retry and never revives a stale/overwritten assignment", async () => {
  const provenance = recordTypeAssignmentProvenanceSchema.parse({ schemaVersion: 1, operationId: request.operationId, organisationId: "company", entity,
    recordId: "native", nativeRevision: 7, extensionId: uuid(80), extensionRevision: 5, previousExtensionRevision: 4, previousAssignmentId: null,
    recordType: typePin, baseProfile: basePin, resolvedProfileChecksum: checksum({ page: null, requiredFields: [], allowedProcesses: [], defaultDecisions: [] }),
    requestChecksum: checksum(request), createdBy: session.userId });
  existing.mockResolvedValue({ id: request.operationId, organisationId: "company", entityId: entity.id, recordId: "native", extensionId: uuid(80),
    extensionRevision: 5, createdBy: session.userId, requestChecksum: checksum(request), provenance, checksum: checksum(provenance) });
  extension.mockResolvedValue({ id: uuid(80), revision: 5, recordTypeAssignmentId: request.operationId });
  expect(await assignRecordTypeInTransaction(session, tx, request)).toMatchObject({ replayed: true });
  expect(create).not.toHaveBeenCalled(); expect(cas).not.toHaveBeenCalled(); expect(m.window).not.toHaveBeenCalled(); expect(m.validate).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  extension.mockResolvedValue({ id: uuid(80), revision: 6, recordTypeAssignmentId: request.operationId });
  await expect(assignRecordTypeInTransaction(session, tx, request)).rejects.toThrow("CONFLICT");
});
it("rejects tenant/actor/plan injection and a failed current authority refresh before SQL or effects", async () => {
  for (const extra of [{ organisationId: "foreign" }, { createdBy: "old-actor" }, { resolvedProfile: {} }])
    await expect(assignRecordTypeInTransaction(session, tx, { ...request, ...extra })).rejects.toThrow();
  expect(extension).not.toHaveBeenCalled(); expect(m.lock).not.toHaveBeenCalled();
  m.refresh.mockRejectedValue(new Error("FORBIDDEN: current membership revoked"));
  await expect(assignRecordTypeInTransaction(session, tx, request)).rejects.toThrow("revoked");
});
