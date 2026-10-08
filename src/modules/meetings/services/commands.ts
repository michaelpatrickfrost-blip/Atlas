"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {projectScope} from '@/core/permissions/work-access';
import {required,text,choice,range,safeJoinUrl,member,integer,day,audit,changed} from '@/core/shared/operational-forms';
import {meetingAccess} from './queries';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
export async function saveMeeting(f:FormData){
 const s=await requireSession();
 assertCapability(s,'meetings.meeting.manage');
 await assertModuleEnabled(s,'meetings');const id=text(f,'id'),r=range(f),projectId=text(f,'projectId')||null,title=required(f,'title'),attendeeUserIds=[...new Set(f.getAll('attendee').map(String))];if(attendeeUserIds.length>100)throw Error('Choose up to 100 attendees.');for(const user of attendeeUserIds)await member(s,user);if(projectId){assertCapability(s,'projects.read');await assertModuleEnabled(s,'projects');if(!await db.project.findFirst({where:{AND:[projectScope(s),{id:projectId,archivedAt:null}]}}))throw Error('Project unavailable.');}const data={title,startsAt:r.start,endsAt:r.end,timezone:r.timezone,projectId,attendeeUserIds,agenda:text(f,'agenda',12000),location:text(f,'location',300),joinUrl:safeJoinUrl(text(f,'joinUrl',2000)),visibility:choice(text(f,'visibility'),['COMPANY','PRIVATE'],'visibility')};let saved=id;
 await db.$transaction(async tx=>{if(id){const m=await meetingAccess(s,id);if(m.organiserUserId!==s.userId||m.status!=='SCHEDULED')throw Error('Only the organiser can edit a scheduled meeting.');if(m.microsoftEventId&&!m.microsoftManaged)throw Error('Edit this imported meeting in Outlook, then refresh it in Atlas.');changed((await tx.meeting.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),organiserUserId:s.userId,status:'SCHEDULED'},data:{...data,version:{increment:1}}})).count);}else{saved=(await tx.meeting.create({data:{...data,organisationId:s.organisationId,organiserUserId:s.userId}})).id;}await audit(tx,s,id?'meetings.meeting.updated':'meetings.meeting.created','Meeting',saved,{title});});revalidatePath('/meetings','layout');revalidatePath('/projects/meetings');if(!id)redirect('/meetings/'+saved);
}
export async function meetingStatus(f:FormData){
 const s=await requireSession();
 assertCapability(s,'meetings.meeting.manage');
 await assertModuleEnabled(s,'meetings');const id=required(f,'id'),m=await meetingAccess(s,id),status=choice(required(f,'status'),['COMPLETED','CANCELLED']);if(m.organiserUserId!==s.userId||m.status!=='SCHEDULED')throw Error('Only the organiser can close a scheduled meeting.');await db.$transaction(async tx=>{changed((await tx.meeting.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),status:'SCHEDULED',organiserUserId:s.userId},data:{status,version:{increment:1}}})).count);await audit(tx,s,'meetings.meeting.'+status.toLowerCase(),'Meeting',id);});revalidatePath('/meetings','layout');revalidatePath('/projects/meetings');
}
export async function addMeetingEntry(f:FormData){
 const s=await requireSession();
 assertCapability(s,'meetings.meeting.manage');
 await assertModuleEnabled(s,'meetings');const id=required(f,'id'),m=await meetingAccess(s,id);if(m.organiserUserId!==s.userId&&!m.attendeeUserIds.includes(s.userId))throw Error('Only attendees or the organiser can record meeting notes.');if(m.status==='CANCELLED')throw Error('Cancelled meetings are read-only.');const kind=choice(required(f,'kind'),['NOTE','DECISION','ACTION']),ownerUserId=await member(s,text(f,'ownerUserId'));if(kind==='ACTION'&&!ownerUserId)throw Error('Assign an owner for the action.');await db.$transaction(async tx=>{changed((await tx.meeting.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),status:{not:'CANCELLED'}},data:{version:{increment:1}}})).count);const e=await tx.meetingEntry.create({data:{organisationId:s.organisationId,meetingId:id,kind,body:required(f,'body',12000),ownerUserId,dueAt:day(f,'dueAt'),authorUserId:s.userId}});await audit(tx,s,'meetings.entry.created','MeetingEntry',e.id,{meetingId:id,kind});});revalidatePath('/meetings','layout');
}
export async function completeMeetingAction(f:FormData){
 const s=await requireSession();
 assertCapability(s,'meetings.meeting.manage');
 await assertModuleEnabled(s,'meetings');const e=await db.meetingEntry.findFirst({where:{id:required(f,'id'),organisationId:s.organisationId,kind:'ACTION'}});if(!e)throw Error('Action unavailable.');const m=await meetingAccess(s,e.meetingId);if(e.ownerUserId!==s.userId&&m.organiserUserId!==s.userId)throw Error('Only the action owner or organiser can complete this action.');await db.$transaction(async tx=>{changed((await tx.meetingEntry.updateMany({where:{id:e.id,organisationId:s.organisationId,version:integer(f,'version',1),status:'OPEN'},data:{status:'COMPLETED',completedAt:new Date(),version:{increment:1}}})).count);await audit(tx,s,'meetings.action.completed','MeetingEntry',e.id);});revalidatePath('/meetings','layout');
}
