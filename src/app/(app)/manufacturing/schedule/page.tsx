import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { schedulerBoard, capacityByWorkCentre } from "@/modules/manufacturing/services/queries";
import { listShifts } from "@/modules/manufacturing/services/shifts";
import { SchedulerBoard } from "./scheduler-board";
import { ShiftsEditor } from "./shifts-editor";

export default async function SchedulePage() {
  const session = await requireSession();
  assertCapability(session, C.scheduleRead);
  const editable = session.capabilities.has(C.scheduleManage);
  const canLock = session.capabilities.has(C.scheduleLock);
  const canManageShifts = session.capabilities.has(C.resourceManage);
  const [board, capacity, shiftData] = await Promise.all([
    schedulerBoard(session.organisationId, 14),
    capacityByWorkCentre(session.organisationId),
    listShifts(session.organisationId),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">
          {editable
            ? "Drag a step onto a new day or resource. You'll see the impact — conflicts, dependent steps, and customer delivery — before it's confirmed. Moves apply immediately and are visible on Produce and Shop Floor straight away."
            : "This is the published production schedule. Planners can drag steps to reschedule them; you're seeing it read-only."}
        </p>
      </header>

      <SchedulerBoard rows={board.rows} unassigned={board.unassigned} windowStart={board.windowStart} windowDays={14} editable={editable} canLock={canLock} />

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Capacity this week</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {capacity.map((c) => (
            <div key={c.id} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
              <p className="font-medium">{c.name}</p>
              <p className={`text-sm ${c.overloadHours > 0 ? "text-rose-600 font-semibold" : "text-[var(--color-ink-muted)]"}`}>
                {c.labourHours}h labour / {c.theoreticalHours}h available{c.overloadHours > 0 ? ` · overloaded by ${c.overloadHours}h` : ""}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                {c.scheduledHours}h machine time{!c.usingConfiguredShifts ? " · using a default 40h/week estimate — set this centre's shifts below for a real figure" : " · from configured shifts"}
              </p>
            </div>
          ))}
          {capacity.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No work centres yet.</p>}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Shifts &amp; man-hours</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-ink-muted)]">
            A flexible working-hours calendar — which days a work centre (or one specific machine) runs, the
            hours, and how many people crew it. Optional: anything without shifts configured falls back to a
            40h/week estimate above. The planner can still schedule outside these hours if needed — nothing
            here blocks a move, it only makes the capacity numbers real.
          </p>
        </div>
        <ShiftsEditor workCentres={shiftData.workCentres} resources={shiftData.resources} shifts={shiftData.shifts} canManage={canManageShifts} />
      </section>
    </div>
  );
}
