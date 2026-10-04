import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { managedDepartments } from "@/core/permissions/management-scope";
import { teamScope } from "@/modules/people/services/team-access";
import { db } from "@/core/db/client";

export function canViewConduct(session: Session) {
  return can(session, HR.conductRead) || can(session, HR.conductManage);
}
export function canEditConduct(session: Session) {
  return can(session, HR.conductManage);
}
export function companyConduct(session: Session) {
  return canViewConduct(session) && (can(session, HR.employeeRead) || can(session, HR.employeeManage));
}

const employeeSelect = { id: true, userId: true, department: true, status: true, firstName: true, lastName: true, jobTitle: true, manager: { select: { userId: true, organisationId: true } } } as const;

export async function employeeInConductScope(session: Session, employeeId: string, mode: "view" | "edit") {
  const employee = await db.employee.findFirst({ where: { id: employeeId, organisationId: session.organisationId }, select: employeeSelect });
  if (!employee) throw new Error("Employee not found.");
  const own = employee.userId === session.userId;
  if (mode === "edit" && own) throw new Error("You cannot run a performance or disciplinary process about yourself.");
  if (mode === "view" && own) return { employee, own: true as const };
  const allowed = mode === "edit" ? canEditConduct(session) : canViewConduct(session);
  if (!allowed) throw new Error("FORBIDDEN: performance and disciplinary records are restricted.");
  if (can(session, HR.employeeManage) || can(session, HR.employeeRead)) return { employee, own: false as const };
  if (!can(session, HR.teamManage)) throw new Error("FORBIDDEN: performance and disciplinary records are restricted.");
  const departments = await managedDepartments(session);
  const manages = (employee.manager?.userId === session.userId && employee.manager.organisationId === session.organisationId) || departments.includes(employee.department ?? "");
  if (!manages) throw new Error("FORBIDDEN: this employee is outside your management scope.");
  return { employee, own: false as const };
}

export async function conductListWhere(session: Session) {
  const own = { employee: { organisationId: session.organisationId, userId: session.userId } };
  if (companyConduct(session)) return { organisationId: session.organisationId };
  if (canViewConduct(session) && can(session, HR.teamManage)) {
    const departments = await managedDepartments(session);
    return {
      organisationId: session.organisationId,
      OR: [
        own,
        { employee: { organisationId: session.organisationId, manager: { userId: session.userId, organisationId: session.organisationId } } },
        ...(departments.length ? [{ employee: { organisationId: session.organisationId, department: { in: departments } } }] : []),
      ],
    };
  }
  return { organisationId: session.organisationId, employee: { organisationId: session.organisationId, userId: session.userId } };
}

export async function conductEmployeeChoices(session: Session) {
  if (!canEditConduct(session)) return [];
  const where = can(session, HR.employeeRead) || can(session, HR.employeeManage)
    ? { organisationId: session.organisationId, status: { not: "LEFT" as const }, NOT: { userId: session.userId } }
    : can(session, HR.teamManage)
      ? { ...(await teamScope(session)), status: { not: "LEFT" as const }, NOT: { userId: session.userId } }
      : { id: "__denied__" };
  return db.employee.findMany({ where, select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
}
