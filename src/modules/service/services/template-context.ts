import { db } from '@/core/db/client';
import type { TemplateContextProvider } from '@/core/templates/types';
import { assertCapability } from '@/core/permissions/check';
import { serviceCaseScope } from '@/core/permissions/service-access';
async function records(s:Parameters<TemplateContextProvider['list']>[0],type:string,id?:string){assertCapability(s,'service.case.read');if(type!=='case')return [];return(await db.serviceCase.findMany({where:{AND:[serviceCaseScope(s),...(id?[{id}]:[])]},select:{id:true,number:true,subject:true,partyId:true,createdAt:true},orderBy:{updatedAt:'desc'},take:id?1:200})).map(r=>({id:r.id,type,label:`${r.number} · ${r.subject}`,href:`/service/cases/${r.id}`,partyId:r.partyId,fields:{'record.name':r.subject,'record.reference':r.number,'record.date':r.createdAt.toLocaleDateString('en-GB')}}));}
export const serviceTemplateContext:TemplateContextProvider={types:[{id:'case',label:'Customer case',capability:'service.case.read'}],list:records,async get(s,t,id){return(await records(s,t,id))[0]??null;}};
