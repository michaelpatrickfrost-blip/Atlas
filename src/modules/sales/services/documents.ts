"use server";
import {projectScope} from '@/core/permissions/work-access';
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import {hierarchyAccountIds} from "@/core/customers/hierarchy";
import { resolvePrice } from "@/core/pricing/resolve-price";
import { resolveStandardUkVat } from "./tax-check";
import { parseHeaderDiscount, settleSale } from "../domain/uk-sale";
import { z } from "zod";
import { documentLinesSchema,parseTags } from "./document-lines";
import { readExportHeader } from "../domain/invoice-templates";
import { syncOrderProforma } from "./proforma";
import { assertCallOffCapacity, callOffPrice, loadAgreement, lockAgreement } from "./call-off-balance";
import { openCustomerProject } from "@/modules/projects/services/open-project";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function saveDocument(_previous:{error:string},form:FormData):Promise<{error:string}> {
 const session=await requireSession();
 assertCapability(session,form.get('mode')==='quote'?'sales.quote.create':form.get('documentId')?'sales.order.edit_draft':'sales.order.create');
 await assertModuleEnabled(session,'sales');
 const mode=String(form.get('mode'));
 if(!['quote','order'].includes(mode))return {error:'Invalid document type.'};
 let destination='';
 try {
 const documentId=String(form.get('documentId')??''),expectedVersion=String(form.get('version')??'');
 const existingQuote=documentId&&mode==='quote'?await db.quote.findFirstOrThrow({where:{id:documentId,organisationId:session.organisationId},include:{lines:true,salesOrder:true}}):null;
 const existingOrder=documentId&&mode==='order'?await db.salesOrder.findFirstOrThrow({where:{id:documentId,organisationId:session.organisationId},include:{lines:true}}):null;
 if(existingQuote&&(existingQuote.status!=='DRAFT'||existingQuote.salesOrder))throw new Error('Only an unconverted draft quotation can be edited.');
 if(existingOrder&&existingOrder.commercialStatus!=='DRAFT')throw new Error('Only draft orders can be edited.');
 if(documentId&&!expectedVersion)throw new Error('Reload this document before saving.');
 const partyId=String(form.get('partyId')),customer=await db.party.findFirstOrThrow({where:{id:partyId,organisationId:session.organisationId},include:{children:true,commercialSettings:true}});
 const pricingPartyId=String(form.get('pricingPartyId')??'')||null;
 const priceListId=String(form.get('priceListId')??'')||null,paymentTermId=String(form.get('paymentTermId')??'')||null,opportunityId=String(form.get('opportunityId')??'')||null,projectId=String(form.get('projectId')??'')||null,agreementId=String(form.get('agreementId')??'')||null,newProjectName=String(form.get('newProjectName')??'').trim().slice(0,200);
 const quoteKind=form.get('quoteKind')==='BLANKET'?'BLANKET' as const:'STANDARD' as const,requestedType=String(form.get('orderType')??'STANDARD');
 if(mode==='order'&&!['STANDARD','PROJECT','CALL_OFF'].includes(requestedType))return {error:'Choose a standard, project or call-off order.'};
 if(mode==='order'&&requestedType==='CALL_OFF'&&!agreementId)return {error:'Choose the call-off agreement.'};
 const list=priceListId?await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:session.organisationId}}):null;
 if(paymentTermId)await db.paymentTerm.findFirstOrThrow({where:{id:paymentTermId,organisationId:session.organisationId}});
 if(opportunityId)await db.opportunity.findFirstOrThrow({where:{id:opportunityId,partyId:{in:[partyId,...(pricingPartyId?[pricingPartyId]:[])]},organisationId:session.organisationId}});
 const salesProjectId=String(form.get('salesProjectId')??'')||null;
 if(salesProjectId&&!(await db.salesProject.findFirst({where:{id:salesProjectId,organisationId:session.organisationId},select:{id:true}})))return {error:'Choose a sales project from your list.'};
 const salesProjectField=form.has('salesProjectId')?{salesProjectId}:{};
 const project=projectId?await db.project.findFirstOrThrow({where:{AND:[projectScope(session),{id:projectId,partyId:{in:[partyId,...(pricingPartyId?[pricingPartyId]:[])]}}]}}):null;
 const agreement=mode==='order'&&agreementId?await loadAgreement(db,session.organisationId,agreementId):null;
 if(pricingPartyId&&pricingPartyId!==partyId){const link=await db.customerTradingLink.findFirst({where:{organisationId:session.organisationId,accountId:pricingPartyId,tradingAccountId:partyId,active:true,account:{organisationId:session.organisationId},tradingAccount:{organisationId:session.organisationId}}});if(!link){await db.party.findFirstOrThrow({where:{id:pricingPartyId,organisationId:session.organisationId}});const {linkOrderedFor}=await import('./delivery-address');await linkOrderedFor(session.organisationId,session.userId,pricingPartyId,partyId);}}
 const pricingCustomer=pricingPartyId?await db.party.findFirstOrThrow({where:{id:pricingPartyId,organisationId:session.organisationId}}):customer;
 const accounts=await db.party.findMany({where:{organisationId:session.organisationId},select:{id:true,parentPartyId:true}}),billingAccounts=hierarchyAccountIds(accounts,partyId),related=[...billingAccounts,...hierarchyAccountIds(accounts,pricingPartyId??partyId)];
 const addresses=await db.address.findMany({where:{partyId:{in:related},active:true,party:{organisationId:session.organisationId}}});
 const paperworkId=String(form.get('invoiceAssignmentId')??''),paperwork=paperworkId?await db.customerInvoiceTemplate.findFirst({where:{id:paperworkId,organisationId:session.organisationId,partyId},select:{invoiceAddressId:true,deliveryAddressId:true}}):null;
 function snapshot(field:string,billing:boolean){const id=String(form.get(field)??'');if(!id)return undefined;const a=addresses.find(a=>a.id===id&&(!billing||billingAccounts.includes(a.partyId))&&(billing?a.type==='BILLING'||a.isDefaultBilling||id===paperwork?.invoiceAddressId:a.type==='DELIVERY'||a.isDefaultDelivery||id===paperwork?.deliveryAddressId));if(!a)throw new Error('Choose addresses from this customer hierarchy.');return {addressId:a.id,partyId:a.partyId,label:a.label,line1:a.line1,line2:a.line2,city:a.city,region:a.region,postcode:a.postcode,country:a.country};}
 const invoiceAddressSnapshot=snapshot('invoiceAddressId',true),deliveryAddressSnapshot=snapshot('deliveryAddressId',false),currency=list?.currency??pricingCustomer.preferredCurrency;
 const assignmentId=String(form.get('invoiceAssignmentId')??'')||null,header=readExportHeader(Object.fromEntries(form.entries()));
 const notifyId=String(form.get('notifyAddressId')??''),notifyAddress=notifyId?addresses.find(a=>a.id===notifyId&&related.includes(a.partyId)):undefined;if(notifyId&&!notifyAddress)throw new Error('Choose the notify party from this customer account.');
 const notifySnapshot=notifyAddress?{addressId:notifyAddress.id,partyId:notifyAddress.partyId,label:notifyAddress.label,line1:notifyAddress.line1,line2:notifyAddress.line2,city:notifyAddress.city,region:notifyAddress.region,postcode:notifyAddress.postcode,country:notifyAddress.country}:null;
 const hasDate=form.has('documentDate'),requestedDate=hasDate?String(form.get('documentDate')??''):'',parsedDate=requestedDate?new Date(requestedDate):null;if(parsedDate&&isNaN(parsedDate.getTime()))throw new Error('Choose a valid date.');const date=hasDate?parsedDate:mode==='order'?existingOrder?.requestedDeliveryDate??null:existingQuote?.expiryDate??null;const hasPromised=form.has('promisedDeliveryDate'),promisedRaw=hasPromised?String(form.get('promisedDeliveryDate')??''):'',promisedDeliveryDate=hasPromised?promisedRaw?new Date(promisedRaw):null:existingOrder?.promisedDeliveryDate??null;if(promisedDeliveryDate&&isNaN(promisedDeliveryDate.getTime()))throw new Error('Choose a valid promised delivery date.');
 const inputs=documentLinesSchema.parse(JSON.parse(String(form.get('lines'))));
 const products=await db.product.findMany({where:{organisationId:session.organisationId,id:{in:inputs.map(l=>l.productId)},active:true}});
 const priceDecisions:{lineNumber:number;calculatedPrice:number;agreedPrice:number;source:string;reason:string|null}[]=[];
 const lines=await Promise.all(inputs.map(async(line,index)=>{
  if(mode==='order'&&line.optional)throw new Error('Optional products must be selected before creating an order.');
  if(line.type==='TEXT'){
   const saved=existingQuote?.lines.find(l=>l.id===line.id&&!l.productId),savedOrder=existingOrder?.lines.find(l=>l.id===line.id&&!l.productId),unchanged=(existingQuote?.partyId===partyId&&existingQuote.pricingPartyId===pricingPartyId&&saved?.unitAmount===line.unitAmount)||(existingOrder?.partyId===partyId&&existingOrder.pricingPartyId===pricingPartyId&&savedOrder?.unitPriceAmount===line.unitAmount);
   if(line.unitAmount==null)throw new Error('Enter a price for custom lines.');if(!unchanged){assertCapability(session,mode==='quote'?'sales.quote.approve':'sales.order.price_override');if(!line.overrideReason?.trim())throw new Error('Enter a reason for the custom line price.');}
   const netAmount=Math.round(line.unitAmount*line.quantity*(1-line.discount/100)),tax=await resolveStandardUkVat({sellingOrganisationId:session.organisationId,partyId,deliveryCountry:deliveryAddressSnapshot?.country??null,productTaxCategory:'STANDARD',transactionDate:new Date(),netAmount});
   return {lineNumber:index+1,productId:null,descriptionSnapshot:line.description,type:'TEXT' as const,optional:line.optional,unitOfMeasure:'each',orderedQuantity:line.quantity,unitPriceAmount:line.unitAmount,discountPercent:line.discount,netAmount,taxAmount:tax.amount,taxCategory:'STANDARD',priceSource:'Custom line price',invoiceWhenInStock:false};
  }
  if(line.type!=='PRODUCT')return {lineNumber:index+1,productId:null,descriptionSnapshot:line.description.trim(),type:line.type,optional:false,unitOfMeasure:'each',orderedQuantity:1,unitPriceAmount:0,discountPercent:0,netAmount:0,taxAmount:0,taxCategory:null,priceSource:null,invoiceWhenInStock:false};
  if(mode==='order'&&line.optional)throw new Error('Optional products must be selected before creating an order.');
  const product=products.find(p=>p.id===line.productId);if(!product)throw new Error('A selected product is unavailable.');
  if(agreement){if(line.discount)throw new Error('Call-off orders use the agreed price.');const agreed=callOffPrice(agreement.lines,{agreementLineId:line.agreementLineId,productId:product.id,description:line.description},agreement.reference);const netAmount=Math.round(agreed.unitPriceAmount*line.quantity);const tax=await resolveStandardUkVat({sellingOrganisationId:session.organisationId,partyId,deliveryCountry:deliveryAddressSnapshot?.country??null,productTaxCategory:product.taxCategory,transactionDate:new Date(),netAmount});priceDecisions.push({lineNumber:index+1,calculatedPrice:agreed.unitPriceAmount,agreedPrice:agreed.unitPriceAmount,source:agreed.priceSource,reason:null});return {lineNumber:index+1,productId:product.id,descriptionSnapshot:line.description.trim()||agreed.label,optional:false,unitOfMeasure:product.unitOfMeasure,type:product.kind==='SERVICE'?'SERVICE' as const:product.kind==='CHARGE'?'CHARGE' as const:'PRODUCT' as const,orderedQuantity:line.quantity,unitPriceAmount:agreed.unitPriceAmount,discountPercent:0,netAmount,taxAmount:tax.amount,taxCategory:product.taxCategory,priceSource:agreed.priceSource,agreementLineId:agreed.agreementLineId,invoiceWhenInStock:false};}
  const price=await resolvePrice({organisationId:session.organisationId,partyId:pricingPartyId??partyId,productId:product.id,quantity:line.quantity,priceListId});
  if(price.currency!==currency)throw new Error(`Price for ${product.code} uses ${price.currency}; choose a ${currency} pricelist rule.`);
  let unitPriceAmount=price.unitPriceAmount,priceSource=price.source;
  if(line.unitAmount!=null){const saved=existingQuote?.lines.find(l=>l.id===line.id&&l.productId===line.productId),savedOrder=existingOrder?.lines.find(l=>l.id===line.id&&l.productId===line.productId);const unchanged=(existingQuote?.partyId===partyId&&existingQuote.pricingPartyId===pricingPartyId&&saved?.unitAmount===line.unitAmount)||(existingOrder?.partyId===partyId&&existingOrder.pricingPartyId===pricingPartyId&&savedOrder?.unitPriceAmount===line.unitAmount);if(!unchanged&&line.unitAmount!==price.unitPriceAmount){assertCapability(session,mode==='quote'?'sales.quote.approve':'sales.order.price_override');if(!line.overrideReason?.trim())throw new Error('Enter a reason for each manual price override.');}unitPriceAmount=line.unitAmount;priceSource=unchanged?(saved?.priceSource??savedOrder?.priceSource??'Saved document price'):line.unitAmount===price.unitPriceAmount?price.source:'Manual price';}
  priceDecisions.push({lineNumber:index+1,calculatedPrice:price.unitPriceAmount,agreedPrice:unitPriceAmount,source:price.source,reason:line.overrideReason?.trim()??null});
  const netAmount=Math.round(unitPriceAmount*line.quantity*(1-line.discount/100));
  const tax=await resolveStandardUkVat({sellingOrganisationId:session.organisationId,partyId,deliveryCountry:deliveryAddressSnapshot?.country??null,productTaxCategory:product.taxCategory,transactionDate:new Date(),netAmount});
  return {lineNumber:index+1,productId:product.id,descriptionSnapshot:line.description.trim()||product.name,optional:line.optional,unitOfMeasure:product.unitOfMeasure,type:product.kind==='SERVICE'?'SERVICE' as const:product.kind==='CHARGE'?'CHARGE' as const:'PRODUCT' as const,orderedQuantity:line.quantity,unitPriceAmount,discountPercent:line.discount,netAmount,taxAmount:tax.amount,taxCategory:product.taxCategory,priceSource,invoiceWhenInStock:line.invoiceWhenInStock===true};
 }));
 const headerDiscountPercent=parseHeaderDiscount(form.get('headerDiscountPercent'));
 const billable=lines.filter(l=>!l.optional&&!['SECTION','NOTE'].includes(l.type));
 const settlement=settleSale(billable.map(l=>({net:l.netAmount,taxCategory:l.taxCategory})),headerDiscountPercent,deliveryAddressSnapshot?.country??null);
 billable.forEach((line,index)=>{line.netAmount=settlement.lines[index].net;line.taxAmount=settlement.lines[index].tax;});
 for(const line of lines)if(!Number.isSafeInteger(line.netAmount+line.taxAmount)||line.netAmount+line.taxAmount>2147483647)throw new Error('A line total is too large.');
 const included=lines.filter(l=>!l.optional),netAmount=included.reduce((s,l)=>s+l.netAmount,0),taxAmount=included.reduce((s,l)=>s+l.taxAmount,0),grossAmount=netAmount+taxAmount;
 if(!Number.isSafeInteger(grossAmount)||grossAmount>2147483647)throw new Error('Document total is too large.');
 const tags=parseTags(String(form.get('tags')??'')),externalReference=String(form.get('externalReference')??'').trim().slice(0,150);
 const customerPoReference=(form.has('customerPoReference')?String(form.get('customerPoReference')??''):mode==='quote'?existingQuote?.customerPoReference??'':existingOrder?.customerPoReference??'').slice(0,150),notes=String(form.get('notes')??'').slice(0,5000),organisationId=session.organisationId;
 const deliveryInstructions=String(form.get('deliveryInstructions')??'').slice(0,5000),financeInstructions=String(form.get('financeInstructions')??'').slice(0,5000);
 const workingDraftId=String(form.get('workingDraftId')??'');
 const id=await db.$transaction(async tx=>{
  if(pricingPartyId&&pricingPartyId!==partyId&&!await tx.customerTradingLink.count({where:{organisationId,accountId:pricingPartyId,tradingAccountId:partyId,active:true}}))throw new Error('This trading relationship has changed. Review the customer accounts.');
  let linked=project;
  if(!linked&&newProjectName){assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');linked=await openCustomerProject(tx,session,{name:newProjectName,partyId,opportunityId});}
  if(agreement?.projectId&&linked&&linked.id!==agreement.projectId)throw new Error('This call-off agreement already has its own project.');
  if(agreement?.projectId&&!linked)linked=await tx.project.findFirstOrThrow({where:{id:agreement.projectId,organisationId}});
  if(linked&&opportunityId&&linked.opportunityId&&linked.opportunityId!==opportunityId)throw new Error('This project already belongs to another opportunity.');
  if(linked&&opportunityId&&!linked.opportunityId){await tx.project.update({where:{id:linked.id,organisationId},data:{opportunityId}});linked={...linked,opportunityId};}
  const linkedProjectId=linked?.id??null;
  if(workingDraftId)await tx.salesWorkingDraft.updateMany({where:{id:workingDraftId,organisationId,ownerUserId:session.userId},data:{archived:true}});
  if(mode==='quote') {
   const quoteLines=lines.map(l=>({lineNumber:l.lineNumber,type:l.type,optional:l.optional,unitOfMeasure:l.unitOfMeasure,taxCategory:l.taxCategory,priceSource:l.priceSource,productId:l.productId,description:l.descriptionSnapshot,quantity:l.orderedQuantity,unitAmount:l.unitPriceAmount,currency,discountPercent:l.discountPercent,netAmount:l.netAmount,taxAmount:l.taxAmount,invoiceWhenInStock:l.invoiceWhenInStock}));
   const fields={...salesProjectField,partyId,pricingPartyId,deliveryInstructions,financeInstructions,priceListId,paymentTermId,opportunityId,projectId:linkedProjectId,kind:quoteKind,expiryDate:date,customerPoReference,externalReference,tags,customerNotes:notes,netAmount,taxAmount,headerDiscountPercent,totalAmount:grossAmount,totalCurrency:currency,invoiceAddressSnapshot,deliveryAddressSnapshot,invoiceAssignmentId:assignmentId};
   let id:string;
   if(existingQuote){const changed=await tx.quote.updateMany({where:{id:existingQuote.id,organisationId,status:'DRAFT',updatedAt:new Date(expectedVersion)},data:{...fields,revision:{increment:1}}});if(changed.count!==1)throw new Error('This quotation changed in another window. Reload before saving.');await tx.quoteLine.deleteMany({where:{quoteId:existingQuote.id}});await tx.quoteLine.createMany({data:quoteLines.map(l=>({...l,quoteId:existingQuote.id}))});id=existingQuote.id;}
   else {const quote=await tx.quote.create({data:{...fields,organisationId,ownerUserId:session.userId,reference:`Q-${crypto.randomUUID().slice(0,8).toUpperCase()}`,lines:{create:quoteLines}}});id=quote.id;}
   await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:existingQuote?'quote.edited':'quote.created',entityType:'Quote',entityId:id,before:existingQuote?{lines:JSON.parse(JSON.stringify(existingQuote.lines))}:undefined,after:{grossAmount,tags,priceDecisions,lines:quoteLines}}});return id;
  }
  const orderType=agreement?'CALL_OFF' as const:linked?'PROJECT' as const:requestedType==='PROJECT'?'PROJECT' as const:'STANDARD' as const;
  if(orderType==='PROJECT'&&!linked)throw new Error('Choose or create the project for this order.');
  const orderLines=lines.map(({optional,...l})=>{void optional;return {...l,agreementLineId:agreement?l.agreementLineId??null:null};});
  if(agreement){await lockAgreement(tx,organisationId,agreement.id);await assertCallOffCapacity(tx,{organisationId,agreementId:agreement.id,partyId,pricingPartyId,currency,orderId:existingOrder?.id,lines:orderLines});}
  const fields={...salesProjectField,partyId,pricingPartyId,deliveryInstructions,financeInstructions,priceListId,paymentTermId,opportunityId,projectId:linkedProjectId,projectReference:linked?.reference??null,agreementId:agreement?.id??null,orderType,contractReference:agreement?.reference??null,customerPoReference,externalReference,tags,requestedDeliveryDate:date,promisedDeliveryDate,customerNotes:notes,allowPartialDelivery:customer.commercialSettings?.partialShipmentAllowed??true,currency,netAmount,taxAmount,grossAmount,headerDiscountPercent,discountAmount:included.reduce((s,l)=>s+l.unitPriceAmount*l.orderedQuantity-l.netAmount,0),invoiceAddressSnapshot,deliveryAddressSnapshot,invoiceAssignmentId:assignmentId,...(form.has('incoterms')||form.has('namedPlace')?{incoterms:header.incoterms,deliveryTerms:header.namedPlace}:{})};
  let id:string;
  if(existingOrder){const changed=await tx.salesOrder.updateMany({where:{id:existingOrder.id,organisationId,commercialStatus:'DRAFT',updatedAt:new Date(expectedVersion)},data:{...fields,revision:{increment:1}}});if(changed.count!==1)throw new Error('This order changed in another window. Reload before saving.');await tx.salesOrderLine.deleteMany({where:{orderId:existingOrder.id}});await tx.salesOrderLine.createMany({data:orderLines.map(l=>({...l,orderId:existingOrder.id}))});id=existingOrder.id;}
  else {const order=await tx.salesOrder.create({data:{...fields,organisationId,ownerUserId:session.userId,reference:`SO-${crypto.randomUUID().slice(0,8).toUpperCase()}`,lines:{create:orderLines}}});id=order.id;}
  await syncOrderProforma(tx,{organisationId,orderId:id,partyId,assignmentId,currency,customerPo:customerPoReference||null,paymentTermId,invoiceAddress:invoiceAddressSnapshot??null,deliveryAddress:deliveryAddressSnapshot??null,notifyAddress:notifySnapshot,header,lines:orderLines.map(l=>({type:l.type,description:l.descriptionSnapshot,productId:l.productId,quantity:l.orderedQuantity,unitAmount:l.unitPriceAmount,netAmount:l.netAmount}))});
  await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:existingOrder?'order.edited':'order.created',entityType:'SalesOrder',entityId:id,before:existingOrder?{lines:JSON.parse(JSON.stringify(existingOrder.lines))}:undefined,after:{grossAmount,tags,priceDecisions,lines:orderLines}}});return id;
 });
 destination=mode==='quote'?`/sales/quotes/${id}`:`/sales/orders/${id}`;
 if(salesProjectId){const {refreshSalesProjectValues}=await import('@/modules/crm/services/sales-project-values');await refreshSalesProjectValues(session.organisationId,salesProjectId);revalidatePath(`/crm/projects/${salesProjectId}`);}
 }catch(e){return {error:e instanceof z.ZodError?'Add at least one product with a positive whole quantity and valid discount.':e instanceof Error?e.message:'Could not save document.'};}
 revalidatePath('/sales/quotes');revalidatePath('/sales/orders');revalidatePath(destination);redirect(destination);
}
