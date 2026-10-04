import {db} from '@/core/db/client';
import type {Session} from '@/core/auth/session';
import {projectScope,taskScope,documentScope} from '@/core/permissions/work-access';
import {assertCapability} from '@/core/permissions/check';
export async function workData(session:Session){
 assertCapability(session,'projects.read');
 const [projects,tasks,members,documents,milestones,portfolios,inbox,views,teams]=await Promise.all([
 db.project.findMany({where:projectScope(session),include:{members:true},orderBy:{updatedAt:'desc'}}),
 db.projectTask.findMany({where:taskScope(session),include:{project:{select:{id:true,name:true}},checklist:true,predecessors:true},orderBy:[{position:'asc'},{dueAt:'asc'}]}),
 db.membership.findMany({where:{organisationId:session.organisationId,active:true},select:{userId:true,user:{select:{name:true}}}}),
 db.projectDocument.findMany({where:documentScope(session),orderBy:{updatedAt:'desc'}}),
 db.projectMilestone.findMany({where:{organisationId:session.organisationId,project:projectScope(session)},orderBy:{targetAt:'asc'}}),
 db.projectPortfolio.findMany({where:{organisationId:session.organisationId,ownerUserId:session.userId},include:{projects:{where:{project:projectScope(session)}}}}),
 db.projectInboxItem.findMany({where:{organisationId:session.organisationId,userId:session.userId,dismissedAt:null,AND:[{OR:[{snoozedUntil:null},{snoozedUntil:{lte:new Date()}}]},{OR:[{projectId:null},{project:projectScope(session)}]},{OR:[{taskId:null},{task:taskScope(session)}]}]},orderBy:{createdAt:'desc'}}),
 db.projectSavedView.findMany({where:{organisationId:session.organisationId,userId:session.userId},orderBy:{name:'asc'}}),
 db.workTeam.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true}})
 ]);return {projects,tasks,members,documents,milestones,portfolios,inbox,views,teams};
}
export async function requireProject(session:Session,id:string,edit=false){
 const project=await db.project.findFirst({where:{AND:[projectScope(session),{id}]},include:{members:true}});if(!project)throw new Error('Project unavailable.');
 if(edit&&project.archivedAt)throw new Error('Archived projects are read-only.');
 if(edit&&!session.capabilities.has('projects.manage'))throw new Error('Project management permission required.');
 if(edit&&project.ownerUserId!==session.userId&&!project.members.some(m=>m.userId===session.userId&&['LEAD','MANAGER','MEMBER','CONTRIBUTOR'].includes(m.role))&&!(project.visibility==='COMPANY'&&!project.ownerUserId))throw new Error('You have read-only access to this project.');return project;
}
export async function requireTask(session:Session,id:string,edit=false){const task=await db.projectTask.findFirst({where:{AND:[taskScope(session),{id}]}});if(!task)throw new Error('Task unavailable.');if(edit){if(task.projectId)await requireProject(session,task.projectId,true);else if(task.creatorUserId!==session.userId&&task.assigneeUserId!==session.userId)throw new Error('Only the task owner can edit personal work.');}return task;}
