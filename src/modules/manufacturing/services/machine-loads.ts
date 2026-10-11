"use server";
import { validateMachineLoadCost } from "@/core/finance/manufacturing";
import { addQuantity } from "@/core/shared/quantity";
import { measuredQuantity, componentQuantity } from "@/core/shared/measurement";
import { createHash } from "node:crypto";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/core/audit/log";
import { getModule } from "@/core/modules/registry";
import { machineLoadPlan } from "../domain/machine-load";
import { finiteSchedule } from "../domain/finite-scheduling";
import { loadFiniteResources } from "./finite-data";

type LoadInput = { resourceId: string; workOrderIds: string[]; earliestStart: string };
async function plan(tx: Prisma.TransactionClient, organisationId: string, input: LoadInput) {
  const machine = await tx.manufacturingResource.findFirstOrThrow({ where: { organisationId, id: input.resourceId, active: true, workCentre: { active: true } } });
  const selected = await tx.manufacturingWorkOrder.findMany({ where: { organisationId, id: { in: input.workOrderIds } }, include: { productionOrder: { include: { product: { select: { name: true } }, workOrders: { orderBy: { sequence: "asc" } } } } }, orderBy: { id: "asc" } });
  if (selected.length !== input.workOrderIds.length) throw new Error("Choose operations in this company.");
  if (new Set(selected.map(row => row.productionOrderId)).size !== selected.length) throw new Error("Choose one operation from each production order for this load.");
  if (selected.some(row => row.machineLoadId || row.locked || !["READY", "WAITING"].includes(row.status) || !["RELEASED", "RUNNING"].includes(row.productionOrder.status) || Number(row.producedQuantity) || Number(row.scrapQuantity) || row.workCentreId !== machine.workCentreId)) throw new Error("Choose unstarted, unlocked batch operations in this machine’s work centre.");
  await validateMachineLoadCost(organisationId,tx,selected.map(row=>({...row,warehouseId:row.productionOrder.warehouseId,definitionId:row.productionOrder.definitionId})));
  const load = machineLoadPlan({ ...machine, loadCapacity: machine.loadCapacity === null ? null : Number(machine.loadCapacity) }, selected.map(row => ({ ...row, quantity: Number(row.productionOrder.workOrders.filter(w=>w.sequence<row.sequence).at(-1)?.status==="COMPLETE"?row.productionOrder.workOrders.filter(w=>w.sequence<row.sequence).at(-1)!.producedQuantity:row.productionOrder.quantity), loadPerUnit: row.loadPerUnit === null ? null : Number(row.loadPerUnit), cycleMinutes: Number(row.cycleMinutes ?? 0), coolingMinutes: Number(row.coolingMinutes ?? 0) })));
  const earliest = new Date(input.earliestStart);
  if (!Number.isFinite(earliest.getTime()) || earliest < new Date(Date.now() - 60_000)) throw new Error("Choose a valid start from now onwards.");
  for (const row of selected) {
    const previous = row.productionOrder.workOrders.filter(w => w.sequence < row.sequence).at(-1);
    const priorEnd = previous?.actualEnd ?? previous?.scheduledEnd;
    if (priorEnd) earliest.setTime(Math.max(earliest.getTime(), priorEnd.getTime() + (previous?.waitMinutes ?? 0) * 60_000));
  }
  const affected = selected.flatMap(row => row.productionOrder.workOrders.filter(w => w.sequence >= row.sequence));
  if (affected.some(row => row.machineLoadId || row.locked || ["RUNNING", "PAUSED", "COMPLETE"].includes(row.status))) throw new Error("A later operation is fixed or in another machine load. Review it before combining this work.");
  const resources = await loadFiniteResources(tx, organisationId, affected.map(row => row.id));
  const [slot] = finiteSchedule([{ id: "mixed-load", name: "Mixed machine load", durationMinutes: load.durationMinutes, waitMinutes: 0, timingMode: "BATCH", workCentreId: machine.workCentreId, resourceId: machine.id, eligibleResourceIds: [machine.id] }], earliest, resources);
  resources.find(row => row.id === machine.id)!.bookings.push({ id: "mixed-load", start: slot.start, end: slot.end });
  const downstream: Array<{ id: string; version: number; resourceId: string | null; workCentreId: string | null; start: Date; end: Date }> = [];
  for (const member of selected) {
    let cursor = new Date(slot.end.getTime() + member.waitMinutes * 60_000);
    for (const row of member.productionOrder.workOrders.filter(w => w.sequence > member.sequence)) {
      const [next] = finiteSchedule([{ id: row.id, name: row.operationName, durationMinutes: row.plannedMinutes, waitMinutes: row.waitMinutes, timingMode: row.timingMode, workCentreId: row.workCentreId, resourceId: row.resourceId, eligibleResourceIds: row.eligibleResourceIds.length ? row.eligibleResourceIds : row.resourceId ? [row.resourceId] : [] }], cursor, resources);
      downstream.push({ id: row.id, version: row.version, resourceId: next.resourceId, workCentreId: next.workCentreId, start: next.start, end: next.end });
      resources.find(r => r.id === next.resourceId)?.bookings.push({ id: row.id, start: next.start, end: next.end });
      cursor = new Date(next.end.getTime() + row.waitMinutes * 60_000);
    }
  }
  const fingerprint = createHash("sha256").update(JSON.stringify({ input, machine, selected, resources, slot, downstream, load }, (_, value) => typeof value === "bigint" ? value.toString() : value)).digest("hex");
  return { selected, slot, downstream, load, fingerprint };
}
export async function previewMachineLoad(input: LoadInput) {
  const session = await requireSession();
  assertCapability(session, C.scheduleManage);
  await assertModuleEnabled(session, "manufacturing");
  return db.$transaction(async tx => {
    const result = await plan(tx, session.organisationId, input);
    return { fingerprint: result.fingerprint, start: result.slot.start.toISOString(), end: result.slot.end.toISOString(), capacity: result.load.capacity, occupiedCapacity: result.load.occupiedCapacity, unit: result.load.unit, profile: result.load.profile, orders: result.selected.map(row => ({ id: row.id, orderNumber: row.productionOrder.orderNumber, product: row.productionOrder.product.name })), downstream: result.downstream.map(row => ({ ...row, start: row.start.toISOString(), end: row.end.toISOString() })) };
  }, { isolationLevel: "RepeatableRead", timeout: 20000 });
}
export async function createMachineLoad(input: LoadInput, fingerprint: string) {
  const session = await requireSession();
  assertCapability(session, C.scheduleManage);
  await assertModuleEnabled(session, "manufacturing");
  return db.$transaction(async tx => {
    const result = await plan(tx, session.organisationId, input);
    if (result.fingerprint !== fingerprint) throw new Error("The recipes, machine or schedule changed. Preview this load again.");
    const load = await tx.manufacturingMachineLoad.create({ data: { organisationId: session.organisationId, resourceId: input.resourceId, reference: `LOAD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, processProfile: result.load.profile, capacity: result.load.capacity, occupiedCapacity: result.load.occupiedCapacity, unitOfMeasure: result.load.unit, startsAt: result.slot.start, endsAt: result.slot.end, actorUserId: session.userId } });
    for (const row of result.selected) {
      const changed = await tx.manufacturingWorkOrder.updateMany({ where: { organisationId: session.organisationId, id: row.id, version: row.version, machineLoadId: null, locked: false, status: { in: ["READY", "WAITING"] } }, data: { machineLoadId: load.id, resourceId: input.resourceId, scheduledStart: load.startsAt, scheduledEnd: load.endsAt, plannedMinutes: Math.ceil(result.load.durationMinutes), version: { increment: 1 } } });
      if (!changed.count) throw new Error("An operation changed. Preview the load again.");
    }
    for (const row of result.downstream) await tx.manufacturingWorkOrder.update({ where: { id: row.id, organisationId: session.organisationId, version: row.version }, data: { resourceId: row.resourceId, workCentreId: row.workCentreId, scheduledStart: row.start, scheduledEnd: row.end, version: { increment: 1 } } });
    for (const row of result.selected) {
      const end = result.downstream.filter(next => row.productionOrder.workOrders.some(w => w.id === next.id)).at(-1)?.end ?? load.endsAt;
      await tx.manufacturingOrder.update({ where: { id: row.productionOrderId, organisationId: session.organisationId, version: row.productionOrder.version }, data: { plannedFinish: end, ...(row.sequence === row.productionOrder.workOrders[0]?.sequence ? { plannedStart: load.startsAt } : {}), version: { increment: 1 } } });
    }
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.machine_load.created", entityType: "ManufacturingMachineLoad", entityId: load.id, after: { workOrderIds: result.selected.map(row => row.id), ...result.load, start: load.startsAt, end: load.endsAt, fingerprint } }, tx);
    return { id: load.id };
  }, { isolationLevel: "Serializable", timeout: 20000 });
}
export async function startMachineLoad(loadId: string) {
  const session = await requireSession();
  assertCapability(session, C.workOrderExecute);
  await assertModuleEnabled(session, "manufacturing");
  const header = await db.manufacturingMachineLoad.findFirstOrThrow({ where: { organisationId: session.organisationId, id: loadId } });
  const safety = await getModule("safety")?.safetyProvider?.resourceStatus(session.organisationId, header.resourceId);
  if (safety && !safety.available) throw new Error(safety.reason ?? "Safety hold: this machine cannot start.");
  await db.$transaction(async tx => {
    const load = await tx.manufacturingMachineLoad.findFirstOrThrow({ where: { organisationId: session.organisationId, id: loadId }, include: { workOrders: { include: { productionOrder: true } }, resource: { include: { workCentre: true } } } });
    if (load.status === "RUNNING") return;
    if (load.status !== "PLANNED" || !load.resource.active || !load.resource.workCentre.active) throw new Error("This load cannot start. Review its status and machine.");
    const now = new Date();
    if (load.startsAt > now) throw new Error("This machine load is booked for later.");
    if (await tx.manufacturingDowntime.count({ where: { organisationId: session.organisationId, resourceId: load.resourceId, active: true, startsAt: { lte: now }, endsAt: { gt: now } } })) throw new Error("This machine is in a downtime window.");
    if (await tx.manufacturingWorkOrder.count({ where: { organisationId: session.organisationId, resourceId: load.resourceId, status: { in: ["RUNNING", "PAUSED"] }, OR: [{ machineLoadId: null }, { machineLoadId: { not: load.id } }] } })) throw new Error("Another load or operation is using this machine.");
    let occupiedCapacity=0;
    for (const w of load.workOrders) {
      if (!["READY", "WAITING"].includes(w.status) || !["RELEASED", "RUNNING"].includes(w.productionOrder.status)) throw new Error("Every order in this load must be released and ready for this step.");
      const previous = await tx.manufacturingWorkOrder.findFirst({ where: { organisationId: session.organisationId, productionOrderId: w.productionOrderId, sequence: { lt: w.sequence } }, orderBy: { sequence: "desc" } });
      if (previous && (previous.status !== "COMPLETE" || !previous.actualEnd || previous.actualEnd.getTime() + previous.waitMinutes * 60000 > now.getTime())) throw new Error("Every member must finish its previous operation and transfer time before this load starts.");
      const loadedQuantity=Number(previous?previous.producedQuantity:w.productionOrder.quantity);
      if(loadedQuantity<=0)throw new Error("An operation has no good input left to load. Close its losses separately before planning this machine load.");
      occupiedCapacity=addQuantity(occupiedCapacity,measuredQuantity(componentQuantity(loadedQuantity,Number(w.loadPerUnit),0),w.loadUnit!,load.unitOfMeasure).quantity);
      await tx.manufacturingWorkOrder.update({ where: { id: w.id, organisationId: session.organisationId, version: w.version }, data: { loadedQuantity,status: "RUNNING", actualStart: now, version: { increment: 1 } } });
      await tx.manufacturingOrder.update({ where: { id: w.productionOrderId, organisationId: session.organisationId, version: w.productionOrder.version }, data: { status: "RUNNING", actualStart: w.productionOrder.actualStart ?? now, version: { increment: 1 } } });
    }
    await tx.manufacturingMachineLoad.update({ where: { id: load.id, organisationId: session.organisationId, version: load.version }, data: { status: "RUNNING", occupiedCapacity, version: { increment: 1 } } });
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.machine_load.started", entityType: "ManufacturingMachineLoad", entityId: load.id, after: { workOrderIds: load.workOrders.map(w => w.id) } }, tx);
  }, { isolationLevel: "Serializable" });
}
export async function cancelMachineLoad(loadId: string) {
  const session = await requireSession();
  assertCapability(session, C.scheduleManage);
  await assertModuleEnabled(session, "manufacturing");
  await db.$transaction(async tx => {
    const load = await tx.manufacturingMachineLoad.findFirstOrThrow({ where: { organisationId: session.organisationId, id: loadId }, include: { workOrders: true } });
    if (load.status !== "PLANNED") throw new Error("Only an unstarted load can be cancelled.");
    if (load.workOrders.some(w => !["WAITING", "READY"].includes(w.status))) throw new Error("A member has started. Keep its machine load history.");
    await tx.manufacturingWorkOrder.updateMany({ where: { organisationId: session.organisationId, machineLoadId: load.id }, data: { machineLoadId: null, version: { increment: 1 } } });
    // Retain each member's original full duration and re-plan it before execution.
    for (const w of load.workOrders) await tx.manufacturingWorkOrder.update({ where: { id: w.id, organisationId: session.organisationId }, data: { scheduledStart: null, scheduledEnd: null, plannedMinutes: w.setupMinutes + w.runMinutes } });
    for(const member of load.workOrders){
      await tx.manufacturingWorkOrder.updateMany({where:{organisationId:session.organisationId,productionOrderId:member.productionOrderId,sequence:{gt:member.sequence},status:{in:["WAITING","READY"]},locked:false,machineLoadId:null},data:{scheduledStart:null,scheduledEnd:null,version:{increment:1}}});
      await tx.manufacturingOrder.updateMany({where:{id:member.productionOrderId,organisationId:session.organisationId},data:{plannedFinish:null,version:{increment:1}}});
    }
    await tx.manufacturingMachineLoad.update({ where: { id: load.id, organisationId: session.organisationId, version: load.version }, data: { status: "CANCELLED", version: { increment: 1 } } });
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.machine_load.cancelled", entityType: "ManufacturingMachineLoad", entityId: load.id, after: { requiresRescheduling: true } }, tx);
  }, { isolationLevel: "Serializable" });
}
