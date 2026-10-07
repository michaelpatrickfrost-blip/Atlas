import { describe,it,expect,vi,beforeEach } from 'vitest';
vi.mock('@/core/modules/access',()=>({assertModuleEnabled:vi.fn()}));
import { validatePurchase } from '@/modules/service/services/purchase';
import type { Session } from '@/core/auth/session';
import type { Prisma } from '@/generated/prisma/client';
const tx={salesOrder:{findFirst:vi.fn()},product:{findFirst:vi.fn()},shipment:{findFirst:vi.fn()}};
const session={organisationId:'org',capabilities:new Set(['sales.order.read','core.products.read','logistics.shipment.read'])} as Session;
const form=(data:Record<string,string>)=>{const f=new FormData();Object.entries(data).forEach(([k,v])=>f.set(k,v));return f;};
const call=(data:Record<string,string>)=>validatePurchase(tx as unknown as Prisma.TransactionClient,session,'customer',form(data));
beforeEach(()=>{vi.resetAllMocks();tx.salesOrder.findFirst.mockResolvedValue({id:'order',lines:[{id:'line',productId:'pipes',orderedQuantity:4000,cancelledQuantity:0,unitOfMeasure:'each'}]});tx.product.findFirst.mockResolvedValue({id:'pipes'});tx.shipment.findFirst.mockResolvedValue({sources:[{salesOrderId:'order',quantity:4000,line:{salesOrderLineId:'line'}}]});});
describe('case purchase context',()=>{
 it('retains order, derived product, delivery and affected quantity',async()=>expect(await call({salesOrderId:'order',salesOrderLineId:'line',productId:'pipes',shipmentId:'delivery',affectedQuantity:'250'})).toMatchObject({salesOrderId:'order',productId:'pipes',shipmentId:'delivery',affectedQuantity:250,purchaseVerified:true}));
 it('scopes the order to this customer and tenant',async()=>{await call({salesOrderId:'order'});expect(tx.salesOrder.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:{id:'order',organisationId:'org',partyId:'customer'}}));});
 it('rejects a product not on the order line',async()=>await expect(call({salesOrderId:'order',salesOrderLineId:'line',productId:'other'})).rejects.toThrow('product must come'));
 it('rejects a delivery not containing the selected order line',async()=>{tx.shipment.findFirst.mockResolvedValue({sources:[]});await expect(call({salesOrderId:'order',salesOrderLineId:'line',productId:'pipes',shipmentId:'other'})).rejects.toThrow('delivery does not contain');});
 it('rejects affected quantity above the delivered quantity',async()=>{tx.shipment.findFirst.mockResolvedValue({sources:[{salesOrderId:'order',quantity:100,line:{salesOrderLineId:'line'}}]});await expect(call({salesOrderId:'order',salesOrderLineId:'line',productId:'pipes',shipmentId:'delivery',affectedQuantity:'250'})).rejects.toThrow('exceeds the quantity');});
 it('permits a manual product complaint while marking the purchase unverified',async()=>expect(await call({productId:'pipes'})).toMatchObject({productId:'pipes',purchaseVerified:false,salesOrderId:''}));
 it('rejects invalid affected quantity',async()=>await expect(call({affectedQuantity:'-1'})).rejects.toThrow('positive whole'));
});
