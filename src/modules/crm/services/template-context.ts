import { db } from '@/core/db/client';
import type { TemplateContextProvider, TemplateRecord } from '@/core/templates/types';
import { assertCapability } from '@/core/permissions/check';
import { ownerRestriction } from './visibility';
import { formatMoney } from '@/core/shared/money';
const select={id:true,name:true,partyId:true,primaryContactId:true,valueAmount:true,valueCurrency:true,expectedCloseDate:true} as const;
function record(r:{id:string;name:string;partyId:string;primaryContactId:string|null;valueAmount:number;valueCurrency:string;expectedCloseDate:Date|null}):TemplateRecord{return {id:r.id,type:'deal',label:r.name,href:`/crm/opportunities/${r.id}`,partyId:r.partyId,contactId:r.primaryContactId,fields:{'record.name':r.name,'record.reference':r.name,'record.value':formatMoney(r.valueAmount,r.valueCurrency),'record.currency':r.valueCurrency,'record.date':r.expectedCloseDate?.toLocaleDateString('en-GB')??''}};}
export const crmTemplateContext:TemplateContextProvider={types:[{id:'deal',label:'Deal',capability:'sales.opportunity.read'}],async list(s,type){assertCapability(s,'sales.opportunity.read');if(type!=='deal')return [];return (await db.opportunity.findMany({where:{organisationId:s.organisationId,ownerUserId:ownerRestriction(s)},select,orderBy:{updatedAt:'desc'},take:200})).map(record);},async get(s,type,id){assertCapability(s,'sales.opportunity.read');if(type!=='deal')return null;const r=await db.opportunity.findFirst({where:{id,organisationId:s.organisationId,ownerUserId:ownerRestriction(s)},select});return r?record(r):null;}};
