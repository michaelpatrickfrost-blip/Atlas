import { workingLeaveDays } from "./working-time";

/** Leave year runs calendar-year (1 Jan–31 Dec) — a reasonable default; per-org
 *  leave-year start dates are a real future refinement, not built here. */
export function currentLeaveYearRange(asOf: Date = new Date()): { start: Date; end: Date } {
  return { start: new Date(asOf.getFullYear(), 0, 1), end: new Date(asOf.getFullYear(), 11, 31) };
}

export function calculateLeaveBalance(params: {
  entitlementDays: number;
  workingDays?: number[];
  approvedHolidays: Array<{ startDate: Date; endDate: Date; bookedDays?: number | null }>;
}): { entitlement: number; taken: number; remaining: number } {
  const taken = params.approvedHolidays.reduce((sum, h) => sum + (h.bookedDays ?? workingLeaveDays(h.startDate, h.endDate, params.workingDays)), 0);
  return { entitlement: params.entitlementDays, taken, remaining: params.entitlementDays - taken };
}

/** A request can be edited in half days. The allowance itself stays whole days. */
export function leaveDayCount(value: string) {
  const days = Number(value);
  if (!Number.isFinite(days) || days < 0 || days > 366 || Math.round(days * 2) !== days * 2) throw new Error("Enter the days in half-day steps, from 0 to 366.");
  return days;
}

export function allowanceDays(value: string) {
  const days = Number(value);
  if (!Number.isInteger(days) || days < 0 || days > 366) throw new Error("Enter a whole-day allowance from 0 to 366.");
  return days;
}
