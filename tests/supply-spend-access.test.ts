import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@/core/auth/session';
const s=vi.hoisted(()=>({entities:vi.fn(),documents:vi.fn(),groups:vi.fn(),enabled:vi.fn()}));
vi.mock('@/core/db/client',()=>({db:{financeEntity:{findMany:s.entities},financeDocument:{findMany:s.documents,groupBy:s.groups}}}));
vi.mock('@/core/modules/access',()=>({assertModuleEnabled:s.enabled}));
import { supplySpendProvider } from '@/modules/finance/services/supply-spend';
const session=(caps=['finance.report.read','finance.purchase.read','finance.payables.read'])=>({organisationId:'tenant',userId:'reader',capabilities:new Set(caps)} as Session);
const request={start:'2026-10-01',end:'2026-10-31',group:'supplier' as const};
beforeEach(()=>{vi.clearAllMocks();s.entities.mockResolvedValue([{id:'books',name:'Books',currency:'GBP'}]);s.documents.mockResolvedValue([]);s.groups.mockResolvedValue([]);});
describe('supply report source authority',()=>{
 it('refuses missing report access and disabled Finance before querying books',async()=>{
  await expect(supplySpendProvider(session([]),request)).rejects.toThrow('FORBIDDEN');
  s.enabled.mockRejectedValueOnce(new Error('Finance disabled'));
  await expect(supplySpendProvider(session(),request)).rejects.toThrow('disabled');
  expect(s.entities).not.toHaveBeenCalled();
 });
 it('refuses another tenant entity and impossible/reversed dates',async()=>{
  await expect(supplySpendProvider(session(),{...request,entity:'foreign'})).rejects.toThrow('your company');
  await expect(supplySpendProvider(session(),{...request,start:'2026-02-30'})).rejects.toThrow('valid date');
  await expect(supplySpendProvider(session(),{...request,start:'2026-11-01'})).rejects.toThrow('end');
  expect(s.documents).not.toHaveBeenCalled();
 });
 it('returns unavailable amounts, without confidential queries, when only report access is granted',async()=>{
  const report=await supplySpendProvider(session(['finance.report.read']),request);
  expect(report.totals).toEqual([{currency:'GBP',postedNet:null,committedNet:null,receivedNet:null,openPayables:null}]);
  expect(s.documents).not.toHaveBeenCalled();expect(s.groups).not.toHaveBeenCalled();
 });
 it('separates period spend, unbilled commitments, receipts and current open balances',async()=>{
  s.documents.mockResolvedValueOnce([{id:'bill',reference:'B1',kind:'AP_INVOICE',net:10000n,currency:'GBP',accountingDate:new Date('2026-10-05'),documentDate:new Date('2026-09-30'),party:{name:'Supplier'},category:null,costCentre:null,site:null}]).mockResolvedValueOnce([{net:15000n,currency:'GBP',children:[{net:10000n,currency:'GBP'}]}]);
  s.groups.mockResolvedValueOnce([{currency:'GBP',_sum:{net:15000n}}]).mockResolvedValueOnce([{currency:'GBP',kind:'AP_INVOICE',_sum:{gross:12000n,settled:2000n}},{currency:'GBP',kind:'AP_CREDIT',_sum:{gross:1200n,settled:0n}}]);
  const report=await supplySpendProvider(session(),request);
  expect(report.totals).toEqual([{currency:'GBP',postedNet:'10000',committedNet:'5000',receivedNet:'15000',openPayables:'8800'}]);
  const queries=JSON.stringify([...s.documents.mock.calls,...s.groups.mock.calls],(_,v)=>typeof v==='bigint'?v.toString():v);
  expect(queries).toContain('tenant');expect(queries).toContain('projectId');expect(queries).toContain('accountingDate');
 });
 it('fails visibly instead of publishing a silently truncated total',async()=>{
  s.documents.mockResolvedValueOnce(Array(10001).fill({}));
  await expect(supplySpendProvider(session(),request)).rejects.toThrow('10,000');
 });
});
