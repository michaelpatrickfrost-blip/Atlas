import {beforeEach,expect,it,vi} from 'vitest';
import {publishSopDemand} from '@/modules/manufacturing/services/business-planning';
import type {Session} from '@/core/auth/session';
import type {Prisma} from '@/generated/prisma/client';
const session={organisationId:'org',userId:'planner',capabilities:new Set(['manufacturing.plan.manage'])} as Session;
const tx={product:{findMany:vi.fn()},sopVersion:{findFirstOrThrow:vi.fn()},manufacturingDemandForecast:{findMany:vi.fn(),updateMany:vi.fn(),upsert:vi.fn()}};
const input={versionId:'version',currency:'GBP',rows:[{productId:'p',period:'2026-10',quantity:100}]};
beforeEach(()=>{vi.clearAllMocks();tx.product.findMany.mockResolvedValue([{id:'p'}]);tx.sopVersion.findFirstOrThrow.mockResolvedValue({id:'version',cycleId:'cycle',createdAt:new Date('2026-10-01')});tx.manufacturingDemandForecast.findMany.mockResolvedValue([]);});
it('prevents an older cycle overwriting newer published demand for the same product/month',async()=>{
 tx.manufacturingDemandForecast.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{productId:'p',periodStart:new Date('2026-10-01'),sopVersion:{id:'newer',createdAt:new Date('2026-10-02')}}]);
 await expect(publishSopDemand(session,tx as unknown as Prisma.TransactionClient,input)).rejects.toThrow('Newer approved');expect(tx.manufacturingDemandForecast.upsert).not.toHaveBeenCalled();
});
it('does not block a different product/month returned by the bounded cross-product query',async()=>{
 tx.manufacturingDemandForecast.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{productId:'p',periodStart:new Date('2026-11-01'),sopVersion:{id:'newer',createdAt:new Date('2026-10-02')}}]);
 await publishSopDemand(session,tx as unknown as Prisma.TransactionClient,input);expect(tx.manufacturingDemandForecast.upsert).toHaveBeenCalledOnce();
});
