"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {resolvePrice} from "@/core/pricing/resolve-price";
import {resolveStandardUkVat} from "./tax-check";
import {documentLinesSchema,isExpired} from './document-lines';
import {emit,DOMAIN_EVENTS} from '@/core/events/bus';
import type {Prisma} from '@/generated/prisma/client';
const json=(value:unknown)=>value==null?undefined:value as Prisma.InputJsonValue;
export async function sendQuote(quoteId:string){
 const session=await requireSession();
 assertCapability(session,'sales.quote.create');
 await assertModuleEnabled(session,'sales');
 await db.$transaction(async tx=>{const quote=await tx.quote.findFirstOrThrow({where:{id:quoteId,organisationId:session.organisationId},include:{lines:true,salesOrder:true}});if(quote.status!=='DRAFT'||quote.salesOrder)throw new Error('Only draft quotations can be marked as sent.');if(isExpired(quote.expiryDate))throw new Error('This quotation has expired. Edit its validity date first.');if(!quote.lines.some(l=>!l.optional&&!['SECTION','NOTE'].includes(l.type)))throw new Error('Add an included product before sending.');const changed=await tx.quote.updateMany({where:{id:quote.id,organisationId:session.organisationId,status:'DRAFT',updatedAt:quote.updatedAt},data:{status:'SENT'}});if(changed.count!==1)throw new Error('This quotation changed. Reload it.');await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'quote.marked_sent',entityType:'Quote',entityId:quoteId}});});revalidatePath('/sales/quotes');revalidatePath(`/sales/quotes/${quoteId}`);
}
export async function changeQuoteStatus(quoteId:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'sales.quote.create');
 await assertModuleEnabled(session,'sales');
 const status=String(form.get('status'));if(!['DRAFT','DECLINED'].includes(status))throw new Error('Choose a valid quotation action.');
 await db.$transaction(async tx=>{const quote=await tx.quote.findFirstOrThrow({where:{id:quoteId,organisationId:session.organisationId},include:{salesOrder:true}});if(quote.salesOrder||quote.status==='ACCEPTED')throw new Error('An accepted quotation is locked. Duplicate it to prepare a new quotation.');const changed=await tx.quote.updateMany({where:{id:quote.id,organisationId:session.organisationId,updatedAt:quote.updatedAt},data:{status:status as 'DRAFT'|'DECLINED'}});if(changed.count!==1)throw new Error('This quotation changed. Reload it.');await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'quote.status_changed',entityType:'Quote',entityId:quoteId,before:{status:quote.status},after:{status}}});});revalidatePath(`/sales/quotes/${quoteId}`);revalidatePath('/sales/quotes');
}
export async function duplicateDocument(mode:'quote'|'order',id:string){
 const session=await requireSession();
 assertCapability(session,mode==='quote'?'sales.quote.create':'sales.order.create');
 await assertModuleEnabled(session,'sales');
 const organisationId=session.organisationId;
 const result=await db.$transaction(async tx=>{
 if(mode==='quote'){const q=await tx.quote.findFirstOrThrow({where:{id,organisationId},include:{lines:{orderBy:{lineNumber:'asc'}}}});const copy=await tx.quote.create({data:{organisationId,partyId:q.partyId,pricingPartyId:q.pricingPartyId,deliveryInstructions:q.deliveryInstructions,financeInstructions:q.financeInstructions,ownerUserId:session.userId,opportunityId:q.opportunityId,projectId:q.projectId,priceListId:q.priceListId,paymentTermId:q.paymentTermId,customerPoReference:q.customerPoReference,externalReference:q.externalReference,customerNotes:q.customerNotes,tags:q.tags,netAmount:q.netAmount,taxAmount:q.taxAmount,totalAmount:q.totalAmount,totalCurrency:q.totalCurrency,reference:`Q-${crypto.randomUUID().slice(0,8).toUpperCase()}`,invoiceAddressSnapshot:json(q.invoiceAddressSnapshot),deliveryAddressSnapshot:json(q.deliveryAddressSnapshot),lines:{create:q.lines.map(({id,quoteId,...l})=>{void id;void quoteId;return l;})}}});await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'quote.duplicated',entityType:'Quote',entityId:copy.id,after:{sourceId:id}}});return copy.id;}
 const o=await tx.salesOrder.findFirstOrThrow({where:{id,organisationId},include:{lines:{orderBy:{lineNumber:'asc'}}}});const lines=await Promise.all(o.lines.filter(l=>l.orderedQuantity>l.cancelledQuantity).map(async l=>{const price=l.productId?await resolvePrice({organisationId,partyId:o.pricingPartyId??o.partyId,productId:l.productId,quantity:l.orderedQuantity-l.cancelledQuantity,priceListId:o.priceListId}):{unitPriceAmount:l.unitPriceAmount,currency:o.currency,source:'Custom repeat line'};if(price.currency!==o.currency)throw new Error('Review the pricelist currency before repeating this order.');const net=Math.round(price.unitPriceAmount*(l.orderedQuantity-l.cancelledQuantity)*(1-(l.discountPercent??0)/100));const tax=await resolveStandardUkVat({sellingOrganisationId:organisationId,partyId:o.partyId,deliveryCountry:(o.deliveryAddressSnapshot as {country?:string}|null)?.country??null,productTaxCategory:l.taxCategory,transactionDate:new Date(),netAmount:net});return {lineNumber:l.lineNumber,type:l.type,productId:l.productId,descriptionSnapshot:l.descriptionSnapshot,unitOfMeasure:l.unitOfMeasure,orderedQuantity:l.orderedQuantity-l.cancelledQuantity,unitPriceAmount:price.unitPriceAmount,discountPercent:l.discountPercent,netAmount:net,taxCategory:l.taxCategory,taxAmount:['SECTION','NOTE'].includes(l.type)?0:tax.amount,priceSource:price.source};}));const netAmount=lines.reduce((s,l)=>s+l.netAmount,0),taxAmount=lines.reduce((s,l)=>s+l.taxAmount,0);const copy=await tx.salesOrder.create({data:{organisationId,partyId:o.partyId,pricingPartyId:o.pricingPartyId,deliveryInstructions:o.deliveryInstructions,financeInstructions:o.financeInstructions,ownerUserId:session.userId,priceListId:o.priceListId,paymentTermId:o.paymentTermId,currency:o.currency,customerNotes:o.customerNotes,tags:o.tags,allowPartialDelivery:o.allowPartialDelivery,reference:`SO-${crypto.randomUUID().slice(0,8).toUpperCase()}`,netAmount,taxAmount,grossAmount:netAmount+taxAmount,invoiceAddressSnapshot:json(o.invoiceAddressSnapshot),deliveryAddressSnapshot:json(o.deliveryAddressSnapshot),lines:{create:lines}}});await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'order.duplicated',entityType:'SalesOrder',entityId:copy.id,after:{sourceId:id}}});return copy.id;
 });revalidatePath(`/sales/${mode==='quote'?'quotes':'orders'}`);redirect(`/sales/${mode==='quote'?'quotes':'orders'}/${result}`);
}
export async function saveQuoteTemplate(quoteId:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'sales.quote.create');
 await assertModuleEnabled(session,'sales');
 const name=String(form.get('name')??'').trim(),validityDays=Number(form.get('validityDays'));if(!name||name.length>100||!Number.isInteger(validityDays)||validityDays<1||validityDays>365)throw new Error('Enter a template name and 1–365 days validity.');
 const q=await db.quote.findFirstOrThrow({where:{id:quoteId,organisationId:session.organisationId},include:{lines:{orderBy:{lineNumber:'asc'}}}});
 if(q.lines.some(l=>!l.productId&&!['SECTION','NOTE'].includes(l.type)))throw new Error('Templates currently support catalogue products, sections and notes. Remove custom priced lines before saving a template.');
 const lines=documentLinesSchema.parse(q.lines.map(l=>({productId:l.productId??'',type:['SECTION','NOTE'].includes(l.type)?l.type:'PRODUCT',description:l.description,quantity:l.quantity,discount:l.discountPercent,optional:l.optional})));
 await db.$transaction(async tx=>{const template=await tx.salesQuotationTemplate.create({data:{organisationId:session.organisationId,name,validityDays,notes:q.customerNotes,lines}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'quote.template_created',entityType:'SalesQuotationTemplate',entityId:template.id,after:{name,sourceQuoteId:quoteId}}});});revalidatePath('/sales/quotes/new');
}
export async function createOrderFromQuote(quoteId:string){
 const session=await requireSession();
 assertCapability(session,'sales.quote.create');
 assertCapability(session,'sales.order.create');
 await assertModuleEnabled(session,'sales');
 const organisationId=session.organisationId;
 const existing=await db.salesOrder.findFirst({where:{quoteId,organisationId}});if(existing)redirect(`/sales/orders/${existing.id}`);
 const order=await db.$transaction(async tx=>{const q=await tx.quote.findFirstOrThrow({where:{id:quoteId,organisationId},include:{lines:{orderBy:{lineNumber:'asc'}},party:{include:{commercialSettings:true}}}});if(q.status==='DECLINED')throw new Error('A declined quotation cannot become an order.');if(isExpired(q.expiryDate))throw new Error('This quotation has expired. Update its validity before accepting.');const included=q.lines.filter(l=>!l.optional);if(!included.some(l=>!['SECTION','NOTE'].includes(l.type)))throw new Error('Add an included product before accepting.');const changed=await tx.quote.updateMany({where:{id:q.id,organisationId,updatedAt:q.updatedAt,status:q.status},data:{status:'ACCEPTED'}});if(changed.count!==1)throw new Error('This quotation changed. Reload it.');
 const lines=included.map((l,i)=>({lineNumber:i+1,productId:l.productId,type:l.productId?l.type:['SECTION','NOTE'].includes(l.type)?l.type:'TEXT' as const,descriptionSnapshot:l.description,unitOfMeasure:l.unitOfMeasure,orderedQuantity:l.quantity,unitPriceAmount:l.unitAmount,discountPercent:l.discountPercent,netAmount:['SECTION','NOTE'].includes(l.type)?0:Math.round(l.unitAmount*l.quantity*(1-l.discountPercent/100)),taxCategory:l.taxCategory,taxAmount:l.taxAmount,priceSource:l.priceSource??'Accepted quotation'})),netAmount=lines.reduce((s,l)=>s+l.netAmount,0),taxAmount=lines.reduce((s,l)=>s+l.taxAmount,0);
 const order=await tx.salesOrder.create({data:{organisationId,partyId:q.partyId,pricingPartyId:q.pricingPartyId,deliveryInstructions:q.deliveryInstructions,financeInstructions:q.financeInstructions,quoteId:q.id,opportunityId:q.opportunityId,priceListId:q.priceListId,paymentTermId:q.paymentTermId,ownerUserId:session.userId,customerPoReference:q.customerPoReference,externalReference:q.externalReference,customerNotes:q.customerNotes,tags:q.tags,allowPartialDelivery:q.party.commercialSettings?.partialShipmentAllowed??true,reference:`SO-${crypto.randomUUID().slice(0,8).toUpperCase()}`,currency:q.totalCurrency,netAmount,taxAmount,grossAmount:netAmount+taxAmount,invoiceAddressSnapshot:json(q.invoiceAddressSnapshot),deliveryAddressSnapshot:json(q.deliveryAddressSnapshot),lines:{create:lines}}});await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'quote.converted_to_order',entityType:'SalesOrder',entityId:order.id,after:{quoteId:q.id,reference:order.reference}}});return order;});
 await emit(DOMAIN_EVENTS.salesOrderCreated,{orderId:order.id,organisationId});revalidatePath('/sales/quotes');revalidatePath(`/sales/quotes/${quoteId}`);revalidatePath('/sales/orders');redirect(`/sales/orders/${order.id}`);
}
