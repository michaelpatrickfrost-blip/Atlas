"use server";
import { withFormFeedback } from "@/core/shared/form-feedback";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { measuredQuantity } from "@/core/shared/measurement";
import { addQuantity } from "@/core/shared/quantity";
import { nextOrderNumber } from "./numbers";
import { writeAudit } from "@/core/audit/log";

export async function splitProductionOrder(form:FormData){
 const session=await requireSession();
 assertCapability(session,"manufacturing.order.create");
 assertCapability(session,"manufacturing.order.release");
 await assertModuleEnabled(session,"manufacturing");
 return withFormFeedback(async () => {
const orderId=String(form.get("orderId")??""),requestKey=String(form.get("requestKey")??""),reason=String(form.get("reason")??"").trim(),enteredUnit=String(form.get("enteredUnit")??"");
 const enteredQuantity=Number(form.get("quantity"));
 if(!orderId||!requestKey||requestKey.length>80||!reason||reason.length>500)throw new Error("Enter the quantity to split and a reason.");
 const fingerprint=createHash("sha256").update(JSON.stringify({orderId,enteredQuantity,enteredUnit,reason})).digest("hex");
 const child=await db.$transaction(async tx=>{
  const organisationId=session.organisationId;
  const prior=await tx.manufacturingOrder.findUnique({where:{organisationId_originRequestKey:{organisationId,originRequestKey:`split:${requestKey}`}}});
  if(prior){if(prior.originFingerprint!==fingerprint)throw new Error("This split reference belongs to different details.");return prior;}
  const order=await tx.manufacturingOrder.findFirstOrThrow({where:{id:orderId,organisationId},include:{workOrders:true}});
  if(!["PLANNED","READY","RELEASED"].includes(order.status)||order.workOrders.some(row=>!["WAITING","READY"].includes(row.status)||row.machineLoadId||row.locked))throw new Error("Split unstarted, unlocked orders before adding them to a machine load.");
  if(await tx.inventoryMovement.count({where:{organisationId,manufacturingOrderId:order.id}}))throw new Error("This order has material or stock history. Retain that history and use a reviewed replacement order.");
  const qty=measuredQuantity(enteredQuantity,enteredUnit||order.unitOfMeasure,order.unitOfMeasure).quantity;
  if(qty<=0||qty>=Number(order.quantity))throw new Error("The split quantity must be positive and smaller than the order quantity.");
  const changed=await tx.manufacturingOrder.updateMany({where:{id:order.id,organisationId,version:order.version},data:{quantity:addQuantity(Number(order.quantity),-qty),status:order.status==="PLANNED"?"PLANNED":"READY",plannedStart:null,plannedFinish:null,version:{increment:1}}});
  if(changed.count!==1)throw new Error("This order changed. Refresh before splitting.");
  await tx.manufacturingWorkOrder.deleteMany({where:{organisationId,productionOrderId:order.id}});
  const child=await tx.manufacturingOrder.create({data:{organisationId,originOrderId:order.id,originRequestKey:`split:${requestKey}`,originFingerprint:fingerprint,orderNumber:await nextOrderNumber(tx,organisationId),productId:order.productId,definitionId:order.definitionId,quantity:qty,unitOfMeasure:order.unitOfMeasure,warehouseId:order.warehouseId,requiredDate:order.requiredDate,sourceSalesOrderLineId:order.sourceSalesOrderLineId,notes:`Split from ${order.orderNumber}. ${reason}`,createdByUserId:session.userId}});
  await writeAudit({organisationId,actorUserId:session.userId,action:"manufacturing.order.split",entityType:"ManufacturingOrder",entityId:order.id,after:{childOrderId:child.id,splitQuantity:qty,remainingQuantity:addQuantity(Number(order.quantity),-qty),reason}},tx);
  return child;
 },{isolationLevel:"Serializable"});
 revalidatePath("/manufacturing/produce");revalidatePath(`/manufacturing/produce/${orderId}`);revalidatePath("/manufacturing/schedule");
 void child;
  });
}
