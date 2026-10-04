import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { PICK_EXCEPTIONS, quantityDecision, replenishmentNeed, sequenceStops, verifyScan } from "../domain/operations";
import { createShipment } from "./shipping";
import { milestone, nextReference, policyFor, stock } from "./numbers";

async function taskOrThrow(organisationId: string, taskId: string) {
  const task = await db.warehouseTask.findFirst({ where: { id: taskId, organisationId }, include: { lines: { orderBy: { sequence: "asc" } }, requirement: true } });
  if (!task) throw new Error("This work is no longer on the board.");
  return task;
}

export async function claimTask(session: Session, taskId: string) {
  const task = await taskOrThrow(session.organisationId, taskId);
  if (task.assigneeUserId && task.assigneeUserId !== session.userId) {
    const person = await db.user.findUnique({ where: { id: task.assigneeUserId }, select: { name: true } });
    const started = task.claimedAt?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    throw new Error(`${task.reference} is assigned to ${person?.name ?? "someone else"}${started ? `. Started ${started}` : ""}.`);
  }
  const claimed = await db.warehouseTask.updateMany({ where: { id: taskId, organisationId: session.organisationId, version: task.version, OR: [{ assigneeUserId: null }, { assigneeUserId: session.userId }] }, data: { assigneeUserId: session.userId, claimedAt: task.claimedAt ?? new Date(), startedAt: task.startedAt ?? new Date(), status: task.status === "READY" ? "IN_PROGRESS" : task.status, version: { increment: 1 } } });
  if (!claimed.count) throw new Error("Someone else just took this work. Reload and choose another.");
}

export async function scanTask(session: Session, taskId: string, lineId: string, barcode: string, requestKey: string) {
  if (!requestKey) throw new Error("This scan has no reference. Scan it again.");
  const prior = await db.logisticsOperation.findUnique({ where: { organisationId_requestKey: { organisationId: session.organisationId, requestKey } } });
  if (prior) return prior.result as { ok: boolean; message?: string; complete?: boolean };
  await claimTask(session, taskId);
  const task = await taskOrThrow(session.organisationId, taskId);
  const line = task.lines.find((item) => item.id === lineId) ?? task.lines.find((item) => item.status !== "DONE" && item.status !== "SHORT");
  if (!line) throw new Error("This pick is already complete.");
  const policy = await policyFor(session.organisationId);
  const phase = line.status === "OPEN" && line.locationCode ? "location" : "product";
  const expected = phase === "location" ? line.locationCode ?? "" : line.expectedBarcode || line.productCode;
  const checked = verifyScan({ phase, expected, scanned: barcode });
  if (!checked.ok) {
    await db.logisticsOperation.create({ data: { organisationId: session.organisationId, requestKey, action: "scan.reject", result: checked } });
    return checked;
  }
  if (phase === "location") {
    await db.warehouseTaskLine.update({ where: { id: line.id }, data: { status: "LOCATED" } });
    const result = { ok: true, message: "Scan product" };
    await db.logisticsOperation.create({ data: { organisationId: session.organisationId, requestKey, action: "scan.location", result } });
    return result;
  }
  const product = line.productId ? await db.product.findFirst({ where: { id: line.productId, organisationId: session.organisationId } }) : null;
  if (product?.trackingMode === "LOT" && !line.lotCode) throw new Error("Scan or enter the lot before confirming this product.");
  if (product?.trackingMode === "SERIAL" && line.serials.length < line.confirmedQuantity + 1) throw new Error("Scan the serial number for this unit.");
  if (product?.trackingMode === "LOT" && line.lotCode) {
    const lot = await db.stockLot.findFirst({ where: { organisationId: session.organisationId, productId: product.id, code: line.lotCode } });
    if (lot?.expiresOn && lot.expiresOn.getTime() < Date.now()) throw new Error("This lot is past its expiry date and cannot be shipped.");
  }
  const nextQuantity = line.confirmedQuantity + 1;
  const decision = quantityDecision({ required: line.requiredQuantity, scanned: nextQuantity, policy: policy.overPickPolicy === "WARNING" || policy.overPickPolicy === "ALLOWED" ? policy.overPickPolicy : "PROHIBITED" });
  if (!decision.allowed) throw new Error(decision.warning ?? "That quantity is not allowed.");
  const done = nextQuantity >= line.requiredQuantity;
  await db.warehouseTaskLine.update({ where: { id: line.id }, data: { confirmedQuantity: nextQuantity, status: done ? "DONE" : "LOCATED" } });
  const result = { ok: true, complete: done, message: done ? "Complete" : `${nextQuantity} / ${line.requiredQuantity}`, warning: "warning" in decision ? decision.warning : null };
  await db.logisticsOperation.create({ data: { organisationId: session.organisationId, requestKey, action: "scan.product", result } });
  return result;
}

export async function captureLot(session: Session, lineId: string, lotCode: string) {
  const line = await db.warehouseTaskLine.findFirst({ where: { id: lineId, organisationId: session.organisationId } });
  if (!line) throw new Error("This line is no longer on the task.");
  if (!lotCode.trim()) throw new Error("Enter the lot.");
  await db.warehouseTaskLine.update({ where: { id: line.id }, data: { lotCode: lotCode.trim() } });
}

export async function captureSerial(session: Session, lineId: string, serial: string) {
  const line = await db.warehouseTaskLine.findFirst({ where: { id: lineId, organisationId: session.organisationId } });
  if (!line) throw new Error("This line is no longer on the task.");
  if (!serial.trim()) throw new Error("Enter the serial number.");
  if (line.serials.includes(serial.trim())) throw new Error("That serial is already on this pick.");
  await db.warehouseTaskLine.update({ where: { id: line.id }, data: { serials: [...line.serials, serial.trim()] } });
}

export async function shortPick(session: Session, lineId: string, quantity: number, reason: string) {
  if (!PICK_EXCEPTIONS.includes(reason as typeof PICK_EXCEPTIONS[number]) && reason !== "Short pick") throw new Error("Choose an exception reason.");
  const line = await db.warehouseTaskLine.findFirst({ where: { id: lineId, organisationId: session.organisationId }, include: { task: { include: { requirement: true } } } });
  if (!line) throw new Error("This line is no longer on the task.");
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > line.requiredQuantity) throw new Error("Enter the quantity you actually picked.");
  await db.warehouseTaskLine.update({ where: { id: line.id }, data: { confirmedQuantity: quantity, status: quantity === 0 ? "EXCEPTION" : "SHORT", exceptionReason: reason } });
  if (line.productId && line.task.requirement?.warehouseId && reason === "Stock missing") {
    const provider = await stock();
    await provider.reportDiscrepancy(session, { requestKey: `discrepancy:${line.id}`, productId: line.productId, warehouseId: line.task.requirement.warehouseId, systemQuantity: line.requiredQuantity, reportedQuantity: quantity, sourceType: "PICK_LINE", sourceId: line.id });
  }
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.pick.exception", entityType: "WarehouseTask", entityId: line.taskId, summary: `${line.task.reference} exception · ${reason}`, event: "logisticsPickException", eventKey: `logistics.pick.exception:${line.id}`, payload: { lineId, reason, quantity } });
}

export async function completeTask(session: Session, taskId: string) {
  const task = await taskOrThrow(session.organisationId, taskId);
  if (task.lines.some((line) => line.status === "OPEN" || line.status === "LOCATED")) throw new Error(task.kind === "PACK" ? "Pack the remaining quantity onto a handling unit before completing this work." : "Finish or short every line before completing this work.");
  const policy = await policyFor(session.organisationId);
  if (task.kind === "PACK") {
    const { finishPack } = await import("./handling");
    await finishPack(session, taskId);
    return;
  }
  await db.warehouseTask.update({ where: { id: task.id }, data: { status: "COMPLETE", completedAt: new Date() } });
  if (task.kind === "PICK") {
    for (const line of task.lines) {
      if (!line.fulfilmentLineId) continue;
      await db.fulfilmentLine.update({ where: { id: line.fulfilmentLineId }, data: { pickedQuantity: { increment: line.confirmedQuantity } } });
    }
    if (task.requirementId) await db.fulfilmentRequirement.update({ where: { id: task.requirementId }, data: { status: policy.mode === "SIMPLE" ? "STAGED" : "PACKING" } });
    if (policy.mode !== "SIMPLE" && task.requirementId) await createFollowOn(session, task.requirementId, "PACK");
    if (policy.mode === "SIMPLE" && task.requirementId) await shipPicked(session, task.requirementId);
    await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.pick.completed", entityType: "WarehouseTask", entityId: task.id, summary: `${task.reference} picked`, partyId: task.requirement?.partyId, event: "logisticsPickCompleted", eventKey: `logistics.pick.completed:${task.id}`, payload: { taskId } });
  }
}

async function shipPicked(session: Session, requirementId: string) {
  const lines = await db.fulfilmentLine.findMany({ where: { organisationId: session.organisationId, requirementId } });
  const quantities = lines.map((line) => ({ fulfilmentLineId: line.id, quantity: line.pickedQuantity - line.shippedQuantity })).filter((line) => line.quantity > 0);
  if (quantities.length) await createShipment(session, requirementId, quantities);
}

async function createFollowOn(session: Session, requirementId: string, kind: "PACK" | "PUTAWAY") {
  const requirement = await db.fulfilmentRequirement.findFirst({ where: { id: requirementId, organisationId: session.organisationId }, include: { lines: true } });
  if (!requirement) return;
  const existing = await db.warehouseTask.findFirst({ where: { organisationId: session.organisationId, requirementId, kind, status: { not: "CANCELLED" } } });
  if (existing) return;
  await db.$transaction(async (tx) => {
    const reference = await nextReference(tx, session.organisationId, kind === "PACK" ? "PACK" : "PA", kind === "PACK" ? "PACK" : "PA");
    const task = await tx.warehouseTask.create({ data: { organisationId: session.organisationId, reference, kind, requirementId, status: "READY" } });
    for (const line of requirement.lines) {
      const quantity = kind === "PACK" ? line.pickedQuantity - line.packedQuantity : 0;
      if (quantity <= 0) continue;
      await tx.warehouseTaskLine.create({ data: { organisationId: session.organisationId, taskId: task.id, fulfilmentLineId: line.id, productId: line.productId, description: line.description, requiredQuantity: quantity, sequence: 10 } });
    }
  });
}

export async function groupWork(session: Session, requirementIds: string[], method: "BATCH" | "WAVE" | "CLUSTER" | "ZONE") {
  if (requirementIds.length < 2) throw new Error("Choose at least two orders.");
  const requirements = await db.fulfilmentRequirement.findMany({ where: { organisationId: session.organisationId, id: { in: requirementIds } }, include: { lines: true, party: true } });
  if (requirements.length !== requirementIds.length) throw new Error("One of those orders is no longer available.");
  if (requirements.some((row) => row.holdSummary)) throw new Error(`Blocked\n\n${requirements.find((row) => row.holdSummary)?.holdSummary}`);
  const provider = await stock();
  const warehouseId = requirements[0]?.warehouseId;
  const locations = warehouseId ? await provider.getLocations(session, warehouseId) : [];
  const taskId = await db.$transaction(async (tx) => {
    const wave = await tx.logisticsWave.create({ data: { organisationId: session.organisationId, reference: await nextReference(tx, session.organisationId, "WV", method === "WAVE" ? "W" : "B"), method, status: "RELEASED" } });
    const task = await tx.warehouseTask.create({ data: { organisationId: session.organisationId, reference: await nextReference(tx, session.organisationId, "PK", "PK"), kind: "PICK", method, waveId: wave.id, status: "READY" } });
    const products = await tx.product.findMany({ where: { organisationId: session.organisationId, id: { in: requirements.flatMap((row) => row.lines.map((line) => line.productId).filter((id): id is string => Boolean(id))) } } });
    let slot = 0;
    const combined = new Map<string, { productId: string | null; description: string; code: string; barcode: string; quantity: number; fulfilmentLineId: string; slot: string | null; zone: string | null }>();
    for (const requirement of requirements) {
      slot += 1;
      await tx.fulfilmentRequirement.update({ where: { id: requirement.id }, data: { status: "RELEASED", releasedAt: requirement.releasedAt ?? new Date() } });
      for (const line of requirement.lines) {
        const quantity = line.allocatedQuantity - line.pickedQuantity;
        if (quantity <= 0) continue;
        const product = products.find((item) => item.id === line.productId);
        const zone = method === "ZONE" ? (slot % 2 === 0 ? "B" : "A") : null;
        combined.set(line.id, { productId: line.productId, description: line.description, code: product?.code ?? "", barcode: product?.barcode || product?.code || "", quantity, fulfilmentLineId: line.id, slot: method === "CLUSTER" ? `Bin ${String.fromCharCode(64 + Math.min(slot, 26))}` : null, zone });
      }
    }
    const ordered = sequenceStops([...combined.values()].map((row, index) => {
      const location = locations[index % Math.max(locations.length, 1)];
      return { ...row, productCode: row.code, sequence: location?.sequence ?? (index + 1) * 10, code: location?.code ?? "STOCK" };
    }));
    for (const row of ordered) {
      await tx.warehouseTaskLine.create({ data: { organisationId: session.organisationId, taskId: task.id, fulfilmentLineId: row.fulfilmentLineId, productId: row.productId, description: row.description, productCode: row.productCode, expectedBarcode: row.barcode, locationCode: row.code, requiredQuantity: row.quantity, sequence: row.sequence, clusterSlot: row.slot, zoneCode: row.zone } });
    }
    return task.id;
  });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.pick.created", entityType: "WarehouseTask", entityId: taskId, summary: `${method.toLowerCase()} pick created for ${requirements.length} orders`, event: "logisticsPickCreated", eventKey: `logistics.pick.created:${taskId}`, payload: { taskId, method } });
  return taskId;
}

export async function suggestReplenishment(session: Session, productId: string, warehouseId: string, required: number) {
  const provider = await stock();
  const locations = await provider.getLocations(session, warehouseId);
  const positions = await db.stockPosition.findMany({ where: { organisationId: session.organisationId, warehouseId, productId, status: "AVAILABLE" }, include: { location: true } });
  const pickFace = positions.filter((row) => row.location.capabilities.includes("PICK_FACE")).reduce((sum, row) => sum + row.quantity, 0);
  const bulk = positions.filter((row) => row.location.capabilities.includes("BULK")).reduce((sum, row) => sum + row.quantity, 0);
  const suggestion = replenishmentNeed({ pickFace, required, bulk });
  if (!suggestion) return null;
  const from = locations.find((location) => location.capabilities.includes("BULK"));
  const to = locations.find((location) => location.capabilities.includes("PICK_FACE"));
  if (!from || !to) return suggestion;
  await provider.executeMovement(session, { requestKey: `replenish:${productId}:${warehouseId}:${required}`, productId, warehouseId, locationId: from.id, toLocationId: to.id, quantity: suggestion.quantity, reason: "Replenish pick face", reference: "Replenishment" });
  return suggestion;
}

export { createFollowOn };
