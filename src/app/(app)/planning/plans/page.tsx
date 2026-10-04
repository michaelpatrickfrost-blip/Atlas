import Link from 'next/link';
import { requireSession } from '@/core/auth/session';
import { assertCapability,can } from '@/core/permissions/check';
import { listProductionPlans } from '@/modules/planning/services/plans';
import { NewPlanForm } from '@/modules/planning/components/plan-forms';
import { CreateDialog } from '@/components/ui/create-dialog';
import { DataTable } from '@/components/ui/table';
export default async function PlansPage() {
 const session=await requireSession();assertCapability(session,'planning.demand.read');const plans=await listProductionPlans();
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});
 return <div className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-tight">Product production plans</h2><p className="mt-1 text-sm text-slate-500">Annual targets to weekly work. Shared products, named teams and clear ownership.</p></div><div className="flex flex-wrap gap-2"><a href="/api/planning/export?type=plans" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">Download CSV</a>{can(session,'planning.plan.manage')&&<CreateDialog label="New plan" title="Create a production plan"><NewPlanForm today={today}/></CreateDialog>}</div></div><DataTable rows={plans} getHref={p=>`/planning/plans/${p.id}`} emptyLabel="Create a yearly, monthly, weekly or custom plan, then add product targets and team assignments." columns={[{header:'Plan',render:p=><span className="font-medium">{p.name}</span>},{header:'Starts',render:p=>p.startsOn},{header:'Ends',render:p=>p.endsOn},{header:'Interval',render:p=>p.bucket.toLowerCase()},{header:'Work lines',align:'right',render:p=>p.lineCount},{header:'Version',align:'right',render:p=>p.version}]}/><p className="text-xs text-slate-500">Targets are saved centrally. They do not add stock or become production supply automatically.</p><Link href="/planning" className="text-xs font-medium text-blue-600">Review Sales demand and stock coverage →</Link></div>;
}
