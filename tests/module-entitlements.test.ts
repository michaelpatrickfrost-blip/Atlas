import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({findMany:vi.fn(),findUnique:vi.fn(),upsert:vi.fn()}));
vi.mock('@/core/db/client',()=>({db:{moduleState:state}}));
import {getEnabledModuleIds,getNavigableModules,setModuleEnabled} from '@/core/modules/runtime';
import {getModule} from '@/core/modules/registry';
import {assertModuleEnabled} from '@/core/modules/access';
import {ATLAS_CAPABILITIES} from '@/core/admin/access';
import type {Session} from '@/core/auth/session';
beforeEach(()=>vi.clearAllMocks());
const session=(capabilities:string[]):Session=>({userId:'user',userName:'User',userEmail:'user@example.test',organisationId:'company',organisationName:'Company',membershipId:'membership',capabilities:new Set(capabilities)});
describe('licensed module runtime',()=>{
 it('consolidates Planning, Inventory and Products only when Manufacturing & Supply can actually open',async()=>{
  const sources=['planning','stock','products'].map(moduleId=>({moduleId,enabled:true,entitled:true}));
  const user=session(['planning.demand.read','stock.read','core.products.read']);
  state.findMany.mockResolvedValue([...sources,{moduleId:'manufacturing',enabled:true,entitled:true}]);
  expect((await getNavigableModules(user)).map(m=>m.id)).toEqual(['manufacturing']);
  state.findMany.mockResolvedValue([...sources,{moduleId:'manufacturing',enabled:false,entitled:true}]);
  expect((await getNavigableModules(user)).map(m=>m.id).sort()).toEqual(['planning','stock']);
  state.findMany.mockResolvedValue([...sources,{moduleId:'manufacturing',enabled:true,entitled:false}]);
  expect((await getNavigableModules(user)).map(m=>m.id).sort()).toEqual(['planning','stock']);
 });
 it('provides the unified app to product-only readers without granting Manufacturing writes or other source access',async()=>{
  state.findMany.mockResolvedValue(['products','manufacturing'].map(moduleId=>({moduleId,enabled:true,entitled:true})));
  const user=session(['core.products.read']);
  expect((await getNavigableModules(user)).map(m=>m.id)).toEqual(['manufacturing']);
  expect(user.capabilities.size).toBe(1);
  await expect(assertModuleEnabled(user,'stock')).rejects.toThrow('disabled');
 });
 it('does not enable an unlicensed app or infer a CRM licence from Sales',async()=>{state.findMany.mockResolvedValue([{moduleId:'sales',enabled:true,entitled:true},{moduleId:'stock',enabled:true,entitled:false}]);expect([...await getEnabledModuleIds('company')]).toEqual(['sales']);expect(state.findMany).toHaveBeenCalledWith({where:{organisationId:'company'}});});
 it('rejects enabling an unlicensed app before changing state',async()=>{state.findUnique.mockResolvedValue({entitled:false});await expect(setModuleEnabled('company','stock',true)).rejects.toThrow('not included');expect(state.upsert).not.toHaveBeenCalled();});
 it('shows disabled apps to Atlas staff and allows their routes without changing company app state',async()=>{
  const sales=getModule('sales');
  if(!sales) throw new Error('Sales module is not registered');
  const capabilities=[ATLAS_CAPABILITIES.staff,...(sales.accessAnyOf??[sales.accessCapability])];
  state.findMany.mockResolvedValue([]);
  expect((await getNavigableModules(session(capabilities))).map(module=>module.id)).toContain('sales');
  await expect(assertModuleEnabled(session(capabilities),'sales')).resolves.toBeUndefined();
  expect(state.findMany).not.toHaveBeenCalled();
 });
 it('makes Reports available as a built-in utility without licensing or enabling source apps',async()=>{
  state.findMany.mockResolvedValue([]);await expect(assertModuleEnabled(session(['core.profile.self']),'reports')).resolves.toBeUndefined();
  await expect(assertModuleEnabled(session(['stock.read']),'stock')).rejects.toThrow('disabled');
  await expect(setModuleEnabled('company','reports',false)).rejects.toThrow('cannot be toggled');expect(state.upsert).not.toHaveBeenCalled();
 });
 it('continues to hide disabled apps from customer users',async()=>{
  const sales=getModule('sales');
  if(!sales) throw new Error('Sales module is not registered');
  state.findMany.mockResolvedValue([]);
  expect(await getNavigableModules(session(sales.accessAnyOf??[sales.accessCapability]))).not.toContain(sales);
  await expect(assertModuleEnabled(session(sales.accessAnyOf??[sales.accessCapability]),'sales')).rejects.toThrow('disabled');
 });
});
