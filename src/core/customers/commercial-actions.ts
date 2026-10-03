"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
export async function saveOrderingPreferences(form:FormData) {
 const session=await requireSession();
 assertCapability(session,CUSTOMER_CAPABILITIES.commercialManage);
 const partyId=String(form.get('partyId')??''),priceList=String(form.get('priceList')??'')||null;
 await db.party.findFirstOrThrow({where:{id:partyId,organisationId:session.organisationId}});
 if(priceList)await db.priceList.findFirstOrThrow({where:{id:priceList,organisationId:session.organisationId}});
 const data={priceList,customerPoRequired:form.get('customerPoRequired')==='on',orderReferenceRequired:form.get('orderReferenceRequired')==='on',partialShipmentAllowed:form.get('partialShipmentAllowed')==='on',backordersAllowed:form.get('backordersAllowed')==='on'};
 await db.$transaction(async tx=>{
  await tx.customerCommercialSettings.upsert({where:{partyId},create:{partyId,...data},update:data});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'customer.ordering.updated',entityType:'Party',entityId:partyId,after:data}});
 });
 revalidatePath(`/customers/${partyId}`);
}
