import { db } from "@/core/db/client";
import type { CustomerStatus, Prisma } from "@/generated/prisma/client";

export type CustomerListFilter = "active" | "prospects" | "on_hold" | "my_customers" | "archived";

export async function listCustomers(
  organisationId: string,
  opts: { search?: string; filter?: CustomerListFilter; accountManagerUserId?: string } = {},
) {
  const where: Prisma.PartyWhereInput = {
    organisationId,
    archived: opts.filter === "archived",
    identityScrubbed: false,
  };

  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { tradingName: { contains: opts.search, mode: "insensitive" } },
      { customerCode: { contains: opts.search, mode: "insensitive" } },
      { registrationNumber: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  if (opts.filter === "active") where.status = "ACTIVE";
  if (opts.filter === "prospects") where.status = "PROSPECT";
  if (opts.filter === "on_hold") where.creditProfile = { is: { onHold: true } };
  if (opts.filter === "my_customers" && opts.accountManagerUserId) {
    where.accountManagerUserId = opts.accountManagerUserId;
  }

  return db.party.findMany({
    where,
    include: {
      creditProfile: true,
      addresses: { where: { type: "BILLING" }, take: 1 },
      salesOrders: { select: { grossAmount: true, currency: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(organisationId: string, partyId: string) {
  return db.party.findFirst({
    where: { organisationId, id: partyId, identityScrubbed: false },
    include: {
      contacts: {
        where: { identityScrubbed: false },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      addresses: { orderBy: { createdAt: "asc" } },
      communicationDestinations: { include: { contact: true } },
      commercialSettings: true,
      creditProfile: { include: { paymentTerm: true } },
      taxRegistrations: { orderBy: { createdAt: "asc" } },
      bankAccounts: { orderBy: { createdAt: "asc" } },
      directDebitMandates: { include: { bankAccount: true }, orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] },
      parent: { select: { id: true, name: true, customerCode: true } },
      children: { select: { id: true, name: true, customerCode: true } },
    },
  });
}

/** Only existence metadata is needed to explain retained historical links. Never load deleted identity. */
export async function customerWasDeleted(organisationId: string, partyId: string) {
  return !!await db.party.findFirst({ where: { organisationId, id: partyId, identityScrubbed: true }, select: { id: true } });
}

/** Completeness checklist shown after quick-create (§34). Deliberately only
 *  checks a handful of high-value gaps — not every optional field. */
export function getSetupChecklist(customer: NonNullable<Awaited<ReturnType<typeof getCustomer>>>) {
  return [
    { label: "Add VAT / tax details", done: customer.taxRegistrations.length > 0, href: `/customers/${customer.id}?tab=finance` },
    {
      label: "Add a billing address",
      done: customer.addresses.some((address) => address.isDefaultBilling),
      href: `/customers/${customer.id}?tab=people`,
    },
    { label: "Set payment terms", done: customer.creditProfile?.paymentTermId != null, href: `/customers/${customer.id}?tab=finance` },
    {
      label: "Set credit settings",
      done: customer.creditProfile != null && customer.creditProfile.creditLimitAmount > 0,
      href: `/customers/${customer.id}?tab=finance`,
    },
  ];
}

export function listCustomerStatuses(): CustomerStatus[] {
  return ["PROSPECT", "ACTIVE", "ON_HOLD", "INACTIVE", "CLOSED"];
}

export async function listPaymentTerms(organisationId: string) {
  return db.paymentTerm.findMany({ where: { organisationId }, orderBy: { createdAt: "asc" } });
}
