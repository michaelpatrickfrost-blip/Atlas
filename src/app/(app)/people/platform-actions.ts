"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {HR_CAPABILITIES as HR} from '@/core/permissions/capabilities';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {writeAudit} from '@/core/audit/log';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {HRInputError,text,date,link,version,TRAINING_STATUSES,assertApplicationMove,trainingDates} from '@/modules/people/domain/platform';
const stale=()=>new HRInputError('This record changed in another window. Refresh the saved record; your entered work is still here.');
function refresh(){for(const path of ['/people','/people/workspace','/people/recruitment','/people/training','/people/documents','/people/reports'])revalidatePath(path);}
async function expected<T>(run:()=>Promise<T>){try{return await run();}catch(e){if(e instanceof HRInputError)return {error:e.message};throw e;}}
export async function saveVacancy(id:string|null,form:FormData){
 const session=await requireSession();
 assertCapability(session,HR.employeeManage);
 await assertModuleEnabled(session,'people');
 return expected(async()=>{const data={title:text(form,'title',200,true),department:text(form,'department',150)||null,location:text(form,'location',150)||null,description:text(form,'description',8000,true),ownerUserId:text(form,'ownerUserId',100,true),targetStartOn:date(form,'targetStartOn'),status:text(form,'status',20,true)};
 if(!['OPEN','ON_HOLD','CLOSED'].includes(data.status))throw new HRInputError('Choose an open, on hold or closed vacancy.');
 const employmentType=text(form,'employmentType',30,true);if(!['FULL_TIME','PART_TIME','FIXED_TERM','CONTRACTOR','APPRENTICE'].includes(employmentType))throw new HRInputError('Choose an employment type.');
 const vacancy=await db.$transaction(async tx=>{if(!await tx.membership.findFirst({where:{organisationId:session.organisationId,userId:data.ownerUserId,active:true}}))throw new HRInputError('Choose an active company owner.');
 let entityId=id;if(id){const changed=await tx.hrVacancy.updateMany({where:{id,organisationId:session.organisationId,version:version(form)},data:{...data,employmentType:employmentType as 'FULL_TIME',version:{increment:1}}});if(changed.count!==1)throw stale();}else{entityId=(await tx.hrVacancy.create({data:{...data,employmentType:employmentType as 'FULL_TIME',organisationId:session.organisationId}})).id;}
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:id?'hr.vacancy.updated':'hr.vacancy.created',entityType:'HrVacancy',entityId:entityId!},tx);return entityId!;},{isolationLevel:'Serializable'});
 refresh();return {saved:true,id:vacancy};});
}
export async function saveApplication(id:string|null,form:FormData){
 const session=await requireSession();
 assertCapability(session,HR.employeeManage);
 await assertModuleEnabled(session,'people');
 return expected(async()=>{const email=text(form,'email',200,true).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new HRInputError('Enter a valid applicant email.');
 const data={name:text(form,'name',200,true),email,phone:text(form,'phone',50)||null,source:text(form,'source',150)||null,evidenceUrl:link(form),notes:text(form,'notes',8000)||null,interviewOn:date(form,'interviewOn')};
 const vacancyId=text(form,'vacancyId',100,true),stage=text(form,'stage',20,true),employeeId=text(form,'employeeId',100)||null;
 const result=await db.$transaction(async tx=>{
 const before=id?await tx.hrApplication.findFirst({where:{id,organisationId:session.organisationId}}):null;
 if(id&&!before)throw new HRInputError('Application unavailable in this company.');
 if(before&&before.version!==version(form))throw stale();
 if(before&&['HIRED','REJECTED','WITHDRAWN'].includes(before.stage))throw new HRInputError('This application is closed; retain it as recruitment history.');
 if(before&&before.vacancyId!==vacancyId)throw new HRInputError('Keep this application with its original vacancy.');
 const vacancy=await tx.hrVacancy.findFirst({where:{id:vacancyId,organisationId:session.organisationId}});if(!vacancy)throw new HRInputError('Choose a vacancy in this company.');if(!id&&vacancy.status!=='OPEN')throw new HRInputError('Only open vacancies accept new applications.');
 assertApplicationMove(before?.stage??'APPLIED',stage);if(!id&&stage!=='APPLIED')throw new HRInputError('New applications start at Applied.');
 if(['REJECTED','WITHDRAWN'].includes(stage)&&!data.notes)throw new HRInputError('Record the reason in recruitment notes.');
 if(stage==='INTERVIEW'&&!data.interviewOn)throw new HRInputError('Choose an interview date.');
 if(stage==='HIRED'){assertCapability(session,HR.onboardingManage);if(vacancy.status!=='OPEN')throw new HRInputError('Reopen the vacancy before recording a hire.');const employee=employeeId?await tx.employee.findFirst({where:{id:employeeId,organisationId:session.organisationId,status:'ONBOARDING'}}):null;if(!employee||employee.email.toLowerCase()!==email)throw new HRInputError('Create and select the matching onboarding employee with this applicant email.');}
 else if(employeeId)throw new HRInputError('Link an employee only when recording a hire.');
 if(await tx.hrApplication.findFirst({where:{vacancyId,email,...(id?{id:{not:id}}:{})}}))throw new HRInputError('This email already has an application for this vacancy.');
 if(employeeId&&await tx.hrApplication.findFirst({where:{organisationId:session.organisationId,employeeId,...(id?{id:{not:id}}:{})}}))throw new HRInputError('That employee is already linked to a recruitment handover.');
 let entityId=id;if(id){const result=await tx.hrApplication.updateMany({where:{id,organisationId:session.organisationId,version:version(form)},data:{...data,stage,employeeId,version:{increment:1}}});if(result.count!==1)throw stale();}else entityId=(await tx.hrApplication.create({data:{...data,vacancyId,stage,organisationId:session.organisationId}})).id;
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:stage==='HIRED'?'hr.application.hired':id?'hr.application.updated':'hr.application.created',entityType:'HrApplication',entityId:entityId!,before:before?{stage:before.stage,version:before.version}:undefined,after:{stage,employeeId}},tx);return entityId!;
 },{isolationLevel:'Serializable'});refresh();redirect(`/people/recruitment/${result}`);
 });
}
export async function saveTraining(id:string|null,form:FormData){
 const session=await requireSession();
 assertCapability(session,HR.employeeManage);
 await assertModuleEnabled(session,'people');
 return expected(async()=>{const status=text(form,'status',30,true);if(!(TRAINING_STATUSES as readonly string[]).includes(status))throw new HRInputError('Choose a training status.');const completedOn=date(form,'completedOn'),expiresOn=date(form,'expiresOn');trainingDates(status,completedOn,expiresOn);
 const employeeId=text(form,'employeeId',100,true),data={title:text(form,'title',200,true),category:text(form,'category',100,true),provider:text(form,'provider',200)||null,required:form.get('required')==='on',dueOn:date(form,'dueOn'),completedOn,expiresOn,status,evidenceUrl:link(form),notes:text(form,'notes',8000)||null};
 await db.$transaction(async tx=>{const employee=await tx.employee.findFirst({where:{id:employeeId,organisationId:session.organisationId}});if(!employee)throw new HRInputError('Choose an employee in this company.');if(!id&&employee.status==='LEFT')throw new HRInputError('Cannot assign new training to a leaver.');let entityId=id;
 if(id){const result=await tx.employeeTraining.updateMany({where:{id,organisationId:session.organisationId,employeeId,version:version(form)},data:{...data,version:{increment:1}}});if(result.count!==1)throw stale();}else entityId=(await tx.employeeTraining.create({data:{...data,employeeId,organisationId:session.organisationId}})).id;
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:id?'hr.training.updated':'hr.training.created',entityType:'EmployeeTraining',entityId:entityId!,after:{status,employeeId}},tx);},{isolationLevel:'Serializable'});refresh();revalidatePath(`/people/${employeeId}`);return {saved:true};});
}
export async function saveHRDocument(id:string|null,form:FormData){
 const session=await requireSession();
 assertCapability(session,HR.employeeManage);
 await assertModuleEnabled(session,'people');
 return expected(async()=>{const issuedOn=date(form,'issuedOn'),expiresOn=date(form,'expiresOn');if(issuedOn&&expiresOn&&expiresOn<issuedOn)throw new HRInputError('Expiry cannot be before the issue date.');const employeeId=text(form,'employeeId',100,true),status=text(form,'status',20,true);if(!['ACTIVE','ARCHIVED'].includes(status))throw new HRInputError('Choose current or archived.');const data={title:text(form,'title',200,true),category:text(form,'category',100,true),url:link(form,'url'),notes:text(form,'notes',8000)||null,issuedOn,expiresOn,status};
 await db.$transaction(async tx=>{const employee=await tx.employee.findFirst({where:{id:employeeId,organisationId:session.organisationId}});if(!employee)throw new HRInputError('Choose an employee in this company.');let entityId=id;if(id){const result=await tx.employeeDocument.updateMany({where:{id,organisationId:session.organisationId,employeeId,version:version(form)},data:{...data,version:{increment:1}}});if(result.count!==1)throw stale();}else entityId=(await tx.employeeDocument.create({data:{...data,employeeId,organisationId:session.organisationId}})).id;
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:id?'hr.document.updated':'hr.document.created',entityType:'EmployeeDocument',entityId:entityId!,after:{status,employeeId}},tx);},{isolationLevel:'Serializable'});refresh();revalidatePath(`/people/${employeeId}`);return {saved:true};});
}
