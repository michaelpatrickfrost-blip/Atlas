"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {required,text,choice,integer,range,member,audit,changed} from '@/core/shared/operational-forms';
import {JOB_TYPES,jobTransition} from '../domain/rules';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
export async function saveFieldJob(f:FormData){
 const s=await requireSession();
 assertCapability(s,'fieldservice.job.manage');
 await assertModuleEnabled(s,'fieldservice');assertCapability(s,'customers.read');const id=text(f,'id'),partyId=required(f,'partyId');if(!await db.party.findFirst({where:{id:partyId,organisationId:s.organisationId,archived:false,identityScrubbed:false}}))throw Error('Customer unavailable.');const r=range(f,'scheduledStart','scheduledEnd'),engineerUserId=await member(s,text(f,'engineerUserId'));if(engineerUserId){const overlap=await db.fieldServiceJob.findFirst({where:{organisationId:s.organisationId,engineerUserId,...(id?{id:{not:id}}:{}),status:{notIn:['COMPLETED','CANCELLED']},scheduledStart:{lt:r.end},scheduledEnd:{gt:r.start}},select:{id:true}});if(overlap)throw Error('This engineer already has a job in that time window.');}const data={partyId,title:required(f,'title'),kind:choice(required(f,'kind'),JOB_TYPES),site:required(f,'site',1000),contactName:text(f,'contactName'),contactPhone:text(f,'contactPhone',80),engineerUserId,scheduledStart:r.start,scheduledEnd:r.end,timezone:r.timezone,instructions:required(f,'instructions',12000)};let saved=id;await db.$transaction(async tx=>{if(engineerUserId&&await tx.fieldServiceJob.findFirst({where:{organisationId:s.organisationId,engineerUserId,...(id?{id:{not:id}}:{}),status:{notIn:['COMPLETED','CANCELLED']},scheduledStart:{lt:r.end},scheduledEnd:{gt:r.start}},select:{id:true}}))throw Error('This engineer already has a job in that time window.');if(id)changed((await tx.fieldServiceJob.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),status:'SCHEDULED'},data:{...data,version:{increment:1}}})).count);else saved=(await tx.fieldServiceJob.create({data:{...data,organisationId:s.organisationId,createdByUserId:s.userId}})).id;await audit(tx,s,'fieldservice.job.saved','FieldServiceJob',saved,{partyId,engineerUserId});},{isolationLevel:'Serializable'});revalidatePath('/fieldservice','layout');if(!id)redirect('/fieldservice/'+saved);
}
export async function updateFieldJob(f:FormData){
 const s=await requireSession();
 assertCapability(s,'fieldservice.job.manage');
 await assertModuleEnabled(s,'fieldservice');const id=required(f,'id'),j=await db.fieldServiceJob.findFirst({where:{id,organisationId:s.organisationId}});if(!j)throw Error('Job unavailable.');const status=required(f,'status');jobTransition(j.status,status);const resolution=text(f,'resolution',12000);if(status==='COMPLETED'&&!resolution)throw Error('Record the job outcome before completion.');await db.$transaction(async tx=>{changed((await tx.fieldServiceJob.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),status:j.status},data:{status,findings:text(f,'findings',12000),resolution,actualMinutes:integer(f,'actualMinutes',0,525600),completedAt:status==='COMPLETED'?new Date():null,version:{increment:1}}})).count);await tx.fieldServiceEntry.create({data:{organisationId:s.organisationId,jobId:id,kind:status,body:resolution||text(f,'findings',12000)||status,authorUserId:s.userId}});await audit(tx,s,'fieldservice.job.'+status.toLowerCase(),'FieldServiceJob',id);});revalidatePath('/fieldservice','layout');
}
export async function addFieldJobNote(f:FormData){
 const s=await requireSession();
 assertCapability(s,'fieldservice.job.manage');
 await assertModuleEnabled(s,'fieldservice');const id=required(f,'id');await db.$transaction(async tx=>{changed((await tx.fieldServiceJob.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),status:{notIn:['COMPLETED','CANCELLED']}},data:{version:{increment:1}}})).count);const n=await tx.fieldServiceEntry.create({data:{organisationId:s.organisationId,jobId:id,kind:'NOTE',body:required(f,'body',12000),authorUserId:s.userId}});await audit(tx,s,'fieldservice.note.added','FieldServiceEntry',n.id,{jobId:id});});revalidatePath('/fieldservice','layout');
}
