'use server';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { requireTemplateWorkspace } from '@/core/templates/service';
import { parseBlocks, validateFields } from '@/core/templates/domain';
import { TARGET_MODULES } from '@/core/templates/types';
import { writeAudit } from '@/core/audit/log';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createContract } from '@/core/contracts/actions';
const str=(f:FormData,k:string,max=300)=>{const v=String(f.get(k)??'').trim();if(v.length>max)throw new Error(`${k} is too long.`);return v;};
export async function saveTemplate(form:FormData){
 const session=await requireSession();assertCapability(session,'core.contract.manage');await requireTemplateWorkspace(session);
 const id=str(form,'id',100),name=str(form,'name'),titleTemplate=str(form,'titleTemplate'),description=str(form,'description',2000),category=str(form,'category',60),status=str(form,'status');
 if(!name||!titleTemplate)throw new Error('Enter a name and document title.');if(!['DRAFT','PUBLISHED'].includes(status))throw new Error('Choose draft or published.');
 let value:unknown;try{value=JSON.parse(str(form,'blocks',70000));}catch{throw new Error('The template sections are invalid.');}
 const blocks=parseBlocks(value);validateFields(titleTemplate+'\n'+blocks.map(b=>b.text).join('\n'));
 const targetModules=form.getAll('targetModules').map(String);if(!targetModules.length||targetModules.some(m=>!TARGET_MODULES.includes(m as typeof TARGET_MODULES[number])))throw new Error('Choose at least one target app.');
 const data={name,titleTemplate,description,category,blocks,targetModules,status};
 let resultId=id;
 if(id){const version=Number(form.get('version'));if(!Number.isInteger(version))throw new Error('Reload this template.');const changed=await db.documentTemplate.updateMany({where:{id,organisationId:session.organisationId,version,status:{not:'ARCHIVED'}},data:{...data,version:{increment:1}}});if(!changed.count)throw new Error('Another person changed this template. Reload before saving.');}
 else resultId=(await db.documentTemplate.create({data:{...data,organisationId:session.organisationId,createdBy:session.userId}})).id;
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'template.saved',entityType:'DocumentTemplate',entityId:resultId,after:{name,status}});
 revalidatePath('/templates');revalidatePath('/crm/contracts');redirect(`/templates/${resultId}`);
}
export async function archiveTemplate(form:FormData){
 const session=await requireSession();assertCapability(session,'core.contract.manage');await requireTemplateWorkspace(session);
 const id=str(form,'id',100);await db.documentTemplate.updateMany({where:{id,organisationId:session.organisationId},data:{status:'ARCHIVED',version:{increment:1}}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'template.archived',entityType:'DocumentTemplate',entityId:id});revalidatePath('/templates');
}
export async function generateTemplateDocument(form:FormData){
 const session=await requireSession();assertCapability(session,'core.contract.manage');await requireTemplateWorkspace(session);
 await createContract(form);revalidatePath('/crm/contracts');redirect('/crm/contracts');
}
