"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { db } from "@/core/db/client";

export type WorkItem = { id: string; kind: string; title: string; detail: string; href: string };

function dated(date: Date | null | undefined) {
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

/** Work sitting with the signed-in person. Runs as their own action so a staff
 *  profile can see assignments without opening the whole company record. */
export async function loadAssignedWork(): Promise<WorkItem[]> {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  const enabled = await getEnabledModuleIds(session.organisationId);
  const items: WorkItem[] = [];
  const organisationId = session.organisationId;

  if (enabled.has("projects")) {
    const tasks = await db.projectTask.findMany({
      where: { organisationId, status: { notIn: ["DONE", "CANCELLED"] }, OR: [{ assigneeUserId: session.userId }, { contributorUserIds: { has: session.userId } }] },
      select: { id: true, title: true, dueAt: true, priority: true, taskType: true, assigneeUserId: true, project: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 12,
    });
    for (const task of tasks) {
      const kind = task.taskType === "FOLLOW_UP" ? "Follow-up" : task.taskType === "REQUEST" ? "Request" : "Task";
      const detail = [task.project?.name, task.assigneeUserId === session.userId ? null : "You are helping", task.priority === "HIGH" ? "High" : null, dated(task.dueAt)].filter(Boolean).join(" · ");
      items.push({ id: task.id, kind, title: task.title, detail, href: `/projects/tasks/${task.id}` });
    }
    const meetings = await db.meeting.findMany({
      where: { organisationId, startsAt: { gte: new Date(Date.now() - 86_400_000) }, OR: [{ organiserUserId: session.userId }, { attendeeUserIds: { has: session.userId } }] },
      select: { id: true, title: true, startsAt: true },
      orderBy: { startsAt: "asc" },
      take: 8,
    });
    for (const meeting of meetings) items.push({ id: meeting.id, kind: "Meeting", title: meeting.title, detail: dated(meeting.startsAt), href: "/projects/meetings" });
  }

  if (enabled.has("crm")) {
    const activities = await db.salesActivity.findMany({
      where: { organisationId, ownerUserId: session.userId, completedAt: null },
      select: { id: true, subject: true, type: true, dueAt: true, prospectId: true, opportunityId: true, partyId: true },
      orderBy: { dueAt: "asc" },
      take: 8,
    });
    for (const activity of activities) {
      const href = activity.opportunityId ? `/crm/opportunities/${activity.opportunityId}` : activity.prospectId ? `/crm/prospect/${activity.prospectId}` : activity.partyId ? `/customers/${activity.partyId}` : "/crm/today";
      items.push({ id: activity.id, kind: activity.type.replaceAll("_", " "), title: activity.subject, detail: dated(activity.dueAt), href });
    }
  }

  if (enabled.has("service")) {
    const cases = await db.serviceCase.findMany({
      where: { organisationId, ownerUserId: session.userId, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } },
      select: { id: true, number: true, subject: true, status: true, priority: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    for (const item of cases) items.push({ id: item.id, kind: "Customer service", title: item.subject, detail: [item.number, item.status.replaceAll("_", " "), item.priority === "HIGH" ? "High" : null].filter(Boolean).join(" · "), href: `/service/cases/${item.id}` });
  }

  if (enabled.has("people")) {
    const [reviews, meetings, tasks] = await Promise.all([
      db.appraisal.findMany({
        where: { organisationId, status: "SCHEDULED", OR: [{ reviewerUserId: session.userId }, { employee: { userId: session.userId } }] },
        select: { id: true, cycle: true, scheduledAt: true, employee: { select: { firstName: true, lastName: true, userId: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 6,
      }),
      db.oneToOne.findMany({
        where: { organisationId, status: "SCHEDULED", OR: [{ managerUserId: session.userId }, { employee: { userId: session.userId } }] },
        select: { id: true, scheduledAt: true, employee: { select: { firstName: true, lastName: true, userId: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 6,
      }),
      db.employeeTask.findMany({
        where: { organisationId, assignedToUserId: session.userId, completedAt: null },
        select: { id: true, title: true, dueDate: true, phase: true, employee: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
    ]);
    for (const review of reviews) {
      const mine = review.employee.userId === session.userId;
      items.push({ id: review.id, kind: "Appraisal", title: review.cycle, detail: [mine ? "Your review" : `${review.employee.firstName} ${review.employee.lastName}`, dated(review.scheduledAt)].filter(Boolean).join(" · "), href: "/people/appraisals" });
    }
    for (const meeting of meetings) {
      const mine = meeting.employee.userId === session.userId;
      items.push({ id: meeting.id, kind: "One-to-one", title: mine ? "Your one-to-one" : `${meeting.employee.firstName} ${meeting.employee.lastName}`, detail: dated(meeting.scheduledAt), href: "/people/one-to-ones" });
    }
    for (const task of tasks) items.push({ id: task.id, kind: task.phase === "ONBOARDING" ? "Onboarding" : "Offboarding", title: task.title, detail: [`${task.employee.firstName} ${task.employee.lastName}`, dated(task.dueDate)].filter(Boolean).join(" · "), href: `/people/${task.employee.id}` });
  }

  return items;
}
