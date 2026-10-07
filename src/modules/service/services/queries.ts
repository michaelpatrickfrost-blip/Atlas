import { db } from '@/core/db/client';
import type { Session } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { ACTIVE_STATUSES } from '../domain/workflow';
import { serviceCaseScope, serviceTicketScope } from '@/core/permissions/service-access';

export async function requireService(session: Session) {
  const state = await db.moduleState.findFirst({ where: {organisationId: session.organisationId,moduleId:'service',enabled:true,entitled:true} });
  if(!state) throw new Error('Customer Service is not enabled for this company.');
}
export async function caseList(session:Session, filter:{q?:string;type?:string;mine?:boolean;status?:string;partyId?:string;overdue?:boolean}={}) {
  assertCapability(session,'service.case.read');
  await requireService(session);
  return db.serviceCase.findMany({where:{AND:[serviceCaseScope(session),{
    ...(filter.type?{type:filter.type==='COMPLAINT'?{in:['COMPLAINT','QUALITY_COMPLAINT']}:filter.type}:{}),...(filter.overdue?{customerUpdateDueAt:{lt:new Date()},status:{in:[...ACTIVE_STATUSES]}}:{}),...(filter.status?{status:filter.status}:{}),...(filter.partyId?{partyId:filter.partyId}:{}),
    ...(filter.mine?{ownerUserId:session.userId}:{}),
    ...(filter.q?{OR:[{number:{contains:filter.q,mode:'insensitive'}},{subject:{contains:filter.q,mode:'insensitive'}}]}:{}),
  }]},orderBy:{updatedAt:'desc'},take:100,select:{id:true,number:true,subject:true,type:true,status:true,priority:true,severity:true,ownerUserId:true,createdAt:true,customerUpdateDueAt:true}});
}
export async function caseRecord(session:Session,id:string) {
  assertCapability(session,'service.case.read'); await requireService(session);
  return db.serviceCase.findFirst({where:{AND:[serviceCaseScope(session),{id}]},include:{entries:{where:{organisationId:session.organisationId},orderBy:{createdAt:'asc'},take:500},tickets:{where:serviceTicketScope(session),include:{queue:true},orderBy:{dueAt:'asc'}},links:{where:{organisationId:session.organisationId}}}});
}
export async function ticketList(session:Session) {
  assertCapability(session,'service.ticket.read'); await requireService(session);
  return db.serviceTicket.findMany({where:serviceTicketScope(session),include:{queue:true},orderBy:[{dueAt:'asc'}],take:100});
}
export async function serviceQueues(session:Session) {
  assertCapability(session,'service.ticket.read'); await requireService(session);
  return db.serviceQueue.findMany({where:{organisationId:session.organisationId,...(!session.capabilities.has('service.case.read')?{members:{some:{organisationId:session.organisationId,userId:session.userId}}}:{})},include:{members:{where:{organisationId:session.organisationId}}},orderBy:{name:'asc'}});
}
export async function serviceMembers(session:Session) {
  return db.membership.findMany({where:{organisationId:session.organisationId,active:true},select:{userId:true,user:{select:{name:true}}},take:500});
}

export async function configuredCaseTypes(session:Session){
 await requireService(session);
 const {CASE_TYPES}=await import('../domain/workflow');
 const {queueConfig}=await import('@/core/service-work/config');
 const queues=await db.serviceQueue.findMany({where:{organisationId:session.organisationId,active:true},select:{configuration:true}});
 return [...new Set([...CASE_TYPES,...queues.flatMap(q=>queueConfig(q.configuration).caseTypes)])];
}
