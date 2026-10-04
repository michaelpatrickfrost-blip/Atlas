export function dateOnly(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) throw new Error("Enter a valid date.");
  const date = new Date(`${input}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== input) throw new Error("Enter a valid date.");
  return date;
}
export function mondayOf(input: Date) {
  const d = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d;
}
export function addDays(date: Date, days: number) { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d; }
export function workingLeaveDays(start: Date, end: Date, days = [1,2,3,4,5]) {
  if (end < start || end.getTime() - start.getTime() > 366 * 86400000) throw new Error("Choose a leave period of no more than one year.");
  let total = 0;
  for (let date = new Date(start); date <= end; date = addDays(date, 1)) if (days.includes(date.getUTCDay())) total++;
  return total;
}
export function hoursToMinutes(value: string) {
  const hours = Number(value || 0);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24 || !Number.isInteger(hours * 4)) throw new Error("Daily hours must be 0–24 in quarter-hour increments.");
  return Math.round(hours * 60);
}
