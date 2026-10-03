"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
export async function createWarehouse(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 const name=String(form.get('name')??'').trim(),code=String(form.get('code')??'').trim();
 if(!name||name.length>150||!code||code.length>30)throw new Error('Enter a warehouse name and code.');
 await db.warehouse.create({data:{organisationId:session.organisationId,name,code}});
 revalidatePath('/stock');
}
export async function adjustStock(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 const productId=String(form.get('productId')),warehouseId=String(form.get('warehouseId')),delta=Number(form.get('delta')),reason=String(form.get('reason')??'').trim(),reference=String(form.get('reference')??'').slice(0,150),requestKey=String(form.get('requestKey')??'');
 if(!Number.isInteger(delta)||delta===0||Math.abs(delta)>1000000||!reason||reason.length>1000||!requestKey||requestKey.length>100)throw new Error('Enter a non-zero whole quantity and movement reason.');
 await db.$transaction(async tx=>{
  if(await tx.inventoryMovement.findUnique({where:{organisationId_requestKey:{organisationId:session.organisationId,requestKey}}}))return;
  await tx.product.findFirstOrThrow({where:{id:productId,organisationId:session.organisationId,kind:'PRODUCT'}});
  await tx.warehouse.findFirstOrThrow({where:{id:warehouseId,organisationId:session.organisationId}});
  const balance=await tx.inventoryBalance.findUnique({where:{warehouseId_productId:{warehouseId,productId}}});
  if((balance?.quantity??0)+delta<0)throw new Error('This movement would take stock below zero.');
  await tx.inventoryBalance.upsert({where:{warehouseId_productId:{warehouseId,productId}},create:{organisationId:session.organisationId,warehouseId,productId,quantity:delta},update:{quantity:{increment:delta}}});
  const movement=await tx.inventoryMovement.create({data:{organisationId:session.organisationId,warehouseId,productId,delta,reason,reference,requestKey,actorUserId:session.userId}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'stock.adjusted',entityType:'InventoryMovement',entityId:movement.id,after:{productId,warehouseId,delta,reason}}});
 },{isolationLevel:'Serializable'});
 revalidatePath('/stock');
}
