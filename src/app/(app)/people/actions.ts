"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES, PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { ONBOARDING_TASK_TEMPLATE, OFFBOARDING_TASK_TEMPLATE } from "@/modules/people/domain/task-templates";
import { logEmployeeHistory } from "@/modules/people/domain/history";
import { nextAppraisalDate, nextOneToOneDate, cycleLabel } from "@/modules/people/domain/scheduling";

import { boundedNumber, taskDeadline, validateEmployeeTransition } from "@/modules/people/domain/workflows";

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "FIXED_TERM", "CONTRACTOR", "APPRENTICE"];
const EMPLOYEE_STATUSES = ["ONBOARDING", "ACTIVE", "ON_LEAVE", "OFFBOARDING", "LEFT"];

export async function createEmployee(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeManage);
  await assertModuleEnabled(session, "people");

  const firstName = String(form.get("firstName") ?? "").trim();
  const lastName = String(form.get("lastName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const jobTitle = String(form.get("jobTitle") ?? "").trim();
  const department = String(form.get("department") ?? "").trim() || null;
  const employmentType = String(form.get("employmentType") ?? "FULL_TIME");
  const managerId = String(form.get("managerId") ?? "") || null;
  const userId = String(form.get("userId") ?? "") || null;
  const startDate = new Date(String(form.get("startDate") ?? ""));
  const salaryPounds = form.has("annualSalary") && String(form.get("annualSalary")).trim() ? boundedNumber(form.get("annualSalary"), "Annual salary", 0, 20000000) : null;

  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) throw new Error("Enter a first and last name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new Error("Enter an email address.");
  if (!jobTitle || jobTitle.length > 150) throw new Error("Enter a job title.");
  if (!EMPLOYMENT_TYPES.includes(employmentType)) throw new Error("Invalid employment type.");
  if (isNaN(startDate.getTime())) throw new Error("Enter a valid start date.");
  if (managerId) await db.employee.findFirstOrThrow({ where: { id: managerId, organisationId: session.organisationId } });
  if (userId) {
    await db.membership.findFirstOrThrow({ where: { organisationId: session.organisationId, userId } });
    if (await db.employee.findFirst({ where: { organisationId: session.organisationId, userId } })) throw new Error("That login is already linked to an employee record.");
  }
  if (form.has("annualSalary")) assertCapability(session, PAYROLL_CAPABILITIES.employeeManage);
  const skills = String(form.get("skills") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const employee = await db.$transaction(async (tx) => {
  const employee = await tx.employee.create({
    data: {
      organisationId: session.organisationId,
      employeeNumber: `EMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      firstName,
      lastName,
      email,
      jobTitle,
      department,
      employmentType: employmentType as never,
      managerId,
      userId,
      startDate,
      status: "ONBOARDING",
      skills,
      annualSalaryMinorUnits: salaryPounds !== null ? Math.round(salaryPounds * 100) : null,
      annualLeaveDaysEntitlement: boundedNumber(form.get("annualLeaveDaysEntitlement") ?? "25", "Annual leave entitlement", 0, 366, true),
      contractedWeeklyHours: form.get("contractedWeeklyHours") ? boundedNumber(form.get("contractedWeeklyHours"), "Weekly hours", 1, 168) : null,
      preferredName: String(form.get("preferredName") ?? "").trim().slice(0, 100) || null,
      phone: String(form.get("phone") ?? "").trim().slice(0, 50) || null,
      address: String(form.get("address") ?? "").trim().slice(0, 500) || null,
      emergencyContactName: String(form.get("emergencyContactName") ?? "").trim().slice(0, 150) || null,
      emergencyContactPhone: String(form.get("emergencyContactPhone") ?? "").trim().slice(0, 50) || null,
    },
    include: { manager: { select: { userId: true } } },
  });

  await tx.employeeTask.createMany({
    data: ONBOARDING_TASK_TEMPLATE.map((t) => ({
      organisationId: session.organisationId,
      employeeId: employee.id,
      phase: "ONBOARDING" as const,
      title: t.title,
      category: t.category,
      dueDate: taskDeadline(startDate, t.category, "ONBOARDING", t.title),
      assignedToUserId: employee.manager?.userId ?? session.userId,
    })),
  });

  // Auto-schedule the first appraisal and one-to-one, owned by the employee's
  // actual manager when one is linked to a login — otherwise by whoever added
  // the employee, so nothing is ever left unowned.
  const org = await tx.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { hrAppraisalCadenceMonths: true, hrOneToOneCadenceWeeks: true } });
  const ownerUserId = employee.manager?.userId ?? session.userId;
  const firstAppraisalAt = nextAppraisalDate(startDate, employee.appraisalCadenceMonths, org.hrAppraisalCadenceMonths);
  const firstOneToOneAt = nextOneToOneDate(new Date(), employee.oneToOneCadenceWeeks, org.hrOneToOneCadenceWeeks);
  await tx.appraisal.create({
    data: { organisationId: session.organisationId, employeeId: employee.id, reviewerUserId: ownerUserId, cycle: cycleLabel(firstAppraisalAt), scheduledAt: firstAppraisalAt },
  });
  await tx.oneToOne.create({
    data: { organisationId: session.organisationId, employeeId: employee.id, managerUserId: ownerUserId, scheduledAt: firstOneToOneAt },
  });

    return employee;
  });

  await logEmployeeHistory({ organisationId: session.organisationId, employeeId: employee.id, type: "CREATED", description: `Joined as ${jobTitle}${department ? ` in ${department}` : ""}.` });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.created", entityType: "Employee", entityId: employee.id });
  await writeActivity({ organisationId: session.organisationId, type: "employee.created", summary: `${firstName} ${lastName} added as ${jobTitle}`, entityType: "Employee", entityId: employee.id });
  revalidatePath("/people");
  revalidatePath("/people/workspace");
  revalidatePath("/people/onboarding");
  revalidatePath("/people/my-team");
}

export async function changeEmployeeStatus(employeeId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeManage);
  await assertModuleEnabled(session, "people");
  const status = String(form.get("status"));
  if (!EMPLOYEE_STATUSES.includes(status)) throw new Error("Invalid status.");

  const data: { status: typeof EMPLOYEE_STATUSES[number]; endDate?: Date; leaveReason?: string } = { status: status as never };
  if (status === "OFFBOARDING") {
    assertCapability(session, HR_CAPABILITIES.offboardingManage);
    const employee = await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
    const existingTasks = await db.employeeTask.count({ where: { organisationId: session.organisationId, employeeId, phase: "OFFBOARDING" } });
    if (existingTasks === 0) {
      await db.employeeTask.createMany({
        data: OFFBOARDING_TASK_TEMPLATE.map((t) => ({
          organisationId: session.organisationId,
          employeeId: employee.id,
          phase: "OFFBOARDING" as const,
          title: t.title,
          category: t.category,
          dueDate: taskDeadline(new Date(), t.category, "OFFBOARDING", t.title),
          assignedToUserId: session.userId,
        })),
      });
    }
  }
  if (status === "LEFT") {
    assertCapability(session, HR_CAPABILITIES.offboardingManage);
    const leaving = new Date(String(form.get("endDate") ?? ""));
    if (isNaN(leaving.getTime()) || leaving > new Date()) throw new Error("Enter a valid leaving date that is not in the future.");
    data.endDate = leaving;
    data.leaveReason = String(form.get("leaveReason") ?? "").trim().slice(0, 1000);
    if (!data.leaveReason) throw new Error("Enter a leaving reason.");
  }

  const before = await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId }, select: { status: true, startDate: true } });
  if (before.status === "ONBOARDING" && status === "ACTIVE") assertCapability(session, HR_CAPABILITIES.onboardingManage);
  if (data.endDate && data.endDate < before.startDate) throw new Error("Leaving date cannot be before the start date.");
  const openTasks = await db.employeeTask.count({ where: { organisationId: session.organisationId, employeeId, phase: status === "LEFT" ? "OFFBOARDING" : "ONBOARDING", completedAt: null } });
  validateEmployeeTransition(before.status, status, openTasks);
  await db.employee.update({ where: { id: employeeId, organisationId: session.organisationId }, data: data as never });
  if (before.status !== status) {
    await logEmployeeHistory({ organisationId: session.organisationId, employeeId, type: "STATUS_CHANGE", description: `Status changed from ${before.status.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}.` });
  }
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.status.updated", entityType: "Employee", entityId: employeeId, after: { status } });
  revalidatePath("/people");
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/people/offboarding");
}

export async function updateEmployeeProfile(employeeId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeManage);
  await assertModuleEnabled(session, "people");
  const jobTitle = String(form.get("jobTitle") ?? "").trim();
  const department = String(form.get("department") ?? "").trim() || null;
  const managerId = String(form.get("managerId") ?? "") || null;
  const salaryPounds = form.has("annualSalary") && String(form.get("annualSalary")).trim() ? boundedNumber(form.get("annualSalary"), "Annual salary", 0, 20000000) : null;
  const skills = String(form.get("skills") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const appraisalCadenceMonths = form.get("appraisalCadenceMonths") ? boundedNumber(form.get("appraisalCadenceMonths"), "Appraisal cadence", 1, 60, true) : null;
  const oneToOneCadenceWeeks = form.get("oneToOneCadenceWeeks") ? boundedNumber(form.get("oneToOneCadenceWeeks"), "One-to-one cadence", 1, 104, true) : null;
  const contractedWeeklyHours = form.get("contractedWeeklyHours") ? boundedNumber(form.get("contractedWeeklyHours"), "Weekly hours", 1, 168) : null;
  if (!jobTitle || jobTitle.length > 150) throw new Error("Enter a job title.");
  if (managerId === employeeId) throw new Error("An employee cannot manage themself.");
  let ancestorId = managerId;
  const seen = new Set([employeeId]);
  while (ancestorId) {
    if (seen.has(ancestorId)) throw new Error("This manager would create a reporting cycle.");
    seen.add(ancestorId);
    const ancestor = await db.employee.findFirstOrThrow({ where: { id: ancestorId, organisationId: session.organisationId, status: { not: "LEFT" } }, select: { managerId: true } });
    ancestorId = ancestor.managerId;
  }

  if (form.has("annualSalary")) assertCapability(session, PAYROLL_CAPABILITIES.employeeManage);
  const before = await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId }, select: { jobTitle: true, managerId: true, manager: { select: { firstName: true, lastName: true } } } });
  const after = await db.employee.update({
    where: { id: employeeId, organisationId: session.organisationId },
    data: { jobTitle, department, managerId, skills, appraisalCadenceMonths, oneToOneCadenceWeeks, contractedWeeklyHours, ...(form.has("annualSalary") ? { annualSalaryMinorUnits: salaryPounds !== null ? Math.round(salaryPounds * 100) : null } : {}) },
    include: { manager: { select: { firstName: true, lastName: true } } },
  });
  if (before.jobTitle !== jobTitle) {
    await logEmployeeHistory({ organisationId: session.organisationId, employeeId, type: "JOB_TITLE_CHANGE", description: `Job title changed from "${before.jobTitle}" to "${jobTitle}".` });
  }
  if (before.managerId !== managerId) {
    if (managerId) {
      const manager = await db.employee.findFirstOrThrow({ where: { id: managerId, organisationId: session.organisationId }, select: { userId: true } });
      if (manager.userId) await db.$transaction([
        db.appraisal.updateMany({ where: { organisationId: session.organisationId, employeeId, status: "SCHEDULED" }, data: { reviewerUserId: manager.userId } }),
        db.oneToOne.updateMany({ where: { organisationId: session.organisationId, employeeId, status: "SCHEDULED" }, data: { managerUserId: manager.userId } }),
      ]);
    }
    const to = after.manager ? `${after.manager.firstName} ${after.manager.lastName}` : "no manager";
    await logEmployeeHistory({ organisationId: session.organisationId, employeeId, type: "MANAGER_CHANGE", description: `Manager changed to ${to}.` });
  }
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.profile.updated", entityType: "Employee", entityId: employeeId });
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/people/my-team");
}

/** Lets the signed-in employee edit their own contact details on /profile — the
 *  HR record stays authoritative but a person doesn't need HR staff to fix their
 *  own phone number. */
export async function updateOwnEmployeeDetails(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "people");
  const employee = await db.employee.findFirstOrThrow({ where: { organisationId: session.organisationId, userId: session.userId } });
  const phone = String(form.get("phone") ?? "").trim().slice(0, 50) || null;
  const address = String(form.get("address") ?? "").trim().slice(0, 500) || null;
  const emergencyContactName = String(form.get("emergencyContactName") ?? "").trim().slice(0, 150) || null;
  const emergencyContactPhone = String(form.get("emergencyContactPhone") ?? "").trim().slice(0, 50) || null;
  await db.employee.update({ where: { id: employee.id }, data: { phone, address, emergencyContactName, emergencyContactPhone } });
  revalidatePath("/people/me");
  revalidatePath("/profile");
  revalidatePath(`/people/${employee.id}`);
}

export async function addEmployeeDocument(employeeId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeManage);
  await assertModuleEnabled(session, "people");
  const title = String(form.get("title") ?? "").trim();
  const url = String(form.get("url") ?? "").trim() || null;
  if (!title || title.length > 200) throw new Error("Enter a document title.");
  if (url) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new Error("Enter a valid document URL."); }
    if (!["https:", "http:"].includes(parsed.protocol) || url.length > 2000) throw new Error("Use an HTTP or HTTPS document link.");
  }
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
  await db.employeeDocument.create({
    data: { organisationId: session.organisationId, employeeId, title, url, category: String(form.get("category") ?? "").trim() || null, notes: String(form.get("notes") ?? "").trim().slice(0, 1000) || null },
  });
  revalidatePath(`/people/${employeeId}`);
}

/** Links an employee record to an existing login (Membership) so the HR record and
 *  the user's own /profile page show each other — one person, one identity, same
 *  as Customer Master's rule against duplicating identity per module. */
export async function linkEmployeeToUser(employeeId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeManage);
  await assertModuleEnabled(session, "people");
  const userId = String(form.get("userId") ?? "") || null;
  if (userId) {
    await db.membership.findFirstOrThrow({ where: { organisationId: session.organisationId, userId } });
    const existing = await db.employee.findFirst({ where: { organisationId: session.organisationId, userId, id: { not: employeeId } } });
    if (existing) throw new Error("That login is already linked to another employee record.");
  }
  await db.employee.update({ where: { id: employeeId, organisationId: session.organisationId }, data: { userId } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.user_link.updated", entityType: "Employee", entityId: employeeId, after: { userId } });
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/people/me");
  revalidatePath("/profile");
}

export async function completeEmployeeTask(taskId: string) {
  const session = await requireSession();
  if (!can(session, HR_CAPABILITIES.onboardingManage) && !can(session, HR_CAPABILITIES.offboardingManage)) throw new Error("You cannot manage employee tasks.");
  await assertModuleEnabled(session, "people");
  const task = await db.employeeTask.findFirstOrThrow({ where: { id: taskId, organisationId: session.organisationId } });
  assertCapability(session, task.phase === "ONBOARDING" ? HR_CAPABILITIES.onboardingManage : HR_CAPABILITIES.offboardingManage);
  await db.employeeTask.update({ where: { id: taskId, organisationId: session.organisationId, completedAt: null }, data: { completedAt: new Date() } });
  revalidatePath("/people/workspace");
  revalidatePath("/people/onboarding");
  revalidatePath("/people/offboarding");
  revalidatePath(`/people/${task.employeeId}`);
}

export async function addEmployeeTask(employeeId: string, phase: "ONBOARDING" | "OFFBOARDING", form: FormData) {
  const session = await requireSession();
  assertCapability(session, phase === "ONBOARDING" ? HR_CAPABILITIES.onboardingManage : HR_CAPABILITIES.offboardingManage);
  await assertModuleEnabled(session, "people");
  const title = String(form.get("title") ?? "").trim();
  if (!title || title.length > 300) throw new Error("Enter a task title.");
  const due = String(form.get("dueDate") ?? "");
  if (due && isNaN(new Date(due).getTime())) throw new Error("Enter a valid task deadline.");
  const assignedToUserId = String(form.get("assignedToUserId") ?? "") || session.userId;
  await db.membership.findFirstOrThrow({ where: { organisationId: session.organisationId, userId: assignedToUserId } });
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
  await db.employeeTask.create({
    data: { organisationId: session.organisationId, employeeId, phase, title, category: String(form.get("category") ?? "").trim() || null, dueDate: due ? new Date(due) : null, assignedToUserId, notes: String(form.get("notes") ?? "").trim().slice(0, 2000) || null },
  });
  revalidatePath("/people/workspace");
  revalidatePath("/people/onboarding");
  revalidatePath("/people/offboarding");
  revalidatePath(`/people/${employeeId}`);
}

export async function updateEmployeeContact(employeeId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeManage);
  await assertModuleEnabled(session, "people");
  const firstName = String(form.get("firstName") ?? "").trim();
  const lastName = String(form.get("lastName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) throw new Error("Enter a first and last name, up to 100 characters each.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new Error("Enter a valid email address.");
  await db.employee.update({ where: { id: employeeId, organisationId: session.organisationId }, data: {
    firstName, lastName, email,
    preferredName: String(form.get("preferredName") ?? "").trim().slice(0, 100) || null,
    phone: String(form.get("phone") ?? "").trim().slice(0, 50) || null,
    address: String(form.get("address") ?? "").trim().slice(0, 500) || null,
    emergencyContactName: String(form.get("emergencyContactName") ?? "").trim().slice(0, 150) || null,
    emergencyContactPhone: String(form.get("emergencyContactPhone") ?? "").trim().slice(0, 50) || null,
    annualLeaveDaysEntitlement: boundedNumber(form.get("annualLeaveDaysEntitlement"), "Leave entitlement", 0, 366, true),
  } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.contact.updated", entityType: "Employee", entityId: employeeId });
  revalidatePath("/people");
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/people/me");
  revalidatePath("/profile");
}

export async function updateEmployeeTask(taskId: string, form: FormData) {
  const session = await requireSession();
  if (!can(session, HR_CAPABILITIES.onboardingManage) && !can(session, HR_CAPABILITIES.offboardingManage)) throw new Error("You cannot manage employee tasks.");
  await assertModuleEnabled(session, "people");
  const task = await db.employeeTask.findFirstOrThrow({ where: { id: taskId, organisationId: session.organisationId } });
  assertCapability(session, task.phase === "ONBOARDING" ? HR_CAPABILITIES.onboardingManage : HR_CAPABILITIES.offboardingManage);
  const due = String(form.get("dueDate") ?? "");
  if (due && isNaN(new Date(due).getTime())) throw new Error("Enter a valid deadline.");
  const assignedToUserId = String(form.get("assignedToUserId") ?? "") || null;
  if (assignedToUserId) await db.membership.findFirstOrThrow({ where: { organisationId: session.organisationId, userId: assignedToUserId } });
  await db.employeeTask.update({ where: { id: taskId, organisationId: session.organisationId }, data: { dueDate: due ? new Date(due) : null, assignedToUserId, notes: String(form.get("notes") ?? "").trim().slice(0, 2000) || null } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.task.updated", entityType: "EmployeeTask", entityId: taskId });
  revalidatePath(`/people/${task.employeeId}`);
  revalidatePath("/people/workspace");
  revalidatePath("/people/workspace");
  revalidatePath("/people/onboarding");
  revalidatePath("/people/offboarding");
}
