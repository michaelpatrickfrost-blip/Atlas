"use server";
import {commercialSnapshot} from "@/modules/sales/services/revisions";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { assertModuleEnabled } from "@/core/modules/access";
import { createDraftOrder,addOrderLine,removeOrderLine,confirmOrder,updateDraftOrderFields,addHold,releaseHold,decideApproval,cancelOrder,deleteOrder } from "@/modules/sales/services/orders";
import { parseHashtags } from "@/core/shared/hashtags";
import { restoreCancelledOrder, returnOrderToQuote, saveOrderHashtags } from "@/modules/sales/services/rewind";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
export async function createOrderForm(form:FormData) {
 const session=await requireSession();
 assertCapability(session,SALES_CAPABILITIES.orderCreate);
 const priceListId=String(form.get('priceListId')??'')||undefined;
 const list=priceListId?await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:session.organisationId}}):null;
 const order=await createDraftOrder({partyId:String(form.get('partyId')),customerPoReference:String(form.get('customerPoReference')??''),priceListId,currency:list?.currency??String(form.get('currency')??'GBP')});
 redirect(`/sales/orders/${order.id}`);
}
export async function addLineForm(orderId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,SALES_CAPABILITIES.orderEditDraft);
 await addOrderLine({orderId,productId:String(form.get('productId')),quantity:Number(form.get('quantity')),discountPercent:Number(form.get('discount')??0)});
}
export async function removeLineForm(orderId:string,lineId:string) { const session=await requireSession(); assertCapability(session,SALES_CAPABILITIES.orderEditDraft); await removeOrderLine(lineId,orderId); }
export async function confirmOrderForm(orderId:string) { const session=await requireSession(); assertCapability(session,SALES_CAPABILITIES.orderConfirm); const result=await confirmOrder(orderId); if(!result.confirmed) throw new Error(result.reason??'Order requires review.'); }
export async function updateOrderForm(orderId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,SALES_CAPABILITIES.orderEditDraft);
 const requested=String(form.get('requestedDeliveryDate')??'');
 const date=requested?new Date(requested):undefined;
 if(date&&isNaN(date.getTime()))throw new Error('Choose a valid delivery date.');
 await updateDraftOrderFields(orderId,{customerPoReference:String(form.get('customerPoReference')??'').slice(0,150),requestedDeliveryDate:date,internalNotes:String(form.get('internalNotes')??'').slice(0,10000),deliveryInstructions:String(form.get('deliveryInstructions')??'').slice(0,5000)});
}
export async function chooseOrderAddresses(orderId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,SALES_CAPABILITIES.orderEditDraft);
 await assertModuleEnabled(session,'sales');
 const order=await db.salesOrder.findFirstOrThrow({where:{id:orderId,organisationId:session.organisationId,commercialStatus:'DRAFT'},include:{party:{include:{children:true}}}});
 const ids=[order.partyId,...order.party.children.filter(c=>c.organisationId===session.organisationId).map(c=>c.id),...(order.party.parentPartyId?[order.party.parentPartyId]:[])];
 const addresses=await db.address.findMany({where:{active:true,partyId:{in:ids},party:{organisationId:session.organisationId}}});
 const invoice=addresses.find(a=>a.id===form.get('invoiceAddressId')&&(a.type==='BILLING'||a.isDefaultBilling)),delivery=addresses.find(a=>a.id===form.get('deliveryAddressId')&&(a.type==='DELIVERY'||a.isDefaultDelivery));
 if(!invoice||!delivery)throw new Error('Choose an invoice address and delivery site from this customer hierarchy.');
 const snapshot=(a:typeof invoice)=>({addressId:a.id,partyId:a.partyId,label:a.label,line1:a.line1,line2:a.line2,city:a.city,postcode:a.postcode,country:a.country,deliveryInstructions:a.deliveryInstructions});
 await db.salesOrder.update({where:{id:order.id,organisationId:session.organisationId},data:{invoiceAddressSnapshot:snapshot(invoice),deliveryAddressSnapshot:snapshot(delivery)}});
 const {recalcOrderTotals}=await import('@/modules/sales/services/order-totals');await recalcOrderTotals(order.id,session.organisationId);
 revalidatePath(`/sales/orders/${order.id}`);
}
export async function addHoldForm(orderId:string,form:FormData) { const session=await requireSession(); assertCapability(session,SALES_CAPABILITIES.orderHoldManage); const reason=String(form.get('reason')??'').trim();if(!reason)throw new Error('Enter a hold reason.');await addHold(orderId,'MANUAL',reason.slice(0,1000)); }
export async function releaseHoldForm(orderId:string,holdId:string) { const session=await requireSession();assertCapability(session,SALES_CAPABILITIES.orderHoldManage);await releaseHold(holdId,orderId); }
export async function approveOrderForm(orderId:string,approvalId:string) { const session=await requireSession();assertCapability(session,SALES_CAPABILITIES.orderApprovalApprove);await decideApproval(approvalId,orderId,true); }
export async function cancelOrderForm(orderId:string,form:FormData) {const session=await requireSession();assertCapability(session,SALES_CAPABILITIES.orderCancel);const reason=String(form.get('reason')??'').trim();if(!reason)throw new Error('Enter a cancellation reason.');await cancelOrder(orderId,reason);}
export async function saveOrderHashtagsForm(orderId:string,form:FormData){await saveOrderHashtags(orderId,parseHashtags(String(form.get('tags')??'')));}
export async function restoreCancelledOrderForm(orderId:string){await restoreCancelledOrder(orderId);}
export async function returnOrderToQuoteForm(orderId:string){const quoteId=await returnOrderToQuote(orderId);redirect(`/sales/quotes/${quoteId}`);}
export async function scheduleOrderDelivery(orderId:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,form.get('confirmed')==='yes'?'sales.order.amend':'sales.order.edit_draft');
 await assertModuleEnabled(session,'sales');
 const version=String(form.get('version')??'');if(!version||isNaN(new Date(version).getTime()))throw new Error('Reload this order before scheduling.');
 const requested=form.has('requestedDeliveryDate')?String(form.get('requestedDeliveryDate')??''):null,promised=form.has('promisedDeliveryDate')?String(form.get('promisedDeliveryDate')??''):null,reason=String(form.get('reason')??'').trim();
 const requestedDeliveryDate=requested?new Date(requested):requested===''?null:undefined,promisedDeliveryDate=promised?new Date(promised):promised===''?null:undefined;
 if((requestedDeliveryDate&&isNaN(requestedDeliveryDate.getTime()))||(promisedDeliveryDate&&isNaN(promisedDeliveryDate.getTime()))||!reason)throw new Error('Enter a reason. Dates must be valid when you set them.');
 await db.$transaction(async tx=>{const order=await tx.salesOrder.findFirstOrThrow({where:{id:orderId,organisationId:session.organisationId},include:{lines:true}});if(order.commercialStatus==='DRAFT')assertCapability(session,'sales.order.edit_draft');else {assertCapability(session,'sales.order.amend');if(!['CONFIRMED','ON_HOLD'].includes(order.commercialStatus))throw new Error('Delivery scheduling is unavailable in this order state.');}const data={...(requestedDeliveryDate!==undefined?{requestedDeliveryDate}:{}),...(promisedDeliveryDate!==undefined?{promisedDeliveryDate}:{}),...(form.has('customerPoReference')?{customerPoReference:String(form.get('customerPoReference')??'').slice(0,150)}:{}),deliveryInstructions:String(form.get('deliveryInstructions')??'').slice(0,5000)};const changed=await tx.salesOrder.updateMany({where:{id:orderId,organisationId:session.organisationId,updatedAt:new Date(version)},data:{...data,revision:{increment:1}}});if(changed.count!==1)throw new Error('This order changed. Reload before scheduling.');if(order.commercialStatus!=='DRAFT'){const saved=await tx.salesOrder.findUniqueOrThrow({where:{id:orderId},include:{lines:true}});await tx.salesOrderRevision.create({data:{orderId,revision:saved.revision,snapshot:commercialSnapshot(saved),reason,createdByUserId:session.userId}});await tx.domainOutbox.create({data:{organisationId:session.organisationId,eventKey:`sales.order.delivery:${orderId}:${saved.revision}`,eventName:'sales.order.amended',payload:{orderId,revision:saved.revision,change:'delivery_schedule'}}});}await tx.orderChangeEvent.create({data:{orderId,type:'REQUESTED_DATE',changedByUserId:session.userId,fromValue:order.requestedDeliveryDate?.toISOString(),toValue:requestedDeliveryDate?.toISOString(),reason}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'order.delivery_scheduled',entityType:'SalesOrder',entityId:orderId,before:{requestedDeliveryDate:order.requestedDeliveryDate?.toISOString(),promisedDeliveryDate:order.promisedDeliveryDate?.toISOString()},after:{requestedDeliveryDate:requestedDeliveryDate?.toISOString(),promisedDeliveryDate:promisedDeliveryDate?.toISOString(),reason}}});});
 const {emit,DOMAIN_EVENTS}=await import('@/core/events/bus');await emit(DOMAIN_EVENTS.salesOrderAmended,{orderId,organisationId:session.organisationId,change:'delivery_schedule'});const {handoffSalesOrder}=await import('@/core/logistics/handoff');await handoffSalesOrder({kind:'amended',organisationId:session.organisationId,orderId,eventKey:`sales.order.delivery:${orderId}:${version}`,actorUserId:session.userId});revalidatePath(`/sales/orders/${orderId}`);revalidatePath('/sales/orders');
}

export async function rejectOrderApproval(orderId:string,approvalId:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'sales.order.approval.approve');
 await decideApproval(approvalId,orderId,false,String(form.get('reason')??''));
}

export async function deleteOrderForm(orderId:string){
 await deleteOrder(orderId);
 redirect('/sales/orders');
}
