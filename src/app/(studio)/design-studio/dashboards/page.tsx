import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChartNoAxesCombined, Plus } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { loadBusinessViewMetricsInTransaction } from "@/modules/analytics/services/studio-business-view";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass } from "@/components/ui/service-fields";
import { createBusinessDashboard } from "./actions";

export default async function BusinessDashboards({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const actor = await requireSession(), { business } = await searchParams;
  const workspace = await withStudioAuthoringAuthority(actor, CAP.read, business, async authority => {
    await authority.registry.resolve(authority.session, authority.registry.describe("analytics.dashboard.view", 1));
    const dashboards = await authority.transaction.studioDefinition.findMany({ where: {
      organisationId: authority.session.organisationId, kind: "view", retiredAt: null,
      draft: { is: { payload: { path: ["sourceView", "id"], equals: "analytics.dashboard.view" } } },
    }, select: { id: true, name: true, activeVersionId: true }, orderBy: { updatedAt: "desc" }, take: 101 });
    if (dashboards.length > 100) throw new Error("This business dashboard library has reached its approved limit.");
    return { name: authority.session.organisationName, dashboards,
      canEdit: authority.session.capabilities.has(CAP.edit) && authority.session.capabilities.has("analytics.dashboard.manage"),
      measures: await loadBusinessViewMetricsInTransaction(authority, "90") };
  });
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  return <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-10 md:py-12">
    <Link className="inline-flex items-center gap-2 text-sm text-slate-500" href={`/design-studio${suffix}`}><ArrowLeft size={16}/>Back to Studio</Link>
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Business dashboards · {workspace.name}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Give your team a clear picture.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Arrange charts and key numbers, choose colours and layouts, then publish a dashboard to your team&apos;s Home.</p></header>
    <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-7"><h2 className="text-xl font-semibold">Your business designs</h2>
        <div className="mt-5 grid gap-3">{workspace.dashboards.map(view => <Link className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5 hover:border-blue-300" key={view.id} href={`/design-studio/dashboards/${view.id}${suffix}`}>
          <div><h3 className="font-semibold">{view.name}</h3><p className="mt-2 text-xs text-slate-500">{view.activeVersionId ? "Live · edit a draft" : "Draft · ready to design"}</p></div><ArrowUpRight size={18}/></Link>)}
          {!workspace.dashboards.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8"><ChartNoAxesCombined className="text-blue-500"/><h3 className="mt-4 font-semibold">Start with a business measure.</h3><p className="mt-2 text-sm leading-6 text-slate-500">Build your first dashboard from the current measures available to this business.</p></div>}</div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-7"><h2 className="flex items-center gap-2 text-xl font-semibold"><Plus size={20}/>Create a dashboard</h2>
        {workspace.canEdit && workspace.measures.length ? <ActionForm action={createBusinessDashboard} label="Start designing" className="mt-5 space-y-5">
          {business && <input type="hidden" name="business" value={business}/>}
          <label className="grid gap-2 text-sm font-medium">Dashboard name<input className={inputClass} name="name" defaultValue="Business overview" maxLength={150} required/></label>
          <label className="grid gap-2 text-sm font-medium">Start with<select className={inputClass} name="measure">{workspace.measures.map(measure => <option key={measure.id} value={measure.id}>{measure.name}</option>)}</select></label>
          <p className="text-xs leading-5 text-slate-500">You can add more charts, change their appearance and rearrange them in the designer.</p>
        </ActionForm> : <p className="mt-5 text-sm leading-6 text-slate-500">{workspace.canEdit ? "Enable an app with an approved business measure to start designing." : "Ask your business administrator for dashboard design access."}</p>}
      </section>
    </div>
  </div>;
}
