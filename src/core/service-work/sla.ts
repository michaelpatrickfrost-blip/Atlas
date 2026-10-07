import { z } from "zod";

export const calendarSchema = z.object({
  timezone: z.string().default("Europe/London").refine(value => { try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } }, "Choose a valid timezone."),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).default([1, 2, 3, 4, 5]),
  start: z.number().int().min(0).max(1439).default(540),
  end: z.number().int().min(1).max(1440).default(1020),
  holidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
}).refine(value => value.end > value.start, "Business hours must end after they start.");
export const slaSchema = z.object({
  responseMinutes: z.number().int().min(1).max(43200).default(240),
  resolutionMinutes: z.number().int().min(1).max(43200).default(2400),
  warningMinutes: z.number().int().min(0).max(1440).default(60),
  pauseStates: z.array(z.string()).default(["PENDING_REQUESTER", "WAITING_CUSTOMER"]),
  calendar: calendarSchema.default({ timezone: "Europe/London", weekdays: [1, 2, 3, 4, 5], start: 540, end: 1020, holidays: [] }),
});
export type ServiceSla = z.infer<typeof slaSchema>;
type Calendar = ServiceSla["calendar"];

function localDay(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (name: string) => parts.find(part => part.type === name)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
function nextDay(day: string) { return new Date(Date.parse(`${day}T12:00:00Z`) + 86400000).toISOString().slice(0, 10); }
/** Resolve a calendar wall time, including UK daylight-saving changes. */
function instant(day: string, minute: number, timezone: string) {
  const desired = Date.parse(`${day}T00:00:00Z`) + minute * 60000;
  let result = desired;
  const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 4; i++) {
    const parts = formatter.formatToParts(new Date(result));
    const n = (name: string) => Number(parts.find(part => part.type === name)!.value);
    const displayed = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
    const correction = desired - displayed;
    if (!correction) break;
    result += correction;
  }
  return result;
}
function window(day: string, calendar: Calendar) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  if (!calendar.weekdays.includes(weekday) || calendar.holidays.includes(day)) return null;
  return [instant(day, calendar.start, calendar.timezone), instant(day, calendar.end, calendar.timezone)] as const;
}
export function addBusinessMinutes(start: Date, minutes: number, calendar: Calendar): Date {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(minutes) || minutes < 0) throw new Error("Invalid SLA duration.");
  if (!minutes) return new Date(start);
  let remaining = minutes * 60000, day = localDay(start, calendar.timezone), cursor = start.getTime();
  for (let i = 0; i < 1100; i++, day = nextDay(day)) {
    const hours = window(day, calendar);
    if (!hours) continue;
    const from = Math.max(cursor, hours[0]);
    const available = Math.max(0, hours[1] - from);
    if (available >= remaining) return new Date(from + remaining);
    remaining -= available;
    cursor = hours[1];
  }
  throw new Error("SLA calendar has no available hours within three years.");
}
export function businessMinutesBetween(start: Date, end: Date, calendar: Calendar) {
  if (end <= start) return 0;
  let day = localDay(start, calendar.timezone), total = 0;
  const last = localDay(end, calendar.timezone);
  for (let i = 0; i < 1100 && day <= last; i++, day = nextDay(day)) {
    const hours = window(day, calendar);
    if (hours) total += Math.max(0, Math.min(end.getTime(), hours[1]) - Math.max(start.getTime(), hours[0]));
  }
  return total / 60000;
}
export function slaState(deadline: Date | null, paused: Date | null, complete: Date | null, warningMinutes = 60, now = new Date()) {
  if (complete) return deadline && complete > deadline ? "BREACHED" : "MET";
  if (paused) return "PAUSED";
  if (!deadline) return "UNSET";
  if (deadline <= now) return "BREACHED";
  return deadline.getTime() - now.getTime() <= warningMinutes * 60000 ? "AT_RISK" : "ON_TRACK";
}
