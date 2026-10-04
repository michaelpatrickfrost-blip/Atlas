import {describe,it,expect,beforeAll,afterAll} from 'vitest';
import {db} from '@/core/db/client';
import {executeReadQuery} from '@/server/data-api/read-query';
import {taskScope,documentScope} from '@/core/permissions/work-access';
import type {Session} from '@/core/auth/session';
const testUrl=process.env.DATABASE_URL?new URL(process.env.DATABASE_URL):null;
const enabled=process.env.ATLAS_PROJECTS_SYNTHETIC_TEST==='1'&&testUrl?.hostname==='127.0.0.1'&&testUrl.pathname==='/projects_synthetic';
const viewer={organisationId:'synthetic-projects-org',userId:'viewer',capabilities:new Set(['projects.read','core.profile.self','core.audit.read'])} as Session;
describe.skipIf(!enabled)('Projects disposable database security',()=>{
 beforeAll(async()=>{
  await db.organisation.create({data:{id:viewer.organisationId,name:'Synthetic Projects Only',slug:'synthetic-projects-only'}});
  await db.project.createMany({data:[{id:'public',organisationId:viewer.organisationId,name:'Visible project',reference:'TEST-1',ownerUserId:'owner',visibility:'COMPANY'},{id:'private',organisationId:viewer.organisationId,name:'Secret project title',reference:'TEST-2',ownerUserId:'owner',visibility:'PRIVATE'}]});
  await db.projectTask.createMany({data:[{id:'visible-task',organisationId:viewer.organisationId,projectId:'public',title:'Visible work',assigneeUserId:'viewer',creatorUserId:'owner'},{id:'private-task',organisationId:viewer.organisationId,projectId:'private',title:'Secret work title',assigneeUserId:'owner',creatorUserId:'owner'},{id:'personal-task',organisationId:viewer.organisationId,title:'Secret personal work',assigneeUserId:'owner',creatorUserId:'owner',visibility:'PRIVATE'}]});
  await db.projectDocument.createMany({data:[{id:'shared-doc',organisationId:viewer.organisationId,projectId:'public',ownerUserId:'owner',visibility:'PROJECT',title:'Shared knowledge',body:'Visible'},{id:'private-doc',organisationId:viewer.organisationId,projectId:'public',ownerUserId:'owner',visibility:'PRIVATE',title:'Secret note',body:'Secret note body'}]});
  await db.projectDocumentRevision.create({data:{organisationId:viewer.organisationId,documentId:'private-doc',version:1,body:'Secret note body',authorUserId:'owner'}});
  await db.auditEntry.create({data:{organisationId:viewer.organisationId,action:'TaskCreated',entityType:'ProjectTask',entityId:'private-task',workTaskId:'private-task',after:{title:'Secret work title'}}});
 });
 afterAll(async()=>{await db.$disconnect();});
 it('filters private project and standalone task titles before returning rows',async()=>{
  const projects=await executeReadQuery(viewer,'project','findMany',{select:{name:true}}) as Array<{name:string}>;
  const tasks=await executeReadQuery(viewer,'projectTask','findMany',{where:taskScope(viewer),select:{title:true,project:{select:{name:true}}}}) as Array<{title:string}>;
  expect(projects.map(p=>p.name)).toEqual(['Visible project']);expect(tasks.map(t=>t.title)).toEqual(['Visible work']);
 });
 it('filters nested project children and nested counts',async()=>{
  const rows=await executeReadQuery(viewer,'project','findMany',{include:{documents:true,tasks:true,_count:{select:{documents:true}}}}) as Array<{documents:Array<{title:string}>;_count:{documents:number}}>;
  expect(rows[0].documents.map(d=>d.title)).toEqual(['Shared knowledge']);expect(rows[0]._count.documents).toBe(1);
 });
 it('does not expose private note bodies through revisions or audit history',async()=>{
  const docs=await executeReadQuery(viewer,'projectDocument','findMany',{where:documentScope(viewer)}) as unknown[];
  const revisions=await executeReadQuery(viewer,'projectDocumentRevision','findMany',{});
  const audit=await executeReadQuery(viewer,'auditEntry','findMany',{});
  expect(docs).toHaveLength(1);expect(revisions).toEqual([]);expect(audit).toEqual([]);
 });
 it('rejects stale optimistic writes and keeps the prior version intact',async()=>{
  await db.projectTask.updateMany({where:{id:'visible-task',version:1},data:{status:'IN_PROGRESS',version:{increment:1}}});
  const stale=await db.projectTask.updateMany({where:{id:'visible-task',version:1},data:{status:'DONE',version:{increment:1}}});
  expect(stale.count).toBe(0);expect((await db.projectTask.findUniqueOrThrow({where:{id:'visible-task'}})).status).toBe('IN_PROGRESS');
 });
 it('does not accept generic gateway mutations or a foreign tenant lookup',async()=>{
  await expect(executeReadQuery(viewer,'projectTask','update',{where:{id:'private-task'},data:{title:'spoofed'}})).rejects.toThrow('only read');
  expect(await executeReadQuery({...viewer,organisationId:'foreign'},'project','findMany',{})).toEqual([]);
 });
});
