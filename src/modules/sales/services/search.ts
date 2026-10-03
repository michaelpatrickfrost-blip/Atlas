import { db } from "@/core/db/client";
import type { SearchProvider } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";

/** Customer search lives in Customer Master. Sales searches its own
 *  entities: prospects, opportunities, quotes/orders by reference (§108). */
export const salesSearchProvider: SearchProvider = async ({ organisationId, session, query }) => {
  const results = [];

  if (can(session, SALES_CAPABILITIES.prospectRead)) {
    const prospects = await db.prospect.findMany({
      where: { organisationId, companyName: { contains: query, mode: "insensitive" } },
      take: 3,
    });
    results.push(...prospects.map((p) => ({ id: `prospect:${p.id}`, title: p.companyName, subtitle: "Prospect", href: `/sales/prospect/${p.id}`, group: "Sales" })));
  }

  if (can(session, SALES_CAPABILITIES.opportunityRead)) {
    const opportunities = await db.opportunity.findMany({
      where: { organisationId, name: { contains: query, mode: "insensitive" } },
      take: 3,
    });
    results.push(...opportunities.map((o) => ({ id: `opportunity:${o.id}`, title: o.name, subtitle: "Opportunity", href: `/sales/opportunities/${o.id}`, group: "Sales" })));
  }

  if (can(session, SALES_CAPABILITIES.quoteRead)) {
    const [quotes, orders] = await Promise.all([
      db.quote.findMany({ where: { organisationId, reference: { contains: query, mode: "insensitive" } }, take: 3 }),
      db.salesOrder.findMany({ where: { organisationId, reference: { contains: query, mode: "insensitive" } }, take: 3 }),
    ]);
    results.push(...quotes.map((q) => ({ id: `quote:${q.id}`, title: q.reference, subtitle: "Quote", href: "/sales/quotes", group: "Sales" })));
    results.push(...orders.map((o) => ({ id: `order:${o.id}`, title: o.reference, subtitle: "Order", href: "/sales/orders", group: "Sales" })));
  }

  return results;
};
