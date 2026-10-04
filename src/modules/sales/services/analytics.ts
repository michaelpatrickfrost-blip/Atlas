import { db } from "@/core/db/client";
import { timeSeries } from "@/core/analytics/buckets";
import type { AnalyticsProvider } from "@/core/analytics/types";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";

const orderViews = [
  { id: "status", label: "Status" },
  { id: "type", label: "Order type" },
  { id: "product", label: "Product" },
  { id: "category", label: "Category" },
  { id: "customer", label: "Customer" },
  { id: "time", label: "Over time", shape: "trend" as const },
];

async function orderPoints(session: Session, since: Date | undefined, breakdown = "status") {
  assertCapability(session, "sales.order.read");
  const where = { organisationId: session.organisationId, ...(since ? { orderDate: { gte: since } } : {}) };
  if (breakdown === "time") {
    const rows = await db.salesOrder.findMany({ where, select: { orderDate: true }, orderBy: { orderDate: "desc" }, take: 8000 });
    return timeSeries(rows.map((row) => row.orderDate), since);
  }
  if (breakdown === "type") {
    const rows = await db.salesOrder.groupBy({ by: ["orderType"], where, _count: { _all: true } });
    return rows.map((row) => ({ label: String(row.orderType).replaceAll("_", " "), value: row._count._all }));
  }
  if (breakdown === "customer") {
    const rows = await db.salesOrder.groupBy({ by: ["partyId"], where, _count: { _all: true } });
    const parties = await db.party.findMany({ where: { organisationId: session.organisationId, id: { in: rows.map((row) => row.partyId) } }, select: { id: true, name: true, tradingName: true } });
    return rows.map((row) => { const party = parties.find((item) => item.id === row.partyId); return { label: party?.tradingName || party?.name || "Customer", value: row._count._all }; }).sort((a, b) => b.value - a.value).slice(0, 12);
  }
  if (breakdown === "product" || breakdown === "category") {
    const lines = await db.salesOrderLine.findMany({ where: { order: where, type: { in: ["PRODUCT", "SERVICE"] } }, select: { productId: true }, take: 8000 });
    const ids = [...new Set(lines.flatMap((line) => line.productId ? [line.productId] : []))];
    const products = await db.product.findMany({ where: { organisationId: session.organisationId, id: { in: ids } }, select: { id: true, name: true, categoryCode: true } });
    const byId = new Map(products.map((product) => [product.id, product]));
    const counts = new Map<string, number>();
    for (const line of lines) {
      const product = line.productId ? byId.get(line.productId) : undefined;
      const label = breakdown === "product" ? product?.name ?? "No product" : product?.categoryCode || "No category";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 12);
  }
  const rows = await db.salesOrder.groupBy({ by: ["commercialStatus"], where, _count: { _all: true } });
  return rows.map((row) => ({ label: row.commercialStatus.replaceAll("_", " "), value: row._count._all }));
}

export const salesAnalytics: AnalyticsProvider = [{
  id: "sales.orders", name: "Orders received", subject: "Sales", definition: "Orders in the selected period. Open the chart and choose status, order type, product, category, customer or time. Product and category count lines. This is not recognised revenue.", grain: "One sales order, or one product line", capability: "sales.order.read", href: "/sales/orders", snapshot: false, breakdowns: orderViews,
  query: orderPoints,
},
{ id: "sales.quotes", name: "Quotations", subject: "Sales", definition: "Quotations created in the selected period by status.", grain: "One quotation", capability: "sales.quote.read", href: "/sales/quotes", snapshot: false, query: async (session, since) => { assertCapability(session, "sales.quote.read"); const rows = await db.quote.groupBy({ by: ["status"], where: { organisationId: session.organisationId, createdAt: since ? { gte: since } : undefined }, _count: { _all: true } }); return rows.map((row) => ({ label: row.status, value: row._count._all })); } },
{ id: "sales.orders.trend", name: "Orders over time", subject: "Sales", definition: "Orders by week, or by month when the range is longer than four months. Uses the latest 8,000 orders in the selected period. Counts orders, not recognised revenue.", grain: "One sales order", capability: "sales.order.read", href: "/sales/orders", snapshot: false, shape: "trend", query: async (session, since) => { assertCapability(session, "sales.order.read"); const rows = await db.salesOrder.findMany({ where: { organisationId: session.organisationId, ...(since ? { orderDate: { gte: since } } : {}) }, select: { orderDate: true }, orderBy: { orderDate: "desc" }, take: 8000 }); return timeSeries(rows.map((row) => row.orderDate), since); } },
];
