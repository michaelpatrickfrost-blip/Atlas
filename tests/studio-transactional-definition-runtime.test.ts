import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { checksum } from "@/core/studio/registry/contracts";
import { pagePayloadSchema } from "@/core/studio/pages/schema";
import { compilePage } from "@/core/studio/pages/compiler";
import { entityProfilePayloadSchema } from "@/core/studio/record-types/schema";
const m = vi.hoisted(() => ({ stamps: new WeakMap<object, object>(), refresh: vi.fn(), module: vi.fn(), modules: vi.fn(),
  definition: vi.fn(), version: vi.fn(), describe: vi.fn(), pageSource: vi.fn(), metadata: vi.fn(), profile: vi.fn(),
  lock: vi.fn(), usage: vi.fn(), assignment: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: (session: object) => m.stamps.get(session) }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: m.refresh }));
vi.mock("@/core/studio/fields/entity-lock", () => ({ lockFieldEntitiesInTransaction: m.lock }));
vi.mock("@/core/studio/configuration/usage", () => ({ assertNoActiveConfigurationDependantsInTransaction: m.usage }));
vi.mock("@/core/studio/record-types/runtime-profile", () => ({ inspectRecordProfileInTransaction: m.profile }));
vi.mock("@/core/studio/pages/server-approvals", () => ({ reconstructPageMetadataInTransaction: m.metadata }));
import { readActiveTransactionalDefinition, readActiveTransactionalDefinitionInTransaction,
  assertTransactionalDefinitionCanBeRemovedInTransaction } from "@/core/studio/definitions/transactional-runtime";
// Real strict Page/profile schemas, Page compilation and immutable pin/edge seals.
// Genuine-refresh, registry approval reconstruction, reverse graph and SQL are
// explicit collaborators; these tests do not prove live SQL or record access.
const uuid = (n: number) => `50000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ref = { id: "tickets.ticket", version: 9, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
const entity = { ...ref, ownerModuleId: "tickets", kind: "entity" as const, classification: "confidential" as const };
const surface = { id: "tickets.ticket.page", version: 1, schemaHash: "c".repeat(64), contractHash: "d".repeat(64),
  ownerModuleId: "tickets", kind: "surface" as const, classification: "confidential" as const };
const session: Session = { userId: "actor", organisationId: "business", membershipId: "member", userName: "Actor",
  userEmail: "actor@example.test", organisationName: "Business", capabilities: new Set(["studio.definition.read", "studio.definition.publish"]) };
const stamp = { userId: session.userId, organisationId: session.organisationId, membershipId: session.membershipId, authVersion: 1, sessionVersion: 2 };
const transaction = { studioDefinition: { findFirst: m.definition }, studioDefinitionVersion: { findFirst: m.version },
  studioExtensionRecord: { findFirst: m.assignment }, moduleState: { findFirst: m.module, count: m.modules } } as unknown as Prisma.TransactionClient;
const registry = { describe: m.describe, describePageSourceForEntity: m.pageSource } as unknown as FieldRuntimeAuthority["registry"];
const authority: FieldRuntimeAuthority = { session, stamp, transaction, registry };
const approvals = { entity: { ...entity, capability: "tickets.ticket.read" }, sourcePage: { ...surface, capability: "tickets.ticket.read" },
  variants: true, fieldSourceVersions: [9], nativeFields: [], customFields: [], facts: [], contracts: [], queries: [], commands: [], metrics: [], surfaces: [], maxQueryCost: 24 };
const page = pagePayloadSchema.parse({ schemaVersion: 1, entity: ref, formFactors: ["desktop", "tablet", "phone"],
  sections: [{ id: "main", label: "Information", columns: { desktop: 2, tablet: 2, phone: 1 }, formFactors: ["desktop", "tablet", "phone"],
    components: [{ id: "guide", type: "instructions", text: "Information", formFactors: ["desktop", "tablet", "phone"] }] }] });
let row: ReturnType<typeof fixture>["row"], definition: ReturnType<typeof fixture>["definition"];
function fixture(kind: "page" | "entityProfile" | "recordType" = "page") {
  const profile = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity: ref, profile: {} });
  const payload = kind === "page" ? page : kind === "entityProfile" ? profile : { schemaVersion: 1 as const, entity: ref,
    baseProfile: { kind: "entityProfile" as const, definitionId: uuid(20), versionId: uuid(21), schemaVersion: 1 as const, checksum: "e".repeat(64) }, label: "Special", help: "", overlay: {} };
  const plan = kind === "page" ? compilePage(page, approvals) : { kind, schemaVersion: 1 as const, payload,
    resolvedProfile: profile.profile, dependencies: [entity], configurationDependencies: [] };
  const definition = { id: uuid(1), organisationId: "business", kind, revision: 7, latestVersion: 3, activeVersionId: uuid(2) as string | null, retiredAt: null as Date | null };
  return { definition, row: { id: uuid(2), organisationId: "business", definitionId: uuid(1), schemaVersion: 1,
    version: 3, payload, compiledPlan: plan, checksum: checksum(plan), definition, configurationDependencies: [] } };
}
beforeEach(() => {
  vi.clearAllMocks(); m.stamps.set(session, stamp); ({ definition, row } = fixture());
  m.refresh.mockImplementation(async (_session, operation) => operation(authority)); m.module.mockResolvedValue({ id: "studio" }); m.modules.mockResolvedValue(1);
  m.definition.mockImplementation(async ({ where }) => where.organisationId === "business" && where.id === definition.id ? definition : null);
  m.version.mockImplementation(async ({ where }) => where.organisationId === row.organisationId && where.definitionId === row.definitionId
    && (where.id === undefined || where.id === row.id) && (where.version === undefined || where.version === row.version) ? row : null);
  m.describe.mockImplementation((id: string) => ({ ...(id === entity.id ? entity : surface), lifecycle: "active" }));
  m.pageSource.mockReturnValue({ metadata: surface }); m.metadata.mockResolvedValue(approvals); m.profile.mockResolvedValue({});
  m.lock.mockResolvedValue(undefined); m.usage.mockResolvedValue(undefined); m.assignment.mockResolvedValue(null);
});
it("refreshes original active dispatch and reconstructs exact Page metadata without native Read, authoring Write or any data query", async () => {
  expect(await readActiveTransactionalDefinition({ ...session, capabilities: new Set() }, definition.id)).toMatchObject({ versionId: row.id, version: 3, plan: { kind: "page" } });
  expect(m.refresh).toHaveBeenCalledOnce(); expect(m.metadata).toHaveBeenCalledWith(authority, { sourcePage: { id: surface.id, version: surface.version, schemaHash: surface.schemaHash, contractHash: surface.contractHash }, customFields: [] });
  expect(session.capabilities.has("tickets.ticket.read")).toBe(false);
  expect(m.assignment).not.toHaveBeenCalled(); expect(m.lock).not.toHaveBeenCalled();
  expect(m.definition.mock.calls[0][0].where.organisationId).toBe("business");
});
it("retains the exact historical Page source instead of substituting a newly registered compatible source version", async () => {
  m.pageSource.mockReturnValue({ metadata: { ...surface, version: 2, schemaHash: "f".repeat(64) } });
  await expect(readActiveTransactionalDefinitionInTransaction(authority, definition.id)).resolves.toMatchObject({ plan: { kind: "page" } });
  expect(m.pageSource).not.toHaveBeenCalled();
  expect(m.metadata.mock.calls[0][1].sourcePage).toEqual({ id: surface.id, version: 1, schemaHash: surface.schemaHash, contractHash: surface.contractHash });
});
it.each(["entityProfile", "recordType"] as const)("reconstructs active %s through sealed runtime inspector rather than Write authoring compiler", async kind => {
  ({ definition, row } = fixture(kind));
  expect(await readActiveTransactionalDefinitionInTransaction(authority, definition.id)).toMatchObject({ plan: { kind } });
  expect(m.profile).toHaveBeenCalledWith(authority, { kind, definitionId: definition.id, versionId: row.id, schemaVersion: 1, checksum: row.checksum });
  expect(m.metadata).not.toHaveBeenCalled();
});
it.each(["forged", "read", "module"])("denies %s before loading definition metadata", async mode => {
  let supplied = authority;
  if (mode === "forged") supplied = { ...authority, session: { ...session } };
  if (mode === "read") { const current = { ...session, capabilities: new Set<string>() }; m.stamps.set(current, stamp); supplied = { ...authority, session: current }; }
  if (mode === "module") m.module.mockResolvedValue(null);
  await expect(readActiveTransactionalDefinitionInTransaction(supplied, definition.id)).rejects.toThrow();
  expect(m.definition).not.toHaveBeenCalled();
});
it("rejects a returned foreign definition even if a storage collaborator ignores the scoped predicate", async () => {
  m.definition.mockResolvedValue({ ...definition, organisationId: "foreign" });
  await expect(readActiveTransactionalDefinitionInTransaction(authority, definition.id)).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(m.metadata).not.toHaveBeenCalled();
});
it.each(["absent", "retired", "inactive"])("returns null for %s definitions without rebuilding an unavailable plan", async mode => {
  if (mode === "absent") m.definition.mockResolvedValue(null);
  if (mode === "retired") definition.retiredAt = new Date();
  if (mode === "inactive") definition.activeVersionId = null;
  expect(await readActiveTransactionalDefinitionInTransaction(authority, definition.id)).toBeNull();
  expect(m.metadata).not.toHaveBeenCalled();
});
it.each(["hash", "payload", "tenant", "edge", "reconstructed", "modules", "expired"])("rejects %s incompatibility without returning published metadata", async mode => {
  if (mode === "hash") row.checksum = "f".repeat(64);
  if (mode === "payload") row.payload = { ...page, sections: [] };
  if (mode === "tenant") { row.organisationId = "foreign"; m.version.mockResolvedValue(row); }
  if (mode === "edge") row.configurationDependencies = [{}] as never;
  if (mode === "reconstructed") m.metadata.mockResolvedValue({ ...approvals, maxQueryCost: 25 });
  if (mode === "modules") m.modules.mockResolvedValue(0);
  if (mode === "expired") m.describe.mockImplementation((id: string) => ({ ...(id === entity.id ? entity : surface), lifecycle: "deprecated", supportedUntil: "2000-01-01" }));
  await expect(readActiveTransactionalDefinitionInTransaction(authority, definition.id)).rejects.toThrow();
});
const removal = (mode: "retire" | "deactivate" = "retire") => ({ definitionId: uuid(1), revision: 7, mode });
it("guards Page removal with shared entity lock and transitive active usage before caller-owned mutation", async () => {
  expect(await assertTransactionalDefinitionCanBeRemovedInTransaction(authority, removal())).toMatchObject({ kind: "page", entityId: entity.id, revision: 7, activeVersionId: row.id });
  expect(m.lock).toHaveBeenCalledWith(transaction, "business", [entity.id]);
  expect(m.lock.mock.invocationCallOrder[0]).toBeLessThan(m.definition.mock.invocationCallOrder[1]);
  expect(m.usage).toHaveBeenCalledWith(session, transaction, { definitionId: definition.id });
  expect(m.assignment).not.toHaveBeenCalled(); expect(Object.keys(transaction)).not.toContain("auditEntry");
});
it.each(["revision", "after_lock", "usage"])("denies %s changes before assignment impact or successful removal", async mode => {
  if (mode === "revision") definition.revision = 8;
  if (mode === "after_lock") m.lock.mockImplementationOnce(async () => { definition = { ...definition, revision: 8 }; });
  if (mode === "usage") m.usage.mockRejectedValue(new Error("CONFIGURATION_IN_USE: active ancestor"));
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction(authority, removal())).rejects.toThrow();
  expect(m.assignment).not.toHaveBeenCalled();
});
it.each(["retire", "deactivate"] as const)("blocks %s of a type on canonical current heads without treating every retained assignment as active", async mode => {
  ({ definition, row } = fixture("recordType")); m.assignment.mockResolvedValue({ id: uuid(99) });
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction(authority, removal(mode))).rejects.toThrow("CONFIGURATION_IN_USE");
  expect(m.assignment.mock.calls[0][0]).toEqual({ where: { organisationId: "business", recordTypeAssignment: {
    organisationId: "business", recordTypeDefinitionId: definition.id } }, select: { id: true } });
  expect(m.usage.mock.invocationCallOrder[0]).toBeLessThan(m.assignment.mock.invocationCallOrder[0]);
});
it("blocks base retirement for a current retained base head but permits base deactivation when no active config references it", async () => {
  ({ definition, row } = fixture("entityProfile")); m.assignment.mockResolvedValue({ id: uuid(99) });
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction(authority, removal())).rejects.toThrow("CONFIGURATION_IN_USE");
  expect(m.assignment.mock.calls[0][0].where.recordTypeAssignment.baseProfileDefinitionId).toBe(definition.id);
  m.assignment.mockClear();
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction(authority, removal("deactivate"))).resolves.toMatchObject({ mode: "deactivate" });
  expect(m.assignment).not.toHaveBeenCalled();
});
it("uses latest sealed inactive publication and rejects draft-only/unsealed removal authority", async () => {
  definition.activeVersionId = null;
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction(authority, removal())).resolves.toMatchObject({ activeVersionId: null });
  expect(m.version.mock.calls[0][0].where).toMatchObject({ version: 3, organisationId: "business" });
  m.version.mockResolvedValue(null);
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction(authority, removal())).rejects.toThrow("DEPENDENCY_BROKEN");
});
it("keeps publish capability, supported kinds and strict server-derived tenant boundaries mandatory", async () => {
  const readOnly = { ...session, capabilities: new Set(["studio.definition.read"]) }; m.stamps.set(readOnly, stamp);
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction({ ...authority, session: readOnly }, removal())).rejects.toThrow("FORBIDDEN");
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction(authority, { ...removal(), organisationId: "foreign" })).rejects.toThrow();
  definition.kind = "process" as never;
  await expect(assertTransactionalDefinitionCanBeRemovedInTransaction(authority, removal())).rejects.toThrow();
});
