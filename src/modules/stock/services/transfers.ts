import { createHash } from "node:crypto";
import { measuredQuantity } from "@/core/shared/measurement";
import { addQuantity, validQuantity } from "@/core/shared/quantity";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { moveTiming } from "../domain/places";
import { stockProvider } from "./provider";
import { eligiblePositions, unreservedPositions } from "../domain/eligibility";

export type StockTransfer = { productId:string; fromWarehouseId:string; toWarehouseId:string; quantity:number; reason:string; reference:string; requestKey:string; enteredUnit?:string; lotCode?:string; serials?:string[] };
export function parseTransfer(form:FormData):StockTransfer {
 const value={productId:String(form.get("productId")??""),fromWarehouseId:String(form.get("fromWarehouseId")??""),toWarehouseId:String(form.get("toWarehouseId")??""),quantity:Number(form.get("quantity")),enteredUnit:String(form.get("enteredUnit")||""),lotCode:String(form.get("lotCode")||"").trim(),serials:String(form.get("serials")||"").split(/[\s,;]+/).filter(Boolean),reason:String(form.get("reason")??"").trim(),reference:String(form.get("reference")??"").trim(),requestKey:String(form.get("requestKey")??"")};
 if(!value.productId||!value.fromWarehouseId||!value.toWarehouseId||value.fromWarehouseId===value.toWarehouseId)throw new Error("Choose a product and two different warehouses.");
 if(!validQuantity(value.quantity)||value.quantity<=0||value.quantity>1_000_000)throw new Error("Enter a positive quantity with up to six decimal places, up to 1,000,000.");
 if(!value.reason||value.reason.length>1000||value.reference.length>150||!value.requestKey||value.requestKey.length>80||value.lotCode.length>80)throw new Error("Enter a reason and a valid movement reference.");
 return value;
}

/** The stock remains owned and valued at its source while in transit; receipt moves ownership between warehouses. */
export async function postTransfer(session:Session, entered:StockTransfer) {
 for(let attempt=0;attempt<3;attempt++) {
  try {
   return await db.$transaction(async tx=>{
    const organisationId=session.organisationId;
    const product=await tx.product.findFirstOrThrow({where:{id:entered.productId,organisationId,kind:"PRODUCT",active:true}});
    const measure=measuredQuantity(entered.quantity,entered.enteredUnit||product.unitOfMeasure,product.unitOfMeasure);
    const fingerprint=createHash("sha256").update(JSON.stringify({...entered,serials:[...(entered.serials??[])].sort(),measurement:measure})).digest("hex");
    const prior=await tx.internalMove.findUnique({where:{organisationId_requestKey:{organisationId,requestKey:entered.requestKey}}});
    if(prior){if(prior.requestFingerprint!==fingerprint)throw new Error("This transfer reference already belongs to different details.");return {replenished:false};}
    const warehouses=await tx.warehouse.findMany({where:{organisationId,id:{in:[entered.fromWarehouseId,entered.toWarehouseId]}},select:{id:true,siteId:true}});
    if(warehouses.length!==2)throw new Error("Both warehouses must belong to this company.");
    const from=warehouses.find(row=>row.id===entered.fromWarehouseId)!,to=warehouses.find(row=>row.id===entered.toWarehouseId)!;
    const transit=moveTiming(from.siteId,to.siteId)==="transit";
    const [positions,lots,reservations,holds,serials]=await Promise.all([
     tx.stockPosition.findMany({where:{organisationId,warehouseId:from.id,productId:product.id}}),
     tx.stockLot.findMany({where:{organisationId,productId:product.id}}),
     tx.stockReservation.findMany({where:{organisationId,warehouseId:from.id,productId:product.id,status:"ACTIVE"}}),
     tx.qualityHold.findMany({where:{organisationId,productId:product.id,status:"ACTIVE"}}),
     tx.stockSerial.findMany({where:{organisationId,productId:product.id,warehouseId:from.id,status:"ON_HAND",serial:{in:entered.serials??[]}}}),
    ]);
    if(product.trackingMode==="SERIAL"&&(!Number.isSafeInteger(measure.quantity)||new Set(entered.serials??[]).size!==measure.quantity||serials.length!==measure.quantity))throw new Error("Select one on-hand serial per unit to transfer.");
    const free=unreservedPositions(eligiblePositions(positions.map(row=>({...row,quantity:Number(row.quantity)})),lots,holds,product.trackingMode),reservations.map(row=>({...row,quantity:Number(row.quantity)}))).filter(row=>!entered.lotCode||lots.find(lot=>lot.id===row.lotId)?.code===entered.lotCode);
    // Legacy unlocated stock is materialised by the provider only for untracked products.
    if(!positions.length&&product.trackingMode==="NONE"&&!holds.length&&!reservations.length){
     const balance=await tx.inventoryBalance.findUnique({where:{warehouseId_productId:{warehouseId:from.id,productId:product.id}}});
     if(Number(balance?.quantity??0)>=measure.quantity)free.push({id:"legacy",warehouseId:from.id,locationId:"",lotId:"",status:"AVAILABLE",quantity:Number(balance!.quantity)});
    }
    let remaining=measure.quantity;
    const count=await tx.internalMove.count({where:{organisationId}});
    const move=await tx.internalMove.create({data:{organisationId,reference:`MV-${String(count+1).padStart(4,"0")}`,productId:product.id,fromWarehouseId:from.id,toWarehouseId:to.id,quantity:measure.quantity,reason:entered.reason,requestKey:entered.requestKey,requestFingerprint:fingerprint,actorUserId:session.userId,status:transit?"IN_TRANSIT":"RECEIVED",receivedAt:transit?null:new Date()}});
    for(const row of free){
     if(remaining<=0)break;
     const selected=serials.filter(serial=>serial.locationId===row.locationId&&(serial.lotId??"")===row.lotId).map(serial=>serial.serial);
     const take=Math.min(row.quantity,remaining,product.trackingMode==="SERIAL"?selected.length:Infinity);
     if(take<=0)continue;
     const suffix=createHash("sha256").update(row.id).digest("hex").slice(0,8);
     await stockProvider.executeMovement(session,{requestKey:`${entered.requestKey}:dispatch:${suffix}`,productId:product.id,warehouseId:from.id,locationId:row.locationId||undefined,toWarehouseId:transit?from.id:to.id,toLocationId:transit?(row.locationId||undefined):undefined,lotCode:lots.find(lot=>lot.id===row.lotId)?.code,serials:selected.slice(0,take),quantity:take,toStatus:transit?"IN_TRANSIT":"AVAILABLE",reason:`Transfer · ${entered.reason}`,reference:move.reference},tx);
     remaining=addQuantity(remaining,-take);
    }
    if(remaining>0)throw new Error("This transfer exceeds available stock after reservations, quality holds and expiry.");
    await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:"stock.transferred",entityType:"InternalMove",entityId:move.id,after:{...entered,quantity:measure.quantity,status:move.status}}});
    return {replenished:!transit};
   },{isolationLevel:"Serializable"});
  }catch(error){if(attempt<2&&typeof error==="object"&&error!==null&&"code" in error&&["P2034","P2002"].includes(String(error.code)))continue;throw error;}
 }
}

export async function receiveInternalMove(session:Session,moveId:string){
 return db.$transaction(async tx=>{
  const organisationId=session.organisationId;
  const move=await tx.internalMove.findFirstOrThrow({where:{id:moveId,organisationId}});
  if(move.status==="RECEIVED")return;
  if(move.status!=="IN_TRANSIT")throw new Error("This transfer is no longer in transit.");
  const allocations=await tx.stockMovementAllocation.findMany({where:{organisationId,direction:"IN",status:"IN_TRANSIT",movement:{organisationId,requestKey:{startsWith:`${move.requestKey}:dispatch:`}}}});
  if(allocations.reduce((sum,row)=>addQuantity(sum,Number(row.quantity)),0)!==Number(move.quantity))throw new Error("This transfer has no complete batch allocation history. Review its source stock before receipt.");
  for(const allocation of allocations){
   const lot=allocation.lotId?await tx.stockLot.findFirstOrThrow({where:{id:allocation.lotId,organisationId,productId:move.productId}}):null;
   await stockProvider.executeMovement(session,{requestKey:`${move.requestKey}:receive:${allocation.id.slice(-8)}`,productId:move.productId,warehouseId:move.fromWarehouseId,locationId:allocation.locationId,toWarehouseId:move.toWarehouseId,toLocationId:move.toLocationId,lotCode:lot?.code,serials:allocation.serials,quantity:Number(allocation.quantity),status:"IN_TRANSIT",toStatus:"AVAILABLE",reason:`Received · ${move.reason}`,reference:move.reference},tx);
  }
  const changed=await tx.internalMove.updateMany({where:{id:move.id,organisationId,status:"IN_TRANSIT"},data:{status:"RECEIVED",receivedAt:new Date()}});
  if(changed.count!==1)throw new Error("This transfer changed during receipt. Refresh and try again.");
  await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:"stock.transfer.received",entityType:"InternalMove",entityId:move.id,after:{quantity:Number(move.quantity),batches:allocations.length}}});
  return{productId:move.productId,warehouseId:move.toWarehouseId,requestKey:move.requestKey};
 },{isolationLevel:"Serializable"});
}
