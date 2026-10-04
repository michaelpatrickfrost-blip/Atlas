import type { ReactNode } from "react";
import Link from "next/link";
import type { Session } from "@/core/auth/session";
import { metricByKey, resolveMetricSearch } from "../domain/catalogue";
import { explainDriver, periodKeys } from "../domain/engine";
import { audienceLabel } from "../domain/access";
import { addAssumption, addDecision, addDependency, addDriver, addLink, addMeasure, addReview, addRisk, approvePlan, completeReview, createScenario, distributeTargets, importGrid, lockPlan, promoteScenario, saveCell, submitPlan } from "../services/commands";
import { liveActuals, productionPicture } from "../services/actuals";
import { cellValue, enabledModules, lensSections, planRecord, quarterTotals, searchPlanText } from "../services/queries";
import { PlanStory } from "./story";
import { field, primary, quiet, showMeasure } from "./format";

export async function PlanWorkspace({ session, planId, lens, scenarioId, metricKey, query }: { session: Session; planId: string; lens?: string; scenarioId?: string; metricKey?: string; query?: string }) {
  const plan = await planRecord(session, planId);
  const enabled = await enabledModules(session.organisationId);
  const periods = periodKeys(plan.periodStart.toISOString().slice(0, 10), plan.periodEnd.toISOString().slice(0, 10));
  const working = plan.versions.find((version) => version.kind === "forecast" && ["draft", "active"].includes(version.status)) ?? plan.versions.find((version) => version.kind === "forecast");
  const baseline = plan.versions.find((version) => version.kind === "baseline" && version.status === "approved");
  const scenario = plan.versions.find((version) => version.id === scenarioId && version.kind === "scenario");
  const actuals = await liveActuals(session, plan.measures.map((measure) => measure.metricKey), plan.periodStart, plan.periodEnd, enabled);
  const picture = await productionPicture(session, plan.periodStart, plan.periodEnd, enabled);
  const saved = plan.lenses.find((item) => item.audience === lens);
  const sections = new Set(lensSections(lens ?? "analyst", Array.isArray(saved?.sections) ? saved.sections.filter((item): item is string => typeof item === "string") : null));
  const focus = plan.measures.find((measure) => measure.metricKey === metricKey) ?? plan.measures[0];
  const metric = focus ? metricByKey(focus.metricKey) : undefined;
  const planVersion = baseline ?? working;
  const matches = query ? resolveMetricSearch(query, plan.measures.flatMap((measure) => { const item = metricByKey(measure.metricKey); return item ? [item] : []; })) : [];
  const found = query ? searchPlanText(query, [
    ...plan.assumptions.map((item) => ({ title: item.name, detail: `${item.valueText} ${item.note}`, href: "#assumptions" })),
    ...plan.actions.map((item) => ({ title: item.title, detail: item.ownerName, href: "#actions" })),
    ...plan.risks.map((item) => ({ title: item.title, detail: item.impactText, href: "#risks" })),
    ...plan.decisions.map((item) => ({ title: item.title, detail: item.reason, href: "#decisions" })),
    ...plan.comments.map((item) => ({ title: item.body, detail: item.authorName, href: "#notes" })),
  ]) : [];
  const hero = (kind: "plan" | "forecast", versionId?: string) => {
    if (!metric || !versionId) return null;
    const values = periods.map((period) => cellValue(plan.cells, versionId, metric.key, period, "", kind));
    const filled = values.filter((value): value is number => value != null);
    if (!filled.length || metric.aggregation === "none") return filled.length === 1 ? filled[0] : filled.at(-1) ?? null;
    return metric.aggregation === "average" ? filled.reduce((total, value) => total + value, 0) / filled.length : filled.reduce((total, value) => total + value, 0);
  };
  const target = hero("plan", planVersion?.id);
  const forecast = hero("forecast", working?.id);
  const actual = metric ? actuals[metric.key]?.value ?? null : null;
  const gapValue = target != null && forecast != null ? forecast - target : null;
  const dimensions = [...new Set(plan.cells.filter((cell) => cell.metricKey === metric?.key && cell.dimensionKey).map((cell) => cell.dimensionLabel || cell.dimensionKey))];
  const canEdit = session.capabilities.has("plan.edit") && !plan.locked;
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">{plan.periodLabel} · {plan.ownerName || "Unassigned"} · {audienceLabel(plan.audience, plan.shares.length)} · <span className="capitalize">{plan.status}</span>{baseline ? ` · Baseline ${baseline.approvedAt ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(baseline.approvedAt) : "approved"}` : ""}</p>
          <h2 className="mt-1 text-4xl font-semibold tracking-tight">{plan.name}</h2>
          {plan.purpose ? <p className="mt-2 max-w-2xl text-[var(--color-ink-muted)]">{plan.purpose}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["executive", "analyst", "team"] as const).map((item) => <Link key={item} href={`/plan/plans/${plan.id}?lens=${item}`} className={lens === item || (!lens && item === "analyst") ? primary : quiet}>{item[0].toUpperCase() + item.slice(1)}</Link>)}
          <Link href={`/plan/plans/${plan.id}/present`} className={quiet}>Review</Link>
          <a href={`/api/plan/${plan.id}/export`} className={quiet}>CSV</a>
        </div>
      </header>
      <form className="max-w-md" action={`/plan/plans/${plan.id}`} method="get"><input name="q" defaultValue={query} placeholder="Search this plan" className={field} /></form>
      {query ? <div className="rounded-3xl border border-slate-200 p-5 text-sm">{found.length ? found.map((item) => <a key={item.title} href={item.href} className="block py-1">{item.title}</a>) : "Nothing in this plan matches."}{matches.length ? <p className="mt-3 text-[var(--color-ink-muted)]">Measures: {matches.map((item) => item.name).join(", ")}. Pick one below rather than guessing.</p> : null}</div> : null}
      {sections.has("summary") && metric ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <Figure label="Plan" value={showMeasure(target, metric.unit, plan.currency)} note="What we intend" />
          <Figure label="Forecast" value={showMeasure(forecast, metric.unit, plan.currency)} note="What we currently expect" />
          <Figure label="Gap" value={showMeasure(gapValue, metric.unit, plan.currency)} note={`Actual ${showMeasure(actual, metric.unit, plan.currency)}. ${actuals[metric.key]?.note ?? ""}`} />
        </section>
      ) : null}
      {sections.has("chart") && metric ? <Chart plan={plan.currency} unit={metric.unit} periods={periods} values={periods.map((period) => ({ period, plan: cellValue(plan.cells, planVersion?.id, metric.key, period, "", "plan"), forecast: cellValue(plan.cells, working?.id, metric.key, period, "", "forecast"), actual: actuals[metric.key]?.byPeriod[period] ?? null }))} /> : null}
      <div className="flex flex-wrap gap-2">{plan.measures.map((measure) => <Link key={measure.metricKey} href={`/plan/plans/${plan.id}?metric=${measure.metricKey}${lens ? `&lens=${lens}` : ""}`} className={measure.metricKey === metric?.key ? primary : quiet}>{metricByKey(measure.metricKey)?.name ?? measure.metricKey}</Link>)}</div>
      {sections.has("table") && metric && working ? (
        <section className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-[var(--color-ink-muted)]"><th className="px-4 py-3 font-medium">{metric.name}</th>{periods.map((period) => <th key={period} className="px-3 py-3 font-medium">{period.slice(5)}</th>)}<th className="px-3 py-3 font-medium">Quarters</th></tr></thead>
            <tbody>
              {["", ...dimensions].map((dimension) => (
                <tr key={dimension || "total"} className="border-b border-slate-50">
                  <th className="px-4 py-3 text-left font-medium">{dimension || "Total"}</th>
                  {periods.map((period) => {
                    const planned = cellValue(plan.cells, planVersion?.id, metric.key, period, dimension.toLowerCase(), "plan");
                    const expected = cellValue(plan.cells, scenario?.id ?? working.id, metric.key, period, dimension.toLowerCase(), "forecast");
                    return <td key={period} className="px-3 py-2 align-top"><div className="tabular-nums">{showMeasure(planned, metric.unit, plan.currency)}</div><div className="text-[var(--color-ink-muted)] tabular-nums">{showMeasure(expected, metric.unit, plan.currency)}</div>{canEdit && !dimension ? <CellForm planId={plan.id} metric={metric.key} period={period} kind="forecast" /> : null}</td>;
                  })}
                  <td className="px-3 py-3 text-[var(--color-ink-muted)]">{quarterTotals(periods.map((period) => ({ periodKey: period, value: cellValue(plan.cells, working.id, metric.key, period, dimension.toLowerCase(), "forecast") })), metric.aggregation === "average" ? "average" : metric.aggregation === "none" ? "none" : "sum").map((quarter) => <div key={quarter.key}>{quarter.key} {showMeasure(quarter.value, metric.unit, plan.currency)}</div>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-[var(--color-ink-muted)]">Top figure is the plan. Lower figure is the {scenario ? "scenario" : "forecast"}. Actuals stay out of the cells and are read from Atlas. {actuals[metric.key]?.partial ? "The actual is partial." : ""}</p>
        </section>
      ) : null}
      {canEdit && metric ? <CellForm planId={plan.id} metric={metric.key} period={periods[0] ?? plan.periodLabel} kind="plan" labelled /> : null}
      {actuals[metric?.key ?? ""]?.contributors.length ? <section className="text-sm"><h3 className="font-semibold">Where the actual comes from</h3><ul className="mt-2 space-y-1">{actuals[metric!.key].contributors.map((item) => <li key={item.label}>{item.href ? <Link href={item.href} className="text-[var(--color-atlas-blue)]">{item.label}</Link> : item.label} <span className="text-[var(--color-ink-muted)]">{item.detail}</span></li>)}</ul></section> : null}
      <PlanStory session={session} plan={plan} revenuePlan={planVersion ? plan.cells.filter((cell) => cell.versionId === planVersion.id && cell.metricKey === "revenue" && cell.kind === "plan" && cell.dimensionKey === "").reduce<number | null>((total, cell) => (total ?? 0) + Number(cell.value), null) : null} actuals={actuals} />
      {sections.has("assumptions") ? <section id="assumptions"><h3 className="text-xl font-semibold">Assumptions</h3><ul className="mt-3 space-y-2 text-sm">{plan.assumptions.map((item) => <li key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3"><span className="font-medium">{item.name}</span> {item.valueText} <span className="text-[var(--color-ink-muted)]">{item.note}</span></li>)}{!plan.assumptions.length ? <li className="text-[var(--color-ink-muted)]">No assumptions yet.</li> : null}</ul>{canEdit ? <form action={addAssumption} className="mt-3 grid gap-2 sm:grid-cols-4"><input type="hidden" name="planId" value={plan.id} /><input name="name" placeholder="Name" className={field} /><input name="value" placeholder="3.5%" className={field} /><input name="note" placeholder="When it applies" className={field} /><button className={primary}>Add</button></form> : null}</section> : null}
      {sections.has("drivers") ? <section><h3 className="text-xl font-semibold">Drivers</h3>{plan.drivers.map((driver) => { const inputs = Array.isArray(driver.inputs) ? driver.inputs.flatMap((item) => item && typeof item === "object" && "label" in item && "value" in item ? [{ label: String(item.label), value: Number(item.value) }] : []) : []; const explained = explainDriver(inputs); return <div key={driver.id} className="mt-3 rounded-2xl border border-slate-200 p-4 text-sm"><p className="font-medium">{driver.name}</p>{"error" in explained ? <p>{explained.error}</p> : <p className="mt-2">{explained.steps.join(" × ")} = {explained.total.toLocaleString("en-GB")}</p>}</div>; })}{canEdit ? <form action={addDriver} className="mt-3 grid gap-2 sm:grid-cols-2"><input type="hidden" name="planId" value={plan.id} /><input name="name" placeholder="Driver name" className={field} /><input name="output" placeholder="Result name" className={field} /><input name="label1" placeholder="Salespeople" className={field} /><input name="value1" placeholder="12" className={field} /><input name="label2" placeholder="Opportunities" className={field} /><input name="value2" placeholder="18" className={field} /><button className={primary}>Explain</button></form> : null}</section> : null}
      {sections.has("models") ? <section><h3 className="text-xl font-semibold">Connections</h3><p className="mt-1 text-sm text-[var(--color-ink-muted)]">A change moves to another measure only along a connection kept here.</p><ul className="mt-3 space-y-2 text-sm">{plan.modelLinks.map((link) => <li key={link.id}>{metricByKey(link.fromKey)?.name} → {metricByKey(link.toKey)?.name} · {Number(link.passthrough)} of the change. {link.note}</li>)}</ul>{session.capabilities.has("plan.model.manage") ? <form action={addLink} className="mt-3 grid gap-2 sm:grid-cols-4"><input type="hidden" name="planId" value={plan.id} /><input name="from" placeholder="sales_volume" className={field} /><input name="to" placeholder="production_demand" className={field} /><input name="passthrough" placeholder="0.8" className={field} /><button className={primary}>Keep connection</button></form> : null}</section> : null}
      {sections.has("scenarios") ? <section><h3 className="text-xl font-semibold">Scenarios</h3><ul className="mt-3 space-y-2 text-sm">{plan.versions.filter((version) => version.kind === "scenario").map((version) => <li key={version.id} className="flex flex-wrap items-center gap-3"><Link href={`/plan/plans/${plan.id}?scenario=${version.id}`} className="font-medium">{version.name}</Link>{session.capabilities.has("plan.approve") ? <form action={promoteScenario}><input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="scenarioId" value={version.id} /><button className={quiet}>Promote to forecast</button></form> : null}</li>)}{!plan.versions.some((version) => version.kind === "scenario") ? <li className="text-[var(--color-ink-muted)]">No scenario yet. The working plan stays as it is until you promote one.</li> : null}</ul>{session.capabilities.has("plan.scenario.create") ? <form action={createScenario} className="mt-3 grid gap-2 sm:grid-cols-4"><input type="hidden" name="planId" value={plan.id} /><input name="name" placeholder="Add a Saturday shift" className={field} /><input name="metric" placeholder="sales_volume" className={field} /><input name="percent" placeholder="10" className={field} /><button className={primary}>Create scenario</button></form> : null}</section> : null}
      {sections.has("risks") ? <Section title="Risks" id="risks">{plan.risks.map((risk) => <p key={risk.id}><span className="font-medium">{risk.title}</span> {risk.impactText}</p>)}{canEdit ? <form action={addRisk} className="mt-2 grid gap-2 sm:grid-cols-2"><input type="hidden" name="planId" value={plan.id} /><input name="title" placeholder="Risk" className={field} /><input name="impact" placeholder="What it does to the plan" className={field} /><button className={primary}>Add risk</button></form> : null}</Section> : null}
      {sections.has("dependencies") ? <Section title="Dependencies">{plan.dependencies.map((item) => <p key={item.id}>{item.title}{item.dependsOnPlanId ? <Link href={`/plan/plans/${item.dependsOnPlanId}`} className="ml-2 text-[var(--color-atlas-blue)]">Plan</Link> : null}</p>)}{canEdit ? <Inline action={addDependency} planId={plan.id} name="title" placeholder="Depends on" /> : null}</Section> : null}
      {sections.has("decisions") ? <Section title="Decisions" id="decisions">{plan.decisions.map((item) => <p key={item.id}><span className="font-medium">{item.title}</span> · {item.decidedOn.toLocaleDateString("en-GB")} · {item.ownerName}<span className="block text-[var(--color-ink-muted)]">{item.reason} {item.impact}</span></p>)}{canEdit ? <form action={addDecision} className="mt-2 grid gap-2"><input type="hidden" name="planId" value={plan.id} /><input name="title" placeholder="Decision" className={field} /><input name="reason" placeholder="Reason" className={field} /><input name="impact" placeholder="Impact" className={field} /><button className={primary}>Record decision</button></form> : null}</Section> : null}
      {sections.has("production") ? <section><h3 className="text-xl font-semibold">Live production</h3><p className="mt-1 text-sm text-[var(--color-ink-muted)]">{picture.note}</p>{picture.products.slice(0, 8).map((product) => <div key={product.id} className="mt-3 rounded-2xl border border-slate-200 p-4 text-sm"><p className="font-medium">{product.name}</p><p>Demand {product.demand.toLocaleString("en-GB")} · Planned {product.planned.toLocaleString("en-GB")} · Scheduled {product.scheduled.toLocaleString("en-GB")} · Gap {(product.demand - product.scheduled).toLocaleString("en-GB")}</p>{product.orders.map((order) => <Link key={order.reference} href={`/sales/orders/${order.id}`} className="mr-3 text-[var(--color-atlas-blue)]">{order.reference}</Link>)}</div>)}{picture.centres.length ? <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{picture.centres.map((centre) => `${centre.name} (${centre.rate})`).join(" · ")}</p> : null}</section> : null}
      <section className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {session.capabilities.has("plan.submit") ? <form action={submitPlan}><input type="hidden" name="planId" value={plan.id} /><button className={quiet}>Submit</button></form> : null}
        {session.capabilities.has("plan.approve") ? <form action={approvePlan}><input type="hidden" name="planId" value={plan.id} /><button className={primary}>Approve baseline</button></form> : null}
        {session.capabilities.has("plan.lock") ? <form action={lockPlan}><input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="unlock" value={plan.locked ? "1" : "0"} /><button className={quiet}>{plan.locked ? "Unlock" : "Lock"}</button></form> : null}
        {canEdit ? <form action={addReview} className="flex gap-2"><input type="hidden" name="planId" value={plan.id} /><input name="title" placeholder="Review name" className={field} /><button className={quiet}>Add review</button></form> : null}
        {plan.reviews.filter((review) => review.status !== "completed").map((review) => session.capabilities.has("plan.review") ? <form key={review.id} action={completeReview}><input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="reviewId" value={review.id} /><button className={quiet}>Snapshot {review.title}</button></form> : null)}
      </section>
      {canEdit ? <details className="text-sm"><summary className="cursor-pointer font-medium">Add a measure, split a target, or import</summary>
        <form action={addMeasure} className="mt-3 flex gap-2"><input type="hidden" name="planId" value={plan.id} /><input name="metric" placeholder="Search, then type the measure key" className={field} /><button className={quiet}>Add measure</button></form>
        <p className="mt-2 text-[var(--color-ink-muted)]">Search first. If more than one measure matches, choose the key yourself.</p>
        <form action={distributeTargets} className="mt-3 grid gap-2 sm:grid-cols-2"><input type="hidden" name="planId" value={plan.id} /><input name="metric" placeholder="revenue" className={field} /><input name="total" placeholder="12000000" className={field} /><input name="period" placeholder={periods[0]} className={field} /><select name="method" className={field}><option value="equal">Equal</option><option value="share">Historical share</option><option value="capacity">Capacity</option><option value="driver">Driver</option></select><input name="rows" placeholder="North=40, South=35, Export=25" className={field} /><button className={quiet}>Split target</button></form>
        <form action={importGrid} className="mt-3"><input type="hidden" name="planId" value={plan.id} /><textarea name="grid" className={field} rows={4} placeholder={"metric,period,dimension,kind,value\nrevenue,2027-01,,plan,1000000"} /><button className={`${quiet} mt-2`}>Import rows</button></form>
      </details> : null}
    </div>
  );
}

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-3xl border border-slate-200 p-5"><p className="text-sm text-[var(--color-ink-muted)]">{label}</p><p className="mt-2 text-4xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-sm text-[var(--color-ink-muted)]">{note}</p></div>;
}

function Chart({ periods, values, unit, plan }: { periods: string[]; values: Array<{ period: string; plan: number | null; forecast: number | null; actual: number | null }>; unit: "money" | "percent" | "count" | "hours" | "units"; plan: string }) {
  const max = Math.max(...values.flatMap((value) => [value.plan ?? 0, value.forecast ?? 0, value.actual ?? 0]), 1);
  return <div className="flex h-48 items-end gap-2 overflow-x-auto">{periods.map((period, index) => <div key={period} className="flex min-w-12 flex-1 flex-col items-center gap-1"><div className="flex h-36 w-full items-end gap-0.5"><Bar value={values[index]?.plan} max={max} /><Bar value={values[index]?.forecast} max={max} soft /><Bar value={values[index]?.actual} max={max} faint /></div><span className="text-[10px] text-[var(--color-ink-faint)]">{period.slice(5)}</span><span className="sr-only">{showMeasure(values[index]?.forecast, unit, plan)}</span></div>)}</div>;
}

function Bar({ value, max, soft, faint }: { value: number | null; max: number; soft?: boolean; faint?: boolean }) {
  return <div className="w-full rounded-t" style={{ height: `${Math.max(((value ?? 0) / max) * 100, value ? 4 : 0)}%`, background: faint ? "#d6d6db" : soft ? "var(--color-atlas-blue-soft)" : "var(--color-atlas-blue)" }} />;
}

function CellForm({ planId, metric, period, kind, labelled }: { planId: string; metric: string; period: string; kind: string; labelled?: boolean }) {
  return <form action={saveCell} className={labelled ? "mt-2 flex max-w-sm gap-2" : "mt-1"}><input type="hidden" name="planId" value={planId} /><input type="hidden" name="metric" value={metric} /><input type="hidden" name="period" value={period} /><input type="hidden" name="kind" value={kind} />{labelled ? <span className="sr-only">Plan value</span> : null}<input name="value" aria-label={`${kind} ${period}`} placeholder={kind === "plan" ? "Plan" : "Forecast"} className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs" /><button className="text-[10px] text-[var(--color-atlas-blue)]">Save</button></form>;
}

function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return <section id={id}><h3 className="text-xl font-semibold">{title}</h3><div className="mt-3 space-y-2 text-sm">{children}</div></section>;
}

function Inline({ action, planId, name, placeholder }: { action: (form: FormData) => Promise<void>; planId: string; name: string; placeholder: string }) {
  return <form action={action} className="mt-2 flex gap-2"><input type="hidden" name="planId" value={planId} /><input name={name} placeholder={placeholder} className={field} /><button className={quiet}>Add</button></form>;
}
