import { db } from "@/core/db/client";

export function listOpportunities(organisationId: string) {
  return db.opportunity.findMany({
    where: { organisationId },
    include: { party: true },
    orderBy: { updatedAt: "desc" },
  });
}

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
