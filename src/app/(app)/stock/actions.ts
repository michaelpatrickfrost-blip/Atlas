"use server";
import { validQuantity, addQuantity } from "@/core/shared/quantity";
import { measuredQuantity } from "@/core/shared/measurement";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getModule } from "@/core/modules/registry";
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
 const enteredQuantity=Number(form.get(mode?'quantity':'delta'));
 if(!productId||!warehouseId)throw new Error('Choose a product and a warehouse or yard.');
 if(!requestKey||requestKey.length>100||note.length>1000)throw new Error('This movement could not be recorded. Reopen the form and try again.');
 if(!validQuantity(Math.abs(enteredQuantity),1000000))throw new Error('Enter a quantity with up to six decimal places, up to 1,000,000.');
 if(mode==='count'?enteredQuantity<0:mode?enteredQuantity<=0:enteredQuantity===0)throw new Error(mode==='count'?'Enter the counted quantity, zero or more.':'Enter a quantity above zero.');
 if(mode==='remove'&&!note)throw new Error('Say why this stock is being removed.');
 if(!mode&&!note)throw new Error('Enter a reason for this movement.');
 const reason=mode==='count'?`Stock count${note?` · ${note}`:''}`:note||MOVEMENT_DEFAULTS[mode];
 let received=false;
 await db.$transaction(async tx=>{
  const product=await tx.product.findFirstOrThrow({where:{id:productId,organisationId:session.organisationId,kind:'PRODUCT'}});
  const measure=measuredQuantity(Math.abs(enteredQuantity),String(form.get('enteredUnit')||product.unitOfMeasure),product.unitOfMeasure);
  const quantity=measure.quantity*(enteredQuantity<0?-1:1);
  const lotCode=String(form.get('lotCode')||'').trim()||null, serials=String(form.get('serials')||'').split(/[\s,;]+/).filter(Boolean);
  const prior=await tx.inventoryMovement.findUnique({where:{organisationId_requestKey:{organisationId:session.organisationId,requestKey}}});
  if(prior && mode==='count') { const count=await tx.stockDiscrepancy.findUnique({where:{organisationId_requestKey:{organisationId:session.organisationId,requestKey:`count:${requestKey}`}}}); if(!count||count.productId!==productId||count.warehouseId!==warehouseId||Number(count.reportedQuantity)!==quantity||count.enteredUnit!==measure.enteredUnit||prior.reason!==reason||count.sourceId!==(lotCode||''))throw new Error('This count reference already belongs to different details.');return; }
  await tx.warehouse.findFirstOrThrow({where:{id:warehouseId,organisationId:session.organisationId}});
  const balance=await tx.inventoryBalance.findUnique({where:{warehouseId_productId:{warehouseId,productId}}});
  let onHand=Number(balance?.quantity ?? 0);
  if(mode==='count' && product.trackingMode==='LOT') { if(!lotCode)throw new Error('Enter the batch being counted. Tracked stock counts are recorded per batch.');const lot=await tx.stockLot.findFirstOrThrow({where:{organisationId:session.organisationId,productId,code:lotCode}});const positions=await tx.stockPosition.aggregate({where:{organisationId:session.organisationId,warehouseId,productId,lotId:lot.id,status:'AVAILABLE'},_sum:{quantity:true}});onHand=Number(positions._sum.quantity??0); }
  const delta=mode==='count'?addQuantity(quantity,-onHand):mode==='remove'?-quantity:quantity;
  if(!delta)throw new Error('The count matches the system. Nothing to correct.');
  const provider=getModule('stock')?.stockProvider;if(!provider)throw new Error('Inventory is unavailable.');
  let movementSerials=serials;
  if(mode==='count' && product.trackingMode==='SERIAL') {
    if(serials.length!==quantity || new Set(serials).size!==quantity)throw new Error('Enter every serial physically counted, with one serial per whole unit.');
    const existing=await tx.stockSerial.findMany({where:{organisationId:session.organisationId,warehouseId,productId,status:'ON_HAND'}});
    movementSerials=delta>0?serials.filter(serial=>!existing.some(row=>row.serial===serial)):existing.filter(row=>!serials.includes(row.serial)).map(row=>row.serial);
    if(movementSerials.length!==Math.abs(delta))throw new Error('This count changes serial identity as well as quantity. Record the individual missing and newly found serials as separate stock corrections.');
  }
  const command={requestKey,productId,warehouseId,quantity:mode==='count'?Math.abs(delta):Math.abs(enteredQuantity),enteredUnit:mode==='count'?product.unitOfMeasure:measure.enteredUnit,lotCode,serials:movementSerials,reason,reference};
  const result=delta>0?await provider.receiveStock(session,command,tx):await provider.shipStock(session,command,tx);
  const movementId=result.movementIds[0];
  if(mode==='count')await tx.stockDiscrepancy.create({data:{organisationId:session.organisationId,productId,warehouseId,systemQuantity:onHand,reportedQuantity:quantity,enteredQuantity:measure.enteredQuantity,enteredUnit:measure.enteredUnit,conversionFactor:measure.conversionFactor,status:'RESOLVED',sourceType:'STOCK_COUNT',sourceId:lotCode||'',requestKey:`count:${requestKey}`}});
  if(!result.replayed)await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:mode==='count'?'stock.counted':'stock.adjusted',entityType:'InventoryMovement',entityId:movementId,before:{quantity:onHand},after:{productId,warehouseId,delta,quantity:addQuantity(onHand,delta),reason,lotCode}}});
  received=delta>0;
 },{isolationLevel:'Serializable'});
 if(received){const {stockReplenished}=await import('@/core/stock/replenishment');await stockReplenished(session,{productId,warehouseId,requestKey:`balance:${requestKey}`});}
 revalidatePath('/stock','layout');
 revalidatePath('/planning');
}

const planningNumber=(value:FormDataEntryValue|null,label:string,blank:number|null)=>{const text=String(value??'').trim();if(!text)return blank;const number=Number(text);if(!validQuantity(number,10000000))throw new Error(`${label} must be zero or positive, with up to six decimal places.`);return number;};
/** Planning figures on the product: read by the Inventory forecast and the production planner. */
export async function savePlanningAction(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 const productId=String(form.get('productId')??'');
 const data={safetyStockLevel:planningNumber(form.get('safetyStockLevel'),'Safety stock',0)??0,leadTimeDays:planningNumber(form.get('leadTimeDays'),'Lead time',0)??0,monthlyUsage:planningNumber(form.get('monthlyUsage'),'Monthly usage',null)};
 if(!Number.isInteger(data.leadTimeDays)||data.leadTimeDays>730)throw new Error('Lead time must be a whole number up to 730 days.');
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
 if(!validQuantity(quantity,1000000)||quantity<=0)throw new Error('Enter a positive quantity with up to six decimal places.');
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
 const result=await postTransfer(session,movement);
 const {stockReplenished}=await import('@/core/stock/replenishment');
 if(result?.replenished)await stockReplenished(session,{productId:movement.productId,warehouseId:movement.toWarehouseId,requestKey:`balance:${movement.requestKey}`});
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
