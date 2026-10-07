import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const state = vi.hoisted(() => ({ orders: vi.fn(), quotes: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => ({ organisationId: "tenant", userId: "user", capabilities: new Set(["sales.order.read", "customers.read"]) }) }));
vi.mock("@/modules/sales/services/account-filters", () => ({ prepareSalesFilters: async () => ({}) }));
vi.mock("@/modules/sales/components/sales-filters", () => ({ SalesFilterBar: () => null }));
vi.mock("@/core/db/client", () => ({ db: { salesOrder: { findMany: state.orders, count: async () => 2 }, quote: { findMany: state.quotes, count: async () => 0 }, party: { findMany: async () => [] }, membership: { findMany: async () => [] }, salesSavedView: { findMany: async () => [] } } }));
import { DocumentList } from "@/modules/sales/components/document-list";
it("retains historical sales rows while replacing only deleted customer links with a clear state", async () => {
  const common = { orderType: "STANDARD", commercialStatus: "CLOSED", grossAmount: 12000, netAmount: 10000, taxAmount: 2000, currency: "GBP", customerPoReference: null, externalReference: null, ownerUserId: null, tags: [], requestedDeliveryDate: null, promisedDeliveryDate: null, createdAt: new Date(), updatedAt: new Date(), deliveryAddressSnapshot: null, pricingParty: null, _count: { lines: 1 } };
  const records = [
    { ...common, id: "history", reference: "SO-HISTORY", partyId: "deleted", party: { name: "Deleted customer", customerGroup: null, identityScrubbed: true } },
    { ...common, id: "current", reference: "SO-CURRENT", partyId: "active", party: { name: "Current customer", customerGroup: null, identityScrubbed: false } },
  ];
  state.orders.mockImplementation(async (query: { include?: unknown }) => query.include ? records : []); state.quotes.mockResolvedValue([]);
  const html = renderToStaticMarkup(await DocumentList({ mode: "document", filters: {} }));
  expect(html).toContain('href="/sales/orders/history"');
  expect(html).toContain("SO-HISTORY");
  expect(html).toContain("Customer deleted; historical document retained");
  expect(html).not.toContain('href="/customers/deleted"');
  expect(html).toContain('href="/customers/active"');
});
