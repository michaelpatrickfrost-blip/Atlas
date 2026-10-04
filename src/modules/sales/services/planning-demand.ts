import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { db } from '@/core/db/client';
import type { Session } from '@/core/auth/session';
import type { PlanningDemand } from '@/core/planning/types';
/** Minimal operational projection. Does not expose customer, price or credit data. */
export async function planningDemand(session:Session):Promise<PlanningDemand[]> {
 assertCapability(session,'planning.demand.read');
 await assertModuleEnabled(session,'planning');
 await assertModuleEnabled(session,'sales');
 const lines=await db.salesOrderLine.findMany({
  where:{type:'PRODUCT',productId:{not:null},order:{organisationId:session.organisationId,commercialStatus:'CONFIRMED',orderType:{not:'BLANKET'}},product:{organisationId:session.organisationId,kind:'PRODUCT'}},
  select:{id:true,productId:true,orderedQuantity:true,cancelledQuantity:true,unitOfMeasure:true,requestedDeliveryDate:true,order:{select:{id:true,reference:true,requestedDeliveryDate:true}}},
 });
 return lines.map(line=>({id:line.id,productId:line.productId!,orderId:line.order.id,reference:line.order.reference,quantity:Math.max(0,line.orderedQuantity-line.cancelledQuantity),unitOfMeasure:line.unitOfMeasure,requiredDate:(line.requestedDeliveryDate??line.order.requestedDeliveryDate)?.toISOString()??null})).filter(line=>line.quantity>0);
}
