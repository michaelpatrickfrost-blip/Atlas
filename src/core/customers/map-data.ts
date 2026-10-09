import { db } from "@/core/db/client";

export type MapAccount = {
  id: string;
  name: string;
  customerCode: string;
  parentPartyId: string | null;
  hierarchyRole: string;
  customerGroup: string | null;
  status: string;
  accountManager: string | null;
  invoiceAccountId: string | null;
  invoiceAccountName: string | null;
};

export type MapPerson = {
  id: string;
  partyId: string;
  name: string;
  jobTitle: string | null;
  reportsToContactId: string | null;
};

export async function loadCustomerMap(organisationId: string, includeInvoices: boolean, focusId?: string) {
  // Traverse only the selected corporate family; unrelated customer contacts never enter the map payload.
  const family = focusId ? await db.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE family AS (
      SELECT id, "parentPartyId" FROM parties
      WHERE id = ${focusId} AND "organisationId" = ${organisationId} AND "identityScrubbed" = false
      UNION
      SELECT p.id, p."parentPartyId" FROM parties p JOIN family f
        ON p.id = f."parentPartyId" OR p."parentPartyId" = f.id
      WHERE p."organisationId" = ${organisationId} AND p."identityScrubbed" = false
    ) SELECT id FROM family LIMIT 501
  ` : null;
  const [parties, users, links] = await Promise.all([
    db.party.findMany({
      where: { organisationId, identityScrubbed: false, ...(family ? { id: { in: family.map(row => row.id) } } : {}) },
      select: {
        id: true,
        name: true,
        customerCode: true,
        parentPartyId: true,
        hierarchyRole: true,
        customerGroup: true,
        status: true,
        accountManagerUserId: true,
        contacts: {
          where: { status: "ACTIVE", identityScrubbed: false },
          select: { id: true, partyId: true, firstName: true, surname: true, jobTitle: true, reportsToContactId: true },
          orderBy: [{ surname: "asc" }, { firstName: "asc" }],
        },
      },
      orderBy: { name: "asc" },
      take: 500,
    }),
    db.user.findMany({
      where: { memberships: { some: { organisationId, active: true } } },
      select: { id: true, name: true },
    }),
    includeInvoices
      ? db.customerTradingLink.findMany({
          where: { organisationId, active: true, account: { identityScrubbed: false }, tradingAccount: { identityScrubbed: false } },
          select: { accountId: true, tradingAccountId: true, updatedAt: true, tradingAccount: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const managerName = new Map(users.map((user) => [user.id, user.name]));
  const invoiceByAccount = new Map<string, { id: string; name: string }>();
  for (const link of links) {
    if (!invoiceByAccount.has(link.accountId)) invoiceByAccount.set(link.accountId, { id: link.tradingAccountId, name: link.tradingAccount.name });
  }

  const accounts: MapAccount[] = parties.map((party) => ({
    id: party.id,
    name: party.name,
    customerCode: party.customerCode,
    parentPartyId: party.parentPartyId,
    hierarchyRole: party.hierarchyRole,
    customerGroup: party.customerGroup,
    status: party.status,
    accountManager: party.accountManagerUserId ? (managerName.get(party.accountManagerUserId) ?? null) : null,
    invoiceAccountId: invoiceByAccount.get(party.id)?.id ?? null,
    invoiceAccountName: invoiceByAccount.get(party.id)?.name ?? null,
  }));
  const people: MapPerson[] = parties.flatMap((party) =>
    party.contacts.map((contact) => ({
      id: contact.id,
      partyId: contact.partyId,
      name: `${contact.firstName} ${contact.surname}`.trim(),
      jobTitle: contact.jobTitle,
      reportsToContactId: contact.reportsToContactId,
    })),
  );
  const lookupRows = focusId ? await db.party.findMany({ where: { organisationId, identityScrubbed: false, archived: false }, select: { id: true, name: true, customerCode: true, parentPartyId: true, hierarchyRole: true, customerGroup: true, status: true }, orderBy: { name: "asc" }, take: 500 }) : [];
  const choices: MapAccount[] = lookupRows.map(row => ({ ...row, accountManager: null, invoiceAccountId: null, invoiceAccountName: null }));
  return { accounts, people, choices, truncated: family ? family.length > 500 : parties.length === 500 };
}
