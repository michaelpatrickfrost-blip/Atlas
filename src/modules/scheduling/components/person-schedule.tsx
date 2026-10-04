import { londonDate, londonTime } from "@/modules/scheduling/domain/time";
import { WORK_CATEGORY_LABEL, type WorkCategory } from "@/modules/scheduling/domain/planner";

type Shift = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  breakMinutes: number;
  status: string;
  role: string | null;
  location: string | null;
  workType: { name: string; category: string } | null;
  team: { name: string } | null;
};

function paidHours(shift: Shift) {
  return Math.max(0, (shift.endsAt.getTime() - shift.startsAt.getTime()) / 3600000 - shift.breakMinutes / 60);
}

export function PersonSchedule({ shifts, heading = "Your schedule" }: { shifts: Shift[]; heading?: string }) {
  const groups = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const day = londonDate(shift.startsAt);
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    const key = date.toISOString().slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), shift]);
  }
  const weeks = [...groups.entries()];
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
    <div><h2 className="text-sm font-semibold">{heading}</h2><p className="mt-1 text-xs text-slate-500">Published shifts from the people planner, including the work pattern and team.</p></div>
    {!weeks.length && <p className="text-sm text-slate-500">Nothing is published yet. When your team plan is published, the days and hours show up here.</p>}
    {weeks.map(([week, rows]) => <div key={week}><p className="text-xs font-medium text-slate-400">Week of {new Date(`${week}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}</p><ul className="mt-2 divide-y divide-slate-100">{rows.map((shift) => <li key={shift.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"><span>{new Date(`${londonDate(shift.startsAt)}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })} · {londonTime(shift.startsAt)}–{londonTime(shift.endsAt)}</span><span className="text-slate-500">{shift.workType?.name ?? shift.role ?? "Shift"}{shift.team ? ` · ${shift.team.name}` : ""}{shift.workType ? ` · ${WORK_CATEGORY_LABEL[shift.workType.category as WorkCategory] ?? shift.workType.category}` : ""} · {paidHours(shift).toFixed(1)}h{shift.status === "SCHEDULED" ? " · Draft" : ""}{shift.location ? ` · ${shift.location}` : ""}</span></li>)}</ul></div>)}
  </section>;
}
