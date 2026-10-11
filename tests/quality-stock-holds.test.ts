import { beforeEach, expect, it, vi } from 'vitest';
import type { Prisma, QualityHold } from '@/generated/prisma/client';
import type { Session } from '@/core/auth/session';
const movement = vi.hoisted(() => vi.fn());
vi.mock('@/modules/stock/services/provider', () => ({ stockProvider: { executeMovement: movement } }));
import { quarantineInspectionStock, releaseInspectionStock } from '@/modules/quality/services/stock-holds';
const session = { organisationId: 'company', userId: 'quality' } as Session;
const hold = { id: 'hold', productId: 'product', warehouseId: 'warehouse', locationId: null, lotCode: 'BATCH', quantity: 1.25, releaseNote: 'Review passed' } as unknown as QualityHold;
function fixture() {
 const models = { product: { findFirstOrThrow: vi.fn().mockResolvedValue({ trackingMode: 'LOT' }) }, stockLot: { findMany: vi.fn().mockResolvedValue([{id:'lot',code:'BATCH'}]) }, stockPosition: { findMany: vi.fn().mockResolvedValue([{id:'bin-a',warehouseId:'warehouse',locationId:'a',lotId:'lot',quantity:0.5},{id:'bin-b',warehouseId:'warehouse',locationId:'b',lotId:'lot',quantity:2}]), findFirst: vi.fn().mockResolvedValue({ quantity:1.25 }) }, qualityHold: { findMany: vi.fn().mockImplementation(async({where})=>where.status==='RELEASED'?[hold]:[]) }, stockMovementAllocation: { findMany: vi.fn().mockResolvedValue([{id:'allocation',warehouseId:'warehouse',locationId:'a',lotId:'lot',quantity:1.25,serials:[]}]) }, inventoryMovement: { findFirst: vi.fn().mockResolvedValue(null) } };
 return { models, tx: models as unknown as Prisma.TransactionClient };
}
beforeEach(()=>vi.resetAllMocks());
it('quarantines exact affected stock across actual bins using the caller-owned transaction',async()=>{
 const {tx}=fixture();await quarantineInspectionStock(tx,session,hold);
 expect(movement.mock.calls.map(call=>[call[1].locationId,call[1].quantity,call[1].lotCode])).toEqual([['a',0.5,'BATCH'],['b',0.75,'BATCH']]);
 expect(movement.mock.calls.every(call=>call[2]===tx)).toBe(true);
});
it('does not release stock still covered by another active quality hold',async()=>{
 const {models,tx}=fixture();models.qualityHold.findMany.mockImplementation(async({where})=>where.status==='RELEASED'?[hold]:[{warehouseId:'warehouse',locationId:null,lotCode:'BATCH'}]);
 await releaseInspectionStock(tx,session,hold);expect(movement).not.toHaveBeenCalled();
});
it('releases only recorded quality allocation ownership once and propagates stock failure',async()=>{
 const {models,tx}=fixture();await releaseInspectionStock(tx,session,hold);
 expect(movement).toHaveBeenCalledWith(session,expect.objectContaining({quantity:1.25,status:'QUARANTINE',toStatus:'AVAILABLE',lotCode:'BATCH'}),tx);
 models.inventoryMovement.findFirst.mockResolvedValue({quantity:1.25});await releaseInspectionStock(tx,session,hold);expect(movement).toHaveBeenCalledOnce();
 models.inventoryMovement.findFirst.mockResolvedValue(null);movement.mockRejectedValue(new Error('write failed'));await expect(releaseInspectionStock(tx,session,hold)).rejects.toThrow('write failed');
});
