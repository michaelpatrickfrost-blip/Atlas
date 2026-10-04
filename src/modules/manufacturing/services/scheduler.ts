"use server";

import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { findConflicts, nextFeasibleSlot, cascadeFrom, type Booking } from "../domain/scheduling";

/** The production planner's tool (§50-56): move a work order to a new start time
 * and/or a different resource/work centre. Gated behind `manufacturing.schedule.manage`
 * — a shop-floor operator or plain viewer (`manufacturing.schedule.read`) never
 * reaches this; they only ever see the resulting published schedule. */

async function workOrderWithOrder(organisationId: string, workOrderId: string) {
  const workOrder = await db.manufacturingWorkOrder.findFirst({
    where: { id: workOrderId, organisationId },
    include: { productionOrder: { select: { id: true, orderNumber: true, requiredDate: true, quantity: true, sourceSalesOrderLine: { include: { order: { select: { reference: true, party: { select: { name: true } } } } } } } } },
  });
  if (!workOrder) throw new Error("This work order no longer exists.");
  return workOrder;
}

async function laterOperations(organisationId: string, productionOrderId: string, afterSequence: number) {
  return db.manufacturingWorkOrder.findMany({
    where: { organisationId, productionOrderId, sequence: { gt: afterSequence }, status: { notIn: ["RUNNING", "COMPLETE"] } },
    orderBy: { sequence: "asc" },
  });
}

async function resourceBookings(organisationId: string, resourceId: string | null, workCentreId: string | null): Promise<Booking[]> {
  if (!resourceId && !workCentreId) return [];
  const rows = await db.manufacturingWorkOrder.findMany({
    where: {
      organisationId,
      status: { notIn: ["COMPLETE"] },
      scheduledStart: { not: null },
      scheduledEnd: { not: null },
      ...(resourceId ? { resourceId } : { workCentreId, resourceId: null }),
    },
    select: { id: true, scheduledStart: true, scheduledEnd: true },
  });
  return rows.map((r) => ({ id: r.id, start: r.scheduledStart!, end: r.scheduledEnd! }));
}

export type ScheduleImpact = {
  conflicts: { bookingId: string; label: string }[];
  suggestedStart: Date | null;
  cascade: { workOrderId: string; operationName: string; start: Date; end: Date }[];
  missesRequiredDate: boolean;
  requiredDate: Date | null;
  newFinish: Date | null;
  customer: string | null;
  salesOrderReference: string | null;
};

/** Dry run — computes what WOULD happen, writes nothing. The planner reviews
 * this before confirming (§52: "show consequence before committing"). */
export async function schedulePreview(workOrderId: string, newStart: Date, resourceId: string | null, workCentreId: string | null): Promise<ScheduleImpact> {
  const session = await requireSession();
  assertCapability(session, C.scheduleManage);
  const workOrder = await workOrderWithOrder(session.organisationId, workOrderId);
  if (workOrder.locked) throw new Error("This step is locked. Unlock it first to reschedule.");
  if (workOrder.status === "RUNNING" || workOrder.status === "COMPLETE") throw new Error("Work already in progress or finished cannot be rescheduled.");

  const durationMinutes = workOrder.scheduledStart && workOrder.scheduledEnd ? (workOrder.scheduledEnd.getTime() - workOrder.scheduledStart.getTime()) / 60_000 : 60;
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60_000);

  const bookings = await resourceBookings(session.organisationId, resourceId, resourceId ? null : workCentreId);
  const conflicts = findConflicts({ start: newStart, end: newEnd }, bookings, workOrder.id);
  const suggestedStart = conflicts.length ? nextFeasibleSlot(durationMinutes, newStart, bookings, workOrder.id) : null;

  const following = await laterOperations(session.organisationId, workOrder.productionOrderId, workOrder.sequence);
  const cascaded = cascadeFrom(newEnd, following.map((op) => ({ id: op.id, durationMinutes: op.scheduledStart && op.scheduledEnd ? (op.scheduledEnd.getTime() - op.scheduledStart.getTime()) / 60_000 : 60 })));
  const cascadeDetail = cascaded.map((c, i) => ({ workOrderId: c.id, operationName: following[i].operationName, start: c.start, end: c.end }));

  const newFinish = cascadeDetail.length ? cascadeDetail[cascadeDetail.length - 1].end : newEnd;
  const requiredDate = workOrder.productionOrder.requiredDate;

  return {
    conflicts: conflicts.map((c) => ({ bookingId: c.id, label: "Overlaps another booking on this resource" })),
    suggestedStart,
    cascade: cascadeDetail,
    missesRequiredDate: Boolean(requiredDate && newFinish > requiredDate),
    requiredDate,
    newFinish,
    customer: workOrder.productionOrder.sourceSalesOrderLine?.order.party.name ?? null,
    salesOrderReference: workOrder.productionOrder.sourceSalesOrderLine?.order.reference ?? null,
  };
}

/** Commits a move the planner has already previewed. Refuses silently-overbooking
 * a resource (§47) unless `force` is passed — the UI only offers `force` after
 * showing the conflict and the suggested alternative slot. */
export async function rescheduleWorkOrder(workOrderId: string, newStart: Date, resourceId: string | null, workCentreId: string | null, force = false) {
  const session = await requireSession();
  assertCapability(session, C.scheduleManage);
  const workOrder = await workOrderWithOrder(session.organisationId, workOrderId);
  if (workOrder.locked) throw new Error("This step is locked. Unlock it first to reschedule.");
  if (workOrder.status === "RUNNING" || workOrder.status === "COMPLETE") throw new Error("Work already in progress or finished cannot be rescheduled.");

  const durationMinutes = workOrder.scheduledStart && workOrder.scheduledEnd ? (workOrder.scheduledEnd.getTime() - workOrder.scheduledStart.getTime()) / 60_000 : 60;
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60_000);

  const bookings = await resourceBookings(session.organisationId, resourceId, resourceId ? null : workCentreId);
  const conflicts = findConflicts({ start: newStart, end: newEnd }, bookings, workOrder.id);
  if (conflicts.length && !force) throw new Error("This slot overlaps work already booked on that resource. Choose the suggested slot or force an override.");

  const following = await laterOperations(session.organisationId, workOrder.productionOrderId, workOrder.sequence);
  const cascaded = cascadeFrom(newEnd, following.map((op) => ({ id: op.id, durationMinutes: op.scheduledStart && op.scheduledEnd ? (op.scheduledEnd.getTime() - op.scheduledStart.getTime()) / 60_000 : 60 })));

  await db.$transaction(async (tx) => {
    const updated = await tx.manufacturingWorkOrder.updateMany({
      where: { id: workOrder.id, organisationId: session.organisationId, version: workOrder.version },
      data: { scheduledStart: newStart, scheduledEnd: newEnd, resourceId, workCentreId, version: { increment: 1 } },
    });
    if (!updated.count) throw new Error("Someone else just updated this step. Reload and try again.");
    for (const c of cascaded) {
      await tx.manufacturingWorkOrder.update({ where: { id: c.id }, data: { scheduledStart: c.start, scheduledEnd: c.end } });
    }
    const newFinish = cascaded.length ? cascaded[cascaded.length - 1].end : newEnd;
    await tx.manufacturingOrder.update({ where: { id: workOrder.productionOrderId }, data: { plannedFinish: newFinish } });
  });

  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.schedule.moved", entityType: "ManufacturingWorkOrder", entityId: workOrder.id, after: { newStart, resourceId, workCentreId, forced: force, cascadedCount: cascaded.length } });
  await writeActivity({ organisationId: session.organisationId, type: "manufacturing.order.rescheduled", summary: `${workOrder.productionOrder.orderNumber} — ${workOrder.operationName} moved${cascaded.length ? ` (${cascaded.length} later step${cascaded.length === 1 ? "" : "s"} shifted)` : ""}`, entityType: "ManufacturingOrder", entityId: workOrder.productionOrderId });
}

/** §54: lock/unlock a work order's assignment against scheduler moves. */
export async function setWorkOrderLock(workOrderId: string, locked: boolean) {
  const session = await requireSession();
  assertCapability(session, C.scheduleLock);
  const updated = await db.manufacturingWorkOrder.updateMany({ where: { id: workOrderId, organisationId: session.organisationId }, data: { locked } });
  if (!updated.count) throw new Error("This work order no longer exists.");
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: locked ? "manufacturing.schedule.locked" : "manufacturing.schedule.unlocked", entityType: "ManufacturingWorkOrder", entityId: workOrderId, after: { locked } });
}
