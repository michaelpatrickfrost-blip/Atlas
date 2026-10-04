"use server";
import {z} from 'zod';
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {db} from '@/core/db/client';
import {revalidatePath} from 'next/cache';
export async function delegateApprovals(form:FormData){
 const session=await requireSession();
 assertCapability(session,'core.approvals.delegate');
 const toUserId=z.string().min(1).parse(String(form.get('toUserId')??'')),startAt=new Date(String(form.get('startAt')??'')),endAt=new Date(String(form.get('endAt')??''));if(toUserId===session.userId||Number.isNaN(startAt.getTime())||Number.isNaN(endAt.getTime())||startAt>=endAt)throw new Error('Choose another active member and a valid delegation interval.');
 await db.$transaction(async tx=>{await tx.membership.findFirstOrThrow({where:{organisationId:session.organisationId,userId:toUserId,active:true}});if(await tx.approvalDelegation.count({where:{organisationId:session.organisationId,fromUserId:session.userId,startAt:{lte:endAt},endAt:{gte:startAt}}}))throw new Error('A delegation already overlaps this interval.');const delegation=await tx.approvalDelegation.create({data:{organisationId:session.organisationId,fromUserId:session.userId,toUserId,startAt,endAt}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'approval.delegated',entityType:'ApprovalDelegation',entityId:delegation.id,after:{toUserId,startAt:startAt.toISOString(),endAt:endAt.toISOString()}}});},{isolationLevel:'Serializable'});revalidatePath('/finance/control');
}
