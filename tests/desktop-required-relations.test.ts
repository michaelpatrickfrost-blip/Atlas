import {describe,it,expect,vi} from 'vitest';
vi.mock('@/core/db/client',()=>({db:{customerCreditProfile:{findMany:vi.fn()},party:{findMany:vi.fn().mockResolvedValue([])}}}));
import {db} from '@/core/db/client';
import {planRead,executeReadQuery} from '@/server/data-api/read-query';
import type {Session} from '@/core/auth/session';
const session={organisationId:'org-a',userId:'user-a',capabilities:new Set(['customers.read','customers.credit.read'])} as Session;
describe('required relationship desktop reads',()=>{
 it('keeps the home credit-hold projection valid for Prisma and scopes its root',()=>{
  const plan=planRead(session,'CustomerCreditProfile',{where:{onHold:true,party:{organisationId:'org-a'}},include:{party:{select:{id:true,name:true}}}});
  expect(plan.children.party.args).not.toHaveProperty('where');
  expect(plan.children.party.args.select).toMatchObject({organisationId:true});
  expect((plan.args.where as {AND:unknown[]}).AND[0]).toEqual({party:{organisationId:'org-a'}});
 });
 it('removes a foreign-tenant required relationship from returned data',async()=>{
  vi.mocked(db.customerCreditProfile.findMany).mockResolvedValue([{partyId:'foreign',party:{id:'foreign',name:'Hidden',organisationId:'org-b'}}] as never);
  expect(await executeReadQuery(session,'customerCreditProfile','findMany',{include:{party:{select:{id:true,name:true}}}})).toEqual([]);
 });
 it('rejects unsupported filters on a required relationship projection',()=>{
  expect(()=>planRead(session,'CustomerCreditProfile',{include:{party:{where:{name:'Example'}}}})).toThrow('Required relation');
 });
});
