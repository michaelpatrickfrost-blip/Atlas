"use server";
import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertModuleEnabled } from "@/core/modules/access";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { finiteSchedule, type FiniteSlot } from "../domain/finite-scheduling";
import { loadFiniteResources } from "./finite-data";

export type ScheduleImpact = {
  conflicts: { bookingId: string; label: string }[];
  suggestedStart: Date | null;
  proposedStart: Date;
  proposedEnd: Date;
  previewKey: string;
  cascade: { workOrderId: string; operationName: string; resourceName: string | null; start: Date; end: Date }[];
  missesRequiredDate: boolean;
  requiredDate: Date | null;
  newFinish: Date | null;
  customer: string | null;
  salesOrderReference: string | null;
};

async function planMove(tx: Prisma.TransactionClient, organisationId: string, workOrderId: string, newStart: Date, resourceId: string | null, workCentreId: string | null, canSeeSales: boolean) {
  if (!Number.isFinite(newStart.getTime())) throw new Error("Enter a valid start date.");
  const work = await tx.manufacturingWorkOrder.findFirst({ where: { id: workOrderId, organisationId }, include: { productionOrder: { include: { sourceSalesOrderLine: { include: { order: { select: { reference: true, party: { select: { name: true } } } } } } } } } });
  if (!work) throw new Error("This work order no longer exists.");
  if (work.locked) throw new Error("This step is locked. Unlock it first to reschedule.");
  if (["RUNNING", "PAUSED", "COMPLETE"].includes(work.status)) throw new Error("Work already in progress or finished cannot be rescheduled.");
  const all = await tx.manufacturingWorkOrder.findMany({ where: { organisationId, productionOrderId: work.productionOrderId }, orderBy: { sequence: "asc" } });
  const prior = all.filter((w) => w.sequence < work.sequence).at(-1);
  const priorEnd = prior?.actualEnd ?? prior?.scheduledEnd;
  if (priorEnd && newStart.getTime() < priorEnd.getTime() + (prior?.waitMinutes ?? 0) * 60_000) throw new Error("This start precedes the previous operation or its transfer/wait time.");
  const affected = all.filter((w) => w.sequence >= work.sequence);
  const movable = affected.filter((w) => !w.locked && !["RUNNING", "PAUSED", "COMPLETE"].includes(w.status));
  const resources = await loadFiniteResources(tx, organisationId, movable.map((w) => w.id));
  const eligible = work.eligibleResourceIds.length ? work.eligibleResourceIds : work.resourceId ? [work.resourceId] : resources.filter((r) => r.workCentreId === work.workCentreId).map((r) => r.id);
  if (resourceId && (!eligible.includes(resourceId) || !resources.some((r) => r.id === resourceId && r.workCentreId === workCentreId))) throw new Error("This machine is not eligible for this product operation. Review the product routing.");
  if (!resourceId && (work.resourceId || workCentreId !== work.workCentreId)) throw new Error("Keep an eligible machine and the routing's work centre.");
  const slots: FiniteSlot[] = [];
  let cursor = new Date(newStart);
  for (const row of affected) {
    if (row.locked || ["RUNNING", "PAUSED", "COMPLETE"].includes(row.status)) {
      if (!row.scheduledStart || !row.scheduledEnd || row.scheduledStart < cursor) throw new Error(`${row.operationName} is locked, running, paused or complete and would be displaced. Review the fixed operation first.`);
      cursor = new Date((row.actualEnd ?? row.scheduledEnd).getTime() + row.waitMinutes * 60_000);
      continue;
    }
    const isFirst = row.id === work.id;
    const duration = row.plannedMinutes || (row.scheduledStart && row.scheduledEnd ? (row.scheduledEnd.getTime() - row.scheduledStart.getTime()) / 60_000 : 60);
    const allowed = row.eligibleResourceIds.length ? row.eligibleResourceIds : row.resourceId ? [row.resourceId] : [];
    const [slot] = finiteSchedule([{ id: row.id, name: row.operationName, durationMinutes: duration, waitMinutes: row.waitMinutes, timingMode: row.timingMode, resourceId: isFirst ? resourceId : row.resourceId, workCentreId: isFirst ? workCentreId : row.workCentreId, eligibleResourceIds: isFirst && resourceId ? [resourceId] : allowed }], cursor, resources);
    slots.push(slot);
    const resource = resources.find((r) => r.id === slot.resourceId);
    resource?.bookings.push({ id: row.id, start: slot.start, end: slot.end });
    cursor = new Date(slot.end.getTime() + row.waitMinutes * 60_000);
  }
  const first = slots[0];
  const finish = affected.at(-1)?.id === slots.at(-1)?.id ? slots.at(-1)!.end : affected.at(-1)!.actualEnd ?? affected.at(-1)!.scheduledEnd;
  const previewKey = createHash("sha256").update(JSON.stringify({ newStart, resourceId, workCentreId, workVersion: work.productionOrder.version, rows: all, resources, slots })).digest("hex");
  const impact: ScheduleImpact = { conflicts: [], suggestedStart: first.start.getTime() !== newStart.getTime() ? first.start : null, proposedStart: first.start, proposedEnd: first.end, previewKey,
    cascade: slots.slice(1).map((s) => ({ workOrderId: s.id, operationName: s.name, resourceName: resources.find(r=>r.id===s.resourceId)?.name??null, start: s.start, end: s.end })), requiredDate: work.productionOrder.requiredDate, newFinish: finish ?? null, missesRequiredDate: Boolean(work.productionOrder.requiredDate && finish && finish > work.productionOrder.requiredDate),
    customer: canSeeSales ? work.productionOrder.sourceSalesOrderLine?.order.party.name ?? null : null, salesOrderReference: canSeeSales ? work.productionOrder.sourceSalesOrderLine?.order.reference ?? null : null };
  return { impact, slots, work, all };
}

export async function schedulePreview(workOrderId: string, newStart: Date, resourceId: string | null, workCentreId: string | null): Promise<ScheduleImpact> {
  const session = await requireSession();
  assertCapability(session, C.scheduleManage);
  await assertModuleEnabled(session, "manufacturing");
  return db.$transaction(async (tx) => (await planMove(tx, session.organisationId, workOrderId, newStart, resourceId, workCentreId, session.capabilities.has("sales.order.read") && session.capabilities.has("customers.read"))).impact, { isolationLevel: "RepeatableRead", timeout: 20000 });
}

/** Re-read all calendars/bookings within the serializable write transaction.
 * The reviewed fingerprint must still match; overlaps cannot be forced. */
export async function rescheduleWorkOrder(workOrderId: string, newStart: Date, resourceId: string | null, workCentreId: string | null, force = false, previewKey?: string) {
  const session = await requireSession();
  assertCapability(session, C.scheduleManage);
  await assertModuleEnabled(session, "manufacturing");
  if (force) throw new Error("Finite machine bookings cannot be overridden. Review the feasible slot.");
  if (!previewKey) throw new Error("Preview this move before confirming it.");
  await db.$transaction(async (tx) => {
    const plan = await planMove(tx, session.organisationId, workOrderId, newStart, resourceId, workCentreId, session.capabilities.has("sales.order.read") && session.capabilities.has("customers.read"));
    if (plan.impact.previewKey !== previewKey) throw new Error("The order, calendar or bookings changed since preview. Review a fresh preview before confirming.");
    for (const slot of plan.slots) {
      const row = plan.all.find((w) => w.id === slot.id)!;
      const updated = await tx.manufacturingWorkOrder.updateMany({ where: { id: row.id, organisationId: session.organisationId, version: row.version, locked: false, status: { notIn: ["RUNNING", "PAUSED", "COMPLETE"] } }, data: { scheduledStart: slot.start, scheduledEnd: slot.end, resourceId: slot.resourceId, workCentreId: slot.workCentreId, version: { increment: 1 } } });
      if (!updated.count) throw new Error("A following step changed. Reload and preview again.");
    }
    const earliest = plan.all.filter((w) => w.sequence < plan.work.sequence).map((w) => w.scheduledStart).find(Boolean) ?? plan.slots[0].start;
    const parent = await tx.manufacturingOrder.updateMany({ where: { id: plan.work.productionOrderId, organisationId: session.organisationId, version: plan.work.productionOrder.version }, data: { plannedStart: earliest, plannedFinish: plan.impact.newFinish, version: { increment: 1 } } });
    if (!parent.count) throw new Error("The production order changed. Reload and preview again.");
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.schedule.moved", entityType: "ManufacturingWorkOrder", entityId: workOrderId, after: { requestedStart: newStart, scheduledStart: plan.impact.proposedStart, resourceId, workCentreId, cascadedCount: plan.slots.length - 1, previewKey } }, tx);
    await writeActivity({ organisationId: session.organisationId, type: "manufacturing.order.rescheduled", summary: `${plan.work.productionOrder.orderNumber} — ${plan.work.operationName} rescheduled with finite calendars`, entityType: "ManufacturingOrder", entityId: plan.work.productionOrderId }, tx);
  }, { isolationLevel: "Serializable", timeout: 20000 });
}

export async function setWorkOrderLock(workOrderId: string, locked: boolean) {
  const session = await requireSession();
  assertCapability(session, C.scheduleLock);
  await assertModuleEnabled(session, "manufacturing");
  await db.$transaction(async (tx) => {
    const updated = await tx.manufacturingWorkOrder.updateMany({ where: { id: workOrderId, organisationId: session.organisationId }, data: { locked, version: { increment: 1 } } });
    if (!updated.count) throw new Error("This work order no longer exists.");
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: locked ? "manufacturing.schedule.locked" : "manufacturing.schedule.unlocked", entityType: "ManufacturingWorkOrder", entityId: workOrderId, after: { locked } }, tx);
  });
}
