import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { buildInsights } from "@/modules/plan/domain/engine";
import { metricByKey } from "@/modules/plan/domain/catalogue";
import { liveActuals } from "@/modules/plan/services/actuals";
import { combinePeriods } from "@/modules/plan/domain/engine";
import { enabledModules, planList, planRecord } from "@/modules/plan/services/queries";

export default async function Page() {
  const session = await requireSession();
  const plans = await planList(session);
  const enabled = await enabledModules(session.organisationId);
  const insights = [];
  for (const summary of plans.slice(0, 8)) {
    const plan = await planRecord(session, summary.id);
    const working = plan.versions.find((version) => version.kind === "forecast");
    const baseline = plan.versions.find((version) => version.kind === "baseline" && version.status === "approved");
    const actuals = await liveActuals(session, plan.measures.map((measure) => measure.metricKey), plan.periodStart, plan.periodEnd, enabled);
    const measures = plan.measures.flatMap((measure) => {
      const metric = metricByKey(measure.metricKey);
      if (!metric) return [];
      const planValue = combinePeriods(plan.cells.filter((cell) => cell.versionId === (baseline ?? working)?.id && cell.metricKey === measure.metricKey && cell.kind === "plan").map((cell) => ({ periodKey: cell.periodKey, dimensionKey: cell.dimensionKey, value: Number(cell.value) })), metric.aggregation).value;
      const forecast = combinePeriods(plan.cells.filter((cell) => cell.versionId === working?.id && cell.metricKey === measure.metricKey && cell.kind === "forecast").map((cell) => ({ periodKey: cell.periodKey, dimensionKey: cell.dimensionKey, value: Number(cell.value) })), metric.aggregation).value;
      return [{ name: `${plan.name} · ${metric.name}`, plan: planValue, forecast, actual: actuals[measure.metricKey]?.value ?? null, direction: metric.direction }];
    });
    const demand = measures.find((measure) => measure.name.endsWith("Production demand"));
    const capacity = measures.find((measure) => measure.name.endsWith("Production capacity"));
    insights.push(...buildInsights({ measures, capacity: demand && capacity ? [{ name: plan.name, demand: demand.plan, capacity: capacity.plan }] : [], overdueActions: plan.actions.filter((action) => action.status === "open" && action.dueOn && action.dueOn < new Date()).length, approvals: plan.status === "submitted" ? 1 : 0 }).map((item) => ({ ...item, href: `/plan/plans/${plan.id}` })));
  }
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight">Insights</h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">Each line compares figures on a plan with the forecast or with a live Atlas actual. Nothing here is a score.</p>
      <div className="mt-6 space-y-3">
        {insights.map((item) => <Link key={`${item.href}-${item.title}`} href={item.href} className="block rounded-3xl border border-slate-200 px-5 py-4"><span className="font-medium">{item.title}</span><span className="mt-1 block text-sm text-[var(--color-ink-muted)]">{item.detail}</span></Link>)}
        {!insights.length ? <p className="text-sm text-[var(--color-ink-muted)]">Create a plan and enter a target and a forecast. Insights appear from those figures.</p> : null}
      </div>
    </div>
  );
}
