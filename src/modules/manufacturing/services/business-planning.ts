import { db } from '@/core/db/client';
import type { BusinessPlanningProvider } from '@/core/planning/business';
export const manufacturingBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(request.purpose==='picker'||!session.capabilities.has('manufacturing.order.read'))return {requiredCapabilities:[]};
 const rows=await db.manufacturingOrder.findMany({where:{organisationId:session.organisationId,...(request.productIds?{productId:{in:request.productIds}}:{}),status:{notIn:['COMPLETE','CLOSED']},requiredDate:{lte:new Date(`${request.endsOn}T23:59:59Z`)}},select:{id:true,productId:true,quantity:true,plannedFinish:true,requiredDate:true},take:5001});
 if(rows.length>5000)throw Error('More than 5,000 production orders in this scope.');
 return {supply:rows.flatMap(r=>{const on=r.plannedFinish??r.requiredDate;return on?[{productId:r.productId,quantity:Number(r.quantity),on:on.toISOString().slice(0,10),type:'production' as const,href:`/manufacturing/produce/${r.id}`}]:[];}),requiredCapabilities:['manufacturing.order.read']};
};

export const publishSopDemand:NonNullable<import('@/core/modules/types').ModuleManifest['planningPublicationConsumer']>=async(session,tx,input)=>{
 if(!session.capabilities.has('manufacturing.plan.manage'))throw Error('Manufacturing plan management is required to publish demand.');
 if(input.rows.length>5000)throw Error('Publication exceeds 5,000 product periods.');
 const ids=[...new Set(input.rows.map(r=>r.productId))];
 const products=await tx.product.findMany({where:{organisationId:session.organisationId,id:{in:ids},active:true,kind:'PRODUCT',baseCurrency:input.currency},select:{id:true}});
 if(products.length!==ids.length)throw Error('A product is unavailable or uses a different currency.');
 const version=await tx.sopVersion.findFirstOrThrow({where:{id:input.versionId,organisationId:session.organisationId}});
 const previous=await tx.manufacturingDemandForecast.findMany({where:{organisationId:session.organisationId,sopVersion:{cycleId:version.cycleId,organisationId:session.organisationId}},select:{id:true,productId:true,periodStart:true}});
 const keys=new Set(input.rows.map(r=>r.productId+'|'+r.period));
 const cleared=previous.filter(r=>!keys.has(r.productId+'|'+r.periodStart.toISOString().slice(0,7))).map(r=>r.id);
 if(cleared.length)await tx.manufacturingDemandForecast.updateMany({where:{organisationId:session.organisationId,id:{in:cleared}},data:{quantity:0,sourceSopVersionId:input.versionId,notes:`Approved S&OP ${input.versionId}; previous cycle demand removed`}});
 for(const row of input.rows){if(!Number.isFinite(row.quantity)||row.quantity<0)throw Error('Approved demand contains an invalid quantity.');
 const periodStart=new Date(row.period+'-01T00:00:00Z');
 await tx.manufacturingDemandForecast.upsert({where:{organisationId_productId_periodStart:{organisationId:session.organisationId,productId:row.productId,periodStart}},create:{organisationId:session.organisationId,productId:row.productId,periodStart,quantity:row.quantity,sourceSopVersionId:input.versionId,notes:`Approved S&OP ${input.versionId}; confirmed orders consume this total`,createdByUserId:session.userId},update:{quantity:row.quantity,sourceSopVersionId:input.versionId,notes:`Approved S&OP ${input.versionId}; confirmed orders consume this total`}});
 }
};
