import { taxYearTable } from "./tax-tables";
import { calculatePaye } from "./paye";
import { calculateNi } from "./ni";
import { calculatePension } from "./pension";

/** Rota/absence integration — ported from the HR-embedded payroll feature
 *  this module replaces. Overtime: confirmed rota hours in the pay period
 *  beyond a prorated standard-hours threshold, paid at the org's overtime
 *  multiplier using an hourly rate derived from annual salary. Unpaid leave:
 *  days of UNPAID absence overlapping the period, deducted at a simple daily
 *  rate (annual salary / 260 working days). */

export function periodWeeks(periodStart: Date, periodEnd: Date): number {
  return Math.max(1, (periodEnd.getTime() - periodStart.getTime()) / (7 * 86_400_000));
}

export function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

export function calculateOvertime(params: {
  confirmedShiftHours: number;
  periodStart: Date;
  periodEnd: Date;
  standardWeeklyHours: number;
  overtimeMultiplier: number;
  annualSalaryMinorUnits: number | null;
}): { overtimeHours: number; overtimeMinorUnits: number } {
  const standardHoursForPeriod = params.standardWeeklyHours * periodWeeks(params.periodStart, params.periodEnd);
  const overtimeHours = Math.max(0, params.confirmedShiftHours - standardHoursForPeriod);
  if (overtimeHours === 0 || !params.annualSalaryMinorUnits) return { overtimeHours, overtimeMinorUnits: 0 };
  const hourlyRate = params.annualSalaryMinorUnits / (52 * params.standardWeeklyHours);
  return { overtimeHours, overtimeMinorUnits: Math.round(overtimeHours * hourlyRate * params.overtimeMultiplier) };
}

const WORKING_DAYS_PER_YEAR = 260;

export function calculateUnpaidLeaveDeduction(params: { unpaidDaysInPeriod: number; annualSalaryMinorUnits: number | null }): number {
  if (!params.annualSalaryMinorUnits || params.unpaidDaysInPeriod <= 0) return 0;
  const dailyRate = params.annualSalaryMinorUnits / WORKING_DAYS_PER_YEAR;
  return Math.round(dailyRate * params.unpaidDaysInPeriod);
}

/** Days of an absence record that fall within [periodStart, periodEnd], inclusive. */
export function daysWithinPeriod(absenceStart: Date, absenceEnd: Date, periodStart: Date, periodEnd: Date): number {
  const start = absenceStart > periodStart ? absenceStart : periodStart;
  const end = absenceEnd < periodEnd ? absenceEnd : periodEnd;
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function calculateStudentLoan(params: {
  grossMinorUnits: number;
  plan: "PLAN_1" | "PLAN_2" | "PLAN_4" | "POSTGRADUATE" | null;
  payPeriodsPerYear: 12 | 52;
  taxYear: string;
}): number {
  if (!params.plan) return 0;
  const table = taxYearTable(params.taxYear);
  const thresholdPerPeriod = table.studentLoanThresholds[params.plan] / params.payPeriodsPerYear;
  const grossPerPeriod = params.grossMinorUnits / 100;
  const above = Math.max(0, grossPerPeriod - thresholdPerPeriod);
  const rate = params.plan === "POSTGRADUATE" ? table.postgraduateLoanRate : table.studentLoanRate;
  return Math.round(above * rate * 100);
}

/** Full gross-to-net for one employee, one period: salary + overtime, minus
 *  unpaid leave, PAYE, NI, pension, student loan, plus any statutory pay
 *  already computed for an absence in the period, plus a manual adjustment. */
export function calculatePayslip(params: {
  annualSalaryMinorUnits: number | null;
  currency: string;
  taxCode: string | null;
  niCategory: string;
  studentLoanPlan: "PLAN_1" | "PLAN_2" | "PLAN_4" | "POSTGRADUATE" | null;
  pensionOptOut: boolean;
  payFrequency: "MONTHLY" | "WEEKLY";
  taxYear: string;
  employeePensionPercent: number;
  employerPensionPercent: number;
  confirmedShiftHours: number;
  standardWeeklyHours: number;
  overtimeMultiplier: number;
  unpaidDaysInPeriod: number;
  statutoryPayMinorUnits: number;
  manualAdjustmentMinorUnits: number;
  periodStart: Date;
  periodEnd: Date;
}) {
  const payPeriodsPerYear = params.payFrequency === "WEEKLY" ? 52 : 12;
  const grossForPeriod = params.payFrequency === "WEEKLY"
    ? Math.round((params.annualSalaryMinorUnits ?? 0) / 52)
    : Math.round((params.annualSalaryMinorUnits ?? 0) / 12);

  const { overtimeHours, overtimeMinorUnits } = calculateOvertime({
    confirmedShiftHours: params.confirmedShiftHours,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    standardWeeklyHours: params.standardWeeklyHours,
    overtimeMultiplier: params.overtimeMultiplier,
    annualSalaryMinorUnits: params.annualSalaryMinorUnits,
  });
  const unpaidLeaveDeductionMinorUnits = calculateUnpaidLeaveDeduction({ unpaidDaysInPeriod: params.unpaidDaysInPeriod, annualSalaryMinorUnits: params.annualSalaryMinorUnits });

  const grossMinorUnits = grossForPeriod + overtimeMinorUnits - unpaidLeaveDeductionMinorUnits + params.statutoryPayMinorUnits;

  const { taxMinorUnits } = calculatePaye({ grossMinorUnits, taxCode: params.taxCode, payPeriodsPerYear, taxYear: params.taxYear });
  const { employeeNiMinorUnits, employerNiMinorUnits } = calculateNi({ grossMinorUnits, niCategory: params.niCategory, payPeriodsPerYear, taxYear: params.taxYear });
  const { employeePensionMinorUnits, employerPensionMinorUnits } = calculatePension({
    grossMinorUnits, payPeriodsPerYear, employeePercent: params.employeePensionPercent, employerPercent: params.employerPensionPercent, optedOut: params.pensionOptOut, taxYear: params.taxYear,
  });
  const studentLoanMinorUnits = calculateStudentLoan({ grossMinorUnits, plan: params.studentLoanPlan, payPeriodsPerYear, taxYear: params.taxYear });

  const netMinorUnits = grossMinorUnits - taxMinorUnits - employeeNiMinorUnits - employeePensionMinorUnits - studentLoanMinorUnits - params.manualAdjustmentMinorUnits;

  return {
    grossMinorUnits: grossForPeriod,
    overtimeHours,
    overtimeMinorUnits,
    unpaidLeaveDeductionMinorUnits,
    taxMinorUnits,
    employeeNiMinorUnits,
    employerNiMinorUnits,
    employeePensionMinorUnits,
    employerPensionMinorUnits,
    studentLoanMinorUnits,
    statutoryPayMinorUnits: params.statutoryPayMinorUnits,
    deductionsMinorUnits: params.manualAdjustmentMinorUnits,
    netMinorUnits,
    currency: params.currency,
  };
}
