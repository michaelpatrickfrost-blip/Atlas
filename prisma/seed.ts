import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { STANDARD_ROLES } from "@/core/permissions/capabilities";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const organisation = await db.organisation.upsert({
    where: { slug: "demo" },
    create: { name: "Northbridge Group", slug: "demo" },
    update: {},
  });

  const passwordHash = await bcrypt.hash("atlas-demo", 10);
  const user = await db.user.upsert({
    where: { email: "demo@atlas.app" },
    create: { email: "demo@atlas.app", name: "Sophie Green", passwordHash },
    update: {},
  });

  const membership = await db.membership.upsert({
    where: { organisationId_userId: { organisationId: organisation.id, userId: user.id } },
    create: { organisationId: organisation.id, userId: user.id },
    update: {},
  });

  for (const roleDef of STANDARD_ROLES) {
    const role = await db.role.upsert({
      where: { organisationId_key: { organisationId: organisation.id, key: roleDef.key } },
      create: { organisationId: organisation.id, key: roleDef.key, name: roleDef.name, capabilities: roleDef.capabilities },
      update: { capabilities: roleDef.capabilities, name: roleDef.name },
    });
    if (roleDef.key === "admin") {
      await db.roleOnMembership.upsert({
        where: { membershipId_roleId: { membershipId: membership.id, roleId: role.id } },
        create: { membershipId: membership.id, roleId: role.id },
        update: {},
      });
    }
  }

  await db.moduleState.upsert({
    where: { organisationId_moduleId: { organisationId: organisation.id, moduleId: "sales" } },
    create: { organisationId: organisation.id, moduleId: "sales", enabled: true },
    update: { enabled: true },
  });

  const [netThirty, dueOnReceipt] = await Promise.all([
    db.paymentTerm.upsert({
      where: { organisationId_key: { organisationId: organisation.id, key: "net_30" } },
      create: { organisationId: organisation.id, key: "net_30", name: "30 days", days: 30, type: "NET" },
      update: {},
    }),
    db.paymentTerm.upsert({
      where: { organisationId_key: { organisationId: organisation.id, key: "due_on_receipt" } },
      create: { organisationId: organisation.id, key: "due_on_receipt", name: "Due on receipt", type: "DUE_ON_RECEIPT" },
      update: {},
    }),
  ]);

  // Northbridge: the "normal, fully fleshed out" customer — multiple contacts,
  // addresses, a verified VAT registration, a bank account + active Direct
  // Debit, healthy credit.
  const northbridge = await db.party.create({
    data: {
      organisationId: organisation.id,
      kind: "COMPANY",
      name: "Northbridge Construction Ltd",
      tradingName: "Northbridge Construction",
      customerCode: "C000001",
      status: "ACTIVE",
      countryOfRegistration: "United Kingdom",
      registrationNumber: "08451234",
      relationshipStartDate: new Date("2024-03-14"),
      accountManagerUserId: user.id,
      territory: "South West",
      preferredCurrency: "GBP",
      contacts: {
        create: [
          { firstName: "Priya", surname: "Sharma", jobTitle: "Finance Director", email: "priya.sharma@northbridge.example", phone: "0117 555 0142", roles: ["PRIMARY", "ACCOUNTS_PAYABLE"], isPrimary: true },
          { firstName: "Tom", surname: "Willis", jobTitle: "Site Manager", email: "tom.willis@northbridge.example", phone: "0117 555 0198", roles: ["OPERATIONS", "DELIVERY"] },
        ],
      },
      addresses: {
        create: [
          { type: "REGISTERED", line1: "14 Dock Street", city: "Bristol", postcode: "BS1 4EF", country: "United Kingdom" },
          { type: "BILLING", line1: "14 Dock Street", city: "Bristol", postcode: "BS1 4EF", country: "United Kingdom", isDefaultBilling: true },
          { type: "SITE", label: "Harbourside development", line1: "Unit 4, Harbourside Park", city: "Bristol", postcode: "BS1 6XN", country: "United Kingdom", isDefaultDelivery: true, deliveryInstructions: "24 hours' notice required for all deliveries." },
        ],
      },
      taxRegistrations: {
        create: [
          {
            jurisdiction: "GB",
            registrationType: "VAT",
            number: "GB123456789",
            normalizedNumber: "GB123456789",
            effectiveDate: new Date("2024-03-14"),
            validationStatus: "MANUALLY_VERIFIED",
            validationDate: new Date("2026-10-03"),
            validationSource: "manual",
            verifiedLegalName: "Northbridge Construction Ltd",
            verifiedAddress: "14 Dock Street, Bristol, BS1 4EF",
          },
        ],
      },
      creditProfile: {
        create: { creditLimitAmount: 5000000, creditLimitCurrency: "GBP", paymentTermId: netThirty.id, paymentMethod: "DIRECT_DEBIT", riskRating: "Low" },
      },
    },
  });

  const northbridgeBank = await db.bankAccount.create({
    data: {
      partyId: northbridge.id,
      accountHolder: "Northbridge Construction Ltd",
      bankName: "Barclays",
      country: "GB",
      currency: "GBP",
      sortCode: "200000",
      accountNumber: "41530424",
      purpose: "DIRECT_DEBIT",
      isDefault: true,
      verifiedStatus: "VERIFIED",
      verifiedDate: new Date("2026-03-14"),
    },
  });

  await db.directDebitMandate.create({
    data: {
      partyId: northbridge.id,
      bankAccountId: northbridgeBank.id,
      scheme: "BACS",
      mandateReference: "ATL-NOR-00428",
      status: "ACTIVE",
      agreedDate: new Date("2026-03-14"),
      effectiveDate: new Date("2026-03-14"),
      lastCollectionDate: new Date("2026-09-28"),
    },
  });

  // Harrow & Co: an in-progress prospect — single contact, no addresses/tax yet,
  // exercises the "complete customer setup" checklist.
  const harrow = await db.party.create({
    data: {
      organisationId: organisation.id,
      kind: "COMPANY",
      name: "Harrow & Co",
      customerCode: "C000002",
      status: "PROSPECT",
      accountManagerUserId: user.id,
      relationshipStartDate: new Date("2026-09-20"),
      contacts: { create: [{ firstName: "Daniel", surname: "Brooks", jobTitle: "Product Manager", email: "daniel.brooks@harrowco.example", roles: ["PRIMARY"], isPrimary: true }] },
      creditProfile: { create: { paymentTermId: dueOnReceipt.id } },
    },
  });

  // Dalton Logistics: on credit hold, with an over-limit exposure — exercises
  // the credit UX's exceeded state and the Home/attention "on hold" item.
  const dalton = await db.party.create({
    data: {
      organisationId: organisation.id,
      kind: "COMPANY",
      name: "Dalton Logistics",
      customerCode: "C000003",
      status: "ACTIVE",
      countryOfRegistration: "United Kingdom",
      contacts: { create: [{ firstName: "Emily", surname: "Carter", jobTitle: "Operations Manager", email: "emily.carter@daltonlogistics.example", roles: ["PRIMARY"], isPrimary: true }] },
      addresses: { create: [{ type: "BILLING", line1: "9 Trident Way", city: "Leeds", postcode: "LS10 1AB", country: "United Kingdom", isDefaultBilling: true }] },
      creditProfile: {
        create: {
          creditLimitAmount: 1000000,
          creditLimitCurrency: "GBP",
          onHold: true,
          holdReason: "Two invoices over 60 days overdue",
          holdDate: new Date("2026-09-25"),
          holdSetByUserId: user.id,
          paymentTermId: netThirty.id,
        },
      },
    },
  });

  const opportunity = await db.opportunity.create({
    data: { organisationId: organisation.id, partyId: northbridge.id, name: "Northbridge — site fit-out", stage: "WON", valueAmount: 2800000 },
  });
  await db.opportunity.create({
    data: { organisationId: organisation.id, partyId: harrow.id, name: "Harrow — annual contract", stage: "PROPOSAL", valueAmount: 1200000 },
  });

  const quote = await db.quote.create({
    data: {
      organisationId: organisation.id,
      partyId: northbridge.id,
      opportunityId: opportunity.id,
      reference: "Q-1001",
      status: "SENT",
      totalAmount: 842000,
      lines: { create: [{ description: "Site fit-out — phase 1", quantity: 1, unitAmount: 842000 }] },
    },
  });

  await db.salesOrder.create({
    data: { organisationId: organisation.id, partyId: northbridge.id, reference: "SO-1842", status: "CONFIRMED", totalAmount: 842000 },
  });
  await db.salesOrder.create({
    data: { organisationId: organisation.id, partyId: dalton.id, reference: "SO-1850", status: "CONFIRMED", totalAmount: 1180000 },
  });

  await db.activity.createMany({
    data: [
      { organisationId: organisation.id, type: "sales.order.confirmed", summary: "Sales order SO-1842 confirmed — £8,420", partyId: northbridge.id },
      { organisationId: organisation.id, type: "sales.quote.sent", summary: `Quote ${quote.reference} sent — £8,420`, partyId: northbridge.id },
      { organisationId: organisation.id, type: "sales.opportunity.won", summary: "Sophie Green won Northbridge — site fit-out", partyId: northbridge.id },
      { organisationId: organisation.id, type: "customer.created", summary: "Harrow & Co added as a customer", partyId: harrow.id },
      { organisationId: organisation.id, type: "customer.on_hold", summary: "Credit hold placed — two invoices over 60 days overdue", partyId: dalton.id },
    ],
  });

  await db.note.create({
    data: { partyId: northbridge.id, body: "All deliveries require 24 hours' notice.", pinned: true, authorUserId: user.id },
  });

  console.log("Seeded demo organisation:", organisation.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
