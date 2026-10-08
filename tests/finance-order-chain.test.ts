import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const state = vi.hoisted(() => ({ order: vi.fn(), documents: vi.fn(), lines: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { salesOrder: { findFirst: state.order }, financeDocument: { findMany: state.documents }, financeDocumentLine: { findMany: state.lines } } }));
import { salesInvoiceChain, salesInvoiceQuantities } from "@/modules/finance/services/order-chain";
const session = { organisationId: "tenant", userId: "viewer", capabilities: new Set(["finance.receivables.read"]) } as Session;
beforeEach(() => { vi.clearAllMocks(); state.order.mockResolvedValue({ id: "order" }); state.documents.mockResolvedValue([]); state.lines.mockResolvedValue([]); });
it("does not read Finance records without permission", async () => {
  expect(await salesInvoiceChain({ ...session, capabilities: new Set() }, "order")).toEqual([]);
  expect(state.order).not.toHaveBeenCalled(); expect(state.documents).not.toHaveBeenCalled();
});
it("checks the source tenant and applies Finance's project visibility predicate", async () => {
  await salesInvoiceChain(session, "order");
  expect(state.order.mock.calls[0][0].where).toEqual({ id: "order", organisationId: "tenant" });
  const scope = state.documents.mock.calls[0][0].where;
  expect(scope.AND[0]).toMatchObject({ organisationId: "tenant", AND: [{ OR: [{ projectId: null }, { projectId: null }] }, expect.anything()] });
  expect(scope.AND[1]).toEqual({ salesOrderId: "order", kind: "AR_INVOICE", status: { not: "CANCELLED" } });
});
it("does not reveal Finance records when the source order is unavailable", async () => {
  state.order.mockResolvedValue(null);
  expect(await salesInvoiceChain(session, "foreign")).toEqual([]); expect(state.documents).not.toHaveBeenCalled();
});
it("returns a narrow serialisable invoice projection", async () => {
  state.documents.mockResolvedValue([{ id: "i", reference: "INV", status: "POSTED", documentDate: new Date("2026-10-08"), lines: [{ salesOrderLineId: "line", quantity: { toString: () => "5" } }] }]);
  expect(await salesInvoiceChain(session, "order")).toEqual([{ id: "i", reference: "INV", status: "POSTED", documentDate: "2026-10-08T00:00:00.000Z", lines: [{ salesOrderLineId: "line", quantity: 5 }] }]);
});

it("scopes shared invoiced quantities to accessible Finance documents and the requested source lines", async () => {
  state.lines.mockResolvedValue([{ productId: "p", salesOrderLineId: "l", quantity: 3, document: { kind: "AR_CREDIT" } }]);
  expect(await salesInvoiceQuantities(session, ["l"])).toEqual([{ productId: "p", salesOrderLineId: "l", quantity: -3 }]);
  expect(state.lines.mock.calls[0][0].where).toMatchObject({ organisationId: "tenant", salesOrderLineId: { in: ["l"] }, document: { AND: [{ organisationId: "tenant" }, expect.anything()] } });
});
it("does not query financial quantities without permission or requested source lines", async () => {
  expect(await salesInvoiceQuantities({ ...session, capabilities: new Set() }, ["l"])).toEqual([]);
  expect(await salesInvoiceQuantities(session, [])).toEqual([]);
  expect(state.lines).not.toHaveBeenCalled();
});
