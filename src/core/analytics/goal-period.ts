import type { GoalPeriod } from "./types";
/** Goal dates are inclusive UTC days; queries use an exclusive upper bound, capped at now. */
export function goalPeriod(start: Date, end: Date, now = new Date()): GoalPeriod {
 const from = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
 const until = new Date(Math.min(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()+1), now.getTime()));
 if (!Number.isFinite(from.getTime()) || !Number.isFinite(until.getTime()) || end < start) throw new Error("Invalid goal period.");
 return {start:from,until};
}
export const periodFilter = (period: GoalPeriod) => ({gte:period.start,lt:period.until});
export function recentPeriod(since?: Date): GoalPeriod { return {start:since??new Date(0),until:new Date()}; }
export function safeMetricNumber(value: bigint): number { if(value>BigInt(Number.MAX_SAFE_INTEGER)||value<BigInt(Number.MIN_SAFE_INTEGER))throw new Error("Metric exceeds safe numeric precision.");return Number(value); }
