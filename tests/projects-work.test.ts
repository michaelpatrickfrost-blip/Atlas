import {describe,it,expect} from 'vitest';
import {assertAcyclic,dependencyConflicts,progress,nextOccurrence,signals,scheduleForecast,distributeEffort} from '@/modules/projects/domain/work';
import {projectScope,taskScope,documentScope} from '@/core/permissions/work-access';
import {modelScope} from '@/server/data-api/read-policy';
import type {Session} from '@/core/auth/session';
const session={organisationId:'org',userId:'michael',capabilities:new Set(['projects.read'])} as Session;
const task=(id:string,status='TODO',weight=1)=>({id,title:id,status,weight,estimatedMinutes:60,startAt:new Date('2026-10-06'),dueAt:new Date('2026-10-07'),priority:'NORMAL'});
describe('Projects work model',()=>{
 it('detects downstream dependency delay without changing deadlines',()=>{const a={...task('a'),dueAt:new Date('2026-10-08')},b=task('b');const conflicts=dependencyConflicts([a,b],[{predecessorId:'a',successorId:'b',kind:'FINISH_TO_START',lagDays:0}]);expect(conflicts[0].days).toBe(2);expect(b.startAt.toISOString()).toContain('2026-10-06');});
 it('rejects cycles including indirect dependencies',()=>{expect(()=>assertAcyclic([{predecessorId:'b',successorId:'c'},{predecessorId:'c',successorId:'a'}],'a','b')).toThrow('cycle');expect(()=>assertAcyclic([],'a','a')).toThrow();});
 it('distinguishes task count and weighted progress and excludes cancelled work',()=>{const tasks=[task('a','DONE',9),task('b','TODO',1),task('c','CANCELLED',100)];expect(progress(tasks,'TASK_COUNT')).toBe(50);expect(progress(tasks,'WEIGHTED_TASKS')).toBe(90);expect(progress(tasks,'MANUAL',23)).toBe(23);});
 it('clamps monthly recurrence to the last day rather than skipping February',()=>{expect(nextOccurrence(new Date('2027-01-31'),'MONTHLY').toISOString()).toBe('2027-02-28T00:00:00.000Z');});
 it('completed tasks do not produce deadline warnings',()=>{expect(signals([task('a','DONE')],new Date('2026-12-01'))).toEqual([]);});
});
describe('Projects read boundaries',()=>{
 it('uses the same project and task scopes in the remote gateway',()=>{expect(modelScope(session,'Project')).toEqual(projectScope(session));expect(modelScope(session,'ProjectTask')).toEqual(taskScope(session));expect(modelScope(session,'ProjectDocument')).toEqual(documentScope(session));});
 it('private project access requires owner or explicit membership; company visibility is separate',()=>{expect(projectScope(session).organisationId).toBe('org');expect(projectScope(session).OR).toContainEqual({ownerUserId:'michael'});expect(projectScope(session).OR).toContainEqual({members:{some:{organisationId:'org',userId:'michael'}}});expect(projectScope(session).OR).toContainEqual(expect.objectContaining({visibility:'TEAM'}));});
 it('private notes require document ownership even inside an accessible project',()=>{const scope=documentScope(session);expect(scope.AND).toEqual([{OR:[{projectId:null},{project:projectScope(session)}]},{OR:[{ownerUserId:'michael'},{visibility:'PROJECT',project:projectScope(session)}]}]);});
 it('dependency reads require access to both ends and revisions inherit note privacy',()=>{expect(modelScope(session,'ProjectDependency')).toEqual({organisationId:'org',predecessor:taskScope(session),successor:taskScope(session)});expect(modelScope(session,'ProjectDocumentRevision')).toEqual({organisationId:'org',document:documentScope(session)});});
});

describe('deterministic project planning',()=>{
 it('propagates a prerequisite delay into forecast and negative slack',()=>{const a={...task('a'),startAt:new Date('2026-10-05'),dueAt:new Date('2026-10-08')},b={...task('b'),startAt:new Date('2026-10-06'),dueAt:new Date('2026-10-07')};const result=scheduleForecast([a,b],[{predecessorId:'a',successorId:'b',kind:'FINISH_TO_START',lagDays:1}],new Date('2026-10-08'));expect(result.forecast?.toISOString()).toBe('2026-10-10T00:00:00.000Z');expect(result.slack.b).toBe(-2);expect(result.critical).toContain('a');});
 it('reports missing dates without guessing task duration',()=>{expect(scheduleForecast([{...task('a'),startAt:null}],[],null)).toEqual({forecast:null,critical:[],slack:{},missingDates:1});});
 it('distributes effort across the working period rather than loading the due date',()=>{const result=distributeEffort({startAt:new Date('2026-10-05'),dueAt:new Date('2026-10-09'),estimatedMinutes:1200},new Date('2026-10-05'));expect(result).toEqual([240,240,240,240,240,0,0]);});
});
