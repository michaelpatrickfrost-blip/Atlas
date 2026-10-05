import Link from "next/link";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { formatMoney } from "@/core/shared/money";
import { StatusPill } from "@/components/ui/status-pill";
import { stageLabel, stageTone } from "@/modules/crm/domain/sales-project";

/** Sales projects for the customer on an opportunity, and a prefilled way to start one. */
export async function OpportunitySalesProjects({ partyId, name, valueAmount }: { partyId: string; name: string; valueAmount: number }) {
  const session = await requireSession();
  if (!can(session, SALES_CAPABILITIES.opportunityRead)) return null;
  const projects = await db.salesProject.findMany({ where: { organisationId: session.organisationId, organisations: { some: { partyId } } }, select: { id: true, reference: true, name: true, stage: true, potentialValueAmount: true, potentialValueCurrency: true }, orderBy: { updatedAt: "desc" }, take: 20 });
  const create = `/crm/projects/new?${new URLSearchParams({ customer: partyId, name, value: valueAmount ? (valueAmount / 100).toFixed(2) : "" })}`;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-semibold">Sales project</h3><p className="mt-1 text-xs text-slate-500">The job this deal belongs to. It also appears under Projects in Sales, with its quotations and orders.</p></div>
      {can(session, SALES_CAPABILITIES.opportunityManage) && <Link href={create} className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">New sales project</Link>}
    </div>
    {projects.length ? <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{projects.map((project) => <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><Link href={`/crm/projects/${project.id}`} className="text-sm font-medium text-blue-700">{project.reference} · {project.name}</Link><span className="flex items-center gap-3"><StatusPill label={stageLabel(project.stage)} tone={stageTone(project.stage)} />{project.potentialValueAmount != null && <span className="text-sm tabular-nums">{formatMoney(project.potentialValueAmount, project.potentialValueCurrency)}</span>}</span></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No sales project for this customer yet.</p>}
  </section>;
}
