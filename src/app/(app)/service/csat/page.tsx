import Link from 'next/link';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { serviceCaseScope } from '@/core/permissions/service-access';
import { Card } from '@/components/ui/card';
export default async function Satisfaction(){
 const session=await requireSession();assertCapability(session,'service.case.read');
 const cases=await db.serviceCase.findMany({where:serviceCaseScope(session),select:{id:true,number:true,subject:true},orderBy:{createdAt:'desc'},take:5000});
 const rows=await db.csatResponse.findMany({where:{organisationId:session.organisationId,entityType:'ServiceCase',entityId:{in:cases.map(c=>c.id)}},orderBy:{sentAt:'desc'},take:5000});
 const valid=rows.filter(r=>r.score!==null&&!r.invalidatedAt),average=valid.length?(valid.reduce((sum,r)=>sum+r.score!,0)/valid.length).toFixed(2):'—';
 const invitations=rows.filter(r=>!['FAILED','PREPARING'].includes(r.deliveryStatus)),satisfied=valid.filter(r=>r.score!>=4).length;
 return <div className="space-y-6"><h2 className="text-3xl font-semibold">Customer satisfaction</h2><p className="text-sm text-slate-500">Feedback tied to the case, customer, agent and team. Original responses stay intact.</p><div className="grid gap-4 sm:grid-cols-3">{[{label:'Average score',value:`${average} / 5`},{label:'Satisfied · 4 or 5',value:valid.length?`${Math.round(satisfied/valid.length*100)}% · n=${valid.length}`:'No responses'},{label:'Response rate',value:invitations.length?`${Math.round(valid.length/invitations.length*100)}% · ${valid.length}/${invitations.length}`:'No invitations'}].map(metric=><Card className="p-5" key={metric.label}><p className="text-xs text-slate-500">{metric.label}</p><p className="mt-2 text-2xl font-semibold">{metric.value}</p></Card>)}</div><div className="space-y-3">{rows.slice(0,100).map(row=>{const c=cases.find(c=>c.id===row.entityId);return <Card className="p-5" key={row.id}><Link className="text-sm font-medium text-teal-700" href={`/service/cases/${row.entityId}#satisfaction`}>{c?.number} · {c?.subject} →</Link><p className="mt-2 text-sm">{row.score===null?'Awaiting response':`${row.score}/5`}{row.invalidatedAt?' · excluded with audit reason':''}</p>{row.comment&&<p className="mt-2 text-sm text-slate-500">{row.comment}</p>}</Card>;})}</div>{session.capabilities.has('csat.manage')&&<Link className="text-sm text-teal-700" href="/csat/surveys">Configure the Support survey →</Link>}<p className="text-xs text-slate-400">Based on up to 5,000 accessible cases and invitations. Invitations include queued mail; delivery is recorded separately.</p></div>;
}
