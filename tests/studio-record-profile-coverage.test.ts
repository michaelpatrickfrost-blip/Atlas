import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { checksum } from "@/core/studio/registry/contracts";
import { validateCandidateRecordProfileCoverage } from "@/core/studio/record-types/coverage";
import type { EntityProfile } from "@/core/studio/record-types/schema";
const m = vi.hoisted(() => ({ refresh: vi.fn(), lock: vi.fn(), inspect: vi.fn(), preflight: vi.fn(), resolve: vi.fn(), validate: vi.fn(), seal: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/entity-lock", () => ({ lockFieldEntitiesInTransaction: m.lock }));
vi.mock("@/core/studio/record-types/runtime-profile", () => ({ inspectRecordProfileInTransaction: m.inspect,
  preflightRecordProfileFields: m.preflight, resolveRecordProfileInTransaction: m.resolve }));
vi.mock("@/core/studio/fields/required-runtime", () => ({ validateCandidateRecordProfileRequirements: m.validate }));
vi.mock("@/core/studio/configuration/pins", () => ({ loadSealedConfigurationVersion: m.seal }));
// Coverage orchestration only: real owner registry metadata/policy, mocked
// immutable profile inspector, authority, SQL and value validator. No central
// native coverage, Serializable conflict, activation or SQL atomicity claim.
const uuid = (n: number) => `50000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.test", organisationId: "company", organisationName: "Company",
  membershipId: "member", capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const registry = buildRegistry(async () => true), source = registry.describe("tickets.ticket", 9);
const entity = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash };
const field = { kind: "customField" as const, definitionId: uuid(3), versionId: uuid(103), schemaVersion: 1 as const, checksum: "c".repeat(64) };
const basePin = { kind: "entityProfile" as const, definitionId: uuid(1), versionId: uuid(101), schemaVersion: 1 as const, checksum: "a".repeat(64) };
const typePin = { kind: "recordType" as const, definitionId: uuid(2), versionId: uuid(102), schemaVersion: 1 as const, checksum: "b".repeat(64) };
const profile: EntityProfile = { page: null, requiredFields: [field], allowedProcesses: [], defaultDecisions: [] };
const definition = vi.fn(), version = vi.fn(), moduleState = vi.fn(), head = vi.fn(), raw = vi.fn();
const tx = { $queryRaw: raw, studioDefinition: { findFirst: definition }, studioDefinitionVersion: { findFirst: version },
  moduleState: { findFirst: moduleState }, studioExtensionRecord: { findFirst: head } } as unknown as Prisma.TransactionClient;
const request = { definitionId: basePin.definitionId, versionId: basePin.versionId, definitionRevision: 4 };
let events: string[], count: number, definitionRow: { id: string; organisationId: string; kind: "entityProfile" | "recordType"; revision: number; activeVersionId: string | null; key: string },
  versionRow: { id: string; definitionId: string; schemaVersion: number; checksum: string; payload: unknown };
beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks(); events = []; count = 3;
  definitionRow = { id: basePin.definitionId, organisationId: "company", kind: "entityProfile", revision: 4, activeVersionId: null, key: "tickets.ticket.base_profile" };
  versionRow = { id: basePin.versionId, definitionId: basePin.definitionId, schemaVersion: 1, checksum: basePin.checksum,
    payload: { schemaVersion: 1, entity, profile } };
  m.refresh.mockResolvedValue({ session, transaction: tx, registry }); moduleState.mockResolvedValue({ id: "studio" });
  definition.mockImplementation(async () => definitionRow); version.mockImplementation(async () => versionRow);
  m.lock.mockImplementation(async () => { events.push("entity-lock"); }); raw.mockImplementation(async () => { events.push("definition-lock"); return []; });
  m.inspect.mockImplementation(async () => { events.push("candidate-metadata"); return { reference: basePin, baseProfile: basePin, entity, profile }; });
  m.preflight.mockImplementation(async () => { events.push("field-metadata"); }); m.seal.mockResolvedValue({});
  m.resolve.mockImplementation(async (_, input) => { events.push(`current:${input.recordId}`); const assigned = input.recordId !== "a";
    return { baseProfile: null, recordType: assigned ? typePin : null, profile: null, assignmentId: assigned ? uuid(80 + input.recordId.charCodeAt(0)) : null,
      fingerprint: checksum({ current: input.recordId }) }; });
  head.mockImplementation(async args => args.where.recordId === "a" ? null : { id: uuid(80), revision: 4, recordTypeAssignmentId: uuid(80 + args.where.recordId.charCodeAt(0)) });
  m.validate.mockImplementation(async (_, __, input) => { events.push(`values:${input.recordId}`); return { recordRevision: 7,
    extensionRevision: input.recordId === "a" ? null : 4, fieldsChecked: 1, fingerprint: checksum(input) }; });
  vi.spyOn(registry, "invokeQueryInTransaction").mockImplementation(async (_, __, input) => {
    const request = input as { mode: string; cursor?: string }; events.push(`owner:${request.mode}`);
    return request.mode === "preflight" ? { organisationId: "company", entityId: entity.id, mode: "preflight", count, nativeAccessComplete: true }
      : { organisationId: "company", entityId: entity.id, mode: "snapshot", records: ["a", "b", "c"].map(recordId => ({ recordId, organisationId: "company", revision: 7 })), next: null };
  });
});
it("checks the full private owner cohort before IDs and applies a base candidate only to the genuinely unassigned record", async () => {
  expect(await validateCandidateRecordProfileCoverage(session, tx, request)).toMatchObject({ recordCount: 3, affectedRecordCount: 1, requirementsChecked: 1 });
  expect(events.slice(0, 5)).toEqual(["entity-lock", "definition-lock", "owner:preflight", "candidate-metadata", "field-metadata"]);
  expect(m.validate.mock.calls.map(call => call[2].recordId)).toEqual(["a"]);
  expect(m.validate.mock.calls[0]).toEqual([session, tx, { entity, recordId: "a", expectedRevision: 7 }, basePin]);
  expect(vi.mocked(registry.invokeQueryInTransaction).mock.calls.every(call => call[0].transaction === tx)).toBe(true);
  expect(definitionRow.activeVersionId).toBeNull(); expect(Object.keys(tx)).not.toContain("auditEntry");
});
it("applies a type candidate to actual stable-type heads while excluding a different type and unassigned records", async () => {
  definitionRow = { ...definitionRow, id: typePin.definitionId, kind: "recordType", key: "tickets.ticket.type" };
  versionRow = { ...versionRow, id: typePin.versionId, definitionId: typePin.definitionId, checksum: typePin.checksum,
    payload: { schemaVersion: 1, entity, baseProfile: basePin, label: "Repair", overlay: { requiredFields: [field] } } };
  m.resolve.mockImplementation(async (_, input) => ({ recordType: input.recordId === "a" ? null : input.recordId === "b" ? typePin : { ...typePin, definitionId: uuid(5) },
    profile: null, assignmentId: input.recordId === "a" ? null : uuid(80 + input.recordId.charCodeAt(0)), fingerprint: "profile" }));
  expect(await validateCandidateRecordProfileCoverage(session, tx, { ...request, definitionId: typePin.definitionId, versionId: typePin.versionId }))
    .toMatchObject({ affectedRecordCount: 1, requirementsChecked: 1 });
  expect(m.validate.mock.calls.map(call => call[2].recordId)).toEqual(["b"]);
});
it("keeps unchanged requirement sets metadata-only without skipping genuine owner coverage or exact heads", async () => {
  m.resolve.mockImplementation(async (_, input) => ({ recordType: null, profile, assignmentId: null, fingerprint: checksum(input) })); head.mockResolvedValue(null);
  expect(await validateCandidateRecordProfileCoverage(session, tx, request)).toMatchObject({ recordCount: 3, affectedRecordCount: 3, requirementsChecked: 0 });
  expect(m.validate).not.toHaveBeenCalled(); expect(m.preflight).toHaveBeenCalledTimes(2); expect(events.filter(event => event === "owner:preflight")).toHaveLength(2);
});
it("preflights sealed field policies even for an empty actual owner cohort", async () => {
  count = 0; vi.mocked(registry.invokeQueryInTransaction).mockImplementation(async (_, __, input) => (input as { mode: string }).mode === "preflight"
    ? { organisationId: "company", entityId: entity.id, mode: "preflight", count: 0, nativeAccessComplete: true }
    : { organisationId: "company", entityId: entity.id, mode: "snapshot", records: [], next: null });
  expect(await validateCandidateRecordProfileCoverage(session, tx, request)).toMatchObject({ recordCount: 0, affectedRecordCount: 0 });
  expect(m.preflight).toHaveBeenCalledTimes(2); expect(m.resolve).not.toHaveBeenCalled(); expect(m.validate).not.toHaveBeenCalled();
});
it.each(["private", "field", "head", "value", "revision", "seal", "count"])("fails closed for %s drift without any pointer/native/Audit mutation", async mode => {
  if (mode === "private") vi.mocked(registry.invokeQueryInTransaction).mockRejectedValue(new Error("private queue"));
  if (mode === "field") m.preflight.mockRejectedValue(new Error("FORBIDDEN: field policy"));
  if (mode === "head") head.mockResolvedValue({ id: uuid(80), revision: 4, recordTypeAssignmentId: uuid(99) });
  if (mode === "value") m.validate.mockRejectedValue(new Error("Packages is required"));
  if (mode === "revision") definition.mockResolvedValueOnce(definitionRow).mockResolvedValue({ ...definitionRow, revision: 5 });
  if (mode === "seal") m.seal.mockRejectedValue(new Error("seal changed"));
  if (mode === "count") count = 4;
  await expect(validateCandidateRecordProfileCoverage(session, tx, request)).rejects.toThrow();
  if (mode === "private") { expect(m.inspect).not.toHaveBeenCalled(); expect(m.resolve).not.toHaveBeenCalled(); }
  if (mode === "field") { expect(m.resolve).not.toHaveBeenCalled(); expect(m.validate).not.toHaveBeenCalled(); }
  expect(definitionRow.activeVersionId).toBeNull();
});
it("rejects malformed tenant/actor input and absent current publication/module authority before cohort reads", async () => {
  await expect(validateCandidateRecordProfileCoverage(session, tx, { ...request, organisationId: "foreign" })).rejects.toThrow();
  expect(m.refresh).not.toHaveBeenCalled();
  m.refresh.mockResolvedValue({ session: { ...session, capabilities: new Set(["tickets.ticket.manage"]) }, transaction: tx, registry });
  await expect(validateCandidateRecordProfileCoverage(session, tx, request)).rejects.toThrow("FORBIDDEN");
  m.refresh.mockResolvedValue({ session, transaction: tx, registry }); moduleState.mockResolvedValue(null);
  await expect(validateCandidateRecordProfileCoverage(session, tx, request)).rejects.toThrow("Studio is unavailable");
  expect(registry.invokeQueryInTransaction).not.toHaveBeenCalled();
});
it("fingerprints actual cohort/head/current-profile changes and rejects non-monotonic or foreign native snapshots", async () => {
  const first = await validateCandidateRecordProfileCoverage(session, tx, request);
  m.resolve.mockImplementation(async (_, input) => ({ recordType: null, profile: null, assignmentId: null, fingerprint: checksum({ changed: input.recordId }) })); head.mockResolvedValue(null);
  m.validate.mockImplementation(async (_, __, input) => ({ recordRevision: 7, extensionRevision: null, fieldsChecked: 1, fingerprint: checksum(input) }));
  const second = await validateCandidateRecordProfileCoverage(session, tx, request); expect(second.fingerprint).not.toBe(first.fingerprint);
  vi.mocked(registry.invokeQueryInTransaction).mockImplementation(async (_, __, input) => (input as { mode: string }).mode === "preflight"
    ? { organisationId: "company", entityId: entity.id, mode: "preflight", count: 3, nativeAccessComplete: true }
    : { organisationId: "company", entityId: entity.id, mode: "snapshot", records: ["b", "a", "c"].map(recordId => ({ recordId, organisationId: "company", revision: 7 })), next: null });
  await expect(validateCandidateRecordProfileCoverage(session, tx, request)).rejects.toThrow("COVERAGE_CHANGED");
  vi.mocked(registry.invokeQueryInTransaction).mockResolvedValue({ organisationId: "foreign", entityId: entity.id, mode: "preflight", count: 0, nativeAccessComplete: true });
  await expect(validateCandidateRecordProfileCoverage(session, tx, request)).rejects.toThrow("COVERAGE_CHANGED");
});
it("uses bounded owner pages with real continuation rather than unbounded assignment-table selection", async () => {
  count = 51; head.mockResolvedValue(null); m.resolve.mockResolvedValue({ recordType: null, profile, assignmentId: null, fingerprint: "same" });
  vi.mocked(registry.invokeQueryInTransaction).mockImplementation(async (_, __, input) => {
    const request = input as { mode: string; cursor?: string; limit?: number };
    if (request.mode === "preflight") return { organisationId: "company", entityId: entity.id, mode: "preflight", count, nativeAccessComplete: true };
    expect(request.limit).toBe(50);
    return { organisationId: "company", entityId: entity.id, mode: "snapshot", records: (request.cursor ? [50] : Array.from({ length: 50 }, (_, i) => i))
      .map(i => ({ recordId: `record_${String(i).padStart(2, "0")}`, organisationId: "company", revision: 7 })), next: request.cursor ? null : "record_49" };
  });
  expect(await validateCandidateRecordProfileCoverage(session, tx, request)).toMatchObject({ recordCount: 51, affectedRecordCount: 51 });
  expect(m.resolve).toHaveBeenCalledTimes(51); expect(m.validate).not.toHaveBeenCalled();
});
