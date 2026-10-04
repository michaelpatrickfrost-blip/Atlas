"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { saveGoal } from "@/app/(app)/kpis/actions";
import { formatGoalValue, judgeGoal, readActual } from "@/modules/kpis/domain/progress";
import type { MeasureChoice } from "@/modules/kpis/services/workspace";
import { GoalMeter } from "./goal-meter";

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm";
const kinds = [
  { id: "department", group: "Shared", title: "Department result", detail: "Scored from a live measure and shown under that chart on dashboards." },
  { id: "team", group: "Shared", title: "Team target", detail: "A number for one team. Link a measure when the figure already lives in another app." },
  { id: "personal", group: "One person", title: "Personal goal", detail: "Sits on that person's profile. They update their own progress." },
  { id: "development", group: "One person", title: "Development plan", detail: "A set of growth goals, with support and a review date." },
  { id: "pip", group: "One person", title: "Performance improvement", detail: "A formal plan. The person, their manager and HR can see it. It is not put on a shared dashboard." },
] as const;

export function GoalForm({ measures, people, members, initialKind, employeeId, personLabel, self }: {
  measures: MeasureChoice[];
  people: { id: string; firstName: string; lastName: string; jobTitle: string; department: string | null }[];
  members: { userId: string; name: string }[];
  initialKind: string;
  employeeId: string;
  personLabel: string;
  self: boolean;
}) {
  const allowed = self ? kinds.filter((item) => item.id === "personal") : kinds;
  const [kind, setKind] = useState(allowed.some((item) => item.id === initialKind) ? initialKind : allowed[0].id);
  const personal = kind === "personal" || kind === "pip" || kind === "development";
  const subjects = [...new Set(measures.map((item) => item.subject))];
  const [subject, setSubject] = useState(subjects[0] ?? "");
  const pool = measures.filter((item) => item.subject === subject);
  const [metricId, setMetricId] = useState("");
  const metric = pool.find((item) => item.id === metricId);
  const [slice, setSlice] = useState("");
  const [target, setTarget] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [direction, setDirection] = useState<"AT_LEAST" | "AT_MOST">("AT_LEAST");
  const preview = (() => {
    if (!metric) return null;
    const reading = readActual(metric.points, metric.unit, slice);
    const amount = Number(target);
    if (!Number.isFinite(amount) || !startsAt || !endsAt) return { reading, judged: null as null };
    const stored = metric.unit === "money" ? Math.round(amount * 100) : amount;
    const judged = judgeGoal({ actual: reading.blocked ? null : reading.actual, blocked: reading.blocked, target: stored, direction, startsAt: new Date(`${startsAt}T00:00:00Z`), endsAt: new Date(`${endsAt}T00:00:00Z`), snapshot: metric.snapshot, unit: metric.unit, currency: reading.currency || slice });
    return { reading, judged };
  })();
  const needsPerson = personal && !self && !employeeId;
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
    <ActionForm action={saveGoal} className="space-y-6 rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="self" value={self ? "1" : ""} />
      {employeeId && <input type="hidden" name="employeeId" value={employeeId} />}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">What kind of goal is this?</legend>
        <div className="grid gap-2 sm:grid-cols-2">{allowed.map((item) => <button key={item.id} type="button" onClick={() => setKind(item.id)} className={`rounded-2xl border p-4 text-left ${kind === item.id ? "border-[var(--color-atlas-blue)] bg-blue-50" : "border-[var(--color-border)]"}`}><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.group}</span><span className="mt-1 block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs leading-relaxed text-[var(--color-ink-muted)]">{item.detail}</span></button>)}</div>
      </fieldset>
      {needsPerson && <label className="block text-sm">Person<select name="employeeId" required className={field} defaultValue=""><option value="">Choose a person</option>{people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName} · {person.jobTitle}</option>)}</select></label>}
      {(employeeId || self) && <p className="text-sm text-[var(--color-ink-muted)]">{self ? "This goal is for you and appears on your profile." : `This goal is for ${personLabel || "the person you opened"}. It appears on their profile and in Goals.`}</p>}
      {(kind === "pip" || kind === "development") && <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">Plan title<input name="planTitle" className={field} placeholder={kind === "pip" ? "Performance improvement plan" : "Development plan"} /></label>
        <label className="text-sm sm:col-span-2">Why this plan is needed<textarea name="reason" required minLength={10} rows={4} className={field} placeholder="What needs to change, and what has already been tried." /></label>
        <label className="text-sm sm:col-span-2">Support the company will give<textarea name="support" rows={3} className={field} placeholder="Coaching, training, time, or a change in workload." /></label>
        <label className="text-sm">Review date<input type="date" name="reviewOn" required className={field} /></label>
      </div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">{kind === "pip" || kind === "development" ? "First goal" : "Goal"}<input name="name" required maxLength={150} className={field} placeholder={kind === "department" ? "Confirmed orders this quarter" : "What done looks like"} /></label>
        {kind === "team" && <label className="text-sm">Team<input name="teamName" required maxLength={100} className={field} /></label>}
        <label className="text-sm">Owner<select name="ownerUserId" className={field} defaultValue={members[0]?.userId ?? ""}>{members.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select></label>
        {(kind === "department" || kind === "team" || personal) && measures.length > 0 && <label className="text-sm">App<select className={field} value={subject} onChange={(event) => { setSubject(event.target.value); setMetricId(""); setSlice(""); }}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>}
        {measures.length > 0 && <label className="text-sm sm:col-span-2">{kind === "department" ? "Live measure" : "Link a live measure"}<select name="metricId" required={kind === "department"} className={field} value={metricId} onChange={(event) => { setMetricId(event.target.value); setSlice(""); }}><option value="">{kind === "department" ? "Choose a measure" : "No live measure — progress is recorded by hand"}</option>{pool.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {metric && <label className="text-sm sm:col-span-2">Which part of the measure counts?<select name="sliceLabel" className={field} value={slice} onChange={(event) => setSlice(event.target.value)}><option value="">The whole measure</option>{metric.points.map((point) => <option key={point.label} value={point.label}>{point.label} · {formatGoalValue(point.value, metric.unit, metric.unit === "money" ? point.label : undefined)}</option>)}</select></label>}
        {!metric && <label className="text-sm">Unit<input name="unit" defaultValue="count" maxLength={30} className={field} /></label>}
        <label className="text-sm">Success means<select name="direction" className={field} value={direction} onChange={(event) => setDirection(event.target.value === "AT_MOST" ? "AT_MOST" : "AT_LEAST")}><option value="AT_LEAST">Reach at least the target</option><option value="AT_MOST">Stay at or under the target</option></select></label>
        <label className="text-sm">{metric?.unit === "money" ? "Target amount (£)" : "Target"}<input name="target" required type="number" min={0} step="any" value={target} onChange={(event) => setTarget(event.target.value)} className={field} /></label>
        <label className="text-sm">Starts<input type="date" name="startsAt" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={field} /></label>
        <label className="text-sm">Ends<input type="date" name="endsAt" required value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={field} /></label>
        <label className="text-sm sm:col-span-2">How we will know<textarea name="notes" rows={3} className={field} placeholder="The evidence, the customer, or the behaviour that shows this is done." /></label>
      </div>
      <Button type="submit" variant="primary">{kind === "pip" ? "Open the performance plan" : kind === "development" ? "Open the development plan" : "Set the goal"}</Button>
    </ActionForm>
    <aside className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="text-sm font-semibold">What this will do</h3>
      {kind === "department" || (kind === "team" && metric) ? <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">Dashboards that show this measure will put the target under the chart. The scorecard uses the dates you choose. A board can still be filtered to 30, 90 or 365 days, and it says so.</p> : <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">Personal and improvement goals stay with that person, their manager and HR. They show on the profile and in Goals. They are not drawn on a company dashboard.</p>}
      {metric ? <div className="space-y-3 border-t border-[var(--color-border)] pt-4 text-sm">
        <p className="font-semibold">{metric.subject} · {metric.name}</p>
        <p className="leading-relaxed text-[var(--color-ink-muted)]">{metric.definition}</p>
        <p className="text-xs text-[var(--color-ink-muted)]">{metric.grain}. {metric.snapshot ? "This is a current position." : "The preview uses the last 90 days."}</p>
        {preview?.judged && preview.reading.actual !== null && <GoalMeter actual={preview.reading.actual} target={metric.unit === "money" ? Math.round(Number(target) * 100) : Number(target)} elapsed={preview.judged.elapsed} verdict={preview.judged.verdict} unit={metric.unit} currency={preview.reading.currency || slice} summary={preview.judged.summary} />}
        {!preview?.judged && <p className="text-xs text-[var(--color-ink-muted)]">Enter a target and the dates to see pace against the current figure.</p>}
      </div> : <p className="border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-ink-muted)]">Without a live measure, progress is the number the person or their manager records, with a note each time.</p>}
    </aside>
  </div>;
}
