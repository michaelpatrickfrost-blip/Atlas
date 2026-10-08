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
 return <div className="space-y-6"><div className="rounded-2xl bg-slate-900 px-6 py-7 text-white"><p className="text-xs uppercase tracking-widest text-teal-300">Customer experience</p><h2 className="mt-2 text-3xl font-semibold">One case. A connected business.</h2><p className="mt-2 max-w-xl text-sm text-slate-300">Keep customer ownership clear while Finance, Sales and Operations work together to resolve the issue.</p><div className="mt-5 flex gap-3"><Link className="rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-900" href="/service/cases/new">New case</Link><Link className="rounded-lg border border-slate-600 px-4 py-2 text-sm" href="/service/cases?mine=1">Open my work</Link></div></div>
 <div className="grid gap-3 sm:grid-cols-4">{[{title:'Open cases',value:count(ACTIVE_STATUSES),href:'/service/cases'},{title:'Waiting internal',value:count(['WAITING_INTERNAL']),href:'/service/cases?status=WAITING_INTERNAL'},{title:'Awaiting acceptance',value:count(['RESOLVED']),href:'/service/cases?status=RESOLVED'},{title:'Overdue promises',value:overdue,href:'/service/cases?overdue=1'}].map(m=><Link key={m.title} href={m.href}><Card className="p-5"><p className="text-xs text-slate-500">{m.title}</p><p className="mt-2 text-3xl font-semibold">{m.value}</p></Card></Link>)}</div>
 <SourceGoals session={session} prefixes={["service.","csat.service."]}/>
 <h3 className="text-lg font-semibold">Case flow</h3><div className="grid gap-3 sm:grid-cols-3">{rows.map(r=><Link key={r.status} className="flex justify-between rounded-lg border border-slate-200 p-4 text-sm" href={`/service/cases?status=${r.status}`}><span>{label(r.status)}</span><strong>{r._count._all}</strong></Link>)}</div></div>;
}
