import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";

export function workScope(session: Session): Prisma.ServiceWorkItemWhereInput {
  const ticketRead = session.capabilities.has("tickets.ticket.read");
  const queryRead = session.capabilities.has("service.ticket.read");
  return { organisationId: session.organisationId, AND: [
    { OR: [
      ...(ticketRead ? [{ kind: "TICKET", organisation: { moduleStates: { some: { moduleId: "tickets", enabled: true, entitled: true } } } }] : []),
      ...(queryRead ? [{ kind: "QUERY", organisation: { moduleStates: { some: { moduleId: "service", enabled: true, entitled: true } } } }] : []),
    ] },
    { OR: [{ requesterUserId: session.userId }, { requestedForUserId: session.userId }, { queue: { restricted: false } }, { queue: { members: { some: { organisationId: session.organisationId, userId: session.userId } } } }] },
    ...(session.capabilities.has("tickets.ticket.manage") ? [] : [{ OR: [{ requesterUserId: session.userId }, { requestedForUserId: session.userId }, { ownerUserId: session.userId }, { watcherIds: { has: session.userId } }, { queue: { members: { some: { organisationId: session.organisationId, userId: session.userId } } } }] }]),
  ] };
}
export async function requireWork(session: Session, kind: string, write = false) {
  assertCapability(session, kind === "TICKET" ? (write ? "tickets.ticket.create" : "tickets.ticket.read") : (write ? "service.ticket.create" : "service.ticket.read"));
  const moduleId = kind === "TICKET" ? "tickets" : "service";
  if (!await db.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId, enabled: true, entitled: true } })) throw new Error("This service application is not enabled.");
}
export async function workAgent(session: Session, queueId: string) {
  return !!await db.serviceQueueMember.findFirst({ where: { queueId, organisationId: session.organisationId, userId: session.userId } });
}
