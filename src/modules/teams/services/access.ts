import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { TEAMS_CAPABILITIES as C } from "@/core/permissions/capabilities";

export async function currentEmployee(session: Session) {
  return db.employee.findFirst({
    where: { organisationId: session.organisationId, userId: session.userId, status: { not: "LEFT" } },
    select: { id: true, firstName: true, lastName: true, preferredName: true },
  });
}

export function managesTeams(session: Session) {
  return can(session, C.manage);
}

export async function requireTeam(session: Session, teamId: string) {
  const team = await db.plannerTeam.findFirst({
    where: { id: teamId, organisationId: session.organisationId },
    include: { members: { select: { id: true, employeeId: true, lead: true } } },
  });
  if (!team) throw new Error("That team is not on this company.");
  const employee = await currentEmployee(session);
  const membership = employee ? team.members.find((member) => member.employeeId === employee.id) : undefined;
  if (!managesTeams(session) && !membership) throw new Error("You are not on this team.");
  return { team, employee, membership, manage: managesTeams(session) || Boolean(membership?.lead) };
}

export function assertLead(access: { manage: boolean }) {
  if (!access.manage) throw new Error("Only a team lead can change this.");
}

export function onTeam(access: Awaited<ReturnType<typeof requireTeam>>, employeeId: string) {
  if (!access.team.members.some((member) => member.employeeId === employeeId)) throw new Error("Choose someone on this team.");
}
