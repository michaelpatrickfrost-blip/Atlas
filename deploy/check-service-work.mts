// Server-only, isolated synthetic fixture for the live service-work release.
// Never touches an existing company's users, permissions or business records.
import {PrismaClient} from '../src/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
const mode=process.argv[2]??'verify';
if(process.platform!=='linux'||!process.env.DATABASE_URL||process.env.ATLAS_RUNTIME==='desktop')throw Error('Run on the Linux application server with its existing database environment.');
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
const stateFile='/tmp/atlas-service-release-fixture.json';
const form=(values:Record<string,string|number>)=>({__atlas:'form',entries:Object.entries(values).map(([k,v])=>[k,String(v)])});
const endpoint='http://127.0.0.1:3000';
async function call(cookie:string|null,key:string,args:unknown[]){const r=await fetch(endpoint+'/api/desktop/action',{method:'POST',headers:{'content-type':'application/json','x-atlas-client':'desktop',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({action:key,args})});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function ok(cookie:string,key:string,values:Record<string,string|number>){const r=await call(cookie,key,[form(values)]);assert.equal(r.status,200,JSON.stringify(r.body));return r.body;}
try{
 if(mode==='setup'){
  try{await readFile(stateFile);throw Error('Fixture already exists; verify or clean up before creating another.');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const stamp=randomUUID(),password=randomUUID()+randomUUID();
  // Retire a previous interrupted fixture without altering its immutable history.
  await db.membership.updateMany({where:{organisation:{slug:{startsWith:'service-release-check-'},name:'Service release verification'}},data:{active:false}});
  await db.organisation.updateMany({where:{slug:{startsWith:'service-release-check-'},name:'Service release verification'},data:{status:'SUSPENDED',name:'Archived service release verification'}});
  const state=await db.$transaction(async tx=>{
  const org=await tx.organisation.create({data:{name:'Service release verification',slug:'service-release-check-'+stamp}});
  const caps=['core.profile.self','core.apps.manage','customers.read','core.products.read','sales.order.read','sales.order.create','sales.order.edit_draft','service.case.read','service.case.create','service.case.update','service.case.resolve','service.case.close','service.case.assign','service.case.approve','service.case.restricted','service.case.note','service.case.communication','service.ticket.read','service.ticket.create','service.ticket.update','service.queue.manage','tickets.ticket.read','tickets.ticket.create','tickets.ticket.manage','tickets.ticket.reply','tickets.ticket.watch','tickets.queue.read','tickets.queue.manage','finance.overview.read','finance.receivables.read','finance.receivables.manage','finance.approval.decide','finance.configure','logistics.shipment.read','logistics.return.read','logistics.return.authorise','logistics.receipt.execute','logistics.return.inspect','stock.read','quality.ncr.read','csat.read','csat.manage'];
  const users=[];
  for(const kind of ['agent','approver','requester']){
   const user=await tx.user.create({data:{name:'Synthetic '+kind,email:`service-${stamp}-${kind}@example.invalid`,passwordHash:await bcrypt.hash(password,10)}});
   const membership=await tx.membership.create({data:{organisationId:org.id,userId:user.id,grantedCapabilities:kind==='requester'?['core.profile.self','tickets.ticket.read','tickets.ticket.create','tickets.ticket.reply']:caps}});
   users.push({id:user.id,email:user.email,membershipId:membership.id,kind});
  }
  for(const moduleId of ['service','tickets','sales','finance','products','stock','logistics','quality','csat'])await tx.moduleState.create({data:{organisationId:org.id,moduleId,enabled:true,entitled:true}});
  const [agent,approver]=users;
  const party=await tx.party.create({data:{organisationId:org.id,kind:'COMPANY',name:'Synthetic pipe customer',customerCode:'CHECK-001',tags:[]}});
  const contact=await tx.contact.create({data:{partyId:party.id,firstName:'Synthetic',surname:'Contact',email:`service-${stamp}-contact@example.invalid`}});
  const product=await tx.product.create({data:{organisationId:org.id,code:'CHECK-PIPE',name:'Synthetic pipes',basePriceAmount:100,taxCategory:'STANDARD'}});
  const order=await tx.salesOrder.create({data:{organisationId:org.id,partyId:party.id,reference:'SO-CHECK-001',ownerUserId:agent.id,commercialStatus:'CONFIRMED',customerPoReference:'PO-CHECK-001',currency:'GBP',netAmount:400000,taxAmount:80000,grossAmount:480000,lines:{create:{lineNumber:1,productId:product.id,descriptionSnapshot:'Synthetic pipes',orderedQuantity:4000,unitPriceAmount:100,netAmount:400000,taxAmount:80000,taxCategory:'STANDARD'}}},include:{lines:true}});
  const requirement=await tx.fulfilmentRequirement.create({data:{organisationId:org.id,reference:'FUL-CHECK-001',sourceEventKey:'service-check-'+stamp,salesOrderId:order.id,partyId:party.id,shipTo:{country:'GB'}}});
  const fulfilment=await tx.fulfilmentLine.create({data:{organisationId:org.id,requirementId:requirement.id,salesOrderLineId:order.lines[0].id,productId:product.id,description:'Synthetic pipes',orderedQuantity:4000,shippedQuantity:4000,deliveredQuantity:4000}});
  const shipment=await tx.shipment.create({data:{organisationId:org.id,reference:'DEL-CHECK-001',partyId:party.id,shipTo:{country:'GB'},status:'DELIVERED',dispatchedAt:new Date(),deliveredAt:new Date(),onTime:true,inFull:true,sources:{create:{organisationId:org.id,salesOrderId:order.id,requirementId:requirement.id,fulfilmentLineId:fulfilment.id,quantity:4000}}}});
  const entity=await tx.financeEntity.create({data:{organisationId:org.id,name:'Synthetic books',code:'CHECK'}});
  const invoice=await tx.financeDocument.create({data:{organisationId:org.id,entityId:entity.id,kind:'AR_INVOICE',reference:'INV-CHECK-001',title:'Synthetic source invoice',status:'DRAFT',creatorUserId:agent.id,partyId:party.id,salesOrderId:order.id,currency:'GBP',documentDate:new Date(),net:400000n,tax:80000n,gross:480000n,lines:{create:{number:1,productId:product.id,salesOrderLineId:order.lines[0].id,description:'Synthetic pipes',quantity:'4000',unitPrice:100n,net:400000n,tax:80000n,taxCode:'STANDARD',taxRateBps:2000}}},include:{lines:true}});
  await tx.financeDocument.update({where:{id:invoice.id},data:{status:'POSTED'}});
  const queue=await tx.serviceQueue.create({data:{organisationId:org.id,name:'IT / Quality verification',department:'IT',prefix:'CHECK',configuration:{routing:[{type:'COMPLAINT'}],services:[{id:'access',name:'Finance system access',type:'ACCESS_REQUEST',fields:[{key:'system',label:'System',type:'text',required:true}],approval:false}]}}});
  for(const u of users.filter(u=>u.kind!=='requester'))await tx.serviceQueueMember.create({data:{organisationId:org.id,queueId:queue.id,userId:u.id}});
  await tx.warehouse.create({data:{organisationId:org.id,name:'Synthetic returns warehouse',code:'CHECK'}});
  for(const subjectType of ['AR_CREDIT','SERVICE_RECOVERY','SERVICE_TICKET'])await tx.approvalPolicy.create({data:{organisationId:org.id,subjectType,name:'Synthetic independent approval',currency:'GBP',minAmount:0n,conditions:{},stages:[[approver.id]]}});
  return {orgId:org.id,slug:org.slug,password,users,partyId:party.id,contactId:contact.id,productId:product.id,orderId:order.id,lineId:order.lines[0].id,shipmentId:shipment.id,invoiceId:invoice.id,invoiceLineId:invoice.lines[0].id,queueId:queue.id};
  },{timeout:30000});
  await writeFile(stateFile,JSON.stringify(state),{mode:0o600,flag:'wx'});
  console.log('Synthetic company and three isolated profiles created. Credentials are in the private server fixture file.');
 }else{
  const s=JSON.parse(await readFile(stateFile,'utf8'));
  assert(s.slug.startsWith('service-release-check-'));
  const org=await db.organisation.findFirstOrThrow({where:{id:s.orgId,slug:s.slug}});
  if(mode==='verify'){
   const agent=s.users.find((u:{kind:string})=>u.kind==='agent');
   const auth=await call(null,'src/core/auth/actions:loginAction',[form({email:agent.email,password:s.password})]);assert(auth.cookie,'Normal sign-in cookie missing');const cookie=auth.cookie;
   const created=await ok(cookie,'src/modules/service/services/commands:createCase',{partyId:s.partyId,contactId:s.contactId,subject:'Synthetic damaged pipes acceptance',description:'250 of 4000 delivered pipes damaged.',type:'COMPLAINT',category:'Product Damage',salesOrderId:s.orderId,salesOrderLineId:s.lineId,productId:s.productId,shipmentId:s.shipmentId,affectedQuantity:250});
   const caseId=created.redirect.split('/').at(-1);let c=await db.serviceCase.findUniqueOrThrow({where:{id:caseId}});assert.equal(c.ownerUserId,agent.id);assert.equal((c.context as {affectedQuantity:number}).affectedQuantity,250);assert(c.firstResponseDueAt&&c.resolutionDueAt);
   const query=await ok(cookie,'src/core/service-work/actions:createWork',{kind:'QUERY',parentCaseId:caseId,queueId:s.queueId,subject:'Quality inspection',description:'Check damaged pipes.'});const workId=query.redirect.split('/').at(-1);
   c=await db.serviceCase.findUniqueOrThrow({where:{id:caseId}});assert.equal(c.ownerUserId,agent.id);
   const blocked=await call(cookie,'src/modules/service/services/commands:transitionCase',[form({caseId,version:c.version,status:'RESOLVED',resolutionCode:'CREDIT_ISSUED',resolutionSummary:'Synthetic conclusion'})]);assert.equal(blocked.status,400);assert.match(blocked.body.error,/dependencies/);
   const work=await db.serviceWorkItem.findUniqueOrThrow({where:{id:workId}});await ok(cookie,'src/core/service-work/actions:updateWork',{workId,version:work.version,status:'RESOLVED',reason:'Synthetic investigation complete'});
   c=await db.serviceCase.findUniqueOrThrow({where:{id:caseId}});await ok(cookie,'src/modules/service/services/commands:askFinanceForCredit',{caseId,version:c.version,invoiceId:s.invoiceId,lineId:s.invoiceLineId,creditQuantity:250,reason:'250 damaged pipes',requestKey:'synthetic-'+caseId});
   const credit=await db.financeDocument.findFirstOrThrow({where:{organisationId:org.id,kind:'AR_CREDIT'}});assert.equal(credit.net,25000n);assert.equal(credit.tax,5000n);assert.equal(credit.status,'DRAFT');assert.equal((await db.financeDocument.findUniqueOrThrow({where:{id:s.invoiceId}})).settled,0n);
   const ticket=await ok(cookie,'src/core/service-work/actions:createWork',{kind:'TICKET',queueId:s.queueId,serviceId:'access',answers:JSON.stringify({system:'Finance'}),subject:'Cannot access Finance system',description:'Synthetic access investigation.'});
   s.caseId=caseId;s.queryId=workId;s.creditId=credit.id;s.ticketId=ticket.redirect.split('/').at(-1);await writeFile(stateFile,JSON.stringify(s),{mode:0o600});
   console.log('PASS: live authenticated API case purchase/delivery/250 quantity, business deadlines, case ownership, query dependency/resolution, proportional draft credit without posting, and dynamic-form ticket. Fixture retained for signed-in browser verification.');
  }else if(mode==='extended'){
   assert(s.caseId&&s.ticketId&&s.creditId,'Run verify first.');
   const agent=s.users.find((u:{kind:string})=>u.kind==='agent'),approver=s.users.find((u:{kind:string})=>u.kind==='approver'),requester=s.users.find((u:{kind:string})=>u.kind==='requester');
   const agentMembership=await db.membership.findUniqueOrThrow({where:{id:agent.membershipId}});await db.membership.update({where:{id:agentMembership.id},data:{grantedCapabilities:[...new Set([...agentMembership.grantedCapabilities,'sales.order.create'])]}});
   const login=async(email:string)=>{const r=await call(null,'src/core/auth/actions:loginAction',[form({email,password:s.password})]);assert(r.cookie);return r.cookie;};
   const agentCookie=await login(agent.email), approverCookie=await login(approver.email), requesterCookie=await login(requester.email);
   const raw=async(cookie:string,key:string,args:unknown[])=>{const r=await call(cookie,key,args);assert.equal(r.status,200,JSON.stringify(r.body));return r.body.value;};
   const fail=async(cookie:string,key:string,args:unknown[],message:RegExp)=>{const r=await call(cookie,key,args);assert(r.status>=400,JSON.stringify(r.body));assert.match(r.body.error,message);};
   const currentCase=()=>db.serviceCase.findUniqueOrThrow({where:{id:s.caseId}});
   const currentTicket=()=>db.serviceWorkItem.findUniqueOrThrow({where:{id:s.ticketId}});
   assert.equal(((await db.serviceWorkItem.findUniqueOrThrow({where:{id:s.queryId}})).context as {origin:{affectedQuantity:number}}).origin.affectedQuantity,250);
   // Configure only this isolated fixture's books and posting capability.
   if((await db.financeDocument.findUniqueOrThrow({where:{id:s.creditId}})).status!=='POSTED'){
   const sourceInvoice=await db.financeDocument.findUniqueOrThrow({where:{id:s.invoiceId}});
   await db.financeAccount.createMany({data:[['1100','Receivables','ASSET','AR'],['2100','VAT output','LIABILITY','VAT_OUTPUT'],['4000','Revenue','REVENUE','REVENUE']].map(([code,name,type,control])=>({organisationId:org.id,entityId:sourceInvoice.entityId,code,name,type,control})),skipDuplicates:true});
   await db.financePeriod.create({data:{organisationId:org.id,entityId:sourceInvoice.entityId,name:'Synthetic 2026',startAt:new Date('2026-01-01'),endAt:new Date('2026-12-31T23:59:59Z')}});
   const member=await db.membership.findUniqueOrThrow({where:{id:agent.membershipId}});await db.membership.update({where:{id:member.id},data:{grantedCapabilities:[...member.grantedCapabilities,'finance.journal.post']}});
   const postingCookie=await login(agent.email);
   await fail(postingCookie,'src/modules/finance/services/commands:postFinanceDocument',[s.creditId],/record|found|document/i);
   await raw(agentCookie,'src/modules/finance/services/commands:raiseServiceCredit',[s.creditId]);
   let credit=await db.financeDocument.findUniqueOrThrow({where:{id:s.creditId}});assert.equal(credit.status,'AWAITING_APPROVAL');assert.equal((await db.financeDocument.findUniqueOrThrow({where:{id:s.invoiceId}})).settled,0n);
   const approval=await db.approvalInstance.findFirstOrThrow({where:{organisationId:org.id,subjectId:s.creditId,status:'PENDING'}});
   await fail(agentCookie,'src/modules/finance/services/commands:decideFinanceApproval',[approval.id,form({decision:'APPROVED',reason:'Self approval attempt'})],/own|independent|separation|creator/i);
   await raw(approverCookie,'src/modules/finance/services/commands:decideFinanceApproval',[approval.id,form({decision:'APPROVED',reason:'Synthetic independent line and tax check'})]);
   assert.equal((await db.financeDocument.findUniqueOrThrow({where:{id:s.creditId}})).status,'APPROVED');
   await raw(postingCookie,'src/modules/finance/services/commands:postFinanceDocument',[s.creditId]);
   credit=await db.financeDocument.findUniqueOrThrow({where:{id:s.creditId}});assert.equal(credit.status,'POSTED');assert.equal((await db.financeDocument.findUniqueOrThrow({where:{id:s.invoiceId}})).settled,30000n);
   const journal=await db.financeJournal.findUniqueOrThrow({where:{id:credit.journalId!},include:{lines:true}});assert.equal(journal.lines.reduce((n,l)=>n+l.debit-l.credit,0n),0n);
   }
   await db.serviceWorkItem.update({where:{id:s.ticketId},data:{requesterUserId:requester.id}});
   // The receiving team's internal notes remain private from requesters.
   let ticket=await currentTicket();await fail(requesterCookie,'src/core/service-work/actions:commentWork',[form({workId:s.ticketId,version:ticket.version,body:'Should not become a team note',visibility:'INTERNAL'})],/receiving team/);
   const evidence=await call(agentCookie,'src/core/service-work/file-actions:attachServiceFile',[{__atlas:'form',entries:[['caseId',s.caseId],['file',{__atlas:'file',name:'synthetic-evidence.png',type:'image/png',value:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6z8AAAAASUVORK5CYII='}]]}]);assert.equal(evidence.status,200,JSON.stringify(evidence.body));
   const attachment=await db.serviceFile.findFirstOrThrow({where:{organisationId:org.id,caseId:s.caseId}});const download=await fetch(endpoint+'/api/service-files/'+attachment.id,{headers:{Cookie:agentCookie}});assert.equal(download.status,200);assert.equal(download.headers.get('content-type'),'image/png');assert.equal((await download.arrayBuffer()).byteLength,attachment.size);assert.equal((await fetch(endpoint+'/api/service-files/'+attachment.id,{headers:{Cookie:requesterCookie}})).status,404);
   ticket=await currentTicket();if(ticket.reopenCount===0){await ok(agentCookie,'src/core/service-work/actions:requestWorkApproval',{workId:ticket.id,version:ticket.version});ticket=await currentTicket();await fail(agentCookie,'src/core/service-work/actions:decideWorkApproval',[form({workId:ticket.id,version:ticket.version,decision:'APPROVED',reason:'Self approval attempt'})],/own/);await ok(approverCookie,'src/core/service-work/actions:decideWorkApproval',{workId:ticket.id,version:ticket.version,decision:'APPROVED',reason:'Synthetic independent access approval'});
   ticket=await currentTicket();await ok(agentCookie,'src/core/service-work/actions:updateWork',{workId:ticket.id,version:ticket.version,status:'RESOLVED',reason:'Synthetic access restored'});ticket=await currentTicket();await ok(agentCookie,'src/core/service-work/actions:updateWork',{workId:ticket.id,version:ticket.version,status:'IN_PROGRESS',reason:'Synthetic follow-up needed'});assert.equal((await currentTicket()).reopenCount,1);}
   const remedy=async(moduleId:string)=>{const c=await currentCase();await ok(agentCookie,'src/modules/service/services/commands:createCaseRemedy',{caseId:c.id,version:c.version,moduleId,requestKey:'synthetic-'+moduleId+'-'+c.id});};
   await remedy('logistics');const rma=await db.returnAuthorisation.findFirstOrThrow({where:{organisationId:org.id},include:{lines:true}});assert.equal(rma.lines[0].quantity,250);if(rma.lines[0].receivedQuantity===0){assert.equal(await db.stockPosition.count({where:{organisationId:org.id}}),0);
   await raw(agentCookie,'src/app/(app)/logistics/actions:authoriseReturnAction',[rma.id,true]);const receiveArgs=[rma.lines[0].id,form({quantity:250,condition:'DAMAGED',requestKey:'synthetic-receipt'})];await raw(agentCookie,'src/app/(app)/logistics/actions:receiveReturnAction',receiveArgs);await raw(agentCookie,'src/app/(app)/logistics/actions:receiveReturnAction',receiveArgs);assert.equal((await db.returnLine.findUniqueOrThrow({where:{id:rma.lines[0].id}})).receivedQuantity,250);const balances=await db.stockPosition.findMany({where:{organisationId:org.id,status:'QUARANTINE'}});assert.equal(balances.reduce((n,b)=>n+b.quantity,0),250);await fail(agentCookie,'src/app/(app)/logistics/actions:receiveReturnAction',[rma.lines[0].id,form({quantity:1,condition:'DAMAGED',requestKey:'synthetic-over-receipt'})],/exceeds/);}
   await remedy('sales');await remedy('quality');const replacement=await db.salesOrder.findFirstOrThrow({where:{organisationId:org.id,commercialStatus:'DRAFT'}});assert.equal(await db.nonConformance.count({where:{organisationId:org.id}}),1);
   await ok(agentCookie,'src/modules/service/services/recovery:proposeRecovery',{caseId:s.caseId,type:'PERCENT',value:1.5,maximum:20,minimumOrder:10,currency:'GBP',usageLimit:1,expiresAt:'2027-10-07',reason:'Synthetic next-order recovery'});let benefit=await db.serviceRecovery.findFirstOrThrow({where:{organisationId:org.id}});await fail(agentCookie,'src/modules/service/services/recovery:decideRecovery',[form({recoveryId:benefit.id,version:benefit.version,decision:'APPROVED',reason:'Self approval attempt'})],/own/);await ok(approverCookie,'src/modules/service/services/recovery:decideRecovery',{recoveryId:benefit.id,version:benefit.version,decision:'APPROVED',reason:'Synthetic capped recovery approval'});await ok(agentCookie,'src/modules/sales/services/recovery:redeemServiceRecovery',{orderId:replacement.id,recoveryId:benefit.id});await ok(agentCookie,'src/modules/sales/services/recovery:redeemServiceRecovery',{orderId:replacement.id,recoveryId:benefit.id});benefit=await db.serviceRecovery.findUniqueOrThrow({where:{id:benefit.id}});assert.equal(benefit.usedCount,1);assert.equal(await db.serviceRedemption.count({where:{organisationId:org.id}}),1);assert.equal((await db.product.findUniqueOrThrow({where:{id:s.productId}})).basePriceAmount,100);
   await db.csatSurvey.create({data:{organisationId:org.id,name:'Synthetic support feedback',question:'How was the resolution?',context:'SUPPORT',createdBy:agent.id,reasons:['Resolution']}});
   let c=await currentCase();await ok(agentCookie,'src/modules/service/services/commands:transitionCase',{caseId:c.id,version:c.version,status:'RESOLVED',resolutionCode:'CREDIT_ISSUED',resolutionSummary:'Synthetic proportional credit approved and posted; recovery offered'});const survey=await db.csatResponse.findFirstOrThrow({where:{organisationId:org.id,entityId:s.caseId}});assert(survey.deliveryStatus==='FAILED'||survey.deliveryStatus==='QUEUED');await raw(agentCookie,'src/modules/csat/services/actions:recordCsatScore',[survey.token,2]);await raw(agentCookie,'src/modules/csat/services/actions:recordCsatScore',[survey.token,5]);await raw(agentCookie,'src/modules/csat/services/actions:recordCsatComment',[survey.token,'Synthetic feedback',['Resolution']]);await raw(agentCookie,'src/modules/csat/services/actions:recordCsatComment',[survey.token,'Changed feedback',[]]);const response=await db.csatResponse.findUniqueOrThrow({where:{id:survey.id}});assert.equal(response.score,2);assert.equal(response.comment,'Synthetic feedback');assert.equal(await db.serviceEntry.count({where:{organisationId:org.id,caseId:s.caseId,kind:'CSAT_RECOVERY_NEEDED'}}),1);
   c=await currentCase();await ok(agentCookie,'src/modules/service/services/commands:transitionCase',{caseId:c.id,version:c.version,status:'OPEN',reason:'Synthetic follow-up after customer feedback'});assert.equal((await currentCase()).reopenCount,1);
   s.extendedVerified=true;s.rmaId=rma.id;s.replacementId=replacement.id;s.recoveryId=benefit.id;s.surveyId=survey.id;await writeFile(stateFile,JSON.stringify(s),{mode:0o600});
   console.log('PASS: independent Finance approval and balanced posting, self-approval rejection, evidence download/privacy, ticket approval/reopen, RMA/quarantine exact replay and over-receipt guard, replacement/NCR, approved capped recovery/idempotent redemption, unchanged price list, resolution CSAT score/comment immutability and low-score follow-up, case reopen.');
  }else if(mode==='cleanup'){
   // Posted financial and audit records are immutable. Retire this synthetic tenant
   // and revoke all fixture sessions while retaining its acceptance evidence.
   await db.$transaction(async tx=>{
    await tx.membership.updateMany({where:{organisationId:org.id},data:{active:false}});
    await tx.organisation.update({where:{id:org.id},data:{status:'SUSPENDED',name:'Archived service release verification'}});
   });await unlink(stateFile);console.log('Synthetic company archived, all test profiles revoked and temporary credentials removed. Immutable acceptance records retained.');
  }else throw Error('Use setup, verify, extended or cleanup.');
 }
}finally{await db.$disconnect();}
