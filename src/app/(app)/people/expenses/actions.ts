"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { requireTeamEmployee, canManageTeams } from "@/modules/people/services/team-access";
import { writeAudit } from "@/core/audit/log";

/** Any employee with a linked Atlas login can submit their own claim — no
 *  special capability needed, same self-service pattern as updateOwnEmployeeDetails.
 *  HR staff (employeeManage) can also submit on behalf of someone else. */
export async function submitExpenseClaim(form: FormData) {
  const session = await requireSession();
  await assertModuleEnabled(session, "people");
  const onBehalfOfEmployeeId = String(form.get("employeeId") ?? "") || null;
  const manage = can(session, HR_CAPABILITIES.employeeManage);

  const employee = onBehalfOfEmployeeId && manage
    ? await db.employee.findFirstOrThrow({ where: { id: onBehalfOfEmployeeId, organisationId: session.organisationId } })
    : await db.employee.findFirstOrThrow({ where: { organisationId: session.organisationId, userId: session.userId } });

  const category = String(form.get("category") ?? "").trim();
  const amountPounds = Number(form.get("amount") ?? 0);
  const incurredOn = new Date(String(form.get("incurredOn") ?? ""));
  if (!category || category.length > 100) throw new Error("Enter a category, e.g. Travel.");
  if (!(amountPounds > 0)) throw new Error("Enter an amount greater than zero.");
  if (isNaN(incurredOn.getTime())) throw new Error("Enter a valid date.");

  const claim = await db.expenseClaim.create({
    data: {
      organisationId: session.organisationId,
      employeeId: employee.id,
      category,
      description: String(form.get("description") ?? "").trim().slice(0, 1000) || null,
      amountMinorUnits: Math.round(amountPounds * 100),
      currency: employee.currency,
      incurredOn,
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "expense_claim.submitted", entityType: "ExpenseClaim", entityId: claim.id });
  revalidatePath("/people/expenses");
  revalidatePath("/people/my-team");
  revalidatePath("/profile");
  revalidatePath(`/people/${employee.id}`);
}

export async function approveExpenseClaim(claimId: string) {
  const session = await requireSession();
  if (!can(session, HR_CAPABILITIES.expenseApprove) && !canManageTeams(session)) throw new Error("FORBIDDEN: expense approval is not granted.");
  await assertModuleEnabled(session, "people");
  const pending = await db.expenseClaim.findFirstOrThrow({ where: { id: claimId, organisationId: session.organisationId, status: "PENDING" }, select: { employeeId: true, employee: { select: { userId: true } } } });
  if (pending.employee.userId === session.userId) throw new Error("You cannot decide your own expense claim.");
  if (!can(session, HR_CAPABILITIES.expenseApprove)) await requireTeamEmployee(session, pending.employeeId);
  const claim = await db.expenseClaim.update({
    where: { id: claimId, organisationId: session.organisationId, status: "PENDING" },
    data: { status: "APPROVED", approverUserId: session.userId, approvedAt: new Date() },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "expense_claim.approved", entityType: "ExpenseClaim", entityId: claimId });
  revalidatePath("/people/expenses");
  revalidatePath("/people/my-team");
  revalidatePath(`/people/${claim.employeeId}`);
}

export async function rejectExpenseClaim(claimId: string, form: FormData) {
  const session = await requireSession();
  if (!can(session, HR_CAPABILITIES.expenseApprove) && !canManageTeams(session)) throw new Error("FORBIDDEN: expense approval is not granted.");
  await assertModuleEnabled(session, "people");
  const pending = await db.expenseClaim.findFirstOrThrow({ where: { id: claimId, organisationId: session.organisationId, status: "PENDING" }, select: { employeeId: true, employee: { select: { userId: true } } } });
  if (pending.employee.userId === session.userId) throw new Error("You cannot decide your own expense claim.");
  if (!can(session, HR_CAPABILITIES.expenseApprove)) await requireTeamEmployee(session, pending.employeeId);
  const claim = await db.expenseClaim.update({
    where: { id: claimId, organisationId: session.organisationId, status: "PENDING" },
    data: { status: "REJECTED", approverUserId: session.userId, approvedAt: new Date(), rejectionReason: String(form.get("rejectionReason") ?? "").trim().slice(0, 500) || null },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "expense_claim.rejected", entityType: "ExpenseClaim", entityId: claimId });
  revalidatePath("/people/expenses");
  revalidatePath("/people/my-team");
  revalidatePath(`/people/${claim.employeeId}`);
}
