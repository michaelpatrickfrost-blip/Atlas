import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { createSalesProjectFormAction } from "@/modules/crm/services/sales-projects-commands";
import { STAGES, stageLabel } from "@/modules/crm/domain/sales-project";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";

export default async function NewSalesProjectPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  const [{ customer }, parties] = await Promise.all([searchParams, db.party.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" } })]);
  return <div className="mx-auto max-w-3xl space-y-5">
    <Link href="/crm/projects" className="text-xs text-slate-500">← All projects</Link>
    <div><h2 className="text-2xl font-semibold tracking-tight">New sales project</h2><p className="mt-1 text-sm text-slate-500">A job you are trying to win. Add the organisations involved, then attach quotations and orders to it.</p></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <ActionForm action={createSalesProjectFormAction}><div className="space-y-4">
        <label className="block text-xs font-medium">Project name<input name="name" required maxLength={200} placeholder="Riverside apartments, phase 2" className={field} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium">Main customer<select name="partyId" defaultValue={customer ?? ""} className={field}><option value="">Add later</option>{parties.map((party) => <option key={party.id} value={party.id}>{party.customerCode} · {party.name}</option>)}</select></label>
          <label className="block text-xs font-medium">Stage<select name="stage" defaultValue="IDENTIFIED" className={field}>{STAGES.map((stage) => <option key={stage} value={stage}>{stageLabel(stage)}</option>)}</select></label>
          <label className="block text-xs font-medium">Potential value (£)<input name="potentialValue" type="number" min={0} step="0.01" className={field} /></label>
          <label className="block text-xs font-medium">Target award date<input name="targetAwardDate" type="date" className={field} /></label>
        </div>
        <label className="block text-xs font-medium">Description<textarea name="description" rows={3} maxLength={2000} className={field} /></label>
        <div className="flex gap-2"><Button type="submit" variant="primary">Create project</Button><Link href="/crm/projects" className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500">Cancel</Link></div>
      </div></ActionForm>
    </section>
  </div>;
}
