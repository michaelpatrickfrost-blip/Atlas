// §25-27: a flexible man-hours/shift calendar. Deliberately simple — no
// holiday-exclusion list or special-shift override yet (see
// MANUFACTURING_COVERAGE.md) — but it is a real weekly-recurring calendar a
// planner configures, not a hardcoded number. Where a work centre/resource has
// no shifts configured at all, callers fall back to a naive placeholder
// (currently 40h/week) rather than reporting zero capacity — configuring
// shifts is an enhancement, not a requirement, to stay usable for a smaller
// manufacturer on day one.

export type Shift = { daysOfWeek: number[]; startMinute: number; endMinute: number; crewCount: number };

/** Man-hours available across all given shifts within [windowStart, windowEnd),
 * walking day by day so a window spanning any number of weeks works. */
export function manHoursInWindow(shifts: Shift[], windowStart: Date, windowEnd: Date): number {
  let total = 0;
  const day = new Date(windowStart);
  day.setHours(0, 0, 0, 0);
  while (day < windowEnd) {
    const dow = day.getDay();
    for (const shift of shifts) {
      if (!shift.daysOfWeek.includes(dow)) continue;
      const shiftStart = new Date(day.getTime() + shift.startMinute * 60_000);
      const shiftEnd = new Date(day.getTime() + shift.endMinute * 60_000);
      const overlapStart = shiftStart < windowStart ? windowStart : shiftStart;
      const overlapEnd = shiftEnd > windowEnd ? windowEnd : shiftEnd;
      if (overlapEnd > overlapStart) total += ((overlapEnd.getTime() - overlapStart.getTime()) / 3_600_000) * Math.max(1, shift.crewCount);
    }
    day.setDate(day.getDate() + 1);
  }
  return total;
}

export function formatMinuteOfDay(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseTimeToMinute(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) throw new Error("Enter a time as HH:MM.");
  return h * 60 + m;
}
