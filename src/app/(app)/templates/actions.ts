'use server';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { requireTemplateWorkspace } from '@/core/templates/service';
import { saveTemplateForSession } from '@/core/templates/authoring';
import { writeAudit } from '@/core/audit/log';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createContract } from '@/core/contracts/actions';
const str=(f:FormData,k:string,max=300)=>{const v=String(f.get(k)??'').trim();if(v.length>max)throw new Error(`${k} is too long.`);return v;};
export async function saveTemplate(form:FormData){
 const session=await requireSession();assertCapability(session,'core.contract.manage');
 const result=await saveTemplateForSession(session,form);
 revalidatePath('/templates');revalidatePath('/crm/contracts');redirect(`/templates/${result.id}`);
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
