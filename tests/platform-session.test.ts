import {beforeEach,describe,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({lookup:vi.fn()}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>({value:'signed-token'})})}));
vi.mock('jsonwebtoken',()=>({default:{verify:()=>({userId:'user',organisationId:'org'})}}));
vi.mock('@/core/db/client',()=>({db:{membership:{findUnique:mock.lookup}}}));
import {getSession} from '@/core/auth/session';
const membership=(grant:boolean,status='ACTIVE',active=true)=>({id:'m',userId:'user',organisationId:'org',active,user:{name:'Owner',email:'owner@example.com',platformAdmin:grant?{userId:'user'}:null},organisation:{name:'Company',status},roles:[{role:{capabilities:['core.users.manage','atlas.companies.manage']}}]});
beforeEach(()=>vi.clearAllMocks());
describe('platform access boundary',()=>{
 it('ignores platform permissions injected through a company role',async()=>{mock.lookup.mockResolvedValue(membership(false));expect((await getSession())?.capabilities.has('atlas.companies.manage')).toBe(false);});
 it('requires an independent platform grant',async()=>{mock.lookup.mockResolvedValue(membership(true));expect((await getSession())?.capabilities.has('atlas.companies.manage')).toBe(true);});
 it('blocks suspended companies and paused memberships on the next request',async()=>{mock.lookup.mockResolvedValue(membership(false,'SUSPENDED'));expect(await getSession()).toBeNull();mock.lookup.mockResolvedValue(membership(false,'ACTIVE',false));expect(await getSession()).toBeNull();});
});
