import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/core/auth/session';
import { assertCapability,can } from '@/core/permissions/check';
import { getProductionPlan,getPlanOptions } from '@/modules/planning/services/plans';
import { PlanLineForm } from '@/modules/planning/components/plan-forms';
import { CreateDialog } from '@/components/ui/create-dialog';
import { DataTable } from '@/components/ui/table';
export default async function PlanPage({params}:{params:Promise<{planId:string}>}) {
 const session=await requireSession();assertCapability(session,'planning.demand.read');const {planId}=await params;
 const plan=await getProductionPlan(planId);if(!plan)notFound();const manage=can(session,'planning.plan.manage');const options=manage?await getPlanOptions():null;
 return <div className="space-y-5"><Link href="/planning/plans" className="text-xs text-slate-500">← All plans</Link><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight">{plan.name}</h2><p className="mt-2 text-sm text-slate-500">{plan.startsOn} → {plan.endsOn} · {plan.bucket.toLowerCase()} intervals · version {plan.version}</p></div><div className="flex flex-wrap gap-2"><a href={`/api/planning/export?type=work&plan=${plan.id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">Download CSV</a>{options&&<CreateDialog label="Add planned work" title="Product target and work assignment"><PlanLineForm key={plan.version} plan={plan} options={options}/></CreateDialog>}</div></div><DataTable rows={plan.lines} getHref={l=>`/stock/items/${l.productId}`} emptyLabel="Add a product target, work dates, team and responsible person." columns={[{header:'Product',render:l=><div><p className="font-medium">{l.name}</p><p className="mt-1 text-xs text-slate-400">{l.code}</p></div>},{header:'Quantity',align:'right',render:l=>`${l.quantity} ${l.unitOfMeasure}`},{header:'Starts',render:l=>l.startsOn},{header:'Ends',render:l=>l.endsOn},{header:'Team',render:l=>l.teamName??'Unassigned'},{header:'Responsible',render:l=>l.assignedName??'Unassigned'},{header:'Work notes',render:l=>l.notes??'—'}]}/><p className="text-xs leading-5 text-slate-500">Planned work is a production intention. BOM/routing validation, capacity booking, material release and actual WIP execution will be required before these lines become executable production orders.</p></div>;
}
