"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability,can} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
const schema=z.object({partyId:z.string().min(1),type:z.enum(['BILLING','DELIVERY']),label:z.string().max(100),line1:z.string().trim().min(1).max(200),line2:z.string().max(200),city:z.string().max(100),region:z.string().max(100),postcode:z.string().max(30),country:z.string().regex(/^[A-Z]{2}$/)});
export async function createSalesAddress(mode:'order'|'quote',form:FormData){
 const session=await requireSession();
 assertCapability(session,'customers.addresses.manage');
 if(!['quote','order'].includes(mode))throw new Error('Invalid sales workflow.');
 if(mode==='quote')assertCapability(session,'sales.quote.create');else if(!can(session,'sales.order.create'))assertCapability(session,'sales.order.edit_draft');
 await assertModuleEnabled(session,'sales');
 const data=schema.parse(Object.fromEntries(['partyId','type','label','line1','line2','city','region','postcode','country'].map(key=>[key,String(form.get(key)??'').trim()])));
 const party=await db.party.findFirstOrThrow({where:{id:data.partyId,organisationId:session.organisationId},select:{name:true}});
 const address=await db.$transaction(async tx=>{const a=await tx.address.create({data});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'customer.address.created_from_sales',entityType:'Address',entityId:a.id,after:{partyId:data.partyId,type:data.type,label:data.label,line1:data.line1,postcode:data.postcode,country:data.country}}});return a;});
 revalidatePath(`/customers/${data.partyId}`);revalidatePath('/sales');
 return {id:address.id,partyId:address.partyId,type:address.type,label:`${party.name} · ${address.label||address.line1} · ${address.postcode??''}`,country:address.country,defaultBilling:false,defaultDelivery:false};
}
