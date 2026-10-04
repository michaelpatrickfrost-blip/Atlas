import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";

export type ProspectFilter = "my_prospects" | "target_accounts" | "new" | "nurture";

export function listIndustries(organisationId: string) {
  return db.crmIndustry.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
}

export async function listProspectTags(organisationId: string) {
  const rows = await db.prospect.findMany({ where: { organisationId }, select: { tags: true } });
  return [...new Set(rows.flatMap((row) => row.tags))].sort((a, b) => a.localeCompare(b));
}

export function listProspects(organisationId: string, opts: { filter?: ProspectFilter; ownerUserId?: string; search?: string; industryId?: string; tag?: string } = {}) {
  const where: Prisma.ProspectWhereInput = { organisationId, lifecycleStage: { not: "CONVERTED" } };

  if (opts.ownerUserId) where.ownerUserId = opts.ownerUserId;
  if (opts.filter === "target_accounts") where.isTargetAccount = true;
  if (opts.filter === "new") where.lifecycleStage = "NEW";
  if (opts.filter === "nurture") where.lifecycleStage = "NURTURE";
  if (opts.industryId) where.industryId = opts.industryId;
  if (opts.tag) where.tags = { has: opts.tag };
  if (opts.search) {
    where.OR = [
      { companyName: { contains: opts.search, mode: "insensitive" } },
      { email: { contains: opts.search, mode: "insensitive" } },
      { contactSurname: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  return db.prospect.findMany({ where, include: { industry: true }, orderBy: { companyName: "asc" } });
}

export function getProspect(organisationId: string, prospectId: string) {
  return db.prospect.findFirst({
    where: { organisationId, id: prospectId },
    include: {
      party: true,
      industry: true,
      activities: { orderBy: { createdAt: "desc" } },
      opportunity: { include: { stage: true } },
    },
  });
}
