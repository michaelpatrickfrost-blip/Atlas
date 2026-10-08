import { db } from '@/core/db/client';
import type { Session } from '@/core/auth/session';
import type { Prisma } from '@/generated/prisma/client';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { eligibility, evaluateRule, parseRule } from '../domain/policy';
export async function requireMarketing(session:Session){await assertModuleEnabled(session,'marketing');}
export const sections={
  campaigns:{title:'Campaigns',cap:'marketing.campaign.read'},
  calendar:{title:'Calendar',cap:'marketing.campaign.read'},
  budgets:{title:'Budgets',cap:'marketing.campaign.read'},
  journey:{title:'Journey',cap:'marketing.campaign.read'},
  audiences:{title:'Audiences',cap:'marketing.audience.read'},
  content:{title:'Content',cap:'marketing.content.read'},
  email:{title:'Messages',cap:'marketing.email.read'},
  social:{title:'Social & ads',cap:'marketing.program.read'},
  events:{title:'Events',cap:'marketing.program.read'},
  leads:{title:'Leads',cap:'marketing.lead.read'},
  sales:{title:'Results',cap:'marketing.campaign.read'},
  journeys:{title:'Journeys',cap:'marketing.journey.read'},
  forms:{title:'Forms & pages',cap:'marketing.program.read'},
  profiles:{title:'Profiles',cap:'marketing.profile.read'},
  consent:{title:'Consent',cap:'marketing.consent.view'},
  experiments:{title:'Experiments',cap:'marketing.experiment.manage'},
  attribution:{title:'Attribution',cap:'marketing.report.read'},
  analytics:{title:'Analytics',cap:'marketing.report.read'},
  accounts:{title:'Accounts',cap:'marketing.profile.read'},
  administration:{title:'Administration',cap:'marketing.admin.manage'},
} as const;
export type MarketingSection=keyof typeof sections;
export async function campaignList(session:Session){assertCapability(session,'marketing.campaign.read');await requireMarketing(session);return db.marketingCampaign.findMany({where:{organisationId:session.organisationId},orderBy:{updatedAt:'desc'},take:100});}
export type Tx=Prisma.TransactionClient;
export async function checkEligibility(tx:Tx,organisationId:string,profileId:string,message:{channel:string;purpose:string;brand:string;country:string;legalEntity:string;classification:string}){
 const p=await tx.marketingProfile.findFirstOrThrow({where:{id:profileId,organisationId},include:{contact:true,permissions:{where:{organisationId},orderBy:[{occurredAt:'desc'},{createdAt:'desc'}]},suppressions:{where:{organisationId}}}});
 const [count,complaint]=await Promise.all([tx.marketingDelivery.count({where:{organisationId,profileId,sentAt:{gte:new Date(Date.now()-7*86400000)}}}),tx.serviceCase.count({where:{organisationId,partyId:p.partyId,type:{in:['COMPLAINT','QUALITY_COMPLAINT']},severity:{in:['SEV1','SEV2']},status:{notIn:['RESOLVED','CLOSED','CANCELLED']}}})]);
 return eligibility({...message,email:p.contact.email,mobile:p.contact.mobile,active:p.contact.status==='ACTIVE',permissions:p.permissions,suppressions:p.suppressions,sentIn7Days:count,severeComplaint:complaint>0});
}
export async function audienceMembers(tx:Tx,organisationId:string,id:string){
 const audience=await tx.marketingAudience.findFirstOrThrow({where:{id,organisationId},include:{members:{where:{organisationId},take:5001}}});
 if(audience.type!=='DYNAMIC'){if(audience.members.length>5000)throw new Error('Audience exceeds 5,000 participant release limit.');return audience.members.map(x=>x.profileId);}
 const profiles=await tx.marketingProfile.findMany({where:{organisationId},include:{events:{where:{organisationId},orderBy:{occurredAt:'desc'},take:1000}},take:5001});
 if(profiles.length>5000||profiles.some(p=>p.events.length===1000))throw new Error('Preview exceeds release limit; incremental audience projection required.');
 const rules=parseRule(audience.rules);return profiles.filter(p=>evaluateRule(rules,p).matched).map(p=>p.id);
}
