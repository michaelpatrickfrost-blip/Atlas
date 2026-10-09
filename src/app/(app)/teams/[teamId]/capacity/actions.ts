"use server";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability,can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireTeam,assertLead,onTeam } from "@/modules/teams/services/access";
import { civilDate } from "@/modules/teams/domain/board";
import { revalidatePath } from "next/cache";
import { loadCapacity } from "@/modules/teams/services/capacity";

export async function getCapacity(teamId:string,day:string) {const session=await requireSession();assertCapability(session,"teams.read");return loadCapacity(session,teamId,day);}

export async function saveAllocation(form:FormData) {
  const session=await requireSession();assertCapability(session,"teams.read");
  await assertModuleEnabled(session,"teams");
  const teamId=String(form.get("teamId")),access=await requireTeam(session,teamId);assertLead(access);
  const title=String(form.get("title")??"").trim(),detail=String(form.get("detail")??"").trim(),employeeId=String(form.get("assigneeEmployeeId")??""),goalId=String(form.get("goalId")??"");
  const estimatedHours=Number(form.get("estimatedHours")??0),priority=String(form.get("priority")??"NORMAL");
  const start=String(form.get("startsOn")??""),due=String(form.get("dueOn")??"");const startsOn=start?civilDate(start):null,dueOn=due?civilDate(due):null;
  if(!title||title.length>140||detail.length>1000||!Number.isFinite(estimatedHours)||estimatedHours<0||estimatedHours>2000||!["LOW","NORMAL","HIGH","URGENT"].includes(priority))throw new Error("Enter a title, valid priority and effort between 0 and 2,000 hours.");
  if(startsOn&&(!dueOn||dueOn<startsOn||dueOn.getTime()-startsOn.getTime()>366*86400000))throw new Error("Choose a deadline on or after the start, within one year.");
  if(employeeId)onTeam(access,employeeId);
  if(goalId){if(!can(session,"kpis.read"))throw new Error("Goals access is required to link a result.");await assertModuleEnabled(session,"kpis");}
  await db.$transaction(async tx=>{
    if(employeeId&&!await tx.employee.count({where:{id:employeeId,organisationId:session.organisationId,status:{not:"LEFT"},plannerMemberships:{some:{organisationId:session.organisationId,teamId}}}}))throw new Error("The assignee is no longer an active member of this team.");
    if(goalId&&!await tx.kpi.count({where:{id:goalId,organisationId:session.organisationId,visibility:"COMPANY",status:"ACTIVE"}}))throw new Error("Choose an active company goal.");
    const id=String(form.get("taskId")??""),data={title,detail:detail||null,assigneeEmployeeId:employeeId||null,startsOn,dueOn,estimatedHours,priority,goalId:goalId||null};
    let entityId:string;
    if(id){const changed=await tx.plannerTask.updateMany({where:{id,organisationId:session.organisationId,teamId,version:Number(form.get("version"))},data:{...data,version:{increment:1}}});if(changed.count!==1)throw new Error("This task changed in another window. Refresh before editing.");entityId=id;}
    else{const task=await tx.plannerTask.create({data:{...data,organisationId:session.organisationId,teamId,createdByUserId:session.userId}});entityId=task.id;}
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"teams.allocation.saved",entityType:"PlannerTask",entityId,after:{title,estimatedHours,employeeId,goalId,priority}}});
  },{isolationLevel:"Serializable"});
  revalidatePath(`/teams/${teamId}`);revalidatePath(`/teams/${teamId}/capacity`);revalidatePath("/teams");
}

export async function updateWorkStatus(form:FormData) {
  const session=await requireSession();assertCapability(session,"teams.read");await assertModuleEnabled(session,"teams");
  const teamId=String(form.get("teamId")),access=await requireTeam(session,teamId),status=String(form.get("status"));
  if(!["OPEN","DOING","DONE"].includes(status))throw new Error("Choose Open, Doing or Done.");
  await db.$transaction(async tx=>{const task=await tx.plannerTask.findFirstOrThrow({where:{id:String(form.get("taskId")),organisationId:session.organisationId,teamId}});if(!access.manage&&task.assigneeEmployeeId!==access.employee?.id)throw new Error("Only the lead or assignee can update this task.");const changed=await tx.plannerTask.updateMany({where:{id:task.id,organisationId:session.organisationId,version:Number(form.get("version"))},data:{status:status as "OPEN"|"DOING"|"DONE",version:{increment:1}}});if(changed.count!==1)throw new Error("This task changed. Refresh the board.");await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"teams.allocation.status",entityType:"PlannerTask",entityId:task.id,after:{status}}});},{isolationLevel:"Serializable"});
  revalidatePath(`/teams/${teamId}/capacity`);revalidatePath(`/teams/${teamId}`);revalidatePath("/teams");
}
