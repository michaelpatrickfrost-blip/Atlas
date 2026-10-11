import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText, LayoutDashboard, PanelsTopLeft, Plus } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { discoverPageScreensInTransaction } from "@/core/studio/authoring/catalog";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { createVisualScreen } from "./actions";
import { screenLayouts } from "./layouts";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass } from "@/components/ui/service-fields";

export default async function StudioWorkspace({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const actor = await requireSession(), business = (await searchParams).business;
  const workspace = await withStudioAuthoringAuthority(actor, CAP.read, business, async authority => {
    const sources = await discoverPageScreensInTransaction(authority);
    const layouts = [];
    for (const source of sources) for (const layout of await screenLayouts(authority, source.entity))
      layouts.push({ ...layout, screenId: source.entity.id, screenName: source.name });
    const pages = await authority.transaction.studioDefinition.findMany({ where: { organisationId: authority.session.organisationId,
      kind: "page", retiredAt: null }, select: { id: true, name: true, activeVersionId: true, latestVersion: true, updatedAt: true },
      orderBy: { updatedAt: "desc" }, take: 100 });
    return { businessName: authority.session.organisationName, layouts, pages, canEdit: authority.session.capabilities.has(CAP.edit) };
  });
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  const back = actor.capabilities.has(ATLAS_CAPABILITIES.staff) ? `/atlas/studio/${business}` : "/home";
  return <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-7">
      <div><Link href={back} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><ArrowLeft className="h-4 w-4"/>Back to {business ? "Atlas Admin" : "your business"}</Link>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Atlas Studio · {workspace.businessName}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Make this business feel like itself.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Choose a starting layout, arrange the details your team needs, and preview the screen before it goes live.</p>
      </div><div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">Designing for<br/><strong>{workspace.businessName}</strong></div>
    </header>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-3"><span className="rounded-2xl bg-blue-50 p-3 text-blue-600"><PanelsTopLeft className="h-6 w-6"/></span><div><h2 className="text-xl font-semibold">Business screens</h2><p className="mt-1 text-sm text-slate-500">Your team&apos;s saved designs.</p></div></div>
        <div className="mt-6 grid gap-3">{workspace.pages.map(page => <Link key={page.id} href={`/design-studio/${page.id}${suffix}`} className="group flex items-center justify-between rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/40">
          <div><h3 className="font-semibold">{page.name}</h3><p className="mt-1 text-xs text-slate-500">{page.activeVersionId ? "Live screen · edit a draft" : "Draft · ready to design"}</p></div><ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600"/>
        </Link>)}{!workspace.pages.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><h3 className="font-semibold">Start with a screen your team uses every day.</h3><p className="mt-2 text-sm leading-6 text-slate-500">Pick a starting layout to create your first business design.</p></div>}</div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><h2 className="flex items-center gap-2 text-xl font-semibold"><Plus className="h-5 w-5 text-blue-600"/>Create a screen</h2><p className="mt-2 text-sm leading-6 text-slate-500">Start with an app-approved layout. You can change its sections, details and buttons in the designer.</p>
        {workspace.canEdit && workspace.layouts.length ? <div className="mt-6 grid gap-4">{workspace.layouts.map(layout => <ActionForm key={layout.id} action={createVisualScreen} className="rounded-2xl border border-slate-200 p-4" label={`Design ${layout.name}`}>
          {business && <input type="hidden" name="business" value={business}/>}<input type="hidden" name="screen" value={layout.screenId}/><input type="hidden" name="layout" value={layout.id}/>
          <h3 className="font-semibold">{layout.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{layout.description}</p>
          <label className="my-3 grid gap-1 text-xs font-medium">Screen name<input className={inputClass} name="name" defaultValue={layout.name} maxLength={150} required/></label>
        </ActionForm>)}</div> : <p className="mt-6 text-sm text-slate-500">{workspace.canEdit ? "Enable an app with an approved screen source to start designing." : "Ask a business administrator for permission to design screens."}</p>}
      </section>
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{[{ icon: FileText, title: "Document templates", text: "Use the existing Templates editor for quotations, acknowledgements and other business documents.", href: "/templates" },
      { icon: LayoutDashboard, title: "Business dashboards", text: "Use the existing Analytics workspace to arrange and publish dashboards.", href: "/analytics" }].map(({ icon: Icon, title, text, href }) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6"><Icon className="h-5 w-5 text-blue-600"/><h2 className="mt-3 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
        {business ? <p className="mt-4 text-xs font-medium text-slate-500">Open this business&apos;s workspace from Atlas Admin to use its existing editor.</p> : <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">Open {title.toLowerCase()}<ArrowUpRight className="h-4 w-4"/></Link>}</div>)}</div>
  </div>;
}
