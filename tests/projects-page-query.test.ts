import {describe,expect,it,vi} from 'vitest';
vi.mock('@/core/db/client',()=>({db:{}}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>undefined,set:vi.fn()})}));
vi.mock('next/navigation',()=>({redirect:vi.fn()}));
import {planRead} from '@/server/data-api/read-query';
import {documentScope,projectScope,taskScope} from '@/core/permissions/work-access';
import type {Session} from '@/core/auth/session';

const session:Session={userId:'michael',userName:'Michael',userEmail:'michael@example.invalid',organisationId:'org',organisationName:'Northbridge',membershipId:'member',capabilities:new Set(['projects.read','core.profile.self','core.pricing.read','customers.commercial.read'])};

describe('Projects home queries stay within the data-service filter depth',()=>{
 it('plans every Projects home read the desktop app sends',()=>{
  const projects=projectScope(session),tasks=taskScope(session),documents=documentScope(session);
  expect(()=>planRead(session,'Project',{where:projects,include:{members:true},orderBy:{updatedAt:'desc'}})).not.toThrow();
  expect(()=>planRead(session,'ProjectTask',{where:tasks,include:{project:{select:{id:true,name:true}},checklist:true,predecessors:true},orderBy:[{position:'asc'},{dueAt:'asc'}]})).not.toThrow();
  expect(()=>planRead(session,'Membership',{where:{organisationId:session.organisationId,active:true},select:{userId:true,user:{select:{name:true}}}})).not.toThrow();
  expect(()=>planRead(session,'ProjectDocument',{where:documents,orderBy:{updatedAt:'desc'}})).not.toThrow();
  expect(()=>planRead(session,'ProjectMilestone',{where:{organisationId:session.organisationId,project:projects},orderBy:{targetAt:'asc'}})).not.toThrow();
  expect(()=>planRead(session,'ProjectPortfolio',{where:{organisationId:session.organisationId,ownerUserId:session.userId},include:{projects:{where:{project:projects}}}})).not.toThrow();
  expect(()=>planRead(session,'ProjectInboxItem',{where:{organisationId:session.organisationId,userId:session.userId,dismissedAt:null,AND:[{OR:[{snoozedUntil:null},{snoozedUntil:{lte:new Date()}}]},{OR:[{projectId:null},{project:projects}]},{OR:[{taskId:null},{task:tasks}]}]},orderBy:{createdAt:'desc'}})).not.toThrow();
  expect(()=>planRead(session,'ProjectSavedView',{where:{organisationId:session.organisationId,userId:session.userId},orderBy:{name:'asc'}})).not.toThrow();
  expect(()=>planRead(session,'WorkTeam',{where:{organisationId:session.organisationId},select:{id:true,name:true}})).not.toThrow();
 });
 it('plans the Pricing list count that includes agreements',()=>{
  expect(()=>planRead(session,'PriceList',{where:{organisationId:session.organisationId},include:{_count:{select:{customerDefaults:true,agreements:true,entries:{where:{active:true,scope:'PRODUCT',method:'FIXED'}}}}},orderBy:{name:'asc'}})).not.toThrow();
 });
});
