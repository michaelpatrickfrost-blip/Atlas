import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { isModuleEnabled } from "@/core/modules/runtime";

/** True when this session holds the independent Atlas staff grant. */
function isAtlasStaff(session: Session): boolean {
  return session.capabilities.has("atlas.staff.manage");
}

export function workScope(session: Session): Prisma.ServiceWorkItemWhereInput {
  const ticketRead = session.capabilities.has("tickets.ticket.read");
  const queryRead = session.capabilities.has("service.ticket.read");
  // Atlas staff see every app in every company; the internal Atlas team workspace
  // has no moduleStates rows, so the per-company source filter must be skipped.
  const staff = isAtlasStaff(session);
  const reachable = (moduleId: string) =>
    staff ? {} : { organisation: { moduleStates: { some: { moduleId, enabled: true, entitled: true } } } };
  return { organisationId: session.organisationId, AND: [
    { OR: [
      ...(ticketRead ? [{ kind: "TICKET" as const, ...reachable("tickets") }] : []),
      ...(queryRead ? [{ kind: "QUERY" as const, ...reachable("service") }] : []),
    ] },
    { OR: [{ requesterUserId: session.userId }, { requestedForUserId: session.userId }, { queue: { restricted: false } }, { queue: { members: { some: { organisationId: session.organisationId, userId: session.userId } } } }] },
    ...(session.capabilities.has("tickets.ticket.manage") ? [] : [{ OR: [{ requesterUserId: session.userId }, { requestedForUserId: session.userId }, { ownerUserId: session.userId }, { watcherIds: { has: session.userId } }, { queue: { members: { some: { organisationId: session.organisationId, userId: session.userId } } } }] }]),
  ] };
}
export async function requireWork(session: Session, kind: string, write = false) {
  assertCapability(session, kind === "TICKET" ? (write ? "tickets.ticket.create" : "tickets.ticket.read") : (write ? "service.ticket.create" : "service.ticket.read"));
  const moduleId = kind === "TICKET" ? "tickets" : "service";
  if (!await isModuleEnabled(session, moduleId)) throw new Error("This service application is not enabled.");
}
export async function workAgent(session: Session, queueId: string) {
  return !!await db.serviceQueueMember.findFirst({ where: { queueId, organisationId: session.organisationId, userId: session.userId } });
}
