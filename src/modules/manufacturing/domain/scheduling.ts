// §44-49: a deterministic, explainable forward scheduler — not finite-capacity-aware
// yet (no check against other orders already occupying a work centre/resource; see
// MANUFACTURING_COVERAGE.md). It sequences a routing's operations finish-to-start
// (§20's overlap is a later phase) using setup + run time for the order quantity.

export type OperationSnapshot = {
  name: string;
  position: number;
  setupMinutes: number;
  runMinutesPerUnit: number;
  crewSize: number;
  /** FK to a specific machine (§22-24) — set by the Plant tool on the routing
   * step. Falls back to `workCentreId` (any machine in that work centre) when
   * the step hasn't been pinned to one specific machine. */
  workCentreId: string | null;
  resourceId: string | null;
};

export type ScheduledOperation = OperationSnapshot & { start: Date; end: Date; durationMinutes: number; labourHours: number };

export function forwardSchedule(operations: OperationSnapshot[], quantity: number, startAt: Date): ScheduledOperation[] {
  const ordered = [...operations].sort((a, b) => a.position - b.position);
  let cursor = new Date(startAt);
  return ordered.map((op) => {
    const durationMinutes = Math.max(1, op.setupMinutes + op.runMinutesPerUnit * quantity);
    const start = new Date(cursor);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    cursor = end;
    return { ...op, start, end, durationMinutes, labourHours: (durationMinutes / 60) * Math.max(1, op.crewSize) };
  });
}

/** Total routing duration for a quantity — the product's actual manufacturing
 * lead time (§9's "manufacturing lead time", computed from the real routing
 * rather than held as a separate static field that would drift from it). */
export function totalLeadTimeMinutes(operations: Array<Pick<OperationSnapshot, "setupMinutes" | "runMinutesPerUnit">>, quantity: number): number {
  return operations.reduce((sum, op) => sum + Math.max(1, op.setupMinutes + op.runMinutesPerUnit * quantity), 0);
}

/** §47: never silently overbook a finite resource. Two bookings on the same
 * resource conflict when their [start, end) windows overlap. */
export type Booking = { id: string; start: Date; end: Date };

export function findConflicts(candidate: { start: Date; end: Date }, existing: Booking[], excludeId?: string): Booking[] {
  return existing.filter((b) => b.id !== excludeId && candidate.start < b.end && b.start < candidate.end);
}

/** §47: when the requested slot conflicts, find the next gap on this resource
 * that's big enough, scanning forward from the requested start. */
export function nextFeasibleSlot(durationMinutes: number, after: Date, existing: Booking[], excludeId?: string): Date {
  const bookings = existing.filter((b) => b.id !== excludeId).sort((a, b) => a.start.getTime() - b.start.getTime());
  let candidateStart = new Date(after);
  for (const booking of bookings) {
    const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60_000);
    if (candidateEnd <= booking.start) return candidateStart;
    if (candidateStart < booking.end) candidateStart = new Date(booking.end);
  }
  return candidateStart;
}

/** §52: moving one operation's end time cascades finish-to-start into every
 * later operation of the same routing (the dependency §20 describes as the
 * default, before overlap becomes configurable). Operations before the moved
 * one, and anything already running/complete, are left untouched by the
 * caller — this just recomputes the chain forward from the moved operation. */
export function cascadeFrom(movedEnd: Date, following: Array<{ id: string; durationMinutes: number }>): Array<{ id: string; start: Date; end: Date }> {
  let cursor = new Date(movedEnd);
  return following.map((op) => {
    const start = new Date(cursor);
    const end = new Date(start.getTime() + op.durationMinutes * 60_000);
    cursor = end;
    return { id: op.id, start, end };
  });
}
