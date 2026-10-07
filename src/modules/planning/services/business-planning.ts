import { db } from '@/core/db/client';
import type { BusinessPlanningProvider } from '@/core/planning/business';
export const productionBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(request.purpose==='picker'||!session.capabilities.has('planning.demand.read'))return {requiredCapabilities:[]};
 const lines=await db.productionPlanLine.findMany({where:{organisationId:session.organisationId,...(request.productIds?{productId:{in:request.productIds}}:{}),endsOn:{gte:new Date(request.startsOn)},startsOn:{lte:new Date(request.endsOn)}},select:{productId:true,quantity:true,endsOn:true,planId:true},take:5001});
 if(lines.length>5000)throw Error('More than 5,000 production plan lines in this scope.');
 return {supply:lines.map(l=>({productId:l.productId,quantity:Number(l.quantity),on:l.endsOn.toISOString().slice(0,10),type:'plan',href:`/planning/plans/${l.planId}`})),requiredCapabilities:['planning.demand.read']};
};
