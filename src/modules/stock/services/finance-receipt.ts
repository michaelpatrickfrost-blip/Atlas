import type {Session} from '@/core/auth/session';
import type {Prisma} from '@/generated/prisma/client';
import type {StockReceiptInput} from '@/core/finance/connections';
import {assertCapability} from '@/core/permissions/check';
export async function receiveFinanceGoods(session:Session,tx:Prisma.TransactionClient,input:StockReceiptInput){
 assertCapability(session,'stock.manage');
 if(!Number.isSafeInteger(input.quantity)||input.quantity<=0||input.quantity>1000000)throw new Error('Inventory receipts require positive whole units up to 1,000,000.');
 const organisationId=session.organisationId,requestKey=`finance-receipt:${input.receiptLineId}`;
 const previous=await tx.inventoryMovement.findFirst({where:{organisationId,requestKey}});if(previous){if(previous.productId!==input.productId||previous.warehouseId!==input.warehouseId||previous.delta!==input.quantity)throw new Error('Receipt movement replay differs.');return previous;}
 await tx.warehouse.findFirstOrThrow({where:{id:input.warehouseId,organisationId}});await tx.product.findFirstOrThrow({where:{id:input.productId,organisationId,kind:'PRODUCT',active:true}});
 const line=await tx.financeDocumentLine.findFirstOrThrow({where:{id:input.receiptLineId,organisationId,documentId:input.receiptId,productId:input.productId,document:{kind:'RECEIPT',status:'DRAFT'}}});if(Number(line.quantity)-Number(line.damagedQuantity)!==input.quantity)throw new Error('Inventory acceptance must match the Finance receipt.');
 await tx.inventoryBalance.upsert({where:{warehouseId_productId:{warehouseId:input.warehouseId,productId:input.productId}},create:{organisationId,warehouseId:input.warehouseId,productId:input.productId,quantity:input.quantity},update:{quantity:{increment:input.quantity}}});
 const positioned=await tx.stockPosition.findFirst({where:{organisationId,warehouseId:input.warehouseId,productId:input.productId,status:'AVAILABLE'},orderBy:{quantity:'desc'}});if(positioned)await tx.stockPosition.update({where:{id:positioned.id},data:{quantity:{increment:input.quantity}}});
 const movement=await tx.inventoryMovement.create({data:{organisationId,warehouseId:input.warehouseId,productId:input.productId,delta:input.quantity,reason:'Approved purchasing receipt',reference:input.reference,requestKey,actorUserId:session.userId}});
 await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'stock.finance_receipt',entityType:'InventoryMovement',entityId:movement.id,after:{receiptId:input.receiptId,receiptLineId:input.receiptLineId,warehouseId:input.warehouseId,quantity:input.quantity}}});return movement;
}
