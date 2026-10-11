import type { Booking } from "./scheduling";
import type { Shift } from "./calendar";

export type FiniteResource = { id: string; workCentreId: string; name: string; active: boolean; calendarMode: string; timezone: string; holdReason?: string | null; shifts: Shift[]; bookings: Booking[]; downtime: Booking[] };
export type FiniteOperation = { id: string; name: string; durationMinutes: number; waitMinutes: number; timingMode: string; workCentreId: string | null; resourceId: string | null; eligibleResourceIds: string[] };
export type FiniteSlot = { id: string; name: string; resourceId: string | null; workCentreId: string | null; start: Date; end: Date; durationMinutes: number; waitMinutes: number };

/** Convert plant wall time to UTC without depending on the server's timezone.
 * Two candidates cover daylight-saving ambiguity; nonexistent wall time advances
 * to the next valid minute. A shift ending in repeated time uses the later edge. */
function wallDate(day: string, minute: number, timezone: string, end = false): Date {
  const target = new Date(`${day}T00:00:00Z`).getTime() + minute * 60_000;
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const localStamp = (stamp: number) => {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(stamp)).map((p) => [p.type, p.value]));
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  };
  let guess = target;
  for (let i = 0; i < 4; i++) guess += target - localStamp(guess);
  const candidates = [guess - 3_600_000, guess, guess + 3_600_000].filter((stamp) => localStamp(stamp) === target);
  if (candidates.length) return new Date(end ? Math.max(...candidates) : Math.min(...candidates));
  // Spring-forward: use the first representable wall minute after the missing edge.
  for (let i = -120; i <= 120; i++) { const stamp = guess + i * 60_000; if (localStamp(stamp) >= target) return new Date(stamp); }
  throw new Error("This plant calendar contains an invalid local time.");
}

function localParts(date: Date, timezone: string) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA", {timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date).map(p=>[p.type,p.value]));
}
/** Stable server/browser day boundaries, including 23/25-hour plant days. */
export function plantTimeline(after: Date, days: number, timezone: string) {
  if (!Number.isFinite(after.getTime()) || !Number.isInteger(days) || days < 1 || days > 365) throw new Error("Enter a valid calendar window.");
  const p = localParts(after,timezone), day = new Date(`${p.year}-${p.month}-${p.day}T00:00:00Z`);
  return Array.from({length:days+1},(_,index)=>{const d=new Date(day);d.setUTCDate(d.getUTCDate()+index);return wallDate(d.toISOString().slice(0,10),0,timezone);});
}
/** Move a day while retaining the wall-clock start, rather than a host offset. */
export function moveToPlantDay(original: Date, target: Date, timezone: string) {
  const p=localParts(original,timezone), d=localParts(target,timezone);
  if(p.year===d.year&&p.month===d.month&&p.day===d.day)return new Date(original);
  const moved=wallDate(`${d.year}-${d.month}-${d.day}`,Number(p.hour)*60+Number(p.minute),timezone);
  return new Date(moved.getTime()+original.getUTCSeconds()*1000+original.getUTCMilliseconds());
}

function windows(resource: FiniteResource, after: Date, horizon: Date): Booking[] {
  if (resource.holdReason) throw new Error(resource.holdReason);
  if (resource.calendarMode === "CONTINUOUS") return [{ id: "continuous", start: after, end: horizon }];
  if (!resource.shifts.length) throw new Error(`${resource.name} needs working shifts. Configure its calendar or select continuous operation.`);
  const localDay = new Intl.DateTimeFormat("en-CA", { timeZone: resource.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(after);
  const day = new Date(`${localDay}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1); // An overnight shift can already be running.
  const rows: Booking[] = [];
  for (let i = 0; i <= 367 && day.getTime() <= horizon.getTime() + 86_400_000; i++, day.setUTCDate(day.getUTCDate() + 1)) {
    for (const shift of resource.shifts) {
      if (!shift.daysOfWeek.includes(day.getUTCDay())) continue;
      const key = day.toISOString().slice(0, 10);
      const start = wallDate(key, shift.startMinute, resource.timezone);
      const end = wallDate(key, shift.endMinute, resource.timezone, true);
      if (end > after && start < horizon) rows.push({ id: key, start: new Date(Math.max(start.getTime(), after.getTime())), end: new Date(Math.min(end.getTime(), horizon.getTime())) });
    }
  }
  rows.sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Booking[] = [];
  for (const row of rows) {
    const previous = merged.at(-1);
    if (previous && row.start <= previous.end) previous.end = new Date(Math.max(previous.end.getTime(), row.end.getTime()));
    else merged.push({ ...row });
  }
  return merged;
}

export function finiteCapacity(resource: FiniteResource, start: Date, end: Date) {
  const working = windows(resource, start, end);
  const occupiedHours = (rows: Booking[]) => {
    let milliseconds = 0;
    for (const window of working) {
      const intervals = rows.map((r) => [Math.max(r.start.getTime(), window.start.getTime()), Math.min(r.end.getTime(), window.end.getTime())]).filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
      let left = 0, right = 0;
      for (const [a, b] of intervals) { if (a > right) { milliseconds += Math.max(0, right - left); left = a; right = b; } else right = Math.max(right, b); }
      milliseconds += Math.max(0, right - left);
    }
    return milliseconds / 3_600_000;
  };
  const calendarHours = working.reduce((sum, w) => sum + (w.end.getTime() - w.start.getTime()) / 3_600_000, 0);
  const downtimeHours = occupiedHours(resource.downtime);
  const bookedHours = occupiedHours(resource.bookings);
  const unavailableHours = occupiedHours([...resource.bookings, ...resource.downtime]);
  return { calendarHours, downtimeHours, bookedHours, freeHours: Math.max(0, calendarHours - unavailableHours), conflicts: resource.bookings.filter((b) => b.start < end && b.end > start && resource.downtime.some((d) => b.start < d.end && d.start < b.end)).length };
}

/** An operation reserves its whole elapsed span, including closed shift gaps.
 * Kiln batches are uninterrupted; per-unit work can pause between shifts. */
export function finiteSlot(resource: FiniteResource, minutes: number, after: Date, uninterrupted: boolean, horizon: Date) {
  if (!Number.isFinite(minutes) || minutes <= 0 || !Number.isFinite(after.getTime())) throw new Error("Enter a valid scheduling time and duration.");
  const working = windows(resource, after, horizon);
  const blocked = [...resource.bookings, ...resource.downtime].sort((a, b) => a.start.getTime() - b.start.getTime());
  let cursor = after.getTime();
  for (let attempt = 0; attempt < blocked.length + working.length + 2; attempt++) {
    let remaining = minutes * 60_000; let start: number | null = null; let finish: number | null = null;
    for (const window of working) {
      const at = Math.max(cursor, window.start.getTime());
      const available = window.end.getTime() - at;
      if (available <= 0 || uninterrupted && available < remaining) continue;
      if (start === null) start = at;
      if (available >= remaining) { finish = at + remaining; break; }
      remaining -= available;
    }
    if (start === null || finish === null) break;
    const conflict = blocked.find((row) => row.start.getTime() < finish! && row.end.getTime() > start!);
    if (!conflict) return { start: new Date(start), end: new Date(finish) };
    cursor = conflict.end.getTime();
  }
  throw new Error(`${resource.name} has no feasible slot within the planning horizon. Review its shifts, batch duration and downtime.`);
}

export function finiteSchedule(operations: FiniteOperation[], after: Date, resources: FiniteResource[], horizonDays = 180): FiniteSlot[] {
  if (!Number.isFinite(after.getTime()) || horizonDays < 1 || horizonDays > 365) throw new Error("Enter a valid scheduling start and horizon.");
  const horizon = new Date(after.getTime() + horizonDays * 86_400_000);
  const pool = resources.map((r) => ({ ...r, bookings: [...r.bookings] }));
  let cursor = new Date(after);
  return operations.map((op) => {
    const eligible = op.eligibleResourceIds.length ? op.eligibleResourceIds : op.resourceId ? [op.resourceId] : [];
    const candidates = pool.filter((r) => r.active && (!op.workCentreId || r.workCentreId === op.workCentreId) && (eligible.length ? eligible.includes(r.id) : r.workCentreId === op.workCentreId));
    if (!candidates.length) {
      if (op.resourceId || op.workCentreId || eligible.length) throw new Error(`${op.name} has no active eligible machine. Review the product routing and plant.`);
      const end = new Date(cursor.getTime() + op.durationMinutes * 60_000);
      const slot = { ...op, start: new Date(cursor), end };
      cursor = new Date(end.getTime() + op.waitMinutes * 60_000); return slot;
    }
    const choices: Array<{ resource: FiniteResource; start: Date; end: Date }> = [];
    for (const resource of candidates) {
      try { choices.push({ resource, ...finiteSlot(resource, op.durationMinutes, cursor, op.timingMode === "BATCH", horizon) }); }
      catch (error) { if (candidates.length === 1) throw error; }
    }
    choices.sort((a, b) => a.end.getTime() - b.end.getTime() || (a.resource.id === op.resourceId ? -1 : b.resource.id === op.resourceId ? 1 : a.resource.id.localeCompare(b.resource.id)));
    const chosen = choices[0];
    if (!chosen) throw new Error(`${op.name} has no feasible eligible machine in the planning horizon.`);
    chosen.resource.bookings.push({ id: op.id, start: chosen.start, end: chosen.end });
    cursor = new Date(chosen.end.getTime() + op.waitMinutes * 60_000);
    return { ...op, resourceId: chosen.resource.id, workCentreId: chosen.resource.workCentreId, start: chosen.start, end: chosen.end };
  });
}
