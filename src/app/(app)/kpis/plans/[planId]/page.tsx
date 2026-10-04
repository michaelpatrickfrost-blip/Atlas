import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getMyHR } from "@/app/(app)/people/self-service";
import { goalDateLabel } from "@/modules/kpis/domain/progress";
import { addPlanGoal, closePlan, commentOnPlan } from "../../actions";
import { GoalMeter } from "@/modules/kpis/components/goal-meter";
import { canEditConduct } from "@/modules/people/services/conduct-access";
import { loadGoalWorkspace, loadMeasureChoices } from "@/modules/kpis/services/workspace";

const planLabel: Record<string, string> = { PIP: "Performance improvement plan", DEVELOPMENT: "Development plan", PERSONAL: "Personal plan" };
const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm";

export default async function PlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const session = await requireSession();
  await assertModuleEnabled(session, "kpis");
  const [{ plans, goals }, measures] = await Promise.all([
    loadGoalWorkspace(session),
    loadMeasureChoices(session).catch(() => []),
  ]);
  const plan = plans.find((item) => item.id === planId);
  if (!plan) notFound();
  const planGoals = goals.filter((goal) => goal.planId === plan.id);
  let isSubject = false;
  try {
    const mine = await getMyHR();
    isSubject = mine?.id === plan.employeeId;
  } catch { isSubject = false; }
  const canEdit = can(session, "kpis.manage") || canEditConduct(session);
  return <div className="mx-auto max-w-3xl space-y-6">
    <div>
      <Link href="/kpis?view=people" className="text-sm text-[var(--color-atlas-blue)]">People</Link>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{planLabel[plan.kind] ?? "Plan"} · {plan.status.replaceAll("_", " ")}</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-tight">{plan.title}</h2>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{plan.personName || "Person"} · Set by {plan.ownerName}</p>
    </div>
    <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="text-sm font-semibold">Why this plan exists</h3>
      <p className="text-sm leading-relaxed">{plan.reason}</p>
      {plan.support && <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]"><span className="font-semibold text-[var(--color-ink)]">Support. </span>{plan.support}</p>}
      <p className="text-xs text-[var(--color-ink-muted)]">{goalDateLabel(plan.startOn)} – {goalDateLabel(plan.endOn)} · Review {goalDateLabel(plan.reviewOn)}</p>
      {can(session, "people.employee.read") && <Link href={`/people/${plan.employeeId}`} className="inline-block text-sm font-semibold text-[var(--color-atlas-blue)]">Open the HR record</Link>}
    </section>
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Goals on this plan</h3>
      {planGoals.map((goal) => <article key={goal.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <GoalMeter name={goal.name} actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} />
        {goal.notes && <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{goal.notes}</p>}
        {goal.contextName && <p className="mt-2 text-xs text-[var(--color-ink-muted)]">Linked to {goal.contextName}. The department figure is context, not their score.</p>}
        <Link href={`/kpis/${goal.id}`} className="mt-3 inline-block text-xs font-semibold text-[var(--color-atlas-blue)]">Progress and history</Link>
      </article>)}
      {!planGoals.length && <ul className="space-y-2 text-sm">{plan.objectives.map((item) => <li key={item.goal} className="rounded-xl border border-[var(--color-border)] bg-white p-4"><p className="font-semibold">{item.goal}</p><p className="mt-1 text-[var(--color-ink-muted)]">{item.measure}</p></li>)}</ul>}
    </section>
    {plan.reviews.length > 0 && <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6"><h3 className="text-sm font-semibold">Reviews</h3><div className="mt-3 space-y-4">{plan.reviews.map((review) => <article key={review.id}><p className="text-xs text-[var(--color-ink-muted)]">{goalDateLabel(review.heldOn)}</p><p className="mt-1 text-sm">{review.progress}</p>{review.managerNotes && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Manager: {review.managerNotes}</p>}{review.employeeNotes && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Employee: {review.employeeNotes}</p>}</article>)}</div></section>}
    {isSubject && <ActionForm action={commentOnPlan.bind(null, plan.id)} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6"><h3 className="text-sm font-semibold">Your comment</h3><textarea name="employeeComment" defaultValue={plan.employeeComment} rows={4} className={field} /><Button type="submit" variant="primary">Save your comment</Button></ActionForm>}
    {!isSubject && plan.employeeComment && <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6"><h3 className="text-sm font-semibold">Their comment</h3><p className="mt-2 text-sm leading-relaxed">{plan.employeeComment}</p></section>}
    {canEdit && plan.status !== "CLOSED" && plan.status !== "ACHIEVED" && plan.status !== "NOT_MET" && <ActionForm action={addPlanGoal.bind(null, plan.id)} className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:grid-cols-2"><h3 className="text-sm font-semibold sm:col-span-2">Add another goal</h3><label className="text-sm sm:col-span-2">Goal<input name="name" required className={field} /></label><label className="text-sm sm:col-span-2">How we will know<textarea name="notes" rows={2} className={field} /></label><label className="text-sm">Target<input name="target" type="number" min={0} step="any" required className={field} /></label><label className="text-sm">Unit<input name="unit" defaultValue="count" className={field} /></label><label className="text-sm">Success means<select name="direction" className={field}><option value="AT_LEAST">At least the target</option><option value="AT_MOST">At most the target</option></select></label>{measures.length > 0 && <label className="text-sm">Optional department measure<select name="metricId" className={field}><option value="">None</option>{measures.map((item) => <option key={item.id} value={item.id}>{item.subject} · {item.name}</option>)}</select></label>}<Button type="submit" variant="primary" className="justify-self-start">Add goal</Button></ActionForm>}
    {canEdit && !["CLOSED", "ACHIEVED", "NOT_MET"].includes(plan.status) && <ActionForm action={closePlan.bind(null, plan.id)} className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:grid-cols-2"><h3 className="text-sm font-semibold sm:col-span-2">Close the plan</h3><label className="text-sm">Outcome<select name="status" className={field}><option value="ACHIEVED">Achieved</option><option value="NOT_MET">Not met</option><option value="CLOSED">Closed</option></select></label><label className="text-sm sm:col-span-2">What was decided<textarea name="outcome" rows={3} className={field} /></label><Button type="submit">Save outcome</Button></ActionForm>}
    {plan.outcome && <p className="text-sm"><span className="font-semibold">Outcome. </span>{plan.outcome}</p>}
  </div>;
}
