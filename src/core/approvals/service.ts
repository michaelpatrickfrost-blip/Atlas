import type {Prisma} from '@/generated/prisma/client';
import type {Session} from '@/core/auth/session';
import {stagesSchema,routePolicy} from './policy';
export async function createApproval(tx:Prisma.TransactionClient,session:Session,input:{subjectType:string;subjectId:string;subjectVersion:number;amount:bigint;currency:string;context:Record<string,string|boolean|null>}){
 const policies=await tx.approvalPolicy.findMany({where:{organisationId:session.organisationId,subjectType:input.subjectType,active:true}});
 const policy=routePolicy(policies,input.amount,input.currency,input.context),stages=stagesSchema.parse(policy.stages);
 const ids=[...new Set(stages.flat())];const members=await tx.membership.findMany({where:{organisationId:session.organisationId,userId:{in:ids},active:true},select:{userId:true}});if(members.length!==ids.length)throw new Error('Approval route contains an inactive or foreign approver.');if(ids.includes(session.userId))throw new Error('Approval route cannot include the requester.');
 const instance=await tx.approvalInstance.create({data:{organisationId:session.organisationId,subjectType:input.subjectType,subjectId:input.subjectId,subjectVersion:input.subjectVersion,requesterUserId:session.userId,policyId:policy.id,policyVersion:policy.version,snapshot:{...input.context,amount:input.amount.toString(),currency:input.currency},steps:{create:stages.flatMap((users,stage)=>users.map(approverUserId=>({stage,approverUserId,dueAt:new Date(Date.now()+48*3600000)})))}}});
 await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'approval.requested',entityType:'ApprovalInstance',entityId:instance.id,after:{subjectType:input.subjectType,subjectId:input.subjectId,subjectVersion:input.subjectVersion,policyId:policy.id,policyVersion:policy.version}}});return instance;
}
export async function decideApproval(tx:Prisma.TransactionClient,session:Session,instanceId:string,decision:'APPROVED'|'REJECTED'|'INFORMATION',reason:string){
 const organisationId=session.organisationId;const instance=await tx.approvalInstance.findFirstOrThrow({where:{id:instanceId,organisationId},include:{steps:true}});if(instance.requesterUserId===session.userId)throw new Error('You cannot approve your own request.');if(instance.status!=='PENDING')throw new Error('This approval is not pending.');
 const now=new Date(),delegations=await tx.approvalDelegation.findMany({where:{organisationId,toUserId:session.userId,startAt:{lte:now},endAt:{gte:now}}});const principals=new Set([session.userId,...delegations.map(d=>d.fromUserId)]);
 const steps=instance.steps.filter(s=>s.stage===instance.currentStage&&s.status==='PENDING'&&principals.has(s.approverUserId));if(!steps.length)throw new Error('This approval is assigned to another person or stage.');
 for(const step of steps){const changed=await tx.approvalStep.updateMany({where:{id:step.id,organisationId,status:'PENDING'},data:{status:decision,actedByUserId:session.userId,reason,actedAt:now}});if(changed.count!==1)throw new Error('Approval changed; reload.');}
 const pending=await tx.approvalStep.count({where:{instanceId,organisationId,stage:instance.currentStage,status:'PENDING'}});
 const next=instance.steps.some(s=>s.stage===instance.currentStage+1);
 const status=decision==='REJECTED'?'REJECTED':decision==='INFORMATION'?'INFORMATION':pending===0&&!next?'APPROVED':'PENDING';
 await tx.approvalInstance.update({where:{id:instance.id},data:{status,...(status==='PENDING'&&pending===0?{currentStage:{increment:1}}:{})}});
 await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'approval.decided',entityType:'ApprovalInstance',entityId:instance.id,after:{decision,status,reason,originalApprovers:steps.map(s=>s.approverUserId)}}});return {...instance,status};
}
