"use client";

import { ActionForm } from "@/components/ui/action-form";
import { saveShiftAction, deleteShiftAction } from "./shifts-actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Shift = {
  id: string;
  label: string;
  workCentreId: string;
  workCentreName: string;
  resourceId: string | null;
  resourceName: string | null;
  days: string;
  start: string;
  end: string;
  crewCount: number;
};

export function ShiftsEditor({ workCentres, resources, shifts, canManage }: { workCentres: { id: string; name: string }[]; resources: { id: string; name: string; workCentreId: string }[]; shifts: Shift[]; canManage: boolean }) {
  return (
    <div className="space-y-4">
      <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-white">
        {shifts.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">No shifts configured yet.</p>}
        {shifts.map((shift) => (
          <div key={shift.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
            <span>
              {shift.workCentreName}{shift.resourceName ? ` · ${shift.resourceName}` : ""}{shift.label ? ` · ${shift.label}` : ""} — {shift.days}, {shift.start}–{shift.end}, {shift.crewCount} crew
            </span>
            {canManage && (
              <ActionForm action={deleteShiftAction}>
                <input type="hidden" name="shiftId" value={shift.id} />
                <button type="submit" className="text-xs font-semibold text-rose-600">Remove</button>
              </ActionForm>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <ActionForm action={saveShiftAction} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
          <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
            Work centre
            <select name="workCentreId" required className="mt-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
              {workCentres.map((wc) => <option key={wc.id} value={wc.id}>{wc.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
            Machine (optional)
            <select name="resourceId" className="mt-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
              <option value="">Whole work centre</option>
              {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
            Label
            <input type="text" name="label" placeholder="Early shift" className="mt-1 w-32 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          </label>
          <fieldset className="flex flex-col text-xs text-[var(--color-ink-muted)]">
            Days
            <div className="mt-1 flex gap-1">
              {DAYS.map((d, i) => (
                <label key={d} className="flex flex-col items-center gap-1 text-[10px]">
                  {d}
                  <input type="checkbox" name="days" value={d} defaultChecked={i >= 1 && i <= 5} className="size-4" />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
            Start
            <input type="time" name="start" required defaultValue="08:00" className="mt-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
            End
            <input type="time" name="end" required defaultValue="16:00" className="mt-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
            Crew
            <input type="number" name="crewCount" min="1" defaultValue={1} required className="mt-1 w-20 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          </label>
          <button type="submit" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white">Add shift</button>
        </ActionForm>
      )}
    </div>
  );
}
