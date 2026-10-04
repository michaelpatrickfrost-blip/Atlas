"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { parseTransfer, postTransfer, receiveInternalMove } from "@/modules/stock/services/transfers";
import { addLocation, assignSite, createPlace, createSite, ensureStarterLocations, moveLocated, putOnLocation, retireLocation } from "@/modules/stock/services/places";
export async function createWarehouse(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 const name=String(form.get('name')??'').trim(),code=String(form.get('code')??'').trim();
 if(!name||name.length>150||!code||code.length>30)throw new Error('Enter a warehouse name and code.');
 await db.warehouse.create({data:{organisationId:session.organisationId,name,code}});
 revalidatePath('/stock','layout');
 revalidatePath('/planning');
}
export async function adjustStock(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 const productId=String(form.get('productId')),warehouseId=String(form.get('warehouseId')),delta=Number(form.get('delta')),reason=String(form.get('reason')??'').trim(),reference=String(form.get('reference')??'').slice(0,150),requestKey=String(form.get('requestKey')??'');
 if(!Number.isInteger(delta)||delta===0||Math.abs(delta)>1000000||!reason||reason.length>1000||!requestKey||requestKey.length>100)throw new Error('Enter a non-zero whole quantity and movement reason.');
 await db.$transaction(async tx=>{
  const prior=await tx.inventoryMovement.findUnique({where:{organisationId_requestKey:{organisationId:session.organisationId,requestKey}}});
  if(prior){if(prior.productId!==productId||prior.warehouseId!==warehouseId||prior.delta!==delta||prior.reason!==reason||prior.reference!==reference)throw new Error('This request was already used for a different movement.');return;}
  await tx.product.findFirstOrThrow({where:{id:productId,organisationId:session.organisationId,kind:'PRODUCT'}});
  await tx.warehouse.findFirstOrThrow({where:{id:warehouseId,organisationId:session.organisationId}});
  const balance=await tx.inventoryBalance.findUnique({where:{warehouseId_productId:{warehouseId,productId}}});
  if((balance?.quantity??0)+delta<0)throw new Error('This movement would take stock below zero.');
  await tx.inventoryBalance.upsert({where:{warehouseId_productId:{warehouseId,productId}},create:{organisationId:session.organisationId,warehouseId,productId,quantity:delta},update:{quantity:{increment:delta}}});
  if(delta>0){const positioned=await tx.stockPosition.findFirst({where:{organisationId:session.organisationId,warehouseId,productId,status:'AVAILABLE'},orderBy:{quantity:'desc'}});if(positioned)await tx.stockPosition.update({where:{id:positioned.id},data:{quantity:{increment:delta}}});}
  const movement=await tx.inventoryMovement.create({data:{organisationId:session.organisationId,warehouseId,productId,delta,reason,reference,requestKey,actorUserId:session.userId}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'stock.adjusted',entityType:'InventoryMovement',entityId:movement.id,after:{productId,warehouseId,delta,reason}}});
 },{isolationLevel:'Serializable'});
 if(delta>0){const {stockReplenished}=await import('@/core/stock/replenishment');await stockReplenished(session,{productId,warehouseId,requestKey:`balance:${requestKey}`});}
 revalidatePath('/stock','layout');
 revalidatePath('/planning');
}

export async function transferStock(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 const movement=parseTransfer(form);
 await postTransfer(session,movement);
 const {stockReplenished}=await import('@/core/stock/replenishment');
 await stockReplenished(session,{productId:movement.productId,warehouseId:movement.toWarehouseId,requestKey:`balance:${movement.requestKey}`});
 revalidatePath('/stock','layout');
 revalidatePath('/planning');
}
async function managed() {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 return session;
}
export async function createSiteAction(form:FormData) {
 const session=await managed();
 await createSite(session,String(form.get('name')??''),String(form.get('code')??''));
 revalidatePath('/stock','layout');
}
export async function createPlaceAction(form:FormData) {
 const session=await managed();
 await createPlace(session,{name:String(form.get('name')??''),code:String(form.get('code')??''),kind:String(form.get('kind')??''),siteId:String(form.get('siteId')??'')});
 revalidatePath('/stock','layout');
}
export async function assignSiteAction(form:FormData) {
 const session=await managed();
 await assignSite(session,String(form.get('placeId')??''),String(form.get('siteId')??''));
 revalidatePath('/stock','layout');
}
export async function addLocationAction(form:FormData) {
 const session=await managed();
 await addLocation(session,String(form.get('placeId')??''),String(form.get('name')??''),String(form.get('code')??''));
 revalidatePath('/stock','layout');
}
export async function ensureLocationsAction(form:FormData) {
 const session=await managed();
 await ensureStarterLocations(session,String(form.get('placeId')??''));
 revalidatePath('/stock','layout');
}
export async function retireLocationAction(form:FormData) {
 const session=await managed();
 await retireLocation(session,String(form.get('locationId')??''));
 revalidatePath('/stock','layout');
}
export async function putOnLocationAction(form:FormData) {
 const session=await managed();
 await putOnLocation(session,{locationId:String(form.get('locationId')??''),productId:String(form.get('productId')??''),quantity:Number(form.get('quantity')),requestKey:String(form.get('requestKey')??'')});
 revalidatePath('/stock','layout');
}
export async function moveLocatedAction(form:FormData) {
 const session=await managed();
 await moveLocated(session,{productId:String(form.get('productId')??''),fromLocationId:String(form.get('fromLocationId')??''),toLocationId:String(form.get('toLocationId')??''),quantity:Number(form.get('quantity')),reason:String(form.get('reason')??''),requestKey:String(form.get('requestKey')??'')});
 revalidatePath('/stock','layout');
}
export async function receiveMoveAction(form:FormData) {
 const session=await managed();
 const received=await receiveInternalMove(session,String(form.get('moveId')??''));
 if(received){const {stockReplenished}=await import('@/core/stock/replenishment');await stockReplenished(session,{productId:received.productId,warehouseId:received.warehouseId,requestKey:`balance:${received.requestKey}:in`});}
 revalidatePath('/stock','layout');
}
