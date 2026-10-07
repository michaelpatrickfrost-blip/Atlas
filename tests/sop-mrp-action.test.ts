import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
 db: Object.fromEntries(['salesOrderLine','manufacturingDemandForecast','fulfilmentLine','manufacturingOrder','manufacturingPlanningRun','manufacturingSupplySuggestion','productOperation'].map(name => [name,{findMany:vi.fn(),groupBy:vi.fn(),create:vi.fn(),update:vi.fn()}])),
 assert:vi.fn(), enabled:vi.fn(), available:vi.fn(),
}));
vi.mock('@/core/db/client',()=>({db:state.db}));
vi.mock('@/core/auth/session',()=>({requireSession:vi.fn(async()=>({organisationId:'org',userId:'planner'}))}));
vi.mock('@/core/permissions/check',()=>({assertCapability:state.assert}));
vi.mock('@/core/modules/access',()=>({assertModuleEnabled:state.enabled}));
vi.mock('@/core/modules/registry',()=>({getModule:()=>({stockProvider:{getAvailability:async()=>({available:0})}})}));
vi.mock('@/modules/stock/services/availability',()=>({readAvailability:state.available}));
vi.mock('@/core/audit/log',()=>({writeAudit:vi.fn()}));
vi.mock('@/core/activity/log',()=>({writeActivity:vi.fn()}));
import {runMrp} from '@/modules/manufacturing/services/mrp';
const month=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1));
const product={id:'p',name:'Product',definitions:[{id:'def'}]};
const line=(id:string,status:string,quantity:number)=>({id,productId:'p',product,orderedQuantity:quantity,cancelledQuantity:0,requestedDeliveryDate:null,promisedDeliveryDate:null,order:{reference:id,commercialStatus:status,requestedDeliveryDate:month,promisedDeliveryDate:null,party:{name:'Customer'}}});
beforeEach(()=>{
 vi.clearAllMocks();
 for(const model of Object.values(state.db)){model.findMany.mockResolvedValue([]);model.groupBy.mockResolvedValue([]);model.create.mockResolvedValue({id:'run'});model.update.mockResolvedValue({});}
 state.available.mockResolvedValue({products:[],deliveredByLine:{}});
 state.db.manufacturingDemandForecast.findMany.mockResolvedValue([{id:'forecast',productId:'p',product,quantity:1000,periodStart:month,sourceSopVersionId:'approved'}]);
});
describe('Manufacturing screen consumes published S&OP totals',()=>{
 it('nets gross closed and partly shipped bookings once while retaining open demand',async()=>{
  state.db.salesOrderLine.findMany.mockResolvedValue([line('open','CONFIRMED',400),line('closed','CLOSED',100)]);
  state.db.fulfilmentLine.groupBy.mockResolvedValue([{salesOrderLineId:'open',_sum:{shippedQuantity:200}}]);
  await runMrp();
  const data=state.db.manufacturingSupplySuggestion.create.mock.calls[0][0].data;
  expect(data.quantity).toBe(700);
  expect(data.pegging).toEqual(expect.arrayContaining([expect.objectContaining({sourceType:'FORECAST',quantity:500}),expect.objectContaining({sourceType:'SALES_ORDER',quantity:200})]));
  expect(state.db.manufacturingDemandForecast.findMany.mock.calls[0][0].where.periodStart.gte).toEqual(month);
  expect(state.assert.mock.calls.map(c=>c[1])).toEqual(expect.arrayContaining(['manufacturing.plan.manage','sales.order.read','customers.read']));
 });
 it('retains excess firm bookings and never creates negative forecast demand',async()=>{
  state.db.salesOrderLine.findMany.mockResolvedValue([line('open','ON_HOLD',1200)]);
  await runMrp();
  expect(state.db.manufacturingSupplySuggestion.create.mock.calls[0][0].data.quantity).toBe(1200);
 });
 it('fails visibly when an authoritative source query fails',async()=>{
  state.db.salesOrderLine.findMany.mockRejectedValue(new Error('Source unavailable'));
  await expect(runMrp()).rejects.toThrow('Source unavailable');
  expect(state.db.manufacturingPlanningRun.create).not.toHaveBeenCalled();
 });
});
