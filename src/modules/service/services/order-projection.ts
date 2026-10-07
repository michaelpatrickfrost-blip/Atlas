import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { serviceCaseScope } from "@/core/permissions/service-access";
export async function getServiceOrderProjection(session: Session, partyId: string, orderId: string) {
  assertCapability(session, "sales.order.read");
  const [cases, recoveries] = await Promise.all([
    session.capabilities.has("service.case.read") ? db.serviceCase.findMany({ where: { AND: [serviceCaseScope(session), { partyId, OR: [{ context: { path: ["salesOrderId"], equals: orderId } }, { links: { some: { entityType: "SalesOrder", entityId: orderId } } }] }] }, select: { id: true, number: true, subject: true }, take: 20 }) : [],
    db.serviceRecovery.findMany({ where: { organisationId: session.organisationId, partyId, status: { in: ["APPROVED", "PARTIALLY_REDEEMED"] }, validFrom: { lte: new Date() }, expiresAt: { gt: new Date() }, usedCount: { lt: db.serviceRecovery.fields.usageLimit } }, select: { id: true, number: true, type: true, value: true, currency: true, expiresAt: true }, take: 20 }),
  ]);
  return { cases, recoveries };
}
