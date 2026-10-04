"use server";

import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { nextOrderNumber } from "./numbers";
import { canTransitionOrder, canTransitionWorkOrder, readyToRelease } from "../domain/lifecycle";
import { forwardSchedule } from "../domain/scheduling";
import { releasedAssignment } from "../domain/plant";
import { backflushOnCompletion } from "./stock";

/** §57-58: create a Planned Production Order. Firming/MRP-origin orders are a later phase —
 * this covers the manual "create production order" path only. */
export async function createProductionOrder(input: {
  productId: string;
  definitionId?: string | null;
  quantity: number;
  unitOfMeasure?: string;
  requiredDate?: Date | null;
  sourceSalesOrderLineId?: string | null;
  notes?: string | null;
}) {
  const session = await requireSession();
  assertCapability(session, C.orderCreate);
  if (input.quantity <= 0) throw new Error("Quantity must be greater than zero.");

  const order = await db.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx, session.organisationId);
    return tx.manufacturingOrder.create({
      data: {
        organisationId: session.organisationId,
        orderNumber,
        productId: input.productId,
        definitionId: input.definitionId ?? null,
        quantity: input.quantity,
        unitOfMeasure: input.unitOfMeasure ?? "each",
        requiredDate: input.requiredDate ?? null,
        sourceSalesOrderLineId: input.sourceSalesOrderLineId ?? null,
        notes: input.notes ?? null,
        createdByUserId: session.userId,
      },
    });
  });

  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.order.created", entityType: "ManufacturingOrder", entityId: order.id, after: { orderNumber: order.orderNumber } });
  await writeActivity({ organisationId: session.organisationId, type: "manufacturing.order.created", summary: `${order.orderNumber} created`, entityType: "ManufacturingOrder", entityId: order.id });
  return order;
}

async function orderOrThrow(organisationId: string, orderId: string) {
  const order = await db.manufacturingOrder.findFirst({ where: { id: orderId, organisationId } });
  if (!order) throw new Error("This production order no longer exists.");
  return order;
}

/** §41, §59: firm a planned order into Ready (ready check passed). */
export async function markOrderReady(orderId: string) {
  const session = await requireSession();
  assertCapability(session, C.planFirm);
  const order = await orderOrThrow(session.organisationId, orderId);
  if (!canTransitionOrder(order.status, "READY")) throw new Error(`${order.orderNumber} cannot move to Ready from ${order.status}.`);
  const check = readyToRelease(order);
  if (!check.ready) throw new Error(check.reasons.join(" "));
  await applyOrderTransition(session, order, "READY");
}

/** §58-59, §66-68: release a Ready order — generates its Work Orders from the
 * routing snapshot (§19) and forward-schedules them (§46) if none exist yet.
 * Re-releasing an order that already has Work Orders (e.g. after a status
 * round-trip) does not duplicate them. Work order creation and the status
 * transition happen in one transaction so a version conflict never leaves
 * orphaned work orders behind. */
export async function releaseOrder(orderId: string) {
  const session = await requireSession();
  assertCapability(session, C.orderRelease);
  const order = await orderOrThrow(session.organisationId, orderId);
  if (!canTransitionOrder(order.status, "RELEASED")) throw new Error(`${order.orderNumber} cannot be released from ${order.status}.`);

  const existingWorkOrders = await db.manufacturingWorkOrder.count({ where: { productionOrderId: order.id } });
  let plannedStart: Date | null = null;
  let plannedFinish: Date | null = null;
  let workOrderRows: ReturnType<typeof buildWorkOrderRows> = [];

  if (!existingWorkOrders && order.definitionId) {
    const operations = await db.productOperation.findMany({ where: { definitionId: order.definitionId }, orderBy: { position: "asc" } });
    if (operations.length) {
      const workCentres = await db.manufacturingWorkCentre.findMany({ where: { organisationId: session.organisationId } });
      const byName = new Map(workCentres.map((wc) => [wc.name.toLowerCase(), wc.id]));
      const scheduled = forwardSchedule(
        operations.map((op) => {
          const assignment = releasedAssignment(op, byName);
          return { name: op.name, position: op.position, setupMinutes: Number(op.setupMinutes), runMinutesPerUnit: Number(op.runMinutesPerUnit), crewSize: Number(op.crewSize), workCentreId: assignment.workCentreId, resourceId: assignment.resourceId };
        }),
        Number(order.quantity),
        new Date(),
      );
      workOrderRows = buildWorkOrderRows(scheduled, session.organisationId, order.id);
      plannedStart = scheduled[0].start;
      plannedFinish = scheduled[scheduled.length - 1].end;
    }
  }

  await db.$transaction(async (tx) => {
    if (workOrderRows.length) await tx.manufacturingWorkOrder.createMany({ data: workOrderRows });
    const updated = await tx.manufacturingOrder.updateMany({
      where: { id: order.id, organisationId: session.organisationId, version: order.version },
      data: { status: "RELEASED", version: { increment: 1 }, ...(plannedStart && plannedFinish ? { plannedStart, plannedFinish } : {}) },
    });
    if (!updated.count) throw new Error("Someone else just changed this order. Reload and try again.");
  });

  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.order.released", entityType: "ManufacturingOrder", entityId: order.id, after: { orderNumber: order.orderNumber, workOrderCount: workOrderRows.length } });
  await writeActivity({ organisationId: session.organisationId, type: "manufacturing.order.released", summary: `${order.orderNumber} released${workOrderRows.length ? ` with ${workOrderRows.length} operations` : ""}`, entityType: "ManufacturingOrder", entityId: order.id });
}

function buildWorkOrderRows(scheduled: ReturnType<typeof forwardSchedule>, organisationId: string, productionOrderId: string) {
  return scheduled.map((op, index) => ({
    organisationId,
    productionOrderId,
    sequence: index + 1,
    operationName: op.name,
    workCentreId: op.workCentreId,
    resourceId: op.resourceId,
    scheduledStart: op.start,
    scheduledEnd: op.end,
  }));
}

export async function closeOrder(orderId: string) {
  const session = await requireSession();
  assertCapability(session, C.orderClose);
  const order = await orderOrThrow(session.organisationId, orderId);
  if (!canTransitionOrder(order.status, "CLOSED")) throw new Error(`${order.orderNumber} cannot be closed from ${order.status}.`);
  await applyOrderTransition(session, order, "CLOSED");
}

async function applyOrderTransition(session: Session, order: { id: string; orderNumber: string; version: number; status: string }, to: string, extra?: { plannedStart: Date; plannedFinish: Date }) {
  const updated = await db.manufacturingOrder.updateMany({
    where: { id: order.id, organisationId: session.organisationId, version: order.version },
    data: { status: to as never, version: { increment: 1 }, ...(extra ?? {}), ...(to === "RUNNING" ? { actualStart: new Date() } : {}), ...(to === "COMPLETE" ? { actualFinish: new Date() } : {}) },
  });
  if (!updated.count) throw new Error("Someone else just changed this order. Reload and try again.");
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: `manufacturing.order.${to.toLowerCase()}`, entityType: "ManufacturingOrder", entityId: order.id, after: { orderNumber: order.orderNumber, to } });
  await writeActivity({ organisationId: session.organisationId, type: `manufacturing.order.${to.toLowerCase()}`, summary: `${order.orderNumber} is now ${to.toLowerCase()}`, entityType: "ManufacturingOrder", entityId: order.id });
}

async function workOrderOrThrow(organisationId: string, workOrderId: string) {
  const workOrder = await db.manufacturingWorkOrder.findFirst({ where: { id: workOrderId, organisationId } });
  if (!workOrder) throw new Error("This work order no longer exists.");
  return workOrder;
}

/** §71: start a work order on the shop floor. */
export async function startWorkOrder(workOrderId: string, requestKey: string) {
  const session = await requireSession();
  assertCapability(session, C.workOrderExecute);
  const workOrder = await workOrderOrThrow(session.organisationId, workOrderId);
  if (workOrder.lastRequestKey === requestKey) return workOrder;
  if (!canTransitionWorkOrder(workOrder.status, "RUNNING")) throw new Error(`This step cannot start from ${workOrder.status}.`);
  if (workOrder.resourceId) {
    const { getModule } = await import("@/core/modules/registry");
    const status = await getModule("safety")?.safetyProvider?.resourceStatus(session.organisationId, workOrder.resourceId);
    if (status && !status.available) throw new Error(status.reason ?? "Safety hold: this resource must not be started.");
  }
  const updated = await db.manufacturingWorkOrder.updateMany({
    where: { id: workOrderId, organisationId: session.organisationId, version: workOrder.version },
    data: { status: "RUNNING", actualStart: workOrder.actualStart ?? new Date(), version: { increment: 1 }, lastRequestKey: requestKey },
  });
  if (!updated.count) throw new Error("Someone else just updated this step. Reload and try again.");
  await writeActivity({ organisationId: session.organisationId, type: "manufacturing.work_order.started", summary: `${workOrder.operationName} started`, entityType: "ManufacturingWorkOrder", entityId: workOrder.id });
}

/** §72: pause with an optional reason, for downtime analysis. */
export async function pauseWorkOrder(workOrderId: string, reason: string | null, requestKey: string) {
  const session = await requireSession();
  assertCapability(session, C.workOrderExecute);
  const workOrder = await workOrderOrThrow(session.organisationId, workOrderId);
  if (workOrder.lastRequestKey === requestKey) return workOrder;
  if (!canTransitionWorkOrder(workOrder.status, "PAUSED")) throw new Error(`This step cannot pause from ${workOrder.status}.`);
  const updated = await db.manufacturingWorkOrder.updateMany({
    where: { id: workOrderId, organisationId: session.organisationId, version: workOrder.version },
    data: { status: "PAUSED", pauseReason: reason, version: { increment: 1 }, lastRequestKey: requestKey },
  });
  if (!updated.count) throw new Error("Someone else just updated this step. Reload and try again.");
}

/** §73-75: idempotent completion with good/scrap quantities and partial completion.
 * Over-reporting past the production order's required quantity is rejected rather
 * than silently accepted (§65's tolerance engine is a later phase; this is the floor). */
export async function completeWorkOrder(workOrderId: string, goodQuantity: number, scrapQuantity: number, requestKey: string) {
  const session = await requireSession();
  assertCapability(session, C.workOrderExecute);
  if (goodQuantity < 0 || scrapQuantity < 0) throw new Error("Quantities cannot be negative.");
  const workOrder = await workOrderOrThrow(session.organisationId, workOrderId);
  if (workOrder.lastRequestKey === requestKey) return workOrder;
  if (!canTransitionWorkOrder(workOrder.status, "COMPLETE")) throw new Error(`This step cannot complete from ${workOrder.status}.`);
  await backflushOnCompletion(session, workOrder, goodQuantity, scrapQuantity, requestKey);
  const updated = await db.manufacturingWorkOrder.updateMany({
    where: { id: workOrderId, organisationId: session.organisationId, version: workOrder.version },
    data: {
      status: "COMPLETE",
      actualEnd: new Date(),
      producedQuantity: { increment: goodQuantity },
      scrapQuantity: { increment: scrapQuantity },
      version: { increment: 1 },
      lastRequestKey: requestKey,
    },
  });
  if (!updated.count) throw new Error("Someone else just updated this step. Reload and try again.");
  if (scrapQuantity > 0) {
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.scrap.reported", entityType: "ManufacturingWorkOrder", entityId: workOrderId, after: { scrapQuantity } });
  }
  await writeActivity({ organisationId: session.organisationId, type: "manufacturing.work_order.completed", summary: `${workOrder.operationName} completed — ${goodQuantity} good${scrapQuantity ? `, ${scrapQuantity} scrap` : ""}`, entityType: "ManufacturingWorkOrder", entityId: workOrder.id });
}
