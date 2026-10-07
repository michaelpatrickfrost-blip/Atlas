import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { workScope, requireWork } from "@/core/service-work/access";
import type { SearchProvider, AttentionProvider } from "@/core/modules/types";

export async function deskQueues(session: Session) {
  return db.serviceQueue.findMany({ where: { organisationId: session.organisationId, active: true }, include: { members: { where: { organisationId: session.organisationId }, select: { userId: true } } }, orderBy: { name: "asc" } });
}
export async function workList(session: Session, filters: { kind?: string; q?: string; mine?: boolean; queueId?: string; status?: string; type?: string; breach?: boolean } = {}) {
  await requireWork(session, filters.kind ?? "TICKET");
  return db.serviceWorkItem.findMany({ where: { AND: [workScope(session), {
    kind: filters.kind ?? "TICKET", ...(filters.mine ? { OR: [{ ownerUserId: session.userId }, { requesterUserId: session.userId }] } : {}),
    ...(filters.queueId ? { queueId: filters.queueId } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.type ? { type: filters.type } : {}),
    ...(filters.breach ? { resolutionDueAt: { lt: new Date() }, pausedAt: null, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } } : {}),
    ...(filters.q ? { OR: [{ number: { contains: filters.q, mode: "insensitive" } }, { subject: { contains: filters.q, mode: "insensitive" } }] } : {}),
  }] }, include: { queue: { select: { name: true, department: true } } }, orderBy: { updatedAt: "desc" }, take: 100 });
}
export const ticketSearch: SearchProvider = async ({ session, query }) => {
  if (!session.capabilities.has("tickets.ticket.read")) return [];
  const rows = await db.serviceWorkItem.findMany({ where: { AND: [workScope(session), { OR: [{ number: { contains: query, mode: "insensitive" } }, { subject: { contains: query, mode: "insensitive" } }] }] }, select: { id: true, number: true, subject: true, kind:true }, take: 8 });
  return rows.map(row => ({ id: row.id, title: `${row.number} · ${row.subject}`, href: `/${row.kind==="QUERY"?"service/queries":"tickets"}/${row.id}`, group: "Service work" }));
};
export const ticketAttention: AttentionProvider = async ({ session }) => {
  const rows = await db.serviceWorkItem.findMany({ where: { AND: [workScope(session), { ownerUserId: session.userId, pausedAt: null, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] }, resolutionDueAt: { lt: new Date() } }] }, select: { id: true, number: true, kind:true }, take: 10 });
  return rows.map(row => ({ id: row.id, label: `${row.number}: resolution SLA breached`, href: `/${row.kind==="QUERY"?"service/queries":"tickets"}/${row.id}`, severity: "warning" as const }));
};
