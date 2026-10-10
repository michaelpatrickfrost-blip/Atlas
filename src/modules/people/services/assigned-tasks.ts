import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import type { MyTask, MyTaskDetail, TaskFilter } from "@/core/shared/my-tasks";

export async function assignedEmployeeTasks(session: Session, filter: TaskFilter, query: string, page: number) {
  const scope = { organisationId: session.organisationId, assignedToUserId: session.userId };
  const [rows, openCount, completedCount] = await Promise.all([
    db.employeeTask.findMany({ where: { ...scope,
      ...(filter === "all" ? {} : { completedAt: filter === "completed" ? { not: null } : null }),
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" as const } }, { notes: { contains: query, mode: "insensitive" as const } }] } : {}) },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { id: "asc" }], skip: page * 50, take: 51 }),
    db.employeeTask.count({ where: { ...scope, completedAt: null } }),
    db.employeeTask.count({ where: { ...scope, completedAt: { not: null } } }),
  ]);
  return { items: rows.slice(0, 50).map((row): MyTask => ({ id: row.id, source: "people", title: row.title,
    context: `${row.employee.firstName} ${row.employee.lastName}`, kind: row.phase === "ONBOARDING" ? "Onboarding" : "Offboarding",
    status: row.completedAt ? "DONE" : "TODO", priority: "NORMAL", dueAt: row.dueDate?.toISOString() ?? null, hasAttachments: false })),
    hasMore: rows.length > 50, openCount, completedCount };
}
export async function assignedEmployeeTask(session: Session, id: string): Promise<MyTaskDetail> {
  const task = await db.employeeTask.findFirst({ where: { id, organisationId: session.organisationId, assignedToUserId: session.userId },
    include: { employee: { select: { firstName: true, lastName: true } } } });
  if (!task) throw new Error("This task is no longer available to you.");
  return { id: task.id, source: "people", title: task.title, context: `${task.employee.firstName} ${task.employee.lastName}`,
    kind: task.phase === "ONBOARDING" ? "Onboarding" : "Offboarding", status: task.completedAt ? "DONE" : "TODO", priority: "NORMAL",
    dueAt: task.dueDate?.toISOString() ?? null, hasAttachments: false, description: task.notes ?? "", version: 1,
    editable: !task.completedAt && can(session, task.phase === "ONBOARDING" ? HR.onboardingManage : HR.offboardingManage),
    statuses: ["TODO", "DONE"], href: `/people/${task.employeeId}`, notes: [], attachments: [], checklist: [] };
}
export async function completeAssignedEmployeeTask(session: Session, id: string) {
  await db.$transaction(async (tx) => {
    const task = await tx.employeeTask.findFirst({ where: { id, organisationId: session.organisationId, assignedToUserId: session.userId } });
    if (!task) throw new Error("This task is no longer available to you.");
    assertCapability(session, task.phase === "ONBOARDING" ? HR.onboardingManage : HR.offboardingManage);
    if (task.completedAt) throw new Error("This task was already completed. Refresh to see its current status.");
    const saved = await tx.employeeTask.updateMany({ where: { id, organisationId: session.organisationId,
      assignedToUserId: session.userId, completedAt: null }, data: { completedAt: new Date() } });
    if (saved.count !== 1) throw new Error("This task changed. Refresh before saving again.");
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId,
      action: "EmployeeTaskCompleted", entityType: "EmployeeTask", entityId: id, after: { completed: true } } });
  }, { isolationLevel: "Serializable" });
}
