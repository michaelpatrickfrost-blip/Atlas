'use server';
import {scheduleDate} from '@/modules/projects/domain/gantt';
import {requireSession,type Session} from '@/core/auth/session';
import {assertCapability,can} from '@/core/permissions/check';
import {getNavigableModules} from '@/core/modules/runtime';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import type {Prisma} from '@/generated/prisma/client';
import {revalidatePath} from 'next/cache';
import {applyTaskAutomations} from '@/modules/projects/services/automations';
import {requireProject,requireTask} from '@/modules/projects/services/queries';
import {documentScope,projectScope,taskScope,meetingScope} from '@/core/permissions/work-access';
import {distributeEffort,choice,integer,dateValue,assertDateRange,assertAcyclic,nextOccurrence,TASK_STATUSES,PROJECT_STATUSES,HEALTHS,PRIORITIES,TASK_TYPES,PROJECT_TYPES} from '@/modules/projects/domain/work';
const text=(f:FormData,key:string,max=10000)=>String(f.get(key)??'').trim().slice(0,max);
function required(f:FormData,key:string,max=300){const value=text(f,key,max);if(!value)throw new Error(`Enter ${key}.`);return value;}
const refresh=()=>revalidatePath('/projects','layout');
async function member(session:Session,id:string){if(!await db.membership.findFirst({where:{organisationId:session.organisationId,userId:id,active:true}}))throw new Error('Choose an active member of this company.');}
async function event(tx:Prisma.TransactionClient,s:Session,action:string,entityType:string,entityId:string,after:Prisma.InputJsonValue){
 let workProjectId:string|null=null,workTaskId:string|null=null,workDocumentId:string|null=null;
 if(entityType==='Project')workProjectId=entityId;
 else if(entityType==='ProjectTask')workTaskId=entityId;
 else if(entityType==='ProjectDocument')workDocumentId=entityId;
 else if(entityType==='ProjectComment'){const row=await tx.projectComment.findUniqueOrThrow({where:{id:entityId}});workProjectId=row.projectId;workTaskId=row.taskId;}
 else if(entityType==='ProjectWorkLink'){const row=await tx.projectWorkLink.findUniqueOrThrow({where:{id:entityId}});workProjectId=row.projectId;workTaskId=row.taskId;}
 else if(entityType==='ProjectTimeEntry')workTaskId=(await tx.projectTimeEntry.findUniqueOrThrow({where:{id:entityId}})).taskId;
 else {const delegates={ProjectMilestone:tx.projectMilestone,ProjectDecision:tx.projectDecision,ProjectRisk:tx.projectRisk,ProjectUpdate:tx.projectUpdate,ProjectApproval:tx.projectApproval,ProjectRequest:tx.projectRequest,ProjectBaseline:tx.projectBaseline};const delegate=delegates[entityType as keyof typeof delegates];if(delegate){const row=await (delegate as typeof tx.projectMilestone).findUniqueOrThrow({where:{id:entityId}});workProjectId=row.projectId;}}
 await tx.auditEntry.create({data:{organisationId:s.organisationId,actorUserId:s.userId,action,entityType,entityId,after,workProjectId,workTaskId,workDocumentId}});
 await tx.domainOutbox.create({data:{organisationId:s.organisationId,eventKey:crypto.randomUUID(),eventName:action,payload:{entityId,entityType,actorUserId:s.userId}}});
}

function conflict(count:number){if(count!==1)throw new Error('This record changed. Refresh and review the latest version before saving.');}
export async function createProject(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');
 const partyId=text(form,'partyId')||null,ownerUserId=text(form,'ownerUserId')||session.userId;await member(session,ownerUserId);
 if(partyId){assertCapability(session,'customers.read');await db.party.findFirstOrThrow({where:{id:partyId,organisationId:session.organisationId}});}
 const visibility=choice(text(form,'visibility')||'PRIVATE',['PRIVATE','INVITE_ONLY','TEAM','COMPANY'],'visibility'),projectType=choice(text(form,'projectType')||'TEAM',PROJECT_TYPES,'project type');
 const teamId=text(form,'teamId')||null;if(teamId)await db.workTeam.findFirstOrThrow({where:{id:teamId,organisationId:session.organisationId}});if(visibility==='TEAM'&&!teamId)throw new Error('Choose a team for team visibility.');
 const startAt=dateValue(text(form,'startAt')),targetAt=dateValue(text(form,'targetAt'));assertDateRange(startAt,targetAt);
 await db.$transaction(async tx=>{const p=await tx.project.create({data:{organisationId:session.organisationId,partyId,ownerUserId,teamId,name:required(form,'name',200),reference:`PRJ-${crypto.randomUUID().slice(0,8).toUpperCase()}`,visibility,projectType,startAt,targetAt,notes:text(form,'notes'),members:{create:{organisationId:session.organisationId,userId:session.userId,role:session.userId===ownerUserId?'OWNER':'MANAGER'}}}});await event(tx,session,'ProjectCreated','Project',p.id,{name:p.name,visibility});});refresh();
}
export async function changeProjectStatus(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);const status=choice(text(form,'status'),PROJECT_STATUSES,'status');
 const version=integer(form.get('version'),1,2147483646,'version');await db.$transaction(async tx=>{ if(status==='COMPLETED'){if(await tx.projectTask.count({where:{organisationId:session.organisationId,projectId:id,status:{notIn:['DONE','CANCELLED']}}}))throw new Error('Complete or cancel outstanding tasks before closing the project.');if(await tx.projectRisk.count({where:{organisationId:session.organisationId,projectId:id,status:'OPEN'}}))throw new Error('Resolve open risks and issues before closure.');if(await tx.projectApproval.count({where:{organisationId:session.organisationId,projectId:id,status:'PENDING'}}))throw new Error('Resolve pending approvals before closure.');}
const result=await tx.project.updateMany({where:{id,organisationId:session.organisationId,version},data:{status,completedAt:status==='COMPLETED'?new Date():null,version:{increment:1}}});conflict(result.count);await event(tx,session,'ProjectStatusChanged','Project',id,{status});},{isolationLevel:'Serializable'});refresh();
}
export async function editProject(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);
 const startAt=dateValue(text(form,'startAt')),targetAt=dateValue(text(form,'targetAt'));assertDateRange(startAt,targetAt);const health=choice(text(form,'health'),HEALTHS,'health'),progressMethod=choice(text(form,'progressMethod'),['TASK_COUNT','WEIGHTED_TASKS','EFFORT','MANUAL'],'progress method');
 await db.$transaction(async tx=>{conflict((await tx.project.updateMany({where:{id,organisationId:session.organisationId,version:integer(form.get('version'),1,2147483646,'version')},data:{name:required(form,'name',200),notes:text(form,'notes'),startAt,targetAt,health,progressMethod,manualProgress:integer(form.get('manualProgress'),0,100,'progress'),updateCadenceDays:integer(form.get('updateCadenceDays'),0,366,'update cadence'),tags:text(form,'tags').split(',').map(t=>t.trim()).filter(Boolean).slice(0,30),version:{increment:1}}})).count);await event(tx,session,'ProjectChanged','Project',id,{health,targetAt:targetAt?.toISOString()??null});});refresh();
}
export async function setProjectMember(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const p=await requireProject(session,id,true);
 if(p.ownerUserId&&p.ownerUserId!==session.userId&&!p.members.some(m=>m.userId===session.userId&&m.role==='MANAGER'))throw new Error('Only the project owner or manager can manage access.');
 const userId=required(form,'userId');await member(session,userId);const role=choice(text(form,'role'),['MANAGER','LEAD','MEMBER','CONTRIBUTOR','COMMENTER','VIEWER'],'project role');
 await db.$transaction(async tx=>{await tx.projectMember.upsert({where:{projectId_userId:{projectId:id,userId}},create:{organisationId:session.organisationId,projectId:id,userId,role},update:{role}});await event(tx,session,'ProjectMemberChanged','Project',id,{userId,role});});refresh();
}
export async function archiveProject(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const p=await requireProject(session,id,true);if(!['COMPLETED','CANCELLED'].includes(p.status))throw new Error('Close or cancel this project before archiving.');
 await db.$transaction(async tx=>{conflict((await tx.project.updateMany({where:{id,organisationId:session.organisationId,version:integer(form.get('version'),1,2147483646,'version')},data:{archivedAt:new Date(),version:{increment:1}}})).count);await event(tx,session,'ProjectArchived','Project',id,{});});refresh();
}
export async function createTask(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');
 const projectId=text(form,'projectId')||null,parentTaskId=text(form,'parentTaskId')||null,meetingId=text(form,'meetingId')||null,milestoneId=text(form,'milestoneId')||null,assigneeUserId=text(form,'assigneeUserId')||session.userId;await member(session,assigneeUserId);if(projectId){const p=await requireProject(session,projectId,true);if(['COMPLETED','CANCELLED'].includes(p.status))throw new Error('Reopen the project before adding work.');if(!await db.project.findFirst({where:{AND:[projectScope({...session,userId:assigneeUserId}),{id:projectId}]}}))throw new Error('Invite this task owner to the project first.');}
 if(parentTaskId){const parent=await requireTask(session,parentTaskId,true);if(parent.projectId!==projectId)throw new Error('Subtasks must use the same project.');}
 if(meetingId){const m=await db.meeting.findFirstOrThrow({where:{AND:[meetingScope(session),{id:meetingId}]}});if(m.projectId!==projectId)throw new Error('Choose a meeting from this project.');}
 if(milestoneId){if(!projectId)throw new Error('Choose a project before assigning a milestone.');await db.projectMilestone.findFirstOrThrow({where:{id:milestoneId,organisationId:session.organisationId,projectId}});}
 const startAt=dateValue(text(form,'startAt')),dueAt=dateValue(text(form,'dueAt'));assertDateRange(startAt,dueAt);
 await db.$transaction(async tx=>{const task=await tx.projectTask.create({data:{organisationId:session.organisationId,projectId,parentTaskId,meetingId,milestoneId,reference:`TASK-${crypto.randomUUID().slice(0,8).toUpperCase()}`,creatorUserId:session.userId,visibility:projectId?'PROJECT':'PRIVATE',title:required(form,'title'),description:text(form,'description'),assigneeUserId,startAt,dueAt,priority:choice(text(form,'priority')||'NORMAL',PRIORITIES,'priority'),taskType:choice(text(form,'taskType')||'TASK',TASK_TYPES,'task type'),estimatedMinutes:integer(form.get('estimatedMinutes')||0,0,525600,'estimate')}});if(assigneeUserId!==session.userId)await tx.projectInboxItem.create({data:{organisationId:session.organisationId,userId:assigneeUserId,projectId,taskId:task.id,label:`Assigned: ${task.title}`,kind:'ASSIGNMENT'}});await event(tx,session,'TaskCreated','ProjectTask',task.id,{title:task.title,assigneeUserId});});refresh();
}
export async function changeTaskStatus(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const task=await requireTask(session,id,true),status=choice(text(form,'status'),TASK_STATUSES,'task status');
 await db.$transaction(async tx=>{if(status==='DONE'){if(await tx.projectTask.count({where:{organisationId:session.organisationId,parentTaskId:id,status:{notIn:['DONE','CANCELLED']}}}))throw new Error('Finish the subtasks first.');if(await tx.projectChecklistItem.count({where:{organisationId:session.organisationId,taskId:id,done:false}}))throw new Error('Finish the checklist first.');if(await tx.projectDependency.count({where:{organisationId:session.organisationId,successorId:id,predecessor:{status:{notIn:['DONE','CANCELLED']}}}}))throw new Error('A prerequisite is still incomplete.');}
 conflict((await tx.projectTask.updateMany({where:{id,organisationId:session.organisationId,version:integer(form.get('version'),1,2147483646,'version')},data:{status,completedAt:status==='DONE'?new Date():null,version:{increment:1}}})).count);
 if(status==='DONE'&&task.status!=='DONE'&&task.recurrence){const next=nextOccurrence(task.dueAt??new Date(),task.recurrence);await tx.projectTask.create({data:{organisationId:session.organisationId,projectId:task.projectId,title:task.title,description:task.description,assigneeUserId:task.assigneeUserId,creatorUserId:session.userId,visibility:task.visibility,priority:task.priority,estimatedMinutes:task.estimatedMinutes,recurrence:task.recurrence,dueAt:next,reference:`TASK-${crypto.randomUUID().slice(0,8).toUpperCase()}`}});}if(task.status!==status&&['DONE','BLOCKED'].includes(status))await applyTaskAutomations(tx,session,task,status==='DONE'?'TASK_COMPLETED':'TASK_BLOCKED',task.version+1);await event(tx,session,status==='DONE'?'TaskCompleted':'TaskStatusChanged','ProjectTask',id,{status});});refresh();
}
export async function editTask(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const current=await requireTask(session,id,true);const milestoneId=text(form,'milestoneId')||null;if(milestoneId)await db.projectMilestone.findFirstOrThrow({where:{id:milestoneId,projectId:current.projectId??'',organisationId:session.organisationId}});const contributorUserIds=[...new Set(form.getAll('contributor').map(String))];for(const userId of contributorUserIds)await member(session,userId);const assigneeUserId=required(form,'assigneeUserId');await member(session,assigneeUserId);if(current.projectId){for(const userId of [assigneeUserId,...contributorUserIds])if(!await db.project.findFirst({where:{AND:[projectScope({...session,userId}),{id:current.projectId}]}}))throw new Error('Invite the owner and contributors to this project first.');}const startAt=dateValue(text(form,'startAt')),dueAt=dateValue(text(form,'dueAt'));assertDateRange(startAt,dueAt);const recurrence=text(form,'recurrence')||null;if(recurrence)choice(recurrence,['DAILY','WEEKLY','MONTHLY','QUARTERLY','ANNUALLY'],'recurrence');
 await db.$transaction(async tx=>{conflict((await tx.projectTask.updateMany({where:{id,organisationId:session.organisationId,version:integer(form.get('version'),1,2147483646,'version')},data:{title:required(form,'title'),description:text(form,'description'),assigneeUserId,milestoneId,contributorUserIds,startAt,dueAt,priority:choice(text(form,'priority'),PRIORITIES,'priority'),estimatedMinutes:integer(form.get('estimatedMinutes'),0,525600,'estimate'),weight:integer(form.get('weight'),1,10000,'weight'),waitingReason:text(form,'waitingReason')||null,waitingUntil:dateValue(text(form,'waitingUntil')),recurrence,version:{increment:1}}})).count);await event(tx,session,'TaskChanged','ProjectTask',id,{assigneeUserId,dueAt:dueAt?.toISOString()??null});});refresh();
}
export async function checklistItem(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireTask(session,id,true);const itemId=text(form,'itemId');await db.$transaction(async tx=>{if(itemId)conflict((await tx.projectChecklistItem.updateMany({where:{id:itemId,taskId:id,organisationId:session.organisationId},data:{done:form.get('done')==='true'}})).count);else await tx.projectChecklistItem.create({data:{organisationId:session.organisationId,taskId:id,title:required(form,'title')}});await event(tx,session,'TaskChecklistChanged','ProjectTask',id,{});});refresh();
}
export async function addDependency(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireTask(session,id,true);const predecessorId=required(form,'predecessorId');await requireTask(session,predecessorId,true);
 await db.$transaction(async tx=>{const edges=await tx.projectDependency.findMany({where:{organisationId:session.organisationId}});assertAcyclic(edges,predecessorId,id);await tx.projectDependency.create({data:{organisationId:session.organisationId,predecessorId,successorId:id,kind:choice(text(form,'kind')||'FINISH_TO_START',['FINISH_TO_START','START_TO_START','FINISH_TO_FINISH','START_TO_FINISH'],'dependency'),lagDays:integer(form.get('lagDays')||0,-365,365,'lag')}});await event(tx,session,'TaskDependencyAdded','ProjectTask',id,{predecessorId});},{isolationLevel:'Serializable'});refresh();
}
export async function createMeeting(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const projectId=text(form,'projectId')||null;if(projectId)await requireProject(session,projectId,true);const startsAt=dateValue(required(form,'startsAt'))!;const attendeeUserIds=[...new Set(form.getAll('attendee').map(String))];for(const userId of attendeeUserIds)await member(session,userId);
 await db.$transaction(async tx=>{const m=await tx.meeting.create({data:{organisationId:session.organisationId,projectId,title:required(form,'title',200),startsAt,attendeeUserIds,organiserUserId:session.userId,notes:text(form,'notes')}});await event(tx,session,'ProjectMeetingCreated','Meeting',m.id,{});});refresh();
}
export async function createDocument(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const projectId=text(form,'projectId')||null;if(projectId)await requireProject(session,projectId,true);const visibility=projectId?choice(text(form,'visibility')||'PRIVATE',['PRIVATE','PROJECT'],'document visibility'):'PRIVATE';
 await db.$transaction(async tx=>{const d=await tx.projectDocument.create({data:{organisationId:session.organisationId,projectId,ownerUserId:session.userId,kind:choice(text(form,'kind')||'NOTE',['NOTE','DOC'],'document type'),visibility,title:required(form,'title'),body:text(form,'body',100000)}});await tx.projectDocumentRevision.create({data:{organisationId:session.organisationId,documentId:d.id,version:1,body:d.body,authorUserId:session.userId}});await event(tx,session,'DocumentCreated','ProjectDocument',d.id,{});});refresh();
}
export async function editDocument(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const d=await db.projectDocument.findFirstOrThrow({where:{AND:[documentScope(session),{id}]}});if(d.ownerUserId!==session.userId){if(d.visibility==='PRIVATE'||!d.projectId)throw new Error('Only the owner can edit this note.');await requireProject(session,d.projectId,true);}
 const version=integer(form.get('version'),1,2147483646,'version');await db.$transaction(async tx=>{conflict((await tx.projectDocument.updateMany({where:{id,organisationId:session.organisationId,version},data:{title:required(form,'title'),body:text(form,'body',100000),version:{increment:1}}})).count);await tx.projectDocumentRevision.create({data:{organisationId:session.organisationId,documentId:id,version:version+1,body:text(form,'body',100000),authorUserId:session.userId}});await event(tx,session,'DocumentUpdated','ProjectDocument',id,{version:version+1});});refresh();
}
export async function addComment(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');const projectId=text(form,'projectId')||null,taskId=text(form,'taskId')||null;if(taskId){const t=await requireTask(session,taskId);if(t.projectId!==projectId)throw new Error('Comment context does not match the task.');}else if(projectId)await requireProject(session,projectId);else throw new Error('Choose a task or project.');
 if(projectId){const p=await requireProject(session,projectId);if(p.ownerUserId!==session.userId&&!p.members.some(m=>m.userId===session.userId&&m.role!=='VIEWER')&&p.ownerUserId)throw new Error('Comment access is required.');}
 const mentionUserIds=[...new Set(form.getAll('mention').map(String))];for(const userId of mentionUserIds){await member(session,userId);const recipient={...session,userId};if(taskId&&!await db.projectTask.findFirst({where:{AND:[taskScope(recipient),{id:taskId}]}}))throw new Error('Mentioned person cannot access this task.');if(projectId&&!await db.project.findFirst({where:{AND:[projectScope(recipient),{id:projectId}]}}))throw new Error('Mentioned person cannot access this project.');}
 await db.$transaction(async tx=>{const c=await tx.projectComment.create({data:{organisationId:session.organisationId,projectId,taskId,authorUserId:session.userId,body:required(form,'body'),mentionUserIds}});for(const userId of mentionUserIds)await tx.projectInboxItem.create({data:{organisationId:session.organisationId,userId,projectId,taskId,label:'You were mentioned in a comment',kind:'MENTION'}});await event(tx,session,'ProjectCommentAdded','ProjectComment',c.id,{});});refresh();
}
export async function createMilestone(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);await db.$transaction(async tx=>{const m=await tx.projectMilestone.create({data:{organisationId:session.organisationId,projectId:id,name:required(form,'name'),targetAt:dateValue(required(form,'targetAt'))!,ownerUserId:session.userId}});await event(tx,session,'MilestoneCreated','ProjectMilestone',m.id,{});});refresh();
}
export async function publishUpdate(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);await db.$transaction(async tx=>{const u=await tx.projectUpdate.create({data:{organisationId:session.organisationId,projectId:id,authorUserId:session.userId,health:choice(text(form,'health'),HEALTHS,'health'),summary:required(form,'summary',10000),next:text(form,'next'),risks:text(form,'risks'),decisionsNeeded:text(form,'decisionsNeeded')}});await event(tx,session,'ProjectUpdatePublished','ProjectUpdate',u.id,{});});refresh();
}
export async function createDecision(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);const supersedesId=text(form,'supersedesId')||null;
 await db.$transaction(async tx=>{if(supersedesId)conflict((await tx.projectDecision.updateMany({where:{id:supersedesId,projectId:id,organisationId:session.organisationId,status:{not:'SUPERSEDED'}},data:{status:'SUPERSEDED',version:{increment:1}}})).count);const d=await tx.projectDecision.create({data:{organisationId:session.organisationId,projectId:id,title:required(form,'title'),reason:required(form,'reason',10000),alternatives:text(form,'alternatives'),ownerUserId:session.userId,supersedesId}});await event(tx,session,'DecisionProposed','ProjectDecision',d.id,{});});refresh();
}
export async function decide(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const d=await db.projectDecision.findFirstOrThrow({where:{id,organisationId:session.organisationId}});await requireProject(session,d.projectId,true);
 const status=choice(text(form,'status'),['APPROVED','REJECTED'],'decision');await db.$transaction(async tx=>{conflict((await tx.projectDecision.updateMany({where:{id,organisationId:session.organisationId,status:{in:['PROPOSED','PENDING']},version:integer(form.get('version'),1,2147483646,'version')},data:{status,decidedAt:new Date(),version:{increment:1}}})).count);await event(tx,session,'DecisionResponded','ProjectDecision',id,{status});});refresh();
}
export async function createRisk(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);await db.$transaction(async tx=>{const r=await tx.projectRisk.create({data:{organisationId:session.organisationId,projectId:id,kind:choice(text(form,'kind')||'RISK',['RISK','ISSUE','ASSUMPTION'],'RAID type'),title:required(form,'title'),description:text(form,'description'),probability:integer(form.get('probability')||3,1,5,'probability'),impact:integer(form.get('impact')||3,1,5,'impact'),mitigation:text(form,'mitigation'),ownerUserId:session.userId,dueAt:dateValue(text(form,'dueAt'))}});await event(tx,session,'RiskCreated','ProjectRisk',r.id,{});});refresh();
}
export async function closeRisk(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const r=await db.projectRisk.findFirstOrThrow({where:{id,organisationId:session.organisationId}});await requireProject(session,r.projectId,true);await db.$transaction(async tx=>{conflict((await tx.projectRisk.updateMany({where:{id,organisationId:session.organisationId,version:integer(form.get('version'),1,2147483646,'version')},data:{status:'CLOSED',version:{increment:1}}})).count);await event(tx,session,'RiskClosed','ProjectRisk',id,{});});refresh();
}
export async function requestApproval(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const p=await requireProject(session,id,true),approverUserId=required(form,'approverUserId');await member(session,approverUserId);if(!await db.project.findFirst({where:{AND:[projectScope({...session,userId:approverUserId}),{id}]}}))throw new Error('Invite the approver to this project first.');
 await db.$transaction(async tx=>{const a=await tx.projectApproval.create({data:{organisationId:session.organisationId,projectId:id,title:required(form,'title'),requesterUserId:session.userId,approverUserId,subjectVersion:p.version}});await tx.projectInboxItem.create({data:{organisationId:session.organisationId,projectId:id,userId:approverUserId,label:a.title,kind:'APPROVAL'}});await event(tx,session,'ApprovalRequested','ProjectApproval',a.id,{});});refresh();
}
export async function respondApproval(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');const a=await db.projectApproval.findFirstOrThrow({where:{id,organisationId:session.organisationId,approverUserId:session.userId}}),p=await requireProject(session,a.projectId);if(p.version!==a.subjectVersion)throw new Error('The project has changed since this approval was requested. Request a fresh approval.');const status=choice(text(form,'status'),['APPROVED','REJECTED','CHANGES_REQUESTED'],'approval response');
 await db.$transaction(async tx=>{conflict((await tx.projectApproval.updateMany({where:{id,organisationId:session.organisationId,status:'PENDING',approverUserId:session.userId},data:{status,response:required(form,'response'),respondedAt:new Date()}})).count);await event(tx,session,'ApprovalCompleted','ProjectApproval',id,{status});});refresh();
}
export async function submitRequest(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');await requireProject(session,id);await db.$transaction(async tx=>{const r=await tx.projectRequest.create({data:{organisationId:session.organisationId,projectId:id,title:required(form,'title'),description:required(form,'description',10000),creatorUserId:session.userId,dueAt:dateValue(text(form,'dueAt'))}});await event(tx,session,'RequestSubmitted','ProjectRequest',r.id,{});});refresh();
}
export async function triageRequest(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const r=await db.projectRequest.findFirstOrThrow({where:{id,organisationId:session.organisationId}});await requireProject(session,r.projectId,true);const status=choice(text(form,'status'),['ACCEPTED','REJECTED','MORE_INFORMATION'],'triage outcome');
 await db.$transaction(async tx=>{conflict((await tx.projectRequest.updateMany({where:{id,organisationId:session.organisationId,status:{in:['TRIAGE','MORE_INFORMATION']},version:integer(form.get('version'),1,2147483646,'version')},data:{status,version:{increment:1}}})).count);if(status==='ACCEPTED'){const t=await tx.projectTask.create({data:{organisationId:session.organisationId,projectId:r.projectId,creatorUserId:session.userId,assigneeUserId:session.userId,title:r.title,description:r.description,dueAt:r.dueAt,visibility:'PROJECT',taskType:'REQUEST',reference:`TASK-${crypto.randomUUID().slice(0,8).toUpperCase()}`}});await tx.projectRequest.update({where:{id},data:{taskId:t.id}});}await event(tx,session,'RequestTriaged','ProjectRequest',id,{status});});refresh();
}
export async function logTime(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');await requireTask(session,id);await db.$transaction(async tx=>{const e=await tx.projectTimeEntry.create({data:{organisationId:session.organisationId,taskId:id,userId:session.userId,minutes:integer(form.get('minutes'),1,1440,'minutes'),workedAt:dateValue(required(form,'workedAt'))!,note:text(form,'note')}});await event(tx,session,'ProjectTimeLogged','ProjectTimeEntry',e.id,{});});refresh();
}
export async function planToday(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');await requireTask(session,id);const day=dateValue(required(form,'day'))!;day.setUTCHours(0,0,0,0);await db.projectPersonalPlan.upsert({where:{organisationId_userId_taskId_day:{organisationId:session.organisationId,userId:session.userId,taskId:id,day}},create:{organisationId:session.organisationId,userId:session.userId,taskId:id,day},update:{}});refresh();
}
export async function updateInbox(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');const mode=choice(text(form,'mode'),['DISMISS','SNOOZE'],'inbox action'),snoozedUntil=dateValue(text(form,'snoozedUntil'));if(mode==='SNOOZE'&&(!snoozedUntil||snoozedUntil<=new Date()))throw new Error('Choose a future snooze date.');conflict((await db.projectInboxItem.updateMany({where:{id,organisationId:session.organisationId,userId:session.userId},data:mode==='DISMISS'?{dismissedAt:new Date()}:{snoozedUntil}})).count);refresh();
}
export async function saveView(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');const name=required(form,'name',100),definition={group:choice(text(form,'group')||'status',['status','assignee','priority','project'],'board grouping'),layout:choice(text(form,'layout'),['list','board','calendar','timeline'],'layout'),status:text(form,'status'),owner:text(form,'owner'),query:text(form,'query'),projectId:text(form,'projectId')};await db.projectSavedView.upsert({where:{organisationId_userId_name:{organisationId:session.organisationId,userId:session.userId,name}},create:{organisationId:session.organisationId,userId:session.userId,name,definition},update:{definition}});refresh();
}
export async function createPortfolio(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const ids=[...new Set(form.getAll('projectId').map(String))];for(const id of ids)await requireProject(session,id,true);await db.$transaction(async tx=>{const p=await tx.projectPortfolio.create({data:{organisationId:session.organisationId,name:required(form,'name'),kind:choice(text(form,'kind')||'PORTFOLIO',['PORTFOLIO','PROGRAMME','GOAL'],'group type'),description:text(form,'description'),ownerUserId:session.userId,projects:{create:ids.map(projectId=>({organisationId:session.organisationId,projectId}))}}});await event(tx,session,'PortfolioCreated','ProjectPortfolio',p.id,{});});refresh();
}
export async function createBaseline(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const p=await requireProject(session,id,true);await db.$transaction(async tx=>{const [tasks,milestones,budgets]=await Promise.all([tx.projectTask.findMany({where:{organisationId:session.organisationId,projectId:id}}),tx.projectMilestone.findMany({where:{organisationId:session.organisationId,projectId:id}}),tx.projectBudgetLine.findMany({where:{organisationId:session.organisationId,projectId:id}})]);const b=await tx.projectBaseline.create({data:{organisationId:session.organisationId,projectId:id,name:required(form,'name'),authorUserId:session.userId,snapshot:JSON.parse(JSON.stringify({targetAt:p.targetAt,tasks,milestones,budgets}))}});await event(tx,session,'ProjectBaselineCreated','ProjectBaseline',b.id,{});});refresh();
}
export async function setBudget(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);const category=choice(text(form,'category'),['LABOUR','MATERIALS','SERVICES','EQUIPMENT','TRAVEL','FREIGHT','OTHER'],'budget category'),currency=choice(text(form,'currency')||'GBP',['GBP','EUR','USD'],'currency'),amountMinorUnits=integer(form.get('amountMinorUnits'),0,2147483647,'amount in minor units');
 await db.$transaction(async tx=>{await tx.projectBudgetLine.upsert({where:{projectId_category_currency:{projectId:id,category,currency}},create:{organisationId:session.organisationId,projectId:id,category,currency,amountMinorUnits},update:{amountMinorUnits,version:{increment:1}}});await event(tx,session,'ProjectBudgetChanged','Project',id,{category,currency,amountMinorUnits});});refresh();
}
export async function linkWork(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const projectId=text(form,'projectId')||null,taskId=text(form,'taskId')||null;if(taskId){const task=await requireTask(session,taskId,true);if(task.projectId!==projectId)throw new Error('Work link context does not match.');}else if(projectId)await requireProject(session,projectId,true);else throw new Error('Select a project or task.');const targetEntity=choice(text(form,'targetEntity'),['ProjectTask','ProjectDocument','Party','Product','SalesOrder','Quote'],'record type'),targetId=required(form,'targetId');
 if(targetEntity==='ProjectTask')await requireTask(session,targetId);else if(targetEntity==='ProjectDocument')await db.projectDocument.findFirstOrThrow({where:{AND:[documentScope(session),{id:targetId}]}});else {const capability={Party:'customers.read',Product:'core.products.read',SalesOrder:'sales.order.read',Quote:'sales.quote.read'}[targetEntity];if(!capability||!can(session,capability))throw new Error('Restricted Atlas record.');if(targetEntity==='Party')await db.party.findFirstOrThrow({where:{id:targetId,organisationId:session.organisationId}});if(targetEntity==='Product')await db.product.findFirstOrThrow({where:{id:targetId,organisationId:session.organisationId}});if(targetEntity==='SalesOrder')await db.salesOrder.findFirstOrThrow({where:{id:targetId,organisationId:session.organisationId}});if(targetEntity==='Quote')await db.quote.findFirstOrThrow({where:{id:targetId,organisationId:session.organisationId}});}
 await db.$transaction(async tx=>{const l=await tx.projectWorkLink.create({data:{organisationId:session.organisationId,projectId,taskId,targetEntity,targetId}});await event(tx,session,'ProjectWorkLinked','ProjectWorkLink',l.id,{});});refresh();
}

export async function getProjectActivity(id:string){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');await requireProject(session,id);
 const tasks=await db.projectTask.findMany({where:{AND:[taskScope(session),{projectId:id}]},select:{id:true}});
 return db.auditEntry.findMany({where:{organisationId:session.organisationId,OR:[{workProjectId:id,workTaskId:null,workDocumentId:null},{workTaskId:{in:tasks.map(t=>t.id)}}]},select:{id:true,action:true,actorUserId:true,createdAt:true},orderBy:{createdAt:'desc'},take:100});
}

export async function createAutomation(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);const trigger=choice(text(form,'trigger'),['TASK_COMPLETED','TASK_BLOCKED'],'trigger'),action=choice(text(form,'action'),['CREATE_FOLLOW_UP','NOTIFY_OWNER'],'automation action'),taskType=text(form,'taskType')||null;if(taskType)choice(taskType,TASK_TYPES,'task type');
 if(await db.projectAutomationRule.count({where:{organisationId:session.organisationId,projectId:id,enabled:true}})>=20)throw new Error('Limit this project to 20 active rules.');
 await db.$transaction(async tx=>{const r=await tx.projectAutomationRule.create({data:{organisationId:session.organisationId,projectId:id,creatorUserId:session.userId,name:required(form,'name'),trigger,action,taskType,followUpTitle:action==='CREATE_FOLLOW_UP'?required(form,'followUpTitle'):null}});await event(tx,session,'ProjectAutomationCreated','Project',id,{ruleId:r.id});});refresh();
}
export async function toggleAutomation(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const r=await db.projectAutomationRule.findFirstOrThrow({where:{id,organisationId:session.organisationId}});await requireProject(session,r.projectId,true);await db.projectAutomationRule.update({where:{id,organisationId:session.organisationId},data:{enabled:form.get('enabled')==='true'}});refresh();
}
export async function saveProjectTemplate(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const p=await requireProject(session,id,true),tasks=await db.projectTask.findMany({where:{organisationId:session.organisationId,projectId:id},include:{checklist:true}}),milestones=await db.projectMilestone.findMany({where:{organisationId:session.organisationId,projectId:id}}),anchor=(p.startAt??p.createdAt).getTime(),offset=(d:Date|null)=>d?Math.round((d.getTime()-anchor)/86400000):null;
 await db.projectTemplate.create({data:{organisationId:session.organisationId,ownerUserId:session.userId,name:required(form,'name'),description:p.notes??'',definition:JSON.parse(JSON.stringify({projectType:p.projectType,tasks:tasks.map(t=>({key:t.id,parentKey:t.parentTaskId,title:t.title,description:t.description,priority:t.priority,estimatedMinutes:t.estimatedMinutes,startOffset:offset(t.startAt),dueOffset:offset(t.dueAt),checklist:t.checklist.map(i=>i.title)})),milestones:milestones.map(m=>({name:m.name,offset:offset(m.targetAt)}))}))}});refresh();
}
export async function useProjectTemplate(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const template=await db.projectTemplate.findFirstOrThrow({where:{id,organisationId:session.organisationId,ownerUserId:session.userId}}),startAt=dateValue(required(form,'startAt'))!,name=required(form,'name',200),definition=template.definition as {projectType:string;tasks:Array<{key:string;parentKey:string|null;title:string;description:string;priority:string;estimatedMinutes:number;startOffset:number|null;dueOffset:number|null;checklist:string[]}>;milestones:Array<{name:string;offset:number}>};
 const shift=(offset:number|null)=>offset===null?null:new Date(startAt.getTime()+offset*86400000);
 await db.$transaction(async tx=>{const p=await tx.project.create({data:{organisationId:session.organisationId,name,notes:template.description,reference:`PRJ-${crypto.randomUUID().slice(0,8).toUpperCase()}`,ownerUserId:session.userId,startAt,visibility:'PRIVATE',projectType:definition.projectType}}),ids=new Map<string,string>();for(const t of definition.tasks){const task=await tx.projectTask.create({data:{organisationId:session.organisationId,projectId:p.id,title:t.title,description:t.description,priority:t.priority,estimatedMinutes:t.estimatedMinutes,assigneeUserId:session.userId,creatorUserId:session.userId,visibility:'PROJECT',startAt:shift(t.startOffset),dueAt:shift(t.dueOffset),checklist:{create:t.checklist.map(title=>({organisationId:session.organisationId,title}))},reference:`TASK-${crypto.randomUUID().slice(0,8).toUpperCase()}`}});ids.set(t.key,task.id);}for(const t of definition.tasks)if(t.parentKey&&ids.has(t.parentKey))await tx.projectTask.update({where:{id:ids.get(t.key)!},data:{parentTaskId:ids.get(t.parentKey)}});for(const m of definition.milestones)await tx.projectMilestone.create({data:{organisationId:session.organisationId,projectId:p.id,name:m.name,targetAt:shift(m.offset)!,ownerUserId:session.userId}});await event(tx,session,'ProjectCreatedFromTemplate','Project',p.id,{templateId:id});});refresh();
}
export async function startTimer(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');void form;await assertModuleEnabled(session,'projects');await requireTask(session,id);if(await db.projectTimer.findUnique({where:{organisationId_userId:{organisationId:session.organisationId,userId:session.userId}}}))throw new Error('Stop your current timer before starting another.');await db.projectTimer.create({data:{organisationId:session.organisationId,userId:session.userId,taskId:id}});refresh();
}
export async function stopTimer(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');void form;await assertModuleEnabled(session,'projects');await db.$transaction(async tx=>{const t=await tx.projectTimer.findUniqueOrThrow({where:{organisationId_userId:{organisationId:session.organisationId,userId:session.userId}}});const accessible=await tx.projectTask.findFirst({where:{AND:[taskScope(session),{id:t.taskId}]}});if(!accessible)throw new Error('Task access has changed. Ask the project owner to restore access before logging time.');conflict((await tx.projectTimer.deleteMany({where:{id:t.id,organisationId:session.organisationId,userId:session.userId}})).count);const minutes=Math.max(1,Math.ceil((Date.now()-t.startedAt.getTime())/60000));if(minutes>1440)throw new Error('Timer exceeded 24 hours. Correct it with a manual time entry.');await tx.projectTimeEntry.create({data:{organisationId:session.organisationId,taskId:t.taskId,userId:session.userId,minutes,workedAt:t.startedAt,note:'Timer'}});});refresh();
}
export async function projectPreference(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');await requireProject(session,id);const notificationMode=choice(text(form,'notificationMode')||'IMPORTANT',['ALL','IMPORTANT','MENTIONS','MUTE'],'notification preference'),favourite=form.get('favourite')==='true';await db.projectPreference.upsert({where:{organisationId_userId_projectId:{organisationId:session.organisationId,userId:session.userId,projectId:id}},create:{organisationId:session.organisationId,userId:session.userId,projectId:id,notificationMode,favourite,lastViewedAt:new Date()},update:{notificationMode,favourite,lastViewedAt:new Date()}});refresh();
}
export async function uploadProjectFile(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);const file=form.get('file');if(!(file instanceof File)||file.size===0||file.size>2*1024*1024)throw new Error('Choose a non-empty file up to 2 MB.');const mediaType=choice(file.type,['application/pdf','image/png','image/jpeg','text/plain'],'file type');const content=new Uint8Array(await file.arrayBuffer());
 await db.$transaction(async tx=>{const f=await tx.projectFile.create({data:{organisationId:session.organisationId,projectId:id,name:file.name.slice(0,200),mediaType,size:file.size,content,uploadedByUserId:session.userId}});await event(tx,session,'ProjectFileAdded','Project',id,{fileId:f.id});});refresh();
}
export async function readProjectFile(id:string){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');const f=await db.projectFile.findFirstOrThrow({where:{id,organisationId:session.organisationId}});await requireProject(session,f.projectId);return {name:f.name,mediaType:f.mediaType,content:Buffer.from(f.content).toString('base64')};
}
export async function createProperty(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');await requireProject(session,id,true);const kind=choice(text(form,'kind'),['TEXT','NUMBER','PERCENTAGE','DATE','SELECT','CHECKBOX','URL'],'property type'),options=text(form,'options').split(',').map(v=>v.trim()).filter(Boolean).slice(0,50);await db.projectProperty.create({data:{organisationId:session.organisationId,projectId:id,name:required(form,'name',100),kind,options}});refresh();
}
export async function setProperty(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const task=await requireTask(session,id,true),propertyId=required(form,'propertyId'),p=await db.projectProperty.findFirstOrThrow({where:{id:propertyId,organisationId:session.organisationId,projectId:task.projectId??''}}),value=text(form,'value',1000);
 if(p.kind==='NUMBER'&&(!value||!Number.isFinite(Number(value))))throw new Error('Enter a number.');if(p.kind==='PERCENTAGE'&&(!value||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>100))throw new Error('Enter 0–100.');if(p.kind==='DATE')dateValue(required(form,'value'));if(p.kind==='SELECT'&&!p.options.includes(value))throw new Error('Choose a configured option.');if(p.kind==='CHECKBOX')choice(value,['true','false'],'checkbox');if(p.kind==='URL'){const url=new URL(value);if(!['https:','http:'].includes(url.protocol))throw new Error('Use an HTTP or HTTPS link.');}
 await db.projectPropertyValue.upsert({where:{propertyId_taskId:{propertyId,taskId:id}},create:{organisationId:session.organisationId,propertyId,taskId:id,value},update:{value}});refresh();
}
export async function restoreDocument(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const d=await db.projectDocument.findFirstOrThrow({where:{AND:[documentScope(session),{id}]}});if(d.ownerUserId!==session.userId){if(d.visibility==='PRIVATE'||!d.projectId)throw new Error('Only the owner can restore this note.');await requireProject(session,d.projectId,true);}const revision=await db.projectDocumentRevision.findFirstOrThrow({where:{documentId:id,organisationId:session.organisationId,version:integer(form.get('restoreVersion'),1,2147483646,'restore version')}}),version=integer(form.get('version'),1,2147483646,'current version');await db.$transaction(async tx=>{conflict((await tx.projectDocument.updateMany({where:{id,organisationId:session.organisationId,version},data:{body:revision.body,version:{increment:1}}})).count);await tx.projectDocumentRevision.create({data:{organisationId:session.organisationId,documentId:id,version:version+1,body:revision.body,authorUserId:session.userId}});await event(tx,session,'DocumentRestored','ProjectDocument',id,{sourceVersion:revision.version});});refresh();
}

export async function createTaskFromDocument(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const doc=await db.projectDocument.findFirstOrThrow({where:{AND:[documentScope(session),{id}]}});if(doc.projectId)await requireProject(session,doc.projectId,true);if(doc.version!==integer(form.get('version'),1,2147483646,'version'))throw new Error('Document changed. Refresh before creating this action.');const selected=required(form,'selectedText',10000);if(!doc.body.includes(selected))throw new Error('Select text from the current document.');
 await db.$transaction(async tx=>{const task=await tx.projectTask.create({data:{organisationId:session.organisationId,projectId:doc.projectId,creatorUserId:session.userId,assigneeUserId:session.userId,title:required(form,'title'),description:selected,visibility:doc.projectId?'PROJECT':'PRIVATE',reference:`TASK-${crypto.randomUUID().slice(0,8).toUpperCase()}`}});await tx.projectWorkLink.create({data:{organisationId:session.organisationId,projectId:doc.projectId,taskId:task.id,targetEntity:'ProjectDocument',targetId:id,targetVersion:doc.version,anchorStart:doc.body.indexOf(selected),anchorEnd:doc.body.indexOf(selected)+selected.length,relationship:'FOLLOW_UP_TO'}});await event(tx,session,'TaskCreatedFromDocument','ProjectTask',task.id,{});});refresh();
}
export async function discardTimer(form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');void form;await assertModuleEnabled(session,'projects');await db.projectTimer.deleteMany({where:{organisationId:session.organisationId,userId:session.userId}});refresh();
}

export async function completeMilestone(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const m=await db.projectMilestone.findFirstOrThrow({where:{id,organisationId:session.organisationId}});await requireProject(session,m.projectId,true);await db.$transaction(async tx=>{if(await tx.projectTask.count({where:{organisationId:session.organisationId,milestoneId:id,status:{notIn:['DONE','CANCELLED']}}}))throw new Error('Complete the milestone’s tasks first.');conflict((await tx.projectMilestone.updateMany({where:{id,organisationId:session.organisationId,version:integer(form.get('version'),1,2147483646,'version')},data:{completedAt:new Date(),version:{increment:1}}})).count);await event(tx,session,'MilestoneCompleted','ProjectMilestone',id,{});},{isolationLevel:'Serializable'});refresh();
}
export async function resolveComment(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');const c=await db.projectComment.findFirstOrThrow({where:{id,organisationId:session.organisationId}});if(c.taskId)await requireTask(session,c.taskId);else if(c.projectId)await requireProject(session,c.projectId);if(c.authorUserId!==session.userId){assertCapability(session,'projects.manage');if(c.projectId)await requireProject(session,c.projectId,true);else if(c.taskId)await requireTask(session,c.taskId,true);}await db.projectComment.update({where:{id,organisationId:session.organisationId},data:{resolved:form.get('resolved')==='true'}});refresh();
}

export async function getProjectWorkload(fromIso:string){
 const session=await requireSession();
 assertCapability(session,'projects.manage');await assertModuleEnabled(session,'projects');const from=dateValue(fromIso)!;if(!from)throw new Error('Choose a workload week.');const [members,all,visible,modules]=await Promise.all([db.membership.findMany({where:{organisationId:session.organisationId,active:true},select:{userId:true,user:{select:{name:true}}}}),db.projectTask.findMany({where:{organisationId:session.organisationId,status:{notIn:['DONE','CANCELLED']}},select:{id:true,assigneeUserId:true,startAt:true,dueAt:true,estimatedMinutes:true}}),db.projectTask.findMany({where:{AND:[taskScope(session),{status:{notIn:['DONE','CANCELLED']}}]},select:{id:true}}),getNavigableModules(session)]),ids=new Set(visible.map(t=>t.id));const rosterProvider=modules.find(m=>m.staffRosterProvider)?.staffRosterProvider,roster=rosterProvider?await rosterProvider(session,true):[];
 return members.map(m=>{const staff=roster.find(e=>e.userId===m.userId),tasks=all.filter(t=>t.assigneeUserId===m.userId),workingDays=staff?.workingDays??[1,2,3,4,5],daily=Array(7).fill(0) as number[],privateDaily=Array(7).fill(0) as number[];for(const task of tasks){const allocation=distributeEffort(task,from,7,workingDays);allocation.forEach((value,i)=>{daily[i]+=value;if(!ids.has(task.id))privateDaily[i]+=value;});}return {userId:m.userId,name:m.user.name,dailyMinutes:daily,privateMinutes:privateDaily,contractedWeeklyHours:staff?.contractedWeeklyHours??null,unestimated:tasks.filter(t=>!t.estimatedMinutes).length,unscheduledMinutes:tasks.filter(t=>!t.startAt&&!t.dueAt).reduce((n,t)=>n+t.estimatedMinutes,0)};});
}

/** Date-only edit from Gantt; preserve all task content and retain an audited version. */
export async function rescheduleTask(id:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'projects.manage');
 await assertModuleEnabled(session,'projects');
 await requireTask(session,id,true);
 const startAt=scheduleDate(required(form,'startAt')),dueAt=scheduleDate(required(form,'dueAt'));
 assertDateRange(startAt,dueAt);
 const version=integer(form.get('version'),1,2147483646,'version');
 await db.$transaction(async tx=>{
  conflict((await tx.projectTask.updateMany({where:{id,organisationId:session.organisationId,version},data:{startAt,dueAt,version:{increment:1}}})).count);
  await event(tx,session,'TaskRescheduled','ProjectTask',id,{startAt:startAt!.toISOString(),dueAt:dueAt!.toISOString()});
 });
 refresh();
}
