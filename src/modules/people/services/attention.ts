import { db } from "@/core/db/client";
import type { AttentionItem, AttentionProvider } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { calculateBradfordFactor } from "../domain/bradford-factor";

export const peopleAttentionProvider: AttentionProvider = async ({ organisationId, session }) => {
  if (!can(session, HR_CAPABILITIES.employeeRead)) return [];
  const items: AttentionItem[] = [];
  const now = new Date();

  const [overdueOnboarding, overdueAppraisals, activeEmployees] = await Promise.all([
    db.employeeTask.count({
      where: { organisationId, phase: "ONBOARDING", completedAt: null, dueDate: { lt: now } },
    }),
    db.appraisal.count({
      where: { organisationId, status: "SCHEDULED", scheduledAt: { lt: now } },
    }),
    can(session, HR_CAPABILITIES.absenceRead)
      ? db.employee.findMany({
          where: { organisationId, status: { not: "LEFT" } },
          select: { id: true, firstName: true, lastName: true, absences: { where: { type: "SICKNESS" }, select: { startDate: true, endDate: true } } },
        })
      : Promise.resolve([]),
  ]);

  if (overdueOnboarding > 0) {
    items.push({
      id: "people.onboarding.overdue",
      label: `${overdueOnboarding} onboarding task${overdueOnboarding === 1 ? "" : "s"} overdue`,
      href: "/people/onboarding",
      severity: "warning",
    });
  }
  if (overdueAppraisals > 0) {
    items.push({
      id: "people.appraisals.overdue",
      label: `${overdueAppraisals} appraisal${overdueAppraisals === 1 ? "" : "s"} overdue`,
      href: "/people/appraisals",
      severity: "warning",
    });
  }

  let serious = 0;
  for (const employee of activeEmployees) {
    const { band } = calculateBradfordFactor(employee.absences, now);
    if (band === "serious" || band === "concern") serious++;
  }
  if (serious > 0) {
    items.push({
      id: "people.absence.bradford",
      label: `${serious} employee${serious === 1 ? "" : "s"} over the Bradford Factor watch threshold`,
      href: "/people/absence",
      severity: "critical",
    });
  }

  return items;
};
