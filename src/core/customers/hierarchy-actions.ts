"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
export async function setCustomerParent(partyId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,CUSTOMER_CAPABILITIES.edit);
 const hierarchyRole=String(form.get("hierarchyRole")??"CUSTOMER");
 if(!["GROUP","CUSTOMER","BRANCH"].includes(hierarchyRole))throw new Error("Invalid hierarchy level.");
 const customerGroup=String(form.get("customerGroup")??"").trim().slice(0,100)||null;
 const parentPartyId=String(form.get("parentPartyId")??"")||null;
 await db.$transaction(async tx=>{
  const before=await tx.party.findFirstOrThrow({where:{id:partyId,organisationId:session.organisationId}});
  const seen=new Set([partyId]); let next=parentPartyId;
  while(next) {
   if(seen.has(next)) throw new Error("This parent would create a circular customer hierarchy.");
   seen.add(next);
   const parent=await tx.party.findFirstOrThrow({where:{id:next,organisationId:session.organisationId},select:{parentPartyId:true}});
   next=parent.parentPartyId;
  }
  await tx.party.update({where:{id:partyId,organisationId:session.organisationId},data:{parentPartyId,hierarchyRole,customerGroup}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"customer.parent.updated",entityType:"Party",entityId:partyId,before:{parentPartyId:before.parentPartyId,hierarchyRole:before.hierarchyRole,customerGroup:before.customerGroup},after:{parentPartyId,hierarchyRole,customerGroup}}});
 },{isolationLevel:"Serializable"});
 revalidatePath("/customers"); revalidatePath(`/customers/${partyId}`);
}
