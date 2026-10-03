import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import type { SearchResult } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { normalizeTaxNumber } from "@/core/customers/tax";

/** Core-owned customer search — unlike module search providers, this runs
 *  unconditionally since Customer Master isn't optional. Matches by code,
 *  name, trading name, registration number, postcode, and tax number
 *  (normalised so formatting doesn't prevent a match — §33). */
export async function searchCustomers(session: Session, query: string): Promise<SearchResult[]> {
  if (!can(session, CUSTOMER_CAPABILITIES.read)) return [];

  const normalizedQuery = normalizeTaxNumber(query);

  const parties = await db.party.findMany({
    where: {
      organisationId: session.organisationId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { tradingName: { contains: query, mode: "insensitive" } },
        { customerCode: { contains: query, mode: "insensitive" } },
        { registrationNumber: { contains: query, mode: "insensitive" } },
        { addresses: { some: { postcode: { contains: query, mode: "insensitive" } } } },
        { taxRegistrations: { some: { normalizedNumber: { contains: normalizedQuery } } } },
        { contacts: { some: { email: { contains: query, mode: "insensitive" } } } },
      ],
    },
    take: 6,
  });

  return parties.map((party) => ({
    id: `customer:${party.id}`,
    title: party.name,
    subtitle: party.customerCode,
    href: `/customers/${party.id}`,
    group: "Customers",
  }));
}
