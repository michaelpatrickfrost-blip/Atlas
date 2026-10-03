import { db } from "@/core/db/client";

export function listOpportunities(organisationId: string) {
  return db.opportunity.findMany({
    where: { organisationId },
    include: { party: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function listCustomers(organisationId: string) {
  return db.party.findMany({
    where: { organisationId },
    orderBy: { name: "asc" },
  });
}

export function getCustomer(organisationId: string, partyId: string) {
  return db.party.findFirst({
    where: { organisationId, id: partyId },
    include: {
      addresses: true,
      contacts: true,
      opportunities: { orderBy: { updatedAt: "desc" } },
      quotes: { orderBy: { updatedAt: "desc" } },
      salesOrders: { orderBy: { updatedAt: "desc" } },
    },
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
