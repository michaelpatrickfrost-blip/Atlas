"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";
export async function createProject(form:FormData) {
 const session = await requireSession();
 assertCapability(session,"projects.manage");
  await assertModuleEnabled(session, "projects");
 const partyId=String(form.get("partyId")), name=String(form.get("name")??"").trim();
 if(!name || name.length>200) throw new Error("Enter a project name.");
 await db.party.findFirstOrThrow({where:{id:partyId,organisationId:session.organisationId}});
 const project=await db.project.create({data:{organisationId:session.organisationId,partyId,name,reference:`PR-${crypto.randomUUID().slice(0,8).toUpperCase()}`,notes:String(form.get("notes")??"").slice(0,10000)}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:"project.created",entityType:"Project",entityId:project.id});
 revalidatePath("/projects");
}
export async function changeProjectStatus(id:string,form:FormData) {
 const session = await requireSession();
 assertCapability(session,"projects.manage");
  await assertModuleEnabled(session, "projects");
 const status=String(form.get("status"));
 if(!["PLANNED","ACTIVE","ON_HOLD","COMPLETED","CANCELLED"].includes(status)) throw new Error("Invalid status.");
 await db.project.update({where:{id,organisationId:session.organisationId},data:{status}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:"project.status.updated",entityType:"Project",entityId:id,after:{status}});
 revalidatePath("/projects");
}

export async function createTask(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'projects.manage');
 await assertModuleEnabled(session,'projects');
 const title=String(form.get('title')??'').trim(),assigneeUserId=String(form.get('assigneeUserId')),projectId=String(form.get('projectId')??'')||null,meetingId=String(form.get('meetingId')??'')||null,due=String(form.get('dueAt')??''),dueAt=due?new Date(due):null;
 if(!title||title.length>300||(dueAt&&isNaN(dueAt.getTime())))throw new Error('Enter a task title and valid date.');
 await db.membership.findFirstOrThrow({where:{userId:assigneeUserId,organisationId:session.organisationId}});
 if(projectId)await db.project.findFirstOrThrow({where:{id:projectId,organisationId:session.organisationId}});
 if(meetingId)await db.meeting.findFirstOrThrow({where:{id:meetingId,organisationId:session.organisationId}});
 const task=await db.projectTask.create({data:{organisationId:session.organisationId,title,assigneeUserId,projectId,meetingId,dueAt}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'task.assigned',entityType:'ProjectTask',entityId:task.id,after:{assigneeUserId,title}});
 revalidatePath('/projects/tasks');
}
export async function changeTaskStatus(id:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,'projects.manage');
 await assertModuleEnabled(session,'projects');
 const status=String(form.get('status'));
 if(!['TODO','IN_PROGRESS','BLOCKED','DONE'].includes(status))throw new Error('Invalid task status.');
 await db.projectTask.update({where:{id,organisationId:session.organisationId},data:{status}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'task.status.updated',entityType:'ProjectTask',entityId:id,after:{status}});
 revalidatePath('/projects/tasks');
}
export async function createMeeting(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'projects.manage');
 await assertModuleEnabled(session,'projects');
 const title=String(form.get('title')??'').trim(),startsAt=new Date(String(form.get('startsAt'))),projectId=String(form.get('projectId')??'')||null,attendeeUserIds=[...new Set(form.getAll('attendee').map(String))];
 if(!title||title.length>200||isNaN(startsAt.getTime()))throw new Error('Enter a meeting title and valid start time.');
 const members=await db.membership.count({where:{organisationId:session.organisationId,userId:{in:attendeeUserIds}}});
 if(members!==attendeeUserIds.length)throw new Error('Choose attendees from this company.');
 if(projectId)await db.project.findFirstOrThrow({where:{id:projectId,organisationId:session.organisationId}});
 const meeting=await db.meeting.create({data:{organisationId:session.organisationId,title,startsAt,projectId,attendeeUserIds,organiserUserId:session.userId,notes:String(form.get('notes')??'').slice(0,10000)}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'meeting.created',entityType:'Meeting',entityId:meeting.id});
 revalidatePath('/projects/meetings');
}
