import { db } from '@/core/db/client';
import type { BusinessPlanningProvider } from '@/core/planning/business';
export const stockBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(request.purpose==='picker'||!session.capabilities.has('stock.read'))return {requiredCapabilities:[]};
 const [balances,holds,positions]=await Promise.all([
 db.inventoryBalance.groupBy({by:['productId'],where:{...(request.productIds?{productId:{in:request.productIds}}:{}),organisationId:session.organisationId},_sum:{quantity:true}}),
 db.qualityHold.groupBy({by:['productId'],where:{...(request.productIds?{productId:{in:request.productIds}}:{}),organisationId:session.organisationId,status:'ACTIVE'},_sum:{quantity:true}}),
 db.stockPosition.groupBy({by:['productId','status'],where:{...(request.productIds?{productId:{in:request.productIds}}:{}),organisationId:session.organisationId,status:{in:['QUARANTINE','BLOCKED','IN_TRANSIT']}},_sum:{quantity:true}})
 ]);
 const held=new Map(holds.map(h=>[h.productId,Number(h._sum.quantity??0)]));
 const quarantined=new Map(positions.filter(p=>p.status==='QUARANTINE').map(p=>[p.productId,p._sum.quantity??0]));
 for(const [id,quantity] of quarantined)held.set(id,Math.max(held.get(id)??0,quantity));
 for(const p of positions.filter(p=>p.status!=='QUARANTINE'))held.set(p.productId,(held.get(p.productId)??0)+(p._sum.quantity??0));
 return {stock:balances.map(b=>({productId:b.productId,quantity:Math.max(0,(b._sum.quantity??0)-(held.get(b.productId)??0))})),requiredCapabilities:['stock.read']};
};
