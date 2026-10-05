"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
const MOVEMENT_DEFAULTS:Record<string,string>={add:'Stock received',remove:'Stock removed',count:'Stock count'};
/** One ledger entry. `mode` add/remove takes a positive quantity; count takes what is physically there and posts the difference. */
export async function adjustStock(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 const mode=String(form.get('mode')??''),productId=String(form.get('productId')??''),warehouseId=String(form.get('warehouseId')??''),note=String(form.get('reason')??'').trim(),reference=String(form.get('reference')??'').trim().slice(0,150),requestKey=String(form.get('requestKey')??'');
 const quantity=Number(form.get(mode?'quantity':'delta'));
 if(!productId||!warehouseId)throw new Error('Choose a product and a warehouse or yard.');
 if(!requestKey||requestKey.length>100||note.length>1000)throw new Error('This movement could not be recorded. Reopen the form and try again.');
 if(!Number.isInteger(quantity)||Math.abs(quantity)>1000000)throw new Error('Enter a whole quantity up to 1,000,000.');
 if(mode==='count'?quantity<0:mode?quantity<=0:quantity===0)throw new Error(mode==='count'?'Enter the counted quantity, zero or more.':'Enter a quantity above zero.');
 if(mode==='remove'&&!note)throw new Error('Say why this stock is being removed.');
 if(!mode&&!note)throw new Error('Enter a reason for this movement.');
 const reason=mode==='count'?`Stock count${note?` · ${note}`:''}`:note||MOVEMENT_DEFAULTS[mode];
 let received=false;
 await db.$transaction(async tx=>{
  const prior=await tx.inventoryMovement.findUnique({where:{organisationId_requestKey:{organisationId:session.organisationId,requestKey}}});
  if(prior){if(prior.productId!==productId||prior.warehouseId!==warehouseId||prior.reason!==reason)throw new Error('This request was already used for a different movement.');return;}
  await tx.product.findFirstOrThrow({where:{id:productId,organisationId:session.organisationId,kind:'PRODUCT'}});
  await tx.warehouse.findFirstOrThrow({where:{id:warehouseId,organisationId:session.organisationId}});
  const balance=await tx.inventoryBalance.findUnique({where:{warehouseId_productId:{warehouseId,productId}}});
  const onHand=balance?.quantity??0,delta=mode==='count'?quantity-onHand:mode==='remove'?-quantity:quantity;
  if(delta===0){if(mode==='count')throw new Error(`The count matches the system: ${onHand.toLocaleString('en-GB')} on hand. Nothing to correct.`);throw new Error('Enter a quantity above zero.');}
  if(onHand+delta<0)throw new Error(`Only ${onHand.toLocaleString('en-GB')} on hand here. This would take stock below zero.`);
  await tx.inventoryBalance.upsert({where:{warehouseId_productId:{warehouseId,productId}},create:{organisationId:session.organisationId,warehouseId,productId,quantity:delta},update:{quantity:{increment:delta}}});
  if(delta>0){const positioned=await tx.stockPosition.findFirst({where:{organisationId:session.organisationId,warehouseId,productId,status:'AVAILABLE'},orderBy:{quantity:'desc'}});if(positioned)await tx.stockPosition.update({where:{id:positioned.id},data:{quantity:{increment:delta}}});}
  else{const positions=await tx.stockPosition.findMany({where:{organisationId:session.organisationId,warehouseId,productId,status:'AVAILABLE',quantity:{gt:0}},orderBy:{quantity:'desc'}});const located=positions.reduce((sum,row)=>sum+row.quantity,0);let excess=Math.max(0,located-(onHand+delta));for(const row of positions){if(!excess)break;const take=Math.min(row.quantity,excess);await tx.stockPosition.update({where:{id:row.id},data:{quantity:{decrement:take}}});excess-=take;}}
  const movement=await tx.inventoryMovement.create({data:{organisationId:session.organisationId,warehouseId,productId,delta,reason,reference,requestKey,actorUserId:session.userId}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:mode==='count'?'stock.counted':'stock.adjusted',entityType:'InventoryMovement',entityId:movement.id,before:{quantity:onHand},after:{productId,warehouseId,delta,quantity:onHand+delta,reason}}});
  received=delta>0;
 },{isolationLevel:'Serializable'});
 if(received){const {stockReplenished}=await import('@/core/stock/replenishment');await stockReplenished(session,{productId,warehouseId,requestKey:`balance:${requestKey}`});}
 revalidatePath('/stock','layout');
 revalidatePath('/planning');
}

const planningNumber=(value:FormDataEntryValue|null,label:string,blank:number|null)=>{const text=String(value??'').trim();if(!text)return blank;const number=Number(text);if(!Number.isInteger(number)||number<0||number>10000000)throw new Error(`${label} must be a whole number, zero or more.`);return number;};
/** Planning figures on the product: read by the Inventory forecast and the production planner. */
export async function savePlanningAction(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 const productId=String(form.get('productId')??'');
 const data={safetyStockLevel:planningNumber(form.get('safetyStockLevel'),'Safety stock',0)??0,leadTimeDays:planningNumber(form.get('leadTimeDays'),'Lead time',0)??0,monthlyUsage:planningNumber(form.get('monthlyUsage'),'Monthly usage',null)};
 if(data.leadTimeDays>730)throw new Error('Lead time cannot be more than 730 days.');
 const before=await db.product.findFirst({where:{id:productId,organisationId:session.organisationId,kind:'PRODUCT'},select:{safetyStockLevel:true,leadTimeDays:true,monthlyUsage:true}});
 if(!before)throw new Error('This product is no longer in the catalogue.');
 await db.$transaction([db.product.update({where:{id:productId},data}),db.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'stock.planning.updated',entityType:'Product',entityId:productId,before,after:data}})]);
 revalidatePath('/stock','layout');
 revalidatePath('/planning');
 revalidatePath('/manufacturing','layout');
}

/** Raise a planned production order for a product the forecast says is running short. */
export async function makeFromForecastAction(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.read');
 assertCapability(session,'manufacturing.order.create');
 const productId=String(form.get('productId')??''),quantity=Number(form.get('quantity')),required=String(form.get('requiredDate')??'');
 if(!Number.isInteger(quantity)||quantity<=0||quantity>1000000)throw new Error('Enter a whole quantity above zero.');
 const product=await db.product.findFirst({where:{id:productId,organisationId:session.organisationId,kind:'PRODUCT',active:true},select:{unitOfMeasure:true}});
 if(!product)throw new Error('This product is no longer in the catalogue.');
 const definition=await db.productDefinition.findFirst({where:{organisationId:session.organisationId,productId,status:'ACTIVE',supply:{not:'BUY'}},select:{id:true}});
 if(!definition)throw new Error('This product has no recipe. Set it to Made here on the product, or buy it in.');
 const requiredDate=required?new Date(`${required}T00:00:00Z`):null;
 if(requiredDate&&Number.isNaN(requiredDate.getTime()))throw new Error('Enter a valid date.');
 const {createProductionOrder}=await import('@/modules/manufacturing/services/commands');
 const order=await createProductionOrder({productId,definitionId:definition.id,quantity,unitOfMeasure:product.unitOfMeasure,requiredDate,notes:'Raised from the Inventory forecast'});
 revalidatePath('/stock','layout');
 revalidatePath('/manufacturing','layout');
 redirect(`/manufacturing/produce/${order.id}`);
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
