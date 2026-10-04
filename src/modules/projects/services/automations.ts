import {applyCompanyAccessRestrictions} from '@/core/permissions/company-access';
import type {Prisma} from '@/generated/prisma/client';
import type {Session} from '@/core/auth/session';
/** Runs only deterministic internal actions. Unique event keys and no recursive
 * dispatch prevent duplicate executions and loops. No external messaging. */
export async function applyTaskAutomations(tx:Prisma.TransactionClient,session:Session,task:{id:string;projectId:string|null;taskType:string;title:string},trigger:string,version:number){
 if(!task.projectId)return;
 const rules=await tx.projectAutomationRule.findMany({where:{organisationId:session.organisationId,projectId:task.projectId,enabled:true,trigger}});
 for(const rule of rules.slice(0,20)){
  if(rule.taskType&&rule.taskType!==task.taskType)continue;
  const eventKey=`${task.id}:${version}:${trigger}`;
  if(await tx.projectAutomationExecution.findUnique({where:{ruleId_eventKey:{ruleId:rule.id,eventKey}}}))continue;
  const membership=await tx.membership.findFirst({where:{organisationId:session.organisationId,userId:rule.creatorUserId,active:true},include:{organisation:{select:{restrictedAccessAreas:true}},roles:{include:{role:true}}}}),project=await tx.project.findUniqueOrThrow({where:{id:task.projectId},include:{members:true}});
  const creatorCapabilities=membership?applyCompanyAccessRestrictions(new Set([...membership.roles.flatMap(r=>r.role.capabilities),...membership.grantedCapabilities].filter(c=>!membership.deniedCapabilities.includes(c))),membership.organisation.restrictedAccessAreas):new Set<string>();
  const authorised=creatorCapabilities.has('projects.manage')&&(project.ownerUserId===rule.creatorUserId||project.members.some(m=>m.userId===rule.creatorUserId&&['MANAGER','LEAD','MEMBER','CONTRIBUTOR'].includes(m.role)));
  if(!authorised){await tx.projectAutomationExecution.create({data:{organisationId:session.organisationId,ruleId:rule.id,eventKey,result:'SKIPPED: creator no longer has management access'}});continue;}
  if(rule.action==='CREATE_FOLLOW_UP')await tx.projectTask.create({data:{organisationId:session.organisationId,projectId:task.projectId,creatorUserId:rule.creatorUserId,assigneeUserId:rule.creatorUserId,title:rule.followUpTitle??`Follow up: ${task.title}`,visibility:'PROJECT',reference:`TASK-${crypto.randomUUID().slice(0,8).toUpperCase()}`}});
  if(rule.action==='NOTIFY_OWNER'&&project.ownerUserId)await tx.projectInboxItem.create({data:{organisationId:session.organisationId,userId:project.ownerUserId,projectId:task.projectId,taskId:task.id,label:`${rule.name}: ${task.title}`,kind:'AUTOMATION'}});
  await tx.projectAutomationExecution.create({data:{organisationId:session.organisationId,ruleId:rule.id,eventKey,result:'COMPLETED'}});
 }
}
