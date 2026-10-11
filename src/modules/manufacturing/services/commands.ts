"use server";

import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { requireSession } from "@/core/auth/session";
import { assertModuleEnabled } from "@/core/modules/access";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { nextOrderNumber } from "./numbers";
import { canTransitionOrder, canTransitionWorkOrder, readyToRelease } from "../domain/lifecycle";
import { finiteSchedule } from "../domain/finite-scheduling";
import { loadFiniteResources } from "./finite-data";
import { operationTime } from "@/modules/products/domain/operation-time";
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
  await assertModuleEnabled(session, "manufacturing");
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 1_000_000_000) throw new Error("Quantity must be finite and greater than zero.");
  const product = await db.product.findFirst({ where: { id: input.productId, organisationId: session.organisationId, active: true, kind: "PRODUCT" }, select: { unitOfMeasure: true } });
  if (!product) throw new Error("Choose an active product in this company.");
  if (input.unitOfMeasure && input.unitOfMeasure !== product.unitOfMeasure) throw new Error("Production quantity must use the product's stock unit.");
  if (input.definitionId && !await db.productDefinition.findFirst({ where: { id: input.definitionId, organisationId: session.organisationId, productId: input.productId, supply: { not: "BUY" } } })) throw new Error("Choose this product's manufacturing recipe in this company.");
  if (input.sourceSalesOrderLineId && !await db.salesOrderLine.findFirst({ where: { id: input.sourceSalesOrderLineId, productId: input.productId, order: { organisationId: session.organisationId } } })) throw new Error("Choose a sales order line for this product in this company.");
  if (input.requiredDate && !Number.isFinite(input.requiredDate.getTime())) throw new Error("Enter a valid required date.");

  const order = await db.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx, session.organisationId);
    return tx.manufacturingOrder.create({
      data: {
        organisationId: session.organisationId,
        orderNumber,
        productId: input.productId,
        definitionId: input.definitionId ?? null,
        quantity: input.quantity,
        unitOfMeasure: product.unitOfMeasure,
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
  await assertModuleEnabled(session, "manufacturing");
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
  await assertModuleEnabled(session, "manufacturing");
  await db.$transaction(async (tx) => {
    const order = await tx.manufacturingOrder.findFirst({ where: { id: orderId, organisationId: session.organisationId } });
    if (!order) throw new Error("This production order no longer exists.");
    if (!canTransitionOrder(order.status, "RELEASED")) throw new Error(`${order.orderNumber} cannot be released from ${order.status}.`);
    const existing = await tx.manufacturingWorkOrder.count({ where: { organisationId: session.organisationId, productionOrderId: order.id } });
    let workOrderCount = 0;
    let plannedStart: Date | null = null;
    let plannedFinish: Date | null = null;
    if (!existing && order.definitionId) {
      const definition = await tx.productDefinition.findFirst({ where: { id: order.definitionId, organisationId: session.organisationId, productId: order.productId }, include: { operations: { orderBy: { position: "asc" } } } });
      if (!definition) throw new Error("This order's recipe is not in this company or does not match its product.");
      const centres = await tx.manufacturingWorkCentre.findMany({ where: { organisationId: session.organisationId, active: true } });
      const byName = new Map(centres.map((wc) => [wc.name.toLowerCase(), wc.id]));
      const resources = await loadFiniteResources(tx, session.organisationId);
      const operations = definition.operations.map((op) => {
        const assignment = releasedAssignment(op, byName);
        const timing = operationTime({ setupMinutes: Number(op.setupMinutes), runMinutesPerUnit: Number(op.runMinutesPerUnit), timingMode: op.timingMode, batchCapacity: Number(op.batchCapacity), cycleMinutes: Number(op.cycleMinutes), coolingMinutes: Number(op.coolingMinutes), waitMinutes: Number(op.waitMinutes) }, Number(order.quantity), Number(definition.batchQuantity));
        const eligibleResourceIds = op.eligibleResourceIds.length ? op.eligibleResourceIds : assignment.resourceId ? [assignment.resourceId] : resources.filter((r) => r.workCentreId === assignment.workCentreId).map((r) => r.id);
        return { id: op.id, name: op.name, ...assignment, ...timing, timingMode: op.timingMode, eligibleResourceIds };
      });
      const scheduled = finiteSchedule(operations, new Date(), resources);
      if (scheduled.length) {
        plannedStart = scheduled[0].start; plannedFinish = scheduled.at(-1)!.end;
        const rows = scheduled.map((slot, index) => ({ organisationId: session.organisationId, productionOrderId: order.id, sequence: index + 1, operationName: slot.name, workCentreId: slot.workCentreId, resourceId: slot.resourceId, scheduledStart: slot.start, scheduledEnd: slot.end,
          setupMinutes: Math.ceil(operations[index].setupMinutes), runMinutes: Math.ceil(operations[index].runMinutes), plannedMinutes: Math.ceil(slot.durationMinutes), timingMode: operations[index].timingMode, waitMinutes: Math.ceil(slot.waitMinutes), eligibleResourceIds: operations[index].eligibleResourceIds }));
        await tx.manufacturingWorkOrder.createMany({ data: rows }); workOrderCount = rows.length;
      }
    }
    const updated = await tx.manufacturingOrder.updateMany({ where: { id: order.id, organisationId: session.organisationId, version: order.version, status: order.status }, data: { status: "RELEASED", version: { increment: 1 }, ...(plannedStart && plannedFinish ? { plannedStart, plannedFinish } : {}) } });
    if (!updated.count) throw new Error("Someone else just changed this order. Reload and try again.");
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.order.released", entityType: "ManufacturingOrder", entityId: order.id, after: { orderNumber: order.orderNumber, workOrderCount, plannedStart, plannedFinish, schedulingBasis: "finite-resource-calendar" } }, tx);
    await writeActivity({ organisationId: session.organisationId, type: "manufacturing.order.released", summary: `${order.orderNumber} released with ${workOrderCount} operations`, entityType: "ManufacturingOrder", entityId: order.id }, tx);
  }, { isolationLevel: "Serializable", timeout: 20000 });
}

export async function closeOrder(orderId: string) {
  const session = await requireSession();
  assertCapability(session, C.orderClose);
  await assertModuleEnabled(session, "manufacturing");
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
  await assertModuleEnabled(session, "manufacturing");
  const workOrder = await workOrderOrThrow(session.organisationId, workOrderId);
  if (workOrder.lastRequestKey === requestKey) return workOrder;
  if (!canTransitionWorkOrder(workOrder.status, "RUNNING")) throw new Error(`This step cannot start from ${workOrder.status}.`);
  if (workOrder.resourceId) {
    const { getModule } = await import("@/core/modules/registry");
    const status = await getModule("safety")?.safetyProvider?.resourceStatus(session.organisationId, workOrder.resourceId);
    if (status && !status.available) throw new Error(status.reason ?? "Safety hold: this resource must not be started.");
  }
  if (!requestKey || requestKey.length > 80) throw new Error("A valid production request reference is required.");
  await db.$transaction(async (tx) => {
    const current = await tx.manufacturingWorkOrder.findFirst({ where: { id: workOrderId, organisationId: session.organisationId }, include: { productionOrder: true } });
    if (!current || current.version !== workOrder.version || !canTransitionWorkOrder(current.status, "RUNNING")) throw new Error("This step changed. Reload before starting.");
    if (!["RELEASED", "RUNNING"].includes(current.productionOrder.status)) throw new Error("Release the production order before starting work.");
    const previous = await tx.manufacturingWorkOrder.findFirst({ where: { organisationId: session.organisationId, productionOrderId: current.productionOrderId, sequence: { lt: current.sequence } }, orderBy: { sequence: "desc" } });
    const now = new Date();
    if (previous && (previous.status !== "COMPLETE" || !previous.actualEnd || now.getTime() < previous.actualEnd.getTime() + previous.waitMinutes * 60_000)) throw new Error("Complete the previous operation and its transfer/wait time before starting this step.");
    if (current.scheduledStart && now < current.scheduledStart) throw new Error("This step is booked for later. Review the schedule before starting early.");
    if (current.resourceId) {
      const resource = await tx.manufacturingResource.findFirst({ where: { id: current.resourceId, organisationId: session.organisationId, active: true, workCentre: { active: true, organisationId: session.organisationId } } });
      if (!resource) throw new Error("This machine is unavailable. Review the plant and schedule.");
      const downtime = await tx.manufacturingDowntime.findFirst({ where: { organisationId: session.organisationId, resourceId: resource.id, active: true, startsAt: { lte: now }, endsAt: { gt: now } } });
      if (downtime) throw new Error(`Machine downtime: ${downtime.reason}. Review the schedule before starting.`);
      const running = await tx.manufacturingWorkOrder.count({ where: { organisationId: session.organisationId, resourceId: resource.id, id: { not: current.id }, status: "RUNNING" } });
      if (running) throw new Error("Another operation is already running on this machine.");
    }
    const updated = await tx.manufacturingWorkOrder.updateMany({ where: { id: current.id, organisationId: session.organisationId, version: current.version, status: current.status }, data: { status: "RUNNING", actualStart: current.actualStart ?? now, version: { increment: 1 }, lastRequestKey: requestKey } });
    if (!updated.count) throw new Error("Someone else just updated this step. Reload and try again.");
    const parent = await tx.manufacturingOrder.updateMany({ where: { id: current.productionOrderId, organisationId: session.organisationId, version: current.productionOrder.version }, data: { status: "RUNNING", actualStart: current.productionOrder.actualStart ?? now, version: { increment: 1 } } });
    if (!parent.count) throw new Error("The production order changed. Reload before starting.");
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.work_order.started", entityType: "ManufacturingWorkOrder", entityId: current.id, after: { requestKey, resourceId: current.resourceId } }, tx);
    await writeActivity({ organisationId: session.organisationId, type: "manufacturing.work_order.started", summary: `${current.operationName} started`, entityType: "ManufacturingWorkOrder", entityId: current.id }, tx);
  }, { isolationLevel: "Serializable" });
}

/** §72: pause with an optional reason, for downtime analysis. */
export async function pauseWorkOrder(workOrderId: string, reason: string | null, requestKey: string) {
  const session = await requireSession();
  assertCapability(session, C.workOrderExecute);
  await assertModuleEnabled(session, "manufacturing");
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
  await assertModuleEnabled(session, "manufacturing");
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
