"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {salesPolicySchema} from "@/modules/sales/services/sales-policy";
import {db} from '@/core/db/client';
import {revalidatePath} from 'next/cache';
export async function saveCreationPolicy(form:FormData){
 const session=await requireSession();
 assertCapability(session,'core.modules.manage');
 await assertModuleEnabled(session,'sales');
 const salesPolicy=salesPolicySchema.parse({discountLimit:Number(form.get('discountLimit')),valueLimits:Object.fromEntries(['GBP','EUR','USD'].map(currency=>[currency,Math.round(Number(form.get('limit'+currency))*100)])),orderFields:{customerPo:form.get('fieldCustomerPo')==='on',requestedDelivery:form.get('fieldRequestedDelivery')==='on',promisedDelivery:form.get('fieldPromisedDelivery')==='on'},pointers:{completeSale:form.get('pointerCompleteSale')==='on',completeDelivery:form.get('pointerCompleteDelivery')==='on',mayStillBeDone:form.get('pointerMayStillBeDone')==='on'}});
 const data={salesPolicy,allowProductCreation:form.get('allowProductCreation')==='on',allowCustomerCreation:form.get('allowCustomerCreation')==='on'};
 await db.$transaction(async tx=>{const before=await tx.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{allowProductCreation:true,allowCustomerCreation:true,salesPolicy:true}});await tx.organisation.update({where:{id:session.organisationId},data});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sales.creation_policy.updated',entityType:'Organisation',entityId:session.organisationId,before,after:data}});});for(const path of ['/sales/settings','/sales/orders','/sales/quotes','/customers','/logistics','/products','/customers/new'])revalidatePath(path);
}
