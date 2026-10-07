import { beforeEach, expect, it, vi } from 'vitest';
import type { Session } from '@/core/auth/session';
const state=vi.hoisted(()=>({db:{businessPlan:{findMany:vi.fn()},planInput:{findMany:vi.fn()},planCell:{findMany:vi.fn()}},read:vi.fn()}));
vi.mock('@/core/db/client',()=>({db:state.db}));
vi.mock('@/core/planning/business-read',()=>({readBusinessPlanning:state.read}));
import { planBusinessPlanning } from '@/modules/plan/services/input-read';
const session={organisationId:'org',userId:'viewer',capabilities:new Set(['plan.read'])} as Session;
const request={startsOn:'2026-10-01',endsOn:'2027-09-30',historyStartsOn:'2026-10-01',purpose:'forecast' as const,modules:['plan'],planIds:['plan'],productIds:['product']};
const row={id:'input',planId:'plan',label:'Expansion',sourceModule:'crm',sourceType:'sales-project',sourceId:'project',productId:'product',metricKey:'sales_volume',periodKey:'2026-10',value:100,probability:70,probabilityOverride:false,unitPriceMinor:null,note:'Customer rollout'};
beforeEach(()=>{
 vi.clearAllMocks();
 state.db.businessPlan.findMany.mockResolvedValue([{id:'plan',name:'Sales',currency:'GBP',revision:2,versions:[]}]);
 state.db.planInput.findMany.mockResolvedValue([{...row}]);state.db.planCell.findMany.mockResolvedValue([]);
 state.read.mockResolvedValue({sources:[{module:'crm',type:'sales-project',id:'project',capability:'sales.project.read',probability:30,active:true}]});
});
it('uses current CRM probability until the planner explicitly overrides it',async()=>{
 const linked=await planBusinessPlanning(session,request);expect(linked.inputs?.[0].probability).toBe(30);
 state.db.planInput.findMany.mockResolvedValue([{...row,probabilityOverride:true}]);
 const overridden=await planBusinessPlanning(session,request);expect(overridden.inputs?.[0].probability).toBe(70);
 expect(state.read.mock.calls[0][1].modules).toEqual(['crm']);
});
it('retains an inactive commercial input with an explicit exclusion flag and warning',async()=>{
 state.read.mockResolvedValue({sources:[{module:'crm',type:'sales-project',id:'project',capability:'sales.project.read',probability:30,active:false}]});
 const result=await planBusinessPlanning(session,request);
 expect(result.inputs?.[0]).toMatchObject({id:'input',value:100,sourceInactive:true});expect(result.warnings?.[0]).toContain('excluded');
});
it('rejects a plan projection when the source is no longer authorised',async()=>{
 state.read.mockResolvedValue({sources:[]});
 await expect(planBusinessPlanning(session,request)).rejects.toThrow('cannot currently read');
});
