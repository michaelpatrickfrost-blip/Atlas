"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getModule } from "@/core/modules/registry";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";
import { londonDate, londonInstant, paidMinutes } from "@/modules/scheduling/domain/time";
import { dateOnly, mondayOf, addDays } from "@/modules/people/domain/working-time";
import { applyReplan, fillMonth, loadPersonSchedule, loadTeamPlan, publishMonthPlan, removeBusyPeriod, retireWorkPattern, saveBusyPeriod, saveOneShift, savePeopleDemand, saveWorkPattern } from "@/modules/scheduling/services/planner";

export async function getSchedule(week: string, search = "", department = "", own = false) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session,"scheduling");
  const manage = !own && (can(session,"scheduling.manage") || can(session,"people.rota.manage"));
  const provider = getModule("people")?.staffRosterProvider;
  if (!provider) throw new Error("HR roster connection is unavailable.");
  const allEmployees = await provider(session,manage);
  const q=search.trim().toLowerCase().slice(0,100);
  const filtered=allEmployees.filter(e=>(!department || e.department===department) && (!q || `${e.firstName} ${e.lastName} ${e.jobTitle}`.toLowerCase().includes(q)));
  const employees=filtered.slice(0,100);
  const weekStart=mondayOf(dateOnly(week));
  const start=londonInstant(weekStart.toISOString().slice(0,10),"00:00"),end=londonInstant(addDays(weekStart,7).toISOString().slice(0,10),"00:00");
  const ids=employees.map(e=>e.id);
  const shifts=await db.rotaShift.findMany({ where: { organisationId:session.organisationId,employeeId:{in:ids}, startsAt:{gte:start,lt:end}, status: manage ? {not:"CANCELLED"} : "CONFIRMED" }, include:{tasks:true}, orderBy:{startsAt:"asc"} });
  const absences=await db.absenceRecord.findMany({where:{organisationId:session.organisationId,employeeId:{in:ids},status:"APPROVED",startDate:{lt:addDays(weekStart,7)},endDate:{gte:weekStart}},select:{employeeId:true,startDate:true,endDate:true}});
  const organisation=await db.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{hrStandardWeeklyHours:true}});
  let budget:null|{minutes:number|null;plannedMinutes:number;approvedMinutes:number;contractMinutes:number;staffCount:number;department:string}=null;
  if(manage){
    const scope=allEmployees.filter(e=>!department||e.department===department),scopeIds=scope.map(e=>e.id);
    const [saved,planned,actual]=await Promise.all([
      db.schedulingHoursBudget.findFirst({where:{organisationId:session.organisationId,managerUserId:session.userId,weekStart,department},select:{minutes:true}}),
      db.rotaShift.findMany({where:{organisationId:session.organisationId,employeeId:{in:scopeIds},startsAt:{gte:start,lt:end},status:{not:"CANCELLED"}},select:{startsAt:true,endsAt:true,breakMinutes:true}}),
      db.timesheetEntry.aggregate({where:{organisationId:session.organisationId,timesheet:{organisationId:session.organisationId,employeeId:{in:scopeIds},weekStart,status:"APPROVED"}},_sum:{minutes:true}})
    ]);
    budget={minutes:saved?.minutes??null,plannedMinutes:planned.reduce((sum,s)=>sum+(s.endsAt.getTime()-s.startsAt.getTime())/60000-s.breakMinutes,0),approvedMinutes:actual._sum.minutes??0,contractMinutes:scope.reduce((sum,e)=>sum+(e.contractedWeeklyHours??organisation.hrStandardWeeklyHours)*60,0),staffCount:scope.length,department};
  }
  return {budget,manage,employees,shifts,absences,weekStart,total:filtered.length,departments:[...new Set(allEmployees.map(e=>e.department).filter((d):d is string=>Boolean(d)))].sort(),standardHours:organisation.hrStandardWeeklyHours};
}
export async function createBulkShifts(form: FormData) {
  const session = await requireSession();
  assertCapability(session, can(session,"scheduling.manage") ? "scheduling.manage" : "people.rota.manage");
  await assertModuleEnabled(session,"scheduling");
  const provider=getModule("people")?.staffRosterProvider;
  if (!provider) throw new Error("HR roster connection is unavailable.");
  const roster=await provider(session,true);
  const employees=[...new Set(form.getAll("employeeId").map(String))];
  const dates=[...new Set(form.getAll("dates").map(String))];
  const week=mondayOf(dateOnly(String(form.get("weekStart") ?? "")));
  if (!employees.length || !dates.length || employees.length*dates.length>100) throw new Error("Choose staff and dates, up to 100 shifts per batch.");
  if (employees.some(id=>!roster.some(e=>e.id===id))) throw new Error("FORBIDDEN: staff selection is outside your scheduling scope.");
  if (dates.some(d=>dateOnly(d)<week || dateOnly(d)>=addDays(week,7))) throw new Error("Choose dates within the displayed week.");
  const breakMinutes=Number(form.get("breakMinutes") ?? 0);
  const startTime=String(form.get("startTime") ?? ""),endTime=String(form.get("endTime") ?? "");
  const tasks=String(form.get("tasks") ?? "").split("\n").map(s=>s.trim()).filter(Boolean);
  if (tasks.length>20 || tasks.some(s=>s.length>300)) throw new Error("Use up to 20 task lines, each up to 300 characters.");
  const status=form.get("publish")==="on" ? "CONFIRMED" : "SCHEDULED";
  await db.$transaction(async tx=>{
    for (const employeeId of employees) for (const day of dates) {
      const endDay=endTime<=startTime ? addDays(dateOnly(day),1).toISOString().slice(0,10) : day;
      const startsAt=londonInstant(day,startTime),endsAt=londonInstant(endDay,endTime);
      paidMinutes(startsAt,endsAt,breakMinutes);
      const live=await tx.employee.findFirst({where:{id:employeeId,organisationId:session.organisationId,status:{notIn:["LEFT","OFFBOARDING"]}}});
      if (!live) throw new Error("An employee has left or started offboarding. Refresh the rota.");
      const overlap=await tx.rotaShift.count({where:{organisationId:session.organisationId,employeeId,status:{not:"CANCELLED"},startsAt:{lt:endsAt},endsAt:{gt:startsAt}}});
      if (overlap) throw new Error(`Overlapping shift for ${live.firstName} ${live.lastName} on ${day}. No shifts were saved.`);
      const lastDay=londonDate(new Date(endsAt.getTime()-1));
      if(await tx.employeeAvailability.count({where:{organisationId:session.organisationId,employeeId,startsAt:{lt:endsAt},endsAt:{gt:startsAt}}}))throw new Error("The employee marked this time unavailable. No shifts were saved.");
      const absence=await tx.absenceRecord.count({where:{organisationId:session.organisationId,employeeId,status:"APPROVED",startDate:{lte:dateOnly(lastDay)},endDate:{gte:dateOnly(day)}}});
      if (absence) throw new Error(`${live.firstName} ${live.lastName} is absent on ${day}. No shifts were saved.`);
      await tx.rotaShift.create({data:{organisationId:session.organisationId,employeeId,startsAt,endsAt,breakMinutes,status,role:String(form.get("role") ?? "").trim().slice(0,100)||null,location:String(form.get("location") ?? "").trim().slice(0,100)||null,notes:String(form.get("instructions") ?? "").trim().slice(0,3000)||null,tasks:{create:tasks.map(title=>({organisationId:session.organisationId,title}))}}});
    }
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"scheduling.batch.created",entityType:"Organisation",entityId:session.organisationId,after:{count:employees.length*dates.length,status}}});
  },{isolationLevel:"Serializable",timeout:20000});
  revalidatePath("/scheduling"); revalidatePath("/people/me"); revalidatePath("/people/rotas"); revalidatePath("/profile");
}
export async function setScheduledShift(id: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, can(session,"scheduling.manage") ? "scheduling.manage" : "people.rota.manage");
  await assertModuleEnabled(session,"scheduling");
  const provider=getModule("people")?.staffRosterProvider;
  if (!provider) throw new Error("HR roster connection is unavailable.");
  const roster=await provider(session,true);
  const status=String(form.get("status"));
  if (!["CONFIRMED","CANCELLED"].includes(status)) throw new Error("Choose publish or cancel.");
  await db.$transaction(async tx=>{
    const shift=await tx.rotaShift.findFirstOrThrow({where:{id,organisationId:session.organisationId,employeeId:{in:roster.map(e=>e.id)},status:{not:"CANCELLED"}}});
    if(status==="CONFIRMED"){
      if(await tx.employeeAvailability.count({where:{organisationId:session.organisationId,employeeId:shift.employeeId,startsAt:{lt:shift.endsAt},endsAt:{gt:shift.startsAt}}}))throw new Error("This employee marked the shift time unavailable.");
      const conflict=await tx.absenceRecord.count({where:{organisationId:session.organisationId,employeeId:shift.employeeId,status:"APPROVED",startDate:{lte:dateOnly(londonDate(new Date(shift.endsAt.getTime()-1)))},endDate:{gte:dateOnly(londonDate(shift.startsAt))}}});
      if(conflict)throw new Error("Approved absence now conflicts with this shift. Cancel it and reschedule.");
    }
    await tx.rotaShift.update({where:{id,organisationId:session.organisationId},data:{status:status as "CONFIRMED"|"CANCELLED"}});
  },{isolationLevel:"Serializable"});
  await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:`scheduling.shift.${status.toLowerCase()}`,entityType:"RotaShift",entityId:id});
  revalidatePath("/scheduling"); revalidatePath("/people/me"); revalidatePath("/people/rotas"); revalidatePath("/profile");
}
export async function completeShiftTask(id: string) {
  const session = await requireSession();
  assertCapability(session,"core.profile.self");
  await assertModuleEnabled(session,"scheduling");
  await db.shiftTask.update({where:{id,organisationId:session.organisationId,completedAt:null,shift:{organisationId:session.organisationId,status:"CONFIRMED",employee:{userId:session.userId}}},data:{completedAt:new Date(),completedByUserId:session.userId}});
  revalidatePath("/scheduling");
}

export async function editScheduledShift(id: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, can(session,"scheduling.manage") ? "scheduling.manage" : "people.rota.manage");
  await assertModuleEnabled(session,"scheduling");
  const provider=getModule("people")?.staffRosterProvider;
  if(!provider)throw new Error("Staff roster is unavailable.");
  const roster=await provider(session,true);
  const day=String(form.get("day")??""),start=String(form.get("startTime")??""),end=String(form.get("endTime")??"");
  const startsAt=londonInstant(day,start),endDay=end<=start?addDays(dateOnly(day),1).toISOString().slice(0,10):day,endsAt=londonInstant(endDay,end);
  const breakMinutes=Number(form.get("breakMinutes")??0);paidMinutes(startsAt,endsAt,breakMinutes);
  await db.$transaction(async tx=>{
    const shift=await tx.rotaShift.findFirstOrThrow({where:{id,organisationId:session.organisationId,employeeId:{in:roster.map(e=>e.id)},status:{not:"CANCELLED"}}});
    if(!await tx.employee.findFirst({where:{id:shift.employeeId,organisationId:session.organisationId,status:{notIn:["LEFT","OFFBOARDING"]}}}))throw new Error("This employee is no longer available for scheduling.");
    if(await tx.rotaShift.count({where:{id:{not:id},organisationId:session.organisationId,employeeId:shift.employeeId,status:{not:"CANCELLED"},startsAt:{lt:endsAt},endsAt:{gt:startsAt}}}))throw new Error("This shift overlaps another shift. Choose a different time.");
    if(await tx.absenceRecord.count({where:{organisationId:session.organisationId,employeeId:shift.employeeId,status:"APPROVED",startDate:{lte:dateOnly(londonDate(new Date(endsAt.getTime()-1)))},endDate:{gte:dateOnly(day)}}}))throw new Error("Approved time off overlaps this shift.");
    if(await tx.employeeAvailability.count({where:{organisationId:session.organisationId,employeeId:shift.employeeId,startsAt:{lt:endsAt},endsAt:{gt:startsAt}}}))throw new Error("The employee marked this time unavailable.");
    if(await tx.rotaActivity.count({where:{organisationId:session.organisationId,shiftId:id,OR:[{startsAt:{lt:startsAt}},{endsAt:{gt:endsAt}}]}}))throw new Error("Replan activities before changing the shift boundaries.");
    await tx.rotaShift.update({where:{id,organisationId:session.organisationId},data:{startsAt,endsAt,breakMinutes,breakStartsAt:startsAt.getTime()===shift.startsAt.getTime()&&endsAt.getTime()===shift.endsAt.getTime()&&breakMinutes===shift.breakMinutes?shift.breakStartsAt:null,role:String(form.get("role")??"").trim().slice(0,100)||null,location:String(form.get("location")??"").trim().slice(0,100)||null,notes:String(form.get("instructions")??"").trim().slice(0,3000)||null,status:shift.status==="CONFIRMED"||form.get("publish")==="on"?"CONFIRMED":"SCHEDULED"}});
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"scheduling.shift.updated",entityType:"RotaShift",entityId:id}});
  },{isolationLevel:"Serializable"});
  revalidatePath("/scheduling");revalidatePath("/people/me");revalidatePath("/people/rotas");revalidatePath("/profile");
}

export async function publishWeekShifts(form: FormData) {
  const session = await requireSession();
  assertCapability(session, can(session,"scheduling.manage") ? "scheduling.manage" : "people.rota.manage");
  await assertModuleEnabled(session,"scheduling");
  const provider=getModule("people")?.staffRosterProvider;
  if(!provider)throw new Error("Staff roster is unavailable.");
  const roster=await provider(session,true),selected=[...new Set(form.getAll("employeeId").map(String))];
  if(!selected.length||selected.length>100||selected.some(id=>!roster.some(e=>e.id===id)))throw new Error("Choose up to 100 staff in your scheduling scope.");
  const week=mondayOf(dateOnly(String(form.get("weekStart")??""))),startsAt=londonInstant(week.toISOString().slice(0,10),"00:00"),endsAt=londonInstant(addDays(week,7).toISOString().slice(0,10),"00:00");
  await db.$transaction(async tx=>{
    const shifts=await tx.rotaShift.findMany({where:{organisationId:session.organisationId,employeeId:{in:selected},status:"SCHEDULED",startsAt:{gte:startsAt,lt:endsAt}},take:501});
    if(await tx.employee.count({where:{organisationId:session.organisationId,id:{in:selected},status:{notIn:["LEFT","OFFBOARDING"]}}})!==selected.length)throw new Error("A staff member is no longer available. Refresh the rota.");
    if(shifts.length>500)throw new Error("Publish a smaller staff group at a time.");
    if(!shifts.length)throw new Error("There are no draft shifts to publish in this view.");
    for(const shift of shifts){
      if(await tx.employeeAvailability.count({where:{organisationId:session.organisationId,employeeId:shift.employeeId,startsAt:{lt:shift.endsAt},endsAt:{gt:shift.startsAt}}}))throw new Error("Resolve unavailable draft shifts before publishing.");
      if(await tx.absenceRecord.count({where:{organisationId:session.organisationId,employeeId:shift.employeeId,status:"APPROVED",startDate:{lte:dateOnly(londonDate(new Date(shift.endsAt.getTime()-1)))},endDate:{gte:dateOnly(londonDate(shift.startsAt))}}}))throw new Error("Time off conflicts with a draft. Resolve it before publishing this week.");
      if(await tx.rotaShift.count({where:{organisationId:session.organisationId,id:{not:shift.id},employeeId:shift.employeeId,status:{not:"CANCELLED"},startsAt:{lt:shift.endsAt},endsAt:{gt:shift.startsAt}}}))throw new Error("Overlapping shifts must be resolved before publishing.");
    }
    await tx.rotaShift.updateMany({where:{organisationId:session.organisationId,id:{in:shifts.map(s=>s.id)},status:"SCHEDULED"},data:{status:"CONFIRMED"}});
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"scheduling.week.published",entityType:"Organisation",entityId:session.organisationId,after:{count:shifts.length,weekStart:week.toISOString()}}});
  },{isolationLevel:"Serializable",timeout:20000});
  revalidatePath("/scheduling");revalidatePath("/people/me");revalidatePath("/people/rotas");revalidatePath("/profile");
}

export async function saveHoursBudget(form:FormData){
 const session=await requireSession();
 assertCapability(session,can(session,"scheduling.manage")?"scheduling.manage":"people.rota.manage");
 await assertModuleEnabled(session,"scheduling");
 const weekStart=mondayOf(dateOnly(String(form.get("weekStart")??""))),department=String(form.get("department")??"").trim();
 const provider=getModule("people")?.staffRosterProvider;
 if(!provider)throw new Error("Staff roster is unavailable.");
 const roster=await provider(session,true);
 if(department&&!roster.some(e=>e.department===department))throw new Error("FORBIDDEN: department is outside your scheduling scope.");
 const text=String(form.get("hours")??"").trim(),hours=Number(text);
 if(!text||!Number.isFinite(hours)||hours<0||hours>1000000||!Number.isInteger(hours*4))throw new Error("Enter budget hours in quarter-hour steps between 0 and 1,000,000.");
 const minutes=hours*60;
 await db.$transaction(async tx=>{
  const budget=await tx.schedulingHoursBudget.upsert({where:{organisationId_managerUserId_weekStart_department:{organisationId:session.organisationId,managerUserId:session.userId,weekStart,department}},create:{organisationId:session.organisationId,managerUserId:session.userId,weekStart,department,minutes},update:{minutes}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"scheduling.budget.saved",entityType:"SchedulingHoursBudget",entityId:budget.id,after:{minutes,weekStart:weekStart.toISOString().slice(0,10),department}}});
 });
 revalidatePath("/scheduling");
}

export async function getTeamPlan(month: string, team = "", search = "", department = "", own = false) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  return loadTeamPlan(session, month, team, search, department, own);
}
export async function getPersonSchedule(employeeId?: string) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  return loadPersonSchedule(session, employeeId);
}
export async function saveWorkType(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  await saveWorkPattern(session, form);
  revalidatePath("/scheduling");
}
export async function archiveWorkType(id: string) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  await retireWorkPattern(session, id);
  revalidatePath("/scheduling");
}
export async function saveDemand(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  const days = await savePeopleDemand(session, form);
  revalidatePath("/scheduling");
  return days;
}
export async function saveBusyRule(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  await saveBusyPeriod(session, form);
  revalidatePath("/scheduling");
  revalidatePath("/people/me");
  revalidatePath("/profile");
}
export async function removeBusyRule(id: string) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  await removeBusyPeriod(session, id);
  revalidatePath("/scheduling");
}
export async function fillTeamMonth(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  const counts = await fillMonth(session, form);
  revalidatePath("/scheduling");
  revalidatePath("/profile");
  revalidatePath("/people/me");
  return counts;
}
export async function replanCover(moves: Array<{ shiftId: string; employeeId: string }>) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  const moved = await applyReplan(session, moves);
  revalidatePath("/scheduling");
  revalidatePath("/profile");
  revalidatePath("/people/me");
  return moved;
}
export async function publishMonth(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  await publishMonthPlan(session, form);
  revalidatePath("/scheduling");
  revalidatePath("/profile");
  revalidatePath("/people/me");
}
export async function saveShift(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  await assertModuleEnabled(session, "scheduling");
  await saveOneShift(session, form);
  revalidatePath("/scheduling");
  revalidatePath("/profile");
  revalidatePath("/people/me");
}
