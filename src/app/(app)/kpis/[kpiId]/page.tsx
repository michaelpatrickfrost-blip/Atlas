import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { formatGoalValue, goalDateLabel } from "@/modules/kpis/domain/progress";
import { closeGoal, recordProgress } from "../actions";
import { GoalMeter } from "@/modules/kpis/components/goal-meter";
import { ConnectGoalForm } from "@/modules/kpis/components/connect-form";
import { loadMeasureChoices } from "@/modules/kpis/services/workspace";
import { loadGoalWorkspace } from "@/modules/kpis/services/workspace";

export default async function GoalPage({ params }: { params: Promise<{ kpiId: string }> }) {
  const { kpiId } = await params;
  const session = await requireSession();
  await assertModuleEnabled(session, "kpis");
  const { goals } = await loadGoalWorkspace(session);
  const goal = goals.find((item) => item.id === kpiId);
  if (!goal) notFound();
  const canUpdate = goal.status === "ACTIVE" && (goal.visibility === "PRIVATE" || can(session, "kpis.manage"));
  const canClose = can(session, "kpis.manage") || can(session, "people.conduct.manage");
  const canConnect=goal.visibility==="COMPANY"&&goal.status==="ACTIVE"&&can(session,"kpis.manage");
  const measures=canConnect?await loadMeasureChoices(session):[];
  return <div className="mx-auto max-w-3xl space-y-6">
    <div><Link href={goal.visibility === "PRIVATE" ? "/kpis?view=people" : "/kpis"} className="text-sm text-[var(--color-atlas-blue)]">Goals</Link>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{goal.visibility === "COMPANY" ? goal.department || goal.teamName : goal.planKind === "PIP" ? "Performance improvement" : "Personal"}{goal.personName ? ` · ${goal.personName}` : ""}</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-tight">{goal.name}</h2>
      {goal.notes && <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">{goal.notes}</p>}
    </div>
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <GoalMeter actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} showPace={!goal.snapshot} />
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-[var(--color-ink-muted)]">Owner</dt><dd>{goal.ownerName}</dd></div>
        <div><dt className="text-xs text-[var(--color-ink-muted)]">Period</dt><dd>{goalDateLabel(goal.startsAt)} – {goalDateLabel(goal.endsAt)} · day {goal.day} of {goal.days}</dd></div>
        {goal.reviewOn && <div><dt className="text-xs text-[var(--color-ink-muted)]">Review</dt><dd>{goalDateLabel(goal.reviewOn)}</dd></div>}
        {goal.support && <div className="sm:col-span-2"><dt className="text-xs text-[var(--color-ink-muted)]">Support</dt><dd>{goal.support}</dd></div>}
      </dl>
    </section>
    {goal.metricName && <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="text-sm font-semibold">{goal.visibility === "COMPANY" ? "Live measure" : "Department context"}</h3>
      <p className="mt-2 text-sm font-medium">{goal.metricName}{goal.sliceLabel ? ` · ${goal.sliceLabel}` : ""}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{goal.metricDefinition}</p>
      {goal.visibility === "COMPANY" ? <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Any dashboard chart of this measure shows the target underneath. {goal.snapshot ? "The figure is the current position." : "The scorecard uses the goal’s start and end dates, up to now."}</p> : <p className="mt-3 text-sm text-[var(--color-ink-muted)]">The department figure is context. Progress on this goal is the number recorded here.{goal.contextActual !== null && !goal.contextNote ? ` The department figure is currently ${formatGoalValue(goal.contextActual, goal.unit, goal.currency)}.` : ""}</p>}
      {goal.sampleSize!==undefined&&<p className="mt-2 text-xs text-slate-500">Based on {goal.sampleSize} source records. {goal.sourceNote}</p>}
      {goal.metricHref && <Link href={goal.metricHref} className="mt-3 inline-block text-sm font-semibold text-[var(--color-atlas-blue)]">Open the source</Link>}
      {goal.visibility === "COMPANY" && <Link href="/analytics" className="mt-3 ml-4 inline-block text-sm font-semibold text-[var(--color-atlas-blue)]">Open dashboards</Link>}
      {goal.points.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-[var(--color-ink-muted)]"><th className="py-2 font-medium">Group</th><th className="py-2 text-right font-medium">Figure</th></tr></thead><tbody>{goal.points.map((point) => <tr key={point.label} className="border-b border-slate-100 last:border-0"><td className="py-2">{point.label}{goal.sliceLabel.toLowerCase() === point.label.toLowerCase() ? " · this goal" : ""}</td><td className="py-2 text-right">{formatGoalValue(point.value, goal.unit, goal.unit === "money" ? point.label : goal.currency)}</td></tr>)}</tbody></table></div>}
    </section>}
    {canConnect&&<details className="rounded-2xl border border-slate-200 bg-white p-6"><summary className="cursor-pointer text-sm font-semibold">{goal.metricId?"Change connected source":"Connect this goal to live results"}</summary><ConnectGoalForm id={goal.id} expectedMetricId={goal.metricId} target={goal.target} unit={goal.unit} sliceLabel={goal.sliceLabel} measures={measures}/></details>}
    {goal.planId && <p className="text-sm"><Link href={`/kpis/plans/${goal.planId}`} className="font-semibold text-[var(--color-atlas-blue)]">Open {goal.planTitle || "the plan"}</Link></p>}
    {goal.employeeId && can(session, "people.employee.read") && <p className="text-sm"><Link href={`/people/${goal.employeeId}`} className="font-semibold text-[var(--color-atlas-blue)]">Open the HR record</Link></p>}
    {canUpdate && <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="text-sm font-semibold">{goal.visibility === "COMPANY" && goal.metricId ? "Add a note" : "Record progress"}</h3>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{goal.visibility === "COMPANY" && goal.metricId ? "The figure comes from the live measure. A note explains what changed." : "Enter the current figure and a short note about what changed."}</p>
      <ActionForm action={recordProgress.bind(null, goal.id)} className="mt-4 flex flex-wrap items-end gap-3">
        {!(goal.visibility === "COMPANY" && goal.metricId) && <label className="text-sm">Current figure<input name="value" type="number" min={0} step="any" required defaultValue={goal.current} className="mt-2 block w-36 rounded-xl border p-3" /></label>}
        <label className="min-w-48 flex-1 text-sm">Note<input name="note" required={Boolean(goal.visibility === "COMPANY" && goal.metricId)} className="mt-2 block w-full rounded-xl border p-3" /></label>
        <Button type="submit" variant="primary">Save</Button>
      </ActionForm>
    </section>}
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="text-sm font-semibold">History</h3>
      <div className="mt-3 space-y-3">{goal.updates.map((update) => <p key={update.id} className="text-sm"><span className="font-medium">{goalDateLabel(update.at)}</span> · {update.value===null?"Note":formatGoalValue(update.value, goal.unit, goal.currency)} · {update.actor}{update.note ? ` · ${update.note}` : ""}</p>)}{!goal.updates.length && <p className="text-sm text-[var(--color-ink-muted)]">No updates yet.</p>}</div>
      {canClose && goal.status === "ACTIVE" && <form action={closeGoal.bind(null, goal.id)} className="mt-4"><Button type="submit">Close this goal</Button></form>}
    </section>
  </div>;
}
