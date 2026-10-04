import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import type { Prisma } from "@/generated/prisma/client";

function companyConduct(session: Session) {
  const conduct = can(session, "people.conduct.read") || can(session, "people.conduct.manage");
  const employees = can(session, "people.employee.read") || can(session, "people.employee.manage");
  return conduct && employees;
}

export function seesEveryPrivateGoal(session: Session) {
  return companyConduct(session);
}

export function goalWhere(session: Session): Prisma.KpiWhereInput {
  if (seesEveryPrivateGoal(session)) return { organisationId: session.organisationId };
  const or: Prisma.KpiWhereInput[] = [
    { ownerUserId: session.userId },
    { leadUserIds: { has: session.userId }, OR: [{ planId: null }, { plan: { status: { not: "DRAFT" } } }] },
  ];
  if (can(session, "kpis.read")) or.unshift({ visibility: "COMPANY" });
  return { organisationId: session.organisationId, OR: or };
}

export function planWhere(session: Session): Prisma.PerformancePlanWhereInput {
  if (seesEveryPrivateGoal(session)) return { organisationId: session.organisationId };
  return {
    organisationId: session.organisationId,
    OR: [
      { ownerUserId: session.userId },
      { leadUserIds: { has: session.userId }, status: { not: "DRAFT" } },
    ],
  };
}
