import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { Prisma } from "@/generated/prisma/client";
import { checksum } from "@/core/studio/registry/contracts";
import { pagePayloadSchema } from "@/core/studio/pages/schema";
const m = vi.hoisted(() => ({ compile: vi.fn(), draft: vi.fn(), create: vi.fn(), update: vi.fn(), versions: vi.fn(), version: vi.fn(),
  audit: vi.fn(), publish: vi.fn(), activate: vi.fn(), lock: vi.fn() }));
vi.mock("@/core/studio/pages/definition-compiler", () => ({ compileStructuredPage: m.compile, compileRetainedStructuredPage: m.compile }));
vi.mock("@/core/studio/definitions/publication", () => ({ publishCompiledDefinitionInTransaction: m.publish }));
vi.mock("@/core/studio/definitions/activation", () => ({ activateCompiledVersionInTransaction: m.activate }));
vi.mock("@/core/studio/fields/entity-lock", () => ({ lockFieldEntitiesInTransaction: m.lock }));
vi.mock("@/core/audit/log", () => ({ writeAudit: m.audit }));
import { createPageDraftInTransaction, savePageDraftInTransaction, reviewPageDraftInTransaction,
  publishPageDraftInTransaction, restorePageVersionInTransaction } from "@/core/studio/authoring/pages";
const id = "00000000-0000-4000-8000-000000000001", versionId = "00000000-0000-4000-8000-000000000002";
const session = { organisationId: "business-a", userId: "actor", capabilities: new Set(["studio.definition.edit", "studio.definition.publish"]) } as Session;
const transaction = { studioDefinition: { create: m.create }, studioDraft: { findFirst: m.draft, updateMany: m.update },
  studioDefinitionVersion: { findFirst: m.version, findMany: m.versions } } as unknown as Prisma.TransactionClient;
const authority = { session, transaction } as FieldRuntimeAuthority;
const payload = pagePayloadSchema.parse({ schemaVersion: 1, entity: { id: "sales.order", version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) },
  formFactors: ["desktop", "tablet", "phone"], sections: [{ id: "main", label: "Order", columns: { desktop: 2, tablet: 2, phone: 1 },
    formFactors: ["desktop", "tablet", "phone"], components: [{ id: "guide", type: "instructions", text: "Help", formFactors: ["desktop", "tablet", "phone"] }] }] });
let compiled: { payload: typeof payload; plan: { kind: string; schemaVersion: number; payload: typeof payload; dependencies: []; configurationDependencies: [] }; checksum: string; warnings: string[] };
beforeEach(() => {
  vi.clearAllMocks();
  const plan = { kind: "page", schemaVersion: 1, payload, dependencies: [] as [], configurationDependencies: [] as [] };
  compiled = { payload, plan, checksum: checksum(plan), warnings: [] };
  m.compile.mockResolvedValue(compiled); m.create.mockResolvedValue({ id }); m.update.mockResolvedValue({ count: 1 });
  m.draft.mockResolvedValue({ id: "draft", organisationId: "business-a", definitionId: id, revision: 3, payload,
    definition: { id, revision: 7, latestVersion: 1 }, baseVersion: { version: 1 } });
  m.publish.mockResolvedValue({ version: { id: versionId }, versionNumber: 2, draftRevision: 4 });
  m.activate.mockResolvedValue({ revision: 9 });
});
it("creates a human-named screen in the genuine authority tenant with an internal key and same-transaction Audit", async () => {
  expect(await createPageDraftInTransaction(authority, { name: "  Our sales order  ", payload })).toEqual({ id });
  const data = m.create.mock.calls[0][0].data;
  expect(data).toMatchObject({ organisationId: "business-a", name: "Our sales order", kind: "page", createdBy: "actor" });
  expect(data.key).toMatch(/^screen\.[a-f0-9-]{36}$/);
  expect(m.compile).toHaveBeenCalledWith(authority, payload);
  expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ organisationId: "business-a", actorUserId: "actor" }), transaction);
});
it("rejects caller tenant/plan/approval extras before draft changes", async () => {
  for (const extra of [{ organisationId: "business-b" }, { compiledPlan: {} }, { approvals: {} }])
    await expect(createPageDraftInTransaction(authority, { name: "Order", payload, ...extra })).rejects.toThrow();
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("saves with scoped draft CAS, fresh compiler and original Audit without creating a live version", async () => {
  expect(await savePageDraftInTransaction(authority, { definitionId: id, revision: 3, payload })).toMatchObject({ revision: 4 });
  expect(m.draft.mock.calls[0][0].where).toMatchObject({ organisationId: "business-a", definitionId: id, revision: 3 });
  expect(m.update.mock.calls[0][0]).toMatchObject({ where: { id: "draft", organisationId: "business-a", revision: 3 },
    data: { validation: { checksum: compiled.checksum, validatedRevision: 4 } } });
  expect(m.publish).not.toHaveBeenCalled(); expect(m.activate).not.toHaveBeenCalled();
});
it("keeps missing/stale drafts and lost CAS closed without successful Audit", async () => {
  m.draft.mockResolvedValueOnce(null);
  await expect(savePageDraftInTransaction(authority, { definitionId: id, revision: 3, payload })).rejects.toThrow("CONFLICT:");
  m.update.mockResolvedValueOnce({ count: 0 });
  await expect(savePageDraftInTransaction(authority, { definitionId: id, revision: 3, payload })).rejects.toThrow("CONFLICT:");
  expect(m.audit).not.toHaveBeenCalled();
});
it("review uses only the saved draft and persists its exact revision", async () => {
  await reviewPageDraftInTransaction(authority, { definitionId: id, revision: 3 });
  expect(m.compile).toHaveBeenCalledWith(authority, payload);
  expect(m.update.mock.calls[0][0].data.validation.validatedRevision).toBe(3);
  await expect(reviewPageDraftInTransaction(authority, { definitionId: id, revision: 3, payload })).rejects.toThrow();
});
it("publishes and activates through the original primitives in one caller transaction and fresh definition CAS", async () => {
  expect(await publishPageDraftInTransaction(authority, { definitionId: id, revision: 3, acknowledgeWarnings: false }))
    .toEqual({ revision: 4, definitionRevision: 9, versionId, version: 2 });
  expect(m.publish).toHaveBeenCalledWith(transaction, session, expect.objectContaining({ revision: 3 }), 3, compiled);
  expect(m.activate).toHaveBeenCalledWith(transaction, session, id, 8, { id: versionId }, compiled);
  expect(m.compile.mock.invocationCallOrder[0]).toBeLessThan(m.publish.mock.invocationCallOrder[0]);
});
it("warned publications and activation failures cannot return successful go-live", async () => {
  m.compile.mockResolvedValueOnce({ ...compiled, warnings: ["Review this source"] });
  await expect(publishPageDraftInTransaction(authority, { definitionId: id, revision: 3, acknowledgeWarnings: false })).rejects.toThrow("acknowledge");
  expect(m.publish).not.toHaveBeenCalled();
  m.activate.mockRejectedValueOnce(new Error("runtime pair unavailable"));
  await expect(publishPageDraftInTransaction(authority, { definitionId: id, revision: 3, acknowledgeWarnings: true })).rejects.toThrow("runtime pair");
});
it("restoring an earlier screen requires its tenant seal and fresh compiler before original activation", async () => {
  const sealed = { id: versionId, definitionId: id, organisationId: session.organisationId, schemaVersion: 1,
    payload, compiledPlan: compiled.plan, configurationDependencies: [], definition: { kind: "page", retiredAt: null } };
  m.version.mockResolvedValue({ ...sealed, checksum: "f".repeat(64) });
  await expect(restorePageVersionInTransaction(authority, { definitionId: id, versionId, definitionRevision: 9 })).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(m.activate).not.toHaveBeenCalled();
  m.version.mockResolvedValue({ ...sealed, checksum: compiled.checksum });
  await restorePageVersionInTransaction(authority, { definitionId: id, versionId, definitionRevision: 9 });
  expect(m.version.mock.calls[1][0].where).toMatchObject({ organisationId: "business-a", definitionId: id, id: versionId });
  expect(m.activate).toHaveBeenCalledWith(transaction, session, id, 9, expect.objectContaining({ id: versionId }), compiled);
});
it("edit and publication remain independent permissions", async () => {
  const denied = { ...authority, session: { ...session, capabilities: new Set(["studio.definition.edit"]) } };
  await expect(publishPageDraftInTransaction(denied, { definitionId: id, revision: 3, acknowledgeWarnings: false })).rejects.toThrow("FORBIDDEN");
  expect(m.draft).not.toHaveBeenCalled();
});
