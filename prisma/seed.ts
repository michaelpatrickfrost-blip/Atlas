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

  const northbridge = await db.party.create({
    data: {
      organisationId: organisation.id,
      kind: "COMPANY",
      name: "Northbridge Construction",
      addresses: { create: [{ line1: "14 Dock Street", city: "Bristol", country: "United Kingdom" }] },
      contacts: { create: [{ kind: "EMAIL", value: "accounts@northbridge.example" }] },
    },
  });

  const harrow = await db.party.create({
    data: { organisationId: organisation.id, kind: "COMPANY", name: "Harrow & Co" },
  });

  await db.party.create({
    data: { organisationId: organisation.id, kind: "COMPANY", name: "Dalton Logistics" },
  });

  const opportunity = await db.opportunity.create({
    data: {
      organisationId: organisation.id,
      partyId: northbridge.id,
      name: "Northbridge — site fit-out",
      stage: "WON",
      valueAmount: 2800000,
    },
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
    data: {
      organisationId: organisation.id,
      partyId: northbridge.id,
      reference: "SO-1842",
      status: "CONFIRMED",
      totalAmount: 842000,
    },
  });

  await db.activity.createMany({
    data: [
      { organisationId: organisation.id, type: "sales.order.confirmed", summary: "Sales order SO-1842 confirmed — £8,420" },
      { organisationId: organisation.id, type: "sales.quote.sent", summary: `Quote ${quote.reference} sent — £8,420` },
      { organisationId: organisation.id, type: "sales.opportunity.won", summary: "Sophie Green won Northbridge — site fit-out" },
    ],
  });

  console.log("Seeded demo organisation:", organisation.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
