import Link from "next/link";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { setDocumentSalesProjectAction } from "@/modules/crm/services/sales-projects-commands";

/** The sales project a quotation or order belongs to, with a picker to change it. */
export async function SalesProjectLink({ kind, documentId }: { kind: "quote" | "order"; documentId: string }) {
  const session = await requireSession();
  if (!can(session, SALES_CAPABILITIES.opportunityRead)) return null;
  const organisationId = session.organisationId;
  const document = kind === "quote" ? await db.quote.findFirst({ where: { id: documentId, organisationId }, select: { partyId: true, salesProject: { select: { id: true, reference: true, name: true } } } }) : await db.salesOrder.findFirst({ where: { id: documentId, organisationId }, select: { partyId: true, salesProject: { select: { id: true, reference: true, name: true } } } });
  if (!document) return null;
  const change = can(session, SALES_CAPABILITIES.opportunityManage) || can(session, kind === "quote" ? SALES_CAPABILITIES.quoteCreate : SALES_CAPABILITIES.orderEditDraft) || can(session, SALES_CAPABILITIES.orderAmend);
  const projects = change ? await db.salesProject.findMany({ where: { organisationId, OR: [{ stage: { notIn: ["LOST", "CANCELLED"] } }, { id: document.salesProject?.id ?? "" }] }, select: { id: true, reference: true, name: true, organisations: { select: { partyId: true } } }, orderBy: { reference: "desc" }, take: 500 }) : [];
  const here = (project: (typeof projects)[number]) => project.organisations.some((row) => row.partyId === document.partyId);
  const current = document.salesProject;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-semibold">Sales project</h3><p className="mt-1 text-xs text-slate-500">The job this {kind === "quote" ? "quotation" : "order"} is for. Its value counts towards the project.</p></div>
      {current ? <Link href={`/crm/projects/${current.id}`} className="text-sm text-blue-600">{current.reference} · {current.name} →</Link> : <p className="text-sm text-slate-400">Not on a project</p>}
    </div>
    {change && <ActionForm action={setDocumentSalesProjectAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="documentId" value={documentId} />
      <label className="text-xs text-slate-500">Project<select name="salesProjectId" defaultValue={current?.id ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">No sales project</option>{[...projects].sort((a, b) => Number(here(b)) - Number(here(a))).map((project) => <option key={project.id} value={project.id}>{project.reference} · {project.name}{here(project) ? " · this customer" : ""}</option>)}</select></label>
      <Button type="submit">Save project</Button>
    </ActionForm>}
    {change && !projects.length && <p className="mt-3 text-xs text-slate-500">No sales projects yet. <Link href={`/crm/projects/new?customer=${document.partyId}`} className="font-medium text-blue-600">Create one →</Link></p>}
  </section>;
}
