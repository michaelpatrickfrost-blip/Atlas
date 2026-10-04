import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { commentOnPlan, recordProgress } from "@/app/(app)/kpis/actions";
import { goalDateLabel, verdictLabel } from "@/modules/kpis/domain/progress";
import { canEditConduct } from "@/modules/people/services/conduct-access";
import { loadGoalWorkspace } from "@/modules/kpis/services/workspace";
import { GoalMeter } from "./goal-meter";

const planLabel: Record<string, string> = { PIP: "Performance improvement plan", DEVELOPMENT: "Development plan", PERSONAL: "Personal plan" };

export async function PersonGoals({ employeeId, self = false, personLabel }: { employeeId: string; self?: boolean; personLabel?: string }) {
  const session = await requireSession();
  const { goals, plans } = await loadGoalWorkspace(session);
  const mine = goals.filter((goal) => goal.employeeId === employeeId && !goal.planId);
  const personPlans = plans.filter((plan) => plan.employeeId === employeeId);
  const planGoals = goals.filter((goal) => goal.employeeId === employeeId && goal.planId);
  const canSet = can(session, "kpis.manage") || canEditConduct(session);
  if (!mine.length && !personPlans.length && !self && !canSet) return null;
  return <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold">Goals</h3>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-muted)]">{self ? "Personal goals and any performance plan set with you. These are not shown on a company dashboard." : "Personal goals and performance plans for this person. A plan is also listed in Goals."}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {self && <Link href="/kpis/new?kind=personal&self=1" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white">Add a personal goal</Link>}
        {canSet && !self && <Link href={`/kpis/new?kind=pip&employee=${employeeId}`} className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Start a performance plan</Link>}
        {(can(session, "kpis.read") || mine.length || personPlans.length) && <Link href="/kpis?view=people" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Open in Goals</Link>}
      </div>
    </div>
    {personPlans.map((plan) => <article key={plan.id} className="rounded-2xl bg-[var(--color-surface-sunken)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{planLabel[plan.kind] ?? "Plan"} · {plan.status.replaceAll("_", " ")}</p>
        <Link href={`/kpis/plans/${plan.id}`} className="text-xs font-semibold text-[var(--color-atlas-blue)]">Full plan</Link>
      </div>
      <h4 className="mt-2 font-semibold">{plan.title}</h4>
      <p className="mt-2 text-sm leading-relaxed">{plan.reason}</p>
      {plan.support && <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Support: {plan.support}</p>}
      <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{goalDateLabel(plan.startOn)} – {goalDateLabel(plan.endOn)} · Review {goalDateLabel(plan.reviewOn)} · {plan.ownerName}</p>
      <div className="mt-4 space-y-4">{planGoals.filter((goal) => goal.planId === plan.id).map((goal) => <div key={goal.id} className="rounded-xl bg-white p-4"><GoalMeter name={goal.name} actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} />{goal.notes && <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{goal.notes}</p>}{self && goal.status === "ACTIVE" && <ActionForm action={recordProgress.bind(null, goal.id)} className="mt-3 flex flex-wrap items-end gap-2"><label className="text-xs">Progress<input name="value" type="number" min={0} step="any" defaultValue={goal.current} className="mt-1 block w-28 rounded-lg border p-2" /></label><label className="min-w-40 flex-1 text-xs">What changed<input name="note" className="mt-1 block w-full rounded-lg border p-2" /></label><Button type="submit">Save progress</Button></ActionForm>}</div>)}{!planGoals.some((goal) => goal.planId === plan.id) && plan.objectives.map((item) => <div key={item.goal} className="rounded-xl bg-white p-4"><p className="font-medium">{item.goal}</p>{item.measure && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{item.measure}</p>}{item.support && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Support: {item.support}</p>}{item.by && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">By {item.by}</p>}</div>)}</div>
      {self && <ActionForm action={commentOnPlan.bind(null, plan.id)} className="mt-4 space-y-2"><label className="block text-sm">Your comment<textarea name="employeeComment" defaultValue={plan.employeeComment} rows={3} className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="How this is going from your side." /></label><Button type="submit">Save your comment</Button></ActionForm>}
      {!self && plan.employeeComment && <p className="mt-3 text-sm"><span className="font-semibold">Their comment. </span>{plan.employeeComment}</p>}
    </article>)}
    {mine.map((goal) => <article key={goal.id} className="rounded-2xl border border-[var(--color-border)] p-4">
      <p className="text-xs text-[var(--color-ink-muted)]">Personal · {verdictLabel[goal.verdict]}</p>
      <GoalMeter name={goal.name} actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} />
      {goal.contextName && <p className="mt-2 text-xs text-[var(--color-ink-muted)]">Department context: {goal.contextName} is {goal.contextNote || (goal.contextActual === null ? "unavailable" : goal.contextActual)}. That is the department figure, not their progress.</p>}
      <Link href={`/kpis/${goal.id}`} className="mt-2 inline-block text-xs font-semibold text-[var(--color-atlas-blue)]">Open goal</Link>
    </article>)}
    {!mine.length && !personPlans.length && <p className="text-sm text-[var(--color-ink-muted)]">{self ? "You have no personal goals yet." : `${personLabel || "This person"} has no personal goals or performance plan.`}</p>}
    {can(session, HR.conductRead) && !self && <p className="text-xs text-[var(--color-ink-muted)]">Disciplinary records stay in HR and are not listed here.</p>}
  </section>;
}
