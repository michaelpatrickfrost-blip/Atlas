"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";

/** Gross pay for one period = annual salary / 12, for employees paid monthly.
 *  This is a simple, transparent calculation — not a statutory tax/NI engine.
 *  Deductions (tax, NI, pension, etc.) are entered per payslip before finalising. */
function monthlyGross(annualSalaryMinorUnits: number | null): number {
  return annualSalaryMinorUnits ? Math.round(annualSalaryMinorUnits / 12) : 0;
}

export async function createPayrollRun(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.payrollManage);
  await assertModuleEnabled(session, "people");
  const periodLabel = String(form.get("periodLabel") ?? "").trim();
  const periodStart = new Date(String(form.get("periodStart") ?? ""));
  const periodEnd = new Date(String(form.get("periodEnd") ?? ""));
  if (!periodLabel || periodLabel.length > 100) throw new Error("Enter a period label, e.g. 'October 2026'.");
  if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) || periodEnd < periodStart) throw new Error("Enter a valid period.");

  const employees = await db.employee.findMany({ where: { organisationId: session.organisationId, status: { in: ["ACTIVE", "ON_LEAVE", "OFFBOARDING"] } } });

  const run = await db.payrollRun.create({
    data: {
      organisationId: session.organisationId,
      periodLabel,
      periodStart,
      periodEnd,
      payslips: {
        create: employees.map((e) => ({
          organisationId: session.organisationId,
          employeeId: e.id,
          grossMinorUnits: monthlyGross(e.annualSalaryMinorUnits),
          deductionsMinorUnits: 0,
          netMinorUnits: monthlyGross(e.annualSalaryMinorUnits),
          currency: e.currency,
        })),
      },
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_run.created", entityType: "PayrollRun", entityId: run.id });
  revalidatePath("/people/payroll");
}

export async function updatePayslipDeductions(payslipId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.payrollManage);
  await assertModuleEnabled(session, "people");
  const deductionsPounds = Number(form.get("deductions") ?? 0);
  if (deductionsPounds < 0) throw new Error("Deductions cannot be negative.");
  const payslip = await db.payslip.findFirstOrThrow({ where: { id: payslipId, organisationId: session.organisationId }, include: { payrollRun: true } });
  if (payslip.payrollRun.status !== "DRAFT") throw new Error("This payroll run is already finalised.");
  const deductionsMinorUnits = Math.round(deductionsPounds * 100);
  await db.payslip.update({
    where: { id: payslipId },
    data: { deductionsMinorUnits, netMinorUnits: payslip.grossMinorUnits - deductionsMinorUnits, notes: String(form.get("notes") ?? "").slice(0, 1000) || null },
  });
  revalidatePath(`/people/payroll/${payslip.payrollRunId}`);
}

export async function finalisePayrollRun(runId: string) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.payrollManage);
  await assertModuleEnabled(session, "people");
  await db.payrollRun.update({ where: { id: runId, organisationId: session.organisationId }, data: { status: "FINALISED", finalisedAt: new Date() } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_run.finalised", entityType: "PayrollRun", entityId: runId });
  revalidatePath(`/people/payroll/${runId}`);
  revalidatePath("/people/payroll");
}

export async function markPayrollRunPaid(runId: string) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.payrollManage);
  await assertModuleEnabled(session, "people");
  await db.payrollRun.update({ where: { id: runId, organisationId: session.organisationId }, data: { status: "PAID", paidAt: new Date() } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_run.paid", entityType: "PayrollRun", entityId: runId });
  revalidatePath(`/people/payroll/${runId}`);
  revalidatePath("/people/payroll");
}
