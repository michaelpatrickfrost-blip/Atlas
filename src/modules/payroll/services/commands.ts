import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { calculatePayslip, daysWithinPeriod, hoursBetween } from "@/modules/payroll/domain/payroll-run";
import { calculateSsp, calculateSmp, daysWithinPeriod as sspDaysWithinPeriod } from "@/modules/payroll/domain/statutory-pay";
import { CURRENT_TAX_YEAR } from "@/modules/payroll/domain/tax-tables";

export async function getPayrollSettings(organisationId: string) {
  const existing = await db.payrollSettings.findUnique({ where: { organisationId } });
  if (existing) return existing;
  return db.payrollSettings.create({ data: { organisationId, currentTaxYear: CURRENT_TAX_YEAR } });
}

export async function savePayrollSettings(session: Session, form: FormData) {
  assertCapability(session, PAYROLL_CAPABILITIES.settingsManage);
  const payeReference = String(form.get("payeReference") ?? "").trim() || null;
  const accountsOfficeReference = String(form.get("accountsOfficeReference") ?? "").trim() || null;
  const pensionSchemeName = String(form.get("pensionSchemeName") ?? "").trim() || null;
  const employerPensionPercent = Number(form.get("employerPensionPercent") ?? 3);
  const employeePensionPercent = Number(form.get("employeePensionPercent") ?? 5);
  if (employerPensionPercent < 0 || employerPensionPercent > 100 || employeePensionPercent < 0 || employeePensionPercent > 100) {
    throw new Error("Pension percentages must be between 0 and 100.");
  }
  await db.payrollSettings.upsert({
    where: { organisationId: session.organisationId },
    create: { organisationId: session.organisationId, currentTaxYear: CURRENT_TAX_YEAR, payeReference, accountsOfficeReference, pensionSchemeName, employerPensionPercent, employeePensionPercent },
    update: { payeReference, accountsOfficeReference, pensionSchemeName, employerPensionPercent, employeePensionPercent },
  });
}

/** Creates or refreshes a StatutoryPayRecord for an absence overlapping the
 *  period, so a payroll run can apply it. SSP from day 1 of the overlap;
 *  SMP uses week 1 of the whole absence episode to position the 6-week
 *  earnings-replacement cut-over, with average weekly earnings taken as the
 *  employee's current weekly-equivalent salary (no 8-week lookback yet). */
async function computeStatutoryPay(employee: { id: string; organisationId: string; annualSalaryMinorUnits: number | null }, absence: { id: string; type: string; startDate: Date; endDate: Date }, periodStart: Date, periodEnd: Date) {
  const qualifyingDays = sspDaysWithinPeriod(absence.startDate, absence.endDate, periodStart, periodEnd);
  if (qualifyingDays <= 0) return null;
  if (absence.type === "SICKNESS") {
    const { weeklyRateMinorUnits, totalMinorUnits } = calculateSsp({ qualifyingDays, taxYear: CURRENT_TAX_YEAR });
    return { type: "SSP" as const, weeklyRateMinorUnits, qualifyingDays, totalMinorUnits };
  }
  if (absence.type === "MATERNITY_PATERNITY") {
    const averageWeeklyEarningsMinorUnits = Math.round((employee.annualSalaryMinorUnits ?? 0) / 52);
    const weekNumber = Math.max(1, Math.ceil((periodStart.getTime() - absence.startDate.getTime()) / (7 * 86_400_000)) + 1);
    const { weeklyRateMinorUnits } = calculateSmp({ averageWeeklyEarningsMinorUnits, weekNumber, taxYear: CURRENT_TAX_YEAR });
    const totalMinorUnits = Math.round((weeklyRateMinorUnits / 7) * qualifyingDays);
    return { type: "SMP" as const, weeklyRateMinorUnits, qualifyingDays, totalMinorUnits };
  }
  return null;
}

export async function createPayrollRun(session: Session, form: FormData) {
  assertCapability(session, PAYROLL_CAPABILITIES.runManage);
  const periodLabel = String(form.get("periodLabel") ?? "").trim();
  const periodStart = new Date(String(form.get("periodStart") ?? ""));
  const periodEnd = new Date(String(form.get("periodEnd") ?? ""));
  if (!periodLabel || periodLabel.length > 100) throw new Error("Enter a period label, e.g. 'October 2026'.");
  if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) || periodEnd < periodStart) throw new Error("Enter a valid period.");

  const [org, settings] = await Promise.all([
    db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { hrStandardWeeklyHours: true, hrOvertimeMultiplier: true } }),
    getPayrollSettings(session.organisationId),
  ]);
  const employees = await db.employee.findMany({
    where: { organisationId: session.organisationId, status: { in: ["ACTIVE", "ON_LEAVE", "OFFBOARDING"] } },
    include: {
      shifts: { where: { status: "CONFIRMED", startsAt: { gte: periodStart }, endsAt: { lte: periodEnd } } },
      absences: { where: { startDate: { lte: periodEnd }, endDate: { gte: periodStart }, status: "APPROVED" } },
    },
  });

  const run = await db.$transaction(async (tx) => {
    const created = await tx.payrollRun.create({ data: { organisationId: session.organisationId, periodLabel, periodStart, periodEnd } });

    for (const e of employees) {
      const confirmedShiftHours = e.shifts.reduce((sum, s) => sum + hoursBetween(s.startsAt, s.endsAt), 0);
      const unpaidAbsences = e.absences.filter((a) => a.type === "UNPAID");
      const unpaidDaysInPeriod = unpaidAbsences.reduce((sum, a) => sum + daysWithinPeriod(a.startDate, a.endDate, periodStart, periodEnd), 0);

      let statutoryPayMinorUnits = 0;
      for (const absence of e.absences.filter((a) => a.type === "SICKNESS" || a.type === "MATERNITY_PATERNITY")) {
        const computed = await computeStatutoryPay(e, absence, periodStart, periodEnd);
        if (!computed) continue;
        statutoryPayMinorUnits += computed.totalMinorUnits;
        await tx.statutoryPayRecord.upsert({
          where: { absenceRecordId: absence.id },
          create: { organisationId: session.organisationId, employeeId: e.id, absenceRecordId: absence.id, type: computed.type, weeklyRateMinorUnits: computed.weeklyRateMinorUnits, qualifyingDays: computed.qualifyingDays, totalMinorUnits: computed.totalMinorUnits },
          update: { weeklyRateMinorUnits: computed.weeklyRateMinorUnits, qualifyingDays: computed.qualifyingDays, totalMinorUnits: computed.totalMinorUnits },
        });
      }

      const result = calculatePayslip({
        annualSalaryMinorUnits: e.annualSalaryMinorUnits,
        currency: e.currency,
        taxCode: e.taxCode,
        niCategory: e.niCategory,
        studentLoanPlan: e.studentLoanPlan,
        pensionOptOut: e.pensionOptOut,
        payFrequency: e.payFrequency,
        taxYear: settings.currentTaxYear,
        employeePensionPercent: settings.employeePensionPercent,
        employerPensionPercent: settings.employerPensionPercent,
        confirmedShiftHours,
        standardWeeklyHours: e.contractedWeeklyHours ?? org.hrStandardWeeklyHours,
        overtimeMultiplier: org.hrOvertimeMultiplier,
        unpaidDaysInPeriod,
        statutoryPayMinorUnits,
        manualAdjustmentMinorUnits: 0,
        periodStart,
        periodEnd,
      });

      await tx.payslip.create({ data: { organisationId: session.organisationId, payrollRunId: created.id, employeeId: e.id, unpaidLeaveDays: unpaidDaysInPeriod, ...result } });

      await tx.employeeTaxYearToDate.upsert({
        where: { employeeId_taxYear: { employeeId: e.id, taxYear: settings.currentTaxYear } },
        create: { organisationId: session.organisationId, employeeId: e.id, taxYear: settings.currentTaxYear, grossToDateMinorUnits: result.grossMinorUnits + result.overtimeMinorUnits, taxToDateMinorUnits: result.taxMinorUnits, niToDateMinorUnits: result.employeeNiMinorUnits },
        update: { grossToDateMinorUnits: { increment: result.grossMinorUnits + result.overtimeMinorUnits }, taxToDateMinorUnits: { increment: result.taxMinorUnits }, niToDateMinorUnits: { increment: result.employeeNiMinorUnits } },
      });
    }
    return created;
  });

  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_run.created", entityType: "PayrollRun", entityId: run.id });
  return run;
}

export async function updatePayslipDeductions(session: Session, payslipId: string, form: FormData) {
  assertCapability(session, PAYROLL_CAPABILITIES.runManage);
  const adjustmentPounds = Number(form.get("deductions") ?? 0);
  if (adjustmentPounds < 0) throw new Error("Deductions cannot be negative.");
  const payslip = await db.payslip.findFirstOrThrow({ where: { id: payslipId, organisationId: session.organisationId }, include: { payrollRun: true } });
  if (payslip.payrollRun.status !== "DRAFT") throw new Error("This payroll run is already finalised.");
  const deductionsMinorUnits = Math.round(adjustmentPounds * 100);
  const netMinorUnits = payslip.grossMinorUnits + payslip.overtimeMinorUnits + payslip.statutoryPayMinorUnits
    - payslip.unpaidLeaveDeductionMinorUnits - payslip.taxMinorUnits - payslip.employeeNiMinorUnits - payslip.employeePensionMinorUnits - payslip.studentLoanMinorUnits - deductionsMinorUnits;
  await db.payslip.update({ where: { id: payslipId }, data: { deductionsMinorUnits, netMinorUnits, notes: String(form.get("notes") ?? "").slice(0, 1000) || null } });
}

export async function finalisePayrollRun(session: Session, runId: string) {
  assertCapability(session, PAYROLL_CAPABILITIES.runManage);
  await db.payrollRun.update({ where: { id: runId, organisationId: session.organisationId }, data: { status: "FINALISED", finalisedAt: new Date() } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_run.finalised", entityType: "PayrollRun", entityId: runId });
}

export async function markPayrollRunPaid(session: Session, runId: string) {
  assertCapability(session, PAYROLL_CAPABILITIES.runManage);
  await db.payrollRun.update({ where: { id: runId, organisationId: session.organisationId }, data: { status: "PAID", paidAt: new Date() } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_run.paid", entityType: "PayrollRun", entityId: runId });
}

/** P45: a leaver's year-to-date pay/tax figures, for export — not a filing. */
export async function issueP45(session: Session, employeeId: string) {
  assertCapability(session, PAYROLL_CAPABILITIES.runManage);
  const settings = await getPayrollSettings(session.organisationId);
  const ytd = await db.employeeTaxYearToDate.findUnique({ where: { employeeId_taxYear: { employeeId, taxYear: settings.currentTaxYear } } });
  const doc = await db.payrollDocument.create({
    data: { organisationId: session.organisationId, employeeId, type: "P45", taxYear: settings.currentTaxYear, figures: { grossToDateMinorUnits: ytd?.grossToDateMinorUnits ?? 0, taxToDateMinorUnits: ytd?.taxToDateMinorUnits ?? 0, niToDateMinorUnits: ytd?.niToDateMinorUnits ?? 0 } },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_document.p45_issued", entityType: "PayrollDocument", entityId: doc.id });
  return doc;
}

/** P60: the tax year's final pay/tax/NI figures, for export — not a filing. */
export async function issueP60(session: Session, employeeId: string) {
  assertCapability(session, PAYROLL_CAPABILITIES.runManage);
  const settings = await getPayrollSettings(session.organisationId);
  const ytd = await db.employeeTaxYearToDate.findUniqueOrThrow({ where: { employeeId_taxYear: { employeeId, taxYear: settings.currentTaxYear } } });
  const doc = await db.payrollDocument.create({
    data: { organisationId: session.organisationId, employeeId, type: "P60", taxYear: settings.currentTaxYear, figures: { grossToDateMinorUnits: ytd.grossToDateMinorUnits, taxToDateMinorUnits: ytd.taxToDateMinorUnits, niToDateMinorUnits: ytd.niToDateMinorUnits } },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_document.p60_issued", entityType: "PayrollDocument", entityId: doc.id });
  return doc;
}
