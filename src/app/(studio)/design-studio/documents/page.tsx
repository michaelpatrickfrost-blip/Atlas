import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText, Plus } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { requireTemplateWorkspace } from "@/core/templates/service";

export default async function Documents({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const actor = await requireSession(), business = (await searchParams).business;
  const workspace = await withStudioAuthoringAuthority(actor, CAP.read, business, async authority => {
    assertCapability(authority.session, "core.contract.manage"); await requireTemplateWorkspace(authority.session);
    const templates = await authority.transaction.documentTemplate.findMany({ where: { organisationId: authority.session.organisationId,
      status: { not: "ARCHIVED" } }, select: { id: true, name: true, description: true, status: true, version: true, targetModules: true },
      orderBy: { updatedAt: "desc" }, take: 100 });
    return { templates, name: authority.session.organisationName, canEdit: authority.session.capabilities.has(CAP.edit) };
  });
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  return <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-10 md:py-12">
    <header className="flex flex-wrap items-end justify-between gap-5"><div><Link href={`/design-studio${suffix}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><ArrowLeft className="h-4 w-4"/>Back to Studio</Link>
      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Document templates · {workspace.name}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Documents that feel like your business.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Arrange document sections, insert business details and preview the result. Published templates are available to the existing apps that use them.</p></div>
      {workspace.canEdit && <Link href={`/design-studio/documents/new${suffix}`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4"/>Create a template</Link>}
    </header>
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{workspace.templates.map(template => <Link key={template.id} href={`/design-studio/documents/${template.id}${suffix}`} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300">
      <div className="flex justify-between"><FileText className="h-6 w-6 text-blue-600"/><ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600"/></div>
      <h2 className="mt-5 text-lg font-semibold">{template.name}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{template.description || "A bespoke business document."}</p>
      <p className="mt-5 text-xs font-medium text-blue-700">{template.status === "PUBLISHED" ? "Published · available in its apps" : "Draft"} · Version {template.version}</p>
    </Link>)}</div>
    {!workspace.templates.length && <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center"><h2 className="text-lg font-semibold">Create your first business template.</h2><p className="mt-3 text-sm text-slate-500">Start from an agreement or a blank document, then arrange its sections with a live sample preview.</p></div>}
  </div>;
}
