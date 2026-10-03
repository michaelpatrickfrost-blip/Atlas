import { db } from "@/core/db/client";
import type { SearchProvider } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";

export const salesSearchProvider: SearchProvider = async ({ organisationId, session, query }) => {
  if (!can(session, SALES_CAPABILITIES.customerRead)) return [];

  const parties = await db.party.findMany({
    where: { organisationId, name: { contains: query, mode: "insensitive" } },
    take: 5,
  });

  return parties.map((party) => ({
    id: `party:${party.id}`,
    title: party.name,
    subtitle: "Customer",
    href: `/sales/customers/${party.id}`,
    group: "Customers",
  }));
};
