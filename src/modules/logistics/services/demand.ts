import { db } from "@/core/db/client";
import type { SalesLogisticsEvent } from "@/core/logistics/types";
import type { Session } from "@/core/auth/session";
import { allocationStatus, explainPriority, explainShortage, holdLabel, postcodeOf, releaseDecision, restoredDeliveryStatus } from "../domain/operations";
import { milestone, nextReference, policyFor, sameOperation, stock } from "./numbers";

const OPEN = ["OPEN", "RELEASED", "PICKING", "PACKING", "STAGED", "PART_SHIPPED", "BLOCKED", "SHORT"];

export async function consumeSalesOrder(event: SalesLogisticsEvent) {
  const policy = await policyFor(event.organisationId);
  const requirementId = await db.$transaction(async (tx) => {
    const seen = await tx.logisticsOperation.findUnique({ where: { organisationId_requestKey: { organisationId: event.organisationId, requestKey: event.eventKey } } });
    if (seen) return String((seen.result as { requirementId?: string }).requirementId ?? "");
    const order = await tx.salesOrder.findFirst({ where: { id: event.orderId, organisationId: event.organisationId }, include: { lines: true, holds: true } });
    if (!order) return "";
    const actionable = order.commercialStatus === "CONFIRMED" || order.commercialStatus === "CANCELLED" || (order.commercialStatus === "ON_HOLD" && Boolean(order.confirmationDate));
    if (!actionable) {
      await tx.logisticsOperation.create({ data: { organisationId: event.organisationId, requestKey: event.eventKey, action: `sales.${event.kind}`, result: { skipped: true } } });
      return "";
    }
    const holds = order.holds.filter((hold) => !hold.releasedAt).map((hold) => holdLabel(hold.type));
    const blocked = !releaseDecision(holds).allowed;
    const mode = /dropship|direct ship/i.test(`${order.deliveryTerms ?? ""} ${order.lines.map((line) => line.warehousePreference ?? "").join(" ")}`) ? "DROPSHIP" : "WAREHOUSE";
    const warehouse = mode === "WAREHOUSE" ? await resolveWarehouse(tx, event.organisationId, order.lines.find((line) => line.warehousePreference)?.warehousePreference) : null;
    const priority = explainPriority({ promisedOn: order.promisedDeliveryDate, now: new Date(), expedited: /next day|timed|before noon/i.test(order.deliveryTerms ?? ""), ageDays: Math.floor((Date.now() - order.orderDate.getTime()) / 86_400_000), manual: null });
    let requirement = await tx.fulfilmentRequirement.findUnique({ where: { organisationId_salesOrderId_splitKey: { organisationId: event.organisationId, salesOrderId: order.id, splitKey: "" } } });
    const hasDemand = order.lines.some((line) => !["SECTION", "NOTE"].includes(line.type) && line.orderedQuantity > 0);
    if (!requirement && !hasDemand) {
      // A confirmed order with no order lines (e.g. seed/import data created outside confirmOrder's
      // validateConfirmation check) has nothing to fulfil. Never open a warehouse requirement for it.
      await tx.logisticsOperation.create({ data: { organisationId: event.organisationId, requestKey: event.eventKey, action: `sales.${event.kind}`, result: { skipped: true, reason: "no-order-lines" } } });
      return "";
    }
    if (!requirement) {
      const reference = await nextReference(tx, event.organisationId, "FF", "FF");
      requirement = await tx.fulfilmentRequirement.create({ data: {
        organisationId: event.organisationId, reference, salesOrderId: order.id, partyId: order.partyId, shipTo: order.deliveryAddressSnapshot ?? {},
        priority: priority.score, priorityReason: priority.reason, status: blocked ? "BLOCKED" : "OPEN", holdSummary: holds[0] ?? null,
        warehouseId: warehouse?.id, warehousePreference: warehouse?.code ?? order.lines.find((line) => line.warehousePreference)?.warehousePreference, requestedOn: order.requestedDeliveryDate, promisedOn: order.promisedDeliveryDate,
        partialPolicy: order.allowPartialDelivery, deliveryRules: order.deliveryTerms, shippingInstructions: order.deliveryInstructions, serviceLevel: serviceLevel(order.deliveryTerms), timeWindow: windowLabel(order.deliveryInstructions),
        fulfilmentMode: mode, sourceEventKey: event.eventKey,
      } });
    } else {
      await tx.fulfilmentRequirement.update({ where: { id: requirement.id }, data: {
        shipTo: order.deliveryAddressSnapshot ?? {}, requestedOn: order.requestedDeliveryDate, promisedOn: order.promisedDeliveryDate, partialPolicy: order.allowPartialDelivery,
        deliveryRules: order.deliveryTerms, shippingInstructions: order.deliveryInstructions, holdSummary: holds[0] ?? null, status: blocked ? "BLOCKED" : requirement.status === "BLOCKED" ? "OPEN" : requirement.status,
        priority: priority.score, priorityReason: priority.reason, fulfilmentMode: mode,
      } });
    }
    for (const line of order.lines) {
      const existing = await tx.fulfilmentLine.findUnique({ where: { requirementId_salesOrderLineId: { requirementId: requirement.id, salesOrderLineId: line.id } } });
      const shipped = existing?.shippedQuantity ?? 0;
      const salesOpen = Math.max(0, line.orderedQuantity - line.cancelledQuantity);
      const open = Math.max(salesOpen, shipped);
      const cancelled = line.orderedQuantity - open;
      const data = { orderedQuantity: line.orderedQuantity, cancelledQuantity: cancelled, description: line.descriptionSnapshot, productId: line.productId, unitOfMeasure: line.unitOfMeasure };
      if (existing) await tx.fulfilmentLine.update({ where: { id: existing.id }, data });
      else await tx.fulfilmentLine.create({ data: { organisationId: event.organisationId, requirementId: requirement.id, salesOrderLineId: line.id, ...data } });
    }
    const shipped = (await tx.fulfilmentLine.findMany({ where: { requirementId: requirement.id }, select: { shippedQuantity: true } })).reduce((sum, line) => sum + line.shippedQuantity, 0);
    const nextStatus = restoredDeliveryStatus({ orderStatus: order.commercialStatus, requirementStatus: requirement.status, blocked, shipped });
    if (nextStatus) await tx.fulfilmentRequirement.update({ where: { id: requirement.id }, data: { status: nextStatus } });
    await tx.logisticsOperation.create({ data: { organisationId: event.organisationId, requestKey: event.eventKey, action: `sales.${event.kind}`, result: { requirementId: requirement.id } } });
    return requirement.id;
  });
  if (!requirementId) return;
  if (policy.reservationPolicy === "ON_CONFIRMATION") await allocateRequirement({ organisationId: event.organisationId, userId: event.actorUserId }, requirementId);
  const current = await db.fulfilmentRequirement.findUnique({ where: { id: requirementId } });
  if (current && policy.releaseMethod === "AUTOMATIC" && current.fulfilmentMode === "WAREHOUSE" && !current.holdSummary && current.status === "OPEN") {
    await releaseRequirement({ organisationId: event.organisationId, userId: event.actorUserId }, requirementId);
  }
  if (event.kind === "cancelled") await releaseUnused({ organisationId: event.organisationId, userId: event.actorUserId }, requirementId);
}

async function resolveWarehouse(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0], organisationId: string, preference?: string | null) {
  const warehouses = await tx.warehouse.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
  if (!warehouses.length) return null;
  const wanted = preference?.trim().toLowerCase();
  return warehouses.find((warehouse) => warehouse.code.toLowerCase() === wanted || warehouse.name.toLowerCase() === wanted) ?? warehouses[0];
}

function serviceLevel(terms: string | null) {
  const value = terms?.toLowerCase() ?? "";
  if (value.includes("collection")) return "COLLECTION";
  if (value.includes("before noon")) return "BEFORE_NOON";
  if (value.includes("next day")) return "NEXT_DAY";
  if (value.includes("saturday")) return "SATURDAY";
  if (value.includes("timed")) return "TIMED";
  if (value.includes("own fleet")) return "OWN_FLEET";
  return "STANDARD";
}

function windowLabel(instructions: string | null) {
  const match = instructions?.match(/\b(\d{2}:\d{2}\s?[–-]\s?\d{2}:\d{2}|AM|PM|any time)\b/i);
  return match?.[0] ?? null;
}

export async function allocateRequirement(actor: { organisationId: string; userId: string }, requirementId: string) {
  const requirement = await db.fulfilmentRequirement.findFirst({ where: { id: requirementId, organisationId: actor.organisationId }, include: { lines: true } });
  if (!requirement || requirement.fulfilmentMode !== "WAREHOUSE" || !requirement.warehouseId) return;
  const provider = await stock();
  for (const line of requirement.lines) {
    const open = line.orderedQuantity - line.cancelledQuantity - line.allocatedQuantity;
    if (!line.productId || open <= 0) continue;
    const stockView = await provider.getAvailability(actor, { productId: line.productId, warehouseId: requirement.warehouseId });
    const reserve = Math.min(open, stockView.pickable);
    const incoming = await db.receiptLine.findMany({ where: { organisationId: actor.organisationId, productId: line.productId, status: "OPEN" }, include: { receipt: true }, take: 5 });
    const shortage = explainShortage({
      required: line.orderedQuantity - line.cancelledQuantity,
      allocated: line.allocatedQuantity + reserve,
      availableNow: stockView.pickable,
      reservedElsewhere: stockView.reserved,
      incoming: incoming.map((row) => ({ quantity: Math.max(0, row.expectedQuantity - row.receivedQuantity), when: row.receipt.expectedOn?.toLocaleDateString("en-GB") ?? "expected" })),
    });
    let added = reserve;
    if (reserve > 0) {
      const reserved = await provider.requestReservation(actor, { requestKey: `reserve:${line.id}:${line.allocatedQuantity}`, productId: line.productId, warehouseId: requirement.warehouseId, quantity: reserve, reason: "Fulfilment reservation", reference: requirement.reference, sourceType: "FULFILMENT_LINE", sourceId: line.id });
      added = reserved.replayed ? Math.max(0, reserve - line.allocatedQuantity) : reserve;
    }
    const allocated = line.allocatedQuantity + added;
    const status = allocationStatus({ required: line.orderedQuantity - line.cancelledQuantity, allocated, blocked: Boolean(requirement.holdSummary), pickableRemaining: Math.max(0, stockView.pickable - reserve) });
    await db.fulfilmentLine.update({ where: { id: line.id }, data: { allocatedQuantity: allocated, allocationStatus: status, shortage: shortage.short > 0 ? shortage : undefined } });
  }
}

export async function releaseRequirement(actor: { organisationId: string; userId: string }, requirementId: string) {
  const requirement = await db.fulfilmentRequirement.findFirst({ where: { id: requirementId, organisationId: actor.organisationId }, include: { lines: true, party: true } });
  if (!requirement) throw new Error("This fulfilment no longer exists.");
  const decision = releaseDecision(requirement.holdSummary ? [requirement.holdSummary] : []);
  if (!decision.allowed) throw new Error(decision.message ?? "Blocked");
  if (requirement.fulfilmentMode !== "WAREHOUSE") throw new Error("This order does not pass through the warehouse. Record the supplier shipment instead of releasing a pick.");
  let lines = requirement.lines;
  if (!lines.some((line) => line.allocatedQuantity > line.pickedQuantity && line.orderedQuantity > line.cancelledQuantity)) {
    await allocateRequirement(actor, requirementId);
    lines = await db.fulfilmentLine.findMany({ where: { organisationId: actor.organisationId, requirementId } });
  }
  if (!lines.some((line) => line.allocatedQuantity > line.pickedQuantity && line.orderedQuantity > line.cancelledQuantity)) throw new Error("Nothing is allocated to pick yet. Available stock does not cover this order.");
  const existing = await db.warehouseTask.findFirst({ where: { organisationId: actor.organisationId, requirementId, kind: "PICK", status: { in: ["READY", "CLAIMED", "IN_PROGRESS"] } } });
  if (existing) return existing.id;
  const provider = await stock();
  const locations = requirement.warehouseId ? await provider.getLocations(actor, requirement.warehouseId) : [];
  const pickFace = locations.find((location) => location.capabilities.includes("PICK_FACE")) ?? locations[0];
  const products = await db.product.findMany({ where: { organisationId: actor.organisationId, id: { in: lines.map((line) => line.productId).filter((id): id is string => Boolean(id)) } } });
  const taskId = await db.$transaction(async (tx) => {
    const reference = await nextReference(tx, actor.organisationId, "PK", "PK");
    const task = await tx.warehouseTask.create({ data: { organisationId: actor.organisationId, reference, kind: "PICK", method: "SINGLE", requirementId, status: "READY" } });
    let sequence = 0;
    for (const line of lines) {
      const quantity = line.allocatedQuantity - line.pickedQuantity;
      if (quantity <= 0) continue;
      const product = products.find((item) => item.id === line.productId);
      sequence += 10;
      await tx.warehouseTaskLine.create({ data: { organisationId: actor.organisationId, taskId: task.id, fulfilmentLineId: line.id, productId: line.productId, description: line.description, productCode: product?.code ?? "", locationCode: pickFace?.code ?? "STOCK", expectedBarcode: product?.barcode || product?.code || "", requiredQuantity: quantity, sequence: pickFace?.sequence ?? sequence } });
    }
    await tx.fulfilmentRequirement.update({ where: { id: requirement.id }, data: { status: "RELEASED", releasedAt: requirement.releasedAt ?? new Date() } });
    return task.id;
  });
  await milestone({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "logistics.order.released", entityType: "FulfilmentRequirement", entityId: requirement.id, summary: `${requirement.reference} released to pick`, partyId: requirement.partyId, event: "logisticsOrderReleased", eventKey: `logistics.order.released:${taskId}`, payload: { requirementId: requirement.id, taskId } });
  return taskId;
}

async function releaseUnused(actor: { organisationId: string; userId: string }, requirementId: string) {
  const lines = await db.fulfilmentLine.findMany({ where: { organisationId: actor.organisationId, requirementId } });
  const provider = await stock();
  const requirement = await db.fulfilmentRequirement.findUnique({ where: { id: requirementId } });
  for (const line of lines) {
    const spare = line.allocatedQuantity - line.shippedQuantity;
    if (!line.productId || spare <= 0 || !requirement?.warehouseId) continue;
    await provider.releaseReservation(actor, { requestKey: `release-source:${line.id}`, productId: line.productId, warehouseId: requirement.warehouseId, quantity: spare, reason: "Release unused reservation", reference: requirement.reference, sourceId: line.id, sourceType: "FULFILMENT_LINE" });
    await db.fulfilmentLine.update({ where: { id: line.id }, data: { allocatedQuantity: line.shippedQuantity, allocationStatus: line.shippedQuantity ? "ALLOCATED" : "UNALLOCATED" } });
  }
}

export async function syncMissingDemand(actor: { organisationId: string; userId: string }) {
  const missing = await db.salesOrder.findMany({ where: { organisationId: actor.organisationId, commercialStatus: { in: ["CONFIRMED", "ON_HOLD"] }, fulfilments: { none: {} } }, select: { id: true, revision: true }, take: 50 });
  for (const order of missing) {
    try {
      await consumeSalesOrder({ kind: "confirmed", organisationId: actor.organisationId, orderId: order.id, eventKey: `sales.order.confirmed:${order.id}:${order.revision}`, actorUserId: actor.userId });
    } catch (error) {
      if (!sameOperation(error)) throw error;
    }
  }
}

export async function projectOrder(organisationId: string, orderId: string) {
  const rows = await db.fulfilmentRequirement.findMany({ where: { organisationId, salesOrderId: orderId }, include: { lines: true }, orderBy: { createdAt: "asc" } });
  if (!rows.length) return null;
  const lines = rows.flatMap((row) => row.lines);
  const shipped = lines.filter((line) => line.shippedQuantity >= Math.max(0, line.orderedQuantity - line.cancelledQuantity) && line.orderedQuantity > line.cancelledQuantity).length;
  const ready = lines.filter((line) => ["ALLOCATED", "PART_ALLOCATED"].includes(line.allocationStatus) && line.shippedQuantity < line.orderedQuantity - line.cancelledQuantity).length;
  const dates = rows.map((row) => row.promisedOn).filter((date): date is Date => Boolean(date)).sort((a, b) => a.getTime() - b.getTime());
  return {
    orderId,
    reference: rows[0]?.reference ?? null,
    lineCount: lines.length,
    readyLineCount: ready,
    awaitingLineCount: lines.filter((line) => line.allocationStatus === "SHORT" || line.allocationStatus === "UNALLOCATED").length,
    shippedLineCount: shipped,
    totalUnitsOrdered: lines.reduce((sum, line) => sum + Math.max(0, line.orderedQuantity - line.cancelledQuantity), 0),
    totalUnitsShipped: lines.reduce((sum, line) => sum + line.shippedQuantity, 0),
    nextDeliveryDate: dates[0] ?? null,
    expectedCompletion: rows.map((row) => row.expectedCompletion).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0] ?? dates.at(-1) ?? null,
    holdLabel: rows.find((row) => row.holdSummary)?.holdSummary ?? null,
    lines: lines.map((line) => ({ lineId: line.salesOrderLineId, allocatedQuantity: line.allocatedQuantity, pickedQuantity: line.pickedQuantity, packedQuantity: line.packedQuantity, shippedQuantity: line.shippedQuantity, deliveredQuantity: line.deliveredQuantity, returnedQuantity: line.returnedQuantity, allocationStatus: line.allocationStatus })),
  };
}

export async function recordDirectShipment(session: Session, requirementId: string, tracking: string) {
  const requirement = await db.fulfilmentRequirement.findFirst({ where: { id: requirementId, organisationId: session.organisationId }, include: { lines: true, party: true } });
  if (!requirement) throw new Error("This fulfilment no longer exists.");
  if (requirement.fulfilmentMode === "WAREHOUSE") throw new Error("Warehouse orders are dispatched from Dispatch. This action is for supplier-direct shipments.");
  await db.$transaction(async (tx) => {
    const reference = await nextReference(tx, session.organisationId, "SH", "SH");
    const shipment = await tx.shipment.create({ data: { organisationId: session.organisationId, reference, partyId: requirement.partyId, shipTo: requirement.shipTo ?? {}, status: "IN_TRANSIT", carrierCode: "SUPPLIER", carrierReason: "Supplier direct shipment. No warehouse movement was created.", serviceLevel: requirement.serviceLevel, trackingNumber: tracking || null, plannedDispatchAt: new Date() } });
    for (const line of requirement.lines) {
      const quantity = Math.max(0, line.orderedQuantity - line.cancelledQuantity - line.shippedQuantity);
      if (quantity <= 0) continue;
      await tx.shipmentSource.create({ data: { organisationId: session.organisationId, shipmentId: shipment.id, requirementId, fulfilmentLineId: line.id, quantity } });
      await tx.fulfilmentLine.update({ where: { id: line.id }, data: { shippedQuantity: line.shippedQuantity + quantity } });
    }
    await tx.fulfilmentRequirement.update({ where: { id: requirement.id }, data: { status: "SHIPPED" } });
  });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.shipment.created", entityType: "FulfilmentRequirement", entityId: requirement.id, summary: `${requirement.reference} is shipping direct from the supplier`, partyId: requirement.partyId, event: "logisticsShipmentCreated", eventKey: `logistics.direct:${requirement.id}:${tracking}`, payload: { requirementId, tracking } });
}

export async function restoreCancelledFulfilment(session: Session, requirementId: string) {
  const requirement = await db.fulfilmentRequirement.findFirst({
    where: { id: requirementId, organisationId: session.organisationId },
    include: { lines: true, salesOrder: { select: { commercialStatus: true } } },
  });
  if (!requirement) throw new Error("This delivery no longer exists.");
  if (requirement.status !== "CANCELLED") throw new Error("This delivery is not cancelled.");
  const shipped = requirement.lines.reduce((sum, line) => sum + line.shippedQuantity, 0);
  const next = restoredDeliveryStatus({ orderStatus: requirement.salesOrder.commercialStatus, requirementStatus: requirement.status, blocked: Boolean(requirement.holdSummary), shipped });
  if (!next || next === "CANCELLED") {
    throw new Error(requirement.salesOrder.commercialStatus === "CANCELLED" ? "Put the sales order back first. This delivery follows that order." : "Goods have already left, so this delivery cannot be wound back.");
  }
  const changed = await db.fulfilmentRequirement.updateMany({ where: { id: requirement.id, organisationId: session.organisationId, status: "CANCELLED" }, data: { status: next } });
  if (changed.count !== 1) throw new Error("This delivery changed. Reload it.");
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.delivery.restored", entityType: "FulfilmentRequirement", entityId: requirement.id, summary: `${requirement.reference} was put back`, partyId: requirement.partyId, eventKey: `logistics.delivery.restored:${requirement.id}:${requirement.version}` });
}

export { OPEN, postcodeOf };
