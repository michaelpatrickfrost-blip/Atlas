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
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) throw new Error("Receive a positive whole quantity.");
  if (!["UNKNOWN", "GOOD", "DAMAGED"].includes(input.condition) || !input.requestKey || input.requestKey.length > 120) throw new Error("Choose a valid condition and receipt reference.");
  await db.$transaction(async tx => {
    const prior = await tx.logisticsOperation.findUnique({ where: { organisationId_requestKey: { organisationId: session.organisationId, requestKey: input.requestKey } } });
    if (prior) {
      const result = prior.result as { lineId: string; quantity: number; condition: string; lotCode?: string; serials?: string[] };
      if (prior.action !== "RETURN_RECEIPT" || result.lineId !== lineId || result.quantity !== input.quantity || result.condition !== input.condition || (result.lotCode ?? "") !== (input.lotCode ?? "") || JSON.stringify(result.serials ?? []) !== JSON.stringify(input.serials ?? [])) throw new Error("Receipt reference was already used for different goods.");
      return;
    }
    const line = await tx.returnLine.findFirst({ where: { id: lineId, organisationId: session.organisationId }, include: { returnAuthorisation: true } });
    if (!line || !["AWAITING_GOODS", "RECEIVED"].includes(line.returnAuthorisation.status) || line.disposition) throw new Error("Authorise this return before receiving uninspected goods.");
    if (line.receivedQuantity + input.quantity > line.quantity) throw new Error("Received quantity exceeds the authorised return.");
    if (line.productId) {
      const warehouse = await tx.warehouse.findFirst({ where: { organisationId: session.organisationId }, orderBy: { name: "asc" } });
      if (!warehouse) throw new Error("Add a warehouse in Inventory before receiving a return.");
      const provider = await stock();
      await provider.returnStock(session, { requestKey: input.requestKey, productId: line.productId, warehouseId: warehouse.id, quantity: input.quantity, lotCode: input.lotCode, serials: input.serials, status: "QUARANTINE", reason: `Return received · ${line.returnAuthorisation.reference}`, reference: line.returnAuthorisation.reference, sourceId: line.id }, tx);
    }
    const updated = await tx.returnLine.updateMany({ where: { id: line.id, organisationId: session.organisationId, receivedQuantity: line.receivedQuantity }, data: { receivedQuantity: { increment: input.quantity }, condition: input.condition, lotCode: input.lotCode, serials: input.serials ?? line.serials } });
    if (!updated.count) throw new Error("Receipt changed. Refresh before receiving.");
    await tx.returnAuthorisation.update({ where: { id: line.returnId }, data: { status: "RECEIVED" } });
    if (line.productId && line.returnAuthorisation.salesOrderId) {
      const fulfilments = await tx.fulfilmentLine.findMany({ where: { organisationId: session.organisationId, productId: line.productId, requirement: { organisationId: session.organisationId, salesOrderId: line.returnAuthorisation.salesOrderId } }, orderBy: { id: "asc" } });
      let remaining = input.quantity;
      for (const fulfilment of fulfilments) {
        const quantity = Math.min(remaining, Math.max(0, fulfilment.deliveredQuantity - fulfilment.returnedQuantity));
        if (quantity) await tx.fulfilmentLine.update({ where: { id: fulfilment.id }, data: { returnedQuantity: { increment: quantity } } });
        remaining -= quantity;
      }
    }
    await tx.logisticsOperation.create({ data: { organisationId: session.organisationId, requestKey: input.requestKey, action: "RETURN_RECEIPT", result: { lineId, quantity: input.quantity, condition: input.condition, lotCode: input.lotCode ?? "", serials: input.serials ?? [] } } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.return.received", entityType: "ReturnAuthorisation", entityId: line.returnId, after: { lineId, quantity: input.quantity, requestKey: input.requestKey } } });
    await tx.domainOutbox.create({ data: { organisationId: session.organisationId, eventKey: `logistics.return.received:${input.requestKey}`, eventName: "logistics.return.received", payload: { returnId: line.returnId } } });
  }, { isolationLevel: "Serializable" });
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
