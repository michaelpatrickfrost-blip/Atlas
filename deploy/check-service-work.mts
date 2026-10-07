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
  const org=await db.organisation.create({data:{name:'Service release verification',slug:'service-release-check-'+stamp}});
  const caps=['core.profile.self','core.apps.manage','customers.read','core.products.read','sales.order.read','sales.order.edit_draft','service.case.read','service.case.create','service.case.update','service.case.resolve','service.case.close','service.case.assign','service.case.approve','service.case.restricted','service.case.note','service.case.communication','service.ticket.read','service.ticket.create','service.ticket.update','service.queue.manage','tickets.ticket.read','tickets.ticket.create','tickets.ticket.manage','tickets.ticket.reply','tickets.ticket.watch','tickets.queue.read','tickets.queue.manage','finance.overview.read','finance.receivables.read','finance.receivables.manage','finance.approval.decide','finance.configure','logistics.shipment.read','logistics.return.read','logistics.return.authorise','logistics.receipt.execute','logistics.return.inspect','stock.read','quality.ncr.read','csat.read','csat.manage'];
  const users=[];
  for(const kind of ['agent','approver','requester']){
   const user=await db.user.create({data:{name:'Synthetic '+kind,email:`service-${stamp}-${kind}@example.invalid`,passwordHash:await bcrypt.hash(password,10)}});
   const membership=await db.membership.create({data:{organisationId:org.id,userId:user.id,grantedCapabilities:kind==='requester'?['core.profile.self','tickets.ticket.read','tickets.ticket.create','tickets.ticket.reply']:caps}});
   users.push({id:user.id,email:user.email,membershipId:membership.id,kind});
  }
  for(const moduleId of ['service','tickets','sales','finance','products','stock','logistics','quality','csat'])await db.moduleState.create({data:{organisationId:org.id,moduleId,enabled:true,entitled:true}});
  const [agent,approver]=users;
  const party=await db.party.create({data:{organisationId:org.id,kind:'COMPANY',name:'Synthetic pipe customer',customerCode:'CHECK-001',tags:[]}});
  const contact=await db.contact.create({data:{partyId:party.id,firstName:'Synthetic',surname:'Contact',email:`service-${stamp}-contact@example.invalid`}});
  const product=await db.product.create({data:{organisationId:org.id,code:'CHECK-PIPE',name:'Synthetic pipes',basePriceAmount:100,taxCategory:'STANDARD'}});
  const order=await db.salesOrder.create({data:{organisationId:org.id,partyId:party.id,reference:'SO-CHECK-001',ownerUserId:agent.id,commercialStatus:'CONFIRMED',customerPoReference:'PO-CHECK-001',currency:'GBP',netAmount:400000,taxAmount:80000,grossAmount:480000,lines:{create:{lineNumber:1,productId:product.id,descriptionSnapshot:'Synthetic pipes',orderedQuantity:4000,unitPriceAmount:100,netAmount:400000,taxAmount:80000,taxCategory:'STANDARD'}}},include:{lines:true}});
  const requirement=await db.fulfilmentRequirement.create({data:{organisationId:org.id,reference:'FUL-CHECK-001',sourceEventKey:'service-check-'+stamp,salesOrderId:order.id,partyId:party.id,shipTo:{country:'GB'}}});
  const fulfilment=await db.fulfilmentLine.create({data:{organisationId:org.id,requirementId:requirement.id,salesOrderLineId:order.lines[0].id,productId:product.id,description:'Synthetic pipes',orderedQuantity:4000,shippedQuantity:4000,deliveredQuantity:4000}});
  const shipment=await db.shipment.create({data:{organisationId:org.id,reference:'DEL-CHECK-001',partyId:party.id,shipTo:{country:'GB'},status:'DELIVERED',dispatchedAt:new Date(),deliveredAt:new Date(),onTime:true,inFull:true,sources:{create:{organisationId:org.id,salesOrderId:order.id,requirementId:requirement.id,fulfilmentLineId:fulfilment.id,quantity:4000}}}});
  const entity=await db.financeEntity.create({data:{organisationId:org.id,name:'Synthetic books',code:'CHECK'}});
  const invoice=await db.financeDocument.create({data:{organisationId:org.id,entityId:entity.id,kind:'AR_INVOICE',reference:'INV-CHECK-001',title:'Synthetic source invoice',status:'POSTED',creatorUserId:agent.id,partyId:party.id,salesOrderId:order.id,currency:'GBP',documentDate:new Date(),net:400000n,tax:80000n,gross:480000n,lines:{create:{number:1,productId:product.id,salesOrderLineId:order.lines[0].id,description:'Synthetic pipes',quantity:'4000',unitPrice:100n,net:400000n,tax:80000n,taxCode:'STANDARD',taxRateBps:2000}}},include:{lines:true}});
  const queue=await db.serviceQueue.create({data:{organisationId:org.id,name:'IT / Quality verification',department:'IT',prefix:'CHECK',members:{create:users.filter(u=>u.kind!=='requester').map(u=>({organisationId:org.id,userId:u.id}))},configuration:{routing:[{type:'COMPLAINT'}],services:[{id:'access',name:'Finance system access',type:'ACCESS_REQUEST',fields:[{key:'system',label:'System',type:'text',required:true}],approval:false}]}}});
  await db.warehouse.create({data:{organisationId:org.id,name:'Synthetic returns warehouse',code:'CHECK'}});
  for(const subjectType of ['AR_CREDIT','SERVICE_RECOVERY','SERVICE_TICKET'])await db.approvalPolicy.create({data:{organisationId:org.id,subjectType,name:'Synthetic independent approval',currency:'GBP',minAmount:0n,conditions:{},stages:[[approver.id]]}});
  const state={orgId:org.id,slug:org.slug,password,users,partyId:party.id,contactId:contact.id,productId:product.id,orderId:order.id,lineId:order.lines[0].id,shipmentId:shipment.id,invoiceId:invoice.id,invoiceLineId:invoice.lines[0].id,queueId:queue.id};
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
  }else if(mode==='cleanup'){
   await db.$transaction(async tx=>{
    const oid=org.id;
    for(const model of ['serviceRedemption','serviceFile','serviceWorkEntry','serviceLink','serviceEntry','serviceRecovery','serviceWorkItem','serviceTicket','serviceCase','serviceQueueMember','serviceQueue','serviceSequence','csatResponse','csatSurvey','approvalStep','approvalInstance','approvalPolicy','financeTimeline','financeDocumentLine'] as const)await (tx[model] as unknown as {deleteMany:(args:{where:{organisationId:string}})=>Promise<unknown>}).deleteMany({where:{organisationId:oid}});
    await tx.financeDocument.deleteMany({where:{organisationId:oid,kind:'AR_CREDIT'}});await tx.financeDocument.deleteMany({where:{organisationId:oid}});await tx.financeEntity.deleteMany({where:{organisationId:oid}});
    for(const model of ['returnLine','returnAuthorisation','shipmentSource','trackingEvent','shipment','fulfilmentLine','fulfilmentRequirement','stockPosition','stockSerial','stockLot','stockReservation','inventoryMovement','inventoryBalance','stockLocation','warehouse'] as const)await (tx[model] as unknown as {deleteMany:(args:{where:{organisationId:string}})=>Promise<unknown>}).deleteMany({where:{organisationId:oid}});
    await tx.salesOrder.deleteMany({where:{organisationId:oid}});await tx.contact.deleteMany({where:{partyId:s.partyId}});await tx.party.deleteMany({where:{organisationId:oid}});await tx.product.deleteMany({where:{organisationId:oid}});
    await tx.activity.deleteMany({where:{organisationId:oid}});await tx.auditEntry.deleteMany({where:{organisationId:oid}});await tx.domainOutbox.deleteMany({where:{organisationId:oid}});await tx.logisticsOperation.deleteMany({where:{organisationId:oid}});await tx.logisticsCounter.deleteMany({where:{organisationId:oid}});await tx.serviceKnowledge.deleteMany({where:{organisationId:oid}});
    await tx.organisation.delete({where:{id:oid}});await tx.user.deleteMany({where:{id:{in:s.users.map((u:{id:string})=>u.id)}}});
   },{timeout:30000});await unlink(stateFile);console.log('Synthetic company, profiles and test records removed.');
  }else throw Error('Use setup, verify or cleanup.');
 }
}finally{await db.$disconnect();}
