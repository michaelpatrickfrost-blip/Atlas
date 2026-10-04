import { db } from "@/core/db/client";

export async function leadIdsFor(organisationId: string, employee: { userId: string | null; department: string | null; manager: { userId: string | null } | null }, ownerUserId: string) {
  const ids = new Set<string>([ownerUserId]);
  if (employee.userId) ids.add(employee.userId);
  if (employee.manager?.userId) ids.add(employee.manager.userId);
  if (employee.department) {
    const teams = await db.workTeam.findMany({
      where: { organisationId, departments: { has: employee.department } },
      select: { members: { where: { isManager: true }, select: { membership: { select: { userId: true, organisationId: true } } } } },
    });
    for (const team of teams) {
      for (const member of team.members) {
        if (member.membership.organisationId === organisationId) ids.add(member.membership.userId);
      }
    }
  }
  return [...ids];
}

export async function leadsForEmployee(organisationId: string, employeeId: string, ownerUserId: string) {
  const employee = await db.employee.findFirst({
    where: { id: employeeId, organisationId },
    select: { id: true, userId: true, firstName: true, lastName: true, department: true, manager: { select: { userId: true } } },
  });
  if (!employee) throw new Error("Choose a person in this company.");
  return { employee, personName: `${employee.firstName} ${employee.lastName}`.trim(), leadUserIds: await leadIdsFor(organisationId, employee, ownerUserId) };
}
