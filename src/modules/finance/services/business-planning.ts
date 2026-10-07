import { db } from '@/core/db/client';
import type { BusinessPlanningProvider } from '@/core/planning/business';
export const financeBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(request.purpose==='picker'||!session.capabilities.has('finance.planning.read'))return {requiredCapabilities:[]};
 const rows=await db.financeBudget.findMany({where:{organisationId:session.organisationId,startAt:{lte:new Date(request.endsOn)},endAt:{gte:new Date(request.startsOn)}},select:{id:true,name:true,amount:true,startAt:true,endAt:true,entity:{select:{currency:true}}},take:501});
 if(rows.length>500)throw Error('Narrow the financial review to fewer than 500 budgets.');
 return {budgets:rows.map(b=>({id:b.id,name:b.name,amountMinor:Number(b.amount),currency:b.entity.currency,startsOn:b.startAt.toISOString().slice(0,10),endsOn:b.endAt.toISOString().slice(0,10)})),requiredCapabilities:['finance.planning.read']};
};
