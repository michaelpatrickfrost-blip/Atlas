import type {Prisma} from '@/generated/prisma/client';
import type {Session} from '@/core/auth/session';
import {assertBalanced,convert} from '../domain/money';
import {periodAllows} from '../domain/controls';
export type PostingLine={accountId:string;description:string;debit:bigint;credit:bigint;partyId?:string|null;projectId?:string|null;department?:string|null;costCentre?:string|null;site?:string|null;taxCode?:string|null};
export async function postLedger(tx:Prisma.TransactionClient,session:Session,input:{entityId:string;date:Date;description:string;sourceKey:string;sourceType:string;sourceId?:string;currency:string;rate:string;lines:PostingLine[];approverUserId?:string;reversalOfId?:string}){
 assertBalanced(input.lines);const organisationId=session.organisationId;
 const entity=await tx.financeEntity.findFirstOrThrow({where:{id:input.entityId,organisationId}});
 const period=await tx.financePeriod.findFirst({where:{entityId:entity.id,organisationId,startAt:{lte:input.date},endAt:{gte:input.date}}});if(!period||!periodAllows(period.state,input.sourceType))throw new Error('Accounting date is outside a permitted open period.');
 const accountIds=[...new Set(input.lines.map(l=>l.accountId))];if(await tx.financeAccount.count({where:{id:{in:accountIds},entityId:entity.id,organisationId,active:true}})!==accountIds.length)throw new Error('Journal contains a foreign, inactive or wrong-entity account.');
 const existing=await tx.financeJournal.findFirst({where:{organisationId,sourceKey:input.sourceKey}});if(existing)return existing;
 const lines=input.lines.map(l=>({...l,organisationId,transactionDebit:l.debit,transactionCredit:l.credit,debit:convert(l.debit,input.rate,input.currency,entity.currency),credit:convert(l.credit,input.rate,input.currency,entity.currency)}));
 // FX rounding must be explicit rather than hide an unbalanced posting.
 assertBalanced(lines);
 const journal=await tx.financeJournal.create({data:{organisationId,entityId:entity.id,periodId:period.id,reference:`JE-${crypto.randomUUID().slice(0,12).toUpperCase()}`,description:input.description,sourceKey:input.sourceKey,sourceType:input.sourceType,sourceId:input.sourceId,accountingDate:input.date,currency:input.currency,status:'DRAFT',creatorUserId:session.userId,approverUserId:input.approverUserId,reversalOfId:input.reversalOfId,lines:{create:lines.map(({organisationId,...line})=>{if(!organisationId)throw new Error('Missing tenant.');return line;})}}});
 await tx.financeJournal.update({where:{id:journal.id},data:{status:'POSTED',postedAt:new Date()}});
 await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'finance.journal.posted',entityType:'FinanceJournal',entityId:journal.id,after:{sourceKey:input.sourceKey,description:input.description}}});
 await tx.domainOutbox.create({data:{organisationId,eventKey:`finance.journal.posted:${journal.id}`,eventName:'finance.journal.posted',payload:{journalId:journal.id,entityId:entity.id}}});return journal;
}
export async function controls(tx:Prisma.TransactionClient,organisationId:string,entityId:string){const accounts=await tx.financeAccount.findMany({where:{organisationId,entityId,active:true,control:{not:null}}});return (key:string)=>{const found=accounts.filter(a=>a.control===key);if(found.length!==1)throw new Error(`Configure one active ${key} control account.`);return found[0].id;};}
