import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { linkCommercialProject } from "@/modules/sales/services/commercial";

const input = "mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export function CommercialLinks({
  target, recordId, partyId, opportunityId, agreementId, project, projects, canLink, canCreateQuote, canCreateOrder,
}: {
  target: "opportunity" | "quote" | "order" | "agreement";
  recordId: string;
  partyId: string;
  opportunityId?: string | null;
  agreementId?: string | null;
  project?: { id: string; name: string; reference: string } | null;
  projects: { id: string; name: string }[];
  canLink: boolean;
  canCreateQuote?: boolean;
  canCreateOrder?: boolean;
}) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold">Project</h3>
        <p className="mt-1 text-xs text-slate-500">The same delivery project is shared by CRM, the quotation and the sales order.</p>
      </div>
      {project ? <Link href={`/projects/${project.id}`} className="text-sm text-blue-600">{project.reference} · {project.name} →</Link> : <p className="text-sm text-slate-400">No project yet</p>}
    </div>
    {canLink && <ActionForm action={linkCommercialProject} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="recordId" value={recordId} />
      <input type="hidden" name="partyId" value={partyId} />
      <input type="hidden" name="opportunityId" value={opportunityId ?? ""} />
      <label className="text-xs text-slate-500">Existing project<select name="projectId" defaultValue={project?.id ?? ""} className={input}><option value="">Create a new project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-xs text-slate-500">New project name<input name="name" placeholder="Customer delivery" className={input} /></label>
      <Button type="submit">Save project</Button>
    </ActionForm>}
    {(canCreateQuote || canCreateOrder) && <div className="mt-4 flex flex-wrap gap-4 text-sm">
      {canCreateQuote && !agreementId && <Link className="text-blue-600" href={`/sales/agreements/new?customer=${partyId}`}>New call-off order</Link>}
      {canCreateOrder && agreementId && <Link className="text-blue-600" href={`/sales/agreements/${agreementId}`}>Deliver and invoice</Link>}
    </div>}
  </section>;
}
