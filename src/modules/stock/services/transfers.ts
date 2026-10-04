import { db } from '@/core/db/client';
import type { Session } from '@/core/auth/session';
import { moveTiming } from '../domain/places';
export type StockTransfer = {productId:string;fromWarehouseId:string;toWarehouseId:string;quantity:number;reason:string;reference:string;requestKey:string};
export function parseTransfer(form:FormData):StockTransfer {
 const value={productId:String(form.get('productId')??''),fromWarehouseId:String(form.get('fromWarehouseId')??''),toWarehouseId:String(form.get('toWarehouseId')??''),quantity:Number(form.get('quantity')),reason:String(form.get('reason')??'').trim(),reference:String(form.get('reference')??'').trim(),requestKey:String(form.get('requestKey')??'')};
 if(!value.productId||!value.fromWarehouseId||!value.toWarehouseId||value.fromWarehouseId===value.toWarehouseId)throw new Error('Choose a product and two different warehouses.');
 if(!Number.isSafeInteger(value.quantity)||value.quantity<=0||value.quantity>1000000)throw new Error('Enter a positive whole quantity up to 1,000,000.');
 if(!value.reason||value.reason.length>1000||value.reference.length>150||!value.requestKey||value.requestKey.length>100)throw new Error('Enter a reason and a valid movement reference.');
 return value;
}
/** A completed transfer is two immutable movements, in the same transaction as balances and audit. */
export async function postTransfer(session:Session,value:StockTransfer) {
 for(let attempt=0;attempt<3;attempt++) {
  try {
   await db.$transaction(async tx=>{
    const organisationId=session.organisationId;
    const prior=await tx.inventoryMovement.findMany({where:{organisationId,requestKey:{in:[`${value.requestKey}:out`,`${value.requestKey}:in`]}}});
    if(prior.length) {
     const out=prior.find(m=>m.requestKey===`${value.requestKey}:out`),incoming=prior.find(m=>m.requestKey===`${value.requestKey}:in`);
     if(out&&!incoming&&out.productId===value.productId&&out.warehouseId===value.fromWarehouseId&&out.delta===-value.quantity){
      const open=await tx.internalMove.findUnique({where:{organisationId_requestKey:{organisationId,requestKey:value.requestKey}}});
      if(open&&open.toWarehouseId===value.toWarehouseId&&open.quantity===value.quantity)return;
     }
     if(!out||!incoming||out.productId!==value.productId||incoming.productId!==value.productId||out.warehouseId!==value.fromWarehouseId||incoming.warehouseId!==value.toWarehouseId||out.delta!==-value.quantity||incoming.delta!==value.quantity||out.reference!==value.reference||out.reason!==`Transfer out · ${value.reason}`||incoming.reason!==`Transfer in · ${value.reason}`)throw new Error('This request was already used for a different movement.');
     return;
    }
    await tx.product.findFirstOrThrow({where:{id:value.productId,organisationId,kind:'PRODUCT',active:true}});
    const warehouses=await tx.warehouse.findMany({where:{organisationId,id:{in:[value.fromWarehouseId,value.toWarehouseId]}},select:{id:true,siteId:true}});
    if(warehouses.length!==2)throw new Error('Both warehouses must belong to your workspace.');
    const from=warehouses.find(item=>item.id===value.fromWarehouseId),to=warehouses.find(item=>item.id===value.toWarehouseId);
    if(from&&to&&moveTiming(from.siteId,to.siteId)==='transit'){
     const priorMove=await tx.internalMove.findUnique({where:{organisationId_requestKey:{organisationId,requestKey:value.requestKey}}});
     if(priorMove){
      if(priorMove.productId!==value.productId||priorMove.fromWarehouseId!==value.fromWarehouseId||priorMove.toWarehouseId!==value.toWarehouseId||priorMove.quantity!==value.quantity)throw new Error('This request was already used for a different movement.');
      return;
     }
     const issued=await tx.inventoryBalance.updateMany({where:{organisationId,warehouseId:value.fromWarehouseId,productId:value.productId,quantity:{gte:value.quantity}},data:{quantity:{decrement:value.quantity}}});
     if(issued.count!==1)throw new Error('The source warehouse does not have enough stock.');
     if(tx.stockPosition){
      const positions=await tx.stockPosition.findMany({where:{organisationId,warehouseId:value.fromWarehouseId,productId:value.productId,status:'AVAILABLE',quantity:{gt:0}},orderBy:{quantity:'desc'}});
      let left=value.quantity;
      for(const row of positions){if(!left)break;const take=Math.min(row.quantity,left);await tx.stockPosition.update({where:{id:row.id},data:{quantity:{decrement:take}}});left-=take;}
     }
     const count=await tx.internalMove.count({where:{organisationId}});
     const move=await tx.internalMove.create({data:{organisationId,reference:`MV-${String(count+1).padStart(4,'0')}`,productId:value.productId,fromWarehouseId:value.fromWarehouseId,toWarehouseId:value.toWarehouseId,quantity:value.quantity,reason:value.reason,requestKey:value.requestKey,actorUserId:session.userId}});
     await tx.inventoryMovement.create({data:{organisationId,warehouseId:value.fromWarehouseId,productId:value.productId,delta:-value.quantity,reason:`In transit · ${value.reason}`,reference:move.reference,requestKey:`${value.requestKey}:out`,actorUserId:session.userId}});
     await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'stock.transferred',entityType:'InternalMove',entityId:move.id,after:{productId:value.productId,fromWarehouseId:value.fromWarehouseId,toWarehouseId:value.toWarehouseId,quantity:value.quantity,status:'IN_TRANSIT'}}});
     return;
    }
    const issued=await tx.inventoryBalance.updateMany({where:{organisationId,warehouseId:value.fromWarehouseId,productId:value.productId,quantity:{gte:value.quantity}},data:{quantity:{decrement:value.quantity}}});
    if(issued.count!==1)throw new Error('The source warehouse does not have enough stock.');
    await tx.inventoryBalance.upsert({where:{warehouseId_productId:{warehouseId:value.toWarehouseId,productId:value.productId}},create:{organisationId,warehouseId:value.toWarehouseId,productId:value.productId,quantity:value.quantity},update:{quantity:{increment:value.quantity}}});
    const positioned=await tx.stockPosition.findFirst({where:{organisationId,warehouseId:value.toWarehouseId,productId:value.productId,status:'AVAILABLE'},orderBy:{quantity:'desc'}});
    if(positioned)await tx.stockPosition.update({where:{id:positioned.id},data:{quantity:{increment:value.quantity}}});
    const out=await tx.inventoryMovement.create({data:{organisationId,warehouseId:value.fromWarehouseId,productId:value.productId,delta:-value.quantity,reason:`Transfer out · ${value.reason}`,reference:value.reference,requestKey:`${value.requestKey}:out`,actorUserId:session.userId}});
    await tx.inventoryMovement.create({data:{organisationId,warehouseId:value.toWarehouseId,productId:value.productId,delta:value.quantity,reason:`Transfer in · ${value.reason}`,reference:value.reference,requestKey:`${value.requestKey}:in`,actorUserId:session.userId}});
    await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'stock.transferred',entityType:'InventoryMovement',entityId:out.id,after:{productId:value.productId,fromWarehouseId:value.fromWarehouseId,toWarehouseId:value.toWarehouseId,quantity:value.quantity,reason:value.reason,reference:value.reference}}});
   },{isolationLevel:'Serializable'});
   return;
  } catch(error) {
   if(attempt<2&&typeof error==='object'&&error!==null&&'code' in error&&['P2034','P2002'].includes(String(error.code)))continue;
   throw error;
  }
 }
}

export async function receiveInternalMove(session: Session, moveId: string) {
 return db.$transaction(async tx => {
  const move = await tx.internalMove.findFirst({ where: { id: moveId, organisationId: session.organisationId } });
  if (!move) throw new Error("That move is not in this company.");
  if (move.status === "RECEIVED") return;
  if (move.status !== "IN_TRANSIT") throw new Error("That move is no longer in transit.");
  await tx.inventoryBalance.upsert({ where: { warehouseId_productId: { warehouseId: move.toWarehouseId, productId: move.productId } }, create: { organisationId: session.organisationId, warehouseId: move.toWarehouseId, productId: move.productId, quantity: move.quantity }, update: { quantity: { increment: move.quantity } } });
  const locationId = move.toLocationId ?? (await tx.stockLocation.findFirst({ where: { organisationId: session.organisationId, warehouseId: move.toWarehouseId, active: true }, orderBy: { sequence: "asc" } }))?.id;
  if (locationId) {
   await tx.stockPosition.upsert({
    where: { warehouseId_locationId_productId_lotId_status: { warehouseId: move.toWarehouseId, locationId, productId: move.productId, lotId: "", status: "AVAILABLE" } },
    create: { organisationId: session.organisationId, warehouseId: move.toWarehouseId, locationId, productId: move.productId, quantity: move.quantity },
    update: { quantity: { increment: move.quantity } },
   });
  }
  await tx.inventoryMovement.create({ data: { organisationId: session.organisationId, warehouseId: move.toWarehouseId, productId: move.productId, delta: move.quantity, reason: `Received · ${move.reason}`, reference: move.reference, requestKey: `${move.requestKey}:in`, actorUserId: session.userId } });
  await tx.internalMove.update({ where: { id: move.id }, data: { status: "RECEIVED", receivedAt: new Date(), toLocationId: locationId } });
  return { productId: move.productId, warehouseId: move.toWarehouseId, requestKey: move.requestKey };
 }, { isolationLevel: "Serializable" });
}
