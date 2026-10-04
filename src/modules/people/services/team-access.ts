import {managedDepartments} from "@/core/permissions/management-scope";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";

export async function teamScope(session: Session, companyWide = false) {
 if(companyWide&&can(session,HR.employeeManage))return {organisationId:session.organisationId};
 if(!canManageTeams(session))return {organisationId:session.organisationId,id:'__denied__'};
 const departments=await managedDepartments(session);
 return {organisationId:session.organisationId,OR:[{manager:{userId:session.userId,organisationId:session.organisationId}},...(departments.length?[{department:{in:departments}}]:[])]};
}
export function canManageTeams(session: Session) { return can(session, HR.teamManage) || can(session, HR.employeeManage); }
export async function requireTeamEmployee(session: Session, employeeId: string, allowOwn = false) {
  const employee = await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId }, select: { id: true, userId: true, department:true, status: true, manager: { select: { userId: true, organisationId: true } } } });
  if (allowOwn && employee.userId === session.userId) return employee;
  const departments=can(session,HR.teamManage)?await managedDepartments(session):[];
  if (employee.userId === session.userId || !canManageTeams(session) || (!can(session, HR.employeeManage) && (employee.manager?.userId !== session.userId || employee.manager.organisationId !== session.organisationId) && !departments.includes(employee.department??''))) throw new Error("FORBIDDEN: this employee is outside your management scope.");
  return employee;
}
