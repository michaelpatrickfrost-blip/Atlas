import { db } from '@/core/db/client';
import type { BusinessPlanningProvider } from '@/core/planning/business';
export const stockBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(request.purpose==='picker'||!session.capabilities.has('stock.read'))return {requiredCapabilities:[]};
 const [balances,holds]=await Promise.all([
 db.inventoryBalance.groupBy({by:['productId'],where:{...(request.productIds?{productId:{in:request.productIds}}:{}),organisationId:session.organisationId},_sum:{quantity:true}}),
 db.qualityHold.groupBy({by:['productId'],where:{...(request.productIds?{productId:{in:request.productIds}}:{}),organisationId:session.organisationId,status:'ACTIVE'},_sum:{quantity:true}})
 ]);
 const held=new Map(holds.map(h=>[h.productId,Number(h._sum.quantity??0)]));
 return {stock:balances.map(b=>({productId:b.productId,quantity:Math.max(0,(b._sum.quantity??0)-(held.get(b.productId)??0))})),requiredCapabilities:['stock.read']};
};
