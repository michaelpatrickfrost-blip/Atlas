"use server";
import { validateProductionCostRelease } from "@/core/finance/manufacturing";

import { validQuantity, addQuantity } from "@/core/shared/quantity";

import { createHash } from "node:crypto";
import { measuredQuantity } from "@/core/shared/measurement";

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
  warehouseId?: string | null;
  quantity: number;
  unitOfMeasure?: string;
  requiredDate?: Date | null;
  sourceSalesOrderLineId?: string | null;
  notes?: string | null;
}) {
  const session = await requireSession();
  assertCapability(session, C.orderCreate);
  await assertModuleEnabled(session, "manufacturing");
  if (!validQuantity(input.quantity) || input.quantity <= 0 || input.quantity > 1_000_000_000) throw new Error("Quantity must be finite and greater than zero.");
  const product = await db.product.findFirst({ where: { id: input.productId, organisationId: session.organisationId, active: true, kind: "PRODUCT" }, select: { unitOfMeasure: true } });
  if (!product) throw new Error("Choose an active product in this company.");
  if (input.unitOfMeasure && input.unitOfMeasure !== product.unitOfMeasure) throw new Error("Production quantity must use the product's stock unit.");
  if (input.definitionId && !await db.productDefinition.findFirst({ where: { id: input.definitionId, organisationId: session.organisationId, productId: input.productId, supply: { not: "BUY" } } })) throw new Error("Choose this product's manufacturing recipe in this company.");
  if (input.sourceSalesOrderLineId && !await db.salesOrderLine.findFirst({ where: { id: input.sourceSalesOrderLineId, productId: input.productId, order: { organisationId: session.organisationId } } })) throw new Error("Choose a sales order line for this product in this company.");
  if (input.warehouseId && !await db.warehouse.findFirst({ where: { id: input.warehouseId, organisationId: session.organisationId } })) throw new Error("Choose a production warehouse in this company.");
  if (input.requiredDate && !Number.isFinite(input.requiredDate.getTime())) throw new Error("Enter a valid required date.");

  const order = await db.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx, session.organisationId);
    return tx.manufacturingOrder.create({
      data: {
        organisationId: session.organisationId,
        orderNumber,
        productId: input.productId,
        definitionId: input.definitionId ?? null,
        warehouseId: input.warehouseId ?? null,
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
      const warehouse = order.warehouseId ? await tx.warehouse.findFirstOrThrow({ where: { id: order.warehouseId, organisationId: session.organisationId } }) : await tx.warehouse.findFirst({ where: { organisationId: session.organisationId, kind: "WAREHOUSE" }, orderBy: { code: "asc" } });
      if (!warehouse) throw new Error("Create a production warehouse in Inventory before releasing work.");
      await validateProductionCostRelease(session, tx, warehouse.id, definition.id);
      if (!order.warehouseId) await tx.manufacturingOrder.updateMany({ where: { id: order.id, organisationId: session.organisationId }, data: { warehouseId: warehouse.id } });
      const centres = await tx.manufacturingWorkCentre.findMany({ where: { organisationId: session.organisationId, active: true } });
      const byName = new Map(centres.map((wc) => [wc.name.toLowerCase(), wc.id]));
      const resources = await loadFiniteResources(tx, session.organisationId);
      const operations = definition.operations.map((op) => {
        const assignment = releasedAssignment(op, byName);
        const timing = operationTime({ setupMinutes: Number(op.setupMinutes), runMinutesPerUnit: Number(op.runMinutesPerUnit), timingMode: op.timingMode, batchCapacity: Number(op.batchCapacity), cycleMinutes: Number(op.cycleMinutes), coolingMinutes: Number(op.coolingMinutes), waitMinutes: Number(op.waitMinutes) }, Number(order.quantity), Number(definition.batchQuantity));
        const eligibleResourceIds = op.eligibleResourceIds.length ? op.eligibleResourceIds : assignment.resourceId ? [assignment.resourceId] : resources.filter((r) => r.workCentreId === assignment.workCentreId).map((r) => r.id);
        return { id: op.id, name: op.name, ...assignment, ...timing, timingMode: op.timingMode, eligibleResourceIds };
      });
      const now = new Date();
      const earliestStart = order.plannedStart && order.plannedStart > now ? order.plannedStart : now;
      const scheduled = finiteSchedule(operations, earliestStart, resources);
      if (scheduled.length) {
        plannedStart = scheduled[0].start; plannedFinish = scheduled.at(-1)!.end;
        const rows = scheduled.map((slot, index) => ({ organisationId: session.organisationId, productionOrderId: order.id, sequence: index + 1, status: index === 0 ? "READY" as const : "WAITING" as const, operationName: slot.name, workCentreId: slot.workCentreId, resourceId: slot.resourceId, scheduledStart: slot.start, scheduledEnd: slot.end,
          costBasisCaptured: true, setupMinutes: Math.ceil(operations[index].setupMinutes), runMinutes: Math.ceil(operations[index].runMinutes), plannedMinutes: Math.ceil(slot.durationMinutes), processProfile: definition.operations[index].processProfile, loadUnit: definition.operations[index].loadUnit, loadPerUnit: definition.operations[index].loadPerUnit, batchCapacity: definition.operations[index].batchCapacity, cycleMinutes: definition.operations[index].cycleMinutes, coolingMinutes: definition.operations[index].coolingMinutes, machineMinorPerHour: definition.operations[index].machineMinorPerHour, labourMinorPerHour: definition.operations[index].labourMinorPerHour, overheadMinorPerHour: definition.operations[index].overheadMinorPerHour, crewSize: definition.operations[index].crewSize, machineIncludesLabour: definition.operations[index].machineIncludesLabour, machineIncludesOverhead: definition.operations[index].machineIncludesOverhead, timingMode: operations[index].timingMode, waitMinutes: Math.ceil(slot.waitMinutes), eligibleResourceIds: operations[index].eligibleResourceIds }));
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
  if (workOrder.status !== "WAITING" && !canTransitionWorkOrder(workOrder.status, "RUNNING")) throw new Error(`This step cannot start from ${workOrder.status}.`);
  if (workOrder.resourceId) {
    const { getModule } = await import("@/core/modules/registry");
    const status = await getModule("safety")?.safetyProvider?.resourceStatus(session.organisationId, workOrder.resourceId);
    if (status && !status.available) throw new Error(status.reason ?? "Safety hold: this resource must not be started.");
  }
  if (!requestKey || requestKey.length > 80) throw new Error("A valid production request reference is required.");
  await db.$transaction(async (tx) => {
    const current = await tx.manufacturingWorkOrder.findFirst({ where: { id: workOrderId, organisationId: session.organisationId }, include: { productionOrder: true } });
    if (!current || current.version !== workOrder.version || current.status !== "WAITING" && !canTransitionWorkOrder(current.status, "RUNNING")) throw new Error("This step changed. Reload before starting.");
    if (!["RELEASED", "RUNNING"].includes(current.productionOrder.status)) throw new Error("Release the production order before starting work.");
    const previous = await tx.manufacturingWorkOrder.findFirst({ where: { organisationId: session.organisationId, productionOrderId: current.productionOrderId, sequence: { lt: current.sequence } }, orderBy: { sequence: "desc" } });
    const now = new Date();
    if (previous && (previous.status !== "COMPLETE" || !previous.actualEnd || now.getTime() < previous.actualEnd.getTime() + previous.waitMinutes * 60_000)) throw new Error("Complete the previous operation and its transfer/wait time before starting this step.");
    if (!current.scheduledStart || !current.scheduledEnd) throw new Error("Schedule this operation before starting it.");
    if (current.machineLoadId) { const load = await tx.manufacturingMachineLoad.findFirstOrThrow({ where: { organisationId: session.organisationId, id: current.machineLoadId } }); if (load.status !== "RUNNING" || current.status !== "PAUSED") throw new Error("Start all members together from Machine loads."); }
    if (current.scheduledStart && now < current.scheduledStart) throw new Error("This step is booked for later. Review the schedule before starting early.");
    if (current.resourceId) {
      const resource = await tx.manufacturingResource.findFirst({ where: { id: current.resourceId, organisationId: session.organisationId, active: true, workCentre: { active: true, organisationId: session.organisationId } } });
      if (!resource) throw new Error("This machine is unavailable. Review the plant and schedule.");
      const downtime = await tx.manufacturingDowntime.findFirst({ where: { organisationId: session.organisationId, resourceId: resource.id, active: true, startsAt: { lte: now }, endsAt: { gt: now } } });
      if (downtime) throw new Error(`Machine downtime: ${downtime.reason}. Review the schedule before starting.`);
      const running = await tx.manufacturingWorkOrder.count({ where: { organisationId: session.organisationId, resourceId: resource.id, id: { not: current.id }, ...(current.machineLoadId ? { OR: [{ machineLoadId: null }, { machineLoadId: { not: current.machineLoadId } }] } : {}), status: { in: ["RUNNING", "PAUSED"] } } });
      if (running) throw new Error("Another operation is already running or paused on this machine.");
    }
    // Compatibility for previously released rows that defaulted to WAITING.
    // Promotion is legal only after the same predecessor/time/machine guards.
    if (current.status === "WAITING") {
      const ready = await tx.manufacturingWorkOrder.updateMany({ where: { id: current.id, organisationId: session.organisationId, version: current.version, status: "WAITING" }, data: { status: "READY", version: { increment: 1 } } });
      if (!ready.count) throw new Error("This step changed. Reload before starting.");
      await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.work_order.ready", entityType: "ManufacturingWorkOrder", entityId: current.id, after: { precedingWorkOrderId: previous?.id ?? null, reason: "validated-start" } }, tx);
      current.version += 1; current.status = "READY";
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

/** Each report commits its quantities, material use, finished stock and history together. */
export async function completeWorkOrder(workOrderId: string, goodQuantity: number, scrapQuantity: number, requestKey: string, options: { finish?: boolean; enteredUnit?: string; lotCode?: string; serials?: string[]; createBackorder?: boolean; shortCloseReason?: string } = {}) {
  const session = await requireSession();
  assertCapability(session, C.workOrderExecute);
  await assertModuleEnabled(session, "manufacturing");
  const finish = options.finish !== false;
  if (!validQuantity(goodQuantity) || !validQuantity(scrapQuantity) || goodQuantity < 0 || scrapQuantity < 0 || !finish && addQuantity(goodQuantity, scrapQuantity) <= 0) throw new Error("Enter good and scrap quantities with up to six decimal places.");
  if (!requestKey || requestKey.length > 80) throw new Error("A valid production request reference is required.");
  const fingerprint = createHash("sha256").update(JSON.stringify({ workOrderId, goodQuantity, scrapQuantity, finish, createBackorder:options.createBackorder??false, enteredUnit: options.enteredUnit ?? null, lotCode: options.lotCode?.trim() || null, serials: [...(options.serials ?? [])].sort(), shortCloseReason: options.shortCloseReason?.trim() || null })).digest("hex");
  let replenishment: Awaited<ReturnType<typeof backflushOnCompletion>>;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      replenishment = await db.$transaction(async tx => {
        const prior = await tx.manufacturingProductionReport.findUnique({ where: { organisationId_requestKey: { organisationId: session.organisationId, requestKey } } });
        if (prior) { if (prior.fingerprint !== fingerprint) throw new Error("This report reference already belongs to different production details."); return; }
        const workOrder = await tx.manufacturingWorkOrder.findFirst({ where: { id: workOrderId, organisationId: session.organisationId } });
        if (!workOrder) throw new Error("This work order no longer exists.");
        // Existing completed orders retain their pre-report-table replay behaviour.
        if (workOrder.lastRequestKey === requestKey && workOrder.status === "COMPLETE") {
          if (Number(workOrder.producedQuantity) !== goodQuantity || Number(workOrder.scrapQuantity) !== scrapQuantity) throw new Error("This request was already completed with different quantities.");
          return;
        }
        if (!["RUNNING", "PAUSED"].includes(workOrder.status)) throw new Error(`This step cannot report production from ${workOrder.status}.`);
        const order = await tx.manufacturingOrder.findFirst({ where: { id: workOrder.productionOrderId, organisationId: session.organisationId } });
        if (!order || !["RELEASED", "RUNNING"].includes(order.status)) throw new Error("Release this production order before reporting work.");
        const good = measuredQuantity(goodQuantity, options.enteredUnit || order.unitOfMeasure, order.unitOfMeasure);
        const scrap = measuredQuantity(scrapQuantity, options.enteredUnit || order.unitOfMeasure, order.unitOfMeasure);
        const previous = await tx.manufacturingWorkOrder.findFirst({ where: { organisationId: session.organisationId, productionOrderId: order.id, sequence: { lt: workOrder.sequence } }, orderBy: { sequence: "desc" } });
        if (previous && previous.status !== "COMPLETE") throw new Error("Complete the previous operation before reporting this step.");
        const inputQuantity = previous ? Number(previous.producedQuantity) : Number(order.quantity);
        const produced = addQuantity(Number(workOrder.producedQuantity), good.quantity);
        const scrapped = addQuantity(Number(workOrder.scrapQuantity), scrap.quantity);
        const total = addQuantity(produced, scrapped);
        if (total > inputQuantity) throw new Error("Reported quantities exceed the quantity available from the previous operation or production plan.");
        if (total <= 0 && !(finish && inputQuantity === 0 && previous?.status === "COMPLETE")) throw new Error("Report some production before finishing this operation.");
        if (finish && total < inputQuantity && !options.shortCloseReason?.trim()) throw new Error("Report the remaining quantity, or enter a reason for finishing this operation short.");
        const parent = await tx.manufacturingOrder.updateMany({ where: { id: order.id, organisationId: session.organisationId, version: order.version }, data: { version: { increment: 1 } } });
        if (!parent.count) throw new Error("Someone else just changed this order. Reload and try again.");
        const updated = await tx.manufacturingWorkOrder.updateMany({ where: { id: workOrderId, organisationId: session.organisationId, version: workOrder.version }, data: {
          status: finish ? "COMPLETE" : workOrder.status, actualEnd: finish ? new Date() : null,
          actualMinutes: finish && workOrder.actualStart ? Math.max(0, Math.round((Date.now() - workOrder.actualStart.getTime()) / 60_000)) : workOrder.actualMinutes,
          producedQuantity: produced, scrapQuantity: scrapped, version: { increment: 1 }, lastRequestKey: requestKey,
        } });
        if (!updated.count) throw new Error("Someone else just updated this step. Reload and try again.");
        const lotCode = options.lotCode?.trim() || `${order.orderNumber}-${createHash("sha256").update(requestKey).digest("hex").slice(0, 8).toUpperCase()}`;
        const report = await tx.manufacturingProductionReport.create({ data: { organisationId: session.organisationId, productionOrderId: order.id, workOrderId, requestKey, fingerprint, goodQuantity: good.baseQuantity, scrapQuantity: scrap.baseQuantity, enteredUnit: good.enteredUnit, enteredGoodQuantity: good.enteredQuantity, enteredScrapQuantity: scrap.enteredQuantity, final: finish, lotCode, serials: options.serials ?? [], shortCloseReason: options.shortCloseReason?.trim() || null, actorUserId: session.userId } });
        const receipt = await backflushOnCompletion(session, { ...workOrder, producedQuantity: produced, scrapQuantity: scrapped }, good.quantity, scrap.quantity, requestKey, tx, { reportId: report.id, lotCode, serials: options.serials ?? [], finish, remainingBefore: addQuantity(inputQuantity, -Number(workOrder.producedQuantity), -Number(workOrder.scrapQuantity)) });
        if (finish && !receipt) {
          const next = await tx.manufacturingWorkOrder.findFirst({ where: { organisationId: session.organisationId, productionOrderId: order.id, sequence: { gt: workOrder.sequence } }, orderBy: { sequence: "asc" } });
          if (next?.status === "WAITING") {
            const advanced = await tx.manufacturingWorkOrder.updateMany({ where: { id: next.id, organisationId: session.organisationId, status: "WAITING", version: next.version }, data: { status: "READY", version: { increment: 1 } } });
            if (!advanced.count) throw new Error("The next operation changed. Reload before completing.");
            await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.work_order.ready", entityType: "ManufacturingWorkOrder", entityId: next.id, after: { precedingWorkOrderId: workOrder.id } }, tx);
          }
        }
        await tx.manufacturingOrder.updateMany({ where: { id: order.id, organisationId: session.organisationId }, data: receipt && finish ? { status: "COMPLETE", actualFinish: new Date() } : { status: "RUNNING", actualStart: order.actualStart ?? new Date() } });
        if (finish && receipt && options.createBackorder) {
          assertCapability(session,C.orderCreate);
          const shortfall=addQuantity(Number(order.quantity),-produced);
          if(shortfall>0){
            const backorder=await tx.manufacturingOrder.create({data:{organisationId:session.organisationId,orderNumber:await nextOrderNumber(tx,session.organisationId),originOrderId:order.id,productId:order.productId,definitionId:order.definitionId,quantity:shortfall,unitOfMeasure:order.unitOfMeasure,warehouseId:order.warehouseId,requiredDate:order.requiredDate,sourceSalesOrderLineId:order.sourceSalesOrderLineId,createdByUserId:session.userId,notes:`Replacement production for ${order.orderNumber}. ${options.shortCloseReason??"Reported production losses"}`}});
            await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:"manufacturing.backorder.created",entityType:"ManufacturingOrder",entityId:backorder.id,after:{originOrderId:order.id,reportId:report.id,quantity:shortfall}},tx);
          }
        }
        await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: finish ? "manufacturing.work_order.completed" : "manufacturing.output.reported", entityType: "ManufacturingWorkOrder", entityId: workOrderId, after: { goodQuantity: good.baseQuantity, scrapQuantity: scrap.baseQuantity, requestKey, finish, lotCode, shortCloseReason: options.shortCloseReason ?? null } }, tx);
        if (finish && workOrder.machineLoadId && !await tx.manufacturingWorkOrder.count({ where: { organisationId: session.organisationId, machineLoadId: workOrder.machineLoadId, status: { not: "COMPLETE" } } })) await tx.manufacturingMachineLoad.updateMany({ where: { organisationId: session.organisationId, id: workOrder.machineLoadId, status: "RUNNING" }, data: { status: "COMPLETE", version: { increment: 1 } } });
        await writeActivity({ organisationId: session.organisationId, type: "manufacturing.output.reported", summary: `${workOrder.operationName} — ${good.quantity} good, ${scrap.quantity} scrap${finish ? "; finished" : "; work continues"}`, entityType: "ManufacturingWorkOrder", entityId: workOrder.id }, tx);
        return receipt;
      }, { isolationLevel: "Serializable", timeout: 20000 });
      break;
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (attempt < 2 && ["P2034", "P2002"].includes(code)) continue;
      throw error;
    }
  }
  if (replenishment && !replenishment.staged) { const { stockReplenished } = await import("@/core/stock/replenishment"); await stockReplenished(session, replenishment); }
}
