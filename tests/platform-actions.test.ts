import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({session:{userId:'owner',organisationId:'company',capabilities:new Set<string>()},organisation:{findUniqueOrThrow:vi.fn()},transaction:vi.fn()}));
vi.mock('@/core/auth/session',()=>({requireSession:async()=>state.session}));
vi.mock('@/core/db/client',()=>({db:{organisation:state.organisation,$transaction:state.transaction}}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
import {saveCompanyEntitlements,updateCompanyAccount} from '@/app/(app)/atlas/actions';
beforeEach(()=>{vi.clearAllMocks();state.session.capabilities=new Set();state.organisation.findUniqueOrThrow.mockResolvedValue({id:'company'});});
describe('owner console mutations',()=>{
 it('rejects company administrators before looking up a different company',async()=>{state.session.capabilities.add('core.users.manage');const form=new FormData();form.set('organisationId','other-company');await expect(saveCompanyEntitlements(form)).rejects.toThrow('FORBIDDEN');expect(state.organisation.findUniqueOrThrow).not.toHaveBeenCalled();expect(state.transaction).not.toHaveBeenCalled();});
 it('rejects licensing an unimplemented app',async()=>{state.session.capabilities.add('atlas.companies.manage');const form=new FormData();form.set('organisationId','company');form.append('moduleId','finance');await expect(saveCompanyEntitlements(form)).rejects.toThrow('unimplemented');expect(state.transaction).not.toHaveBeenCalled();});
 it('prevents an owner suspending the workspace that grants their current session',async()=>{state.session.capabilities.add('atlas.companies.manage');const form=new FormData();for(const [key,value] of Object.entries({organisationId:'company',name:'Company',planName:'Test',status:'SUSPENDED',subscriptionStatus:'TRIAL'}))form.set(key,value);await expect(updateCompanyAccount(form)).rejects.toThrow('current workspace');expect(state.transaction).not.toHaveBeenCalled();});
});
