import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { schedulerBoard, machineCapacity, capacityByWorkCentre } from "@/modules/manufacturing/services/queries";
import { listShifts } from "@/modules/manufacturing/services/shifts";
import { SchedulerBoard } from "./scheduler-board";
import { ShiftsEditor } from "./shifts-editor";

export default async function SchedulePage() {
  const session = await requireSession();
  assertCapability(session, C.scheduleRead);
  const editable = session.capabilities.has(C.scheduleManage);
  const canLock = session.capabilities.has(C.scheduleLock);
  const canManageShifts = session.capabilities.has(C.resourceManage);
  const [board, capacity, shiftData, machines] = await Promise.all([
    schedulerBoard(session.organisationId, 14, session.capabilities.has("sales.order.read") && session.capabilities.has("customers.read")),
    capacityByWorkCentre(session.organisationId),
    listShifts(session.organisationId),
    machineCapacity(session.organisationId),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">
          {editable
            ? "Drag a step onto a new day or resource. You'll see the impact — conflicts, dependent steps, and customer delivery — before it's confirmed. The preview fits every affected step around eligible machines, calendars, downtime and existing bookings. Confirmation updates Produce and Shop Floor together."
            : "This is the published production schedule. Planners can drag steps to reschedule them; you're seeing it read-only."}
        </p>
      </header>

      <section className="rounded-3xl border border-blue-100 bg-[var(--color-surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-lg font-semibold">Machine availability · next 7 days</h2><Link href="/manufacturing/plant" className="text-sm font-semibold text-blue-600">Plant &amp; downtime →</Link></div>
        <p className="mt-1 text-xs text-slate-500">Working hours in each machine&apos;s timezone, less downtime and existing bookings. Throughput work can pause between shifts; machine batch cycles reserve an uninterrupted span.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{machines.map(m=><article key={m.id} className="rounded-2xl border border-blue-100 bg-white p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{m.name}</h3><span className="text-xs text-slate-500">{m.calendarMode==="CONTINUOUS"?"24/7":"Shifts"}</span></div>{m.error?<p className="mt-3 text-sm text-amber-700">{m.error}</p>:<><div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-50"><div className="h-full rounded-full bg-blue-500" style={{width:`${Math.min(100,m.calendarHours?m.bookedHours/m.calendarHours*100:0)}%`}}/></div><div className="mt-3 flex justify-between text-xs"><span className="font-semibold text-blue-700">{m.freeHours.toFixed(1)}h free</span><span className="text-slate-500">{m.bookedHours.toFixed(1)}h booked · {m.downtimeHours.toFixed(1)}h downtime</span></div>{m.conflicts>0&&<p className="mt-2 text-xs font-semibold text-red-600">{m.conflicts} existing bookings overlap downtime. Review and reschedule.</p>}</>}</article>)}</div>
        {!machines.length&&<p className="mt-4 text-sm text-slate-500">Configure the machinery in Plant to calculate finite availability.</p>}
      </section>

      <SchedulerBoard rows={board.rows} unassigned={board.unassigned} windowStart={board.windowStart} windowDays={14} editable={editable} canLock={canLock} />

      <section className="space-y-4">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-ink-faint)]">Rough labour capacity this week</h2>
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
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-ink-faint)]">Shifts &amp; man-hours</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-ink-muted)]">
            Set the local working hours for each work centre or specific machine. Overnight shifts end on the following day. Resource-specific shifts take precedence over centre shifts. Machines using shift hours need a calendar before scheduling; continuous machines run 24/7. The labour summary above remains a rough centre estimate.
          </p>
        </div>
        <ShiftsEditor workCentres={shiftData.workCentres} resources={shiftData.resources} shifts={shiftData.shifts} canManage={canManageShifts} />
      </section>
    </div>
  );
}
