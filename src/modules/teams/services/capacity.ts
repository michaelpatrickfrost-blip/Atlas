import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability,can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { isModuleEnabled } from "@/core/modules/runtime";
import { requireTeam,managesTeams } from "./access";
import { civilDate } from "../domain/board";
import { distributeWork,shiftCapacityHours } from "../domain/capacity";
import { londonInstant,londonDate } from "@/modules/scheduling/domain/time";

export async function loadCapacity(session:Session,teamId:string,day:string) {
  assertCapability(session,"teams.read");await assertModuleEnabled(session,"teams");await assertModuleEnabled(session,"people");
  const access=await requireTeam(session,teamId),date=civilDate(day),offset=(date.getUTCDay()+6)%7;
  const monday=new Date(date.getTime()-offset*86400000),days=Array.from({length:7},(_,i)=>new Date(monday.getTime()+i*86400000).toISOString().slice(0,10));
  const from=londonInstant(days[0],"00:00"),until=londonInstant(new Date(monday.getTime()+7*86400000).toISOString().slice(0,10),"00:00");
  const ids=access.team.members.map(m=>m.employeeId),organisationId=session.organisationId;
  const scheduling=await isModuleEnabled(session,"scheduling"),kpis=await isModuleEnabled(session,"kpis");
  const [employees,tasks,load,shifts,absences,unavailable,org,goals]=await Promise.all([
    db.employee.findMany({where:{organisationId,id:{in:ids},status:{not:"LEFT"}},select:{id:true,firstName:true,lastName:true,department:true,jobTitle:true,skills:true,contractedWeeklyHours:true,workingDays:true,startDate:true,endDate:true,userId:true}}),
    db.plannerTask.findMany({where:{organisationId,teamId},orderBy:[{priority:"asc"},{dueOn:"asc"},{createdAt:"desc"}],take:500}),
    db.plannerTask.findMany({where:{organisationId,assigneeEmployeeId:{in:ids},status:{not:"DONE"},dueOn:{gte:monday},OR:[{startsOn:null,dueOn:{lt:until}},{startsOn:{lt:until}}],...(managesTeams(session)?{}:{team:{members:{some:{employee:{userId:session.userId,organisationId}}}}})},select:{id:true,assigneeEmployeeId:true,estimatedHours:true,startsOn:true,dueOn:true},orderBy:{dueOn:"asc"},take:3000}),
    scheduling?db.rotaShift.findMany({where:{organisationId,employeeId:{in:ids},status:"CONFIRMED",startsAt:{lt:until},endsAt:{gt:from}},select:{employeeId:true,startsAt:true,endsAt:true,breakMinutes:true,breakStartsAt:true,activities:{select:{kind:true,startsAt:true,endsAt:true}}},take:2000}):[],
    db.absenceRecord.findMany({where:{organisationId,employeeId:{in:ids},status:"APPROVED",startDate:{lt:until},endDate:{gte:monday}},select:{employeeId:true,startDate:true,endDate:true}}),
    scheduling?db.employeeAvailability.findMany({where:{organisationId,employeeId:{in:ids},startsAt:{lt:until},endsAt:{gt:from}},select:{employeeId:true,startsAt:true,endsAt:true}}):[],
    db.organisation.findUniqueOrThrow({where:{id:organisationId},select:{hrStandardWeeklyHours:true}}),
    can(session,"kpis.read")&&kpis?db.kpi.findMany({where:{organisationId,visibility:"COMPANY",status:"ACTIVE"},select:{id:true,name:true,teamName:true},orderBy:{name:"asc"},take:300}):[]
  ]);
  const people=employees.map(employee=>{
    const allocations=load.filter(task=>task.assigneeEmployeeId===employee.id).flatMap(task=>distributeWork(task.estimatedHours,task.startsOn?.toISOString().slice(0,10)??null,task.dueOn?.toISOString().slice(0,10)??null,employee.workingDays));
    const cells=days.map(day=>{const start=londonInstant(day,"00:00"),end=londonInstant(new Date(civilDate(day).getTime()+86400000).toISOString().slice(0,10),"00:00"),published=shifts.filter(s=>s.employeeId===employee.id&&s.startsAt<end&&s.endsAt>start);
      const away=absences.some(a=>a.employeeId===employee.id&&a.startDate<=civilDate(day)&&a.endDate>=civilDate(day));
      const unavailableDay=unavailable.some(a=>a.employeeId===employee.id&&a.startsAt<end&&a.endsAt>start);
      const contracted=employee.workingDays.includes(civilDate(day).getUTCDay())?(employee.contractedWeeklyHours??org.hrStandardWeeklyHours)/Math.max(1,employee.workingDays.length):0;
      const shiftHours=published.reduce((n,shift)=>n+shiftCapacityHours(shift,start,end),0);
      const employed=employee.startDate<end&&(!employee.endDate||employee.endDate>=civilDate(day));const capacity=away||unavailableDay||!employed?0:published.length?shiftHours:contracted;
      const planned=allocations.filter(a=>a.day===day).reduce((n,a)=>n+a.hours,0);return {day,capacity,planned,remaining:capacity-planned,source:away?"Approved leave":unavailableDay?"Unavailable":!employed?"Outside employment":published.length?"Published rota":"Contract",conflict:unavailableDay&&published.length>0};
    });return { ...employee,name:`${employee.firstName} ${employee.lastName}`,cells,capacity:cells.reduce((n,c)=>n+c.capacity,0),planned:cells.reduce((n,c)=>n+c.planned,0)};
  });
  return {team:access.team,manage:access.manage,selfId:access.employee?.id??null,days,people,tasks:tasks.map(task=>({...task,startsOn:task.startsOn?.toISOString().slice(0,10)??null,dueOn:task.dueOn?.toISOString().slice(0,10)??null})),goals,today:londonDate(new Date())};
}
