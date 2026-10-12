import { beforeEach, expect, it, vi } from "vitest";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
const m = vi.hoisted(() => ({ refresh: vi.fn(), compile: vi.fn(), module: vi.fn(), draft: vi.fn(), draftUpdate: vi.fn(), definitionUpdate: vi.fn(),
  audit: vi.fn(), publish: vi.fn(), activate: vi.fn(), version: vi.fn(), sealed: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/views/definition-compiler", () => ({ compileRegisteredView: m.compile }));
vi.mock("@/core/studio/views/seal", () => ({ loadSealedViewVersion: m.sealed }));
vi.mock("@/core/studio/definitions/publication", () => ({ publishCompiledDefinitionInTransaction: m.publish }));
vi.mock("@/core/studio/definitions/activation", () => ({ activateCompiledVersionInTransaction: m.activate }));
import { saveViewDraftInTransaction, reviewViewDraftInTransaction, publishViewDraftInTransaction, restoreViewVersionInTransaction } from "@/core/studio/authoring/views";
const id = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const payload = { schemaVersion: 1, sourceView: { id: "analytics.dashboard.view", version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) }, content: { name: "Overview" } };
const tx = { moduleState: { findFirst: m.module }, studioDraft: { findFirst: m.draft, updateMany: m.draftUpdate }, studioDefinition: { updateMany: m.definitionUpdate },
  studioDefinitionVersion: { findFirst: m.version }, auditEntry: { create: m.audit } };
let authority: FieldRuntimeAuthority;
beforeEach(() => {
  vi.clearAllMocks(); authority = { session: { organisationId: "a", userId: "actor", capabilities: new Set(["studio.definition.edit", "studio.definition.publish"]) }, transaction: tx } as unknown as FieldRuntimeAuthority;
  m.refresh.mockResolvedValue(authority); m.module.mockResolvedValue({ id: "studio" }); m.compile.mockResolvedValue({ payload, plan: {}, checksum: "c".repeat(64), warnings: [] });
  m.draft.mockResolvedValue({ id: id(3), definitionId: id(1), revision: 4, payload, definition: { revision: 8, name: "Overview" } });
  m.draftUpdate.mockResolvedValue({ count: 1 }); m.definitionUpdate.mockResolvedValue({ count: 1 }); m.audit.mockResolvedValue({ id: "audit" });
  m.publish.mockResolvedValue({ draftRevision: 5, versionNumber: 2, version: { id: id(2), version: 2 } }); m.activate.mockResolvedValue({ revision: 10 });
  m.version.mockResolvedValue({ checksum: "c".repeat(64), schemaVersion: 1, version: 2 }); m.sealed.mockResolvedValue({ id: id(2), payload });
});
// Orchestration contracts only: original publisher/activation, genuine issuance
// and actual SQL commit/rollback are independent real central gate obligations.
it("publishes and activates through original primitives in ONE supplied transaction with resulting definition CAS", async () => {
  expect(await publishViewDraftInTransaction(authority, { definitionId: id(1), revision: 4, acknowledgeWarnings: false })).toEqual({ revision: 5, definitionRevision: 10, versionId: id(2), version: 2 });
  expect(m.refresh).toHaveBeenCalledWith(authority.session, tx);
  expect(m.publish.mock.calls[0].slice(0, 2)).toEqual([tx, authority.session]);
  expect(m.activate.mock.calls[0].slice(0, 4)).toEqual([tx, authority.session, id(1), 9]);
  expect(m.publish.mock.invocationCallOrder[0]).toBeLessThan(m.activate.mock.invocationCallOrder[0]);
});
it("activation errors propagate to the owning transaction without retry or fallback", async () => {
  m.activate.mockRejectedValue(new Error("Audit failed"));
  await expect(publishViewDraftInTransaction(authority, { definitionId: id(1), revision: 4, acknowledgeWarnings: false })).rejects.toThrow("Audit failed");
  expect(m.publish).toHaveBeenCalledTimes(1); expect(m.activate).toHaveBeenCalledTimes(1);
});
it("renames original metadata with definition CAS then saves draft revision and Audit in same transaction", async () => {
  await saveViewDraftInTransaction(authority, { definitionId: id(1), revision: 4, name: "Renamed", payload });
  expect(m.definitionUpdate.mock.calls[0][0]).toMatchObject({ where: { id: id(1), organisationId: "a", revision: 8, retiredAt: null }, data: { name: "Renamed", revision: { increment: 1 } } });
  expect(m.draftUpdate.mock.calls[0][0]).toMatchObject({ where: { organisationId: "a", revision: 4 }, data: { revision: { increment: 1 } } });
  expect(m.audit.mock.calls[0][0].data.action).toBe("studio.draft.updated");
});
it("stale rename stops before draft save or Audit; review stores exact reviewed revision without publishing", async () => {
  m.definitionUpdate.mockResolvedValueOnce({ count: 0 });
  await expect(saveViewDraftInTransaction(authority, { definitionId: id(1), revision: 4, name: "Rename", payload })).rejects.toThrow("CONFLICT");
  expect(m.draftUpdate).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  await reviewViewDraftInTransaction(authority, { definitionId: id(1), revision: 4 });
  expect(m.draftUpdate.mock.calls[0][0].data.validation.validatedRevision).toBe(4); expect(m.publish).not.toHaveBeenCalled();
});
it("restore loads exact sealed tenant version and delegates original activation with caller definition revision", async () => {
  await restoreViewVersionInTransaction(authority, { definitionId: id(1), versionId: id(2), definitionRevision: 8 });
  expect(m.version.mock.calls[0][0].where).toMatchObject({ organisationId: "a", definitionId: id(1), id: id(2), definition: { kind: "view", retiredAt: null } });
  expect(m.sealed.mock.calls[0][2]).toMatchObject({ definitionId: id(1), versionId: id(2), checksum: "c".repeat(64) });
  expect(m.activate.mock.calls[0][3]).toBe(8); expect(m.publish).not.toHaveBeenCalled();
});
it("current authoring module/grant denial stops before reading draft metadata", async () => {
  m.module.mockResolvedValue(null);
  await expect(reviewViewDraftInTransaction(authority, { definitionId: id(1), revision: 4 })).rejects.toThrow("FORBIDDEN"); expect(m.draft).not.toHaveBeenCalled();
  m.module.mockResolvedValue({ id: "studio" }); authority.session.capabilities.clear();
  await expect(publishViewDraftInTransaction(authority, { definitionId: id(1), revision: 4, acknowledgeWarnings: false })).rejects.toThrow("FORBIDDEN"); expect(m.draft).not.toHaveBeenCalled();
});
