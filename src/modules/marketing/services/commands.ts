'use server';

import { DOMAIN_EVENTS } from '@/core/events/bus';
import { db } from '@/core/db/client';
import { requireSession, type Session } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
import { requireMarketing, audienceMembers, checkEligibility, type Tx } from './queries';
import { CAMPAIGN_TYPES, CHANNELS, PERMISSION_STATES, EVENT_TYPES, SCORES, campaignTransition, parseRule, allocateExperiment, validateJourney } from '../domain/policy';
function text(f:FormData,k:string,max=2000,required=false){const v=String(f.get(k)??'').trim();if(v.length>max||required&&!v)throw new Error(`Please enter a valid ${k}.`);return v;}
function integer(f:FormData,k:string,min=0,max=2147483647){const v=Number(text(f,k));if(!Number.isInteger(v)||v<min||v>max)throw new Error(`Invalid ${k}.`);return v;}
function date(f:FormData,k:string,required=false){const v=text(f,k,100,required);if(!v)return null;const d=new Date(v);if(!Number.isFinite(d.getTime()))throw new Error(`Invalid ${k}.`);return d;}
function choice<T extends string>(f:FormData,k:string,values:readonly T[]):T{const v=text(f,k);if(!values.includes(v as T))throw new Error(`Invalid ${k}.`);return v as T;}
function json(f:FormData,k:string){try{return JSON.parse(text(f,k,50000,true));}catch{throw new Error(`Invalid ${k} JSON.`);}}
async function audit(tx:Tx,s:Session,action:string,entityType:string,entityId:string,after:Prisma.InputJsonValue={}){await tx.auditEntry.create({data:{organisationId:s.organisationId,actorUserId:s.userId,action:`marketing.${action}`,entityType,entityId,after}});}
function refresh(){revalidatePath('/marketing','layout');}
async function campaign(tx:Tx,s:Session,id:string){return tx.marketingCampaign.findFirstOrThrow({where:{id,organisationId:s.organisationId}});}
async function profile(tx:Tx,s:Session,id:string){return tx.marketingProfile.findFirstOrThrow({where:{id,organisationId:s.organisationId}});}
export async function createCampaign(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.campaign.create');
 await requireMarketing(s);
 await db.$transaction(async tx=>{
  const audienceId=text(f,'audienceId',100)||null,parentId=text(f,'parentId',100)||null;
  if(audienceId)await tx.marketingAudience.findFirstOrThrow({where:{id:audienceId,organisationId:s.organisationId}});if(parentId)await campaign(tx,s,parentId);
  const startAt=date(f,'startAt'),endAt=date(f,'endAt');if(startAt&&endAt&&endAt<startAt)throw new Error('End must follow start.');
  const c=await tx.marketingCampaign.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),code:text(f,'code',50,true).toUpperCase(),description:text(f,'description',10000),type:choice(f,'type',CAMPAIGN_TYPES),ownerUserId:s.userId,audienceId,parentId,startAt,endAt,goal:text(f,'goal'),goalTarget:integer(f,'goalTarget'),budgetMinor:f.has('budgetAmount')?(await import('../domain/planning')).moneyMinor(text(f,'budgetAmount',100,true)):integer(f,'budgetMinor'),currency:z.string().regex(/^[A-Z]{3}$/).parse(text(f,'currency'))}});
  await audit(tx,s,'campaign.created','MarketingCampaign',c.id);
 });refresh();
}
export async function updateCampaign(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.campaign.manage');
 await requireMarketing(s);
 await db.$transaction(async tx=>{const c=await campaign(tx,s,text(f,'id',100,true)),status=text(f,'status',30,true);campaignTransition(c.status,status);
  if(['SCHEDULED','LIVE'].includes(status)){assertCapability(s,'marketing.campaign.publish');if(!c.audienceId)throw new Error('Select an audience before approval.');}
  if(status==='LIVE')throw new Error('Live launch requires a verified delivery provider. No messages have been sent.');
  const changed=await tx.marketingCampaign.updateMany({where:{id:c.id,organisationId:s.organisationId,version:integer(f,'version',1)},data:{status,version:{increment:1},...status==='SCHEDULED'?{approvedBy:s.userId,approvedAt:new Date()}:{}}});if(changed.count!==1)throw new Error('Campaign changed. Refresh and retry.');await audit(tx,s,'campaign.status','MarketingCampaign',c.id,{from:c.status,to:status});
 });refresh();
}
export async function createProfile(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.profile.manage');
 assertCapability(s,'customers.read');await requireMarketing(s);
 await db.$transaction(async tx=>{const c=await tx.contact.findFirstOrThrow({where:{id:text(f,'contactId',100,true),party:{organisationId:s.organisationId}},select:{id:true,partyId:true}});const p=await tx.marketingProfile.create({data:{organisationId:s.organisationId,contactId:c.id,partyId:c.partyId,source:text(f,'source',250,true),country:text(f,'country',50,true),brand:text(f,'brand',100,true)}});await audit(tx,s,'profile.created','MarketingProfile',p.id);});refresh();
}
export async function recordPermission(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.consent.manage');
 await requireMarketing(s);
 await db.$transaction(async tx=>{const p=await profile(tx,s,text(f,'profileId',100,true)),state=choice(f,'state',PERMISSION_STATES),channel=choice(f,'channel',CHANNELS),occurredAt=new Date();
  const row=await tx.marketingPermission.create({data:{organisationId:s.organisationId,profileId:p.id,channel,purpose:text(f,'purpose',100,true),brand:text(f,'brand',100,true),country:text(f,'country',50,true),legalEntity:text(f,'legalEntity',200,true),state,source:text(f,'source',250,true),evidence:text(f,'evidence',10000,true),textVersion:text(f,'textVersion',100,true),noticeVersion:text(f,'noticeVersion',100,true),lawfulBasis:text(f,'lawfulBasis',250,true),recordedBy:s.userId,occurredAt}});
  if(['OBJECTED','SUPPRESSED','BOUNCED','INVALID'].includes(state))await tx.marketingSuppression.create({data:{organisationId:s.organisationId,profileId:p.id,channel:state==='OBJECTED'?'ALL':channel,reason:state,source:row.source,createdBy:s.userId}});
  await audit(tx,s,'consent.recorded','MarketingPermission',row.id,{state,profileId:p.id});
 });refresh();
}
export async function suppressProfile(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.consent.manage');
 await requireMarketing(s);await db.$transaction(async tx=>{const p=await profile(tx,s,text(f,'profileId',100,true));const row=await tx.marketingSuppression.create({data:{organisationId:s.organisationId,profileId:p.id,channel:choice(f,'channel',['ALL',...CHANNELS]),reason:text(f,'reason',2000,true),source:text(f,'source',250,true),createdBy:s.userId}});await audit(tx,s,'suppression.added','MarketingSuppression',row.id);});refresh();
}
export async function createAudience(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.audience.create');
 await requireMarketing(s);const type=choice(f,'type',['DYNAMIC','STATIC','IMPORTED'] as const),rules=type==='DYNAMIC'?parseRule(json(f,'rules')):{};
 await db.$transaction(async tx=>{const row=await tx.marketingAudience.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),type,rules:rules as Prisma.InputJsonValue,source:text(f,'source',250,true),purpose:text(f,'purpose',250,true),permissionBasis:text(f,'permissionBasis',250,true),evidence:text(f,'evidence',10000,true),acquiredAt:date(f,'acquiredAt',true)!,ownerUserId:s.userId}});
  if(type!=='DYNAMIC'){const ids=[...new Set(text(f,'profileIds',50000,true).split(/[\s,]+/).filter(Boolean))];if(ids.length>5000)throw new Error('Limit is 5,000 known profiles.');for(const id of ids){await profile(tx,s,id);await tx.marketingAudienceMember.create({data:{organisationId:s.organisationId,audienceId:row.id,profileId:id}});}}
  await audit(tx,s,'audience.created','MarketingAudience',row.id,{type});
 },{timeout:30000});refresh();
}
export async function previewAudience(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.audience.read');
 await requireMarketing(s);return db.$transaction(async tx=>{const ids=await audienceMembers(tx,s.organisationId,text(f,'audienceId',100,true)),reasons:Record<string,number>={};let eligible=0;const dimensions={channel:choice(f,'channel',CHANNELS),purpose:text(f,'purpose',100,true),brand:text(f,'brand',100,true),country:text(f,'country',50,true),legalEntity:text(f,'legalEntity',200,true),classification:'PROMOTIONAL'};for(const id of ids){const e=await checkEligibility(tx,s.organisationId,id,dimensions);if(e.eligible)eligible++;else e.reasons.forEach(r=>{reasons[r]=(reasons[r]??0)+1;});}return {matched:ids.length,eligible,excluded:ids.length-eligible,reasons};},{timeout:30000});
}
export async function createContent(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.content.create');
 await requireMarketing(s);await db.$transaction(async tx=>{const campaignId=text(f,'campaignId',100)||null;if(campaignId)await campaign(tx,s,campaignId);const c=await tx.marketingContent.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),kind:choice(f,'kind',['EMAIL_TEMPLATE','ARTICLE','GUIDE','SOCIAL_COPY','ASSET_REFERENCE','CONTENT_BRIEF']),body:text(f,'body',50000,true),brand:text(f,'brand',100,true),campaignId,ownerUserId:s.userId,rights:text(f,'rights',2000),expiresAt:date(f,'expiresAt')}});await audit(tx,s,'content.created','MarketingContent',c.id);});refresh();
}
export async function approveContent(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.content.approve');
 await requireMarketing(s);await db.$transaction(async tx=>{const c=await tx.marketingContent.findFirstOrThrow({where:{id:text(f,'id',100,true),organisationId:s.organisationId,status:'DRAFT'}});if(c.ownerUserId===s.userId)throw new Error('A different authorised reviewer must approve this content.');if(c.expiresAt&&c.expiresAt<new Date())throw new Error('Content rights expired.');await tx.marketingContent.update({where:{id:c.id,organisationId:s.organisationId},data:{status:'APPROVED',approvedBy:s.userId}});await audit(tx,s,'content.approved','MarketingContent',c.id);});refresh();
}
export async function createMessage(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.email.create');
 await requireMarketing(s);await db.$transaction(async tx=>{const c=await campaign(tx,s,text(f,'campaignId',100,true));const m=await tx.marketingMessage.create({data:{organisationId:s.organisationId,campaignId:c.id,name:text(f,'name',250,true),channel:choice(f,'channel',['EMAIL','SMS']),purpose:text(f,'purpose',100,true),brand:text(f,'brand',100,true),country:text(f,'country',50,true),legalEntity:text(f,'legalEntity',200,true),subject:text(f,'subject',250,true),body:text(f,'body',50000,true)}});await audit(tx,s,'message.created','MarketingMessage',m.id);});refresh();
}
export async function lockSend(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.email.approve');
 await requireMarketing(s);await db.$transaction(async tx=>{const m=await tx.marketingMessage.findFirstOrThrow({where:{id:text(f,'messageId',100,true),organisationId:s.organisationId,status:'DRAFT'}}),c=await campaign(tx,s,m.campaignId);
  if(!c.audienceId||!c.approvedAt||c.status!=='SCHEDULED')throw new Error('Campaign must have an approved audience and be scheduled.');
  const ids=await audienceMembers(tx,s.organisationId,c.audienceId),scheduledAt=date(f,'scheduledAt',true)!;if(scheduledAt<new Date())throw new Error('Select a future schedule.');
  const job=await tx.marketingSendJob.create({data:{organisationId:s.organisationId,messageId:m.id,scheduledAt,approvedBy:s.userId,idempotencyKey:`${m.id}:${m.version}`,snapshot:{subject:m.subject,body:m.body,channel:m.channel,classification:m.classification,purpose:m.purpose,brand:m.brand,country:m.country,legalEntity:m.legalEntity,messageVersion:m.version,campaignVersion:c.version,audienceId:c.audienceId,profileIds:ids}}});
  for(const profileId of ids){const e=await checkEligibility(tx,s.organisationId,profileId,m);await tx.marketingDelivery.create({data:{organisationId:s.organisationId,jobId:job.id,profileId,status:e.eligible?'PENDING':'EXCLUDED',exclusionReason:e.reasons.join('; ')||null}});}
  await tx.marketingMessage.update({where:{id:m.id,organisationId:s.organisationId},data:{status:'LOCKED'}});await audit(tx,s,'send.locked','MarketingSendJob',job.id,{matched:ids.length,providerStatus:'NOT_CONNECTED'});
 },{isolationLevel:'Serializable',timeout:30000});refresh();
}
export async function cancelSend(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.email.send');
 await requireMarketing(s);await db.$transaction(async tx=>{const j=await tx.marketingSendJob.findFirstOrThrow({where:{id:text(f,'id',100,true),organisationId:s.organisationId,status:{in:['LOCKED','QUEUED','SENDING']}}});await tx.marketingSendJob.update({where:{id:j.id,organisationId:s.organisationId},data:{status:'CANCELLED',cancelledAt:new Date()}});await tx.marketingDelivery.updateMany({where:{organisationId:s.organisationId,jobId:j.id,status:'PENDING'},data:{status:'CANCELLED'}});await audit(tx,s,'send.cancelled','MarketingSendJob',j.id);});refresh();
}
export async function ingestEvent(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.event.ingest');
 await requireMarketing(s);const type=choice(f,'type',EVENT_TYPES),key=text(f,'idempotencyKey',250,true),occurredAt=date(f,'occurredAt',true)!;if(occurredAt>new Date())throw new Error('Event cannot be in the future.');
 const properties=z.record(z.string().max(100),z.union([z.string().max(2000),z.number().finite(),z.boolean(),z.null()])).parse(json(f,'properties'));
 await db.$transaction(async tx=>{const p=await profile(tx,s,text(f,'profileId',100,true));const prior=await tx.marketingEvent.findFirst({where:{organisationId:s.organisationId,idempotencyKey:key}});if(prior){if(prior.profileId!==p.id||prior.type!==type)throw new Error('Idempotency key already belongs to a different event.');return;}
  const campaignId=text(f,'campaignId',100)||null;if(campaignId)await campaign(tx,s,campaignId);const delta=SCORES[type]??0,next=Math.max(0,Math.min(100,p.score+delta));
  const e=await tx.marketingEvent.create({data:{organisationId:s.organisationId,profileId:p.id,type,source:text(f,'source',250,true),idempotencyKey:key,occurredAt,campaignId,properties,scoreDelta:next-p.score}});
  await tx.marketingProfile.update({where:{id:p.id,organisationId:s.organisationId},data:{score:next,engagementScore:next,lifecycle:next>=70?'MQL':p.lifecycle}});
  if(type==='EMAIL_UNSUBSCRIBED'||type==='EMAIL_BOUNCED')await tx.marketingSuppression.create({data:{organisationId:s.organisationId,profileId:p.id,channel:'EMAIL',reason:type,source:e.source,createdBy:s.userId}});
  if(campaignId&&['AD_CLICKED','EMAIL_CLICKED','CONTENT_DOWNLOADED','FORM_SUBMITTED','WEBINAR_ATTENDED'].includes(type))await tx.marketingTouch.create({data:{organisationId:s.organisationId,profileId:p.id,campaignId,source:e.source,occurredAt,idempotencyKey:key}});
  if(p.score<70&&next>=70){const explanation={eventId:e.id,event:type,delta:e.scoreDelta,previous:p.score,score:next};await tx.marketingLead.upsert({where:{organisationId_profileId:{organisationId:s.organisationId,profileId:p.id}},create:{organisationId:s.organisationId,profileId:p.id,campaignId,explanation,dueAt:new Date(Date.now()+4*3600000)},update:{}});await tx.domainOutbox.create({data:{organisationId:s.organisationId,eventName:DOMAIN_EVENTS.marketingLeadBecameMql,eventKey:`marketing-mql:${p.id}`,payload:{...explanation,profileId:p.id}}});}
  const journeys=await tx.marketingJourney.findMany({where:{organisationId:s.organisationId,trigger:type,status:'ACTIVE'},take:100});
  for(const j of journeys){const v=await tx.marketingJourneyVersion.findFirstOrThrow({where:{organisationId:s.organisationId,journeyId:j.id,number:j.publishedVersion}});await tx.marketingJourneyEnrolment.upsert({where:{versionId_profileId:{versionId:v.id,profileId:p.id}},create:{organisationId:s.organisationId,versionId:v.id,profileId:p.id,nextExecutionAt:new Date()},update:{}});}
  await audit(tx,s,'event.recorded','MarketingEvent',e.id,{type,score:next});
 },{isolationLevel:'Serializable'});refresh();
}
export async function createJourney(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.journey.manage');
 await requireMarketing(s);const nodes=validateJourney(json(f,'nodes'));await db.$transaction(async tx=>{const j=await tx.marketingJourney.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),trigger:choice(f,'trigger',EVENT_TYPES),ownerUserId:s.userId}});await tx.marketingJourneyVersion.create({data:{organisationId:s.organisationId,journeyId:j.id,number:1,nodes,exitRule:choice(f,'exitRule',['PURCHASE_COMPLETED','NONE'])}});await audit(tx,s,'journey.created','MarketingJourney',j.id);});refresh();
}
export async function publishJourney(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.journey.publish');
 await requireMarketing(s);await db.$transaction(async tx=>{const j=await tx.marketingJourney.findFirstOrThrow({where:{id:text(f,'id',100,true),organisationId:s.organisationId}});const v=await tx.marketingJourneyVersion.findFirstOrThrow({where:{organisationId:s.organisationId,journeyId:j.id},orderBy:{number:'desc'}});validateJourney(v.nodes);await tx.marketingJourney.update({where:{id:j.id,organisationId:s.organisationId},data:{status:'ACTIVE',publishedVersion:v.number}});await audit(tx,s,'journey.published','MarketingJourney',j.id,{version:v.number});});refresh();
}
export async function reviseJourney(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.journey.manage');
 await requireMarketing(s);const nodes=validateJourney(json(f,'nodes'));await db.$transaction(async tx=>{const j=await tx.marketingJourney.findFirstOrThrow({where:{id:text(f,'id',100,true),organisationId:s.organisationId}}),v=await tx.marketingJourneyVersion.findFirstOrThrow({where:{organisationId:s.organisationId,journeyId:j.id},orderBy:{number:'desc'}});await tx.marketingJourneyVersion.create({data:{organisationId:s.organisationId,journeyId:j.id,number:v.number+1,nodes,exitRule:choice(f,'exitRule',['PURCHASE_COMPLETED','NONE'])}});await audit(tx,s,'journey.versioned','MarketingJourney',j.id,{version:v.number+1});},{isolationLevel:'Serializable'});refresh();
}
export async function createProgram(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.program.manage');
 await requireMarketing(s);const definition=z.object({brief:z.string().min(1).max(10000),url:z.string().url().optional(),fields:z.array(z.string().max(100)).max(30).optional(),provider:z.string().max(100).optional()}).strict().parse({brief:text(f,'brief',10000,true),...text(f,'url',2000)?{url:text(f,'url',2000)}:{},...text(f,'provider',100)?{provider:text(f,'provider',100)}:{}});await db.$transaction(async tx=>{const campaignId=text(f,'campaignId',100)||null;if(campaignId)await campaign(tx,s,campaignId);const row=await tx.marketingProgram.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),kind:choice(f,'kind',['FORM','LANDING_PAGE','SOCIAL_POST','AD_CAMPAIGN','EVENT','WEBINAR','ACCOUNT_PLAN']),definition,campaignId,ownerUserId:s.userId,startsAt:date(f,'startsAt')}});await audit(tx,s,'program.created','MarketingProgram',row.id);});refresh();
}
export async function createExperiment(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.experiment.manage');
 await requireMarketing(s);const control=integer(f,'control',0,100),variant=integer(f,'variant',0,100),holdout=integer(f,'holdout',0,100);await db.$transaction(async tx=>{const audienceId=text(f,'audienceId',100,true),ids=await audienceMembers(tx,s.organisationId,audienceId),assignments=allocateExperiment(ids,control,variant,holdout);const e=await tx.marketingExperiment.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),audienceId,control,variant,holdout,metric:choice(f,'metric',['CLICK','CONVERSION','REVENUE']),status:'LOCKED'}});await tx.marketingExperimentAssignment.createMany({data:assignments.map(a=>({...a,organisationId:s.organisationId,experimentId:e.id}))});await audit(tx,s,'experiment.allocated','MarketingExperiment',e.id,{participants:assignments.length});},{isolationLevel:'Serializable',timeout:30000});refresh();
}
export async function leadFeedback(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.lead.manage');
 await requireMarketing(s);await db.$transaction(async tx=>{const l=await tx.marketingLead.findFirstOrThrow({where:{id:text(f,'id',100,true),organisationId:s.organisationId}});await tx.marketingLead.update({where:{id:l.id,organisationId:s.organisationId},data:{status:choice(f,'status',['ACCEPTED','REJECTED','RECYCLED']),feedback:text(f,'feedback',10000,true)}});await audit(tx,s,'lead.feedback','MarketingLead',l.id);});refresh();
}
export async function processJourneySteps(){
 const s=await requireSession();
 assertCapability(s,'marketing.journey.manage');
 await requireMarketing(s);const result=await db.$transaction(async tx=>{
  const rows=await tx.marketingJourneyEnrolment.findMany({where:{organisationId:s.organisationId,status:'ACTIVE',nextExecutionAt:{lte:new Date()},version:{journey:{status:'ACTIVE'}}},include:{version:true},orderBy:{nextExecutionAt:'asc'},take:100});let processed=0;
  for(const row of rows){const nodes=validateJourney(row.version.nodes),p=await profile(tx,s,row.profileId),events=await tx.marketingEvent.findMany({where:{organisationId:s.organisationId,profileId:p.id,occurredAt:{gte:row.createdAt}},select:{type:true},take:1000});const has=(type:string)=>events.some(e=>e.type===type);let status='ACTIVE',next=row.currentNode+1,nextAt=new Date();
   if(row.version.exitRule!=='NONE'&&has(row.version.exitRule))status='EXITED';else if(row.currentNode>=nodes.length)status='COMPLETE';else{const node=nodes[row.currentNode];if(node.kind==='END')status='COMPLETE';if(node.kind==='WAIT')nextAt=new Date(Date.now()+node.hours*3600000);if(node.kind==='BRANCH')next=has(node.event)?node.yes:node.no;if(node.kind==='GOAL'&&has(node.event))status='GOAL_REACHED';}
   const updated=await tx.marketingJourneyEnrolment.updateMany({where:{id:row.id,organisationId:s.organisationId,currentNode:row.currentNode,status:'ACTIVE'},data:{status,currentNode:next,nextExecutionAt:nextAt}});if(updated.count){processed++;await audit(tx,s,'journey.step','MarketingJourneyEnrolment',row.id,{from:row.currentNode,to:next,status,version:row.version.number});}
  }return {processed};
 },{isolationLevel:'Serializable',timeout:30000});refresh();return result;
}

export async function saveMarketingPlan(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.program.manage');
 await requireMarketing(s);
 const {marketingPlanSchema,moneyMinor}=await import('../domain/planning');
 const definition=marketingPlanSchema.parse({objective:text(f,'objective',3000,true),targetMarket:text(f,'targetMarket',3000,true),proposition:text(f,'proposition',3000),successMeasure:text(f,'successMeasure',2000,true),salesTargetMinor:moneyMinor(text(f,'salesTarget',100,true)),leadTarget:integer(f,'leadTarget',0,10000000),currency:text(f,'currency',3,true)});
 await db.$transaction(async tx=>{const id=text(f,'id',100),campaignId=text(f,'campaignId',100)||null;if(campaignId)await campaign(tx,s,campaignId);if(id){const old=await tx.marketingProgram.findFirstOrThrow({where:{id,organisationId:s.organisationId,kind:'MARKETING_PLAN'}});const count=await tx.marketingProgram.updateMany({where:{id,organisationId:s.organisationId,updatedAt:date(f,'updatedAt',true)!},data:{name:text(f,'name',250,true),definition,campaignId,startsAt:date(f,'startsAt')}});if(count.count!==1)throw new Error('This plan changed. Refresh before saving.');await audit(tx,s,'plan.updated','MarketingProgram',old.id);}else{const row=await tx.marketingProgram.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),kind:'MARKETING_PLAN',definition,campaignId,ownerUserId:s.userId,startsAt:date(f,'startsAt')}});await audit(tx,s,'plan.created','MarketingProgram',row.id);} });refresh();
}
export async function addPlanActivity(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.program.manage');
 await requireMarketing(s);const {activitySchema}=await import('../domain/planning');const definition=activitySchema.parse({channel:text(f,'channel'),deliverable:text(f,'deliverable',3000,true),owner:text(f,'owner',250,true),dueAt:date(f,'dueAt',true)!.toISOString(),status:'PLANNED'});
 await db.$transaction(async tx=>{const campaignId=text(f,'campaignId',100,true);await campaign(tx,s,campaignId);const row=await tx.marketingProgram.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),kind:'PLAN_ACTIVITY',definition,campaignId,ownerUserId:s.userId,startsAt:date(f,'startsAt')}});await audit(tx,s,'activity.planned','MarketingProgram',row.id);});refresh();
}
export async function updatePlanActivity(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.program.manage');
 await requireMarketing(s);const {activitySchema}=await import('../domain/planning');await db.$transaction(async tx=>{const row=await tx.marketingProgram.findFirstOrThrow({where:{organisationId:s.organisationId,id:text(f,'id',100,true),kind:'PLAN_ACTIVITY'}});const definition=activitySchema.parse({...row.definition as object,status:text(f,'status')});const changed=await tx.marketingProgram.updateMany({where:{id:row.id,organisationId:s.organisationId,updatedAt:date(f,'updatedAt',true)!},data:{definition}});if(changed.count!==1)throw new Error('Activity changed. Refresh and retry.');await audit(tx,s,'activity.status','MarketingProgram',row.id,{status:definition.status});});refresh();
}
export async function addBudgetLine(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.campaign.manage');
 assertCapability(s,'marketing.program.manage');await requireMarketing(s);const {budgetLineSchema,moneyMinor}=await import('../domain/planning');const definition=budgetLineSchema.parse({channel:text(f,'channel'),place:text(f,'place',250,true),category:text(f,'category',250,true),supplier:text(f,'supplier',250),plannedMinor:moneyMinor(text(f,'planned',100,true)),forecastMinor:moneyMinor(text(f,'forecast',100,true)),currency:text(f,'currency',3,true),notes:text(f,'notes')});
 await db.$transaction(async tx=>{const c=await campaign(tx,s,text(f,'campaignId',100,true));if(c.currency!==definition.currency)throw new Error('Use the campaign currency for its budget lines.');const row=await tx.marketingProgram.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),kind:'BUDGET_LINE',definition,campaignId:c.id,ownerUserId:s.userId}});await audit(tx,s,'budget.planned','MarketingProgram',row.id);});refresh();
}
export async function submitBudgetToFinance(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.campaign.manage');
 assertCapability(s,'marketing.program.manage');
 assertCapability(s,'finance.request.create');
 await requireMarketing(s);
 const {budgetLineSchema}=await import('../domain/planning');
 const {createFinanceDocument,submitFinanceDocument}=await import('@/modules/finance/services/commands');
 const row=await db.marketingProgram.findFirstOrThrow({where:{id:text(f,'id',100,true),organisationId:s.organisationId,kind:'BUDGET_LINE'}});
 const current=budgetLineSchema.parse(row.definition);
 if(current.financeDocumentId)throw new Error('This spend is already with Finance.');
 if(current.plannedMinor<=0)throw new Error('Enter an amount before sending it to Finance.');
 const owned=await db.marketingCampaign.findFirstOrThrow({where:{id:row.campaignId??'',organisationId:s.organisationId}});
 if(owned.currency!==current.currency)throw new Error('Use the campaign currency.');
 const entity=await db.financeEntity.findFirst({where:{organisationId:s.organisationId},orderBy:{createdAt:'asc'}});
 if(!entity)throw new Error('Finance has no company books yet.');
 if(entity.currency!==current.currency)throw new Error('This amount does not match the finance books currency.');
 const amount=`${Math.floor(current.plannedMinor/100)}.${String(current.plannedMinor%100).padStart(2,'0')}`;
 const doc=await createFinanceDocument({entityId:entity.id,kind:'REQUEST',title:`${owned.name} — ${current.place}`.slice(0,250),currency:current.currency,exchangeRate:'1',documentDate:new Date().toISOString().slice(0,10),department:'Marketing',site:current.place.slice(0,100),category:current.channel,reason:current.notes||`${row.name} for ${owned.name}`,lines:[{description:row.name.slice(0,500),quantity:'1',unitPrice:amount,taxCode:'OUTSIDE_SCOPE',taxRateBps:0}]});
 let message='Sent to Finance for approval.';
 try{await submitFinanceDocument(doc.id);}catch(error){message=error instanceof Error?`The spend is in Finance, but approval has not started. ${error.message}`:'The spend is in Finance, but approval has not started.';}
 const definition=budgetLineSchema.parse({...current,financeDocumentId:doc.id,approval:'WITH_FINANCE'});
 await db.$transaction(async tx=>{const changed=await tx.marketingProgram.updateMany({where:{id:row.id,organisationId:s.organisationId,kind:'BUDGET_LINE'},data:{definition}});if(changed.count!==1)throw new Error('This budget line changed. Refresh and retry.');await audit(tx,s,'budget.sent','MarketingProgram',row.id,{financeDocumentId:doc.id});});
 refresh();
 return {message};
}
const STARTER: Array<[string, string]> = [['Notice', 'They hear the name.'], ['Look', 'They compare what they need.'], ['Choose', 'They pick a supplier.'], ['Buy', 'They place the order.'], ['Stay', 'They come back.']];
export async function createJourneyMap(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.program.manage');
 await requireMarketing(s);
 const {journeyMapSchema,journeyStageSchema}=await import('../domain/planning');
 const who=text(f,'who',250,true);
 const definition=journeyMapSchema.parse({who});
 const campaignId=text(f,'campaignId',100)||null;
 await db.$transaction(async tx=>{
  if(campaignId)await campaign(tx,s,campaignId);
  const map=await tx.marketingProgram.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),kind:'JOURNEY_MAP',definition,campaignId,ownerUserId:s.userId}});
  for(const [order,[name,customerIntent]] of STARTER.entries()){
   const stage=journeyStageSchema.parse({journeyId:map.id,order,customerIntent});
   await tx.marketingProgram.create({data:{organisationId:s.organisationId,name,kind:'JOURNEY_STAGE',definition:stage,campaignId,ownerUserId:s.userId}});
  }
  await audit(tx,s,'journey.mapped','MarketingProgram',map.id);
 });
 refresh();
}
export async function addJourneyStage(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.program.manage');
 await requireMarketing(s);
 const {journeyStageSchema}=await import('../domain/planning');
 await db.$transaction(async tx=>{
  const map=await tx.marketingProgram.findFirstOrThrow({where:{id:text(f,'journeyId',100,true),organisationId:s.organisationId,kind:'JOURNEY_MAP'}});
  const existing=await tx.marketingProgram.findMany({where:{organisationId:s.organisationId,kind:'JOURNEY_STAGE'},select:{definition:true}});
  const order=existing.reduce((max,row)=>{const parsed=journeyStageSchema.safeParse(row.definition);return parsed.success&&parsed.data.journeyId===map.id?Math.max(max,parsed.data.order):max;},-1)+1;
  const definition=journeyStageSchema.parse({journeyId:map.id,order,customerIntent:text(f,'customerIntent',500)});
  const row=await tx.marketingProgram.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),kind:'JOURNEY_STAGE',definition,campaignId:map.campaignId,ownerUserId:s.userId}});
  await audit(tx,s,'journey.stage','MarketingProgram',row.id);
 });
 refresh();
}
export async function addJourneyTouch(f:FormData){
 const s=await requireSession();
 assertCapability(s,'marketing.program.manage');
 await requireMarketing(s);
 const {journeyTouchSchema,journeyStageSchema}=await import('../domain/planning');
 await db.$transaction(async tx=>{
  const stage=await tx.marketingProgram.findFirstOrThrow({where:{id:text(f,'stageId',100,true),organisationId:s.organisationId,kind:'JOURNEY_STAGE'}});
  const parsed=journeyStageSchema.parse(stage.definition);
  const map=await tx.marketingProgram.findFirstOrThrow({where:{id:parsed.journeyId,organisationId:s.organisationId,kind:'JOURNEY_MAP'}});
  const definition=journeyTouchSchema.parse({journeyId:map.id,stageId:stage.id,channel:text(f,'channel'),moment:text(f,'moment',500,true),owner:text(f,'owner',250)});
  const row=await tx.marketingProgram.create({data:{organisationId:s.organisationId,name:text(f,'name',250,true),kind:'JOURNEY_TOUCH',definition,campaignId:map.campaignId,ownerUserId:s.userId}});
  await audit(tx,s,'journey.touch','MarketingProgram',row.id);
 });
 refresh();
}
