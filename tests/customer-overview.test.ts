import {beforeEach,describe,expect,it,vi} from 'vitest';
import type {Session} from '@/core/auth/session';
const {modules}=vi.hoisted(()=>({modules:vi.fn()}));
vi.mock('@/core/modules/runtime',()=>({getNavigableModules:modules}));
import {getCustomerOverviewContributions} from '@/core/customers/overview';

describe('customer overview module isolation',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it('retains working summaries and marks a failed module unavailable instead of breaking the customer record or inventing zero',async()=>{
  const contribution={moduleId:'sales',metrics:[{label:'Orders',value:'3'}],actions:[]};
  const sales=vi.fn().mockResolvedValue(contribution),projects=vi.fn().mockRejectedValue(new Error('Invalid filter field.'));
  modules.mockResolvedValue([{id:'sales',name:'Sales',customerOverviewProvider:sales},{id:'projects',name:'Projects',customerOverviewProvider:projects},{id:'hidden',name:'Hidden',customerOverviewProvider:vi.fn().mockResolvedValue(null)}]);
  const session={organisationId:'tenant',capabilities:new Set()} as Session;
  const result=await getCustomerOverviewContributions(session,'customer');
  expect(result).toEqual([contribution,{moduleId:'projects',metrics:[{label:'Projects summary unavailable',value:'Unavailable'}],actions:[]}]);
  expect(sales).toHaveBeenCalledWith({organisationId:'tenant',session,partyId:'customer'});
 });
});
