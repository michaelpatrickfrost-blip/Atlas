import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({findMany:vi.fn(),findUnique:vi.fn(),upsert:vi.fn()}));
vi.mock('@/core/db/client',()=>({db:{moduleState:state}}));
import {getEnabledModuleIds,setModuleEnabled} from '@/core/modules/runtime';
beforeEach(()=>vi.clearAllMocks());
describe('licensed module runtime',()=>{
 it('does not enable an unlicensed app or infer a CRM licence from Sales',async()=>{state.findMany.mockResolvedValue([{moduleId:'sales',enabled:true,entitled:true},{moduleId:'stock',enabled:true,entitled:false}]);expect([...await getEnabledModuleIds('company')]).toEqual(['sales']);expect(state.findMany).toHaveBeenCalledWith({where:{organisationId:'company'}});});
 it('rejects enabling an unlicensed app before changing state',async()=>{state.findUnique.mockResolvedValue({entitled:false});await expect(setModuleEnabled('company','stock',true)).rejects.toThrow('not included');expect(state.upsert).not.toHaveBeenCalled();});
});
