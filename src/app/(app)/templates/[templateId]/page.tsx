import { notFound } from 'next/navigation';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { TemplateEditor } from '@/modules/templates/components/editor';
import { GenerateDocument } from '@/modules/templates/components/generate';
import { parseBlocks } from '@/core/templates/domain';
import { templateSources, templateRecords } from '@/core/templates/service';
export default async function Page({params,searchParams}:{params:Promise<{templateId:string}>;searchParams:Promise<{source?:string}>}){
 const s=await requireSession();assertCapability(s,'core.contract.manage');const t=await db.documentTemplate.findFirst({where:{id:(await params).templateId,organisationId:s.organisationId,status:{not:'ARCHIVED'}}});if(!t)notFound();
 const sources=(await templateSources(s)).filter(x=>t.targetModules.includes(x.module));const [groups,parties]=await Promise.all([Promise.all(sources.map(async x=>(await templateRecords(s,x.module,x.type)).map(r=>({module:x.module,type:x.type,id:r.id,label:r.label})))),db.party.findMany({where:{organisationId:s.organisationId,identityScrubbed:false,archived:false},select:{id:true,name:true},orderBy:{name:'asc'},take:2000})]);const blocks=parseBlocks(t.blocks),requested=(await searchParams).source??'',initialSource=groups.flat().some(r=>`${r.module}/${r.type}/${r.id}`===requested)?requested:'';
 return <div className="space-y-8"><TemplateEditor key={t.version} initial={{...t,blocks}}/>{t.status==='PUBLISHED'&&<GenerateDocument template={{...t,blocks}} records={groups.flat()} parties={parties} initialSource={initialSource}/>}</div>;
}
