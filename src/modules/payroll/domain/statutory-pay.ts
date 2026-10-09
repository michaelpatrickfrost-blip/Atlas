import { taxYearTable } from "./tax-tables";

/** Qualifying days for SSP/SMP within a pay period, from an AbsenceRecord
 *  that overlaps it. Waiting days and average-weekly-earnings qualification
 *  tests are not modelled here — this computes the statutory rate for the
 *  days that do qualify, which a payroll manager confirms before finalising
 *  a run (see docs/modules/PAYROLL.md for the stated limits). */
export function daysWithinPeriod(absenceStart: Date, absenceEnd: Date, periodStart: Date, periodEnd: Date): number {
  const start = absenceStart > periodStart ? absenceStart : periodStart;
  const end = absenceEnd < periodEnd ? absenceEnd : periodEnd;
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function calculateSsp(params: { qualifyingDays: number; qualifyingDaysPerWeek:number; averageWeeklyEarningsMinorUnits:number; taxYear: string }): { weeklyRateMinorUnits: number; totalMinorUnits: number } {
  const table = taxYearTable(params.taxYear);
  if(!Number.isInteger(params.qualifyingDaysPerWeek)||params.qualifyingDaysPerWeek<1||params.qualifyingDaysPerWeek>7||!Number.isInteger(params.qualifyingDays)||params.qualifyingDays<0||!Number.isSafeInteger(params.averageWeeklyEarningsMinorUnits)||params.averageWeeklyEarningsMinorUnits<0)throw new Error("Confirm qualifying days and actual average weekly earnings.");
  const weeklyRateMinorUnits = Math.min(Math.round(table.sspWeeklyRate * 100),Math.round(params.averageWeeklyEarningsMinorUnits*.8));
  const totalMinorUnits = Math.round((weeklyRateMinorUnits / params.qualifyingDaysPerWeek) * params.qualifyingDays);
  return { weeklyRateMinorUnits, totalMinorUnits };
}

/** SMP: 90% of average weekly earnings for the first 6 weeks (capped at
 *  nothing — AWE can be below the flat rate), then the lower of the flat
 *  rate and 90% of AWE for the remaining weeks, up to 39 weeks total. */
export function calculateSmp(params: { averageWeeklyEarningsMinorUnits: number; weekNumber: number; taxYear: string }): { weeklyRateMinorUnits: number } {
  if(!Number.isInteger(params.weekNumber)||params.weekNumber<1)throw new Error("Enter a valid maternity-pay week.");
  if(params.weekNumber>39)return {weeklyRateMinorUnits:0};
  const table = taxYearTable(params.taxYear);
  const earningsReplacement = Math.round(params.averageWeeklyEarningsMinorUnits * table.smpEarningsReplacementRate);
  if (params.weekNumber <= 6) return { weeklyRateMinorUnits: earningsReplacement };
  const flatRateMinorUnits = Math.round(table.smpWeeklyRateAfterSixWeeks * 100);
  return { weeklyRateMinorUnits: Math.min(flatRateMinorUnits, earningsReplacement) };
}
