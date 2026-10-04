"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";

import { requireTeamEmployee, canManageTeams } from "@/modules/people/services/team-access";
import { dateOnly, workingLeaveDays } from "@/modules/people/domain/working-time";
import { allowanceDays, leaveDayCount } from "@/modules/people/domain/leave-balance";
import { canRequestOwnHoliday } from "@/core/permissions/hr-access";
import { assertHolidayAllowed } from "@/modules/scheduling/services/planner";

const ABSENCE_TYPES = ["SICKNESS", "HOLIDAY", "UNPAID", "COMPASSIONATE", "MATERNITY_PATERNITY", "OTHER"];

export async function logAbsence(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.absenceManage);
  await assertModuleEnabled(session, "people");
  const employeeId = String(form.get("employeeId") ?? "");
  const type = String(form.get("type") ?? "");
  const startDate = new Date(String(form.get("startDate") ?? ""));
  const endDate = new Date(String(form.get("endDate") ?? ""));
  if (!ABSENCE_TYPES.includes(type)) throw new Error("Invalid absence type.");
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) throw new Error("Enter a valid date range.");
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
  if (type === "HOLIDAY") await assertHolidayAllowed(session.organisationId, employeeId, startDate, endDate);

  const record = await db.absenceRecord.create({
    data: {
      organisationId: session.organisationId,
      employeeId,
      type: type as never,
      startDate,
      endDate,
      reason: String(form.get("reason") ?? "").slice(0, 1000) || null,
      certifiedByDoctor: form.get("certifiedByDoctor") === "on",
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "absence.logged", entityType: "AbsenceRecord", entityId: record.id, after: { type, startDate, endDate } });
  revalidatePath("/people/absence");
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/scheduling");
  revalidatePath("/profile");
}

/** Self-service holiday request — any employee with a linked login can request
 *  their own leave; it starts PENDING and needs their manager (or anyone with
 *  absenceManage) to approve it before it counts against their balance. */
export async function requestLeave(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  if (!canRequestOwnHoliday(session)) throw new Error("Holiday requests are not enabled for your access.");
  await assertModuleEnabled(session, "people");
  const startDate = dateOnly(String(form.get("startDate") ?? ""));
  const endDate = dateOnly(String(form.get("endDate") ?? ""));
  if (startDate < dateOnly(new Date().toISOString().slice(0,10))) throw new Error("Holiday requests must start today or later.");
  if (startDate.getUTCFullYear() !== endDate.getUTCFullYear()) throw new Error("Split requests across leave years so each balance is checked.");
  const employeeId = await db.$transaction(async tx => {
    const employee = await tx.employee.findFirstOrThrow({ where: { organisationId: session.organisationId, userId: session.userId, status: { in: ["ACTIVE", "ONBOARDING", "ON_LEAVE"] } } });
    const bookedDays = workingLeaveDays(startDate, endDate, employee.workingDays);
    if (!bookedDays) throw new Error("This request contains no contracted working days.");
    const overlap = await tx.absenceRecord.count({ where: { organisationId: session.organisationId, employeeId: employee.id, status: { in: ["PENDING", "APPROVED"] }, startDate: { lte: endDate }, endDate: { gte: startDate } } });
    if (overlap) throw new Error("You already have absence booked or requested during these dates.");
    const year = startDate.getUTCFullYear();
    const holidays = await tx.absenceRecord.findMany({ where: { organisationId: session.organisationId, employeeId: employee.id, type: "HOLIDAY", status: { in: ["APPROVED", "PENDING"] }, startDate: { gte: new Date(Date.UTC(year,0,1)), lt: new Date(Date.UTC(year+1,0,1)) } } });
    const reserved = holidays.reduce((sum, a) => sum + (a.bookedDays ?? workingLeaveDays(a.startDate, a.endDate, employee.workingDays)),0);
    if (reserved + bookedDays > employee.annualLeaveDaysEntitlement) throw new Error("This request exceeds your remaining entitlement, including pending requests.");
    await assertHolidayAllowed(session.organisationId, employee.id, startDate, endDate, tx as never);
    const record = await tx.absenceRecord.create({ data: { organisationId: session.organisationId, employeeId: employee.id, type: "HOLIDAY", startDate, endDate, bookedDays, status: "PENDING", reason: String(form.get("reason") ?? "").trim().slice(0,1000) || null } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "leave_request.submitted", entityType: "AbsenceRecord", entityId: record.id } });
    return employee.id;
  }, { isolationLevel: "Serializable" });
  revalidatePath("/people/me"); revalidatePath("/people/my-team"); revalidatePath("/people/absence"); revalidatePath("/people/holidays"); revalidatePath("/profile"); revalidatePath(`/people/${employeeId}`); revalidatePath("/scheduling");
}

export async function cancelOwnLeave(recordId: string) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  if (!canRequestOwnHoliday(session)) throw new Error("Holiday requests are not enabled for your access.");
  await assertModuleEnabled(session, "people");
  await db.absenceRecord.update({ where: { id: recordId, organisationId: session.organisationId, type: "HOLIDAY", status: { in: ["PENDING", "APPROVED"] }, startDate: { gte: dateOnly(new Date().toISOString().slice(0,10)) }, employee: { userId: session.userId } }, data: { status: "CANCELLED" } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "leave_request.cancelled", entityType: "AbsenceRecord", entityId: recordId });
  revalidatePath("/people/me"); revalidatePath("/people/my-team"); revalidatePath("/people/absence"); revalidatePath("/profile"); revalidatePath("/scheduling");
}

export async function approveLeaveRequest(recordId: string, form?: FormData) {
  const session = await requireSession();
  if (!can(session, HR_CAPABILITIES.absenceManage) && !canManageTeams(session)) throw new Error("FORBIDDEN: leave approval is not granted.");
  await assertModuleEnabled(session, "people");
  const pending = await db.absenceRecord.findFirstOrThrow({ where: { id: recordId, organisationId: session.organisationId, status: "PENDING" }, select: { employeeId: true, type: true, startDate: true, endDate: true, bookedDays: true, employee: { select: { userId: true, workingDays: true, annualLeaveDaysEntitlement: true } } } });
  if (pending.employee.userId === session.userId) throw new Error("You cannot decide your own leave request.");
  if (!can(session, HR_CAPABILITIES.absenceManage)) await requireTeamEmployee(session, pending.employeeId);
  if (pending.type === "HOLIDAY") await assertHolidayAllowed(session.organisationId, pending.employeeId, pending.startDate, pending.endDate);
  const edited = String(form?.get("bookedDays") ?? "").trim();
  const bookedDays = edited ? leaveDayCount(edited) : pending.bookedDays ?? workingLeaveDays(pending.startDate, pending.endDate, pending.employee.workingDays);
  if (pending.type === "HOLIDAY") {
    const year = pending.startDate.getUTCFullYear();
    const others = await db.absenceRecord.findMany({ where: { organisationId: session.organisationId, employeeId: pending.employeeId, id: { not: recordId }, type: "HOLIDAY", status: { in: ["APPROVED", "PENDING"] }, startDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } }, select: { bookedDays: true, startDate: true, endDate: true } });
    const reserved = others.reduce((sum, row) => sum + (row.bookedDays ?? workingLeaveDays(row.startDate, row.endDate, pending.employee.workingDays)), 0);
    if (reserved + bookedDays > pending.employee.annualLeaveDaysEntitlement) throw new Error(`That is ${bookedDays} days. ${pending.employee.annualLeaveDaysEntitlement - reserved} are left on their allowance.`);
  }
  const record = await db.absenceRecord.update({
    where: { id: recordId, organisationId: session.organisationId, status: "PENDING" },
    data: { status: "APPROVED", approverUserId: session.userId, approvedAt: new Date(), bookedDays },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "leave_request.approved", entityType: "AbsenceRecord", entityId: recordId });
  revalidatePath("/people/absence");
  revalidatePath("/people/my-team");
  revalidatePath("/people/me");
  revalidatePath("/profile");
  revalidatePath("/people/workspace");
  revalidatePath(`/people/${record.employeeId}`);
  revalidatePath("/scheduling");
  revalidatePath("/people/holidays");
}

export async function setLeaveAllowance(employeeId: string, form: FormData) {
  const session = await requireSession();
  if (!can(session, HR_CAPABILITIES.employeeManage) && !can(session, HR_CAPABILITIES.absenceManage)) throw new Error("FORBIDDEN: holiday allowances are changed in HR.");
  await assertModuleEnabled(session, "people");
  const days = allowanceDays(String(form.get("days") ?? ""));
  await db.employee.update({ where: { id: employeeId, organisationId: session.organisationId }, data: { annualLeaveDaysEntitlement: days } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.leave_allowance.updated", entityType: "Employee", entityId: employeeId, after: { days } });
  revalidatePath("/people/holidays");
  revalidatePath("/people/absence");
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/profile");
  revalidatePath("/people/me");
}

export async function rejectLeaveRequest(recordId: string, form: FormData) {
  const session = await requireSession();
  if (!can(session, HR_CAPABILITIES.absenceManage) && !canManageTeams(session)) throw new Error("FORBIDDEN: leave approval is not granted.");
  await assertModuleEnabled(session, "people");
  const reason = String(form.get("rejectionReason") ?? "").trim().slice(0, 500);
  if (!reason) throw new Error("Enter a reason so the employee understands the decision.");
  const pending = await db.absenceRecord.findFirstOrThrow({ where: { id: recordId, organisationId: session.organisationId, status: "PENDING" }, select: { employeeId: true, employee: { select: { userId: true } } } });
  if (pending.employee.userId === session.userId) throw new Error("You cannot decide your own leave request.");
  if (!can(session, HR_CAPABILITIES.absenceManage)) await requireTeamEmployee(session, pending.employeeId);
  const record = await db.absenceRecord.update({
    where: { id: recordId, organisationId: session.organisationId, status: "PENDING" },
    data: { status: "REJECTED", approverUserId: session.userId, approvedAt: new Date(), rejectionReason: reason },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "leave_request.rejected", entityType: "AbsenceRecord", entityId: recordId });
  revalidatePath("/people/absence");
  revalidatePath("/people/my-team");
  revalidatePath("/people/me");
  revalidatePath("/profile");
  revalidatePath("/people/workspace");
  revalidatePath(`/people/${record.employeeId}`);
  revalidatePath("/people/holidays");
}
