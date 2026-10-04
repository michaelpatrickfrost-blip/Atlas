"use server";
import {projectScope} from "@/core/permissions/work-access";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";
import { deleteQuote } from "@/modules/sales/services/commands";
export async function createQuote(form:FormData) {
 const session=await requireSession();
 assertCapability(session,SALES_CAPABILITIES.quoteCreate);
  await assertModuleEnabled(session, "sales");
 const partyId=String(form.get("partyId"));
 const customer=await db.party.findFirstOrThrow({where:{id:partyId,organisationId:session.organisationId},include:{addresses:true,parent:true,children:true}});
 const opportunityId=String(form.get("opportunityId")??"")||null, projectId=String(form.get("projectId")??"")||null;
 if(opportunityId) await db.opportunity.findFirstOrThrow({where:{id:opportunityId,partyId,organisationId:session.organisationId}});
 if(projectId) await db.project.findFirstOrThrow({where:{AND:[projectScope(session),{id:projectId,partyId}]}});
 const allowed=[partyId,...customer.children.filter(c=>c.organisationId===session.organisationId).map(c=>c.id),...(customer.parent?.organisationId===session.organisationId ? [customer.parent.id]:[])];
 const addresses=await db.address.findMany({where:{partyId:{in:allowed},active:true,party:{organisationId:session.organisationId}}});
 function address(field:string,kind:"BILLING"|"DELIVERY") {
  const id=String(form.get(field)??"");
  if(!id) return undefined;
  const a=addresses.find(a=>a.id===id && (a.type===kind || (kind==="BILLING" ? a.isDefaultBilling : a.isDefaultDelivery)));
  if(!a) throw new Error("Choose an address from this customer or its immediate account hierarchy.");
  return {addressId:a.id,partyId:a.partyId,label:a.label,line1:a.line1,line2:a.line2,city:a.city,region:a.region,postcode:a.postcode,country:a.country,deliveryInstructions:a.deliveryInstructions};
 }
 const currency=String(form.get("currency")??customer.preferredCurrency);
 if(!/^[A-Z]{3}$/.test(currency)) throw new Error("Choose a valid currency.");
 const descriptions=form.getAll("description").map(String), quantities=form.getAll("quantity").map(Number), prices=form.getAll("price").map(Number);
 const lines=descriptions.map((description,i)=>({description:description.trim(),quantity:quantities[i],unitAmount:Math.round(prices[i]*100)})).filter(l=>l.description);
 if(!lines.length || lines.length>50 || lines.some(l=>l.description.length>1000 || !Number.isInteger(l.quantity) || l.quantity<1 || !Number.isSafeInteger(l.unitAmount) || l.unitAmount<0)) throw new Error("Add at least one line with a whole quantity and valid price.");
 const totalAmount=lines.reduce((s,l)=>s+l.quantity*l.unitAmount,0);
 if(!Number.isSafeInteger(totalAmount)||totalAmount>2147483647) throw new Error("Quote total is too large.");
 const quote=await db.quote.create({data:{organisationId:session.organisationId,partyId,opportunityId,projectId,reference:`Q-${crypto.randomUUID().slice(0,8).toUpperCase()}`,totalCurrency:currency,totalAmount,invoiceAddressSnapshot:address("invoiceAddressId","BILLING"),deliveryAddressSnapshot:address("deliveryAddressId","DELIVERY"),lines:{create:lines}}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:"quote.created",entityType:"Quote",entityId:quote.id});
 revalidatePath("/sales/quotes");
 redirect(`/sales/quotes/${quote.id}`);
}

export async function deleteQuoteForm(quoteId: string) {
 await deleteQuote(quoteId);
 redirect('/sales/quotes');
}
