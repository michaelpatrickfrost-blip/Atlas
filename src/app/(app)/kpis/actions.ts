"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
export async function createKpi(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'kpis.manage');
 await assertModuleEnabled(session,'kpis');
 const name=String(form.get('name')??'').trim(),teamName=String(form.get('teamName')??'').trim(),ownerUserId=String(form.get('ownerUserId')),target=Number(form.get('target')),direction=String(form.get('direction')),startsAt=new Date(String(form.get('startsAt'))),endsAt=new Date(String(form.get('endsAt')));
 if(!name||name.length>150||!teamName||teamName.length>100||!Number.isFinite(target)||target<0||!['AT_LEAST','AT_MOST'].includes(direction)||isNaN(startsAt.getTime())||isNaN(endsAt.getTime())||endsAt<startsAt)throw new Error('Enter a name, team, positive target and valid period.');
 await db.membership.findFirstOrThrow({where:{userId:ownerUserId,organisationId:session.organisationId}});
 await db.kpi.create({data:{organisationId:session.organisationId,name,teamName,ownerUserId,target,direction,startsAt,endsAt,unit:String(form.get('unit')??'count').slice(0,30)}});
 revalidatePath('/kpis');
}
export async function updateKpi(id:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,'kpis.manage');
 await assertModuleEnabled(session,'kpis');
 const value=Number(form.get('value')),note=String(form.get('note')??'').trim().slice(0,2000);
 if(!Number.isFinite(value)||value<0)throw new Error('Enter a valid non-negative value.');
 await db.$transaction(async tx=>{
  const kpi=await tx.kpi.update({where:{id,organisationId:session.organisationId},data:{current:value,updates:{create:{value,note,actorUserId:session.userId}}}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'kpi.updated',entityType:'Kpi',entityId:kpi.id,after:{value,note}}});
 });
 revalidatePath('/kpis');
}
