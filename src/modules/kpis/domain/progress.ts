import { formatMoney } from "@/core/shared/money";

export type GoalDirection = "AT_LEAST" | "AT_MOST";
export type GoalVerdict = "met" | "ahead" | "on_track" | "behind" | "at_risk" | "over" | "not_started" | "no_reading";
export type MeasurePoint = { label: string; value: number };

export const verdictLabel: Record<GoalVerdict, string> = {
  met: "Target met",
  ahead: "Ahead of pace",
  on_track: "On pace",
  behind: "Behind pace",
  at_risk: "Well behind",
  over: "Over the limit",
  not_started: "Not started",
  no_reading: "No figure yet",
};

const dayMs = 86400000;

function utcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function formatGoalValue(value: number, unit: string, currency?: string) {
  if (unit === "money") return formatMoney(value, currency || "GBP");
  const formatted = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value);
  if (unit === "percent") return `${formatted}%`;
  if (unit === "hours") return `${formatted} h`;
  if (!unit || unit === "count") return formatted;
  return `${formatted} ${unit}`;
}

export function goalDateLabel(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

/** Whole measure, or one group. Rates and currencies are never added together. */
export function readActual(points: MeasurePoint[], unit: string | undefined, sliceLabel: string) {
  const slice = sliceLabel.trim();
  const chosen = slice ? points.filter((point) => point.label.toLowerCase() === slice.toLowerCase()) : points;
  if (unit === "percent") {
    if (chosen.length === 1) return { actual: chosen[0].value as number | null, currency: undefined as string | undefined, blocked: undefined as string | undefined };
    return { actual: null, currency: undefined, blocked: slice ? `“${slice}” is not in the current figures.` : "This is a rate. Choose the one group it refers to. Rates are not added together." };
  }
  if (unit === "money") {
    if (slice && !chosen.length) return { actual: 0, currency: slice, blocked: undefined };
    if (chosen.length === 1) return { actual: chosen[0].value, currency: chosen[0].label, blocked: undefined };
    if (!chosen.length) return { actual: 0, currency: undefined, blocked: undefined };
    return { actual: null, currency: undefined, blocked: "Amounts in different currencies stay separate. Choose one currency for this goal." };
  }
  if (slice && !chosen.length) return { actual: null, currency: undefined, blocked: `“${slice}” is not in the current figures, so this goal cannot be scored yet.` };
  return { actual: chosen.reduce((sum, point) => sum + point.value, 0), currency: undefined, blocked: undefined };
}

export function judgeGoal(input: {
  actual: number | null;
  blocked?: string;
  target: number;
  direction: GoalDirection;
  startsAt: Date;
  endsAt: Date;
  now?: Date;
  snapshot?: boolean;
  unit?: string;
  currency?: string;
}) {
  const now = input.now ?? new Date();
  const start = utcDay(input.startsAt);
  const end = utcDay(input.endsAt);
  const today = utcDay(now);
  const days = Math.max(1, Math.round((end - start) / dayMs) + 1);
  const day = today < start ? 0 : today > end ? days : Math.round((today - start) / dayMs) + 1;
  const elapsed = day <= 0 ? 0 : day >= days ? 1 : (day - 1) / Math.max(days - 1, 1);
  const expected = input.direction === "AT_LEAST" || input.direction === "AT_MOST" ? input.target * elapsed : null;
  const base = {
    day, days, elapsed, expected,
    shortfall: input.actual === null ? null : input.direction === "AT_MOST" ? input.actual - input.target : input.target - input.actual,
  };
  const pace = input.snapshot ? "This is the current position, not a total built up through the period. " : "";
  if (input.blocked || input.actual === null) {
    return { ...base, verdict: "no_reading" as const, summary: input.blocked || "There is no figure for this goal yet." };
  }
  const unit = input.unit || "count";
  const show = (value: number) => formatGoalValue(value, unit, input.currency);
  const actual = input.actual;
  const figure = show(actual);
  const line = expected === null ? "" : show(expected);
  if (day <= 0) {
    const early = input.direction === "AT_LEAST" && actual > 0;
    return { ...base, verdict: early ? "ahead" as const : "not_started" as const, summary: early ? `${pace}It has not started, and the figure is already ${figure}.` : `${pace}This goal starts on ${goalDateLabel(input.startsAt)}.` };
  }
  if (input.direction === "AT_MOST") {
    if (actual > input.target) return { ...base, verdict: "over" as const, summary: `${pace}Day ${day} of ${days}. The figure is ${figure}, which is over the limit of ${show(input.target)}.` };
    if (day >= days) return { ...base, verdict: "met" as const, summary: `${pace}The period has ended and the figure stayed within the limit.` };
    if (expected !== null && actual <= expected * 0.85) return { ...base, verdict: "ahead" as const, summary: `${pace}Day ${day} of ${days}. The straight-line allowance is ${line} and the figure is ${figure}, so there is room under the limit.` };
    if (expected !== null && actual <= expected) return { ...base, verdict: "on_track" as const, summary: `${pace}Day ${day} of ${days}. The straight-line allowance is ${line} and the figure is ${figure}.` };
    return { ...base, verdict: "behind" as const, summary: `${pace}Day ${day} of ${days}. The figure is still under the limit, but it is using the allowance faster than the straight line of ${line}.` };
  }
  if (actual >= input.target) return { ...base, verdict: "met" as const, summary: `${pace}The figure has reached the target.` };
  if (expected !== null && expected <= 0) return { ...base, verdict: "on_track" as const, summary: `${pace}Day ${day} of ${days}. The pace line has only just started.` };
  const ratio = expected ? actual / expected : 1;
  const gap = expected === null ? 0 : actual - expected;
  const gapText = `${show(Math.abs(gap))} ${gap >= 0 ? "ahead of" : "short of"} the straight-line pace of ${line}`;
  if (ratio >= 1.05) return { ...base, verdict: "ahead" as const, summary: `${pace}Day ${day} of ${days}. The figure is ${figure}, ${gapText}.` };
  if (ratio >= 0.9) return { ...base, verdict: "on_track" as const, summary: `${pace}Day ${day} of ${days}. The figure is ${figure}, close to the straight-line pace of ${line}.` };
  if (ratio >= 0.75) return { ...base, verdict: "behind" as const, summary: `${pace}Day ${day} of ${days}. The figure is ${figure}, ${gapText}.` };
  return { ...base, verdict: "at_risk" as const, summary: `${pace}Day ${day} of ${days}. The figure is ${figure}, a long way short of the straight-line pace of ${line}.` };
}
