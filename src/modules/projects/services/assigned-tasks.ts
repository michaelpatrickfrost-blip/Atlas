import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { taskScope } from "@/core/permissions/work-access";
import { can } from "@/core/permissions/check";
import { TASK_STATUSES } from "../domain/work";
import { resolveWorkLink } from "./links";
import type { MyTask, MyTaskDetail, TaskFilter } from "@/core/shared/my-tasks";

export function assignedTaskScope(session: Session) {
  return { AND: [taskScope(session), { OR: [
    { assigneeUserId: session.userId }, { contributorUserIds: { has: session.userId } },
  ] }] };
}
export async function assignedProjectTasks(session: Session, filter: TaskFilter, query: string, page: number) {
  const scope = assignedTaskScope(session);
  const where = { AND: [scope,
    filter === "all" ? {} : { status: filter === "completed" ? { in: ["DONE", "CANCELLED"] } : { notIn: ["DONE", "CANCELLED"] } },
    query ? { OR: [{ title: { contains: query, mode: "insensitive" as const } }, { description: { contains: query, mode: "insensitive" as const } }] } : {},
  ] };
  const [rows, openCount, completedCount] = await Promise.all([
    db.projectTask.findMany({ where, select: { id: true, title: true, status: true, priority: true, dueAt: true, taskType: true,
      project: { select: { name: true } }, _count: { select: { workLinks: true, chatMessages: { where: { organisationId: session.organisationId, links: { some: {} }, conversation: { participants: { some: { userId: session.userId, organisationId: session.organisationId } } } } } } } },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { id: "asc" }], skip: page * 50, take: 51 }),
    db.projectTask.count({ where: { AND: [scope, { status: { notIn: ["DONE", "CANCELLED"] } }] } }),
    db.projectTask.count({ where: { AND: [scope, { status: { in: ["DONE", "CANCELLED"] } }] } }),
  ]);
  return { items: rows.slice(0, 50).map((row): MyTask => ({ id: row.id, source: "projects", title: row.title,
    context: row.project?.name ?? "Personal task", kind: row.taskType.replaceAll("_", " ").toLowerCase(),
    status: row.status, priority: row.priority, dueAt: row.dueAt?.toISOString() ?? null,
    hasAttachments: row._count.workLinks > 0 || row._count.chatMessages > 0 })), hasMore: rows.length > 50, openCount, completedCount };
}

export async function assignedProjectTask(session: Session, id: string, enabled: Set<string>): Promise<MyTaskDetail> {
  const task = await db.projectTask.findFirst({ where: { AND: [assignedTaskScope(session), { id }] },
    include: { project: { include: { members: true } }, checklist: { orderBy: { id: "asc" } },
      comments: { where: { organisationId: session.organisationId }, orderBy: { createdAt: "asc" } },
      workLinks: { where: { organisationId: session.organisationId }, orderBy: { id: "asc" } } } });
  if (!task) throw new Error("This task is no longer available to you.");
  const project = task.project;
  const editable = can(session, "projects.manage") && (project
    ? !project.archivedAt && (project.ownerUserId === session.userId ||
      project.members.some((member) => member.userId === session.userId && ["LEAD", "MANAGER", "MEMBER", "CONTRIBUTOR"].includes(member.role)) ||
      (project.visibility === "COMPANY" && !project.ownerUserId))
    : task.creatorUserId === session.userId || task.assigneeUserId === session.userId);
  const authors = await db.user.findMany({ where: { id: { in: [...new Set(task.comments.map((comment) => comment.authorUserId))] },
    memberships: { some: { organisationId: session.organisationId } } }, select: { id: true, name: true } });
  const names = new Map(authors.map((author) => [author.id, author.name]));
  const targets: Record<string, string> = { ProjectTask: "projects", ProjectDocument: "projects", SalesOrder: "sales", Quote: "sales", Product: "products" };
  const attachments = await Promise.all(task.workLinks.map(async (link) => {
    const target = targets[link.targetEntity];
    const card = !target || enabled.has(target) ? await resolveWorkLink(session, link) : null;
    return { key: link.id, title: card?.title ?? "Attached record", detail: card?.detail ?? "Not available to you", href: card?.href ?? null };
  }));
  return { id: task.id, source: "projects", title: task.title, context: project?.name ?? "Personal task", kind: task.taskType.replaceAll("_", " ").toLowerCase(),
    status: task.status, priority: task.priority, dueAt: task.dueAt?.toISOString() ?? null, hasAttachments: attachments.length > 0,
    description: task.description, version: task.version, editable, statuses: [...TASK_STATUSES], href: `/projects/tasks/${task.id}`,
    notes: task.comments.map((comment) => ({ id: comment.id, body: comment.body, author: names.get(comment.authorUserId) ?? "Former member", at: comment.createdAt.toISOString() })),
    attachments, checklist: task.checklist.map(({ id, title, done }) => ({ id, title, done })) };
}
