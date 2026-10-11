import type { Prisma } from "@/generated/prisma/client";
import { sameUnit } from "@/core/shared/measurement";

/** A stock-unit edit must not reinterpret existing quantities or historical BOMs. */
export async function assertStockUnitChange(tx: Prisma.TransactionClient, organisationId: string, productId: string, previous: string, next: string) {
  if (sameUnit(previous, next)) return;
  const references = await Promise.all([
    tx.inventoryMovement.count({ where: { organisationId, productId } }),
    tx.inventoryBalance.count({ where: { organisationId, productId, quantity: { not: 0 } } }),
    tx.stockReservation.count({ where: { organisationId, productId } }),
    tx.productBomLine.count({ where: { organisationId, componentProductId: productId } }),
    tx.productDefinition.count({ where: { organisationId, productId } }),
    tx.manufacturingOrder.count({ where: { organisationId, productId } }),
    tx.salesOrderLine.count({ where: { productId, order: { organisationId } } }),
    tx.financeDocumentLine.count({ where: { organisationId, productId } }),
  ]);
  if (references.some(Boolean)) throw new Error("This product already has stock, orders or a recipe. Keep its stock unit and use a compatible entry unit such as kg or tonnes; a new stock unit needs a separately identified product.");
}

export async function assertTrackingChange(tx:Prisma.TransactionClient,organisationId:string,productId:string,previous:string,next:string){
 if(previous===next)return;
 const [movements,balances,lots,serials]=await Promise.all([
  tx.inventoryMovement.count({where:{organisationId,productId}}),tx.inventoryBalance.count({where:{organisationId,productId,quantity:{not:0}}}),tx.stockLot.count({where:{organisationId,productId}}),tx.stockSerial.count({where:{organisationId,productId}}),
 ]);
 if(movements||balances||lots||serials)throw new Error("This item already has stock history. Keep its tracking method; identify a new product for a different tracking policy.");
}
