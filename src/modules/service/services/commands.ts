'use server';
import { db } from '@/core/db/client';
import { DOMAIN_EVENTS } from '@/core/events/bus';
import { requireSession, type Session } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { serviceCaseScope, serviceTicketScope } from '@/core/permissions/service-access';
import type { Prisma, ServiceCase } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireService, configuredCaseTypes } from './queries';
import { ACTIVE_STATUSES, PRIORITIES, SEVERITIES, CHANNELS, TICKET_STATUSES, choice, validateTransition, isComplaint } from '../domain/workflow';
import { readManagerPolicy, serviceNeedsManagerSignOff } from '@/core/permissions/manager-level';
import { readCompanyProfile } from '@/core/setup/company-profile';
import { SERVICE_CAPABILITIES } from '@/core/permissions/capabilities';
import { validatePurchase } from './purchase';
import { queueConfig } from '@/core/service-work/config';
import { slaSchema, addBusinessMinutes, businessMinutesBetween } from '@/core/service-work/sla';
import { prepareServiceCredit, prepareServiceOperation, triggerCaseSurvey } from '@/core/service-work/connections';

function field(form:FormData,key:string,max=2000) {const value=String(form.get(key)??'').trim();if(value.length>max)throw new Error(`${key} is too long.`);return value;}
function required(form:FormData,key:string,max=2000) {const value=field(form,key,max);if(!value)throw new Error(`${key} is required.`);return value;}
function version(form:FormData) {const n=Number(form.get('version'));if(!Number.isSafeInteger(n)||n<1)throw new Error('Refresh this record before saving.');return n;}
function date(form:FormData,key:string,needed=false) {const raw=field(form,key,60);if(!raw){if(needed)throw new Error('A due date is required.');return null;}const d=new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)?raw+'Z':raw);if(!Number.isFinite(d.getTime()))throw new Error('Invalid date.');return d;}
async function getCase(tx:Prisma.TransactionClient,session:Session,id:string) {const c=await tx.serviceCase.findFirst({where:{AND:[serviceCaseScope(session),{id}]}});if(!c)throw new Error('Case unavailable.');if(c.mergedIntoId)throw new Error('Open the continuing case before making changes.');return c;}
async function member(tx:Prisma.TransactionClient,session:Session,userId:string) {if(!await tx.membership.findFirst({where:{organisationId:session.organisationId,userId,active:true}}))throw new Error('Choose an active company member.');}
async function number(tx:Prisma.TransactionClient,organisationId:string,prefix:string) {const seq=await tx.serviceSequence.upsert({where:{organisationId_prefix:{organisationId,prefix}},create:{organisationId,prefix,value:1},update:{value:{increment:1}}});return `${prefix}-${String(seq.value).padStart(6,'0')}`;}
async function lock(tx:Prisma.TransactionClient,session:Session,c:ServiceCase,expected:number,data:Prisma.ServiceCaseUpdateManyMutationInput={}) {const result=await tx.serviceCase.updateMany({where:{id:c.id,organisationId:session.organisationId,version:expected},data:{...data,version:{increment:1}}});if(result.count!==1)throw new Error('This case changed. Refresh before saving.');}
async function event(tx:Prisma.TransactionClient,session:Session,c:ServiceCase,kind:string,body:string,ticketId?:string) {
  const entry=await tx.serviceEntry.create({data:{organisationId:session.organisationId,caseId:c.id,ticketId,kind,visibility:'INTERNAL',body,authorUserId:session.userId}});
  const eventName=kind==='CASE_CREATED'?DOMAIN_EVENTS.serviceCaseCreated:kind==='CASE_REOPENED'?DOMAIN_EVENTS.serviceCaseReopened:kind==='DEPARTMENT_TICKET_CREATED'?DOMAIN_EVENTS.serviceTicketCreated:kind==='DEPARTMENT_RESPONSE_READY'?DOMAIN_EVENTS.serviceDepartmentResponseReady:DOMAIN_EVENTS.serviceCaseChanged;
  await tx.domainOutbox.create({data:{organisationId:session.organisationId,eventKey:`service:${entry.id}`,eventName,payload:{caseId:c.id,ticketId:ticketId??null,entryId:entry.id,kind}}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:`service.${kind.toLowerCase()}`,entityType:'ServiceCase',entityId:c.id,after:{ticketId:ticketId??null}}});
  // Shared feeds deliberately contain no subject, note or restricted-case content.
  if(c.security==='STANDARD')await tx.activity.create({data:{organisationId:session.organisationId,partyId:c.partyId,type:`service.${kind.toLowerCase()}`,summary:`${c.number}: ${kind.toLowerCase().replaceAll('_',' ')}`,entityType:'ServiceCase',entityId:c.id}});
}

export async function createCase(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.case.create');
  assertCapability(session,'service.case.read');assertCapability(session,'customers.read');await requireService(session);
  const partyId=required(form,'partyId',100),subject=required(form,'subject',250);
  const types=await configuredCaseTypes(session);
  const id=await db.$transaction(async tx=>{
    if(!await tx.party.findFirst({where:{id:partyId,organisationId:session.organisationId}}))throw new Error('Customer unavailable.');
    const contactId=field(form,'contactId',100)||null;
    if(contactId&&!await tx.contact.findFirst({where:{id:contactId,partyId,party:{organisationId:session.organisationId}}}))throw new Error('Contact does not belong to this customer.');
    const security=choice(field(form,'security')||'STANDARD',['STANDARD','RESTRICTED'] as const);if(security==='RESTRICTED')assertCapability(session,'service.case.restricted');
    const context=await validatePurchase(tx,session,partyId,form);
    const queues=await tx.serviceQueue.findMany({where:{organisationId:session.organisationId,active:true},orderBy:{name:'asc'}});
    const queue=queues.find(q=>queueConfig(q.configuration).routing.some(rule=>Object.entries(rule).every(([key,value])=>field(form,key)===value)));
    const sla=queue?queueConfig(queue.configuration).sla:slaSchema.parse({}); const now=new Date();
    const c=await tx.serviceCase.create({data:{context,sla,queueId:queue?.id,firstResponseDueAt:addBusinessMinutes(now,sla.responseMinutes,sla.calendar),resolutionDueAt:addBusinessMinutes(now,sla.resolutionMinutes,sla.calendar),organisationId:session.organisationId,number:await number(tx,session.organisationId,'CS'),partyId,contactId,subject,category:field(form,'category',250),description:field(form,'description',20000),type:choice(field(form,'type')||'GENERAL_ENQUIRY',types),priority:choice(field(form,'priority')||'NORMAL',PRIORITIES),severity:choice(field(form,'severity')||'SEV3',SEVERITIES),channel:choice(field(form,'channel')||'MANUAL',CHANNELS),ownerUserId:session.userId,createdByUserId:session.userId,security}});
    for(const [entityType,entityId] of [['SalesOrder',context.salesOrderId],['Product',context.productId],['Shipment',context.shipmentId]])if(entityId)await tx.serviceLink.create({data:{organisationId:session.organisationId,caseId:c.id,entityType,entityId}});
    await event(tx,session,c,'CASE_CREATED','Case received. Customer Service retains ownership.');return c.id;
  });revalidatePath('/service','layout');revalidatePath(`/service/cases/${id}`);redirect(`/service/cases/${id}`);
}
export async function updateCase(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.case.update');
  await requireService(session);const id=required(form,'caseId',100);const types=await configuredCaseTypes(session);
  await db.$transaction(async tx=>{const c=await getCase(tx,session,id);await lock(tx,session,c,version(form),{type:choice(required(form,'type'),types),category:field(form,'category',250),priority:choice(required(form,'priority'),PRIORITIES),severity:choice(required(form,'severity'),SEVERITIES),rootCause:field(form,'rootCause',2000)||null,customerUpdateDueAt:date(form,'customerUpdateDueAt')});await event(tx,session,c,'CASE_RECLASSIFIED',`Classification changed: ${c.type} / ${c.category} / ${c.priority} / ${c.severity} → ${field(form,'type')} / ${field(form,'category')} / ${field(form,'priority')} / ${field(form,'severity')}. Root cause: ${c.rootCause??'Not recorded'} → ${field(form,'rootCause')||'Not recorded'}. Customer update due: ${c.customerUpdateDueAt?.toISOString()??'None'} → ${date(form,'customerUpdateDueAt')?.toISOString()??'None'}.`);});revalidatePath('/service','layout');revalidatePath(`/service/cases/${id}`);
}
export async function assignCase(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.case.assign');
  await requireService(session);const id=required(form,'caseId',100),ownerUserId=required(form,'ownerUserId',100);
  await db.$transaction(async tx=>{const c=await getCase(tx,session,id);await member(tx,session,ownerUserId);const owner=await tx.membership.findFirstOrThrow({where:{organisationId:session.organisationId,userId:ownerUserId,active:true},include:{roles:{include:{role:true}}}});const caps=new Set([...owner.roles.flatMap(r=>r.role.capabilities),...owner.grantedCapabilities]);for(const denied of owner.deniedCapabilities)caps.delete(denied);if(c.security==='RESTRICTED'&&!caps.has('service.case.restricted'))throw new Error('Owner must have restricted case access.');if(!caps.has('service.case.read')||!caps.has('service.case.update'))throw new Error('Case owner must have Customer Service case access.');await lock(tx,session,c,version(form),{ownerUserId});await event(tx,session,c,'CASE_ASSIGNED',`Case owner changed from ${c.ownerUserId} to ${ownerUserId}.`);});revalidatePath('/service','layout');revalidatePath(`/service/cases/${id}`);
}
export async function transitionCase(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.case.update');
  await requireService(session);const id=required(form,'caseId',100),status=required(form,'status',40);
  if(status==='RESOLVED')assertCapability(session,'service.case.resolve');if(status==='CLOSED')assertCapability(session,'service.case.close');
  await db.$transaction(async tx=>{const c=await getCase(tx,session,id),linkedOpen=await tx.serviceWorkItem.count({where:{organisationId:session.organisationId,parentCaseId:id,status:{notIn:['RESOLVED','CLOSED','CANCELLED']},mergedIntoId:null}}),legacyOpen=await tx.serviceTicket.count({where:{organisationId:session.organisationId,caseId:id,status:{notIn:['COMPLETE','CANCELLED']}}});
    const openTickets=linkedOpen+legacyOpen;
    const reason=field(form,'reason'),summary=field(form,'resolutionSummary',10000),code=field(form,'resolutionCode',100);
    validateTransition(c.status,status,{openTickets,resolution:summary,code,rootCause:c.rootCause??undefined,complaint:isComplaint(c.type),reason});
    if(status==='RESOLVED'||status==='CLOSED'){
      const org=await tx.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{managerPolicy:true,companyProfile:true}});
      const links=await tx.serviceLink.findMany({where:{organisationId:session.organisationId,caseId:id,entityType:'SalesOrder'},select:{entityId:true}});
      const orders=links.length?await tx.salesOrder.findMany({where:{organisationId:session.organisationId,id:{in:links.map(link=>link.entityId)}},select:{grossAmount:true,currency:true}}):[];
      const companyCurrency=readCompanyProfile(org.companyProfile).defaultCurrency;
      const foreign=orders.some(order=>order.currency!==companyCurrency);
      const linkedGross=orders.filter(order=>order.currency===companyCurrency).reduce((sum,order)=>sum+order.grossAmount,0);
      if(serviceNeedsManagerSignOff(readManagerPolicy(org.managerPolicy),{complaint:isComplaint(c.type),linkedGross,foreign})&&!session.capabilities.has(SERVICE_CAPABILITIES.caseApprove))throw new Error(isComplaint(c.type)?'A customer service manager must sign off this complaint before it can be resolved or closed.':'A customer service manager must sign off this high-value query before it can be resolved or closed.');
    }
    const reopening=status==='OPEN'&&['RESOLVED','CLOSED','CANCELLED'].includes(c.status);
    const sla=slaSchema.parse(c.sla);const now=new Date();const pause=sla.pauseStates.includes(status);let resolutionDueAt=c.resolutionDueAt;
    if(c.pausedAt&&!pause&&resolutionDueAt)resolutionDueAt=addBusinessMinutes(resolutionDueAt,businessMinutesBetween(c.pausedAt,now,sla.calendar),sla.calendar);
    await lock(tx,session,c,version(form),{status,pausedAt:pause?(c.pausedAt??now):null,resolutionDueAt,...(status==='RESOLVED'?{resolutionCode:code,resolutionSummary:summary,resolvedAt:new Date(),customerUpdateDueAt:null}:{}),...(status==='CLOSED'?{closedAt:new Date()}:{}),...(reopening?{reopenCount:{increment:1},resolvedAt:null,closedAt:null}:{} )});
    if(pause!==!!c.pausedAt)await event(tx,session,c,pause?'SLA_PAUSED':'SLA_RESUMED',`Resolution deadline ${c.resolutionDueAt?.toISOString()??'none'} → ${resolutionDueAt?.toISOString()??'none'}. ${reason}`);
    await event(tx,session,c,reopening?'CASE_REOPENED':'STATUS_CHANGED',`${c.status} → ${status}. ${reason||summary}`);
  },{isolationLevel:'Serializable'});if(status==='RESOLVED')await triggerCaseSurvey(session,id);revalidatePath('/service','layout');revalidatePath(`/service/cases/${id}`);
}
export async function addCaseEntry(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.case.read');
  await requireService(session);const id=required(form,'caseId',100),kind=choice(required(form,'kind'),['INTERNAL_NOTE','CUSTOMER_CONTACT','EXTERNAL_LOG'] as const);
  assertCapability(session,kind==='INTERNAL_NOTE'?'service.case.note':'service.case.communication');
  await db.$transaction(async tx=>{const c=await getCase(tx,session,id);if(['CLOSED','CANCELLED'].includes(c.status))throw new Error('Reopen this case before adding communication.');
    const body=required(form,'body',20000);const response=kind==='EXTERNAL_LOG';const reopen=kind==='CUSTOMER_CONTACT'&&c.status==='RESOLVED';
    await lock(tx,session,c,version(form),{...(response?{firstResponseAt:c.firstResponseAt??new Date(),customerUpdateDueAt:null}:{}),...(reopen?{status:'OPEN',reopenCount:{increment:1},resolvedAt:null,closedAt:null}:c.status==='WAITING_CUSTOMER'&&kind==='CUSTOMER_CONTACT'?{status:'OPEN'}:{})});
    await tx.serviceEntry.create({data:{organisationId:session.organisationId,caseId:id,kind,visibility:kind==='INTERNAL_NOTE'?'INTERNAL':'PUBLIC',body,authorUserId:session.userId}});
    await event(tx,session,c,reopen?'CASE_REOPENED':'COMMUNICATION_RECORDED',reopen?'Customer contacted us again after resolution. Case reopened.':`Recorded ${kind.toLowerCase().replaceAll('_',' ')}. No email delivery performed by Atlas.`);
  });revalidatePath('/service','layout');revalidatePath(`/service/cases/${id}`);
}
export async function createDepartmentTicket(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.ticket.create');
  await requireService(session);const id=required(form,'caseId',100);
  await db.$transaction(async tx=>{const c=await getCase(tx,session,id);if(!ACTIVE_STATUSES.includes(c.status as typeof ACTIVE_STATUSES[number]))throw new Error('Reopen the case before creating departmental work.');
    const queue=await tx.serviceQueue.findFirst({where:{id:required(form,'queueId',100),organisationId:session.organisationId,active:true}});if(!queue)throw new Error('Queue unavailable.');
    const ownerUserId=field(form,'ownerUserId',100)||null;if(ownerUserId){await member(tx,session,ownerUserId);if(!await tx.serviceQueueMember.findFirst({where:{organisationId:session.organisationId,queueId:queue.id,userId:ownerUserId}}))throw new Error('Ticket owner must be a queue member.');}
    await lock(tx,session,c,version(form),{status:'WAITING_INTERNAL'});
    const ticket=await tx.serviceTicket.create({data:{organisationId:session.organisationId,caseId:id,queueId:queue.id,number:await number(tx,session.organisationId,queue.prefix),subject:required(form,'subject',250),description:required(form,'description',10000),ownerUserId,status:ownerUserId?'ASSIGNED':'QUEUED',dueAt:date(form,'dueAt',true)!}});
    await event(tx,session,c,'DEPARTMENT_TICKET_CREATED',`${ticket.number} created for ${queue.name}. Customer Service owner unchanged.`,ticket.id);
  });revalidatePath('/service','layout');revalidatePath(`/service/cases/${id}`);
}
export async function updateDepartmentTicket(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.ticket.update');
  await requireService(session);const id=required(form,'ticketId',100);
  const caseId=await db.$transaction(async tx=>{const t=await tx.serviceTicket.findFirst({where:{AND:[serviceTicketScope(session),{id}]}});if(!t)throw new Error('Ticket unavailable.');if(['COMPLETE','CANCELLED'].includes(t.status))throw new Error('This departmental ticket is final.');
    const status=choice(required(form,'status'),TICKET_STATUSES),outcome=field(form,'outcome',10000),summary=field(form,'customerSafeSummary',10000);
    if(['COMPLETE','REJECTED','CANCELLED','WAITING_INFORMATION'].includes(status)&&!outcome)throw new Error('An outcome or reason is required.');
    let ownerUserId=t.ownerUserId;if(form.get('takeOwnership')==='yes'){await member(tx,session,session.userId);ownerUserId=session.userId;}
    if(!ownerUserId&&['ASSIGNED','IN_PROGRESS','COMPLETE'].includes(status))throw new Error('Take ownership before progressing this ticket.');
    const result=await tx.serviceTicket.updateMany({where:{id,organisationId:session.organisationId,version:version(form)},data:{status,outcome:outcome||null,customerSafeSummary:summary||null,ownerUserId,completedAt:status==='COMPLETE'?new Date():null,version:{increment:1}}});if(result.count!==1)throw new Error('Ticket changed. Refresh before saving.');
    const c=await tx.serviceCase.findFirstOrThrow({where:{id:t.caseId,organisationId:session.organisationId}});
    await tx.serviceCase.update({where:{id:c.id,organisationId:session.organisationId},data:{version:{increment:1}}});
    await event(tx,session,c,status==='COMPLETE'?'DEPARTMENT_RESPONSE_READY':'DEPARTMENT_TICKET_UPDATED',`${t.number}: ${t.status} → ${status}. ${outcome}${summary?`\nCustomer-safe summary: ${summary}`:''}`,t.id);return t.caseId;
  },{isolationLevel:'Serializable'});revalidatePath('/service','layout');revalidatePath(`/service/cases/${caseId}`);
}
export async function createQueue(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.queue.manage');
  await requireService(session);const prefix=required(form,'prefix',8).toUpperCase();if(!/^[A-Z]{2,8}$/.test(prefix)||prefix==='CASE')throw new Error('Use 2–8 letters, excluding CASE.');
  await db.$transaction(async tx=>{const queue=await tx.serviceQueue.create({data:{organisationId:session.organisationId,name:required(form,'name',100),prefix,department:required(form,'department',100)}});await tx.serviceQueueMember.create({data:{organisationId:session.organisationId,queueId:queue.id,userId:session.userId}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'service.queue.created',entityType:'ServiceQueue',entityId:queue.id}});});revalidatePath('/service','layout');
}
export async function addQueueMember(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.queue.manage');
  await requireService(session);const queueId=required(form,'queueId',100),userId=required(form,'userId',100);
  await db.$transaction(async tx=>{const queue=await tx.serviceQueue.findFirst({where:{id:queueId,organisationId:session.organisationId}});if(!queue)throw new Error('Queue unavailable.');if(queue.restricted&&!await tx.serviceQueueMember.findFirst({where:{queueId,organisationId:session.organisationId,userId:session.userId}}))throw new Error('Restricted queue membership requires a current member.');await member(tx,session,userId);await tx.serviceQueueMember.upsert({where:{queueId_userId:{queueId,userId}},create:{organisationId:session.organisationId,queueId,userId},update:{}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'service.queue.member_added',entityType:'ServiceQueue',entityId:queueId,after:{userId}}});});revalidatePath('/service','layout');
}
export async function linkCaseRecord(form:FormData) {
  const session=await requireSession();
  assertCapability(session,'service.case.update');
  await requireService(session);const id=required(form,'caseId',100),entityId=required(form,'entityId',100),entityType=choice(required(form,'entityType'),['SalesOrder','Product'] as const);
  assertCapability(session,entityType==='SalesOrder'?'sales.order.read':'core.products.read');
  await db.$transaction(async tx=>{const c=await getCase(tx,session,id);
    const record=entityType==='SalesOrder'?await tx.salesOrder.findFirst({where:{id:entityId,organisationId:session.organisationId,partyId:c.partyId},select:{id:true}}):await tx.product.findFirst({where:{id:entityId,organisationId:session.organisationId},select:{id:true}});
    if(!record)throw new Error('Linked record unavailable or belongs to another customer.');
    await lock(tx,session,c,version(form));await tx.serviceLink.create({data:{organisationId:session.organisationId,caseId:id,entityType,entityId}});await event(tx,session,c,'ERP_RECORD_LINKED',`${entityType} linked by reference.`);
  });revalidatePath('/service','layout');revalidatePath(`/service/cases/${id}`);
}
export async function creditChoices(caseId: string) {
  const session = await requireSession();
  assertCapability(session, "service.case.read");
  await requireService(session);
  const serviceCase = await db.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: caseId }] }, select: { id: true, partyId: true } });
  if (!serviceCase) return { invoices: [], sent: null };
  if(!await db.moduleState.findFirst({where:{organisationId:session.organisationId,moduleId:"finance",enabled:true,entitled:true}}))return {invoices:[],sent:null};
  const [invoices, sent] = await Promise.all([
    db.financeDocument.findMany({ where: { organisationId: session.organisationId, partyId: serviceCase.partyId, kind: "AR_INVOICE", status: "POSTED" }, select: { id: true, reference: true, gross: true, settled: true, currency: true, lines: {select:{id:true,number:true,description:true,productId:true,salesOrderLineId:true,quantity:true,net:true,tax:true}} }, orderBy: { documentDate: "desc" }, take: 30 }),
    db.financeDocument.findFirst({ where: { organisationId: session.organisationId, duplicateKey: `service-credit:${serviceCase.id}` }, select: { id: true, reference: true, status: true } }),
  ]);
  return {
    invoices: invoices.filter((invoice) => invoice.gross > invoice.settled).map((invoice) => ({ id: invoice.id, reference: invoice.reference, outstanding: invoice.gross - invoice.settled, currency: invoice.currency, lines: invoice.lines.map(line=>({...line,quantity:line.quantity.toString(),net:line.net.toString(),tax:line.tax.toString()})) })),
    sent: sent && !["CANCELLED", "REJECTED"].includes(sent.status) ? sent : null,
  };
}

export async function askFinanceForCredit(form: FormData) {
 const session=await requireSession();
 assertCapability(session,'service.case.update');
 await requireService(session);const id=required(form,'caseId',100);
 await db.$transaction(async tx=>{const c=await getCase(tx,session,id);await lock(tx,session,c,version(form));
 const purchase=c.context as {productId?:string;salesOrderLineId?:string;affectedQuantity?:number};
 const credit=await prepareServiceCredit(tx,session,{affectedQuantity:purchase.affectedQuantity,productId:purchase.productId,salesOrderLineId:purchase.salesOrderLineId,caseId:id,caseNumber:c.number,partyId:c.partyId,invoiceId:required(form,'invoiceId',100),lineId:required(form,'lineId',100),net:field(form,'amount',40),quantity:field(form,'creditQuantity')?Number(form.get('creditQuantity')):null,reason:required(form,'reason',2000),requestKey:required(form,'requestKey',100)});
 await tx.serviceLink.upsert({where:{caseId_entityType_entityId:{caseId:id,entityType:'FinanceDocument',entityId:credit.id}},create:{organisationId:session.organisationId,caseId:id,entityType:'FinanceDocument',entityId:credit.id,relationship:'CREDIT'},update:{}});await event(tx,session,c,'CREDIT_REQUESTED',`${credit.requestReference} → ${credit.reference}. Finance approval and separate posting required.`);
 },{isolationLevel:'Serializable'});revalidatePath('/service','layout');revalidatePath('/finance','layout');
}

export async function getCaseOwners() {
  const session=await requireSession();
  assertCapability(session,'service.case.assign');
  await requireService(session);
  const rows=await db.membership.findMany({where:{organisationId:session.organisationId,active:true},include:{roles:{include:{role:true}},user:{select:{name:true}}},take:500});
  return rows.filter(m=>{const caps=new Set(m.roles.flatMap(r=>r.role.capabilities));return caps.has('service.case.read')&&caps.has('service.case.update');}).map(m=>({userId:m.userId,name:m.user.name}));
}
export async function getDepartmentWork() {
  const session=await requireSession();
  assertCapability(session,'service.ticket.read');
  await requireService(session);
  const rows=await db.serviceTicket.findMany({where:serviceTicketScope(session),include:{queue:{select:{id:true,name:true}},case:{select:{number:true}}},orderBy:{dueAt:'asc'},take:100});
  return rows.map(({case:c,...t})=>({...t,caseNumber:c.number}));
}

export async function savePurchaseContext(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'service.case.update');
 await requireService(session);const id=required(form,'caseId',100);
 await db.$transaction(async tx=>{const c=await getCase(tx,session,id);const context=await validatePurchase(tx,session,c.partyId,form);await lock(tx,session,c,version(form),{context});
 for(const [entityType,entityId] of [['SalesOrder',context.salesOrderId],['Product',context.productId],['Shipment',context.shipmentId]])if(entityId)await tx.serviceLink.upsert({where:{caseId_entityType_entityId:{caseId:id,entityType,entityId}},create:{organisationId:session.organisationId,caseId:id,entityType,entityId},update:{}});
 await event(tx,session,c,'PURCHASE_CONTEXT_SAVED','Verified order, product and delivery context updated.');});revalidatePath('/service','layout');
}
export async function saveInvestigation(form:FormData){
 const session=await requireSession();
 assertCapability(session,'service.case.update');
 await requireService(session);const id=required(form,'caseId',100);
 await db.$transaction(async tx=>{const c=await getCase(tx,session,id);const investigation=Object.fromEntries(['impact','containment','suspectedCause','confirmedCause','correctiveAction','preventiveAction'].map(key=>[key,field(form,key,4000)]));await lock(tx,session,c,version(form),{investigation});await event(tx,session,c,'INVESTIGATION_UPDATED','Impact, containment and investigation findings updated.');});revalidatePath('/service','layout');
}
export async function logCaseCall(form:FormData){
 const session=await requireSession();
 assertCapability(session,'service.case.communication');
 await requireService(session);const id=required(form,'caseId',100);
 await db.$transaction(async tx=>{const c=await getCase(tx,session,id);const direction=choice(required(form,'direction'),['INBOUND','OUTBOUND'] as const);const duration=Number(form.get('duration'));if(!Number.isFinite(duration)||duration<0||duration>1440)throw new Error('Enter call duration in minutes.');const body=`${direction==='INBOUND'?'Inbound':'Outbound'} call · ${field(form,'telephone',60)} · ${date(form,'startedAt',true)!.toISOString()} · ${duration} minutes\nOutcome: ${required(form,'outcome',250)}\n${field(form,'notes',10000)}\nFollow-up: ${field(form,'followUp',1000)}`;await lock(tx,session,c,version(form));await tx.serviceEntry.create({data:{organisationId:session.organisationId,caseId:id,kind:'CALL_LOG',visibility:'INTERNAL',body,authorUserId:session.userId}});await event(tx,session,c,'CALL_RECORDED','Manual call log recorded.');});revalidatePath('/service','layout');
}

export async function createCaseRemedy(form:FormData){
 const session=await requireSession();
 assertCapability(session,'service.case.update');
 await requireService(session);const id=required(form,'caseId',100),moduleId=choice(required(form,'moduleId'),['sales','logistics','quality'] as const);
 await db.$transaction(async tx=>{const c=await getCase(tx,session,id);if(!ACTIVE_STATUSES.includes(c.status as typeof ACTIVE_STATUSES[number]))throw new Error('Reopen the case before requesting a remedy.');const relationship=`REMEDY:${required(form,'requestKey',100)}`;
 if(await tx.serviceLink.findFirst({where:{organisationId:session.organisationId,caseId:id,relationship}}))return;
 await lock(tx,session,c,version(form));const result=await prepareServiceOperation(tx,session,moduleId,{caseId:id,caseNumber:c.number,partyId:c.partyId,subject:c.subject,description:c.description,context:c.context as {salesOrderId?:string;salesOrderLineId?:string;productId?:string;shipmentId?:string;affectedQuantity?:number;lotCode?:string},requestKey:required(form,'requestKey',100)});
 await tx.serviceLink.create({data:{organisationId:session.organisationId,caseId:id,entityId:result.id,entityType:result.entityType,relationship}});await event(tx,session,c,'REMEDY_REQUESTED',`${result.reference} created with ${moduleId}. Source module retains control.`);},{isolationLevel:'Serializable'});revalidatePath('/service','layout');revalidatePath(`/${moduleId}`,'layout');
}

export async function mergeCases(form:FormData){
 const session=await requireSession();
 assertCapability(session,'service.case.assign');
 await requireService(session);
 await db.$transaction(async tx=>{const source=await getCase(tx,session,required(form,'caseId',100));const target=await tx.serviceCase.findFirst({where:{AND:[serviceCaseScope(session),{number:required(form,'targetNumber',40),mergedIntoId:null,status:{in:[...ACTIVE_STATUSES]}}]}});
 if(!target||source.id===target.id||source.partyId!==target.partyId||source.security!==target.security||source.mergedIntoId)throw new Error('Choose a different active case for the same customer and security level.');const reason=required(form,'reason',2000);
 const changed=await tx.serviceCase.updateMany({where:{id:source.id,organisationId:session.organisationId,version:version(form)},data:{mergedIntoId:target.id,status:'CLOSED',resolutionCode:'DUPLICATE',resolutionSummary:reason,resolvedAt:new Date(),closedAt:new Date(),version:{increment:1}}});if(!changed.count)throw new Error('Case changed. Refresh before merging.');
 await tx.serviceTicket.updateMany({where:{organisationId:session.organisationId,caseId:source.id,status:{notIn:['COMPLETE','CANCELLED']}},data:{caseId:target.id,version:{increment:1}}});await tx.serviceWorkItem.updateMany({where:{organisationId:session.organisationId,parentCaseId:source.id,status:{notIn:['RESOLVED','CLOSED','CANCELLED']}},data:{parentCaseId:target.id,version:{increment:1}}});await tx.serviceCase.update({where:{id:target.id},data:{version:{increment:1}}});
 await event(tx,session,source,'CASE_MERGED',`Merged into ${target.number}. ${reason}`);await event(tx,session,target,'MERGE_RECEIVED',`${source.number} merged here. Original timeline, evidence and financial links are retained on the historical reference.`);
 },{isolationLevel:'Serializable'});revalidatePath('/service','layout');
}
