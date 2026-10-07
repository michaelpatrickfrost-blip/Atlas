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

export async function loadCustomerMap(organisationId: string, includeInvoices: boolean) {
  const [parties, users, links] = await Promise.all([
    db.party.findMany({
      where: { organisationId, identityScrubbed: false },
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
  return { accounts, people, truncated: parties.length === 500 };
}
