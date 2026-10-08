"use client";
import { useState } from "react";
import { GoalActionForm as ActionForm } from "./action-form";
import { Button } from "@/components/ui/button";
import { saveGoal } from "@/app/(app)/kpis/actions";
import { formatGoalValue, readActual } from "@/modules/kpis/domain/progress";
import type { MeasureChoice } from "@/modules/kpis/services/workspace";

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm";
const kinds = [
  { id: "department", group: "Shared", title: "Department result", detail: "Scored from a live measure and shown under that chart on dashboards." },
  { id: "team", group: "Shared", title: "Team target", detail: "A number for one team. Link a measure when the figure already lives in another app." },
  { id: "personal", group: "One person", title: "Personal goal", detail: "Sits on that person's profile. They update their own progress." },
  { id: "development", group: "One person", title: "Development plan", detail: "A set of growth goals, with support and a review date." },
  { id: "pip", group: "One person", title: "Performance improvement", detail: "A formal plan. The person, their manager and HR can see it. It is not put on a shared dashboard." },
] as const;

export function GoalForm({ measures, people, members, initialKind, employeeId, personLabel, self, initialMetricId = "" }: {
  measures: MeasureChoice[];
  people: { id: string; firstName: string; lastName: string; jobTitle: string; department: string | null }[];
  members: { userId: string; name: string }[];
  initialKind: string;
  employeeId: string;
  personLabel: string;
  self: boolean;
  initialMetricId?:string;
}) {
  const allowed = self ? kinds.filter((item) => item.id === "personal") : kinds;
  const [kind, setKind] = useState(allowed.some((item) => item.id === initialKind) ? initialKind : allowed[0].id);
  const personal = kind === "personal" || kind === "pip" || kind === "development";
  const subjects = [...new Set(measures.map((item) => item.subject))];
  const initialMetric=measures.find(m=>m.id===initialMetricId);
  const [subject, setSubject] = useState(initialMetric?.subject ?? subjects[0] ?? "");
  const pool = measures.filter((item) => item.subject === subject);
  const [metricId, setMetricId] = useState(initialMetric?.id ?? "");
  const metric = pool.find((item) => item.id === metricId);
  const [slice, setSlice] = useState(initialMetric?.unit==="money"?"GBP":"");
  const [target, setTarget] = useState(initialMetric?.suggestion?.target?.toString()??"");
  const today=new Date().toISOString().slice(0,10);
  const [startsAt, setStartsAt] = useState(today.slice(0,8)+"01");
  const [endsAt, setEndsAt] = useState(new Date(Date.UTC(Number(today.slice(0,4)),Number(today.slice(5,7)),0)).toISOString().slice(0,10));
  const [direction, setDirection] = useState<"AT_LEAST" | "AT_MOST">("AT_LEAST");
  const preview = metric ? readActual(metric.points,metric.unit,slice) : null;
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
        <label className="text-sm sm:col-span-2">{kind === "pip" || kind === "development" ? "First goal" : "Goal"}<input aria-label="Goal" name="name" defaultValue={initialMetric?.suggestion?.name??""} required maxLength={150} className={field} placeholder={kind === "department" ? "Confirmed orders this quarter" : "What done looks like"} /></label>
        {!personal && <label className="text-sm">Department / team<input aria-label="Department / team" name="teamName" maxLength={100} className={field} placeholder={metric?.subject??"Company"} /></label>}
        <label className="text-sm">Owner<select aria-label="Owner" name="ownerUserId" className={field} defaultValue={members[0]?.userId ?? ""}>{members.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select></label>
        {(kind === "department" || kind === "team" || personal) && measures.length > 0 && <label className="text-sm">App<select aria-label="App" className={field} value={subject} onChange={(event) => { setSubject(event.target.value); setMetricId(""); setSlice(""); }}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>}
        {measures.length > 0 && <label className="text-sm sm:col-span-2">{kind === "department" ? "Live measure" : "Link a live measure"}<select aria-label="Live measure" name="metricId" required={kind === "department"} className={field} value={metricId} onChange={(event) => { setMetricId(event.target.value); const next=pool.find(m=>m.id===event.target.value);setSlice(next?.unit==="money"?"GBP":"");setTarget(next?.suggestion?.target?.toString()??""); }}><option value="">{kind === "department" ? "Choose a measure" : "No live measure — progress is recorded by hand"}</option>{pool.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {metric?.unit==="money"?<label className="text-sm">Currency<input aria-label="Currency" name="sliceLabel" value={slice} onChange={e=>setSlice(e.target.value.toUpperCase())} pattern="[A-Z]{3}" maxLength={3} required className={field}/><span className="text-xs text-slate-500">For example GBP or EUR. Currencies are scored separately.</span></label>:metric&&<label className="text-sm sm:col-span-2">Which part counts?<select aria-label="Measure group" name="sliceLabel" className={field} value={slice} onChange={e=>setSlice(e.target.value)}><option value="">The whole measure</option>{metric.points.map(point=><option key={point.label} value={point.label}>{point.label}</option>)}</select></label>}
        {!metric && <label className="text-sm">Unit<input name="unit" defaultValue="count" maxLength={30} className={field} /></label>}
        <label className="text-sm">Success means<select aria-label="Success means" name="direction" className={field} value={direction} onChange={(event) => setDirection(event.target.value === "AT_MOST" ? "AT_MOST" : "AT_LEAST")}><option value="AT_LEAST">Reach at least the target</option><option value="AT_MOST">Stay at or under the target</option></select></label>
        <label className="text-sm">{metric?.unit === "money" ? "Target amount in selected currency" : "Target"}<input aria-label="Target" name="target" required type="number" min={0} max={metric?.unit==="percent"?100:undefined} step="any" value={target} onChange={(event) => setTarget(event.target.value)} className={field} /></label>
        <label className="text-sm">Starts<input aria-label="Starts" type="date" name="startsAt" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={field} /></label>
        <label className="text-sm">Ends<input aria-label="Ends" type="date" name="endsAt" required value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={field} /></label>
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
        <p className="text-xs text-slate-500">Recent source figure: {preview?.actual!==null&&preview?.actual!==undefined?formatGoalValue(preview.actual,metric.unit,preview.currency||slice):"No reading yet"}. This reference uses the last 90 days; the saved goal will use its own dates.</p>
        {metric.note&&<p className="text-xs text-slate-500">{metric.note}</p>}

      </div> : <p className="border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-ink-muted)]">Without a live measure, progress is the number the person or their manager records, with a note each time.</p>}
    </aside>
  </div>;
}
