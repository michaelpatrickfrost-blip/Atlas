/** People-planning maths. Hours, traffic, holiday limits and cover stay deterministic here. */

export const WORK_CATEGORIES = ["OFFICE", "PRODUCTION", "CONTACT", "FIELD", "TRAINING", "ON_CALL", "OTHER"] as const;
export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export const WORK_CATEGORY_LABEL: Record<WorkCategory, string> = {
  OFFICE: "Office",
  PRODUCTION: "Production",
  CONTACT: "Contact centre",
  FIELD: "Field",
  TRAINING: "Training",
  ON_CALL: "On call",
  OTHER: "Other",
};

export const STANDARD_WORK_TYPES: Array<{ name: string; category: WorkCategory; startTime: string; endTime: string; breakMinutes: number; weekdays: number[] }> = [
  { name: "Office hours", category: "OFFICE", startTime: "09:00", endTime: "17:30", breakMinutes: 30, weekdays: [1, 2, 3, 4, 5] },
  { name: "Production early", category: "PRODUCTION", startTime: "06:00", endTime: "14:00", breakMinutes: 30, weekdays: [1, 2, 3, 4, 5] },
  { name: "Production late", category: "PRODUCTION", startTime: "14:00", endTime: "22:00", breakMinutes: 30, weekdays: [1, 2, 3, 4, 5] },
  { name: "Production night", category: "PRODUCTION", startTime: "22:00", endTime: "06:00", breakMinutes: 30, weekdays: [1, 2, 3, 4, 5] },
  { name: "Contact centre", category: "CONTACT", startTime: "08:00", endTime: "16:00", breakMinutes: 30, weekdays: [1, 2, 3, 4, 5] },
  { name: "Contact centre late", category: "CONTACT", startTime: "12:00", endTime: "20:00", breakMinutes: 30, weekdays: [1, 2, 3, 4, 5] },
];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function monthKey(input: string) {
  const match = /^(\d{4})-(\d{2})/.exec(input);
  if (!match) throw new Error("Choose a month.");
  const month = `${match[1]}-${match[2]}`;
  const start = new Date(`${month}-01T00:00:00Z`);
  if (start.toISOString().slice(0, 7) !== month) throw new Error("Choose a valid month.");
  return month;
}

export function eachDate(start: Date, end: Date) {
  if (end < start) throw new Error("The end date is before the start.");
  const days: string[] = [];
  for (let time = start.getTime(); time <= end.getTime() && days.length <= 366; time += 86400000) days.push(new Date(time).toISOString().slice(0, 10));
  if (days.length > 366) throw new Error("Choose a period of no more than one year.");
  return days;
}

export function monthDates(month: string) {
  const start = new Date(`${monthKey(month)}-01T00:00:00Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  return eachDate(start, end);
}

export function weekdayOf(day: string) {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

export function datesForWeekdays(days: string[], weekdays: number[]) {
  return days.filter((day) => weekdays.includes(weekdayOf(day)));
}

export function shiftSpanMinutes(startTime: string, endTime: string) {
  if (!TIME.test(startTime) || !TIME.test(endTime)) throw new Error("Enter hours as 00:00 to 23:59.");
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 1440;
  const span = end - start;
  if (span <= 0 || span > 1440) throw new Error("A work pattern must be between 1 minute and 24 hours.");
  return span;
}

export function patternPaidMinutes(startTime: string, endTime: string, breakMinutes: number) {
  const span = shiftSpanMinutes(startTime, endTime);
  if (!Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes >= span) throw new Error("The unpaid break must be shorter than the work pattern.");
  return span - breakMinutes;
}

/** Direct man-minutes win. Otherwise traffic × handle time, grossed up for shrinkage. */
export function requiredManMinutes(input: { requiredMinutes: number | null; forecastVolume: number | null; minutesPerUnit: number | null; shrinkagePercent: number }) {
  if (input.requiredMinutes != null) {
    if (!Number.isInteger(input.requiredMinutes) || input.requiredMinutes < 0 || input.requiredMinutes > 60000000) throw new Error("Enter man-hours between 0 and 1,000,000.");
    return input.requiredMinutes;
  }
  if (input.forecastVolume == null && input.minutesPerUnit == null) return null;
  if (input.forecastVolume == null || input.minutesPerUnit == null) throw new Error("Traffic needs both a volume and the minutes each one takes.");
  if (!Number.isFinite(input.forecastVolume) || input.forecastVolume < 0 || input.forecastVolume > 1000000) throw new Error("Enter a traffic volume between 0 and 1,000,000.");
  if (!Number.isInteger(input.minutesPerUnit) || input.minutesPerUnit < 1 || input.minutesPerUnit > 1440) throw new Error("Minutes per item must be between 1 and 1,440.");
  if (!Number.isInteger(input.shrinkagePercent) || input.shrinkagePercent < 0 || input.shrinkagePercent > 80) throw new Error("Shrinkage must be between 0 and 80 percent.");
  const productive = 1 - input.shrinkagePercent / 100;
  return Math.ceil((input.forecastVolume * input.minutesPerUnit) / productive);
}

export function peopleForMinutes(requiredMinutes: number, paidMinutes: number) {
  if (paidMinutes <= 0) return 0;
  return Math.ceil(requiredMinutes / paidMinutes);
}

export type DemandRow = { day: string; teamId: string; department: string; workTypeId: string; requiredMinutes: number | null; forecastVolume: number | null; minutesPerUnit: number | null; shrinkagePercent: number };
export type PlannedShift = { employeeId: string; day: string; minutes: number };

export function dayCoverage(day: string, demands: DemandRow[], shifts: PlannedShift[], absentIds: Set<string>, scope?: { teamId?: string; department?: string }) {
  const rows = demands.filter((row) => row.day === day && (!scope?.teamId || !row.teamId || row.teamId === scope.teamId) && (!scope?.department || !row.department || row.department === scope.department));
  const known = rows.map((row) => requiredManMinutes(row)).filter((value): value is number => value != null);
  const required = known.length ? known.reduce((sum, value) => sum + value, 0) : null;
  const covering = shifts.filter((shift) => shift.day === day && !absentIds.has(shift.employeeId));
  const planned = covering.reduce((sum, shift) => sum + shift.minutes, 0);
  const absentMinutes = shifts.filter((shift) => shift.day === day && absentIds.has(shift.employeeId)).reduce((sum, shift) => sum + shift.minutes, 0);
  const volume = rows.reduce((sum, row) => sum + (row.forecastVolume ?? 0), 0);
  return { required, planned, short: required == null ? null : Math.max(0, required - planned), absentMinutes, volume };
}

export type HolidayPerson = { id: string; department: string | null; teamIds: string[]; days: string[] };
export type HolidayRule = { name: string; startsOn: string; endsOn: string; teamId: string; department: string; maxOffPerDay: number | null; blockHolidays: boolean };

function ruleApplies(rule: HolidayRule, person: { department: string | null; teamIds: string[] }, day: string) {
  if (day < rule.startsOn || day > rule.endsOn) return false;
  if (rule.teamId && !person.teamIds.includes(rule.teamId)) return false;
  if (rule.department && person.department !== rule.department) return false;
  return true;
}

export function holidayBlockReason(person: HolidayPerson, others: HolidayPerson[], rules: HolidayRule[]) {
  for (const day of person.days) {
    for (const rule of rules) {
      if (!ruleApplies(rule, person, day)) continue;
      if (rule.blockHolidays) return `${rule.name} is a busy period. Holiday requests are closed for ${day}.`;
      if (rule.maxOffPerDay != null) {
        const off = others.filter((other) => other.id !== person.id && other.days.includes(day) && ruleApplies(rule, other, day)).length;
        if (off + 1 > rule.maxOffPerDay) return `${rule.name} allows ${rule.maxOffPerDay} people off on ${day}. ${off} already have holiday booked or requested.`;
      }
    }
  }
  return null;
}

export type CoverNeed = { shiftId: string; day: string; minutes: number; teamId: string | null; department: string | null };
export type CoverPerson = { id: string; teamIds: string[]; department: string | null; remainingMinutes: number; absentDays: string[]; busyDays: string[] };

/** Assign each uncovered shift once. The person with the most unused contracted time, on the same team, is chosen first. */
export function planCover(needs: CoverNeed[], people: CoverPerson[]) {
  const assigned = new Set<string>();
  const moves: Array<{ shiftId: string; employeeId: string }> = [];
  const ranked = [...needs].sort((a, b) => b.minutes - a.minutes || a.day.localeCompare(b.day) || a.shiftId.localeCompare(b.shiftId));
  for (const need of ranked) {
    const candidates = people
      .filter((person) => !person.absentDays.includes(need.day) && !person.busyDays.includes(need.day) && !assigned.has(`${person.id}:${need.day}`))
      .filter((person) => (need.teamId ? person.teamIds.includes(need.teamId) : !need.department || person.department === need.department))
      .sort((a, b) => b.remainingMinutes - a.remainingMinutes || a.id.localeCompare(b.id));
    const chosen = candidates[0];
    if (!chosen) continue;
    assigned.add(`${chosen.id}:${need.day}`);
    chosen.remainingMinutes -= need.minutes;
    chosen.busyDays = [...chosen.busyDays, need.day];
    moves.push({ shiftId: need.shiftId, employeeId: chosen.id });
  }
  return moves;
}

export function contractedMonthMinutes(weeklyHours: number, workingDays: number[], days: string[]) {
  if (!workingDays.length || weeklyHours <= 0) return 0;
  const perDay = (weeklyHours * 60) / workingDays.length;
  return Math.round(days.filter((day) => workingDays.includes(weekdayOf(day))).length * perDay);
}
