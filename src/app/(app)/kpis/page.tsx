import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { goalDateLabel } from "@/modules/kpis/domain/progress";
import { GoalMeter } from "@/modules/kpis/components/goal-meter";
import { loadGoalWorkspace } from "@/modules/kpis/services/workspace";

const planLabel: Record<string, string> = { PIP: "Performance improvement", DEVELOPMENT: "Development", PERSONAL: "Personal" };

export default async function KpisPage({ searchParams }: { searchParams: Promise<{ view?: string; team?: string }> }) {
  const session = await requireSession();
  await assertModuleEnabled(session, "kpis");
  const { view, team } = await searchParams;
  const peopleView = view === "people";
  const { goals, plans } = await loadGoalWorkspace(session);
  const shared = goals.filter((goal) => goal.visibility === "COMPANY" && (!team || goal.teamName === team));
  const personal = goals.filter((goal) => goal.visibility === "PRIVATE" && !goal.planId);
  const teams = [...new Set(goals.filter((goal) => goal.visibility === "COMPANY").map((goal) => goal.teamName))];
  const manage = can(session, "kpis.manage");
  const starters=manage?(await getAnalyticsMetrics(session)).filter(m=>m.goalSuggestion):[];
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">{peopleView ? "People" : "Scorecards"}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">{peopleView ? "Personal goals, development plans and performance improvement plans. Only the person, their manager and HR can see these." : "Department and team targets. When a goal uses a live measure, that target is drawn under the matching chart on dashboards."}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/kpis" className={`rounded-full px-4 py-2 text-sm font-semibold ${peopleView ? "border border-[var(--color-border)]" : "bg-[var(--color-ink)] text-white"}`}>Results</Link>
        <Link href="/kpis?view=people" className={`rounded-full px-4 py-2 text-sm font-semibold ${peopleView ? "bg-[var(--color-ink)] text-white" : "border border-[var(--color-border)]"}`}>People</Link>
        {(manage || peopleView) && <Link href="/kpis/new" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white">Set a goal</Link>}
      </div>
    </div>
    {!peopleView&&manage&&<details open={!shared.length} className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold">Connect a business result</summary><p className="mt-2 text-sm text-slate-500">Choose what matters, set a target and Atlas reads the actual result from its source app. Results use your goal’s dates and source permissions.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{starters.map(m=><Link key={m.id} href={`/kpis/new?metric=${encodeURIComponent(m.id)}`} className="rounded-xl border border-slate-200 p-4 hover:border-blue-400"><p className="text-xs text-slate-500">{m.subject}</p><h3 className="mt-1 text-sm font-semibold">{m.name}</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">{m.definition}</p><span className="mt-3 block text-xs font-semibold text-blue-600">Set a connected target →</span></Link>)}</div>{!starters.length&&<p className="mt-3 text-sm text-slate-500">No connected business sources are available to your profile. Ask your company administrator for access to the relevant app and records.</p>}</details>}
    {!peopleView && <form className="flex flex-wrap gap-3"><select name="team" defaultValue={team ?? ""} className="rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm"><option value="">All teams</option>{teams.map((item) => <option key={item}>{item}</option>)}</select><button className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold" type="submit">Filter</button></form>}
    {!peopleView && <div className="grid gap-4 lg:grid-cols-2">{shared.map((goal) => <Link key={goal.id} href={`/kpis/${goal.id}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><p className="text-xs text-[var(--color-ink-muted)]">{goal.department || goal.teamName}{goal.metricName ? ` · ${goal.metricName}` : goal.metricId ? " · Source unavailable" : " · Recorded by hand"}{goal.sliceLabel ? ` · ${goal.sliceLabel}` : ""}</p><div className="mt-3"><GoalMeter name={goal.name} actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} showPace={!goal.snapshot} /></div><p className="mt-3 text-xs text-[var(--color-ink-muted)]">{goal.ownerName} · {goalDateLabel(goal.startsAt)} – {goalDateLabel(goal.endsAt)}</p></Link>)}</div>}
    {!peopleView && !shared.length && <p className="rounded-2xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-ink-muted)]">{can(session, "kpis.read") ? "Set a department goal and it will show here, and under that measure on dashboards." : "Company targets are visible to people who can read Goals. Your own goals are under People."}</p>}
    {peopleView && <div className="space-y-4">{plans.map((plan) => <article key={plan.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{planLabel[plan.kind] ?? "Plan"} · {plan.status.replaceAll("_", " ")}</p><Link href={`/kpis/plans/${plan.id}`} className="text-sm font-semibold text-[var(--color-atlas-blue)]">Open plan</Link></div><h3 className="mt-2 text-lg font-semibold">{plan.title}</h3><p className="mt-1 text-sm text-[var(--color-ink-muted)]">{plan.personName} · {plan.ownerName}</p><p className="mt-3 text-sm leading-relaxed">{plan.reason}</p><p className="mt-3 text-xs text-[var(--color-ink-muted)]">{plan.objectives.length} goals · Review {goalDateLabel(plan.reviewOn)}</p></article>)}
      {personal.map((goal) => <Link key={goal.id} href={`/kpis/${goal.id}`} className="block rounded-2xl border border-[var(--color-border)] bg-white p-5"><p className="text-xs text-[var(--color-ink-muted)]">Personal · {goal.personName}</p><div className="mt-3"><GoalMeter name={goal.name} actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} showPace={!goal.snapshot} /></div></Link>)}
      {!plans.length && !personal.length && <p className="rounded-2xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-ink-muted)]">No personal goals or performance plans you can see.</p>}
    </div>}
  </div>;
}
