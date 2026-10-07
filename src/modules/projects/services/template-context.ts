import { db } from '@/core/db/client';
import type { TemplateContextProvider } from '@/core/templates/types';
import { assertCapability } from '@/core/permissions/check';
import { projectScope } from '@/core/permissions/work-access';
async function records(s:Parameters<TemplateContextProvider['list']>[0],type:string,id?:string){assertCapability(s,'projects.read');if(type!=='project')return [];return (await db.project.findMany({where:{AND:[projectScope(s),...(id?[{id}]:[])]},select:{id:true,name:true,reference:true,partyId:true},orderBy:{updatedAt:'desc'},take:id?1:200})).map(r=>({id:r.id,type,label:`${r.reference} · ${r.name}`,href:`/projects/${r.id}`,partyId:r.partyId,fields:{'record.name':r.name,'record.reference':r.reference}}));}
export const projectsTemplateContext:TemplateContextProvider={types:[{id:'project',label:'Project',capability:'projects.read'}],list:records,async get(s,t,id){return(await records(s,t,id))[0]??null;}};
