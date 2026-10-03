import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";

export type ProspectFilter = "my_prospects" | "target_accounts" | "new" | "nurture";

export function listProspects(organisationId: string, opts: { filter?: ProspectFilter; ownerUserId?: string; search?: string } = {}) {
  const where: Prisma.ProspectWhereInput = { organisationId, lifecycleStage: { not: "CONVERTED" } };

  if (opts.filter === "my_prospects" && opts.ownerUserId) where.ownerUserId = opts.ownerUserId;
  if (opts.filter === "target_accounts") where.isTargetAccount = true;
  if (opts.filter === "new") where.lifecycleStage = "NEW";
  if (opts.filter === "nurture") where.lifecycleStage = "NURTURE";
  if (opts.search) {
    where.OR = [
      { companyName: { contains: opts.search, mode: "insensitive" } },
      { email: { contains: opts.search, mode: "insensitive" } },
      { contactSurname: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  return db.prospect.findMany({ where, orderBy: { createdAt: "desc" } });
}

export function getProspect(organisationId: string, prospectId: string) {
  return db.prospect.findFirst({
    where: { organisationId, id: prospectId },
    include: {
      party: true,
      activities: { orderBy: { createdAt: "desc" } },
      opportunity: { include: { stage: true } },
    },
  });
}
