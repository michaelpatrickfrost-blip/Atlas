import { describe,it,expect,vi,beforeEach } from 'vitest';
const state=vi.hoisted(()=>({session:{organisationId:'org',userId:'owner',userName:'Planner',capabilities:new Set(['plan.read','plan.edit','sop.read','sop.manage','sop.approve','sop.publish','manufacturing.plan.manage'])},db:{businessPlan:{findFirst:vi.fn(),findMany:vi.fn()},planInput:{findMany:vi.fn()},sopCycle:{findFirst:vi.fn(),findMany:vi.fn(),updateMany:vi.fn()},sopVersion:{findFirst:vi.fn(),findMany:vi.fn(),updateMany:vi.fn()},auditEntry:{create:vi.fn()},$transaction:vi.fn()},read:vi.fn(),publish:vi.fn()}));
vi.mock('@/core/auth/session',()=>({requireSession:async()=>state.session}));
vi.mock('@/core/modules/access',()=>({assertModuleEnabled:vi.fn()}));
vi.mock('@/core/modules/runtime',()=>({enabledModulesForSession:async()=>new Set(['plan','sop','sales','products','manufacturing','crm'])}));
vi.mock('@/core/modules/registry',()=>({getModule:()=>({planningPublicationConsumer:state.publish})}));
vi.mock('@/core/db/client',()=>({db:state.db}));
vi.mock('@/core/planning/business-read',()=>({readBusinessPlanning:state.read}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('next/navigation',()=>({redirect:vi.fn()}));
import { savePlanInput,savePlanGrid } from '@/modules/plan/services/builder';
import { getSopWorkspace,publishSopVersion,approveSopVersion,updateSopWorkflow } from '@/modules/sop/services/workspace';
const cycle={id:'cycle',organisationId:'org',ownerUserId:'owner',currency:'GBP',companyVisible:false,startsOn:new Date('2026-10-01'),endsOn:new Date('2027-09-30'),sourcePlanIds:[],settings:{},revision:1,inputRevision:1,workflow:Array.from({length:7},()=>({status:'approved',versionId:'v'}))};
const version={id:'v',cycleId:'cycle',organisationId:'org',status:'approved',createdAt:new Date('2026-10-07'),kind:'consensus',sourceRevision:1,requiredCapabilities:[],requiredModules:[],payload:{sourcePlanIds:[],inputs:[],rows:[{productId:'p',period:'2026-10',consensus:100}]}};
const form=(data:Record<string,string>)=>{const f=new FormData();for(const [k,v]of Object.entries(data))f.set(k,v);return f;};
beforeEach(()=>{
 vi.clearAllMocks();state.session.capabilities=new Set(['plan.read','plan.edit','sop.read','sop.manage','sop.approve','sop.publish','manufacturing.plan.manage']);
 state.db.sopCycle.findMany.mockResolvedValue([cycle]);state.db.sopCycle.findFirst.mockResolvedValue(cycle);state.db.businessPlan.findMany.mockResolvedValue([]);state.db.sopVersion.findMany.mockResolvedValue([{id:'v',kind:'consensus',requiredCapabilities:[],requiredModules:[]}]);state.db.sopVersion.findFirst.mockImplementation(async(args)=>args?.where?.createdAt?null:{...version});state.db.sopCycle.updateMany.mockResolvedValue({count:1});state.db.sopVersion.updateMany.mockResolvedValue({count:1});state.db.$transaction.mockImplementation(async(fn:(tx:unknown)=>Promise<unknown>)=>fn(state.db));state.read.mockResolvedValue({sources:[],products:[],orders:[],deliveries:[],stock:[],supply:[],inputs:[],budgets:[],planRevisions:[],targets:[],requiredCapabilities:[],requiredModules:[],warnings:[]});
});
describe('connected planning boundaries',()=>{
 it('refuses editing a view-only private-plan share',async()=>{state.db.businessPlan.findFirst.mockResolvedValue({ownerUserId:'other',audience:'private',shares:[{userId:'owner',access:'view'}],locked:false});await expect(savePlanGrid(form({planId:'p'}))).rejects.toThrow('view');expect(state.db.$transaction).not.toHaveBeenCalled();});
 it('refuses editing a locked plan even with plan.edit',async()=>{state.db.businessPlan.findFirst.mockResolvedValue({ownerUserId:'owner',audience:'private',shares:[],locked:true});await expect(savePlanInput(form({planId:'p'}))).rejects.toThrow('locked');});
 it('requires an authorised source reference before accepting a linked input',async()=>{state.db.businessPlan.findFirst.mockResolvedValue({id:'p',ownerUserId:'owner',audience:'private',shares:[],locked:false,sensitive:false,periodStart:new Date('2026-01-01'),periodEnd:new Date('2026-12-31')});await expect(savePlanInput(form({planId:'p',metricKey:'revenue',value:'100',label:'Project',note:'Reason',source:'crm|sales-project|foreign'}))).rejects.toThrow('no longer available');expect(state.db.$transaction).not.toHaveBeenCalled();});
 it('does not expose an immutable snapshot after source permission loss',async()=>{state.db.sopVersion.findFirst.mockResolvedValue({...version,requiredCapabilities:['sales.opportunity.read']});await expect(getSopWorkspace('cycle','v')).rejects.toThrow('cannot read');});
 it('scopes private cycles to tenant and owner or explicit company visibility',async()=>{await getSopWorkspace('cycle','v');expect(state.db.sopCycle.findMany.mock.calls[0][0].where).toEqual({organisationId:'org',OR:[{ownerUserId:'owner'},{companyVisible:true}]});});
 it('makes repeat publication a no-op',async()=>{state.db.sopVersion.findFirst.mockResolvedValue({...version,status:'published'});await publishSopVersion(form({cycleId:'cycle',versionId:'v'}));expect(state.publish).not.toHaveBeenCalled();expect(state.db.$transaction).not.toHaveBeenCalled();});
 it('refuses to publish an unapproved forecast',async()=>{state.db.sopVersion.findFirst.mockResolvedValue({...version,status:'draft'});await expect(publishSopVersion(form({cycleId:'cycle',versionId:'v'}))).rejects.toThrow('Approve');expect(state.publish).not.toHaveBeenCalled();});
 it('publishes the immutable approved product totals through the owning module contract',async()=>{await publishSopVersion(form({cycleId:'cycle',versionId:'v'}));expect(state.publish).toHaveBeenCalledTimes(1);expect(state.publish.mock.calls[0][2]).toEqual({versionId:'v',currency:'GBP',rows:[{productId:'p',period:'2026-10',quantity:100}]});});
 it('refuses approval when connected planning inputs changed',async()=>{state.db.sopVersion.findFirst.mockResolvedValue({...version,status:'draft'});state.read.mockResolvedValue({inputs:[{id:'changed'}],requiredCapabilities:[]});await expect(approveSopVersion(form({cycleId:'cycle',versionId:'v'}))).rejects.toThrow('inputs changed');expect(state.db.sopVersion.updateMany).not.toHaveBeenCalled();});
});

it('rechecks a snapshot source even after that link was removed from the current plan',async()=>{
 state.db.sopVersion.findFirst.mockResolvedValue({...version,payload:{...version.payload,inputs:[{id:'old',sourceModule:'crm',sourceType:'sales-project',sourceId:'private-project'}]}});
 await expect(getSopWorkspace('cycle','v')).rejects.toThrow('cannot currently read');
});
it('refuses inherited review approvals from another forecast version',async()=>{
 const workflow=Array.from({length:7},()=>({status:'approved',versionId:'older'}));
 state.db.sopCycle.findFirst.mockResolvedValue({...cycle,workflow});state.db.sopVersion.findFirst.mockResolvedValue({...version,status:'draft'});
 await expect(approveSopVersion(form({cycleId:'cycle',versionId:'v'}))).rejects.toThrow('review stages');
});
it('rejects a review-cycle race before marking any version approved',async()=>{
 const workflow=Array.from({length:7},()=>({status:'approved',versionId:'v'}));
 state.db.sopCycle.findFirst.mockResolvedValue({...cycle,workflow});state.db.sopVersion.findFirst.mockResolvedValue({...version,status:'draft'});state.db.sopCycle.updateMany.mockResolvedValue({count:0});
 await expect(approveSopVersion(form({cycleId:'cycle',versionId:'v'}))).rejects.toThrow('changed during approval');expect(state.db.sopVersion.updateMany).not.toHaveBeenCalled();
});
it('allows a live service workspace without exposing private forecast payloads or requiring Plan read',async()=>{
 state.session.capabilities.delete('plan.read');const workspace=await getSopWorkspace('cycle',undefined,false);
 expect(workspace.version).toBeNull();expect(state.db.sopVersion.findFirst).not.toHaveBeenCalled();
});

it('refuses stage approval from a screen showing an older version',async()=>{
 await expect(updateSopWorkflow(form({cycleId:'cycle',revision:'1',kind:'stage',index:'0',versionId:'older',status:'approved'}))).rejects.toThrow('another forecast version');
 expect(state.db.sopCycle.updateMany).not.toHaveBeenCalled();
});
it('rechecks snapshot access before allowing a review-stage approval',async()=>{
 state.db.sopVersion.findFirst.mockResolvedValue({...version,status:'draft',requiredCapabilities:['private.source.read']});
 await expect(updateSopWorkflow(form({cycleId:'cycle',revision:'1',kind:'stage',index:'0',versionId:'v',status:'approved'}))).rejects.toThrow('cannot read');
 expect(state.db.sopCycle.updateMany).not.toHaveBeenCalled();
});

it('does not clear manufacturing forecasts by publishing an empty source result',async()=>{
 state.db.sopVersion.findFirst.mockResolvedValue({...version,payload:{...version.payload,rows:[]}});
 await expect(publishSopVersion(form({cycleId:'cycle',versionId:'v'}))).rejects.toThrow('no product demand');
 expect(state.publish).not.toHaveBeenCalled();expect(state.db.$transaction).not.toHaveBeenCalled();
});

it('refuses publication after a connected plan changed since approval',async()=>{
 state.read.mockResolvedValue({sources:[],inputs:[{id:'changed'}],planRevisions:[{id:'p',revision:2}],targets:[],requiredCapabilities:[]});
 await expect(publishSopVersion(form({cycleId:'cycle',versionId:'v'}))).rejects.toThrow('inputs changed after approval');
 expect(state.publish).not.toHaveBeenCalled();expect(state.db.$transaction).not.toHaveBeenCalled();
});
