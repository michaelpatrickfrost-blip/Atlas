"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { requireTeamEmployee, canManageTeams, teamScope } from "@/modules/people/services/team-access";
import { dateOnly, mondayOf, addDays, hoursToMinutes } from "@/modules/people/domain/working-time";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";

export async function getTimesheetContext(week: string, requestedEmployee?: string) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "people");
  const weekStart = mondayOf(dateOnly(week));
  const employees = await db.employee.findMany({ where: { organisationId: session.organisationId, OR: [{ userId: session.userId }, ...(canManageTeams(session) ? [await teamScope(session, true)] : [])] }, select: { id: true, firstName: true, lastName: true, userId: true }, orderBy: { lastName: "asc" } });
  const selected = requestedEmployee ? employees.find(e => e.id === requestedEmployee) : employees.find(e => e.userId === session.userId) ?? employees[0];
  if (requestedEmployee && !selected) throw new Error("FORBIDDEN: this timesheet is outside your scope.");
  const sheet = selected ? await db.timesheet.findFirst({ where: { organisationId: session.organisationId, employeeId: selected.id, weekStart }, include: { entries: { orderBy: { workedOn: "asc" } } } }) : null;
  const pending = canManageTeams(session) ? await db.timesheet.findMany({ where: { organisationId: session.organisationId, status: "SUBMITTED", employee: { AND:[await teamScope(session, true),{ OR: [{ userId: null }, { userId: { not: session.userId } }] }] } }, include: { employee: { select: { firstName: true, lastName: true } }, entries: true }, orderBy: { weekStart: "asc" }, take: 100 }) : [];
  return { employees, selected, sheet, pending, weekStart };
}
export async function saveTimesheet(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "people");
  const employeeId = String(form.get("employeeId") ?? "");
  const employee = await requireTeamEmployee(session, employeeId, true);
  if (employee.status === "LEFT") throw new Error("Timesheets cannot be entered for a departed employee.");
  const weekStart = mondayOf(dateOnly(String(form.get("weekStart") ?? "")));
  const submit = form.get("intent") === "submit";
  const entries = Array.from({ length: 7 }, (_, i) => ({ workedOn: addDays(weekStart,i), minutes: hoursToMinutes(String(form.get(`hours_${i}`) ?? "0")), description: String(form.get(`description_${i}`) ?? "").trim().slice(0,1000) || null })).filter(e => e.minutes > 0);
  const today = dateOnly(new Date().toISOString().slice(0,10));
  if (entries.some(e => e.workedOn > today)) throw new Error("Actual hours cannot be recorded for a future day. Plan future work in the people planner.");
  if (submit && !entries.length) throw new Error("Enter hours before submitting a timesheet.");
  if (weekStart > mondayOf(new Date())) throw new Error("Actual hours cannot be entered for a future week.");
  await db.$transaction(async tx => {
    const existing = await tx.timesheet.findFirst({ where: { organisationId: session.organisationId, employeeId, weekStart } });
    if (existing && !["DRAFT", "REJECTED"].includes(existing.status)) throw new Error("Submitted or approved timesheets are locked. Ask the reviewer to return a submitted sheet.");
    const sheet = existing ? await tx.timesheet.update({ where: { id: existing.id, organisationId: session.organisationId, status: { in: ["DRAFT", "REJECTED"] } }, data: { status: submit ? "SUBMITTED" : "DRAFT", submittedAt: submit ? new Date() : null, submittedByUserId: submit ? session.userId : null, reviewedAt: null, reviewedByUserId: null, reviewNote: null } }) : await tx.timesheet.create({ data: { organisationId: session.organisationId, employeeId, weekStart, status: submit ? "SUBMITTED" : "DRAFT", submittedAt: submit ? new Date() : null, submittedByUserId: submit ? session.userId : null } });
    await tx.timesheetEntry.deleteMany({ where: { timesheetId: sheet.id, organisationId: session.organisationId } });
    await tx.timesheetEntry.createMany({ data: entries.map(e => ({ ...e, organisationId: session.organisationId, timesheetId: sheet.id })) });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: submit ? "timesheet.submitted" : "timesheet.saved", entityType: "Timesheet", entityId: sheet.id } });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/people/timesheets"); revalidatePath("/people/my-team");
}
export async function reviewTimesheet(id: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "people");
  const sheet = await db.timesheet.findFirstOrThrow({ where: { id, organisationId: session.organisationId, status: "SUBMITTED" } });
  await requireTeamEmployee(session, sheet.employeeId);
  const decision = String(form.get("decision"));
  const reviewNote = String(form.get("reviewNote") ?? "").trim().slice(0,2000) || null;
  if (!["APPROVED", "REJECTED"].includes(decision)) throw new Error("Choose approve or return for correction.");
  if (decision === "REJECTED" && !reviewNote) throw new Error("Explain which hours need correcting.");
  await db.timesheet.update({ where: { id, organisationId: session.organisationId, status: "SUBMITTED" }, data: { status: decision, reviewNote, reviewedAt: new Date(), reviewedByUserId: session.userId } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: `timesheet.${decision.toLowerCase()}`, entityType: "Timesheet", entityId: id });
  revalidatePath("/people/timesheets"); revalidatePath("/people/my-team");
}
