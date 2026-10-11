"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { previewMoveAction, commitMoveAction, toggleLockAction } from "./scheduler-actions";
import { plantTimeline, moveToPlantDay } from "@/modules/manufacturing/domain/finite-scheduling";
import type { ScheduleImpact } from "@/modules/manufacturing/services/scheduler";

type Bar = {
  id: string;
  operationName: string;
  orderId: string;
  orderNumber: string;
  product: string;
  start: Date | null;
  end: Date | null;
  status: string;
  locked: boolean;
  resourceId: string | null;
  workCentreId: string | null;
  requiredDate: Date | null;
  customer: string | null;
  salesOrderReference: string | null;
  materialShort: boolean;
};

type Row = { id: string; kind: "resource" | "work-centre"; timezone: string; name: string; workCentreId: string | null; workCentreName: string; bars: Bar[] };

const STATUS_COLOR: Record<string, string> = {
  WAITING: "bg-slate-200 text-slate-800",
  READY: "bg-sky-200 text-sky-900",
  RUNNING: "bg-amber-300 text-amber-950",
  PAUSED: "bg-amber-100 text-amber-900",
  BLOCKED: "bg-rose-300 text-rose-950",
};

export function SchedulerBoard({ rows, unassigned, windowStart, windowDays, editable, canLock }: { rows: Row[]; unassigned: Bar[]; windowStart: Date; windowDays: number; editable: boolean; canLock: boolean }) {
  const router = useRouter();
  const [timezone,setTimezone] = useState("Europe/London");
  const [pending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ bar: Bar; newStart: Date; resourceId: string | null; workCentreId: string | null; impact: ScheduleImpact } | null>(null);
  const [error, setError] = useState("");

  const dayEdges = useMemo(() => plantTimeline(windowStart,windowDays,timezone),[windowStart,windowDays,timezone]);
  const dayStarts = dayEdges.slice(0,-1);
  const windowStartMs = dayEdges[0].getTime();
  const windowEndMs = dayEdges.at(-1)!.getTime();
  const totalMs = windowEndMs - windowStartMs;

  function pct(date: Date) {
    return Math.min(100, Math.max(0, ((date.getTime() - windowStartMs) / totalMs) * 100));
  }

  function allBarsForRow(row: Row) {
    return row.bars;
  }

  async function handleDrop(row: Row, dayIndex: number, bar: Bar) {
    if (!editable || bar.locked || bar.status === "RUNNING" || bar.status === "PAUSED" || bar.status === "COMPLETE" || !bar.start) return;
    const newStart = moveToPlantDay(bar.start,dayStarts[dayIndex],timezone);
    const resourceId = row.kind === "resource" ? row.id : null;
    const workCentreId = row.workCentreId;
    setError("");
    startTransition(async () => {
      try {
        const impact = await previewMoveAction(bar.id, newStart.toISOString(), resourceId, workCentreId);
        setModal({ bar, newStart, resourceId, workCentreId, impact });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not preview this move.");
      }
    });
  }

  function confirmMove(force: boolean) {
    if (!modal) return;
    const { bar, newStart, resourceId, workCentreId } = modal;
    startTransition(async () => {
      try {
        await commitMoveAction(bar.id, newStart.toISOString(), resourceId, workCentreId, force, modal.impact.previewKey);
        setModal(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not move this step.");
      }
    });
  }

  function toggleLock(bar: Bar) {
    startTransition(async () => {
      try {
        await toggleLockAction(bar.id, !bar.locked);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not change the lock.");
      }
    });
  }

  function renderBar(bar: Bar) {
    if (!bar.start || !bar.end) return null;
    const left = pct(bar.start);
    const width = Math.max(1.5, pct(bar.end) - pct(bar.start));
    const movable = editable && !bar.locked && bar.status !== "RUNNING" && bar.status !== "PAUSED" && bar.status !== "COMPLETE";
    return (
      <div
        key={bar.id}
        draggable={movable}
        onDragStart={(e) => { setDragId(bar.id); e.dataTransfer.setData("text/plain", bar.id); }}
        onDragEnd={() => setDragId(null)}
        title={`${bar.orderNumber} · ${bar.product} · ${bar.operationName}${bar.customer ? ` · ${bar.customer}` : ""}`}
        style={{ left: `${left}%`, width: `${width}%` }}
        className={`absolute top-1 bottom-1 flex items-center gap-1 overflow-hidden rounded-lg px-2 text-[11px] font-medium shadow-sm ${STATUS_COLOR[bar.status] ?? "bg-slate-200"} ${movable ? "cursor-grab" : "cursor-default opacity-90"} ${dragId === bar.id ? "opacity-40" : ""}`}
      >
        {bar.locked && <span title="Locked">🔒</span>}
        {bar.materialShort && <span title="Material short" className="text-rose-700">●</span>}
        <Link href={`/manufacturing/produce/${bar.orderId}`} className="truncate underline-offset-2 hover:underline">{bar.orderNumber} {bar.operationName}</Link>
        {canLock && (
          <button type="button" onClick={(e) => { e.preventDefault(); toggleLock(bar); }} className="ml-auto shrink-0 text-[10px] opacity-70 hover:opacity-100">
            {bar.locked ? "Unlock" : "Lock"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">Timeline timezone<select aria-label="Timeline timezone" className="rounded-xl border border-slate-200 bg-white px-3 py-2" value={timezone} onChange={e=>{setTimezone(e.target.value);setModal(null);}}>{[...new Set(["Europe/London","UTC",...rows.map(r=>r.timezone)])].map(t=><option key={t} value={t}>{t}</option>)}</select><span className="font-normal">Dates and moves use this clock; each machine retains its operating calendar.</span></label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white">
        <div className="min-w-[900px]">
          <div className="flex border-b border-[var(--color-border)] text-[11px] text-[var(--color-ink-faint)]">
            <div className="w-48 shrink-0 px-3 py-2 font-semibold uppercase tracking-wide">Resource</div>
            <div className="relative flex-1">
              <div className="flex">
                {dayStarts.map((d,index) => (
                  <div key={d.toISOString()} style={{width:`${(dayEdges[index+1].getTime()-d.getTime())/totalMs*100}%`}} className="border-l border-[var(--color-border)] px-2 py-2 text-center">
                    {d.toLocaleDateString("en-GB", { timeZone: timezone, weekday: "short", day: "numeric", month: "short" })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {rows.map((row) => (
            <div key={row.id} className="flex border-b border-[var(--color-border)] last:border-b-0">
              <div className="w-48 shrink-0 px-3 py-4 text-sm">
                <p className="font-medium">{row.name}</p>
                {row.kind === "resource" && <p className="text-xs text-[var(--color-ink-faint)]">{row.workCentreName}</p>}
              </div>
              <div className="relative flex-1" style={{ minHeight: 56 }}>
                <div className="pointer-events-none absolute inset-0 flex">
                  {dayStarts.map((d, i) => (
                    <div
                      key={i}
                      style={{width:`${(dayEdges[i+1].getTime()-d.getTime())/totalMs*100}%`}} className="pointer-events-auto border-l border-[var(--color-border)]"
                      onDragOver={(e) => editable && e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("text/plain");
                        const bar = allBarsForRow(row).find((b) => b.id === id) ?? rows.flatMap((r) => r.bars).find((b) => b.id === id);
                        if (bar) handleDrop(row, i, bar);
                      }}
                    />
                  ))}
                </div>
                {row.bars.map(renderBar)}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">No work centres or resources yet.</p>}
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-semibold text-rose-700">Scheduled with no work centre</p>
          <ul className="mt-2 space-y-1 text-sm text-rose-700">
            {unassigned.map((b) => <li key={b.id}>{b.orderNumber} · {b.product} · {b.operationName}</li>)}
          </ul>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Move {modal.bar.orderNumber} — {modal.bar.operationName}</h3>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Feasible start {modal.impact.proposedStart.toLocaleString("en-GB", { timeZone: timezone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>

            {modal.impact.suggestedStart && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">The requested slot is unavailable. The preview uses the next feasible start after existing bookings, downtime and closed shifts.</p>}
            <p className="mt-2 text-xs text-slate-500">Finishes {modal.impact.proposedEnd.toLocaleString("en-GB",{timeZone:timezone})}. Cooling and transfer waits are included where configured.</p>

            {modal.impact.missesRequiredDate && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                This will make the customer delivery late{modal.impact.customer ? ` for ${modal.impact.customer} (${modal.impact.salesOrderReference})` : ""}
                {modal.impact.requiredDate && <> — required {new Date(modal.impact.requiredDate).toLocaleDateString("en-GB",{timeZone:timezone})}, now finishing {modal.impact.newFinish && new Date(modal.impact.newFinish).toLocaleDateString("en-GB",{timeZone:timezone})}</>}.
              </p>
            )}

            {modal.impact.cascade.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium">{modal.impact.cascade.length} later step{modal.impact.cascade.length === 1 ? "" : "s"} will also move:</p>
                <ul className="mt-1 space-y-0.5 text-[var(--color-ink-muted)]">
                  {modal.impact.cascade.map((c) => <li key={c.workOrderId}>{c.operationName}{c.resourceName&&` · ${c.resourceName}`} → {c.start.toLocaleString("en-GB", { timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit" })}</li>)}
                </ul>
              </div>
            )}

            {modal.impact.conflicts.length === 0 && !modal.impact.missesRequiredDate && modal.impact.cascade.length === 0 && (
              <p className="mt-3 text-sm text-emerald-700">No machine conflicts. Review material readiness before promising delivery.</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={pending} onClick={() => setModal(null)} className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" disabled={pending} onClick={() => confirmMove(false)} className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white">Confirm feasible move</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
