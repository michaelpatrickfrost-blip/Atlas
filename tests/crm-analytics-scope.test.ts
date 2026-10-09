import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({opportunity:{groupBy:vi.fn()},prospect:{groupBy:vi.fn(),findMany:vi.fn()},pipelineStage:{findMany:vi.fn()}}));
vi.mock('@/core/db/client',()=>({db:mock}));
import { crmAnalytics } from '@/modules/crm/services/analytics';
import type { Session } from '@/core/auth/session';
const session:Session={organisationId:'tenant',userId:'rep',userName:'Rep',userEmail:'rep@invalid.test',organisationName:'Test',membershipId:'m',capabilities:new Set(['sales.opportunity.read','sales.prospect.read'])};
beforeEach(()=>{vi.clearAllMocks();mock.opportunity.groupBy.mockResolvedValue([]);mock.prospect.groupBy.mockResolvedValue([]);mock.prospect.findMany.mockResolvedValue([]);mock.pipelineStage.findMany.mockResolvedValue([]);});
describe('CRM summary source scope',()=>{
 it('applies the source owner restriction to every rep summary query',async()=>{for(const metric of crmAnalytics)await metric.query(session,new Date('2026-10-01'));for(const delegate of [mock.opportunity.groupBy,mock.prospect.groupBy,mock.prospect.findMany])for(const [args] of delegate.mock.calls)expect(args.where).toMatchObject({organisationId:'tenant',ownerUserId:'rep'});});
 it('retains managers company scope and computes win rate from all matching rows',async()=>{mock.opportunity.groupBy.mockResolvedValue([{status:'WON',_count:{_all:12000}},{status:'LOST',_count:{_all:4000}}]);const result=await crmAnalytics.find(m=>m.id==='crm.winrate')!.query({...session,capabilities:new Set([...session.capabilities,'sales.pipeline.manage'])},new Date('2026-10-01'));expect(result).toEqual([{label:'Win rate',value:75}]);const args=mock.opportunity.groupBy.mock.calls[0][0];expect(args.where.ownerUserId).toBeUndefined();expect(args.where.organisationId).toBe('tenant');expect(args.take).toBeUndefined();});
});
