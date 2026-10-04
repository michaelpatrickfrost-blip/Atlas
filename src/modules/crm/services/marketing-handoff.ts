'use server';
import { Prisma } from '@/generated/prisma/client';
import { db } from '@/core/db/client';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { revalidatePath } from 'next/cache';
/** CRM owns prospect creation. Marketing refers to the returned prospect identity. */
export async function acceptMarketingHandoff(form:FormData){
 const s=await requireSession();
 assertCapability(s,'sales.prospect.create');
 assertCapability(s,'marketing.lead.manage');
 const id=String(form.get('id')??'');if(!id||id.length>100)throw new Error('Invalid lead.');
 await db.$transaction(async tx=>{
  for(const moduleId of ['marketing','crm'])if(!await tx.moduleState.findFirst({where:{organisationId:s.organisationId,moduleId,enabled:true,entitled:true}}))throw new Error(`${moduleId} must be enabled.`);
  const lead=await tx.marketingLead.findFirstOrThrow({where:{id,organisationId:s.organisationId},include:{profile:{include:{contact:true,party:true}}}});
  if(lead.prospectId)return;
  const p=lead.profile,existing=await tx.prospect.findMany({where:{organisationId:s.organisationId,partyId:p.partyId,email:p.contact.email,lifecycleStage:{not:'DISQUALIFIED'}},take:2});
  if(!p.contact.email||existing.length>1)throw new Error('Resolve contact identity in CRM before handoff.');
  const prospect=existing[0]??await tx.prospect.create({data:{organisationId:s.organisationId,partyId:p.partyId,companyName:p.party.name,contactFirstName:p.contact.firstName,contactSurname:p.contact.surname,email:p.contact.email,phone:p.contact.phone,source:'MARKETING',originalSource:p.source,campaign:lead.campaignId,lifecycleStage:'QUALIFIED',engagementScore:p.engagementScore,engagementFactors:lead.explanation===null?Prisma.JsonNull:lead.explanation,ownerUserId:s.userId,nextActivityAt:lead.dueAt}});
  await tx.marketingLead.update({where:{id:lead.id,organisationId:s.organisationId},data:{prospectId:prospect.id,ownerUserId:s.userId,status:'HANDED_OFF'}});
  await tx.salesActivity.create({data:{organisationId:s.organisationId,partyId:p.partyId,prospectId:prospect.id,ownerUserId:s.userId,type:'TASK',subject:'Follow up Marketing qualified lead',dueAt:lead.dueAt??new Date(Date.now()+4*3600000)}});
  await tx.auditEntry.create({data:{organisationId:s.organisationId,actorUserId:s.userId,action:'marketing.lead.handed_off',entityType:'Prospect',entityId:prospect.id,after:{leadId:lead.id,profileId:p.id}}});
 },{isolationLevel:'Serializable'});revalidatePath('/marketing','layout');revalidatePath('/crm','layout');
}
