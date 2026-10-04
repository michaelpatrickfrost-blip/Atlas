import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { crossDockSuggestion, overReceiptDecision } from "../domain/operations";
import { milestone, nextReference, stock } from "./numbers";

export async function expectReceipt(session: Session, input: { sourceType: string; sourceReference: string; partyName?: string; warehouseId: string; expectedOn?: Date; lines: Array<{ productId?: string; description: string; quantity: number }> }) {
  if (!input.lines.length) throw new Error("Add at least one expected line.");
  const warehouse = await db.warehouse.findFirst({ where: { id: input.warehouseId, organisationId: session.organisationId } });
  if (!warehouse) throw new Error("Choose a warehouse in this workspace.");
  return db.$transaction(async (tx) => {
    const receipt = await tx.expectedReceipt.create({ data: { organisationId: session.organisationId, reference: await nextReference(tx, session.organisationId, "RC", "RC"), sourceType: input.sourceType, sourceReference: input.sourceReference, partyName: input.partyName, warehouseId: warehouse.id, expectedOn: input.expectedOn } });
    for (const line of input.lines) {
      if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) throw new Error("Expected quantities must be whole numbers.");
      await tx.receiptLine.create({ data: { organisationId: session.organisationId, receiptId: receipt.id, productId: line.productId, description: line.description, expectedQuantity: line.quantity } });
    }
    return receipt.id;
  });
}

export async function receiveLine(session: Session, lineId: string, input: { quantity: number; lotCode?: string; serials?: string[]; condition: string; requestKey: string }) {
  const line = await db.receiptLine.findFirst({ where: { id: lineId, organisationId: session.organisationId }, include: { receipt: true } });
  if (!line) throw new Error("This receipt line no longer exists.");
  const decision = overReceiptDecision({ expected: line.expectedQuantity, received: line.receivedQuantity + input.quantity, tolerancePercent: 5, mode: "TOLERANCE" });
  if (!decision.accepted && !decision.needsApproval) throw new Error(`Over-receipt is outside the 5% tolerance. Expected ${line.expectedQuantity}, this would make ${line.receivedQuantity + input.quantity}.`);
  if (decision.needsApproval) throw new Error("This over-receipt needs a supervisor with receipt override.");
  const discrepancy = input.quantity + line.receivedQuantity < line.expectedQuantity ? "Short" : input.condition === "DAMAGED" ? "Damaged" : decision.difference > 0 ? "Over" : null;
  if (line.productId) {
    const provider = await stock();
    const status = input.condition === "DAMAGED" || input.condition === "QUARANTINE" ? "QUARANTINE" : "AVAILABLE";
    await provider.receiveStock(session, { requestKey: input.requestKey, productId: line.productId, warehouseId: line.receipt.warehouseId, quantity: input.quantity, lotCode: input.lotCode, serials: input.serials, status, reason: `Received · ${line.receipt.reference}`, reference: line.receipt.sourceReference, receiptId: line.receipt.id });
  }
  await db.receiptLine.update({ where: { id: line.id }, data: { receivedQuantity: { increment: input.quantity }, lotCode: input.lotCode, serials: input.serials ?? [], condition: input.condition, discrepancy, status: discrepancy ? "DISCREPANCY" : "RECEIVED" } });
  await db.expectedReceipt.update({ where: { id: line.receiptId }, data: { status: discrepancy ? "DISCREPANCY" : "RECEIVING" } });
  if (discrepancy) await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.receipt.discrepancy", entityType: "ExpectedReceipt", entityId: line.receiptId, summary: `${line.receipt.reference} · ${discrepancy}`, event: "logisticsReceiptDiscrepancy", eventKey: `logistics.receipt.discrepancy:${input.requestKey}`, payload: { receiptId: line.receiptId, difference: decision.difference } });
  const openDemand = line.productId ? await db.fulfilmentLine.count({ where: { organisationId: session.organisationId, productId: line.productId, allocationStatus: { in: ["SHORT", "UNALLOCATED"] } } }) : 0;
  return { suggestion: crossDockSuggestion({ received: input.quantity, demandedToday: openDemand }), discrepancy };
}

export async function putAway(session: Session, lineId: string, destinationCode: string, requestKey: string) {
  const line = await db.receiptLine.findFirst({ where: { id: lineId, organisationId: session.organisationId }, include: { receipt: true } });
  if (!line?.productId) throw new Error("This line has no stock product to put away.");
  const provider = await stock();
  const locations = await provider.getLocations(session, line.receipt.warehouseId);
  const from = locations.find((location) => location.capabilities.includes("RECEIVING"));
  const to = locations.find((location) => location.code === destinationCode.trim());
  if (!from || !to) throw new Error("Scan a destination location in this warehouse.");
  if (from.id === to.id) return;
  await provider.executeMovement(session, { requestKey, productId: line.productId, warehouseId: line.receipt.warehouseId, locationId: from.id, toLocationId: to.id, quantity: line.receivedQuantity, lotCode: line.lotCode, reason: `Put away · ${line.receipt.reference}`, reference: line.receipt.reference, status: line.condition === "DAMAGED" ? "QUARANTINE" : "AVAILABLE" });
  await db.receiptLine.update({ where: { id: line.id }, data: { status: "PUTAWAY" } });
}

export async function completeReceipt(session: Session, receiptId: string) {
  const receipt = await db.expectedReceipt.findFirst({ where: { id: receiptId, organisationId: session.organisationId }, include: { lines: true } });
  if (!receipt) throw new Error("This receipt no longer exists.");
  await db.expectedReceipt.update({ where: { id: receipt.id }, data: { status: receipt.lines.some((line) => line.discrepancy) ? "DISCREPANCY" : "COMPLETE" } });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.receipt.completed", entityType: "ExpectedReceipt", entityId: receipt.id, summary: `${receipt.reference} received`, event: "logisticsReceiptCompleted", eventKey: `logistics.receipt.completed:${receipt.id}`, payload: { receiptId } });
}

export async function moveTransfer(session: Session, input: { productId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; requestKey: string }) {
  const provider = await stock();
  const fromLocations = await provider.getLocations(session, input.fromWarehouseId);
  const toLocations = await provider.getLocations(session, input.toWarehouseId);
  const from = fromLocations.find((location) => location.capabilities.includes("PICK_FACE")) ?? fromLocations[0];
  const to = toLocations.find((location) => location.capabilities.includes("RECEIVING")) ?? toLocations[0];
  if (!from || !to) throw new Error("Both warehouses need locations before stock can move.");
  await provider.executeMovement(session, { requestKey: input.requestKey, productId: input.productId, warehouseId: input.fromWarehouseId, locationId: from.id, toWarehouseId: input.toWarehouseId, toLocationId: to.id, toStatus: "IN_TRANSIT", quantity: input.quantity, reason: "Transfer in transit", reference: input.requestKey });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.transfer.dispatched", entityType: "Warehouse", entityId: input.toWarehouseId, summary: "Transfer dispatched", event: "logisticsTransferDispatched", eventKey: `logistics.transfer.dispatched:${input.requestKey}`, payload: input });
}

export async function receiveTransfer(session: Session, input: { productId: string; warehouseId: string; quantity: number; requestKey: string }) {
  const provider = await stock();
  const locations = await provider.getLocations(session, input.warehouseId);
  const from = locations.find((location) => location.capabilities.includes("RECEIVING"));
  const to = locations.find((location) => location.capabilities.includes("PICK_FACE"));
  if (!from || !to) throw new Error("This warehouse has no receiving and pick-face locations.");
  await provider.executeMovement(session, { requestKey: input.requestKey, productId: input.productId, warehouseId: input.warehouseId, locationId: from.id, toLocationId: to.id, quantity: input.quantity, status: "IN_TRANSIT", toStatus: "AVAILABLE", reason: "Transfer received", reference: input.requestKey });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.transfer.received", entityType: "Warehouse", entityId: input.warehouseId, summary: "Transfer received", event: "logisticsTransferReceived", eventKey: `logistics.transfer.received:${input.requestKey}`, payload: input });
}
