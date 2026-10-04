'use server';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { db } from '@/core/db/client';
import { revalidatePath } from 'next/cache';
export async function createWorkTeam(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'planning.team.manage');await assertModuleEnabled(session,'planning');
 const name=String(form.get('name')??'').trim(),code=String(form.get('code')??'').trim(),ids=[...new Set(form.getAll('membershipId').map(String))];
 if(!name||name.length>100||!code||code.length>30||ids.length>100)throw new Error('Enter a team name, code and up to 100 members.');
 await db.$transaction(async tx=>{
  const members=await tx.membership.findMany({where:{organisationId:session.organisationId,active:true,id:{in:ids}},select:{id:true}});if(members.length!==ids.length)throw new Error('Choose active people from your workspace.');
  if(await tx.workTeam.findUnique({where:{organisationId_code:{organisationId:session.organisationId,code}}}))throw new Error('A team with this code already exists.');
  const team=await tx.workTeam.create({data:{organisationId:session.organisationId,name,code,members:{create:ids.map(membershipId=>({membershipId}))}}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'team.created',entityType:'WorkTeam',entityId:team.id,after:{name,code,membershipIds:ids}}});
 });revalidatePath('/planning','layout');
}
