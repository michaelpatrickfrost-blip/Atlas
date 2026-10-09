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
      workOrderRows = buildWorkOrderRows(scheduled, session.organisationId, order.id, Number(order.quantity));
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

function buildWorkOrderRows(scheduled: ReturnType<typeof forwardSchedule>, organisationId: string, productionOrderId: string, quantity: number) {
  return scheduled.map((op, index) => ({
    organisationId,
    productionOrderId,
    sequence: index + 1,
    operationName: op.name,
    workCentreId: op.workCentreId,
    resourceId: op.resourceId,
    scheduledStart: op.start,
    scheduledEnd: op.end,
    // §20/§48: the plan the shop is committing to — setup, run for this quantity,
    // and their sum — frozen with the scheduling snapshot so a later routing edit
    // cannot silently rewrite history.
    setupMinutes: Math.round(op.setupMinutes),
    runMinutes: Math.round(op.runMinutesPerUnit * quantity),
    plannedMinutes: Math.round(op.durationMinutes),
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

/** Complete a routing step atomically with its material/output ledger and progress.
 * This reports one final good/scrap quantity; repeated partial output reporting
 * and authorised overproduction tolerances remain separate workflows. */
export async function completeWorkOrder(workOrderId: string, goodQuantity: number, scrapQuantity: number, requestKey: string) {
  const session = await requireSession();
  assertCapability(session, C.workOrderExecute);
  if (!Number.isSafeInteger(goodQuantity) || !Number.isSafeInteger(scrapQuantity) || goodQuantity < 0 || scrapQuantity < 0 || goodQuantity + scrapQuantity <= 0) throw new Error("Enter whole good and scrap quantities greater than zero in total.");
  if (!requestKey || requestKey.length > 80) throw new Error("A valid production request reference is required.");
  let replenishment: Awaited<ReturnType<typeof backflushOnCompletion>>;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      replenishment = await db.$transaction(async tx => {
        const workOrder = await tx.manufacturingWorkOrder.findFirst({ where: { id: workOrderId, organisationId: session.organisationId } });
        if (!workOrder) throw new Error("This work order no longer exists.");
        if (workOrder.lastRequestKey === requestKey && workOrder.status === "COMPLETE") {
          if (Number(workOrder.producedQuantity) !== goodQuantity || Number(workOrder.scrapQuantity) !== scrapQuantity) throw new Error("This request was already completed with different quantities.");
          return;
        }
        if (!canTransitionWorkOrder(workOrder.status, "COMPLETE")) throw new Error(`This step cannot complete from ${workOrder.status}.`);
        const order = await tx.manufacturingOrder.findFirst({ where: { id: workOrder.productionOrderId, organisationId: session.organisationId } });
        if (!order || !["RELEASED", "RUNNING"].includes(order.status)) throw new Error("Release this production order before completing work.");
        if (Number(workOrder.producedQuantity) + Number(workOrder.scrapQuantity) + goodQuantity + scrapQuantity > Number(order.quantity)) throw new Error("Reported quantities exceed the planned production quantity.");
        const parent = await tx.manufacturingOrder.updateMany({ where: { id: order.id, organisationId: session.organisationId, version: order.version }, data: { version: { increment: 1 } } });
        if (!parent.count) throw new Error("Someone else just changed this order. Reload and try again.");
        const updated = await tx.manufacturingWorkOrder.updateMany({
          where: { id: workOrderId, organisationId: session.organisationId, version: workOrder.version },
          data: {
            status: "COMPLETE",
            actualEnd: new Date(),
            // §20 plan-vs-actual: wall-clock time the step actually took, from the
            // moment it started. A step started and finished together records 0,
            // which is honest — we have no finer operator time entry yet.
            actualMinutes: workOrder.actualStart ? Math.max(0, Math.round((Date.now() - workOrder.actualStart.getTime()) / 60_000)) : 0,
            producedQuantity: { increment: goodQuantity },
            scrapQuantity: { increment: scrapQuantity },
            version: { increment: 1 },
            lastRequestKey: requestKey,
          },
        });
        if (!updated.count) throw new Error("Someone else just updated this step. Reload and try again.");
        const receipt = await backflushOnCompletion(session, workOrder, goodQuantity, scrapQuantity, requestKey, tx);
        await tx.manufacturingOrder.updateMany({ where: { id: order.id, organisationId: session.organisationId }, data: receipt ? { status: "COMPLETE", actualFinish: new Date() } : { status: "RUNNING", actualStart: order.actualStart ?? new Date() } });
        if (scrapQuantity > 0) await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.scrap.reported", entityType: "ManufacturingWorkOrder", entityId: workOrderId, after: { scrapQuantity } }, tx);
        await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.work_order.completed", entityType: "ManufacturingWorkOrder", entityId: workOrderId, after: { goodQuantity, scrapQuantity, requestKey } }, tx);
        await writeActivity({ organisationId: session.organisationId, type: "manufacturing.work_order.completed", summary: `${workOrder.operationName} completed — ${goodQuantity} good${scrapQuantity ? `, ${scrapQuantity} scrap` : ""}`, entityType: "ManufacturingWorkOrder", entityId: workOrder.id }, tx);
        return receipt;
      }, { isolationLevel: "Serializable" });
      break;
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (attempt < 2 && ["P2034", "P2002"].includes(code)) continue;
      throw error;
    }
  }
  if (replenishment) {
    const { stockReplenished } = await import("@/core/stock/replenishment");
    await stockReplenished(session, replenishment);
  }
}
