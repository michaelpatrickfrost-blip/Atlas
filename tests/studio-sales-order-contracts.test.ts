import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { ModuleManifest } from "@/core/modules/types";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { templateProviderAdapter } from "@/core/studio/registry/adapters";

const storage = vi.hoisted(() => ({
  salesOrder: { findFirst: vi.fn(), findMany: vi.fn() },
  salesOrderLine: { findFirst: vi.fn(), findMany: vi.fn() },
}));
const enabled = vi.hoisted(() => vi.fn());
vi.mock("@/core/db/client", () => ({ db: storage }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: enabled }));
import { salesStudioContract } from "@/modules/sales/services/studio";
import { salesTemplateContext } from "@/modules/sales/services/template-context";

const actor = (organisationId = "tenant-a", permissions = ["sales.order.read"]): Session => ({ organisationId,
  userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", organisationName: organisationId,
  membershipId: "member", capabilities: new Set(permissions) });
function registry() {
  const r = new CapabilityRegistry(async () => true);
  r.register("sales", salesStudioContract);
  return r;
}
function ref(r: CapabilityRegistry, id: string) {
  const m = r.describe(id, 1);
  return { id, version: 1, schemaHash: m.schemaHash, contractHash: m.contractHash };
}
const date = new Date("2026-10-11T12:00:00.000Z");
function header(id = "order-a") {
  return { id, reference: "SO-A", commercialStatus: "DRAFT", orderType: "STANDARD", revision: 3, updatedAt: date,
    partyId: "party-a", party: { name: "Customer", contacts: [{ email: "private@example.invalid" }] },
    customerPoReference: null, externalReference: null, tags: [], currency: "GBP", netAmount: 0, taxAmount: 0, grossAmount: 0,
    orderDate: date, requestedDeliveryDate: null, promisedDeliveryDate: null,
    internalNotes: "private", financeInstructions: "private", financeDocuments: [{ id: "private" }],
  };
}
describe("Sales Studio read-only owner contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks(); enabled.mockResolvedValue(undefined);
    storage.salesOrder.findFirst.mockResolvedValue(header()); storage.salesOrder.findMany.mockResolvedValue([]);
    storage.salesOrderLine.findFirst.mockResolvedValue(null); storage.salesOrderLine.findMany.mockResolvedValue([]);
  });
  it("contributes only read-only Sales contracts without changing existing template contracts", () => {
    const r = registry(), baseline = new CapabilityRegistry(async () => true);
    const legacy = templateProviderAdapter({ id: "sales", templateContextProvider: salesTemplateContext } as ModuleManifest);
    baseline.register("sales", { contributions: legacy }); r.register("sales", { contributions: legacy });
    for (const entry of legacy) expect(r.describe(entry.metadata.id, 1)).toEqual(baseline.describe(entry.metadata.id, 1));
    expect(salesStudioContract.contributions.map(c => [c.metadata.id, c.metadata.kind])).toEqual([
      ["sales.order", "entity"], ["sales.order.preview_acknowledgement", "command"], ["sales.order.list", "query"], ["sales.order.get", "query"], ["sales.order.lines", "query"],
    ]);
    const details = r.describe("sales.order", 1).details;
    expect(details.extensionPolicy).toEqual({ customFields: false, recordTypes: false, pageVariants: false });
    expect(details).not.toHaveProperty("record");
  });
  it("enforces native Read and module availability before any projection query, even without the registry", async () => {
    const get = salesStudioContract.contributions.find(c => c.metadata.id === "sales.order.get")!;
    await expect(get.run!({ session: actor("tenant-a", []) }, { id: "order-a" })).rejects.toThrow("FORBIDDEN");
    expect(enabled).not.toHaveBeenCalled(); expect(storage.salesOrder.findFirst).not.toHaveBeenCalled();
    enabled.mockRejectedValue(new Error("Sales unavailable"));
    await expect(get.run!({ session: actor() }, { id: "order-a" })).rejects.toThrow("unavailable");
    expect(storage.salesOrder.findFirst).not.toHaveBeenCalled();
  });
  it("loads only the session tenant and excludes Finance, internal notes and live customer details", async () => {
    const r = registry();
    const result = await r.invoke(actor("tenant-b"), ref(r, "sales.order.get"), { id: "order-a" });
    expect(storage.salesOrder.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "order-a", organisationId: "tenant-b" } }));
    const select = storage.salesOrder.findFirst.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("internalNotes"); expect(select).not.toHaveProperty("financeInstructions");
    expect(select).not.toHaveProperty("financeDocuments"); expect(select.party).toEqual({ select: { name: true } });
    expect(result).toMatchObject({ commercial_revision: 3, updated_at: date.toISOString(), gross_amount: 0, customer_po_reference: null });
    expect(JSON.stringify(result)).not.toContain("private");
    storage.salesOrder.findFirst.mockResolvedValue(null);
    expect(await r.invoke(actor(), ref(r, "sales.order.get"), { id: "foreign" })).toBeNull();
  });
  it("preserves all existing native order types rather than rejecting retained Sales orders", async () => {
    const r = registry();
    for (const orderType of ["BLANKET", "SAMPLE", "REPLACEMENT", "INTERNAL"]) {
      storage.salesOrder.findFirst.mockResolvedValue({ ...header(), orderType });
      expect(await r.invoke(actor(), ref(r, "sales.order.get"), { id: "order-a" })).toMatchObject({ order_type: orderType });
    }
  });
  it("rejects client tenants, arbitrary filters and oversized requests before reads", async () => {
    const r = registry(), list = ref(r, "sales.order.list");
    for (const input of [{ organisationId: "tenant-b" }, { pageSize: 51 }, { filters: { rules: "[]" } },
      { filters: { q: "x".repeat(151) } }, { cursor: { id: "x", updatedAt: "bad" } }]) {
      await expect(r.invoke(actor(), list, input)).rejects.toThrow();
    }
    expect(storage.salesOrder.findMany).not.toHaveBeenCalled();
  });
  it("uses bounded deterministic cursor projections and retained native Sales filtering", async () => {
    const r = registry(); storage.salesOrder.findMany.mockResolvedValue([header("a"), header("b"), header("c")]);
    const result = await r.invoke(actor(), ref(r, "sales.order.list"), { pageSize: 2,
      filters: { status: "DRAFT", customerId: "party-a", currency: "GBP" }, cursor: { id: "anchor", updatedAt: date.toISOString() } });
    const anchor = storage.salesOrder.findFirst.mock.calls[0][0];
    expect(anchor.where.AND[0]).toMatchObject({ organisationId: "tenant-a", partyId: "party-a", commercialStatus: { in: ["DRAFT"] }, currency: { in: ["GBP"] } });
    expect(anchor.where.AND[1]).toEqual({ id: "anchor", updatedAt: date });
    const request = storage.salesOrder.findMany.mock.calls[0][0];
    expect(request.take).toBe(3); expect(request.orderBy).toEqual([{ updatedAt: "desc" }, { id: "desc" }]);
    expect(result).toMatchObject({ rows: [{ id: "a" }, { id: "b" }], nextCursor: { id: "b", updatedAt: date.toISOString() } });
  });
  it("denies foreign, stale or different-filter cursors before fetching the result page", async () => {
    const r = registry(); storage.salesOrder.findFirst.mockResolvedValue(null);
    await expect(r.invoke(actor(), ref(r, "sales.order.list"), { cursor: { id: "foreign", updatedAt: date.toISOString() } })).rejects.toThrow("CONFLICT");
    expect(storage.salesOrder.findMany).not.toHaveBeenCalled();
  });
  it("checks the native parent before any line lookup and bounds the line cursor to the same tenant/order", async () => {
    const r = registry(); storage.salesOrder.findFirst.mockResolvedValue(null);
    await expect(r.invoke(actor(), ref(r, "sales.order.lines"), { orderId: "foreign" })).rejects.toThrow("NOT_FOUND");
    expect(storage.salesOrderLine.findMany).not.toHaveBeenCalled(); expect(storage.salesOrderLine.findFirst).not.toHaveBeenCalled();
    storage.salesOrder.findFirst.mockResolvedValue({ id: "order-a" });
    await expect(r.invoke(actor(), ref(r, "sales.order.lines"), { orderId: "order-a", cursor: { id: "foreign-line", lineNumber: 2 } })).rejects.toThrow("CONFLICT");
    expect(storage.salesOrderLine.findFirst).toHaveBeenCalledWith({ where: { id: "foreign-line", orderId: "order-a", lineNumber: 2, order: { organisationId: "tenant-a" } }, select: { id: true, lineNumber: true } });
    expect(storage.salesOrderLine.findMany).not.toHaveBeenCalled();
  });
  it("retains zero, false and null in explicit line facts without prices being recalculated", async () => {
    const r = registry(); storage.salesOrderLine.findMany.mockResolvedValue([{ id: "line-a", lineNumber: 1, type: "NOTE", descriptionSnapshot: "Note",
      productId: null, unitOfMeasure: "each", orderedQuantity: 0, cancelledQuantity: 0, unitPriceAmount: 0, discountPercent: null,
      netAmount: 0, taxAmount: 0, invoiceWhenInStock: false, notes: "private", product: { cost: "private" } }]);
    const result = await r.invoke(actor(), ref(r, "sales.order.lines"), { orderId: "order-a", pageSize: 1 });
    expect(result).toMatchObject({ rows: [{ ordered_quantity: 0, unit_price_amount: 0, invoice_when_in_stock: false, product_id: null, discount_percent: null }], nextCursor: null });
    expect(JSON.stringify(result)).not.toContain("private");
    expect(storage.salesOrderLine.findMany.mock.calls[0][0]).toMatchObject({ take: 2, where: { AND: [{ orderId: "order-a", order: { organisationId: "tenant-a" } }, {}] } });
  });
  it("uses a supplied server transaction rather than escaping to the singleton", async () => {
    const r = registry(), tx = { salesOrder: { findFirst: vi.fn().mockResolvedValue(null) } };
    const get = salesStudioContract.contributions.find(c => c.metadata.id === "sales.order.get")!;
    // Normal registry reads stay available without a mandatory transaction.
    // A trusted direct owner call can share its server transaction; the registry
    // deliberately rejects its required-transaction API for these contracts.
    await expect(r.invokeQueryInTransaction({ session: actor(), transaction: tx as unknown as Prisma.TransactionClient }, ref(r, "sales.order.get"), { id: "order-a" })).rejects.toThrow("opted-in");
    expect(await get.run!({ session: actor(), transaction: tx as unknown as Prisma.TransactionClient }, { id: "order-a" })).toBeNull();
    expect(tx.salesOrder.findFirst).toHaveBeenCalledOnce(); expect(storage.salesOrder.findFirst).not.toHaveBeenCalled();
  });
  it("only returns the existing tenant-checked acknowledgement preview route, without creating a document or invoking a preview during registration", async () => {
    const r = registry(), preview = ref(r, "sales.order.preview_acknowledgement");
    expect(storage.salesOrder.findFirst).not.toHaveBeenCalled();
    expect(r.describe(preview.id, 1).details).toEqual({ execution: "transactional", idempotency: "not_applicable", sideEffect: "none" });
    for (let attempt = 0; attempt < 2; attempt++) expect(await r.invoke(actor(), preview, { orderId: "order-a" })).toEqual({ kind: "navigation", href: "/api/orders/order-a/pdf?preview=1" });
    expect(storage.salesOrder.findFirst).toHaveBeenCalledWith({ where: { id: "order-a", organisationId: "tenant-a" }, select: { id: true } });
    expect(storage.salesOrder.findMany).not.toHaveBeenCalled(); expect(storage.salesOrderLine.findMany).not.toHaveBeenCalled();
  });
  it("rechecks native capability/module and denies unavailable acknowledgement records", async () => {
    const r = registry(), preview = ref(r, "sales.order.preview_acknowledgement");
    const contribution = salesStudioContract.contributions.find(c => c.metadata.id === preview.id)!;
    await expect(contribution.run!({ session: actor("tenant-a", []) }, { orderId: "order-a" })).rejects.toThrow("FORBIDDEN");
    expect(enabled).not.toHaveBeenCalled(); expect(storage.salesOrder.findFirst).not.toHaveBeenCalled();
    enabled.mockRejectedValueOnce(new Error("Sales unavailable"));
    await expect(r.invoke(actor(), preview, { orderId: "order-a" })).rejects.toThrow("unavailable");
    expect(storage.salesOrder.findFirst).not.toHaveBeenCalled();
    storage.salesOrder.findFirst.mockResolvedValue(null);
    await expect(r.invoke(actor("tenant-b"), preview, { orderId: "foreign" })).rejects.toThrow("NOT_FOUND");
    expect(storage.salesOrder.findFirst).toHaveBeenCalledWith({ where: { id: "foreign", organisationId: "tenant-b" }, select: { id: true } });
  });
  it("accepts no client destination or tenant and encodes the actual native identity into the fixed route", async () => {
    const r = registry(), preview = ref(r, "sales.order.preview_acknowledgement");
    for (const input of [{ orderId: "order-a", href: "https://foreign.invalid" }, { orderId: "order-a", organisationId: "tenant-b" }])
      await expect(r.invoke(actor(), preview, input)).rejects.toThrow();
    expect(storage.salesOrder.findFirst).not.toHaveBeenCalled();
    storage.salesOrder.findFirst.mockResolvedValue({ id: "order/with?fragment#" });
    expect(await r.invoke(actor(), preview, { orderId: "requested" })).toEqual({ kind: "navigation", href: "/api/orders/order%2Fwith%3Ffragment%23/pdf?preview=1" });
  });
});
