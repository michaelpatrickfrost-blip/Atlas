import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getModule } from "@/core/modules/registry";
import { dateOnly, addDays } from "@/modules/people/domain/working-time";
import { londonInstant, londonDate, paidMinutes } from "../domain/time";
import { intervalCoverage, requiredPeople, skillsMatch } from "../domain/coverage";

export function workforceManager(session: Session) { return can(session, "scheduling.manage") || can(session, "people.rota.manage"); }
async function workforceRoster(session: Session, manage: boolean) {
  await assertModuleEnabled(session, "scheduling");
  const provider = getModule("people")?.staffRosterProvider;
  if (!provider) throw new Error("The HR roster connection is unavailable.");
  return provider(session, manage);
}
const text = (form: FormData, key: string, max = 80) => String(form.get(key) ?? "").trim().slice(0, max);
function skills(form: FormData) { const values = [...new Set(text(form, "skills", 400).split(",").map(s=>s.trim()).filter(Boolean))]; if(values.length>20)throw new Error("Choose up to 20 skills."); return values; }
function number(form: FormData, key: string, min: number, max: number) { const n=Number(form.get(key)); if(!Number.isFinite(n)||n<min||n>max)throw new Error(`Enter a valid ${key.replace(/([A-Z])/g," $1").toLowerCase()}.`); return n; }
function timeRange(form: FormData) {
  const day = text(form,"day",10), start = text(form,"startTime",5), end = text(form,"endTime",5);
  const startsAt=londonInstant(day,start), endsAt=londonInstant(end<=start?addDays(dateOnly(day),1).toISOString().slice(0,10):day,end);
  if((endsAt.getTime()-startsAt.getTime())/3600000>16)throw new Error("Plan shifts of at most 16 hours.");
  return {startsAt,endsAt};
}
async function departmentScope(session: Session, department: string) {
  if(!workforceManager(session))throw new Error("FORBIDDEN: scheduling management is required.");
  const roster=await workforceRoster(session,true);
  if(!department||!roster.some(employee=>employee.department===department))throw new Error("Choose a department within your managed HR roster.");
  return roster;
}
function breakInput(form:FormData,range:{startsAt:Date;endsAt:Date}) {
  const breakMinutes=number(form,"breakMinutes",0,240), breakTime=text(form,"breakTime",5);
  if(!Number.isInteger(breakMinutes))throw new Error("Enter whole break minutes.");
  paidMinutes(range.startsAt,range.endsAt,breakMinutes);
  let breakStartsAt=breakTime?londonInstant(londonDate(range.startsAt),breakTime):null;
  if(breakStartsAt&&breakStartsAt<range.startsAt)breakStartsAt=londonInstant(londonDate(range.endsAt),breakTime);
  if(breakMinutes&&!breakStartsAt)throw new Error("Set the break start so coverage can account for it.");
  if(breakStartsAt&&(breakStartsAt<range.startsAt||breakStartsAt.getTime()+breakMinutes*60000>range.endsAt.getTime()))throw new Error("The break must fit inside the shift.");
  return {breakMinutes,breakStartsAt};
}
async function audit(tx:Prisma.TransactionClient,session:Session,action:string,entityType:string,entityId:string,after?:Prisma.InputJsonValue) { await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action,entityType,entityId,...(after?{after}:{})}}); }

export async function loadWorkforce(session:Session,day:string,department="") {
  const manage=workforceManager(session), roster=await workforceRoster(session,manage);
  const departments=[...new Set(roster.map(e=>e.department).filter((d):d is string=>Boolean(d)))].sort();
  const selected=department&&departments.includes(department)?department:departments[0]??"";
  const people=roster.filter(e=>e.department===selected), ids=people.map(e=>e.id);
  const start=londonInstant(day,"00:00"),end=londonInstant(addDays(dateOnly(day),1).toISOString().slice(0,10),"00:00");
  const [intervals, shifts, openings,availability,absences]=await Promise.all([
    manage?db.staffingInterval.findMany({where:{organisationId:session.organisationId,department:selected,startsAt:{gte:start,lt:end}},orderBy:{startsAt:"asc"},take:200}):[],
    db.rotaShift.findMany({where:{organisationId:session.organisationId,employeeId:{in:ids},status:manage?{not:"CANCELLED"}:"CONFIRMED",startsAt:{lt:end},endsAt:{gt:start}},include:{employee:{select:{skills:true}},activities:{orderBy:{startsAt:"asc"}}},orderBy:{startsAt:"asc"},take:2000}),
    db.openRotaShift.findMany({where:{organisationId:session.organisationId,department:selected,status:{not:"CANCELLED"},startsAt:{gte:start,lt:new Date(end.getTime()+28*86400000)}},include:{requests:{where:manage?{employeeId:{in:ids}}:{employeeId:{in:ids}},select:{id:true,employeeId:true,status:true}}},orderBy:{startsAt:"asc"},take:200}),
    db.employeeAvailability.findMany({where:{organisationId:session.organisationId,employeeId:{in:ids},startsAt:{lt:end},endsAt:{gt:start}},orderBy:{startsAt:"asc"},take:500}),
    db.absenceRecord.findMany({where:{organisationId:session.organisationId,employeeId:{in:ids},status:"APPROVED",startDate:{lte:dateOnly(londonDate(end))},endDate:{gte:dateOnly(day)}},select:{employeeId:true,startDate:true,endDate:true}})
  ]);
  const cover=intervals.map(interval=>{ const inputs=shifts.filter(s=>people.some(e=>e.id===s.employeeId)).map(s=>({...s,skills:s.employee.skills,unavailable:availability.some(a=>a.employeeId===s.employeeId&&a.startsAt<interval.endsAt&&a.endsAt>interval.startsAt)||absences.some(a=>a.employeeId===s.employeeId&&a.startDate<=dateOnly(londonDate(interval.endsAt))&&a.endDate>=dateOnly(londonDate(interval.startsAt)))})); const all=intervalCoverage(inputs,interval);const published=intervalCoverage(inputs.filter(s=>s.status==="CONFIRMED"),interval);return {...interval,required:requiredPeople(interval),...all,published:published.available}; });
  return {manage,day,department:selected,departments,people,shifts,openings,availability,cover};
}

export async function saveInterval(session:Session,form:FormData) {
  const department=text(form,"department"); await departmentScope(session,department);
  const range=timeRange(form),label=text(form,"label");if(!label)throw new Error("Name the queue or staffing requirement.");
  const values={organisationId:session.organisationId,department,label,role:text(form,"role"),requiredSkills:skills(form),...range,volume:number(form,"volume",0,1000000),handlingMinutes:number(form,"handlingMinutes",0,240),shrinkagePercent:number(form,"shrinkagePercent",0,90),occupancyPercent:number(form,"occupancyPercent",1,100),minimumPeople:number(form,"minimumPeople",0,10000),createdByUserId:session.userId};
  if(!Number.isInteger(values.minimumPeople))throw new Error("Minimum staffing must be a whole number.");
  requiredPeople(values);
  await db.$transaction(async tx=>{const id=text(form,"id",40);const row=id?await tx.staffingInterval.update({where:{id,organisationId:session.organisationId,department},data:values}):await tx.staffingInterval.create({data:values});await audit(tx,session,"scheduling.interval.saved","StaffingInterval",row.id);});
}
export async function removeInterval(session:Session,form:FormData) {const row=await db.staffingInterval.findFirstOrThrow({where:{id:text(form,"id",40),organisationId:session.organisationId}});await departmentScope(session,row.department);await db.$transaction(async tx=>{await tx.staffingInterval.delete({where:{id:row.id,organisationId:session.organisationId}});await audit(tx,session,"scheduling.interval.removed","StaffingInterval",row.id);});}

export async function createOpening(session:Session,form:FormData) {
  const department=text(form,"department");await departmentScope(session,department);
  const range=timeRange(form),role=text(form,"role");if(!role||range.startsAt<new Date())throw new Error("Name the role and choose a future shift.");
  const data={organisationId:session.organisationId,department,role,location:text(form,"location",120),requiredSkills:skills(form),...range,...breakInput(form,range),createdByUserId:session.userId};
  await db.$transaction(async tx=>{const row=await tx.openRotaShift.create({data});await audit(tx,session,"scheduling.open_shift.created","OpenRotaShift",row.id);});
}

async function eligible(tx:Prisma.TransactionClient,session:Session,employeeId:string,opening:{department:string;requiredSkills:string[];startsAt:Date;endsAt:Date}) {
  const lastDay=londonDate(new Date(opening.endsAt.getTime()-1));
  const employee=await tx.employee.findFirst({where:{id:employeeId,organisationId:session.organisationId,status:{in:["ACTIVE","ON_LEAVE"]},startDate:{lte:dateOnly(londonDate(opening.startsAt))},OR:[{endDate:null},{endDate:{gte:dateOnly(lastDay)}}]},select:{id:true,skills:true,department:true}});
  if(!employee||employee.department!==opening.department||!skillsMatch(employee.skills,opening.requiredSkills))throw new Error("This shift needs an active employee in the department with every required skill.");
  if(opening.startsAt<new Date())throw new Error("This shift has already started.");
  if(await tx.absenceRecord.count({where:{organisationId:session.organisationId,employeeId,status:"APPROVED",startDate:{lte:dateOnly(lastDay)},endDate:{gte:dateOnly(londonDate(opening.startsAt))}}}))throw new Error("This shift overlaps approved time off.");
  if(await tx.employeeAvailability.count({where:{organisationId:session.organisationId,employeeId,startsAt:{lt:opening.endsAt},endsAt:{gt:opening.startsAt}}}))throw new Error("The employee has marked this time unavailable.");
  if(await tx.rotaShift.count({where:{organisationId:session.organisationId,employeeId,status:{not:"CANCELLED"},startsAt:{lt:opening.endsAt},endsAt:{gt:opening.startsAt}}}))throw new Error("The employee already has a shift at that time.");
}
export async function requestOpening(session:Session,form:FormData) {
  const self=(await workforceRoster(session,false))[0];if(!self)throw new Error("Link an active HR employee to your profile first.");
  await db.$transaction(async tx=>{const opening=await tx.openRotaShift.findFirstOrThrow({where:{id:text(form,"openingId",40),organisationId:session.organisationId,status:"OPEN"}});await eligible(tx,session,self.id,opening);const row=await tx.openShiftRequest.create({data:{organisationId:session.organisationId,openingId:opening.id,employeeId:self.id}});await audit(tx,session,"scheduling.open_shift.requested","OpenShiftRequest",row.id);},{isolationLevel:"Serializable"});
}
export async function decideOpening(session:Session,form:FormData) {
  const opening=await db.openRotaShift.findFirstOrThrow({where:{id:text(form,"openingId",40),organisationId:session.organisationId}});const roster=await departmentScope(session,opening.department),employeeId=text(form,"employeeId",40);
  if(!roster.some(e=>e.id===employeeId))throw new Error("Choose someone in your managed roster.");
  await db.$transaction(async tx=>{
    const row=await tx.openRotaShift.findFirstOrThrow({where:{id:opening.id,organisationId:session.organisationId,status:"OPEN"}});
    if(text(form,"decision")==="reject") { const result=await tx.openShiftRequest.updateMany({where:{organisationId:session.organisationId,openingId:row.id,employeeId,status:"PENDING"},data:{status:"REJECTED",reviewedAt:new Date(),reviewedByUserId:session.userId}});if(result.count!==1)throw new Error("This request has already been reviewed.");await audit(tx,session,"scheduling.open_shift.rejected","OpenRotaShift",row.id,{employeeId});return; }
    await eligible(tx,session,employeeId,row);
    const claimed=await tx.openRotaShift.updateMany({where:{id:row.id,organisationId:session.organisationId,status:"OPEN",version:row.version},data:{status:"ASSIGNED",version:{increment:1}}});if(claimed.count!==1)throw new Error("Another manager has filled this shift. Refresh the board.");
    const shift=await tx.rotaShift.create({data:{organisationId:session.organisationId,employeeId,startsAt:row.startsAt,endsAt:row.endsAt,role:row.role,location:row.location,breakMinutes:row.breakMinutes,breakStartsAt:row.breakStartsAt,requiredSkills:row.requiredSkills,status:"CONFIRMED"}});
    await tx.openRotaShift.update({where:{id:row.id,organisationId:session.organisationId},data:{assignedShiftId:shift.id}});
    await tx.openShiftRequest.updateMany({where:{organisationId:session.organisationId,openingId:row.id,status:"PENDING"},data:{status:"REJECTED",reviewedAt:new Date(),reviewedByUserId:session.userId}});
    await tx.openShiftRequest.updateMany({where:{organisationId:session.organisationId,openingId:row.id,employeeId},data:{status:"APPROVED",reviewedAt:new Date(),reviewedByUserId:session.userId}});
    await audit(tx,session,"scheduling.open_shift.assigned","RotaShift",shift.id,{openingId:row.id,employeeId});
  },{isolationLevel:"Serializable"});
}
export async function cancelOpening(session:Session,form:FormData) {const row=await db.openRotaShift.findFirstOrThrow({where:{id:text(form,"openingId",40),organisationId:session.organisationId}});await departmentScope(session,row.department);await db.$transaction(async tx=>{const changed=await tx.openRotaShift.updateMany({where:{id:row.id,organisationId:session.organisationId,status:"OPEN"},data:{status:"CANCELLED",version:{increment:1}}});if(changed.count!==1)throw new Error("Only an unfilled open shift can be cancelled.");await tx.openShiftRequest.updateMany({where:{organisationId:session.organisationId,openingId:row.id,status:"PENDING"},data:{status:"REJECTED",reviewedAt:new Date(),reviewedByUserId:session.userId}});await audit(tx,session,"scheduling.open_shift.cancelled","OpenRotaShift",row.id);});}
export async function saveAvailability(session:Session,form:FormData) { const self=(await workforceRoster(session,false))[0];if(!self)throw new Error("Link an HR employee to your profile first.");const range=timeRange(form);if(range.endsAt<new Date())throw new Error("Choose a future availability interval.");await db.$transaction(async tx=>{if(await tx.employeeAvailability.count({where:{organisationId:session.organisationId,employeeId:self.id,startsAt:{lt:range.endsAt},endsAt:{gt:range.startsAt}}}))throw new Error("You already marked this interval unavailable.");const row=await tx.employeeAvailability.create({data:{organisationId:session.organisationId,employeeId:self.id,...range,note:text(form,"note",200),createdByUserId:session.userId}});await audit(tx,session,"scheduling.availability.saved","EmployeeAvailability",row.id);},{isolationLevel:"Serializable"});}
export async function removeAvailability(session:Session,form:FormData) {const self=(await workforceRoster(session,false))[0];if(!self)throw new Error("Your employee record is unavailable.");await db.$transaction(async tx=>{const row=await tx.employeeAvailability.findFirstOrThrow({where:{id:text(form,"id",40),organisationId:session.organisationId,employeeId:self.id}});await tx.employeeAvailability.delete({where:{id:row.id,organisationId:session.organisationId}});await audit(tx,session,"scheduling.availability.removed","EmployeeAvailability",row.id);});}

async function scopedShift(session:Session,form:FormData) {
  if(!workforceManager(session))throw new Error("FORBIDDEN: scheduling management is required.");
  const roster=await workforceRoster(session,true),shift=await db.rotaShift.findFirstOrThrow({where:{id:text(form,"shiftId",40),organisationId:session.organisationId,status:{not:"CANCELLED"}}});
  if(!roster.some(e=>e.id===shift.employeeId))throw new Error("FORBIDDEN: the shift is outside your managed roster.");return shift;
}
export async function placeBreak(session:Session,form:FormData) {
  const shift=await scopedShift(session,form),values=breakInput(form,shift);
  if(String(form.get("startsAt"))!==shift.startsAt.toISOString()||String(form.get("endsAt"))!==shift.endsAt.toISOString())throw new Error("The shift times changed. Refresh before placing the break.");
  await db.$transaction(async tx=>{await tx.rotaShift.update({where:{id:shift.id,organisationId:session.organisationId,startsAt:shift.startsAt,endsAt:shift.endsAt,status:{not:"CANCELLED"}},data:values});await audit(tx,session,"scheduling.break.placed","RotaShift",shift.id,values.breakStartsAt?{breakMinutes:values.breakMinutes,breakStartsAt:values.breakStartsAt.toISOString()}:{breakMinutes:0});},{isolationLevel:"Serializable"});
}
export async function saveActivity(session:Session,form:FormData) {
  const shift=await scopedShift(session,form),range=timeRange(form),kind=text(form,"kind",20),label=text(form,"label");
  if(!["WORK","TRAINING","MEETING","OFFLINE"].includes(kind)||!label||range.startsAt<shift.startsAt||range.endsAt>shift.endsAt)throw new Error("Choose a named activity entirely within the shift.");
  await db.$transaction(async tx=>{const current=await tx.rotaShift.findFirstOrThrow({where:{id:shift.id,organisationId:session.organisationId,status:{not:"CANCELLED"}}});if(range.startsAt<current.startsAt||range.endsAt>current.endsAt)throw new Error("The shift times changed. Refresh first.");if(await tx.rotaActivity.count({where:{organisationId:session.organisationId,shiftId:shift.id,startsAt:{lt:range.endsAt},endsAt:{gt:range.startsAt}}}))throw new Error("Activities cannot overlap. Remove the existing activity before replacing it.");const row=await tx.rotaActivity.create({data:{organisationId:session.organisationId,shiftId:shift.id,label,kind,...range}});await audit(tx,session,"scheduling.activity.saved","RotaActivity",row.id);},{isolationLevel:"Serializable"});
}
export async function removeActivity(session:Session,form:FormData) {const shift=await scopedShift(session,form);await db.$transaction(async tx=>{const row=await tx.rotaActivity.findFirstOrThrow({where:{id:text(form,"id",40),organisationId:session.organisationId,shiftId:shift.id}});await tx.rotaActivity.delete({where:{id:row.id,organisationId:session.organisationId}});await audit(tx,session,"scheduling.activity.removed","RotaActivity",row.id);});}
