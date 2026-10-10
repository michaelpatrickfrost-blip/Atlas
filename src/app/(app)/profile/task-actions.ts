"use server";
import { db } from "@/core/db/client";
import { assignedTaskScope } from "@/modules/projects/services/assigned-tasks";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { enabledModulesForSession } from "@/core/modules/runtime";
import { assertModuleEnabled } from "@/core/modules/access";
import { assignedProjectTask, assignedProjectTasks } from "@/modules/projects/services/assigned-tasks";
import { assignedEmployeeTask, assignedEmployeeTasks, completeAssignedEmployeeTask } from "@/modules/people/services/assigned-tasks";
import { changeAssignedTaskStatus } from "@/app/(app)/projects/actions";
import { taskChatAttachments } from "@/app/(app)/chat/actions";
import { revalidatePath } from "next/cache";
import type { MyTaskDetail, MyTaskPage, TaskFilter, TaskSource } from "@/core/shared/my-tasks";

function validateSource(source: unknown, id: unknown) {
  if ((source !== "projects" && source !== "people") || typeof id !== "string" || !id || id.length > 80) throw new Error("Choose an assigned task.");
}
export async function loadMyTasks(input: { filter?: TaskFilter; query?: string; page?: number } = {}): Promise<MyTaskPage> {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  const filter = input.filter ?? "open", query = (input.query ?? "").trim(), page = input.page ?? 0;
  if (!["open", "completed", "all"].includes(filter) || query.length > 120 || !Number.isSafeInteger(page) || page < 0 || page > 10000) throw new Error("Choose valid task filters.");
  const enabled = await enabledModulesForSession(session);
  const results = await Promise.all([
    enabled.has("projects") && can(session, "projects.read") ? assignedProjectTasks(session, filter, query, page) : null,
    enabled.has("people") && can(session, HR.employeeRead) ? assignedEmployeeTasks(session, filter, query, page) : null,
  ]);
  return { items: results.flatMap((result) => result?.items ?? []).sort((left, right) => (left.dueAt ?? "9999").localeCompare(right.dueAt ?? "9999") || left.id.localeCompare(right.id)),
    hasMore: results.some((result) => result?.hasMore), openCount: results.reduce((sum, result) => sum + (result?.openCount ?? 0), 0), completedCount: results.reduce((sum, result) => sum + (result?.completedCount ?? 0), 0) };
}
export async function loadMyTask(source: TaskSource, id: string): Promise<MyTaskDetail> {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  validateSource(source, id);
  await assertModuleEnabled(session, source);
  if (source === "people") {
    assertCapability(session, HR.employeeRead);
    return assignedEmployeeTask(session, id);
  }
  assertCapability(session, "projects.read");
  const enabled = await enabledModulesForSession(session);
  const detail = await assignedProjectTask(session, id, enabled);
  if (can(session, "core.chat.read")) detail.attachments.push(...await taskChatAttachments(id));
  detail.hasAttachments = detail.attachments.length > 0;
  return detail;
}
export async function updateMyTaskStatus(input: { source: TaskSource; id: string; version: number; status: string }) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  validateSource(input.source, input.id);
  if (!Number.isSafeInteger(input.version) || input.version < 1 || typeof input.status !== "string") throw new Error("Choose a valid task status.");
  try {
  await assertModuleEnabled(session, input.source);
  if (input.source === "people") {
    assertCapability(session, HR.employeeRead);
    if (input.status !== "DONE") throw new Error("Employee checklist tasks can only be marked completed.");
    await completeAssignedEmployeeTask(session, input.id);
  } else {
    assertCapability(session, "projects.read");
    const form = new FormData(); form.set("status", input.status); form.set("version", String(input.version));
    await changeAssignedTaskStatus(input.id, form);
  }
  revalidatePath("/profile");
  } catch { return { saved: false as const, error: "The status could not be saved. Check your access, finish any required checklist items, and refresh before trying again." }; }
  try { return { saved: true as const, detail: await loadMyTask(input.source, input.id) }; }
  catch { return { saved: true as const, detail: null }; }
}

export async function loadMyTaskCount(): Promise<number> {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  const enabled = await enabledModulesForSession(session);
  const counts = await Promise.all([
    enabled.has("projects") && can(session, "projects.read") ? db.projectTask.count({ where: { AND: [assignedTaskScope(session), { status: { notIn: ["DONE", "CANCELLED"] } }] } }) : 0,
    enabled.has("people") && can(session, HR.employeeRead) ? db.employeeTask.count({ where: { organisationId: session.organisationId, assignedToUserId: session.userId, completedAt: null } }) : 0,
  ]);
  return counts.reduce((sum, count) => sum + count, 0);
}
