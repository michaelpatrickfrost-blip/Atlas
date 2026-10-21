import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { checksum } from "@/core/studio/registry/contracts";
import type { CompiledRecordProfile } from "@/core/studio/record-types/compiler";
import { assertProfileBinding, bindPublishedProfile } from "@/core/studio/record-types/binding";

const id = "20000000-0000-4000-8000-000000000001", versionId = "20000000-0000-4000-8000-000000000002";
const session = { organisationId: "tenant-a" } as Session;
const findVersion = vi.fn(), findBinding = vi.fn(), createBinding = vi.fn(), lock = vi.fn();
const tx = { studioDefinitionVersion: { findFirst: findVersion }, studioProfileBinding: { findFirst: findBinding, create: createBinding },
  $queryRaw: lock } as unknown as Prisma.TransactionClient;
const entity = { id: "tickets.ticket", version: 9, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
const payload = { schemaVersion: 1 as const, entity, profile: { page: null, requiredFields: [], allowedProcesses: [], defaultDecisions: [] } };
const plan = { kind: "entityProfile" as const, schemaVersion: 1 as const, payload, resolvedProfile: payload.profile, dependencies: [], configurationDependencies: [] };
const compiled: CompiledRecordProfile = { payload, plan, checksum: checksum(plan), warnings: [] };
function stored() { return { id: versionId, schemaVersion: 1, checksum: compiled.checksum, compiledPlan: plan as object,
  definition: { kind: "entityProfile", key: "tickets.ticket.base_profile", retiredAt: null as Date | null } }; }
beforeEach(() => { vi.clearAllMocks(); findVersion.mockResolvedValue(stored()); findBinding.mockResolvedValue(null); });
it("binds only the exact tenant-owned server-compiled publication under the shared entity lock", async () => {
  await bindPublishedProfile(tx, session, id, "tickets.ticket.base_profile", versionId, compiled);
  expect(findVersion).toHaveBeenCalledWith(expect.objectContaining({ where: { id: versionId, definitionId: id, organisationId: "tenant-a" } }));
  expect(createBinding).toHaveBeenCalledWith({ data: { definitionId: id, organisationId: "tenant-a", entityId: "tickets.ticket", kind: "entityProfile", originVersionId: versionId } });
  expect(lock.mock.invocationCallOrder[0]).toBeLessThan(findVersion.mock.invocationCallOrder[0]);
});
it.each(["missing", "retired", "kind", "key", "checksum", "plan"])("rejects %s publication without inserting ownership", async mode => {
  const row = stored();
  if (mode === "missing") findVersion.mockResolvedValue(null);
  else { if (mode === "retired") row.definition.retiredAt = new Date();
    if (mode === "kind") row.definition.kind = "recordType";
    if (mode === "key") row.definition.key = "other.base_profile";
    if (mode === "checksum") row.checksum = "c".repeat(64);
    if (mode === "plan") row.compiledPlan = { ...plan, resolvedProfile: { ...payload.profile, page: { kind: "page", definitionId: id, versionId, schemaVersion: 1, checksum: "c".repeat(64) } } };
    findVersion.mockResolvedValue(row); }
  await expect(bindPublishedProfile(tx, session, id, "tickets.ticket.base_profile", versionId, compiled)).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(createBinding).not.toHaveBeenCalled();
});
it("retains the first origin across later publications and refuses changing its entity or kind", async () => {
  findBinding.mockResolvedValue({ entityId: "tickets.ticket", kind: "entityProfile" });
  await bindPublishedProfile(tx, session, id, "tickets.ticket.base_profile", versionId, compiled);
  expect(createBinding).not.toHaveBeenCalled();
  findBinding.mockResolvedValue({ entityId: "sales.order", kind: "entityProfile" });
  await expect(bindPublishedProfile(tx, session, id, "tickets.ticket.base_profile", versionId, compiled)).rejects.toThrow("DEPENDENCY_BROKEN");
});
it("refuses a client-altered payload or noncanonical base key before locking or loading versions", async () => {
  await expect(bindPublishedProfile(tx, session, id, "another.base_profile", versionId, compiled)).rejects.toThrow("DEPENDENCY_BROKEN");
  await expect(bindPublishedProfile(tx, session, id, "tickets.ticket.base_profile", versionId, { ...compiled, payload: { ...payload, entity: { ...entity, id: "sales.order" } } })).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(lock).not.toHaveBeenCalled(); expect(findVersion).not.toHaveBeenCalled();
});
it("asserts the exact tenant, definition, entity and profile kind without granting assignment", async () => {
  await expect(assertProfileBinding(tx, session, id, compiled)).rejects.toThrow("DEPENDENCY_BROKEN");
  findBinding.mockResolvedValue({ originVersionId: versionId });
  expect(await assertProfileBinding(tx, session, id, compiled)).toEqual({ originVersionId: versionId });
  expect(findBinding).toHaveBeenLastCalledWith({ where: { definitionId: id, organisationId: "tenant-a", entityId: "tickets.ticket", kind: "entityProfile" }, select: { originVersionId: true } });
});
