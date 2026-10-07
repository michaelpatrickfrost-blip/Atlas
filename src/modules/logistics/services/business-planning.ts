import { db } from '@/core/db/client';
import type { BusinessPlanningProvider,BusinessPlanningData } from '@/core/planning/business';
export const logisticsBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 const result:BusinessPlanningData={requiredCapabilities:[],deliveries:[],supply:[]};
 if(request.purpose==='picker')return result;
 if(session.capabilities.has('logistics.shipment.read')){
 const sources=await db.shipmentSource.findMany({where:{organisationId:session.organisationId,...(request.productIds?{line:{productId:{in:request.productIds}}}:{}),shipment:{status:{not:'CANCELLED'}},OR:[{shipment:{createdAt:{gte:new Date(request.historyStartsOn)}}},{shipment:{dispatchedAt:{gte:new Date(request.historyStartsOn)}}},{shipment:{deliveredAt:{gte:new Date(request.historyStartsOn)}}},{requirement:{salesOrder:{organisationId:session.organisationId,commercialStatus:{in:['CONFIRMED','ON_HOLD']}}}}]},select:{id:true,salesOrderId:true,quantity:true,line:{select:{salesOrderLineId:true,productId:true}},shipment:{select:{id:true,status:true,inFull:true,plannedDispatchAt:true,dispatchedAt:true,deliveredAt:true,expectedDeliveryAt:true}}},take:5001});
 if(sources.length>5000)throw Error('More than 5,000 delivery allocations in this window. Narrow the history window.');
 result.deliveries=sources.map(s=>({id:s.id,orderId:s.salesOrderId,lineId:s.line.salesOrderLineId,productId:s.line.productId,quantity:s.quantity,deliveryQuantityVerified:s.shipment.inFull!==false,dispatchedOn:s.shipment.dispatchedAt?.toISOString().slice(0,10)??null,deliveredOn:s.shipment.deliveredAt?.toISOString().slice(0,10)??null,plannedDispatchOn:s.shipment.plannedDispatchAt?.toISOString().slice(0,10)??null,eta:s.shipment.expectedDeliveryAt?.toISOString().slice(0,10)??null,status:s.shipment.status,href:`/logistics/shipments/${s.shipment.id}`}));result.requiredCapabilities.push('logistics.shipment.read');if(sources.some(s=>s.shipment.deliveredAt&&s.shipment.inFull===false))result.warnings=['A partial delivery lacks verified per-line received quantities in Logistics. Customer delivery quantity and OTIF remain unavailable for that event.'];
 }
 if(session.capabilities.has('logistics.receipt.execute')){
 const receipts=await db.receiptLine.findMany({where:{organisationId:session.organisationId,productId:request.productIds?{in:request.productIds}:{not:null},receipt:{organisationId:session.organisationId,status:{notIn:['CANCELLED','RECEIVED']},expectedOn:{gte:new Date(request.startsOn),lte:new Date(request.endsOn)}}},select:{productId:true,expectedQuantity:true,receivedQuantity:true,receipt:{select:{id:true,expectedOn:true}}},take:5001});
 if(receipts.length>5000)throw Error('More than 5,000 expected receipt lines in this scope.');
 result.supply=receipts.flatMap(r=>r.receipt.expectedOn?[{productId:r.productId!,quantity:Math.max(0,r.expectedQuantity-r.receivedQuantity),on:r.receipt.expectedOn.toISOString().slice(0,10),type:'receipt',href:`/logistics/receipts/${r.receipt.id}`}]:[]);result.requiredCapabilities.push('logistics.receipt.execute');
 }
 return result;
};
