"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { requireTeamEmployee, teamScope, canManageTeams } from "@/modules/people/services/team-access";
import { writeAudit } from "@/core/audit/log";
import { revalidatePath } from "next/cache";

export async function getMyHR() {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "people");
  return db.employee.findFirst({ where: { organisationId: session.organisationId, userId: session.userId }, select: {
    id: true, firstName: true, lastName: true, jobTitle: true, department: true, status: true, workingDays: true,
    annualLeaveDaysEntitlement: true, contractedWeeklyHours: true, skills: true,
    expenseClaims: { select: { id: true, category: true, amountMinorUnits: true, currency: true, status: true }, orderBy: { createdAt: "desc" }, take: 5 },
    phone: true, address: true, emergencyContactName: true, emergencyContactPhone: true,
    manager: { select: { firstName: true, lastName: true } },
    absences: { select: { id: true, type: true, status: true, startDate: true, endDate: true, bookedDays: true, rejectionReason: true }, orderBy: { startDate: "desc" } },
    shifts: { where: { status: "CONFIRMED", startsAt: { gte: new Date() } }, select: { id: true, startsAt: true, endsAt: true, role: true, location: true, breakMinutes: true, notes: true, tasks: { select: { id: true, title: true, completedAt: true } } }, orderBy: { startsAt: "asc" }, take: 30 },
  } });
}
export async function getMyTeam() {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "people");
  if (!canManageTeams(session)) throw new Error("FORBIDDEN: team management is not granted.");
  return db.employee.findMany({ where: { ...await teamScope(session), status: { not: "LEFT" } }, select: {
    id: true, firstName: true, lastName: true, jobTitle: true, department: true, status: true, contractedWeeklyHours: true, workingDays: true, annualLeaveDaysEntitlement: true,
    shifts: { where: { status: "CONFIRMED", endsAt: { gte: new Date() } }, select: { startsAt: true, endsAt: true }, take: 500 },
    absences: { where: { status: "PENDING" }, select: { id: true, startDate: true, endDate: true, bookedDays: true, reason: true }, orderBy: { startDate: "asc" } },
    expenseClaims: { where: { status: "PENDING" }, select: { id: true, category: true, amountMinorUnits: true, currency: true } },
    timesheets: { where: { status: "SUBMITTED" }, select: { id: true, weekStart: true, entries: { select: { minutes: true } } } },
    appraisals: { where: { status: "SCHEDULED" }, select: { scheduledAt: true, cycle: true }, orderBy: { scheduledAt: "asc" }, take: 1 },
    oneToOnes: { where: { status: "SCHEDULED" }, select: { scheduledAt: true }, orderBy: { scheduledAt: "asc" }, take: 1 },
  }, orderBy: { lastName: "asc" } });
}
export async function getTeamEmployee(employeeId: string) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "people");
  await requireTeamEmployee(session, employeeId);
  return db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId }, select: {
    id: true, firstName: true, lastName: true, jobTitle: true, department: true, status: true, workingDays: true, contractedWeeklyHours: true,
    privateNotes: { where: can(session, HR.employeeManage) ? {} : { audience: "MANAGER_HR" }, select: { id: true, body: true, audience: true, authorUserId: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 },
  } });
}
export async function addPrivateNote(employeeId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "people");
  await requireTeamEmployee(session, employeeId);
  const body = String(form.get("body") ?? "").trim();
  const audience = String(form.get("audience") ?? "MANAGER_HR");
  if (!body || body.length > 10000) throw new Error("Enter a note of up to 10,000 characters.");
  if (!["MANAGER_HR", "HR_ONLY"].includes(audience) || audience === "HR_ONLY" && !can(session, HR.employeeManage)) throw new Error("FORBIDDEN: HR-only notes require HR management access.");
  const note = await db.employeeNote.create({ data: { organisationId: session.organisationId, employeeId, authorUserId: session.userId, body, audience } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.private_note.added", entityType: "EmployeeNote", entityId: note.id, after: { audience } });
  revalidatePath(`/people/my-team/${employeeId}`);
}
export async function updateWorkingPattern(employeeId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR.employeeManage);
  await assertModuleEnabled(session, "people");
  const workingDays = [...new Set(form.getAll("workingDays").map(Number))];
  if (!workingDays.length || workingDays.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error("Choose at least one valid working day.");
  await db.employee.update({ where: { id: employeeId, organisationId: session.organisationId }, data: { workingDays } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.working_pattern.updated", entityType: "Employee", entityId: employeeId, after: { workingDays } });
  revalidatePath(`/people/my-team/${employeeId}`);
  revalidatePath("/people/me");
}
