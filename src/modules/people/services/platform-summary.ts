import type {Session} from '@/core/auth/session';
import {can} from '@/core/permissions/check';
import {HR_CAPABILITIES as HR} from '@/core/permissions/capabilities';
import {db} from '@/core/db/client';
export async function platformSummary(session:Session,now=new Date()){
 const organisationId=session.organisationId,today=new Date(now.toISOString().slice(0,10)+'T00:00:00Z'),soon=new Date(today.getTime()+30*86400000),fortnight=new Date(today.getTime()+14*86400000),live={organisationId,status:{not:'LEFT' as const}};
 const [statuses,departments,trainingOverdue,trainingRenewals,documentRenewals,leave,expenses,vacancies,appraisals,meetings]=await Promise.all([
 db.employee.groupBy({by:['status'],where:{organisationId},_count:true}),db.employee.groupBy({by:['department'],where:{...live,status:{in:['ACTIVE','ON_LEAVE','OFFBOARDING']},startDate:{lte:now}},_count:true}),
 db.employeeTraining.count({where:{organisationId,employee:live,status:{in:['PLANNED','IN_PROGRESS']},dueOn:{lt:today}}}),db.employeeTraining.count({where:{organisationId,employee:live,status:'COMPLETED',expiresOn:{lte:soon}}}),db.employeeDocument.count({where:{organisationId,employee:live,status:'ACTIVE',expiresOn:{lte:soon}}}),
 can(session,HR.absenceManage)?db.absenceRecord.count({where:{organisationId,status:'PENDING'}}):null,
 can(session,HR.expenseApprove)?db.expenseClaim.count({where:{organisationId,status:'PENDING'}}):null,
 can(session,HR.employeeManage)?db.hrVacancy.count({where:{organisationId,status:'OPEN'}}):null,
 can(session,HR.appraisalRead)?db.appraisal.count({where:{organisationId,status:'SCHEDULED',scheduledAt:{lte:fortnight},employee:live}}):null,
 can(session,HR.oneToOneRead)?db.oneToOne.count({where:{organisationId,status:'SCHEDULED',scheduledAt:{lte:fortnight},employee:live}}):null,
 ]);return {statuses,departments,trainingOverdue,trainingRenewals,documentRenewals,leave,expenses,vacancies,appraisals,meetings,today,soon,fortnight};
}
