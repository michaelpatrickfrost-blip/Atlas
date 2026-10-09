"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { redirect } from "next/navigation";
import { assertModuleEnabled } from "@/core/modules/access";
import { revalidatePath } from "next/cache";
import * as commands from "@/modules/payroll/services/commands";
import { preparePayroll,type PayrollFrequency } from "@/modules/payroll/services/preparation";
export async function getPayrollPreparation(start:string,end:string,frequency:PayrollFrequency) {const session=await requireSession();assertCapability(session,"payroll.run.read");await assertModuleEnabled(session,"payroll");await assertModuleEnabled(session,"people");await assertModuleEnabled(session,"scheduling");return preparePayroll(session,start,end,frequency);}

export async function createPayrollRun(form: FormData) {
  const session = await requireSession();
  assertCapability(session,"payroll.run.manage");
  await assertModuleEnabled(session, "payroll");
  const run=await commands.createPayrollRun(session, form);
  revalidatePath("/payroll");
  redirect(`/payroll/${run.id}`);
}

export async function updatePayslipDeductions(payslipId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session,"payroll.run.manage");
  await assertModuleEnabled(session, "payroll");
  const payslip = await commands.updatePayslipDeductions(session, payslipId, form);
  revalidatePath("/payroll");
  return payslip;
}

export async function finalisePayrollRun(runId: string,form:FormData) {
  const session = await requireSession();
  assertCapability(session,"payroll.run.manage");
  await assertModuleEnabled(session, "payroll");
  await commands.finalisePayrollRun(session, runId,form);
  revalidatePath(`/payroll/${runId}`);
  revalidatePath("/payroll");
}

export async function refreshPayrollRun(runId:string,form:FormData) {const session=await requireSession();assertCapability(session,"payroll.run.manage");await assertModuleEnabled(session,"payroll");await commands.refreshPayrollRun(session,runId,form);revalidatePath("/payroll");revalidatePath(`/payroll/${runId}`);redirect(`/payroll/${runId}`);}
export async function savePeriodAdjustment(form:FormData) {const session=await requireSession();assertCapability(session,"payroll.run.manage");await assertModuleEnabled(session,"payroll");await commands.savePeriodAdjustment(session,form);revalidatePath("/payroll/prepare");revalidatePath("/people/pay");}

export async function markPayrollRunPaid(runId: string) {
  const session = await requireSession();
  assertCapability(session,"payroll.run.manage");
  await assertModuleEnabled(session, "payroll");
  await commands.markPayrollRunPaid(session, runId);
  revalidatePath(`/payroll/${runId}`);
  revalidatePath("/payroll");
}

export async function savePayrollSettings(form: FormData) {
  const session = await requireSession();
  assertCapability(session,"payroll.settings.manage");
  await assertModuleEnabled(session, "payroll");
  await commands.savePayrollSettings(session, form);
  revalidatePath("/payroll/settings");
}

export async function issueP45(employeeId: string) {
  const session = await requireSession();
  assertCapability(session,"payroll.run.manage");
  await assertModuleEnabled(session, "payroll");
  await commands.issueP45(session, employeeId);
  revalidatePath("/payroll");
}

export async function issueP60(employeeId: string) {
  const session = await requireSession();
  assertCapability(session,"payroll.run.manage");
  await assertModuleEnabled(session, "payroll");
  await commands.issueP60(session, employeeId);
  revalidatePath("/payroll");
}
