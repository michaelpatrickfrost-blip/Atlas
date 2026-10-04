import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({membership:vi.fn(),user:vi.fn(),revalidate:vi.fn(),fetch:vi.fn()}));
vi.mock('@/core/db/client',()=>({db:{membership:{findMany:mocks.membership},user:{findMany:mocks.user}}}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidate}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>undefined,set:vi.fn()})}));
vi.mock('next/navigation',()=>({redirect:vi.fn()}));
import {executeReadQuery,planRead} from '@/server/data-api/read-query';
import {callRemoteAction} from '@/core/desktop/data-client';
import type {Session} from '@/core/auth/session';
const session:Session={userId:'self',userName:'Synthetic',userEmail:'synthetic@example.invalid',organisationId:'own',organisationName:'Synthetic',membershipId:'self-membership',capabilities:new Set(['core.profile.self'])};
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('fetch',mocks.fetch);vi.stubEnv('ATLAS_DATA_API_URL','http://127.0.0.1:13100');});
describe('required relations through the desktop data service',()=>{
 it('uses a valid required User projection without a nested where',()=>{const p=planRead(session,'Membership',{include:{user:{select:{name:true}}}});expect(p.children.user.args).not.toHaveProperty('where');expect(p.children.user.args.select).toMatchObject({id:true,name:true});});
 it('verifies related IDs against tenant scope and hides foreign users',async()=>{mocks.membership.mockResolvedValue([{id:'member',organisationId:'own',user:{id:'foreign',name:'Secret'}},{id:'allowed-member',organisationId:'own',user:{id:'allowed',name:'Visible'}}]);mocks.user.mockResolvedValue([{id:'allowed'}]);const rows=await executeReadQuery(session,'membership','findMany',{include:{user:{select:{name:true}}}});expect(mocks.user).toHaveBeenCalledWith({where:{AND:[{memberships:{some:{organisationId:'own'}}},{id:{in:['foreign','allowed']}}]},select:{id:true}});expect(rows).toEqual([{id:'allowed-member',organisationId:'own',user:{name:'Visible'}}]);});
});
describe('remote action page refresh',()=>{
 it('allows read actions during rendering without revalidation',async()=>{mocks.fetch.mockResolvedValue({ok:true,headers:{getSetCookie:()=>[]},json:async()=>({value:{count:2}})});expect(await callRemoteAction('synthetic:getSchedule',[])).toEqual({count:2});expect(mocks.revalidate).not.toHaveBeenCalled();});
 it('refreshes the desktop after a mutation explicitly requests it',async()=>{mocks.fetch.mockResolvedValue({ok:true,headers:{getSetCookie:()=>[]},json:async()=>({value:{__atlas:'undefined'}})});await callRemoteAction('synthetic:saveTimesheet',[],true);expect(mocks.revalidate).toHaveBeenCalledWith('/','layout');});
});
