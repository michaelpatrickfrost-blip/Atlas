"use server";

import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { SalesProjectStage } from "@/generated/prisma/client";
import { generateSalesProjectReference } from "./sales-projects-queries";

export async function createSalesProject(input: {
  name: string;
  description?: string;
  ownerUserId: string;
  teamId?: string;
  potentialValueAmount?: number;
  industryId?: string;
  stage?: SalesProjectStage;
  targetAwardDate?: Date;
  primaryOrganisationId?: string;
}) {
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.opportunityManage);

  const reference = await generateSalesProjectReference(session.organisationId);

  return await db.salesProject.create({
    data: {
      organisationId: session.organisationId,
      reference,
      name: input.name,
      description: input.description,
      ownerUserId: input.ownerUserId,
      teamId: input.teamId,
      potentialValueAmount: input.potentialValueAmount,
      potentialValueCurrency: "GBP",
      industryId: input.industryId,
      stage: input.stage || SalesProjectStage.IDENTIFIED,
      targetAwardDate: input.targetAwardDate,
      ...( input.primaryOrganisationId && {
        organisations: {
          create: {
            partyId: input.primaryOrganisationId,
            isPrimary: true,
            roles: ["END_CLIENT"],
          },
        },
      }),
    },
    include: {
      team: true,
      organisations: {
        include: { party: true },
      },
    },
  });
}

export async function updateSalesProject(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    stage: SalesProjectStage;
    ownerUserId: string;
    teamId: string;
    potentialValueAmount: number;
    quotedValueAmount: number;
    awardedValueAmount: number;
    orderedValueAmount: number;
    probability: number;
    expectedValueAmount: number;
    targetAwardDate: Date;
    expectedStartDate: Date;
    expectedCompletionDate: Date;
    nextActionNote: string;
    nextActionAt: Date;
    industryId: string;
    tags: string[];
    notes: string;
  }>
) {
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.opportunityManage);

  // Update timestamps for tracking
  const updateData: any = {
    ...input,
    updatedAt: new Date(),
  };

  if (input.stage) {
    updateData.stageEnteredAt = new Date();
  }

  if (input.potentialValueAmount !== undefined ||
      input.quotedValueAmount !== undefined ||
      input.awardedValueAmount !== undefined ||
      input.orderedValueAmount !== undefined) {
    updateData.lastActivityAt = new Date();
  }

  return await db.salesProject.update({
    where: { id },
    data: updateData,
    include: {
      team: true,
      organisations: {
        include: { party: true },
      },
      stakeholders: {
        include: { contact: { include: { party: true } } },
      },
    },
  });
}

export async function addOrganisationToProject(input: {
  salesProjectId: string;
  partyId: string;
  roles: string[];
  isPrimary?: boolean;
}) {
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.opportunityManage);

  return await db.salesProjectOrganisation.create({
    data: {
      salesProjectId: input.salesProjectId,
      partyId: input.partyId,
      roles: input.roles as any,
      isPrimary: input.isPrimary || false,
    },
    include: {
      party: true,
    },
  });
}

export async function addStakeholderToProject(input: {
  salesProjectId: string;
  contactId: string;
  roles: string[];
  influence?: string;
  relationshipStrength?: string;
  sentiment?: string;
}) {
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.opportunityManage);

  return await db.salesProjectStakeholder.create({
    data: {
      salesProjectId: input.salesProjectId,
      contactId: input.contactId,
      roles: input.roles as any,
      influence: input.influence,
      relationshipStrength: input.relationshipStrength,
      sentiment: input.sentiment,
    },
    include: {
      contact: {
        include: { party: true },
      },
    },
  });
}

export async function linkQuoteToProject(quoteId: string, salesProjectId: string) {
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.quoteRead);

  return await db.quote.update({
    where: { id: quoteId },
    data: { salesProjectId },
  });
}

export async function linkOrderToProject(orderId: string, salesProjectId: string) {
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.orderRead);

  return await db.salesOrder.update({
    where: { id: orderId },
    data: { salesProjectId },
  });
}

export async function deleteSalesProject(id: string) {
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.opportunityManage);

  // Delete related records first
  await db.salesProjectOrganisation.deleteMany({
    where: { salesProjectId: id },
  });

  await db.salesProjectStakeholder.deleteMany({
    where: { salesProjectId: id },
  });

  await db.salesProject.delete({
    where: { id },
  });
}
