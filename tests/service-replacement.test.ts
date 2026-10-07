import {beforeEach,describe,expect,it,vi} from 'vitest';
import type {Session} from '@/core/auth/session';
import type {Prisma} from '@/generated/prisma/client';
vi.mock('@/core/service-work/engine',()=>({workNumber:async()=> 'SR-000001'}));
import {requestServiceReplacement} from '@/modules/sales/services/service-replacement';
const source={id:'order',currency:'GBP',reference:'SO-1',invoiceAddressSnapshot:null,deliveryAddressSnapshot:{country:'GB'},lines:[{id:'line',productId:'product',orderedQuantity:4000,cancelledQuantity:0,descriptionSnapshot:'Exempt pipes',unitOfMeasure:'each',unitPriceAmount:100,discountPercent:0,taxCategory:'EXEMPT',netAmount:400000,taxAmount:0}]};
const tx={salesOrder:{findFirst:vi.fn(),create:vi.fn()}};
const session={organisationId:'org',userId:'agent',capabilities:new Set(['sales.order.create'])} as Session;
const input={caseId:'case',caseNumber:'CS-1',partyId:'party',subject:'Damage',description:'250 damaged',requestKey:'check',context:{salesOrderId:'order',salesOrderLineId:'line',productId:'product',affectedQuantity:250}};
beforeEach(()=>{vi.resetAllMocks();tx.salesOrder.findFirst.mockResolvedValue(source);tx.salesOrder.create.mockResolvedValue({id:'replacement',reference:'SR-1'});});
describe('canonical service replacement drafts',()=>{
 it('preserves source price and exempt tax classification for affected goods',async()=>{await requestServiceReplacement(tx as unknown as Prisma.TransactionClient,session,input);expect(tx.salesOrder.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({netAmount:25000,taxAmount:0,grossAmount:25000,lines:{create:[expect.objectContaining({orderedQuantity:250,unitPriceAmount:100,taxCategory:'EXEMPT'})]}})}));});
 it('rejects a product that is not the selected original line',async()=>{await expect(requestServiceReplacement(tx as unknown as Prisma.TransactionClient,session,{...input,context:{...input.context,productId:'other'}})).rejects.toThrow('valid source');expect(tx.salesOrder.create).not.toHaveBeenCalled();});
 it('cannot replace more than the uncancelled source quantity',async()=>{await expect(requestServiceReplacement(tx as unknown as Prisma.TransactionClient,session,{...input,context:{...input.context,affectedQuantity:4001}})).rejects.toThrow('quantity');expect(tx.salesOrder.create).not.toHaveBeenCalled();});
});
