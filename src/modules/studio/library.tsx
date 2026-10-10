import Link from "next/link";
import type { Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { listDefinitions } from "@/core/studio/definitions/service";
import { Card } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { PanelsTopLeft, FileText, LayoutDashboard } from "lucide-react";
import { create } from "@/app/(app)/studio/actions";
export async function StudioLibrary({session,root="/studio",target}: {session:Session;root?:string;target?:string}) {
  assertCapability(session, CAP.read);
  const definitions = await listDefinitions(session);
  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Studio · {session.organisationName}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Business setup</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tailor the software for this business: its screens, documents and dashboards.</p></div>
    <Card className="overflow-hidden">
      <div className="border-b border-blue-100 bg-blue-50/60 p-6"><span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">Visual designer in development</span><h3 className="mt-4 text-lg font-semibold">Choose a layout, customise it, preview and publish</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This design experience is still being built. The advanced reference setup below is available now; it does not change the business&apos;s screens or document layouts.</p></div>
      <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
        {[{icon:PanelsTopLeft,title:"Screens & forms",description:"Design business-specific sales order and quotation screens."},{icon:FileText,title:"Document templates",description:"Customise document sections and see a preview before publishing."},{icon:LayoutDashboard,title:"Dashboards & buttons",description:"Publish business layouts with approved actions for its users."}].map(({icon:Icon,title,description})=><div key={title} className="p-6"><Icon aria-hidden="true" className="h-5 w-5 text-blue-600"/><h4 className="mt-3 font-semibold">{title}</h4><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><p className="mt-3 text-xs font-medium text-slate-500">Not available in Studio yet</p></div>)}
      </div>
      <p className="border-t border-slate-100 px-6 py-4 text-sm leading-6 text-slate-600">Where Templates is enabled, existing document templates can be edited in the business&apos;s Templates app. Bringing that editor into this business setup is part of the remaining Studio work.</p>
    </Card>
    <details id="advanced-setup" className="group rounded-2xl border border-slate-200 bg-white">
      <summary className="cursor-pointer rounded-2xl p-6 focus-visible:outline-2 focus-visible:outline-blue-600"><span className="font-semibold">Advanced setup</span><span className="mt-1 block text-sm leading-6 text-slate-500">Optional technical reference records and version history. These records support the foundation; business layouts will be designed separately.</span></summary>
      <div className="space-y-5 border-t border-slate-100 p-6">
    <Card className="p-6"><h3 className="font-semibold">Saved reference sets</h3><ul className="mt-4 divide-y divide-slate-100">{definitions.map(d => <li key={d.id} className="flex flex-wrap justify-between gap-2 py-3"><Link className="font-medium text-blue-700" href={`${root}/${d.id}`}>{d.name}</Link><span className="text-sm text-slate-500">{d.retiredAt ? "Retired" : d.activeVersionId ? "Active reference set" : "Not active"} · {d.latestVersion} published versions</span></li>)}</ul>{!definitions.length && <p className="mt-4 text-sm text-slate-500">No saved technical reference sets.</p>}</Card>
    {can(session, CAP.edit) && <Card className="p-6"><h3 className="font-semibold">New reference set</h3><p className="mt-2 text-sm text-slate-500">For reviewing approved data references. This creates a technical record, not a template or screen.</p><ActionForm action={create} className="mt-4 grid gap-4" label="Create draft">
      {target && <input type="hidden" name="organisationId" value={target}/>}
      <label className="grid gap-1 text-sm">Name<input name="name" required maxLength={150} className="rounded-lg border p-2" /></label>
      <label className="grid gap-1 text-sm">Description<textarea name="description" aria-label="Description" maxLength={2000} className="rounded-lg border p-2" /></label>
    </ActionForm></Card>}
      </div>
    </details>
  </div>;
}
