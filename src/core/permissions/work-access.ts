import type { Session } from '@/core/auth/session';
import type { Prisma } from '@/generated/prisma/client';
/** Shared record visibility predicates, also enforced by the data gateway. */
export function projectScope(session: Session): Prisma.ProjectWhereInput {
 return {organisationId:session.organisationId,OR:[{visibility:'COMPANY'},{visibility:'TEAM',team:{organisationId:session.organisationId,members:{some:{membership:{organisationId:session.organisationId,userId:session.userId,active:true}}}}},{ownerUserId:session.userId},{members:{some:{organisationId:session.organisationId,userId:session.userId}}}]};
}
export function taskScope(session: Session): Prisma.ProjectTaskWhereInput {
 return {organisationId:session.organisationId,OR:[{projectId:{not:null},project:projectScope(session)},{projectId:null,OR:[{creatorUserId:session.userId},{assigneeUserId:session.userId},{contributorUserIds:{has:session.userId}},{visibility:'COMPANY'}]}]};
}
export function documentScope(session:Session):Prisma.ProjectDocumentWhereInput {
 return {organisationId:session.organisationId,AND:[{OR:[{projectId:null},{project:projectScope(session)}]},{OR:[{ownerUserId:session.userId},{visibility:'PROJECT',project:projectScope(session)}]}]};
}

export function workAuditScope(session:Session):Prisma.AuditEntryWhereInput {
 const workTypes=['Project','ProjectTask','ProjectDocument','ProjectComment','ProjectMilestone','ProjectDecision','ProjectRisk','ProjectUpdate','ProjectApproval','ProjectRequest','ProjectTimeEntry','ProjectBaseline','ProjectWorkLink','ProjectPortfolio'];
 const base:Prisma.AuditEntryWhereInput={organisationId:session.organisationId,OR:[{workProjectId:null,workTaskId:null,workDocumentId:null,entityType:{notIn:workTypes}}]};
 if(session.capabilities.has('projects.read'))(base.OR as Prisma.AuditEntryWhereInput[]).push({workProjectId:{not:null},workProject:projectScope(session),workTaskId:null,workDocumentId:null},{workTask:taskScope(session),workDocumentId:null},{workDocument:documentScope(session)});
 return base;
}
