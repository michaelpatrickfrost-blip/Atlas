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

export function calculateSsp(params: { qualifyingDays: number; taxYear: string }): { weeklyRateMinorUnits: number; totalMinorUnits: number } {
  const table = taxYearTable(params.taxYear);
  const weeklyRateMinorUnits = Math.round(table.sspWeeklyRate * 100);
  const totalMinorUnits = Math.round((weeklyRateMinorUnits / 7) * params.qualifyingDays);
  return { weeklyRateMinorUnits, totalMinorUnits };
}

/** SMP: 90% of average weekly earnings for the first 6 weeks (capped at
 *  nothing — AWE can be below the flat rate), then the lower of the flat
 *  rate and 90% of AWE for the remaining weeks, up to 39 weeks total. */
export function calculateSmp(params: { averageWeeklyEarningsMinorUnits: number; weekNumber: number; taxYear: string }): { weeklyRateMinorUnits: number } {
  const table = taxYearTable(params.taxYear);
  const earningsReplacement = Math.round(params.averageWeeklyEarningsMinorUnits * table.smpEarningsReplacementRate);
  if (params.weekNumber <= 6) return { weeklyRateMinorUnits: earningsReplacement };
  const flatRateMinorUnits = Math.round(table.smpWeeklyRateAfterSixWeeks * 100);
  return { weeklyRateMinorUnits: Math.min(flatRateMinorUnits, earningsReplacement) };
}
