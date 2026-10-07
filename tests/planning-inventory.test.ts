import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCoverage } from '@/modules/planning/domain/netting';
import type { InventorySnapshot, PlanningDemand } from '@/core/planning/types';
const snapshot:InventorySnapshot={products:[{id:'p',code:'P',name:'Product',unitOfMeasure:'each',active:true}],warehouses:[{id:'a',code:'A',name:'A'},{id:'b',code:'B',name:'B'}],balances:[{id:'b1',productId:'p',warehouseId:'a',quantity:30},{id:'b2',productId:'p',warehouseId:'b',quantity:20}]};
const demand=(id:string,quantity:number,requiredDate:string|null,unitOfMeasure='each'):PlanningDemand=>({id,productId:'p',orderId:id,reference:id,quantity,requiredDate,unitOfMeasure});
describe('physical demand coverage',()=>{
 it('uses stock once, prioritises earliest demand, and leaves undated demand last',()=>{
  const [result]=buildCoverage(snapshot,[demand('undated',10,null),demand('late',40,'2026-10-20'),demand('early',30,'2026-10-10')]);
  expect(result.onHand).toBe(50);expect(result.demand).toBe(80);expect(result.shortage).toBe(30);
  expect(result.orders.map(o=>[o.id,o.covered,o.shortage])).toEqual([['early',30,0],['late',20,20],['undated',0,10]]);
 });
 it('does not subtract incompatible pack demand from stock in each',()=>{
  const [result]=buildCoverage(snapshot,[demand('packs',100,'2026-10-10','pack'),demand('each',25,'2026-10-11')]);
  expect(result.unitConflicts).toBe(1);expect(result.demand).toBe(25);expect(result.projected).toBe(25);
  expect(result.orders[0].shortage).toBeNull();expect(result.orders[1].covered).toBe(25);
 });
 it('does not combine quantities between products',()=>{
  const expanded={...snapshot,products:[...snapshot.products,{...snapshot.products[0],id:'other'}]};
  const results=buildCoverage(expanded,[{...demand('other',10,null),productId:'other'}]);
  expect(results.find(p=>p.id==='other')?.shortage).toBe(10);expect(results[0].onHand).toBe(50);
 });
});
const state=vi.hoisted(()=>({
 session:{userId:'u',organisationId:'org-a',capabilities:new Set<string>()},enabled:vi.fn(),
 tx:{stockPosition:{findFirst:vi.fn(),findMany:vi.fn(),update:vi.fn()},inventoryMovement:{findMany:vi.fn(),create:vi.fn()},product:{findFirstOrThrow:vi.fn()},warehouse:{findMany:vi.fn()},inventoryBalance:{updateMany:vi.fn(),upsert:vi.fn()},auditEntry:{create:vi.fn()},internalMove:{findUnique:vi.fn(),count:vi.fn(),create:vi.fn()}},transaction:vi.fn(),salesLines:vi.fn(),
}));
vi.mock('@/core/db/client',()=>({db:{$transaction:state.transaction,salesOrderLine:{findMany:state.salesLines}}}));
vi.mock('@/core/auth/session',()=>({requireSession:async()=>state.session}));
vi.mock('@/core/modules/access',()=>({assertModuleEnabled:state.enabled}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
import { parseTransfer, postTransfer } from '@/modules/stock/services/transfers';
import { transferStock } from '@/app/(app)/stock/actions';
import { planningDemand } from '@/modules/sales/services/planning-demand';
import type { Session } from '@/core/auth/session';
const session=()=>state.session as Session;
function transferForm(){const form=new FormData();for(const [key,value] of Object.entries({productId:'p',fromWarehouseId:'a',toWarehouseId:'b',quantity:'10',reason:'Rebalance',reference:'TR-1',requestKey:'request'}))form.set(key,value);return form;}
beforeEach(()=>{
 vi.clearAllMocks();state.session.capabilities=new Set(['stock.manage','planning.demand.read']);state.enabled.mockResolvedValue(undefined);
 state.transaction.mockImplementation(async fn=>fn(state.tx));state.tx.stockPosition.findFirst.mockResolvedValue(null);state.tx.stockPosition.findMany.mockResolvedValue([]);state.tx.inventoryMovement.findMany.mockResolvedValue([]);state.tx.product.findFirstOrThrow.mockResolvedValue({id:'p'});state.tx.warehouse.findMany.mockResolvedValue([{id:'a'},{id:'b'}]);state.tx.inventoryBalance.updateMany.mockResolvedValue({count:1});state.tx.inventoryMovement.create.mockResolvedValue({id:'movement'});state.tx.internalMove.findUnique.mockResolvedValue(null);state.tx.internalMove.count.mockResolvedValue(0);state.tx.internalMove.create.mockResolvedValue({id:'move',reference:'MV-0001'});
});
describe('controlled stock transfers',()=>{
 it('rejects same-warehouse and fractional transfers',()=>{const form=transferForm();form.set('toWarehouseId','a');expect(()=>parseTransfer(form)).toThrow('different');form.set('toWarehouseId','b');form.set('quantity','0.5');expect(()=>parseTransfer(form)).toThrow('whole');});
 it('checks capability and disabled app before touching stock',async()=>{
  state.session.capabilities.clear();await expect(transferStock(transferForm())).rejects.toThrow('FORBIDDEN');expect(state.transaction).not.toHaveBeenCalled();
  state.session.capabilities.add('stock.manage');state.enabled.mockRejectedValue(new Error('disabled'));await expect(transferStock(transferForm())).rejects.toThrow('disabled');expect(state.transaction).not.toHaveBeenCalled();
 });
 it('scopes warehouses and product, decrements conditionally, posts equal opposing movements and audit in one serializable transaction',async()=>{
  await transferStock(transferForm());
  expect(state.tx.warehouse.findMany).toHaveBeenCalledWith({where:{organisationId:'org-a',id:{in:['a','b']}},select:{id:true,siteId:true}});
  expect(state.tx.product.findFirstOrThrow).toHaveBeenCalledWith({where:{organisationId:'org-a',id:'p',kind:'PRODUCT',active:true}});
  expect(state.tx.inventoryBalance.updateMany).toHaveBeenCalledWith({where:{organisationId:'org-a',warehouseId:'a',productId:'p',quantity:{gte:10}},data:{quantity:{decrement:10}}});
  expect(state.tx.inventoryMovement.create.mock.calls.map(call=>call[0].data.delta)).toEqual([-10,10]);
  expect(state.tx.auditEntry.create).toHaveBeenCalledTimes(1);expect(state.transaction.mock.calls[0][1]).toEqual({isolationLevel:'Serializable'});
 });
 it('rejects a foreign warehouse and insufficient stock before posting',async()=>{
  state.tx.warehouse.findMany.mockResolvedValue([{id:'a'}]);await expect(transferStock(transferForm())).rejects.toThrow('workspace');expect(state.tx.inventoryBalance.updateMany).not.toHaveBeenCalled();
  state.tx.warehouse.findMany.mockResolvedValue([{id:'a'},{id:'b'}]);state.tx.inventoryBalance.updateMany.mockResolvedValue({count:0});await expect(transferStock(transferForm())).rejects.toThrow('enough');expect(state.tx.inventoryMovement.create).not.toHaveBeenCalled();
 });
 it('replaying a successful transfer does not issue twice; changed payload is rejected',async()=>{
  state.tx.inventoryMovement.findMany.mockResolvedValue([{requestKey:'request:out',productId:'p',warehouseId:'a',delta:-10,reference:'TR-1',reason:'Transfer out · Rebalance'},{requestKey:'request:in',productId:'p',warehouseId:'b',delta:10,reference:'TR-1',reason:'Transfer in · Rebalance'}]);
  await transferStock(transferForm());expect(state.tx.inventoryBalance.updateMany).not.toHaveBeenCalled();
  const form=transferForm();form.set('quantity','11');await expect(transferStock(form)).rejects.toThrow('different movement');
 });
 it('keeps a move between sites in transit until it is received',async()=>{
  state.tx.warehouse.findMany.mockResolvedValue([{id:'a',siteId:'north'},{id:'b',siteId:'south'}]);
  await transferStock(transferForm());
  expect(state.tx.inventoryBalance.upsert).not.toHaveBeenCalled();
  expect(state.tx.inventoryMovement.create.mock.calls.map(call=>call[0].data.delta)).toEqual([-10]);
  expect(state.tx.internalMove.create.mock.calls[0][0].data).toMatchObject({fromWarehouseId:'a',toWarehouseId:'b',quantity:10});
  expect(state.tx.internalMove.create.mock.calls[0][0].data.reference).toBe('MV-0001');
 });
 it('retries serialization conflicts, retaining the same idempotency key',async()=>{
  state.transaction.mockRejectedValueOnce({code:'P2034'});await postTransfer(session(),parseTransfer(transferForm()));expect(state.transaction).toHaveBeenCalledTimes(2);
 });
});
describe('Sales demand provider',()=>{
 it('rejects unauthorised demand reads',async()=>{state.session.capabilities.clear();await expect(planningDemand(session())).rejects.toThrow('FORBIDDEN');expect(state.salesLines).not.toHaveBeenCalled();});
 it('only requests tenant-scoped confirmed product demand excluding blankets, and removes cancelled quantities',async()=>{
  state.salesLines.mockResolvedValue([{id:'line',productId:'p',orderedQuantity:10,cancelledQuantity:4,unitOfMeasure:'each',requestedDeliveryDate:null,order:{id:'o',reference:'SO-1',requestedDeliveryDate:new Date('2026-10-12')}},{id:'cancelled',productId:'p',orderedQuantity:5,cancelledQuantity:5,unitOfMeasure:'each',requestedDeliveryDate:null,order:{id:'o',reference:'SO-1',requestedDeliveryDate:null}}]);
  expect(await planningDemand(session())).toEqual([{id:'line',productId:'p',orderId:'o',reference:'SO-1',quantity:6,unitOfMeasure:'each',requiredDate:'2026-10-12T00:00:00.000Z'}]);
  expect(state.salesLines.mock.calls[0][0].where.order).toEqual({organisationId:'org-a',commercialStatus:'CONFIRMED',orderType:{not:'BLANKET'}});
 });
});
