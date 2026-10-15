import { WorkspaceHeading } from "@/components/ui/workspace";
import { SourceGoals } from "@/modules/kpis/components/source-goals";
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { requireService } from '@/modules/service/services/queries';
import { serviceCaseScope } from '@/core/permissions/service-access';
import { db } from '@/core/db/client';
import { ACTIVE_STATUSES, label } from '@/modules/service/domain/workflow';
import { Card } from '@/components/ui/card';
export default async function Home(){const session=await requireSession();assertCapability(session,'service.ticket.read');if(!session.capabilities.has('service.case.read'))redirect('/service/tickets');await requireService(session);
 const rows=await db.serviceCase.groupBy({by:['status'],where:serviceCaseScope(session),_count:{_all:true}}),overdue=await db.serviceCase.count({where:{AND:[serviceCaseScope(session),{status:{in:[...ACTIVE_STATUSES]},customerUpdateDueAt:{lt:new Date()}}]}});
 const count=(statuses:readonly string[])=>rows.filter(r=>statuses.includes(r.status)).reduce((s,r)=>s+r._count._all,0);
 return <div className="space-y-6">
  <WorkspaceHeading
    eyebrow="Customer experience"
    title="One case. A connected business."
    description="Keep customer ownership clear while Finance, Sales and Operations work together to resolve the issue."
    actions={<>
      <Link className="atlas-button atlas-button-primary inline-flex items-center px-5 py-2.5 text-sm font-semibold" href="/service/cases/new">New case</Link>
      <Link className="atlas-button atlas-button-secondary inline-flex items-center px-5 py-2.5 text-sm font-semibold" href="/service/cases?mine=1">Open my work</Link>
    </>}
  />
 <div className="grid gap-3 sm:grid-cols-4">{[{title:'Open cases',value:count(ACTIVE_STATUSES),href:'/service/cases'},{title:'Waiting internal',value:count(['WAITING_INTERNAL']),href:'/service/cases?status=WAITING_INTERNAL'},{title:'Awaiting acceptance',value:count(['RESOLVED']),href:'/service/cases?status=RESOLVED'},{title:'Overdue promises',value:overdue,href:'/service/cases?overdue=1'}].map(m=><Link key={m.title} href={m.href}><Card className="p-5"><p className="text-xs text-slate-500">{m.title}</p><p className="mt-2 text-3xl font-semibold">{m.value}</p></Card></Link>)}</div>
 <SourceGoals session={session} prefixes={["service.","csat.service."]}/>
 <h3 className="text-lg font-semibold">Case flow</h3><div className="grid gap-3 sm:grid-cols-3">{rows.map(r=><Link key={r.status} className="flex justify-between rounded-lg border border-slate-200 p-4 text-sm" href={`/service/cases?status=${r.status}`}><span>{label(r.status)}</span><strong>{r._count._all}</strong></Link>)}</div></div>;
}
