import { db } from "@/core/db/client";

export type WorkItemPriority = "high" | "normal";

export type WorkItem = {
  id: string;
  title: string;
  subtitle?: string;
  reason: string;
  priority: WorkItemPriority;
  href: string;
  dueAt?: Date;
  kind: "opportunity" | "prospect" | "activity";
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Pure rule evaluation for one open opportunity — no DB access, fully unit
 * testable (see tests/sales-work-queue.test.ts). Exported separately from
 * getWorkQueue so the reasoning itself can be verified without a database.
 */
export function computeOpportunityReasons(
  opportunity: {
    nextActionAt: Date | null;
    stageEnteredAt: Date;
    expectedCloseDate: Date | null;
    stage: { name: string; typicalDurationDays: number | null };
  },
  now: Date,
): { reasons: string[]; priority: WorkItemPriority } {
  const reasons: string[] = [];
  let priority: WorkItemPriority = "normal";

  if (!opportunity.nextActionAt) {
    reasons.push("No next action set");
    priority = "high";
  } else if (opportunity.nextActionAt < now) {
    reasons.push(`Next action overdue — was due ${opportunity.nextActionAt.toLocaleDateString("en-GB")}`);
    priority = "high";
  }

  const daysInStage = Math.floor((now.getTime() - opportunity.stageEnteredAt.getTime()) / DAY_MS);
  if (daysInStage > 14) {
    reasons.push(`${daysInStage} days in ${opportunity.stage.name} — typically ${opportunity.stage.typicalDurationDays ?? 7} days`);
    priority = "high";
  }

  if (opportunity.expectedCloseDate && opportunity.expectedCloseDate < now) {
    reasons.push(`Expected close date passed — ${opportunity.expectedCloseDate.toLocaleDateString("en-GB")}`);
    priority = "high";
  }

  return { reasons, priority };
}

/**
 * Atlas's sales work-prioritisation engine (§7). Every item carries an
 * explicit `reason` — Atlas never prioritises something without saying why.
 * Rule-based and fully inspectable; there is no opaque scoring model here.
 */
export async function getWorkQueue(organisationId: string, ownerUserId: string): Promise<WorkItem[]> {
  const now = new Date();
  const items: WorkItem[] = [];

  const [overdueActivities, dueTodayActivities, openOpportunities, newProspects] = await Promise.all([
    db.salesActivity.findMany({
      where: { organisationId, ownerUserId, completedAt: null, dueAt: { lt: now } },
      include: { party: true, prospect: true, opportunity: true },
      orderBy: { dueAt: "asc" },
    }),
    db.salesActivity.findMany({
      where: { organisationId, ownerUserId, completedAt: null, dueAt: { gte: now, lt: new Date(now.getTime() + DAY_MS) } },
      include: { party: true, prospect: true, opportunity: true },
      orderBy: { dueAt: "asc" },
    }),
    db.opportunity.findMany({
      where: { organisationId, ownerUserId, status: "OPEN" },
      include: { party: true, stage: true },
    }),
    db.prospect.findMany({
      where: { organisationId, ownerUserId, lifecycleStage: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  for (const activity of overdueActivities) {
    items.push({
      id: `activity:${activity.id}`,
      title: activity.subject,
      subtitle: activity.party?.name ?? activity.prospect?.companyName ?? activity.opportunity?.name,
      reason: `Overdue — was due ${activity.dueAt!.toLocaleDateString("en-GB")}`,
      priority: "high",
      href: activity.opportunityId ? `/crm/opportunities/${activity.opportunityId}` : activity.prospectId ? `/crm/prospect/${activity.prospectId}` : "/crm/today",
      dueAt: activity.dueAt ?? undefined,
      kind: "activity",
    });
  }

  for (const activity of dueTodayActivities) {
    items.push({
      id: `activity:${activity.id}`,
      title: activity.subject,
      subtitle: activity.party?.name ?? activity.prospect?.companyName ?? activity.opportunity?.name,
      reason: "Due today",
      priority: "normal",
      href: activity.opportunityId ? `/crm/opportunities/${activity.opportunityId}` : activity.prospectId ? `/crm/prospect/${activity.prospectId}` : "/crm/today",
      dueAt: activity.dueAt ?? undefined,
      kind: "activity",
    });
  }

  for (const opportunity of openOpportunities) {
    const { reasons, priority } = computeOpportunityReasons(opportunity, now);
    if (reasons.length === 0) continue;

    items.push({
      id: `opportunity:${opportunity.id}`,
      title: opportunity.name,
      subtitle: `${opportunity.party.name} · ${opportunity.stage.name}`,
      reason: reasons.join(" · "),
      priority,
      href: `/crm/opportunities/${opportunity.id}`,
      kind: "opportunity",
    });
  }

  if (newProspects.length > 0) {
    items.push({
      id: "prospects:new",
      title: `${newProspects.length} new ${newProspects.length === 1 ? "prospect" : "prospects"} assigned to you`,
      reason: "Not yet contacted",
      priority: "normal",
      href: "/crm/prospect?filter=new",
      kind: "prospect",
    });
  }

  return items.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1));
}
