"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { DOMAIN_EVENTS, emit } from "@/core/events/bus";
import { TEAMS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { civilDate, dateRange } from "../domain/board";
import { assertLead, currentEmployee, onTeam, requireTeam } from "./access";

function text(form: FormData, key: string, limit: number) {
  const value = String(form.get(key) ?? "").trim();
  if (value.length > limit) throw new Error(`Keep that to ${limit} characters.`);
  return value;
}
function required(form: FormData, key: string, limit: number, label: string) {
  const value = text(form, key, limit);
  if (!value) throw new Error(`Enter ${label}.`);
  return value;
}

function refresh(teamId?: string) {
  revalidatePath("/teams");
  if (teamId) revalidatePath(`/teams/${teamId}`);
}

export async function createTeam(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.manage);
  const name = required(formData, "name", 80, "a team name");
  const employee = await currentEmployee(session);
  const team = await db.plannerTeam.create({
    data: {
      organisationId: session.organisationId,
      name,
      createdByUserId: session.userId,
      members: employee ? { create: { organisationId: session.organisationId, employeeId: employee.id, lead: true } } : undefined,
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.team.created", entityType: "PlannerTeam", entityId: team.id, after: { name } });
  await writeActivity({ organisationId: session.organisationId, type: "teams.team.created", summary: `Team ${name} was opened.`, entityType: "PlannerTeam", entityId: team.id });
  await emit(DOMAIN_EVENTS.teamPlannerTeamCreated, { organisationId: session.organisationId, teamId: team.id });
  refresh(team.id);
  redirect(`/teams/${team.id}`);
}

export async function renameTeam(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const name = required(formData, "name", 80, "a team name");
  await db.plannerTeam.update({ where: { id: access.team.id }, data: { name } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.team.renamed", entityType: "PlannerTeam", entityId: access.team.id, after: { name } });
  refresh(access.team.id);
}

export async function addMember(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const employeeId = required(formData, "employeeId", 40, "a person");
  const employee = await db.employee.findFirst({ where: { id: employeeId, organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true } });
  if (!employee) throw new Error("Choose someone who still works here.");
  if (access.team.members.some((member) => member.employeeId === employee.id)) throw new Error("They are already on this team.");
  await db.plannerTeamMember.create({
    data: { organisationId: session.organisationId, teamId: access.team.id, employeeId: employee.id, lead: formData.get("lead") === "on" },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.member.added", entityType: "PlannerTeam", entityId: access.team.id, after: { employeeId: employee.id } });
  await writeActivity({ organisationId: session.organisationId, type: "teams.member.added", summary: `${employee.firstName} ${employee.lastName} joined the team.`, entityType: "PlannerTeam", entityId: access.team.id });
  refresh(access.team.id);
}

export async function removeMember(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const memberId = required(formData, "memberId", 40, "a person");
  const member = await db.plannerTeamMember.findFirst({ where: { id: memberId, organisationId: session.organisationId, teamId: access.team.id } });
  if (!member) throw new Error("That person is not on this team.");
  await db.plannerTeamMember.delete({ where: { id: member.id } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.member.removed", entityType: "PlannerTeam", entityId: access.team.id, after: { employeeId: member.employeeId } });
  refresh(access.team.id);
}

export async function saveTask(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const title = required(formData, "title", 140, "what needs doing");
  const detail = text(formData, "detail", 500) || null;
  const assigneeEmployeeId = text(formData, "assigneeEmployeeId", 40);
  const due = text(formData, "dueOn", 10);
  if (assigneeEmployeeId) onTeam(access, assigneeEmployeeId);
  const task = await db.plannerTask.create({
    data: {
      organisationId: session.organisationId,
      teamId: access.team.id,
      title,
      detail,
      assigneeEmployeeId: assigneeEmployeeId || null,
      dueOn: due ? civilDate(due) : null,
      createdByUserId: session.userId,
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.task.created", entityType: "PlannerTask", entityId: task.id, after: { title } });
  await emit(DOMAIN_EVENTS.teamPlannerTaskAssigned, { organisationId: session.organisationId, teamId: access.team.id, taskId: task.id });
  refresh(access.team.id);
}

export async function setTaskStatus(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  const taskId = required(formData, "taskId", 40, "a task");
  const status = required(formData, "status", 10, "a status");
  if (!["OPEN", "DOING", "DONE"].includes(status)) throw new Error("Choose open, doing or done.");
  const task = await db.plannerTask.findFirst({ where: { id: taskId, organisationId: session.organisationId, teamId: access.team.id } });
  if (!task) throw new Error("That task is not on this team.");
  const mine = Boolean(access.employee && task.assigneeEmployeeId === access.employee.id);
  if (!access.manage && !mine) throw new Error("You can update a task assigned to you.");
  await db.plannerTask.update({ where: { id: task.id }, data: { status: status as "OPEN" | "DOING" | "DONE" } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.task.updated", entityType: "PlannerTask", entityId: task.id, after: { status } });
  refresh(access.team.id);
}

export async function removeTask(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const taskId = required(formData, "taskId", 40, "a task");
  const task = await db.plannerTask.findFirst({ where: { id: taskId, organisationId: session.organisationId, teamId: access.team.id }, select: { id: true } });
  if (!task) throw new Error("That task is not on this team.");
  await db.plannerTask.delete({ where: { id: task.id } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.task.removed", entityType: "PlannerTask", entityId: task.id });
  refresh(access.team.id);
}

export async function saveCover(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const employeeId = required(formData, "employeeId", 40, "who is away");
  const coverEmployeeId = required(formData, "coverEmployeeId", 40, "who is covering");
  if (employeeId === coverEmployeeId) throw new Error("Someone else needs to cover.");
  onTeam(access, employeeId);
  onTeam(access, coverEmployeeId);
  const range = dateRange(required(formData, "startsOn", 10, "a start date"), text(formData, "endsOn", 10));
  const cover = await db.plannerCover.create({
    data: { organisationId: session.organisationId, teamId: access.team.id, employeeId, coverEmployeeId, ...range, note: text(formData, "note", 240) || null },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.cover.set", entityType: "PlannerCover", entityId: cover.id });
  refresh(access.team.id);
}

export async function removeCover(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const coverId = required(formData, "coverId", 40, "the cover");
  const cover = await db.plannerCover.findFirst({ where: { id: coverId, organisationId: session.organisationId, teamId: access.team.id }, select: { id: true } });
  if (!cover) throw new Error("That cover is not on this team.");
  await db.plannerCover.delete({ where: { id: cover.id } });
  refresh(access.team.id);
}

export async function saveHandover(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  const employeeId = required(formData, "employeeId", 40, "who is handing over");
  onTeam(access, employeeId);
  const mine = access.employee?.id === employeeId;
  if (!access.manage && !mine) throw new Error("You can leave your own handover.");
  const note = required(formData, "note", 500, "what the team should know");
  const range = dateRange(required(formData, "startsOn", 10, "a start date"), text(formData, "endsOn", 10));
  const handover = await db.plannerHandover.create({
    data: { organisationId: session.organisationId, teamId: access.team.id, employeeId, note, ...range },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.handover.written", entityType: "PlannerHandover", entityId: handover.id });
  refresh(access.team.id);
}

export async function savePlace(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  const employeeId = required(formData, "employeeId", 40, "a person");
  onTeam(access, employeeId);
  const mine = access.employee?.id === employeeId;
  if (!access.manage && !mine) throw new Error("You can set where you are.");
  const kind = required(formData, "kind", 12, "where you are");
  if (!["OFFICE", "HOME", "SITE", "TRAVEL"].includes(kind)) throw new Error("Choose office, home, site or travelling.");
  const onDate = civilDate(required(formData, "onDate", 10, "a date"));
  await db.plannerPlace.upsert({
    where: { teamId_employeeId_onDate: { teamId: access.team.id, employeeId, onDate } },
    create: { organisationId: session.organisationId, teamId: access.team.id, employeeId, onDate, kind: kind as "OFFICE" | "HOME" | "SITE" | "TRAVEL", note: text(formData, "note", 120) || null },
    update: { kind: kind as "OFFICE" | "HOME" | "SITE" | "TRAVEL", note: text(formData, "note", 120) || null },
  });
  refresh(access.team.id);
}

export async function saveMoment(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const kind = required(formData, "kind", 12, "what kind of moment");
  if (!["MEETING", "DEADLINE", "AWAY_DAY"].includes(kind)) throw new Error("Choose a meeting, deadline or away day.");
  const moment = await db.plannerMoment.create({
    data: {
      organisationId: session.organisationId,
      teamId: access.team.id,
      title: required(formData, "title", 120, "a name"),
      onDate: civilDate(required(formData, "onDate", 10, "a date")),
      kind: kind as "MEETING" | "DEADLINE" | "AWAY_DAY",
      note: text(formData, "note", 240) || null,
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "teams.moment.added", entityType: "PlannerMoment", entityId: moment.id, after: { title: moment.title } });
  refresh(access.team.id);
}

export async function removeMoment(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.read);
  const access = await requireTeam(session, required(formData, "teamId", 40, "a team"));
  assertLead(access);
  const momentId = required(formData, "momentId", 40, "the moment");
  const moment = await db.plannerMoment.findFirst({ where: { id: momentId, organisationId: session.organisationId, teamId: access.team.id }, select: { id: true } });
  if (!moment) throw new Error("That is not on this team.");
  await db.plannerMoment.delete({ where: { id: moment.id } });
  refresh(access.team.id);
}
