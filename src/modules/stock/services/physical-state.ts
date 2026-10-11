import { db } from "@/core/db/client";
import { addQuantity } from "@/core/shared/quantity";
import { eligiblePositions } from "../domain/eligibility";

/** Internal tenant-scoped physical projection; caller owns its operational read permission. */
export async function physicalStockState(organisationId:string){
 const [balances,positions,reservations,lots,holds,products]=await Promise.all([
  db.inventoryBalance.findMany({where:{organisationId}}),
  db.stockPosition.findMany({where:{organisationId}}),
  db.stockReservation.findMany({where:{organisationId,status:"ACTIVE"}}),
  db.stockLot.findMany({where:{organisationId}}),
  db.qualityHold.findMany({where:{organisationId,status:"ACTIVE"}}),
  db.product.findMany({where:{organisationId},select:{id:true,trackingMode:true}}),
 ]);
 const modes=new Map(products.map(row=>[row.id,row.trackingMode]));
 const result=new Map<string,{onHand:number;reserved:number;held:number;pickable:number}>();
 for(const balance of balances){
  const row=result.get(balance.productId)??{onHand:0,reserved:0,held:0,pickable:0};
  const warehousePositions=positions.filter(position=>position.productId===balance.productId&&position.warehouseId===balance.warehouseId);
  const productHolds=holds.filter(hold=>hold.productId===balance.productId&&(!hold.warehouseId||hold.warehouseId===balance.warehouseId));
  const eligible=eligiblePositions(warehousePositions.map(position=>({...position,quantity:Number(position.quantity)})),lots.filter(lot=>lot.productId===balance.productId),productHolds,modes.get(balance.productId)??"NONE");
  const physical=Number(balance.quantity);
  const eligibleQuantity=warehousePositions.length?Math.min(physical,eligible.reduce((sum,position)=>addQuantity(sum,position.quantity),0)):(modes.get(balance.productId)??"NONE")==="NONE"&&!productHolds.length?physical:0;
  const reserved=reservations.filter(reservation=>reservation.productId===balance.productId&&reservation.warehouseId===balance.warehouseId).reduce((sum,reservation)=>addQuantity(sum,Number(reservation.quantity)),0);
  row.onHand=addQuantity(row.onHand,physical);row.reserved=addQuantity(row.reserved,reserved);row.held=addQuantity(row.held,physical,-eligibleQuantity);row.pickable=addQuantity(row.pickable,Math.max(0,addQuantity(eligibleQuantity,-reserved)));
  result.set(balance.productId,row);
 }
 return result;
}
