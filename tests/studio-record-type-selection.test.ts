import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { readRecordTypeSelectionInTransaction, reassignRecordTypeInTransaction } from "@/core/studio/record-types/selection";
const m = vi.hoisted(() => ({ refresh: vi.fn(), lock: vi.fn(), current: vi.fn(), inspect: vi.fn(), preflight: vi.fn(), assign: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/entity-lock", () => ({ lockFieldEntitiesInTransaction: m.lock }));
vi.mock("@/core/studio/record-types/runtime-profile", () => ({ resolveRecordProfileInTransaction: m.current,
  inspectRecordProfileInTransaction: m.inspect, preflightRecordProfileFields: m.preflight }));
vi.mock("@/core/studio/record-types/assignment", () => ({ assignRecordTypeInTransaction: m.assign }));
const uuid = (n: number) => `50000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.test", organisationId: "company",
  organisationName: "Company", membershipId: "member", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const registry = buildRegistry(async () => true), source = registry.describe("tickets.ticket", 9);
const entity = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash };
const extension = vi.fn(), bindings = vi.fn(), definition = vi.fn();
const tx = { studioExtensionRecord: { findFirst: extension }, studioProfileBinding: { findMany: bindings },
  studioDefinition: { findFirst: definition } } as unknown as Prisma.TransactionClient;
const request = { recordId: "native", recordRevision: 7 };
const mutation = { ...request, operationId: uuid(90), extensionRevision: 4, definitionId: uuid(3) };
let events: string[];
beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks(); events = [];
  m.refresh.mockImplementation(async () => { events.push("fresh"); return { session, transaction: tx, registry }; });
  m.lock.mockImplementation(async () => { events.push("entity-lock"); });
  vi.spyOn(registry, "authoriseRecord").mockImplementation(async (_, __, input) => {
    events.push("owner-extend"); expect(input).toEqual({ recordId: "native", intent: "extend", expectedRevision: 7 });
    return { recordId: "native", organisationId: "company", revision: 7 };
  });
  // Genuine session issuance, private owner, sealed reconstruction and transaction
  // rollback are collaborator mocks; this suite proves wrapper/order/transport only.
  m.current.mockImplementation(async () => { events.push("current-and-written"); return { recordType: null, assignmentId: null }; });
  extension.mockResolvedValue({ id: uuid(80), organisationId: "company", entityId: entity.id, recordId: "native", revision: 4, recordTypeAssignmentId: null });
  bindings.mockResolvedValue([{ organisationId: "company", entityId: entity.id, kind: "recordType", definitionId: uuid(3) }]);
  definition.mockImplementation(async ({ where }) => ({ id: where.id, organisationId: "company", kind: "recordType", retiredAt: null,
    activeVersionId: uuid(103), activeVersion: { id: uuid(103), definitionId: where.id, organisationId: "company", schemaVersion: 1, checksum: "a".repeat(64) } }));
  m.inspect.mockImplementation(async (_, pin) => { events.push("seal"); return { entity, profile: { requiredFields: [] }, payload: {
    schemaVersion: 1, entity, label: "Customer complaint", help: "Use for customer complaints", baseProfile: {
      kind: "entityProfile", definitionId: uuid(1), versionId: uuid(101), schemaVersion: 1, checksum: "b".repeat(64) }, overlay: {} }, reference: pin }; });
  m.preflight.mockImplementation(async () => { events.push("choice-policy"); });
  m.assign.mockResolvedValue({ operationId: uuid(90), extensionRevision: 5, replayed: false });
});
it("authorises actual native Extend and retained/current policies before names, with bounded tenant-only bindings", async () => {
  const result = await readRecordTypeSelectionInTransaction(session, tx, entity, request);
  expect(events).toEqual(["fresh", "entity-lock", "owner-extend", "current-and-written", "seal", "choice-policy"]);
  expect(result).toMatchObject({ ...request, extensionRevision: 4, currentDefinitionId: null,
    choices: [{ definitionId: uuid(3), label: "Customer complaint", help: "Use for customer complaints" }] });
  expect(Object.keys(result.choices[0])).toEqual(["definitionId", "label", "help"]);
  expect(bindings.mock.calls[0][0]).toEqual({ where: { organisationId: "company", entityId: entity.id, kind: "recordType" },
    select: { organisationId: true, entityId: true, kind: true, definitionId: true }, orderBy: { definitionId: "asc" }, take: 101 });
  expect(Object.keys(tx)).not.toContain("studioFieldValue");
});
it("omits only independently FORBIDDEN choice field grants before labels leave", async () => {
  m.preflight.mockRejectedValue(new Error("FORBIDDEN: missing field Read"));
  expect((await readRecordTypeSelectionInTransaction(session, tx, entity, request)).choices).toEqual([]);
});
it.each(["seal", "dependency", "policy-invalid", "policy-plain-forbidden", "current-denied"])("does not swallow %s", async mode => {
  if (mode === "seal") m.inspect.mockRejectedValue(new Error("FORBIDDEN: invalid sealed identity"));
  if (mode === "dependency") m.inspect.mockRejectedValue(new Error("DEPENDENCY_BROKEN"));
  if (mode === "policy-invalid") m.preflight.mockRejectedValue(new Error("RECORD_PROFILE_INVALID"));
  if (mode === "policy-plain-forbidden") m.preflight.mockRejectedValue(new Error("FORBIDDEN"));
  if (mode === "current-denied") m.current.mockRejectedValue(new Error("FORBIDDEN: retained policy"));
  await expect(readRecordTypeSelectionInTransaction(session, tx, entity, request)).rejects.toThrow();
});
it.each(["foreign-anchor", "stale-native", "foreign-binding", "duplicate", "overflow", "foreign-extension", "assignment-mismatch", "foreign-profile"])("rejects %s before returning choices", async mode => {
  if (mode === "foreign-anchor") vi.mocked(registry.authoriseRecord).mockResolvedValue({ organisationId: "foreign", recordId: "native", revision: 7 });
  if (mode === "stale-native") vi.mocked(registry.authoriseRecord).mockResolvedValue({ organisationId: "company", recordId: "native", revision: 8 });
  if (mode === "foreign-binding") bindings.mockResolvedValue([{ organisationId: "foreign", entityId: entity.id, kind: "recordType", definitionId: uuid(3) }]);
  if (mode === "duplicate") bindings.mockResolvedValue(Array.from({ length: 2 }, () => ({ organisationId: "company", entityId: entity.id, kind: "recordType", definitionId: uuid(3) })));
  if (mode === "overflow") bindings.mockResolvedValue(Array.from({ length: 101 }, (_, i) => ({ organisationId: "company", entityId: entity.id, kind: "recordType", definitionId: uuid(i + 10) })));
  if (mode === "foreign-extension") extension.mockResolvedValue({ organisationId: "foreign", entityId: entity.id, recordId: "native", revision: 4, recordTypeAssignmentId: null });
  if (mode === "assignment-mismatch") m.current.mockResolvedValue({ recordType: null, assignmentId: uuid(999) });
  if (mode === "foreign-profile") m.inspect.mockResolvedValue({ entity: { ...entity, id: "other.entity" } });
  await expect(readRecordTypeSelectionInTransaction(session, tx, entity, request)).rejects.toThrow();
  expect(m.assign).not.toHaveBeenCalled();
});
it("never silently removes a broken or inaccessible current assignment", async () => {
  m.current.mockResolvedValue({ assignmentId: null, recordType: { definitionId: uuid(3) } });
  m.preflight.mockRejectedValue(new Error("FORBIDDEN: choice grant"));
  await expect(readRecordTypeSelectionInTransaction(session, tx, entity, request)).rejects.toThrow("RECORD_PROFILE_INVALID");
});
it("reconstructs active immutable selection on server and delegates all CAS/replay/Audit to the original engine", async () => {
  expect(await reassignRecordTypeInTransaction(session, tx, entity, mutation)).toMatchObject({ extensionRevision: 5 });
  expect(m.assign).toHaveBeenCalledWith(session, tx, { ...request, operationId: mutation.operationId, entity, extensionRevision: 4,
    recordType: { kind: "recordType", definitionId: uuid(3), versionId: uuid(103), schemaVersion: 1, checksum: "a".repeat(64) } });
  await reassignRecordTypeInTransaction(session, tx, entity, { ...mutation, definitionId: null });
  expect(m.assign.mock.calls[1][2].recordType).toBeNull();
});
it("propagates actual CAS/Audit errors and private native denial without fallback or partial mutation", async () => {
  m.assign.mockRejectedValue(new Error("CONFLICT: extension changed"));
  await expect(reassignRecordTypeInTransaction(session, tx, entity, mutation)).rejects.toThrow("CONFLICT");
  m.assign.mockClear(); vi.mocked(registry.authoriseRecord).mockRejectedValue(new Error("private queue"));
  await expect(reassignRecordTypeInTransaction(session, tx, entity, mutation)).rejects.toThrow("private");
  expect(m.assign).not.toHaveBeenCalled();
});
it.each([{ organisationId: "foreign" }, { versionId: uuid(103) }, { entity }, { profile: {} }])("rejects injected transport %j", async extra => {
  await expect(reassignRecordTypeInTransaction(session, tx, entity, { ...mutation, ...extra })).rejects.toThrow();
  expect(m.refresh).not.toHaveBeenCalled(); expect(m.assign).not.toHaveBeenCalled();
});
