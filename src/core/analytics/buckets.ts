import type { AnalyticsPoint } from "./types";

function startOfWeek(date: Date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  day.setHours(0, 0, 0, 0);
  return day;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function label(date: Date, month: boolean) {
  return date.toLocaleDateString("en-GB", month ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" });
}

/** Week buckets for short periods, month buckets once the window is longer than four months. */
export function timeSeries(dates: Date[], since?: Date, now = new Date()): AnalyticsPoint[] {
  const start = since ?? new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const days = (now.getTime() - start.getTime()) / 86400000;
  const monthly = days > 120;
  const cursor = monthly ? startOfMonth(start) : startOfWeek(start);
  const end = monthly ? startOfMonth(now) : startOfWeek(now);
  const buckets: Date[] = [];
  const next = new Date(cursor);
  while (next <= end && buckets.length < 18) {
    buckets.push(new Date(next));
    next.setMonth(next.getMonth() + (monthly ? 1 : 0));
    if (!monthly) next.setDate(next.getDate() + 7);
  }
  const visible = buckets.slice(-16);
  if (!visible.length) return [];
  const counts = visible.map(() => 0);
  const origin = visible[0]?.getTime() ?? 0;
  const step = monthly ? 1 : 7 * 86400000;
  for (const date of dates) {
    const index = monthly
      ? (date.getFullYear() - visible[0].getFullYear()) * 12 + date.getMonth() - visible[0].getMonth()
      : Math.floor((startOfWeek(date).getTime() - origin) / step);
    if (index >= 0 && index < counts.length) counts[index] += 1;
  }
  return visible.map((bucket, index) => ({ label: label(bucket, monthly), value: counts[index] }));
}
