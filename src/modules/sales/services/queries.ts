import { db } from "@/core/db/client";

// Opportunity queries/commands live in opportunities.ts — this file is for
// quotes/orders only, which still use Atlas's existing commercial-document
// model directly.

export function listQuotes(organisationId: string) {
  return db.quote.findMany({
    where: { organisationId },
    include: { party: true, lines: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function listSalesOrders(organisationId: string) {
  return db.salesOrder.findMany({
    where: { organisationId },
    include: { party: true },
    orderBy: { updatedAt: "desc" },
  });
}
