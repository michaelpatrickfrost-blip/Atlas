import { db } from "@/core/db/client";
import type { CustomerOverviewProvider } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { formatMoney } from "@/core/shared/money";

/** Sales' contribution to a customer's Overview: 12-month sales, open
 *  quotes/orders, and quick actions. Customer Master never hardcodes this —
 *  it only calls this provider when Sales is enabled and the user can see it
 *  (§41). */
export const salesCustomerOverviewProvider: CustomerOverviewProvider = async ({ organisationId, session, partyId }) => {
  if (!can(session, SALES_CAPABILITIES.opportunityRead)) return null;

  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const [orders, openQuotes, confirmedOrders] = await Promise.all([
    db.salesOrder.findMany({
      where: { organisationId, partyId, createdAt: { gte: since } },
      select: { totalAmount: true, totalCurrency: true },
    }),
    db.quote.count({ where: { organisationId, partyId, status: { in: ["DRAFT", "SENT"] } } }),
    db.salesOrder.findMany({ where: { organisationId, partyId, status: "CONFIRMED" }, select: { totalAmount: true, totalCurrency: true } }),
  ]);

  const twelveMonthSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const currency = orders[0]?.totalCurrency ?? confirmedOrders[0]?.totalCurrency ?? "GBP";
  // Committed exposure: confirmed orders not yet invoiced (no Finance/invoicing
  // module exists yet to supply a real "unpaid" figure — this is the honest
  // proxy available today; see docs/CUSTOMER_MASTER.md §Credit).
  const exposure = confirmedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return {
    moduleId: "sales",
    metrics: [
      { label: "Sales (12m)", value: formatMoney(twelveMonthSales, currency) },
      { label: "Open quotations", value: String(openQuotes), href: "/sales/quotes" },
      { label: "Open orders", value: String(confirmedOrders.length), href: "/sales/orders" },
    ],
    creditExposure: exposure > 0 ? { amountMinorUnits: exposure, currency } : undefined,
    // Sales doesn't yet have quote/order creation forms (out of scope for this
    // vertical slice) — link to the existing list views rather than a dead
    // route, honestly reflecting what's actually built.
    actions: can(session, SALES_CAPABILITIES.quoteCreate)
      ? [
          { label: "View quotes", href: "/sales/quotes" },
          { label: "View orders", href: "/sales/orders" },
        ]
      : [],
  };
};
