"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { ONBOARDING_TASK_TEMPLATE, OFFBOARDING_TASK_TEMPLATE } from "@/modules/people/domain/task-templates";

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
  const salaryPounds = Number(form.get("annualSalary") ?? 0);

  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) throw new Error("Enter a first and last name.");
  if (!email || email.length > 200) throw new Error("Enter an email address.");
  if (!jobTitle || jobTitle.length > 150) throw new Error("Enter a job title.");
  if (!EMPLOYMENT_TYPES.includes(employmentType)) throw new Error("Invalid employment type.");
  if (isNaN(startDate.getTime())) throw new Error("Enter a valid start date.");
  if (managerId) await db.employee.findFirstOrThrow({ where: { id: managerId, organisationId: session.organisationId } });
  if (userId) {
    await db.membership.findFirstOrThrow({ where: { organisationId: session.organisationId, userId } });
    if (await db.employee.findFirst({ where: { organisationId: session.organisationId, userId } })) throw new Error("That login is already linked to an employee record.");
  }

  const employee = await db.employee.create({
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
      annualSalaryMinorUnits: salaryPounds > 0 ? Math.round(salaryPounds * 100) : null,
      annualLeaveDaysEntitlement: Number(form.get("annualLeaveDaysEntitlement") ?? 25) || 25,
    },
  });

  await db.employeeTask.createMany({
    data: ONBOARDING_TASK_TEMPLATE.map((t) => ({
      organisationId: session.organisationId,
      employeeId: employee.id,
      phase: "ONBOARDING" as const,
      title: t.title,
      category: t.category,
    })),
  });

  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.created", entityType: "Employee", entityId: employee.id });
  await writeActivity({ organisationId: session.organisationId, type: "employee.created", summary: `${firstName} ${lastName} added as ${jobTitle}`, entityType: "Employee", entityId: employee.id });
  revalidatePath("/people");
  revalidatePath("/people/onboarding");
}

export async function changeEmployeeStatus(employeeId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeManage);
  await assertModuleEnabled(session, "people");
  const status = String(form.get("status"));
  if (!EMPLOYEE_STATUSES.includes(status)) throw new Error("Invalid status.");

  const data: { status: typeof EMPLOYEE_STATUSES[number]; endDate?: Date; leaveReason?: string } = { status: status as never };
  if (status === "OFFBOARDING") {
    const employee = await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
    const existingTasks = await db.employeeTask.count({ where: { employeeId, phase: "OFFBOARDING" } });
    if (existingTasks === 0) {
      await db.employeeTask.createMany({
        data: OFFBOARDING_TASK_TEMPLATE.map((t) => ({
          organisationId: session.organisationId,
          employeeId: employee.id,
          phase: "OFFBOARDING" as const,
          title: t.title,
          category: t.category,
        })),
      });
    }
  }
  if (status === "LEFT") data.endDate = new Date();

  await db.employee.update({ where: { id: employeeId, organisationId: session.organisationId }, data: data as never });
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
  const salaryPounds = Number(form.get("annualSalary") ?? 0);
  if (!jobTitle || jobTitle.length > 150) throw new Error("Enter a job title.");
  if (managerId === employeeId) throw new Error("An employee cannot manage themself.");
  if (managerId) await db.employee.findFirstOrThrow({ where: { id: managerId, organisationId: session.organisationId } });

  await db.employee.update({
    where: { id: employeeId, organisationId: session.organisationId },
    data: { jobTitle, department, managerId, annualSalaryMinorUnits: salaryPounds > 0 ? Math.round(salaryPounds * 100) : null },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "employee.profile.updated", entityType: "Employee", entityId: employeeId });
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
  revalidatePath("/profile");
}

export async function completeEmployeeTask(taskId: string) {
  const session = await requireSession();
  await assertModuleEnabled(session, "people");
  const task = await db.employeeTask.findFirstOrThrow({ where: { id: taskId, organisationId: session.organisationId } });
  assertCapability(session, task.phase === "ONBOARDING" ? HR_CAPABILITIES.onboardingManage : HR_CAPABILITIES.offboardingManage);
  await db.employeeTask.update({ where: { id: taskId }, data: { completedAt: new Date() } });
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
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
  await db.employeeTask.create({
    data: { organisationId: session.organisationId, employeeId, phase, title, category: String(form.get("category") ?? "").trim() || null, dueDate: due ? new Date(due) : null },
  });
  revalidatePath("/people/onboarding");
  revalidatePath("/people/offboarding");
  revalidatePath(`/people/${employeeId}`);
}
