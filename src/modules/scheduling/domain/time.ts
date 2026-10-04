/** UK rota wall times are explicit, independent of the data server's timezone. */
export function londonDate(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year:"numeric",month:"2-digit",day:"2-digit" }).format(date); }
export function londonTime(date: Date) { return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour:"2-digit",minute:"2-digit",hourCycle:"h23" }).format(date); }
export function londonInstant(day: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Enter valid shift dates and times.");
  const target = new Date(`${day}T${time}:00Z`);
  if (!Number.isFinite(target.getTime())) throw new Error("Enter a valid shift date.");
  // UK offset is either zero or one hour; the earliest match resolves a repeated autumn hour.
  for (const offset of [60,0]) {
    const candidate = new Date(target.getTime() - offset*60000);
    if (londonDate(candidate)===day && londonTime(candidate)===time) return candidate;
  }
  throw new Error("This local time does not exist during the daylight-saving clock change.");
}
export function paidMinutes(startsAt: Date, endsAt: Date, breakMinutes: number) {
  const duration = Math.round((endsAt.getTime()-startsAt.getTime())/60000);
  if (!Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes >= duration || duration <= 0 || duration > 24*60) throw new Error("Shifts must be 0–24 hours, with a break shorter than the shift.");
  return duration-breakMinutes;
}
