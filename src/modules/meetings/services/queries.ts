import {db} from '@/core/db/client';
import {requireSession,type Session} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {meetingScope,projectScope} from '@/core/permissions/work-access';
import {members} from '@/core/shared/operational-forms';
export async function meetingAccess(s:Session,id:string){const m=await db.meeting.findFirst({where:{AND:[meetingScope(s),{id}]}});if(!m)throw Error('Meeting unavailable.');return m;}
export async function meetingWorkspace(id?:string){const s=await requireSession();assertCapability(s,'meetings.meeting.read');await assertModuleEnabled(s,'meetings');const [items,people,projects]=await Promise.all([db.meeting.findMany({where:meetingScope(s),orderBy:{startsAt:'desc'},take:201}),members(s),s.capabilities.has('projects.read')?db.project.findMany({where:projectScope(s),select:{id:true,name:true},take:201}):[]]);const record=id?await meetingAccess(s,id):null;const entries=record?await db.meetingEntry.findMany({where:{organisationId:s.organisationId,meetingId:record.id},orderBy:{createdAt:'asc'},take:501}):[];return {s,items,people,projects,record,entries};}
