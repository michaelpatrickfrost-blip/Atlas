import { db } from '@/core/db/client';
import type { TemplateContextProvider, TemplateRecord } from '@/core/templates/types';
import { assertCapability } from '@/core/permissions/check';
import { formatMoney } from '@/core/shared/money';
async function records(s:Parameters<TemplateContextProvider['list']>[0],type:string,id?:string):Promise<TemplateRecord[]>{
 if(!['quote','order'].includes(type))return [];assertCapability(s,`sales.${type}.read`);const where={organisationId:s.organisationId,...(id?{id}:{})};
 if(type==='quote')return (await db.quote.findMany({where,select:{id:true,reference:true,partyId:true,totalAmount:true,totalCurrency:true,createdAt:true},orderBy:{createdAt:'desc'},take:id?1:200})).map(r=>({id:r.id,type,label:r.reference,href:`/sales/quotes/${r.id}`,partyId:r.partyId,fields:{'record.name':r.reference,'record.reference':r.reference,'record.value':formatMoney(r.totalAmount,r.totalCurrency),'record.currency':r.totalCurrency,'record.date':r.createdAt.toLocaleDateString('en-GB')}}));
 return (await db.salesOrder.findMany({where,select:{id:true,reference:true,partyId:true,grossAmount:true,currency:true,orderDate:true},orderBy:{createdAt:'desc'},take:id?1:200})).map(r=>({id:r.id,type,label:r.reference,href:`/sales/orders/${r.id}`,partyId:r.partyId,fields:{'record.name':r.reference,'record.reference':r.reference,'record.value':formatMoney(r.grossAmount,r.currency),'record.currency':r.currency,'record.date':r.orderDate.toLocaleDateString('en-GB')}}));
}
export const salesTemplateContext:TemplateContextProvider={types:[{id:'quote',label:'Quotation',capability:'sales.quote.read'},{id:'order',label:'Sales order',capability:'sales.order.read'}],list:records,async get(s,type,id){return (await records(s,type,id))[0]??null;}};
