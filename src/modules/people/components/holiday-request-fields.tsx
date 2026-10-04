"use client";
import { useState } from "react";
import { workingLeaveDays } from "@/modules/people/domain/working-time";

export function HolidayRequestFields({ workingDays, remaining, managerName }: { workingDays: number[]; remaining: number; managerName: string | null }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  let counted: number | null = null;
  if (start && end) {
    try { counted = workingLeaveDays(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`), workingDays); }
    catch { counted = null; }
  }
  const today = new Date().toISOString().slice(0, 10);
  return <>
    <label className="text-sm">First day off<input type="date" name="startDate" required min={today} value={start} onChange={(event) => setStart(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-200 p-3" /></label>
    <label className="text-sm">Last day off<input type="date" name="endDate" required min={start || today} value={end} onChange={(event) => setEnd(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-200 p-3" /></label>
    <p className="text-sm text-slate-600 sm:col-span-2">{counted == null ? "Choose the dates. Working days are counted from your pattern and the request goes to HR." : `${counted} working day${counted === 1 ? "" : "s"}.${counted > remaining ? ` That is more than the ${remaining} you have left.` : ` ${Math.max(0, remaining - counted)} would remain after approval.`}`} {managerName ? `It goes to ${managerName} to approve.` : "It goes to HR to approve."}</p>
  </>;
}
