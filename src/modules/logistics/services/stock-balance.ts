import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import type { LogisticsActor } from "@/core/logistics/types";
import { explainShortage } from "../domain/operations";
import { coverWaitingStock, type WaitingBalance } from "../domain/stock-balance";
import { nextReference, stock } from "./numbers";
import { confirmDelivery, dispatchShipment } from "./shipping";

const OPEN_PICK = ["READY", "CLAIMED", "IN_PROGRESS"];
const BALANCE_REASON = "Raised when the product came back into stock.";

function actorSession(actor: LogisticsActor): Session {
  return { userId: actor.userId, organisationId: actor.organisationId, userName: "Atlas", userEmail: "", organisationName: "", membershipId: "", capabilities: new Set() };
}

function shortKey(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40);
}

/** A confirmed order that was short of stock gets a delivery, then a draft invoice, once the product is back. */
export async function releaseBalancedStock(actor: LogisticsActor, input: { productId: string; warehouseId: string; requestKey: string }) {
  const seen = await db.logisticsOperation.findUnique({ where: { organisationId_requestKey: { organisationId: actor.organisationId, requestKey: input.requestKey } } });
  if (seen) return;
  const session = actorSession(actor);
  await finishPending(session, input.productId, input.warehouseId);
  const lines = await db.fulfilmentLine.findMany({
    where: {
      organisationId: actor.organisationId,
      productId: input.productId,
      requirement: {
        organisationId: actor.organisationId,
        warehouseId: input.warehouseId,
        fulfilmentMode: "WAREHOUSE",
        holdSummary: null,
        status: { notIn: ["CANCELLED", "BLOCKED"] },
        salesOrder: { organisationId: actor.organisationId, commercialStatus: "CONFIRMED" },
      },
    },
    include: { requirement: true },
  });
  const pending = await pendingLineIds(actor.organisationId, input.productId, input.warehouseId);
  const openLines = lines.filter((line) => line.orderedQuantity - line.cancelledQuantity > line.shippedQuantity && !pending.has(line.id));
  if (!openLines.length) {
    await remember(actor, input.requestKey, { skipped: true });
    return;
  }
  const picks = await db.warehouseTaskLine.findMany({
    where: { organisationId: actor.organisationId, fulfilmentLineId: { in: openLines.map((line) => line.id) }, task: { status: { in: OPEN_PICK } } },
    select: { fulfilmentLineId: true, requiredQuantity: true, confirmedQuantity: true },
  });
  const onPick = new Map<string, number>();
  for (const pick of picks) {
    if (!pick.fulfilmentLineId) continue;
    onPick.set(pick.fulfilmentLineId, (onPick.get(pick.fulfilmentLineId) ?? 0) + Math.max(0, pick.requiredQuantity - pick.confirmedQuantity));
  }
  const waiting: WaitingBalance[] = openLines.map((line) => {
    const required = line.orderedQuantity - line.cancelledQuantity;
    return {
      id: line.id,
      open: required - line.shippedQuantity,
      allocated: line.allocatedQuantity,
      shipped: line.shippedQuantity,
      onPick: onPick.get(line.id) ?? 0,
      partialAllowed: line.requirement.partialPolicy,
      short: line.allocationStatus !== "ALLOCATED",
      promisedAt: line.requirement.promisedOn?.getTime() ?? null,
      placedAt: line.requirement.createdAt.getTime(),
    };
  });
  const provider = await stock();
  const availability = await provider.getAvailability(actor, { productId: input.productId, warehouseId: input.warehouseId });
  let plan = coverWaitingStock(availability.pickable, waiting);
  const blocked = new Set<string>();
  for (const row of plan) {
    const line = openLines.find((item) => item.id === row.id);
    if (!line || line.requirement.partialPolicy) continue;
    const siblings = await db.fulfilmentLine.findMany({ where: { organisationId: actor.organisationId, requirementId: line.requirementId } });
    const complete = siblings.every((sibling) => {
      const required = sibling.orderedQuantity - sibling.cancelledQuantity;
      const extra = sibling.productId === input.productId ? plan.find((item) => item.id === sibling.id)?.deliver ?? 0 : 0;
      return sibling.shippedQuantity + extra >= required;
    });
    if (!complete) blocked.add(line.requirementId);
  }
  if (blocked.size) plan = coverWaitingStock(availability.pickable, waiting.filter((row) => !blocked.has(openLines.find((line) => line.id === row.id)?.requirementId ?? "")));
  if (!plan.length) {
    await remember(actor, input.requestKey, { skipped: true, reason: "Still short" });
    return;
  }
  const groups = new Map<string, typeof plan>();
  for (const row of plan) {
    const line = openLines.find((item) => item.id === row.id);
    if (!line) continue;
    const rows = groups.get(line.requirementId) ?? [];
    rows.push(row);
    groups.set(line.requirementId, rows);
  }
  const shipmentIds: string[] = [];
  for (const [requirementId, rows] of groups) {
    const requirement = openLines.find((line) => line.requirementId === requirementId)?.requirement;
    if (!requirement?.warehouseId) continue;
    for (const row of rows) {
      const line = openLines.find((item) => item.id === row.id);
      if (!line?.productId || row.reserve <= 0) continue;
      const reserved = await provider.requestReservation(actor, {
        requestKey: shortKey(`${input.requestKey}:${line.id}`),
        productId: line.productId,
        warehouseId: requirement.warehouseId,
        quantity: row.reserve,
        reason: "Waiting order back in stock",
        reference: requirement.reference,
        sourceType: "FULFILMENT_LINE",
        sourceId: line.id,
      });
      if (!reserved.replayed) await db.fulfilmentLine.update({ where: { id: line.id }, data: { allocatedQuantity: { increment: row.reserve } } });
    }
    const shipmentId = await db.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          organisationId: actor.organisationId,
          reference: await nextReference(tx, actor.organisationId, "SH", "SH"),
          partyId: requirement.partyId,
          shipTo: requirement.shipTo ?? {},
          status: "READY",
          carrierCode: "MANUAL",
          carrierReason: BALANCE_REASON,
          serviceLevel: requirement.serviceLevel,
          plannedDispatchAt: new Date(),
          expectedDeliveryAt: requirement.promisedOn,
        },
      });
      for (const row of rows) {
        await tx.shipmentSource.create({ data: { organisationId: actor.organisationId, shipmentId: shipment.id, requirementId, fulfilmentLineId: row.id, quantity: row.deliver } });
      }
      return shipment.id;
    });
    await deliverShipment(session, shipmentId, rows.map((row) => row.id));
    shipmentIds.push(shipmentId);
  }
  await remember(actor, input.requestKey, { shipmentIds });
}

async function pendingLineIds(organisationId: string, productId: string, warehouseId: string) {
  const sources = await db.shipmentSource.findMany({
    where: {
      organisationId,
      shipment: { organisationId, status: { in: ["READY", "DISPATCHED"] }, carrierReason: BALANCE_REASON },
      line: { productId },
      requirement: { warehouseId },
    },
    select: { fulfilmentLineId: true },
  });
  return new Set(sources.map((source) => source.fulfilmentLineId));
}

async function finishPending(session: Session, productId: string, warehouseId: string) {
  const shipments = await db.shipment.findMany({
    where: {
      organisationId: session.organisationId,
      status: { in: ["READY", "DISPATCHED"] },
      carrierReason: BALANCE_REASON,
      sources: { some: { line: { productId }, requirement: { warehouseId } } },
    },
    include: { sources: { select: { fulfilmentLineId: true } } },
  });
  for (const shipment of shipments) await deliverShipment(session, shipment.id, shipment.sources.map((source) => source.fulfilmentLineId));
}

async function deliverShipment(session: Session, shipmentId: string, lineIds: string[]) {
  await dispatchShipment(session, shipmentId, shortKey(`dispatch:${shipmentId}`));
  const fresh = await db.fulfilmentLine.findMany({ where: { organisationId: session.organisationId, id: { in: lineIds } } });
  const partial = fresh.some((line) => line.shippedQuantity < line.orderedQuantity - line.cancelledQuantity);
  await confirmDelivery(session, shipmentId, { outcome: partial ? "PARTIAL" : "DELIVERED", note: BALANCE_REASON });
  for (const line of fresh) {
    const required = line.orderedQuantity - line.cancelledQuantity;
    const current = await db.fulfilmentLine.findFirst({ where: { id: line.id, organisationId: session.organisationId } });
    const shipped = current?.shippedQuantity ?? line.shippedQuantity;
    const still = Math.max(0, required - shipped);
    await db.fulfilmentLine.update({
      where: { id: line.id },
      data: {
        allocationStatus: still > 0 ? "SHORT" : "ALLOCATED",
        shortage: still > 0 ? explainShortage({ required, allocated: shipped, availableNow: 0, reservedElsewhere: 0 }) : Prisma.DbNull,
      },
    });
  }
}

async function remember(actor: LogisticsActor, requestKey: string, result: unknown) {
  await db.logisticsOperation.create({ data: { organisationId: actor.organisationId, requestKey, action: "stock.balance.release", result: result as Prisma.InputJsonValue } }).catch((error: { code?: string }) => {
    if (error.code !== "P2002") throw error;
  });
}
