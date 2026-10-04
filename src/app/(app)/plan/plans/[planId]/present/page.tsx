import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { metricByKey } from "@/modules/plan/domain/catalogue";
import { ReviewKeys } from "@/modules/plan/components/review-keys";
import { showMeasure } from "@/modules/plan/components/format";
import { liveActuals } from "@/modules/plan/services/actuals";
import { cellValue, enabledModules, planRecord } from "@/modules/plan/services/queries";
import { periodKeys } from "@/modules/plan/domain/engine";

const PAGES = ["summary", "chart", "risks", "decisions", "actions"] as const;

export default async function Page({ params, searchParams }: { params: Promise<{ planId: string }>; searchParams: Promise<{ page?: string }> }) {
  const session = await requireSession();
  const [{ planId }, query] = await Promise.all([params, searchParams]);
  const plan = await planRecord(session, planId);
  const index = Math.min(Math.max(Number(query.page ?? 0) || 0, 0), PAGES.length - 1);
  const page = PAGES[index];
  const previous = index > 0 ? `/plan/plans/${plan.id}/present?page=${index - 1}` : undefined;
  const next = index < PAGES.length - 1 ? `/plan/plans/${plan.id}/present?page=${index + 1}` : undefined;
  const working = plan.versions.find((version) => version.kind === "forecast");
  const baseline = plan.versions.find((version) => version.kind === "baseline" && version.status === "approved");
  const enabled = await enabledModules(session.organisationId);
  const actuals = page === "summary" ? await liveActuals(session, plan.measures.map((measure) => measure.metricKey), plan.periodStart, plan.periodEnd, enabled) : {};
  const periods = periodKeys(plan.periodStart.toISOString().slice(0, 10), plan.periodEnd.toISOString().slice(0, 10));
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-between py-8">
      <ReviewKeys previous={previous} next={next} />
      <div>
        <p className="text-sm text-[var(--color-ink-muted)]">{plan.name} · {index + 1} of {PAGES.length}</p>
        {page === "summary" ? plan.measures.slice(0, 4).map((measure) => {
          const metric = metricByKey(measure.metricKey);
          const planValue = periods.map((period) => cellValue(plan.cells, (baseline ?? working)?.id, measure.metricKey, period, "", "plan")).find((value) => value != null) ?? null;
          const forecast = periods.map((period) => cellValue(plan.cells, working?.id, measure.metricKey, period, "", "forecast")).find((value) => value != null) ?? null;
          return <div key={measure.metricKey} className="mt-8"><p className="text-sm text-[var(--color-ink-muted)]">{metric?.name}</p><p className="text-5xl font-semibold tracking-tight">{showMeasure(forecast ?? planValue, metric?.unit ?? "count", plan.currency)}</p><p className="mt-2 text-[var(--color-ink-muted)]">Plan {showMeasure(planValue, metric?.unit ?? "count", plan.currency)} · Actual {showMeasure(actuals[measure.metricKey]?.value ?? null, metric?.unit ?? "count", plan.currency)}</p></div>;
        }) : null}
        {page === "chart" ? <p className="mt-10 text-2xl">The chart stays on the plan, where the figures can still be opened.</p> : null}
        {page === "risks" ? <ul className="mt-8 space-y-4 text-2xl">{plan.risks.map((risk) => <li key={risk.id}>{risk.title}</li>)}{!plan.risks.length ? <li>No risks recorded.</li> : null}</ul> : null}
        {page === "decisions" ? <ul className="mt-8 space-y-6">{plan.decisions.map((item) => <li key={item.id}><p className="text-3xl font-semibold">{item.title}</p><p className="mt-2 text-[var(--color-ink-muted)]">{item.reason}</p></li>)}{!plan.decisions.length ? <li className="text-2xl">No decision recorded yet.</li> : null}</ul> : null}
        {page === "actions" ? <ul className="mt-8 space-y-4 text-2xl">{plan.actions.filter((action) => action.status === "open").map((action) => <li key={action.id}>{action.title}</li>)}{!plan.actions.some((action) => action.status === "open") ? <li>No open actions.</li> : null}</ul> : null}
      </div>
      <div className="mt-10 flex justify-between text-sm">
        {previous ? <Link href={previous}>Previous</Link> : <span />}
        <Link href={`/plan/plans/${plan.id}`}>Back to the plan</Link>
        {next ? <Link href={next}>Next</Link> : <span />}
      </div>
    </div>
  );
}
