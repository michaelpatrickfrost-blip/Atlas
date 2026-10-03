import { db } from "@/core/db/client";
import type { SearchProvider } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";

/** Customer search lives in Customer Master (src/core/customers/search.ts) —
 *  Sales only searches its own entities (quotes/orders by reference). */
export const salesSearchProvider: SearchProvider = async ({ organisationId, session, query }) => {
  if (!can(session, SALES_CAPABILITIES.quoteRead)) return [];

  const [quotes, orders] = await Promise.all([
    db.quote.findMany({ where: { organisationId, reference: { contains: query, mode: "insensitive" } }, take: 3 }),
    db.salesOrder.findMany({ where: { organisationId, reference: { contains: query, mode: "insensitive" } }, take: 3 }),
  ]);

  return [
    ...quotes.map((quote) => ({ id: `quote:${quote.id}`, title: quote.reference, subtitle: "Quote", href: "/sales/quotes", group: "Sales" })),
    ...orders.map((order) => ({ id: `order:${order.id}`, title: order.reference, subtitle: "Order", href: "/sales/orders", group: "Sales" })),
  ];
};
