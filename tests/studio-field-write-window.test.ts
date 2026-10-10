import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { closeFieldWriteWindow } from "@/core/studio/fields/runtime-write-window";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { FieldWriteRequest } from "@/core/studio/fields/runtime-write-contract";
const m = vi.hoisted(() => ({ publication: vi.fn(), preparation: vi.fn(), inspection: vi.fn(), window: vi.fn(), cutover: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/studio/fields/migrations/settlement-inspection", () => ({ inspectFieldMigrationSettlementIdentity: m.inspection, inspectFieldMigrationSettlementWindow: m.window }));
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
let authority: FieldRuntimeAuthority;
let request: FieldWriteRequest;
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture();
  authority = { session: { ...f.session, capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) }, registry: f.registry,
    stamp: { userId: "actor", organisationId: "company", membershipId: "member", authVersion: 3, sessionVersion: 2 },
    transaction: { studioFieldMigrationPublication: { findFirst: m.publication, updateMany: m.update }, studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationCutover: { updateMany: m.cutover }, auditEntry: { create: m.audit } } as unknown as Prisma.TransactionClient };
  request = { operationId: uuid(60), definitionId: f.definition.id, versionId: f.target.id, generationId: f.target.payload.storageGeneration,
    definitionRevision: f.definition.revision, recordId: "native", recordRevision: 7, extensionRevision: 3, slotRevision: 1, valueRevision: 1, value: "12.5" };
  m.publication.mockResolvedValue({ ...f.publication, state: "CUTOVER" }); m.preparation.mockResolvedValue(f.preparation);
  m.inspection.mockResolvedValue({ retained: f.retained, definition: f.definition, target: f.target, publication: f.publication });
  m.cutover.mockResolvedValue({ count: 1 }); m.update.mockResolvedValue({ count: 1 }); m.audit.mockResolvedValue({ id: "support-audit" });
});
it("closes only the actual unchanged target window with current customer identity and paired metadata Audit", async () => {
  await closeFieldWriteWindow(authority, request);
  expect(m.window).toHaveBeenCalledWith(authority.transaction, expect.anything(), "FINALIZED");
  expect(m.cutover).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: "company", state: "ACTIVATED", revision: 0 }), data: expect.objectContaining({ state: "FINALIZED", revision: 1, settledBy: "actor", settlementPin: expect.objectContaining({ principal: { ...authority.stamp, authority: "customer" } }) }) }));
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ data: { state: "COMPLETED", revision: 2 } }));
  expect(m.audit).toHaveBeenCalledTimes(1); expect(m.audit.mock.calls[0][0].data.after.trigger).toBe("ordinary_field_save");
  expect(authority.session.capabilities.has("studio.definition.publish")).toBe(false);
});
it("performs no settlement outside a window and freezes source/unfinished target saves before mutation", async () => {
  m.publication.mockResolvedValue(null); await closeFieldWriteWindow(authority, request); expect(m.inspection).not.toHaveBeenCalled();
  for (const state of ["PUBLISHED", "CUTOVER"]) {
    m.publication.mockResolvedValue({ ...f.publication, state });
    await expect(closeFieldWriteWindow(authority, { ...request, generationId: f.source.payload.storageGeneration })).rejects.toThrow("FIELD_MIGRATION_IN_PROGRESS");
  }
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("rejects stale configuration before a receipt, and propagates Audit/CAS failure for atomic rollback", async () => {
  await expect(closeFieldWriteWindow(authority, { ...request, definitionRevision: 99 })).rejects.toThrow("CONFLICT"); expect(m.cutover).not.toHaveBeenCalled();
  m.cutover.mockResolvedValue({ count: 0 }); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("CONFLICT"); expect(m.update).not.toHaveBeenCalled();
  m.cutover.mockResolvedValue({ count: 1 }); m.audit.mockRejectedValue(new Error("Audit unavailable"));
  await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("Audit unavailable");
});
it("retains affiliated staff as audited support, never as a customer principal", async () => {
  authority.session.capabilities.add("atlas.staff.manage"); authority.session.capabilities.add("atlas.companies.manage");
  await closeFieldWriteWindow(authority, request);
  expect(m.audit.mock.calls[0][0].data).toMatchObject({ action: "studio.field.migration.support_opened", entityId: "member", after: { ...authority.stamp, fromOrganisationId: "company" } });
  expect(m.cutover.mock.calls[0][0].data.settlementPin.principal).toEqual({ ...authority.stamp, authority: "staff_support", auditId: "support-audit" });
  expect(m.audit).toHaveBeenCalledTimes(2);
});
