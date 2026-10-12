import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ refresh: vi.fn(), workspace: vi.fn(), resolve: vi.fn(), sources: vi.fn(), records: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ nativeFieldMutationSessionInTransaction: m.refresh }));
vi.mock("@/core/templates/service", () => ({ requireTemplateWorkspace: m.workspace, resolveTemplateContext: m.resolve, templateSources: m.sources, templateRecords: m.records }));
import { listDocumentPreviewRecordsInTransaction, previewDocumentInTransaction } from "@/core/templates/preview";
import { documentDetailKey, templateTextPieces, templateTableRows, templateTableText } from "@/core/templates/editor-model";
const authenticated = { organisationId: "business", capabilities: new Set(["core.contract.manage"]) } as Session;
const current = { ...authenticated, capabilities: new Set(authenticated.capabilities) };
const tx = new Proxy({}, { get() { throw new Error("Preview must never mutate a store."); } }) as Prisma.TransactionClient;
const packet = { titleTemplate: "Order for {{customer.name}}", blocks: [{ id: "body", type: "text", text: "{{custom.delivery_note}}" }],
  targetModules: ["sales"], sourceModule: "sales", sourceType: "order", sourceId: "order" };
beforeEach(() => { vi.clearAllMocks(); current.capabilities = new Set(authenticated.capabilities); m.refresh.mockResolvedValue({ session: current });
  m.workspace.mockResolvedValue(undefined); m.resolve.mockResolvedValue({ fields: { "customer.name": "Native customer" }, source: { label: "Order" }, brand: { name: "Business" } });
  m.sources.mockResolvedValue([{ module: "sales", type: "order", label: "Sales order" }]); m.records.mockResolvedValue([{ id: "order", label: "Order" }]); });
it("uses current authority and original source resolver without a preview mutation or client facts", async () => {
  expect(await previewDocumentInTransaction(authenticated, tx, packet)).toEqual({ fields: { "customer.name": "Native customer" }, sourceLabel: "Order", companyName: "Business" });
  expect(m.refresh.mock.calls[0][0]).toBe(authenticated); expect(m.refresh.mock.calls[0][1]).toBe(tx); expect(m.resolve).toHaveBeenCalledWith(current, packet);
  expect(m.refresh.mock.invocationCallOrder[0]).toBeLessThan(m.resolve.mock.invocationCallOrder[0]);
});
it.each(["current_grant", "identity", "module", "source"])("fails closed on %s instead of keeping old preview values", async mode => {
  if (mode === "current_grant") current.capabilities.clear();
  if (mode === "identity") m.refresh.mockRejectedValueOnce(new Error("FORBIDDEN"));
  if (mode === "module") m.workspace.mockRejectedValueOnce(new Error("Disabled"));
  if (mode === "source") m.resolve.mockRejectedValueOnce(new Error("FORBIDDEN: source Read"));
  await expect(previewDocumentInTransaction(authenticated, tx, packet)).rejects.toThrow();
  if (mode !== "source") expect(m.resolve).not.toHaveBeenCalled();
});
it.each([{ organisationId: "foreign" }, { fields: { "customer.name": "Forged" } }, { targetModules: ["finance"] }, { targetModules: ["crm"] },
 { blocks: [{ id: "body", type: "text", text: "{{customer.bank}}" }] }, { sourceId: "" }])("validates untrusted preview metadata before provider reads %#", async extra => {
  await expect(previewDocumentInTransaction(authenticated, tx, { ...packet, ...extra })).rejects.toThrow(); expect(m.resolve).not.toHaveBeenCalled();
});
it("lists only original currently authorised sources for selected apps, bounded and no source facts", async () => {
  expect(await listDocumentPreviewRecordsInTransaction(authenticated, tx, ["sales"])).toEqual([{ module: "sales", type: "order", id: "order", label: "Sales order · Order" }]);
  expect(m.records).toHaveBeenCalledWith(current, "sales", "order");
  m.records.mockClear(); expect(await listDocumentPreviewRecordsInTransaction(authenticated, tx, ["crm"])).toEqual([]); expect(m.records).not.toHaveBeenCalled();
});
it("retains exact historical token spelling and table separators while hiding technical identifiers in controls", () => {
  const text = "Terms {{ customer.name }} · {{custom.delivery_note}}.";
  expect(templateTextPieces(text).map(piece => piece.value).join("")).toBe(text);
  expect(documentDetailKey("Delivery note")).toBe("custom.delivery_note");
  expect(() => documentDetailKey("99" )).toThrow();
  const table = "A| B\nC|D"; expect(templateTableText(templateTableRows(table))).toBe(table);
});
