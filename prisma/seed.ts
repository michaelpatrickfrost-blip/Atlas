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
    create: { organisationId: organisation.id, moduleId: "sales", enabled: true, entitled: true },
    update: { enabled: true, entitled: true },
  });

  await db.moduleState.upsert({
    where: { organisationId_moduleId: { organisationId: organisation.id, moduleId: "people" } },
    create: { organisationId: organisation.id, moduleId: "people", enabled: true, entitled: true },
    update: { enabled: true, entitled: true },
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

  // ---------- Sales & CRM: pipeline, loss reasons, prospects, opportunities ----------

  const pipeline = await db.pipeline.upsert({
    where: { organisationId_key: { organisationId: organisation.id, key: "new_business" } },
    create: { organisationId: organisation.id, key: "new_business", name: "New Business", isDefault: true },
    update: {},
  });

  const stageDefs = [
    { key: "qualified", name: "Qualified", order: 0, defaultProbability: 10, typicalDurationDays: 5 },
    { key: "discovery", name: "Discovery", order: 1, defaultProbability: 25, typicalDurationDays: 7 },
    { key: "proposal", name: "Proposal", order: 2, defaultProbability: 50, typicalDurationDays: 7 },
    { key: "negotiation", name: "Negotiation", order: 3, defaultProbability: 75, typicalDurationDays: 10 },
    { key: "commit", name: "Commit", order: 4, defaultProbability: 90, typicalDurationDays: 5 },
  ];
  const stages = [];
  for (const stageDef of stageDefs) {
    stages.push(
      await db.pipelineStage.upsert({
        where: { pipelineId_key: { pipelineId: pipeline.id, key: stageDef.key } },
        create: { pipelineId: pipeline.id, ...stageDef },
        update: {},
      }),
    );
  }
  const [qualifiedStage, discoveryStage, proposalStage, negotiationStage, commitStage] = stages;

  const lossReasonDefs = [
    { key: "price", label: "Price" },
    { key: "competitor", label: "Competitor" },
    { key: "no_decision", label: "No decision" },
    { key: "timing", label: "Timing" },
    { key: "product_fit", label: "Product fit" },
  ];
  const lossReasons = new Map<string, Awaited<ReturnType<typeof db.lossReason.upsert>>>();
  for (const def of lossReasonDefs) {
    lossReasons.set(
      def.key,
      await db.lossReason.upsert({
        where: { organisationId_key: { organisationId: organisation.id, key: def.key } },
        create: { organisationId: organisation.id, ...def },
        update: {},
      }),
    );
  }

  const opportunity = await db.opportunity.create({
    data: {
      organisationId: organisation.id,
      partyId: northbridge.id,
      name: "Northbridge — site fit-out",
      pipelineId: pipeline.id,
      stageId: commitStage.id,
      status: "WON",
      probability: 100,
      forecastCategory: "CLOSED",
      valueAmount: 2800000,
      ownerUserId: user.id,
      expectedCloseDate: new Date("2026-09-20"),
      actualCloseDate: new Date("2026-09-18"),
    },
  });
  await db.opportunity.create({
    data: {
      organisationId: organisation.id,
      partyId: harrow.id,
      name: "Harrow — annual contract",
      pipelineId: pipeline.id,
      stageId: proposalStage.id,
      probability: 50,
      forecastCategory: "BEST_CASE",
      valueAmount: 1200000,
      ownerUserId: user.id,
      expectedCloseDate: new Date("2026-10-24"),
      nextActionNote: "Send proposal review deck",
      nextActionAt: new Date("2026-10-04T10:00:00"),
    },
  });

  // Dalton: a long-stalled opportunity (no recent movement, past close date)
  // to exercise stale-deal detection on Today and the opportunity record.
  await db.opportunity.create({
    data: {
      organisationId: organisation.id,
      partyId: dalton.id,
      name: "Dalton — fleet expansion",
      pipelineId: pipeline.id,
      stageId: negotiationStage.id,
      probability: 75,
      forecastCategory: "PIPELINE",
      valueAmount: 640000,
      ownerUserId: user.id,
      expectedCloseDate: new Date("2026-09-15"),
      stageEnteredAt: new Date("2026-08-20"),
    },
  });

  // A representative spread of additional prospects and opportunities so
  // list/kanban/report views aren't tested with three records alone (§123).
  const prospectCompanies = [
    "Ashcroft Logistics", "Bellwood Partners", "Caldera Group", "Dunmore Retail", "Eastgate Manufacturing",
    "Fernwood Estates", "Greymoor Facilities", "Hartley & Sons", "Ironbridge Civils", "Juniper Hospitality",
    "Kestrel Energy", "Larchwood Care", "Millbrook Foods", "Norwood Transport", "Oakridge Developments",
    "Pinefield Security", "Quayside Marine", "Ravenscroft Legal", "Silverdale Health", "Thornbury Education",
  ];
  const sources = ["Website enquiry", "Referral", "Outbound", "Trade show", "Existing customer", "Campaign"];
  for (let i = 0; i < prospectCompanies.length; i++) {
    const stageOptions = ["NEW", "NEW", "CONTACTED", "CONTACTED", "QUALIFIED", "NURTURE"] as const;
    const lifecycleStage = stageOptions[i % stageOptions.length];
    await db.prospect.create({
      data: {
        organisationId: organisation.id,
        companyName: prospectCompanies[i],
        contactFirstName: ["Alex", "Jamie", "Morgan", "Taylor", "Casey"][i % 5],
        contactSurname: ["Reid", "Ngata", "Okafor", "Lindqvist", "Patel"][i % 5],
        email: `contact@${prospectCompanies[i].toLowerCase().replace(/[^a-z]/g, "")}.example`,
        source: sources[i % sources.length],
        originalSource: sources[i % sources.length],
        lifecycleStage,
        ownerUserId: user.id,
        estimatedValueAmount: 50000 + (i % 7) * 35000,
        fitScore: 40 + (i % 6) * 10,
        fitFactors: [
          { label: "Industry match", points: 15 },
          { label: "UK account", points: 10 },
        ],
        engagementScore: lifecycleStage === "NURTURE" ? 10 : 30 + (i % 5) * 12,
        engagementFactors: [{ label: "Replied to outreach", points: lifecycleStage === "NURTURE" ? 0 : 20 }],
        assignedAt: new Date(),
        createdAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const openStages = [qualifiedStage, discoveryStage, proposalStage, negotiationStage, commitStage];
  const forecastByStageIndex = ["PIPELINE", "PIPELINE", "BEST_CASE", "COMMIT", "COMMIT"] as const;
  for (let i = 0; i < 15; i++) {
    const party = i % 3 === 0 ? northbridge : i % 3 === 1 ? harrow : dalton;
    const stageIndex = i % openStages.length;
    const stage = openStages[stageIndex];
    const daysAgo = 2 + (i % 20);
    await db.opportunity.create({
      data: {
        organisationId: organisation.id,
        partyId: party.id,
        name: `${party.name} — opportunity ${i + 1}`,
        pipelineId: pipeline.id,
        stageId: stage.id,
        probability: stage.defaultProbability,
        forecastCategory: forecastByStageIndex[stageIndex],
        valueAmount: 20000 + (i % 9) * 15000,
        ownerUserId: user.id,
        stageEnteredAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        expectedCloseDate: new Date(Date.now() + (30 - daysAgo) * 24 * 60 * 60 * 1000),
        nextActionAt: i % 4 === 0 ? undefined : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nextActionNote: i % 4 === 0 ? undefined : "Follow up call",
      },
    });
  }

  // A handful of lost opportunities so win/loss and loss-reason reports have
  // real data.
  const reasonKeys = ["price", "competitor", "no_decision", "timing"];
  for (let i = 0; i < 6; i++) {
    const party = i % 2 === 0 ? harrow : dalton;
    await db.opportunity.create({
      data: {
        organisationId: organisation.id,
        partyId: party.id,
        name: `${party.name} — lost deal ${i + 1}`,
        pipelineId: pipeline.id,
        stageId: negotiationStage.id,
        status: "LOST",
        forecastCategory: "OMITTED",
        valueAmount: 15000 + i * 8000,
        ownerUserId: user.id,
        actualCloseDate: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000),
        lossReasonId: lossReasons.get(reasonKeys[i % reasonKeys.length])!.id,
      },
    });
  }

  // Overdue and due-today activities so Today has real work in it.
  await db.salesActivity.create({
    data: {
      organisationId: organisation.id,
      type: "CALL",
      subject: "Call James Richardson",
      ownerUserId: user.id,
      partyId: northbridge.id,
      dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });
  await db.salesActivity.create({
    data: {
      organisationId: organisation.id,
      type: "FOLLOW_UP",
      subject: "Follow up on proposal",
      ownerUserId: user.id,
      partyId: harrow.id,
      dueAt: new Date(),
    },
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
    data: { organisationId: organisation.id, partyId: northbridge.id, reference: "SO-1842", commercialStatus: "CONFIRMED", ownerUserId: user.id, grossAmount: 842000 },
  });
  await db.salesOrder.create({
    data: { organisationId: organisation.id, partyId: dalton.id, reference: "SO-1850", commercialStatus: "CONFIRMED", ownerUserId: user.id, grossAmount: 1180000 },
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

  // ---- HR (People) module demo data ----
  const sophie = await db.employee.upsert({
    where: { organisationId_employeeNumber: { organisationId: organisation.id, employeeNumber: "EMP-00000001" } },
    create: {
      organisationId: organisation.id,
      employeeNumber: "EMP-00000001",
      userId: user.id,
      firstName: "Sophie",
      lastName: "Green",
      email: "demo@atlas.app",
      jobTitle: "Operations Director",
      department: "Leadership",
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      startDate: new Date("2021-03-01"),
      annualSalaryMinorUnits: 7_200_000,
    },
    update: {},
  });

  const jordan = await db.employee.upsert({
    where: { organisationId_employeeNumber: { organisationId: organisation.id, employeeNumber: "EMP-00000002" } },
    create: {
      organisationId: organisation.id,
      employeeNumber: "EMP-00000002",
      managerId: sophie.id,
      firstName: "Jordan",
      lastName: "Pike",
      email: "jordan.pike@atlas.app",
      jobTitle: "Site Supervisor",
      department: "Operations",
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      startDate: new Date("2022-06-13"),
      annualSalaryMinorUnits: 3_800_000,
    },
    update: {},
  });

  const priya = await db.employee.upsert({
    where: { organisationId_employeeNumber: { organisationId: organisation.id, employeeNumber: "EMP-00000003" } },
    create: {
      organisationId: organisation.id,
      employeeNumber: "EMP-00000003",
      managerId: sophie.id,
      firstName: "Priya",
      lastName: "Shah",
      email: "priya.shah@atlas.app",
      jobTitle: "Finance Administrator",
      department: "Finance",
      employmentType: "PART_TIME",
      status: "ONBOARDING",
      startDate: new Date(),
      annualSalaryMinorUnits: 2_600_000,
    },
    update: {},
  });

  await db.employeeTask.createMany({
    data: [
      { organisationId: organisation.id, employeeId: priya.id, phase: "ONBOARDING", title: "Send offer letter and contract for signature", category: "Documentation", completedAt: new Date() },
      { organisationId: organisation.id, employeeId: priya.id, phase: "ONBOARDING", title: "Right to work check", category: "Compliance" },
      { organisationId: organisation.id, employeeId: priya.id, phase: "ONBOARDING", title: "Create IT accounts and equipment", category: "IT" },
    ],
  });

  await db.absenceRecord.createMany({
    data: [
      { organisationId: organisation.id, employeeId: jordan.id, type: "SICKNESS", startDate: new Date(Date.now() - 20 * 86_400_000), endDate: new Date(Date.now() - 19 * 86_400_000), reason: "Flu", certifiedByDoctor: false },
      { organisationId: organisation.id, employeeId: jordan.id, type: "SICKNESS", startDate: new Date(Date.now() - 45 * 86_400_000), endDate: new Date(Date.now() - 44 * 86_400_000), reason: "Migraine", certifiedByDoctor: false },
      { organisationId: organisation.id, employeeId: jordan.id, type: "HOLIDAY", startDate: new Date(Date.now() + 30 * 86_400_000), endDate: new Date(Date.now() + 35 * 86_400_000), reason: "Annual leave" },
    ],
  });

  await db.appraisal.create({
    data: { organisationId: organisation.id, employeeId: jordan.id, reviewerUserId: user.id, cycle: "2026 H1 review", scheduledAt: new Date(Date.now() + 14 * 86_400_000) },
  });

  await db.oneToOne.create({
    data: { organisationId: organisation.id, employeeId: jordan.id, managerUserId: user.id, scheduledAt: new Date(Date.now() + 7 * 86_400_000), talkingPoints: "Progress on site fit-out, workload check-in." },
  });

  await db.rotaShift.createMany({
    data: [
      { organisationId: organisation.id, employeeId: jordan.id, startsAt: new Date(Date.now() + 86_400_000), endsAt: new Date(Date.now() + 86_400_000 + 8 * 3_600_000), role: "Site Supervisor", location: "Northbridge site" },
      { organisationId: organisation.id, employeeId: priya.id, startsAt: new Date(Date.now() + 2 * 86_400_000), endsAt: new Date(Date.now() + 2 * 86_400_000 + 6 * 3_600_000), role: "Finance", location: "Head office" },
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
