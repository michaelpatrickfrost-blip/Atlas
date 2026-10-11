import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinition, StudioDefinitionVersion } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), refresh: vi.fn(), raw: vi.fn(), definition: vi.fn(), version: vi.fn(), initial: vi.fn(), generation: vi.fn(), module: vi.fn(), coverage: vi.fn(), activation: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, studioDefinitionVersion: { findFirst: m.initial }, $transaction: m.transaction } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/required-coverage", () => ({ validateCandidateFieldCoverage: m.coverage }));
vi.mock("@/core/studio/definitions/activation", () => ({ activateCompiledVersionInTransaction: m.activation }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
import { sessionForUser, sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { checksum } from "@/core/studio/registry/contracts";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { prepareRequiredFieldActivationInTransaction } from "@/core/studio/fields/activation-coverage";
import { activateVersion } from "@/core/studio/definitions/service";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

// Real Session issuance, registry, sealed schema inspection and independent Read/
// Write compiler/binding readers. Authority refresh, SQL and cohort coverage are
// explicit collaborators: these cases do not prove DB atomicity or SSI races.
let registry: CapabilityRegistry, session: Session, fresh: Session, events: string[];
let compiled: Awaited<ReturnType<typeof compileCustomField>>, target: StudioDefinitionVersion;
let definition: StudioDefinition & { activeVersion: StudioDefinitionVersion | null };
const request = { definitionId: uuid(1), versionId: uuid(2), definitionRevision: 7 };
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition }, studioDefinitionVersion: { findFirst: m.version },
  studioFieldGeneration: { findFirst: m.generation }, moduleState: { findFirst: m.module } } as unknown as Prisma.TransactionClient;
const grants = ["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"];
async function actor(capabilities = grants) {
  m.member.mockResolvedValue({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true, grantedCapabilities: capabilities, deniedCapabilities: [], roles: [],
    user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
    organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
  const result = await sessionForUser("company", "actor"); if (!result) throw new Error("Missing actor"); return result;
}
async function candidate(required = true, patch: Record<string, unknown> = {}) {
  const metadata = registry.describe("tickets.ticket", 2);
  return compileCustomField(session, { schemaVersion: 1, entity: { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }, storageGeneration: uuid(3),
    field: { key: "required_extra", label: "Required extra", classification: "confidential", storage: { type: "integer" }, required }, ...patch }, registry);
}
function version(value: typeof compiled, id = uuid(2)): StudioDefinitionVersion {
  return { id, definitionId: request.definitionId, organisationId: "company", version: 2, semanticVersion: "1.0.0", schemaVersion: 1, payload: value.payload as unknown as Prisma.JsonValue,
    compiledPlan: value.plan as unknown as Prisma.JsonValue, checksum: value.checksum, createdBy: "actor", publishedAt: new Date() };
}
const run = (input: unknown = request, actorSession = session, candidatePlan = compiled) => prepareRequiredFieldActivationInTransaction(actorSession, tx, input, candidatePlan);
function setActive(active: StudioDefinitionVersion) { definition.activeVersionId = active.id; definition.activeVersion = active; }
beforeEach(async () => {
  vi.resetAllMocks(); events = [];
  registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
  session = await actor(); fresh = await actor(); compiled = await candidate(); target = version(compiled);
  definition = { id: request.definitionId, organisationId: "company", kind: "customField", key: "tickets.ticket.required_extra", name: "Required extra", revision: 7, latestVersion: 2,
    activeVersionId: null, retiredAt: null, createdBy: "actor", createdAt: new Date(), updatedAt: new Date(), activeVersion: null };
  m.refresh.mockImplementation(async (authenticated, transaction) => { events.push("authority"); if (!sessionAuthorityStamp(authenticated) || transaction !== tx) throw new Error("FORBIDDEN");
    return { session: fresh, stamp: sessionAuthorityStamp(fresh), transaction, registry }; });
  m.raw.mockImplementation(async (sql: TemplateStringsArray) => { events.push(sql.join("").includes("advisory") ? "entity" : sql.join("").includes("studio_definition_versions") ? "versions" : "definition-lock"); return []; });
  m.definition.mockImplementation(async () => { events.push("definition"); return definition; });
  m.version.mockImplementation(async () => { events.push("target"); return target; });
  m.generation.mockResolvedValue({ id: uuid(3) }); m.module.mockResolvedValue({ id: "studio" });
  m.coverage.mockImplementation(async () => { events.push("coverage"); return { ...request, versionChecksum: target.checksum, recordCount: 0, fingerprint: "proof" }; });
  m.initial.mockImplementation(async () => ({ ...target, definition: { kind: "customField" } }));
  m.transaction.mockImplementation(async (callback: (transaction: Prisma.TransactionClient) => Promise<unknown>) => callback(tx));
  m.activation.mockImplementation(async () => { events.push("activation"); return { revision: 8 }; });
});
it("first required activation obtains current authority and entity/definition/immutable locks before complete coverage", async () => {
  expect(await run()).toBe(fresh);
  expect(events).toEqual(["authority", "entity", "definition-lock", "definition", "versions", "target", "coverage"]);
  expect(m.coverage).toHaveBeenCalledWith(fresh, tx, request);
  expect(m.definition).toHaveBeenCalledWith({ where: { id: uuid(1), organisationId: "company", kind: "customField", retiredAt: null }, include: { activeVersion: true } });
  expect(m.raw.mock.calls[2][1]).toEqual([uuid(2)]);
});
it("ordinary service uses the fresh session for CAS/Audit only after coverage in the same Serializable transaction", async () => {
  expect(await activateVersion(session, { definitionId: uuid(1), versionId: uuid(2), revision: 7 })).toEqual({ revision: 8 });
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  expect(m.activation).toHaveBeenCalledWith(tx, fresh, uuid(1), 7, expect.objectContaining({ id: uuid(2) }), expect.objectContaining({ checksum: target.checksum }));
  expect(events.indexOf("coverage")).toBeLessThan(events.indexOf("activation"));
});
it("incomplete/private/stale cohort errors block ordinary pointer and activation Audit dispatch", async () => {
  for (const reason of ["FIELD_REQUIRED: existing record missing", "FORBIDDEN: private Ticket", "FIELD_COVERAGE_CHANGED"]) {
    m.coverage.mockRejectedValueOnce(new Error(reason));
    await expect(activateVersion(session, { definitionId: uuid(1), versionId: uuid(2), revision: 7 })).rejects.toThrow(reason);
  }
  expect(m.activation).not.toHaveBeenCalled(); expect(definition.activeVersionId).toBeNull(); expect(definition.revision).toBe(7);
});
it("exact already-active required schema skips cohort values but still checks today's target Read/Write and binding", async () => {
  setActive(target); expect(await run()).toBe(fresh); expect(m.coverage).not.toHaveBeenCalled(); expect(m.generation).toHaveBeenCalledTimes(2);
  fresh = await actor(["studio.definition.publish", "tickets.ticket.manage"]);
  await expect(run()).rejects.toThrow("FORBIDDEN"); expect(m.coverage).not.toHaveBeenCalled();
});
it("same-generation sealed schema1 cosmetic changes skip cohort while both immutable/current policies remain checked", async () => {
  const cosmetic = await candidate(true, { field: { ...compiled.payload.field, label: "Old label", help: "Old help" } });
  setActive(version(cosmetic, uuid(4))); expect(await run()).toBe(fresh); expect(m.coverage).not.toHaveBeenCalled();
  expect(m.raw.mock.calls[2][1]).toEqual([uuid(2), uuid(4)]);
});
it("first activation cannot use an origin/cosmetic resemblance to skip full coverage", async () => {
  expect(definition.activeVersionId).toBeNull(); await run(); expect(m.coverage).toHaveBeenCalledOnce();
});
it("changed requiredness, generation or structural storage cannot claim cosmetic exemption", async () => {
  for (const prior of [await candidate(false), await candidate(true, { storageGeneration: uuid(9) }), await candidate(true, { field: { ...compiled.payload.field, storage: { type: "integer", min: 1 } } })]) {
    setActive(version(prior, uuid(4))); m.coverage.mockClear(); await run(); expect(m.coverage).toHaveBeenCalledOnce();
  }
});
it("metadata-only Admin/copied Session is denied with actionable message before authority, locks or data access", async () => {
  await expect(run(request, { ...session })).rejects.toThrow("Admin setup context cannot inspect business records");
  expect(m.refresh).not.toHaveBeenCalled(); expect(m.raw).not.toHaveBeenCalled(); expect(m.definition).not.toHaveBeenCalled(); expect(m.coverage).not.toHaveBeenCalled();
});
it("malformed request and stale genuine authority fail before entity/definition access", async () => {
  for (const invalid of [{ ...request, organisationId: "other" }, { ...request, versionId: "wrong" }, { ...request, definitionRevision: -1 }]) await expect(run(invalid)).rejects.toThrow();
  expect(m.refresh).not.toHaveBeenCalled();
  m.refresh.mockRejectedValueOnce(new Error("FORBIDDEN: auth/session version changed")); await expect(run()).rejects.toThrow("auth/session version"); expect(m.raw).not.toHaveBeenCalled();
});
it("current Publish and enabled Studio are mandatory before field locks or cohort reads", async () => {
  fresh = await actor(["tickets.ticket.read", "tickets.ticket.manage"]); await expect(run()).rejects.toThrow("studio.definition.publish");
  fresh = await actor(); m.module.mockResolvedValueOnce(null); await expect(run()).rejects.toThrow("Studio is unavailable"); expect(m.raw).not.toHaveBeenCalled(); expect(m.coverage).not.toHaveBeenCalled();
});
it("foreign, missing, retired, wrong-kind, wrong-key or changed-revision definitions fail closed", async () => {
  for (const patch of [{ organisationId: "other" }, { id: uuid(99) }, { retiredAt: new Date() }, { kind: "capabilitySet" }, { revision: 8 }, { key: "tickets.ticket.other" }]) {
    const before = { ...definition }; Object.assign(definition, patch); await expect(run()).rejects.toThrow("CONFLICT"); definition = before;
  }
  m.definition.mockResolvedValueOnce(null); await expect(run()).rejects.toThrow("CONFLICT"); expect(m.coverage).not.toHaveBeenCalled();
});
it("foreign, unknown, corrupt or changed target immutable metadata and checksum are rejected before coverage", async () => {
  for (const patch of [{ id: uuid(99) }, { organisationId: "other" }, { definitionId: uuid(99) }, { schemaVersion: 2 }, { schemaVersion: 99 }, { checksum: "f".repeat(64) }, { payload: {} }, { compiledPlan: {} }]) {
    const before = target; target = { ...target, ...patch } as StudioDefinitionVersion; await expect(run()).rejects.toThrow(); target = before;
  }
  m.version.mockResolvedValueOnce(null); await expect(run()).rejects.toThrow("CONFLICT"); expect(m.coverage).not.toHaveBeenCalled();
});
it("unknown/corrupt/foreign current sealed metadata or pointer cannot manufacture same-generation equivalence", async () => {
  for (const patch of [{ id: uuid(99) }, { organisationId: "other" }, { definitionId: uuid(99) }, { schemaVersion: 99 }, { checksum: "f".repeat(64) }, { payload: {} }, { compiledPlan: {} }]) {
    setActive({ ...target, id: uuid(4), ...patch } as StudioDefinitionVersion); definition.activeVersionId = uuid(4); await expect(run()).rejects.toThrow();
  }
  definition.activeVersion = null; await expect(run()).rejects.toThrow("CONFLICT"); expect(m.coverage).not.toHaveBeenCalled();
});
it("current field Read is independent of target Write when selecting a required candidate", async () => {
  const original = session; session = await actor([...grants, "tickets.field.secret"]);
  const secret = await candidate(true, { field: { ...compiled.payload.field, readCapability: "tickets.field.secret" } });
  session = original;
  setActive(version(secret, uuid(4))); await expect(run()).rejects.toThrow("tickets.field.secret"); expect(m.coverage).not.toHaveBeenCalled();
});
it("missing tenant generation and disabled current owner reject before any cohort result or pointer dispatch", async () => {
  m.generation.mockResolvedValueOnce(null); await expect(run()).rejects.toThrow("matching tenant-owned storage generation");
  registry = new CapabilityRegistry(async () => false); registry.register("tickets", ticketStudioContract); await expect(run()).rejects.toThrow(); expect(m.coverage).not.toHaveBeenCalled();
});
it("cohort proof scalar substitution cannot approve a different candidate/revision", async () => {
  for (const patch of [{ definitionId: uuid(99) }, { versionId: uuid(99) }, { definitionRevision: 8 }, { versionChecksum: "f".repeat(64) }]) {
    m.coverage.mockResolvedValueOnce({ ...request, versionChecksum: target.checksum, recordCount: 0, fingerprint: "proof", ...patch }); await expect(run()).rejects.toThrow("CONFLICT");
  }
});
it("optional first activation and capabilitySet retain ordinary paths without genuine data/cohort prerequisite", async () => {
  compiled = await candidate(false); target = version(compiled);
  await activateVersion({ ...session }, { definitionId: uuid(1), versionId: uuid(2), revision: 7 }); expect(m.refresh).not.toHaveBeenCalled(); expect(m.coverage).not.toHaveBeenCalled();
  const { compileDefinition } = await import("@/core/studio/compiler");
  const metadata = registry.describe("tickets.ticket.get", 1), kernel = await compileDefinition(session, "capabilitySet", { schemaVersion: 1, description: "Sources", references: [{ id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }] }, registry);
  m.initial.mockResolvedValueOnce({ ...target, payload: kernel.payload, compiledPlan: kernel.plan, checksum: kernel.checksum, definition: { kind: "capabilitySet" } });
  await activateVersion(session, { definitionId: uuid(1), versionId: uuid(2), revision: 7 }); expect(m.activation).toHaveBeenCalledTimes(2); expect(m.refresh).not.toHaveBeenCalled(); expect(m.coverage).not.toHaveBeenCalled();
});
it("untrusted compiled plan/checksum mismatch fails without acquiring the field lock", async () => {
  await expect(run(request, session, { ...compiled, checksum: "f".repeat(64) })).rejects.toThrow("CONFLICT");
  await expect(run(request, session, { ...compiled, payload: { ...compiled.payload, field: { ...compiled.payload.field, label: "Changed" } } })).rejects.toThrow("CONFLICT");
  expect(m.raw).not.toHaveBeenCalled(); expect(m.coverage).not.toHaveBeenCalled();
  expect(checksum(compiled.plan)).toBe(compiled.checksum);
});
