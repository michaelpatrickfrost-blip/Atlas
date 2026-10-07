"use server";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { requireService } from "./queries";
export async function casePurchaseContext(partyId: string, filter: { q?: string; productId?: string; status?: string } = {}) {
  const session = await requireSession();
  assertCapability(session, "service.case.read");
  assertCapability(session, "customers.read"); await requireService(session);
  if (!await db.party.findFirst({ where: { id: partyId, organisationId: session.organisationId, archived: false, identityScrubbed: false } })) throw new Error("Customer unavailable.");
  const enabled=await getEnabledModuleIds(session.organisationId);
  const [contacts, orders, products, duplicates] = await Promise.all([
    db.contact.findMany({ where: { partyId, party: { organisationId: session.organisationId }, identityScrubbed: false }, select: { id: true, firstName: true, surname: true, email: true, phone: true }, take: 100 }),
    session.capabilities.has("sales.order.read") && enabled.has("sales") ? db.salesOrder.findMany({ where: { organisationId: session.organisationId, partyId,
      ...(filter.productId ? { lines: { some: { productId: filter.productId } } } : {}),
      ...(filter.q ? { OR: [{ reference: { contains: filter.q, mode: "insensitive" } }, { customerPoReference: { contains: filter.q, mode: "insensitive" } }] } : {}),
      ...(filter.status === "OPEN" ? { commercialStatus: { in: ["CONFIRMED", "ON_HOLD", "DRAFT"] } } : {}),
    }, select: { id: true, reference: true, customerPoReference: true, commercialStatus: true, requestedDeliveryDate: true, promisedDeliveryDate: true, lines: { select: { id: true, productId: true, descriptionSnapshot: true, orderedQuantity: true, unitOfMeasure: true, unitPriceAmount: true } } }, orderBy: { orderDate: "desc" }, take: 50 }) : [],
    session.capabilities.has("core.products.read") && enabled.has("products") ? db.product.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 }) : [],
    db.serviceCase.findMany({ where: { AND:[serviceCaseScope(session),{partyId,status:{notIn:["CLOSED","CANCELLED"]}}] }, select: { id: true, number: true, subject: true }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const orderIds = orders.map(order => order.id);
  const shipments = session.capabilities.has("logistics.shipment.read") && enabled.has("logistics") && orderIds.length ? await db.shipment.findMany({ where: { organisationId: session.organisationId, partyId, sources: { some: { organisationId: session.organisationId, salesOrderId: { in: orderIds } } } }, select: { id: true, reference: true, status: true, carrierCode: true, dispatchedAt: true, deliveredAt: true, onTime: true, inFull: true, failureReason: true, sources: { where: { organisationId: session.organisationId }, select: { salesOrderId: true, quantity: true, line: { select: { salesOrderLineId: true, productId: true } } } } }, take: 100 }) : [];
  return { contacts, orders: orders.map(order => ({ ...order, requestedDeliveryDate: order.requestedDeliveryDate?.toISOString() ?? null, promisedDeliveryDate: order.promisedDeliveryDate?.toISOString() ?? null })), shipments: shipments.map(shipment => ({ ...shipment, dispatchedAt: shipment.dispatchedAt?.toISOString() ?? null, deliveredAt: shipment.deliveredAt?.toISOString() ?? null })), products, duplicates };
}
