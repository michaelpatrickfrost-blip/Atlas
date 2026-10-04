import Link from "next/link";
import type { Session } from "@/core/auth/session";
import { PLAN_TYPES, metricsFor, templateFor } from "../domain/catalogue";
import { createPlan } from "../services/commands";
import { enabledModules, planList } from "../services/queries";
import { field, primary } from "./format";

export async function CreatePlan({ session, query }: { session: Session; query: Record<string, string | undefined> }) {
  const type = query.type;
  const mode = query.mode;
  const year = query.year;
  if (!type) {
    return (
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">What are you planning?</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_TYPES.map(([key, label]) => (
            <Link key={key} href={`/plan/plans/new?type=${key}`} className="rounded-3xl border border-slate-200 px-5 py-4 font-medium hover:border-[var(--color-atlas-blue)]">{label}</Link>
          ))}
        </div>
      </div>
    );
  }
  const template = templateFor(type);
  if (!mode) {
    return (
      <form className="max-w-xl space-y-4" action="/plan/plans/new" method="get">
        <input type="hidden" name="type" value={type} />
        <h2 className="text-3xl font-semibold tracking-tight">{template.purpose || "A blank plan."}</h2>
        <label className="block text-sm">Period
          <select name="mode" className={field} defaultValue="year">
            <option value="year">Year</option>
            <option value="quarter">Quarter</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="block text-sm">Year<input name="year" defaultValue={String(new Date().getFullYear() + 1)} className={field} /></label>
        <label className="block text-sm">Quarter
          <select name="quarter" className={field} defaultValue="1"><option>1</option><option>2</option><option>3</option><option>4</option></select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Start<input type="date" name="start" className={field} /></label>
          <label className="text-sm">End<input type="date" name="end" className={field} /></label>
        </div>
        <button className={primary}>Continue</button>
      </form>
    );
  }
  const enabled = await enabledModules(session.organisationId);
  const sensitive = session.capabilities.has("plan.sensitive.read");
  const metrics = metricsFor(enabled, sensitive);
  const selected = new Set(template.metricKeys);
  const plans = await planList(session);
  return (
    <form action={createPlan} className="max-w-3xl space-y-6">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="year" value={year ?? ""} />
      <input type="hidden" name="quarter" value={query.quarter ?? "1"} />
      <input type="hidden" name="start" value={query.start ?? ""} />
      <input type="hidden" name="end" value={query.end ?? ""} />
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Measures Atlas can use</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">These are the company&apos;s definitions. Untick anything that does not belong. Suggested connections stay off until you keep them.</p>
      </div>
      <label className="block text-sm">Name<input name="name" className={field} placeholder={`${year ?? ""} ${type} plan`} /></label>
      <label className="block text-sm">Purpose<textarea name="purpose" className={field} defaultValue={template.purpose} rows={2} /></label>
      <label className="block text-sm">Team<input name="team" className={field} /></label>
      {mode === "custom" ? <div className="grid grid-cols-2 gap-3"><label className="text-sm">Start<input type="date" name="start" className={field} required /></label><label className="text-sm">End<input type="date" name="end" className={field} required /></label></div> : null}
      <fieldset className="grid gap-2 sm:grid-cols-2">
        {metrics.map((metric) => (
          <label key={metric.key} className="flex gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            <input type="checkbox" name="metric" value={metric.key} defaultChecked={selected.has(metric.key)} />
            <span><span className="block font-medium">{metric.name}</span><span className="text-[var(--color-ink-muted)]">{metric.definition}</span></span>
          </label>
        ))}
      </fieldset>
      {template.links.length ? (
        <fieldset className="space-y-2">
          <legend className="font-medium">Suggested connections</legend>
          {template.links.map((link) => (
            <label key={`${link.fromKey}-${link.toKey}`} className="flex gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <input type="checkbox" name="link" value={`${link.fromKey}|${link.toKey}|${link.passthrough}`} />
              <span>{link.note}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {sensitive ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="sensitive" defaultChecked={template.sensitive === true} />Contains sensitive figures</label> : null}
      {plans.length ? <label className="block text-sm">Rolls into<select name="parent" className={field} defaultValue=""><option value="">No parent plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label> : null}
      <button className={primary}>Create plan</button>
    </form>
  );
}
