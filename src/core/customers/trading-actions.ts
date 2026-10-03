"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {db} from '@/core/db/client';
import {revalidatePath} from 'next/cache';
export async function saveCustomerTradingLink(accountId:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'customers.commercial.manage');
 const tradingAccountId=String(form.get('tradingAccountId')??''),notes=String(form.get('notes')??'').trim().slice(0,2000);
 if(!tradingAccountId||tradingAccountId===accountId)throw new Error('Choose a different trading account.');
 await db.$transaction(async tx=>{
  const parties=await tx.party.findMany({where:{organisationId:session.organisationId,id:{in:[accountId,tradingAccountId]}}});if(parties.length!==2)throw new Error('Both accounts must belong to this company.');
  const key={organisationId:session.organisationId,accountId,tradingAccountId},before=await tx.customerTradingLink.findUnique({where:{organisationId_accountId_tradingAccountId:key}});
  const link=await tx.customerTradingLink.upsert({where:{organisationId_accountId_tradingAccountId:key},create:{...key,notes},update:{active:true,notes}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'customer.trading_link.saved',entityType:'Party',entityId:accountId,before:before?{active:before.active,notes:before.notes}:undefined,after:{linkId:link.id,tradingAccountId,active:true,notes}}});
 });
 revalidatePath('/customers');revalidatePath('/sales');
}
export async function archiveCustomerTradingLink(id:string){
 const session=await requireSession();
 assertCapability(session,'customers.commercial.manage');
 await db.$transaction(async tx=>{const link=await tx.customerTradingLink.findFirstOrThrow({where:{id,organisationId:session.organisationId}});await tx.customerTradingLink.update({where:{id,organisationId:session.organisationId},data:{active:false}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'customer.trading_link.archived',entityType:'Party',entityId:link.accountId,before:{tradingAccountId:link.tradingAccountId,active:link.active},after:{active:false}}});});revalidatePath('/customers');revalidatePath('/sales');
}
