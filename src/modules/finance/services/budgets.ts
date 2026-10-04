import type {Prisma} from '@/generated/prisma/client';
import {convert} from '../domain/money';
import {budgetPosition} from '../domain/controls';
export async function budgetUsage(tx:Prisma.TransactionClient,organisationId:string,entityId:string,department:string|null,at:Date){const entity=await tx.financeEntity.findFirstOrThrow({where:{id:entityId,organisationId}}),budgets=await tx.financeBudget.findMany({where:{organisationId,entityId,startAt:{lte:at},endAt:{gte:at},OR:[{department:null},{department}]}}),positions=[];
 for(const budget of budgets){const docs=await tx.financeDocument.findMany({where:{organisationId,entityId,documentDate:{gte:budget.startAt,lte:budget.endAt},...(budget.department?{department:budget.department}:{}),kind:{in:['AP_INVOICE','AP_CREDIT','EXPENSE','PO','REQUEST']},status:{in:['POSTED','APPROVED','PART_RECEIVED','RECEIVED']}},include:{children:{where:{status:{in:['APPROVED','PART_RECEIVED','RECEIVED','POSTED']}}}}});let actual=0n,committed=0n;
 for(const doc of docs){const amount=convert(doc.net,doc.exchangeRate.toString(),doc.currency,entity.currency);if(doc.status==='POSTED'&&['AP_INVOICE','AP_CREDIT','EXPENSE'].includes(doc.kind))actual+=doc.kind==='AP_CREDIT'?-amount:amount;if(doc.kind==='PO'){const billed=doc.children.filter(d=>d.kind==='AP_INVOICE'&&d.status==='POSTED').reduce((s,d)=>s+convert(d.net,d.exchangeRate.toString(),d.currency,entity.currency),0n);committed+=amount>billed?amount-billed:0n;}if(doc.kind==='REQUEST'&&doc.status==='APPROVED'&&!doc.children.some(d=>d.kind==='PO'))committed+=amount;}
 positions.push({...budget,...budgetPosition(budget.amount,actual,committed),currency:entity.currency});}return positions;}
/** Only additional outgoing commitments consume available budget; matched bills
 * replace their reserved PO commitment rather than reserving the same spend twice. */
export async function incrementalBudgetSpend(tx:Prisma.TransactionClient,doc:{organisationId:string;entityId:string;kind:string;sourceId:string|null;net:bigint;exchangeRate:{toString():string};currency:string},baseCurrency:string){
 if(!['REQUEST','PO','AP_INVOICE','AP_DEBIT','EXPENSE'].includes(doc.kind))return 0n;
 const requested=convert(doc.net,doc.exchangeRate.toString(),doc.currency,baseCurrency);
 if(doc.kind==='AP_INVOICE'&&doc.sourceId){const po=await tx.financeDocument.findFirst({where:{id:doc.sourceId,organisationId:doc.organisationId,entityId:doc.entityId,kind:'PO',status:{in:['APPROVED','PART_RECEIVED','RECEIVED']}},include:{children:{where:{kind:'AP_INVOICE',status:'POSTED'}}}});if(po){const booked=po.children.reduce((s,d)=>s+convert(d.net,d.exchangeRate.toString(),d.currency,baseCurrency),0n),ordered=convert(po.net,po.exchangeRate.toString(),po.currency,baseCurrency),remaining=ordered>booked?ordered-booked:0n;return requested>remaining?requested-remaining:0n;}}
 return requested;
}
