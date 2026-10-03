import { db } from "@/core/db/client";

export function listOpportunities(
  organisationId: string,
  opts: { pipelineId?: string; status?: "OPEN" | "WON" | "LOST"; ownerUserId?: string } = {},
) {
  return db.opportunity.findMany({
    where: {
      organisationId,
      pipelineId: opts.pipelineId,
      status: opts.status ?? "OPEN",
      ownerUserId: opts.ownerUserId,
    },
    include: { party: true, stage: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function getOpportunity(organisationId: string, opportunityId: string) {
  return db.opportunity.findFirst({
    where: { organisationId, id: opportunityId },
    include: {
      party: true,
      pipeline: { include: { stages: { orderBy: { order: "asc" } } } },
      stage: true,
      primaryContact: true,
      lossReason: true,
      stakeholders: { include: { contact: true } },
      milestones: { orderBy: { order: "asc" } },
      changeEvents: { orderBy: { createdAt: "desc" }, take: 20 },
      activities: { orderBy: { createdAt: "desc" } },
      quotes: true,
    },
  });
}
