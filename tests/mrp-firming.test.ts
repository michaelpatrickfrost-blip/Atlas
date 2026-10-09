import { beforeEach, describe, expect, it, vi } from 'vitest';
const s=vi.hoisted(()=>({suggestion:{findFirst:vi.fn(),updateMany:vi.fn()},run:{findFirst:vi.fn()},product:{findFirst:vi.fn()},order:{create:vi.fn(),findFirstOrThrow:vi.fn()},audit:{create:vi.fn()},activity:{create:vi.fn()},transaction:vi.fn()}));
vi.mock('@/core/auth/session',()=>({requireSession:async()=>({organisationId:'tenant',userId:'planner',capabilities:new Set(['manufacturing.plan.firm'])})}));
vi.mock('@/core/modules/access',()=>({assertModuleEnabled:vi.fn()}));
vi.mock('@/core/db/client',()=>({db:{$transaction:s.transaction}}));
vi.mock('@/modules/manufacturing/services/numbers',()=>({nextOrderNumber:async()=> 'MO-0001'}));
import { firmSuggestion } from '@/modules/manufacturing/services/mrp';
const proposal={id:'make',productId:'product',runId:'run',kind:'MAKE',status:'PENDING',quantity:12,neededBy:new Date('2026-11-01'),startBy:null,updatedAt:new Date(),pegging:{demand:[{sourceType:'FORECAST',sourceId:'forecast',label:'Forecast',quantity:2},{sourceType:'SALES_ORDER',sourceId:'line',label:'Private source label',quantity:10}],materials:[{productId:'component',shortage:3}]}};
beforeEach(()=>{vi.clearAllMocks();s.suggestion.findFirst.mockResolvedValue(proposal);s.suggestion.updateMany.mockResolvedValue({count:1});s.run.findFirst.mockResolvedValue({id:'run'});s.product.findFirst.mockResolvedValue({id:'product',unitOfMeasure:'kg',definitions:[{id:'recipe'}]});s.order.create.mockResolvedValue({id:'production'});s.transaction.mockImplementation(async fn=>fn({manufacturingSupplySuggestion:s.suggestion,manufacturingPlanningRun:s.run,product:s.product,manufacturingOrder:s.order,auditEntry:s.audit,activity:s.activity}));});
describe('Make proposal conversion',()=>{
 it('reads the saved rich MRP payload and retains its unit and largest source',async()=>{
  await firmSuggestion('make');expect(s.order.create.mock.calls[0][0].data).toMatchObject({unitOfMeasure:'kg',sourceSalesOrderLineId:'line',quantity:12,definitionId:'recipe'});
  expect(s.order.create.mock.calls[0][0].data.notes).toContain('1 component shortage');expect(s.order.create.mock.calls[0][0].data.notes).not.toContain('Private source label');
  expect(s.transaction.mock.calls[0][1]).toEqual({isolationLevel:'Serializable'});expect(s.audit.create).toHaveBeenCalledOnce();
 });
 it('rejects an older plan or concurrent claim before creating production',async()=>{
  s.run.findFirst.mockResolvedValueOnce({id:'newer'});await expect(firmSuggestion('make')).rejects.toThrow('newer');
  s.suggestion.updateMany.mockResolvedValue({count:0});await expect(firmSuggestion('make')).rejects.toThrow('changed');expect(s.order.create).not.toHaveBeenCalled();expect(s.audit.create).not.toHaveBeenCalled();
 });
 it('returns the already linked production order on a repeated call',async()=>{
  s.suggestion.findFirst.mockResolvedValue({...proposal,status:'FIRMED',resultingOrderId:'existing'});s.order.findFirstOrThrow.mockResolvedValue({id:'existing'});
  expect(await firmSuggestion('make')).toEqual({id:'existing'});expect(s.order.create).not.toHaveBeenCalled();
 });
 it('continues to accept historical array pegging',async()=>{
  s.suggestion.findFirst.mockResolvedValue({...proposal,pegging:proposal.pegging.demand});await firmSuggestion('make');expect(s.order.create).toHaveBeenCalledOnce();
 });
});
