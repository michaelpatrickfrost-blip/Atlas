"use server";
import { requireSession } from "@/core/auth/session";
import { assertModuleEnabled } from "@/core/modules/access";
import { revalidatePath } from "next/cache";
import * as commands from "@/modules/payroll/services/commands";

export async function createPayrollRun(form: FormData) {
  const session = await requireSession();
  await assertModuleEnabled(session, "payroll");
  await commands.createPayrollRun(session, form);
  revalidatePath("/payroll");
}

export async function updatePayslipDeductions(payslipId: string, form: FormData) {
  const session = await requireSession();
  await assertModuleEnabled(session, "payroll");
  const payslip = await commands.updatePayslipDeductions(session, payslipId, form);
  revalidatePath("/payroll");
  return payslip;
}

export async function finalisePayrollRun(runId: string) {
  const session = await requireSession();
  await assertModuleEnabled(session, "payroll");
  await commands.finalisePayrollRun(session, runId);
  revalidatePath(`/payroll/${runId}`);
  revalidatePath("/payroll");
}

export async function markPayrollRunPaid(runId: string) {
  const session = await requireSession();
  await assertModuleEnabled(session, "payroll");
  await commands.markPayrollRunPaid(session, runId);
  revalidatePath(`/payroll/${runId}`);
  revalidatePath("/payroll");
}

export async function savePayrollSettings(form: FormData) {
  const session = await requireSession();
  await assertModuleEnabled(session, "payroll");
  await commands.savePayrollSettings(session, form);
  revalidatePath("/payroll/settings");
}

export async function issueP45(employeeId: string) {
  const session = await requireSession();
  await assertModuleEnabled(session, "payroll");
  await commands.issueP45(session, employeeId);
  revalidatePath("/payroll");
}

export async function issueP60(employeeId: string) {
  const session = await requireSession();
  await assertModuleEnabled(session, "payroll");
  await commands.issueP60(session, employeeId);
  revalidatePath("/payroll");
}
