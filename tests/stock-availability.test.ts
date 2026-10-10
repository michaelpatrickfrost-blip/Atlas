import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: { userId: "u", organisationId: "tenant", capabilities: new Set<string>() },
  invoices: vi.fn(), quantities: vi.fn(),
  enabled: new Set(["stock", "sales", "logistics", "finance"]),
  db: Object.fromEntries(["product", "inventoryBalance", "stockReservation", "stockPosition", "salesOrderLine", "fulfilmentLine", "financeDocumentLine", "productionPlanLine", "manufacturingOrder", "receiptLine", "financeDocument", "salesOrder"].map(name => [name, { findMany: vi.fn(), findFirst: vi.fn() }])),
}));
vi.mock("@/core/finance/connections", () => ({ readOrderInvoices: state.invoices, readInvoiceQuantities: state.quantities }));
vi.mock("@/core/db/client", () => ({ db: state.db }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: async () => state.enabled, isModuleEnabled: async (_session: unknown, moduleId: string) => state.enabled.has(moduleId) }));
import { readAvailability, readOrderChain } from "@/modules/stock/services/availability";

beforeEach(() => {
  vi.clearAllMocks();
  state.invoices.mockResolvedValue([]); state.quantities.mockResolvedValue([]);
  state.session.capabilities = new Set(["sales.order.read"]);
  state.enabled = new Set(["stock", "sales", "logistics", "finance"]);
  for (const model of Object.values(state.db)) model.findMany.mockResolvedValue([]);
  state.db.product.findMany.mockResolvedValue([{ id: "p", unitOfMeasure: "each" }]);
  state.db.salesOrderLine.findMany.mockResolvedValue([{ id: "open", productId: "p", orderedQuantity: 100, cancelledQuantity: 0, unitOfMeasure: "each" }]);
  state.db.inventoryBalance.findMany.mockResolvedValue([{ productId: "p", quantity: 20 }]);
  state.db.salesOrder.findFirst.mockResolvedValue({ id: "order", lines: [{ id: "open", productId: "p", orderedQuantity: 100, cancelledQuantity: 0, unitOfMeasure: "each", descriptionSnapshot: "Product" }] });
});

describe("shared operational availability", () => {
  it("historical deliveries cannot erase demand from an unrelated open order", async () => {
    state.db.fulfilmentLine.findMany.mockResolvedValue([
      { productId: "p", salesOrderLineId: "historical", allocatedQuantity: 1000, shippedQuantity: 1000, deliveredQuantity: 1000 },
      { productId: "p", salesOrderLineId: "open", allocatedQuantity: 10, shippedQuantity: 10, deliveredQuantity: 10 },
    ]);
    const result = await readAvailability();
    expect(result.products[0]).toMatchObject({ ordered: 100, delivered: 10, shipped: 10, openDemand: 90, available: -70 });
    expect(result.deliveredByLine.open).toBe(10);
  });

  it("stock already shipped leaves open inventory demand even before delivery", async () => {
    state.db.fulfilmentLine.findMany.mockResolvedValue([{ productId: "p", salesOrderLineId: "open", allocatedQuantity: 40, shippedQuantity: 40, deliveredQuantity: 0 }]);
    expect((await readAvailability()).products[0]).toMatchObject({ openDemand: 60, available: -40, toInvoice: null });
  });

  it("caps fulfilment against its own line instead of consuming another line's demand", async () => {
    state.db.salesOrderLine.findMany.mockResolvedValue([
      { id: "small", productId: "p", orderedQuantity: 10, cancelledQuantity: 0, unitOfMeasure: "each" },
      { id: "large", productId: "p", orderedQuantity: 100, cancelledQuantity: 0, unitOfMeasure: "each" },
    ]);
    state.db.fulfilmentLine.findMany.mockResolvedValue([{ productId: "p", salesOrderLineId: "small", allocatedQuantity: 50, shippedQuantity: 50, deliveredQuantity: 50 }]);
    expect((await readAvailability()).products[0]).toMatchObject({ openDemand: 100, available: -80 });
  });

  it("nets mixed shipped and delivered lines independently", async () => {
    state.db.salesOrderLine.findMany.mockResolvedValue(["a", "b"].map(id => ({ id, productId: "p", orderedQuantity: 50, cancelledQuantity: 0, unitOfMeasure: "each" })));
    state.db.fulfilmentLine.findMany.mockResolvedValue([
      { productId: "p", salesOrderLineId: "a", allocatedQuantity: 20, shippedQuantity: 20, deliveredQuantity: 0 },
      { productId: "p", salesOrderLineId: "b", allocatedQuantity: 20, shippedQuantity: 0, deliveredQuantity: 20 },
    ]);
    expect((await readAvailability()).products[0]).toMatchObject({ openDemand: 60, available: -40 });
  });

  it("does not mix incompatible sales units into the base-unit stock projection", async () => {
    state.db.salesOrderLine.findMany.mockResolvedValue([{ id: "packs", productId: "p", orderedQuantity: 100, cancelledQuantity: 0, unitOfMeasure: "pack" }]);
    state.db.fulfilmentLine.findMany.mockResolvedValue([{ productId: "p", salesOrderLineId: "packs", allocatedQuantity: 10, shippedQuantity: 10, deliveredQuantity: 10 }]);
    expect((await readAvailability()).products[0]).toMatchObject({ ordered: 0, delivered: 0, available: 20 });
  });

  it("includes outstanding expected receipts in projected supply without calling them on hand", async () => {
    state.db.receiptLine.findMany.mockResolvedValue([{ productId: "p", expectedQuantity: 50, receivedQuantity: 20, receipt: { expectedOn: new Date("2026-10-20") } }]);
    expect((await readAvailability()).products[0]).toMatchObject({ onHand: 20, availableNow: 20, incoming: 30, available: -50 });
  });

  it("omits financial quantities from shared availability without Finance access", async () => {
    const result = await readAvailability();
    expect(result.products[0]).toMatchObject({ invoiced: null, toInvoice: null });
    expect(state.quantities).not.toHaveBeenCalled();
    state.session.capabilities.add("finance.receivables.read");
    state.quantities.mockResolvedValue([{ productId: "p", salesOrderLineId: "open", quantity: 7 }]);
    expect((await readAvailability()).products[0].invoiced).toBe(7);
  });

  it("scopes every operational query to the authenticated tenant", async () => {
    await readAvailability();
    for (const model of Object.values(state.db)) for (const [query] of model.findMany.mock.calls) {
      expect(JSON.stringify(query.where)).toContain('"organisationId":"tenant"');
    }
  });

  it("rejects callers without an operational read capability before reading records", async () => {
    state.session.capabilities.clear();
    await expect(readAvailability()).rejects.toThrow("FORBIDDEN");
    expect(state.db.inventoryBalance.findMany).not.toHaveBeenCalled();
  });
});

describe("order chain financial boundary", () => {
  it("does not query invoice metadata for an order-only viewer", async () => {
    const result = await readOrderChain("order");
    expect(state.invoices).not.toHaveBeenCalled();
    expect(result?.invoices).toEqual([]);
    expect(result?.lines[0].invoiced).toBeNull();
    expect(result?.financeVisible).toBe(false);
  });

  it("permits invoice projection only with the Finance capability and enabled app", async () => {
    state.session.capabilities.add("finance.receivables.read");
    state.invoices.mockResolvedValue([{ id: "invoice", reference: "INV-1", status: "DRAFT", documentDate: "2026-10-08T00:00:00.000Z", lines: [{ salesOrderLineId: "open", quantity: 10 }] }]);
    const result = await readOrderChain("order");
    expect(result?.invoices[0].reference).toBe("INV-1");
    expect(result?.lines[0].invoiced).toBe(10);
    state.enabled.delete("finance");
    state.invoices.mockClear();
    expect((await readOrderChain("order"))?.financeVisible).toBe(false);
    expect(state.invoices).not.toHaveBeenCalled();
  });

  it("does not read a different tenant's chain", async () => {
    state.db.salesOrder.findFirst.mockResolvedValue(null);
    expect(await readOrderChain("foreign")).toBeNull();
    expect(state.db.salesOrder.findFirst.mock.calls[0][0].where).toEqual({ id: "foreign", organisationId: "tenant" });
    expect(state.invoices).not.toHaveBeenCalled();
  });
});
