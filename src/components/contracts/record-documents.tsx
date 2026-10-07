import Link from 'next/link';
import type { Session } from '@/core/auth/session';
import { db } from '@/core/db/client';
import { templateRecord } from '@/core/templates/service';
export async function RecordDocuments({session,module,type,id}:{session:Session;module:string;type:string;id:string}){
 if(!session.capabilities.has('core.contract.manage'))return null;
 await templateRecord(session,module,type,id);
 const rows=await db.contractDocument.findMany({where:{organisationId:session.organisationId,sourceModule:module,sourceType:type,sourceId:id},select:{id:true,title:true,status:true},orderBy:{createdAt:'desc'},take:20});
 return <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Documents & contracts</h3><Link href={`/templates?source=${encodeURIComponent(`${module}/${type}/${id}`)}`} className="text-xs font-medium text-blue-700">Create from template →</Link></div>{rows.length?<ul className="mt-3 divide-y divide-slate-100">{rows.map(r=><li key={r.id}><Link href={`/crm/contracts/${r.id}`} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{r.title}</span><span className="text-xs text-slate-400">{r.status==='RETURNED'?'Return awaiting review':r.status.toLowerCase()}</span></Link></li>)}</ul>:<p className="mt-2 text-xs text-slate-500">Create a document from your library. It stays attached to this record.</p>}</section>;
}
