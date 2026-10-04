export const PERSON_COLOURS = ["#2563eb", "#0f766e", "#b45309", "#6d28d9", "#be123c", "#0369a1", "#3f6212", "#9a3412"] as const;

export const PLACE_LABELS = { OFFICE: "In the office", HOME: "At home", SITE: "On site", TRAVEL: "Travelling" } as const;
export const MOMENT_LABELS = { MEETING: "Meeting", DEADLINE: "Deadline", AWAY_DAY: "Away day" } as const;

export type AwayKind = "holiday" | "leave" | "off" | "requested";

export function londonKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function dateKey(value: Date): string {
  if (value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0) return value.toISOString().slice(0, 10);
  return londonKey(value);
}

export function parseMonth(value: string | undefined, today = londonKey(new Date())): { year: number; month: number; key: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)), key: today.slice(0, 7) };
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return parseMonth(undefined, today);
  return { year, month, key: `${match[1]}-${match[2]}` };
}

export function shiftMonth(key: string, by: number): string {
  const { year, month } = parseMonth(key);
  const date = new Date(Date.UTC(year, month - 1 + by, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type CalendarCell = { key: string; inMonth: boolean; weekday: number };

export function monthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = [];
  for (let index = 0; index < lead; index += 1) {
    const date = new Date(Date.UTC(year, month - 1, 1 - (lead - index)));
    cells.push({ key: date.toISOString().slice(0, 10), inMonth: false, weekday: index });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({
      key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      inMonth: true,
      weekday: (lead + day - 1) % 7,
    });
  }
  while (cells.length % 7 !== 0) {
    const previous = new Date(`${cells[cells.length - 1]!.key}T00:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() + 1);
    cells.push({ key: previous.toISOString().slice(0, 10), inMonth: false, weekday: cells.length % 7 });
  }
  return cells;
}

export function weekdayNumber(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  const js = new Date(Date.UTC(year!, month! - 1, day)).getUTCDay();
  return js === 0 ? 7 : js;
}

export function spansDay(start: Date, end: Date, key: string): boolean {
  return dateKey(start) <= key && key <= dateKey(end);
}

export function awayKind(type: string, status: string): AwayKind | null {
  if (status === "REJECTED" || status === "CANCELLED") return null;
  if (status === "PENDING") return type === "HOLIDAY" || type === "UNPAID" ? "requested" : null;
  if (status !== "APPROVED") return null;
  if (type === "HOLIDAY") return "holiday";
  if (type === "SICKNESS") return "off";
  if (type === "UNPAID" || type === "COMPASSIONATE" || type === "MATERNITY_PATERNITY" || type === "OTHER") return "leave";
  return null;
}

export function awayLabel(kind: AwayKind): string {
  if (kind === "holiday") return "Holiday";
  if (kind === "requested") return "Requested";
  if (kind === "off") return "Off";
  return "Leave";
}

export function isWorking(workingDays: number[], key: string): boolean {
  const days = workingDays.length ? workingDays : [1, 2, 3, 4, 5];
  return days.includes(weekdayNumber(key));
}

const AWAY_RANK: Record<AwayKind, number> = { off: 4, holiday: 3, leave: 2, requested: 1 };

export function personAway(absences: Array<{ type: string; status: string; start: Date; end: Date }>, key: string): AwayKind | null {
  let away: AwayKind | null = null;
  for (const absence of absences) {
    if (!spansDay(absence.start, absence.end, key)) continue;
    const kind = awayKind(absence.type, absence.status);
    if (kind && (away === null || AWAY_RANK[kind] > AWAY_RANK[away])) away = kind;
  }
  return away;
}

export function countsAsAway(kind: AwayKind | null): boolean {
  return kind === "holiday" || kind === "leave" || kind === "off";
}

export function thinDay(available: number, working: number): boolean {
  if (working < 2) return false;
  return available / working < 0.5;
}

export function taskClashes(dueOn: string | null, away: AwayKind | null): boolean {
  return Boolean(dueOn && countsAsAway(away));
}

export function anniversary(start: Date, year: number, month: number): { key: string; years: number } | null {
  const key = dateKey(start);
  if (Number(key.slice(5, 7)) !== month) return null;
  const years = year - Number(key.slice(0, 4));
  if (years < 1) return null;
  return { key: `${year}-${key.slice(5)}`, years };
}

export function monthTitle(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function dayTitle(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day)).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function shortDay(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day)).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function addDays(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function civilDate(key: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error("Enter a valid date.");
  return new Date(`${key}T00:00:00.000Z`);
}

export function dateRange(start: string, end: string): { startsOn: Date; endsOn: Date } {
  const startsOn = civilDate(start);
  const endsOn = civilDate(end || start);
  if (dateKey(endsOn) < dateKey(startsOn)) throw new Error("The end date is before the start date.");
  return { startsOn, endsOn };
}

export function personColour(index: number): string {
  return PERSON_COLOURS[index % PERSON_COLOURS.length]!;
}

export function displayName(person: { preferredName?: string | null; firstName: string; lastName: string }): string {
  return `${person.preferredName?.trim() || person.firstName} ${person.lastName}`.trim();
}
