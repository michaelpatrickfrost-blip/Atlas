import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { DISPOSITIONS, RETURN_REASONS } from "../domain/operations";
import { milestone, nextReference, stock } from "./numbers";

export async function requestReturn(session: Session, input: { partyId: string; salesOrderId?: string; shipmentId?: string; reason: string; resolution?: string; lines: Array<{ productId?: string; description: string; quantity: number; lotCode?: string; serials?: string[] }> }) {
  if (!RETURN_REASONS.includes(input.reason as typeof RETURN_REASONS[number])) throw new Error("Choose a return reason.");
  const party = await db.party.findFirst({ where: { id: input.partyId, organisationId: session.organisationId } });
  if (!party) throw new Error("Choose a customer in this workspace.");
  const returnId = await db.$transaction(async (tx) => {
    const created = await tx.returnAuthorisation.create({ data: { organisationId: session.organisationId, reference: await nextReference(tx, session.organisationId, "RT", "RMA"), partyId: party.id, salesOrderId: input.salesOrderId, shipmentId: input.shipmentId, reason: input.reason, requestedResolution: input.resolution, status: "REQUESTED" } });
    for (const line of input.lines) await tx.returnLine.create({ data: { organisationId: session.organisationId, returnId: created.id, productId: line.productId, description: line.description, quantity: line.quantity, lotCode: line.lotCode, serials: line.serials ?? [] } });
    return created.id;
  });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.return.created", entityType: "ReturnAuthorisation", entityId: returnId, summary: `Return requested`, partyId: party.id, event: "logisticsReturnCreated", eventKey: `logistics.return.created:${returnId}`, payload: { returnId } });
  return returnId;
}

export async function authoriseReturn(session: Session, returnId: string, approve: boolean) {
  const row = await owned(session.organisationId, returnId);
  await db.returnAuthorisation.update({ where: { id: row.id }, data: { status: approve ? "AWAITING_GOODS" : "REJECTED" } });
}

export async function receiveReturn(session: Session, lineId: string, input: { quantity: number; condition: string; lotCode?: string; serials?: string[]; requestKey: string }) {
  const line = await db.returnLine.findFirst({ where: { id: lineId, organisationId: session.organisationId }, include: { returnAuthorisation: true } });
  if (!line) throw new Error("This return line no longer exists.");
  if (line.productId) {
    const warehouse = await db.warehouse.findFirst({ where: { organisationId: session.organisationId }, orderBy: { name: "asc" } });
    if (!warehouse) throw new Error("Add a warehouse in Inventory before receiving a return.");
    const provider = await stock();
    await provider.returnStock(session, { requestKey: input.requestKey, productId: line.productId, warehouseId: warehouse.id, quantity: input.quantity, lotCode: input.lotCode, serials: input.serials, status: "QUARANTINE", reason: `Return received · ${line.returnAuthorisation.reference}`, reference: line.returnAuthorisation.reference, sourceId: line.id });
  }
  await db.returnLine.update({ where: { id: line.id }, data: { receivedQuantity: { increment: input.quantity }, condition: input.condition, lotCode: input.lotCode, serials: input.serials ?? line.serials } });
  await db.returnAuthorisation.update({ where: { id: line.returnId }, data: { status: "RECEIVED" } });
  if (line.productId && line.returnAuthorisation.salesOrderId) await db.fulfilmentLine.updateMany({ where: { organisationId: session.organisationId, productId: line.productId, requirement: { organisationId: session.organisationId, salesOrderId: line.returnAuthorisation.salesOrderId } }, data: { returnedQuantity: { increment: input.quantity } } });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.return.received", entityType: "ReturnAuthorisation", entityId: line.returnId, summary: `${line.returnAuthorisation.reference} received`, partyId: line.returnAuthorisation.partyId, event: "logisticsReturnReceived", eventKey: `logistics.return.received:${input.requestKey}`, payload: { returnId: line.returnId } });
}

export async function inspectReturn(session: Session, lineId: string, disposition: string, replacementRequirementId?: string) {
  if (!DISPOSITIONS.includes(disposition as typeof DISPOSITIONS[number])) throw new Error("Choose what happens to these goods.");
  const line = await db.returnLine.findFirst({ where: { id: lineId, organisationId: session.organisationId }, include: { returnAuthorisation: true } });
  if (!line) throw new Error("This return line no longer exists.");
  if (disposition === "Replace" && !replacementRequirementId) throw new Error("Link the replacement fulfilment. Sales owns the commercial replacement.");
  const warehouse = await db.warehouse.findFirst({ where: { organisationId: session.organisationId }, orderBy: { name: "asc" } });
  if (line.productId && warehouse && (disposition === "Restock" || disposition === "Scrap")) {
    const provider = await stock();
    const locations = await provider.getLocations(session, warehouse.id);
    const from = locations.find((location) => location.capabilities.includes("QUARANTINE") || location.capabilities.includes("RETURNS"));
    const to = locations.find((location) => location.capabilities.includes(disposition === "Scrap" ? "SCRAP" : "PICK_FACE"));
    if (from && to) await provider.executeMovement(session, { requestKey: `return-move:${line.id}:${disposition}`, productId: line.productId, warehouseId: warehouse.id, locationId: from.id, toLocationId: to.id, quantity: line.receivedQuantity, status: "QUARANTINE", toStatus: disposition === "Scrap" ? "SCRAP" : "AVAILABLE", reason: `Return ${disposition.toLowerCase()} · ${line.returnAuthorisation.reference}`, reference: line.returnAuthorisation.reference });
  }
  await db.returnLine.update({ where: { id: line.id }, data: { disposition, replacementRequirementId } });
  await db.returnAuthorisation.update({ where: { id: line.returnId }, data: { status: "INSPECTING" } });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.return.inspected", entityType: "ReturnAuthorisation", entityId: line.returnId, summary: `${line.returnAuthorisation.reference} · ${disposition}`, partyId: line.returnAuthorisation.partyId, event: "logisticsReturnInspected", eventKey: `logistics.return.inspected:${line.id}`, payload: { returnId: line.returnId, disposition } });
  if (["Restock", "Scrap", "Quarantine", "Return to supplier"].includes(disposition)) {
    await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.return.resolved", entityType: "ReturnAuthorisation", entityId: line.returnId, summary: `${line.returnAuthorisation.reference} resolved · ${disposition}`, partyId: line.returnAuthorisation.partyId, event: "logisticsReturnResolved", eventKey: `logistics.return.accepted:${line.id}`, payload: { returnId: line.returnId, disposition } });
  }
}

export async function closeReturn(session: Session, returnId: string) {
  const row = await owned(session.organisationId, returnId);
  if (row.lines.some((line) => !line.disposition)) throw new Error("Inspect every line before closing the return.");
  await db.returnAuthorisation.update({ where: { id: row.id }, data: { status: "CLOSED" } });
}

async function owned(organisationId: string, returnId: string) {
  const row = await db.returnAuthorisation.findFirst({ where: { id: returnId, organisationId }, include: { lines: true } });
  if (!row) throw new Error("This return no longer exists.");
  return row;
}
