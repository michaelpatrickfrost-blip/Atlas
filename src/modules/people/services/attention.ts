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
    can(session, HR_CAPABILITIES.onboardingManage) ? db.employeeTask.count({
      where: { organisationId, phase: "ONBOARDING", completedAt: null, dueDate: { lt: now } },
    }) : Promise.resolve(0),
    can(session, HR_CAPABILITIES.appraisalRead) ? db.appraisal.count({
      where: { organisationId, status: "SCHEDULED", scheduledAt: { lt: now } },
    }) : Promise.resolve(0),
    can(session, HR_CAPABILITIES.absenceRead)
      ? db.employee.findMany({
          where: { organisationId, status: { not: "LEFT" } },
          select: { id: true, firstName: true, lastName: true, absences: { where: { type: "SICKNESS", status: "APPROVED" }, select: { startDate: true, endDate: true } } },
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

  // Personal reminders for this user as a manager — the "push to managers" path:
  // auto-generated reviews land here and in /people/my-team, not in an inbox.
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const [myAppraisalsDue, myOneToOnesDue] = await Promise.all([
    can(session, HR_CAPABILITIES.appraisalRead) ? db.appraisal.count({ where: { organisationId, reviewerUserId: session.userId, status: "SCHEDULED", scheduledAt: { lt: weekAhead } } }) : Promise.resolve(0),
    can(session, HR_CAPABILITIES.oneToOneRead) ? db.oneToOne.count({ where: { organisationId, managerUserId: session.userId, status: "SCHEDULED", scheduledAt: { lt: weekAhead } } }) : Promise.resolve(0),
  ]);
  if (myAppraisalsDue > 0) {
    items.push({
      id: "people.my_team.appraisals_due",
      label: `${myAppraisalsDue} appraisal${myAppraisalsDue === 1 ? "" : "s"} due this week for your team`,
      href: "/people/my-team",
      severity: "info",
    });
  }
  if (myOneToOnesDue > 0) {
    items.push({
      id: "people.my_team.one_to_ones_due",
      label: `${myOneToOnesDue} one-to-one${myOneToOnesDue === 1 ? "" : "s"} due this week for your team`,
      href: "/people/my-team",
      severity: "info",
    });
  }

  if (can(session, HR_CAPABILITIES.expenseApprove)) {
    const pendingExpenses = await db.expenseClaim.count({ where: { organisationId, status: "PENDING" } });
    if (pendingExpenses > 0) {
      items.push({
        id: "people.expenses.pending",
        label: `${pendingExpenses} expense claim${pendingExpenses === 1 ? "" : "s"} awaiting approval`,
        href: "/people/expenses",
        severity: "warning",
      });
    }
  }

  if (can(session, HR_CAPABILITIES.absenceManage)) {
    const pendingLeave = await db.absenceRecord.count({ where: { organisationId, status: "PENDING" } });
    if (pendingLeave > 0) {
      items.push({
        id: "people.absence.pending_requests",
        label: `${pendingLeave} leave request${pendingLeave === 1 ? "" : "s"} awaiting approval`,
        href: "/people/absence",
        severity: "warning",
      });
    }
  }

  return items;
};
