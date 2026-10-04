import { db } from "@/core/db/client";
import { SalesProjectStage } from "@/generated/prisma/client";

export async function listSalesProjects(
  organisationId: string,
  options?: {
    stage?: SalesProjectStage;
    ownerUserId?: string;
    teamId?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { organisationId };
  if (options?.stage) where.stage = options.stage;
  if (options?.ownerUserId) where.ownerUserId = options.ownerUserId;
  if (options?.teamId) where.teamId = options.teamId;

  return await db.salesProject.findMany({
    where,
    include: {
      team: true,
      industry: true,
      organisations: {
        include: { party: true },
      },
    },
    orderBy: { targetAwardDate: "asc" },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });
}

export async function getSalesProject(
  id: string,
  organisationId: string
) {
  return await db.salesProject.findFirst({
    where: { id, organisationId },
    include: {
      team: true,
      industry: true,
      organisations: {
        include: { party: true },
      },
      stakeholders: {
        include: { contact: { include: { party: true } } },
      },
      quotes: true,
      orders: true,
      activities: true,
    },
  });
}

export async function getSalesProjectByReference(
  reference: string,
  organisationId: string
) {
  return await db.salesProject.findFirst({
    where: { reference, organisationId },
    include: {
      team: true,
      industry: true,
      organisations: {
        include: { party: true },
      },
      stakeholders: {
        include: { contact: { include: { party: true } } },
      },
      quotes: true,
      orders: true,
      activities: true,
    },
  });
}

export async function getSalesProjectsForCustomer(
  partyId: string,
  organisationId: string
) {
  return await db.salesProject.findMany({
    where: {
      organisationId,
      organisations: {
        some: { partyId },
      },
    },
    include: {
      team: true,
      organisations: {
        include: { party: true },
      },
    },
    orderBy: { targetAwardDate: "asc" },
  });
}

export async function generateSalesProjectReference(
  organisationId: string
): Promise<string> {
  const latest = await db.salesProject.findFirst({
    where: { organisationId },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });

  if (!latest?.reference) return "SP-00001";

  // Extract number from reference like "SP-00184"
  const match = latest.reference.match(/^SP-(\d+)$/);
  if (!match) return "SP-00001";

  const nextNum = (parseInt(match[1], 10) + 1).toString().padStart(5, "0");
  return `SP-${nextNum}`;
}
