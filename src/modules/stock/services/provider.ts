import { db } from "@/core/db/client";
import type { LogisticsActor, StockAvailability, StockCommand, StockCommandResult, StockLocationView, StockLotView, StockProvider, StockReservationView, StockSerialView } from "@/core/logistics/types";
import { starterLocations } from "../domain/places";

async function layout(tx: Tx, actor: LogisticsActor, warehouseId: string) {
  const existing = await tx.stockLocation.findMany({ where: { organisationId: actor.organisationId, warehouseId } });
  if (existing.length) return existing;
  const place = await tx.warehouse.findFirstOrThrow({ where: { id: warehouseId, organisationId: actor.organisationId } });
  for (const row of starterLocations(place.kind === "YARD" ? "YARD" : "WAREHOUSE")) {
    await tx.stockLocation.create({ data: { organisationId: actor.organisationId, warehouseId, code: row.code, name: row.name, capabilities: row.capabilities, sequence: row.sequence } });
  }
  return tx.stockLocation.findMany({ where: { organisationId: actor.organisationId, warehouseId } });
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

async function locationFor(tx: Tx, actor: LogisticsActor, warehouseId: string, preferred: string[], explicit?: string | null) {
  const rows = await layout(tx, actor, warehouseId);
  if (explicit) {
    const match = rows.find((row) => row.id === explicit || row.code === explicit);
    if (!match) throw new Error("That location is not in this warehouse.");
    return match;
  }
  return rows.find((row) => preferred.some((capability) => row.capabilities.includes(capability))) ?? rows[0];
}

async function availability(actor: LogisticsActor, query: { productId: string; warehouseId?: string }, client: Pick<Tx, "inventoryBalance" | "stockPosition" | "stockReservation"> = db): Promise<StockAvailability> {
  const where = { organisationId: actor.organisationId, productId: query.productId, ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}) };
  const [balances, positions, reservations] = await Promise.all([
    client.inventoryBalance.findMany({ where }),
    client.stockPosition.findMany({ where }),
    client.stockReservation.findMany({ where: { ...where, status: "ACTIVE" } }),
  ]);
  const onHand = balances.reduce((sum, row) => sum + row.quantity, 0);
  const reserved = reservations.reduce((sum, row) => sum + row.quantity, 0);
  const quarantine = positions.filter((row) => row.status === "QUARANTINE").reduce((sum, row) => sum + row.quantity, 0);
  const blocked = positions.filter((row) => row.status === "BLOCKED").reduce((sum, row) => sum + row.quantity, 0);
  const inTransit = positions.filter((row) => row.status === "IN_TRANSIT").reduce((sum, row) => sum + row.quantity, 0);
  const available = Math.max(0, onHand - reserved);
  const located = positions.filter((row) => row.status === "AVAILABLE").reduce((sum, row) => sum + row.quantity, 0);
  const pickableBase = Math.max(0, onHand - reserved - quarantine - blocked - inTransit);
  const pickable = positions.length ? Math.min(pickableBase, located) : pickableBase;
  return { productId: query.productId, warehouseId: query.warehouseId ?? null, onHand, reserved, available, pickable, quarantine, blocked, inTransit };
}

async function replay(tx: Tx, actor: LogisticsActor, requestKey: string, productId: string, quantity: number): Promise<StockCommandResult | null> {
  const prior = await tx.inventoryMovement.findMany({ where: { organisationId: actor.organisationId, requestKey: { in: [requestKey, `${requestKey}:out`, `${requestKey}:in`] } } });
  if (!prior.length) return null;
  if (prior.some((row) => row.productId !== productId)) throw new Error("This request was already used for a different product.");
  const moved = prior.reduce((sum, row) => sum + Math.abs(row.delta), 0);
  if (moved !== 0 && moved !== quantity && moved !== quantity * 2) throw new Error("This request was already used for a different quantity.");
  return { requestKey, movementIds: prior.map((row) => row.id), replayed: true };
}

async function changeBalance(tx: Tx, actor: LogisticsActor, warehouseId: string, productId: string, delta: number) {
  if (delta < 0) {
    const updated = await tx.inventoryBalance.updateMany({ where: { organisationId: actor.organisationId, warehouseId, productId, quantity: { gte: -delta } }, data: { quantity: { decrement: -delta } } });
    if (updated.count !== 1) throw new Error("The warehouse does not have enough stock.");
    return;
  }
  await tx.inventoryBalance.upsert({
    where: { warehouseId_productId: { warehouseId, productId } },
    create: { organisationId: actor.organisationId, warehouseId, productId, quantity: delta },
    update: { quantity: { increment: delta } },
  });
}

async function changePosition(tx: Tx, actor: LogisticsActor, input: { warehouseId: string; locationId: string; productId: string; lotId: string; status: string; delta: number }) {
  if (input.delta < 0) {
    const updated = await tx.stockPosition.updateMany({
      where: { organisationId: actor.organisationId, warehouseId: input.warehouseId, locationId: input.locationId, productId: input.productId, lotId: input.lotId, status: input.status, quantity: { gte: -input.delta } },
      data: { quantity: { decrement: -input.delta } },
    });
    if (updated.count !== 1) throw new Error("That location does not have enough pickable stock.");
    return;
  }
  await tx.stockPosition.upsert({
    where: { warehouseId_locationId_productId_lotId_status: { warehouseId: input.warehouseId, locationId: input.locationId, productId: input.productId, lotId: input.lotId, status: input.status } },
    create: { organisationId: actor.organisationId, warehouseId: input.warehouseId, locationId: input.locationId, productId: input.productId, lotId: input.lotId, status: input.status, quantity: input.delta },
    update: { quantity: { increment: input.delta } },
  });
}

async function materialise(tx: Tx, actor: LogisticsActor, warehouseId: string, productId: string, locationId: string) {
  const positions = await tx.stockPosition.count({ where: { organisationId: actor.organisationId, warehouseId, productId } });
  if (positions) return;
  const balance = await tx.inventoryBalance.findUnique({ where: { warehouseId_productId: { warehouseId, productId } } });
  if (!balance?.quantity) return;
  await tx.stockPosition.create({ data: { organisationId: actor.organisationId, warehouseId, locationId, productId, lotId: "", status: "AVAILABLE", quantity: balance.quantity } });
}

async function lotId(tx: Tx, actor: LogisticsActor, productId: string, code?: string | null) {
  if (!code?.trim()) return "";
  const lot = await tx.stockLot.upsert({
    where: { organisationId_productId_code: { organisationId: actor.organisationId, productId, code: code.trim() } },
    create: { organisationId: actor.organisationId, productId, code: code.trim() },
    update: {},
  });
  return lot.id;
}

function assertCommand(command: StockCommand) {
  if (!command.requestKey || command.requestKey.length > 120) throw new Error("A movement reference is required.");
  if (!Number.isSafeInteger(command.quantity) || command.quantity <= 0 || command.quantity > 1_000_000) throw new Error("Enter a positive whole quantity.");
}

async function run(work: (tx: Tx) => Promise<StockCommandResult>): Promise<StockCommandResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(work, { isolationLevel: "Serializable" });
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (attempt < 2 && ["P2034", "P2002"].includes(code)) continue;
      throw error;
    }
  }
  throw new Error("The stock movement could not be saved. Try again.");
}

export const stockProvider: StockProvider = {
  getAvailability: availability,
  async getLocations(actor, warehouseId) {
    const rows = await db.stockLocation.findMany({ where: { organisationId: actor.organisationId, ...(warehouseId ? { warehouseId } : {}), active: true }, orderBy: { sequence: "asc" } });
    return rows.map((row): StockLocationView => ({ id: row.id, warehouseId: row.warehouseId, parentId: row.parentId, code: row.code, name: row.name, capabilities: row.capabilities, sequence: row.sequence }));
  },
  async getLots(actor, productId) {
    const rows = await db.stockLot.findMany({ where: { organisationId: actor.organisationId, productId }, orderBy: { code: "asc" } });
    return rows.map((row): StockLotView => ({ id: row.id, productId: row.productId, code: row.code, expiresOn: row.expiresOn?.toISOString() ?? null, bestBeforeOn: row.bestBeforeOn?.toISOString() ?? null, removalOn: row.removalOn?.toISOString() ?? null }));
  },
  async getSerials(actor, productId) {
    const rows = await db.stockSerial.findMany({ where: { organisationId: actor.organisationId, productId }, orderBy: { serial: "asc" }, take: 200 });
    return rows.map((row): StockSerialView => ({ id: row.id, productId: row.productId, serial: row.serial, status: row.status, warehouseId: row.warehouseId, locationId: row.locationId }));
  },
  async getReservations(actor, productId) {
    const rows = await db.stockReservation.findMany({ where: { organisationId: actor.organisationId, productId }, orderBy: { id: "asc" }, take: 200 });
    return rows.map((row): StockReservationView => ({ id: row.id, productId: row.productId, warehouseId: row.warehouseId, quantity: row.quantity, sourceType: row.sourceType, sourceId: row.sourceId, status: row.status }));
  },
  requestReservation(actor, command) {
    assertCommand(command);
    return run(async (tx) => {
      const prior = await tx.stockReservation.findUnique({ where: { organisationId_requestKey: { organisationId: actor.organisationId, requestKey: command.requestKey } } });
      if (prior) {
        if (prior.productId !== command.productId || prior.quantity !== command.quantity) throw new Error("This reservation was already used for a different request.");
        return { requestKey: command.requestKey, movementIds: [prior.id], replayed: true };
      }
      const place = await locationFor(tx, actor, command.warehouseId, ["PICK_FACE", "STORAGE"], command.locationId);
      await materialise(tx, actor, command.warehouseId, command.productId, place.id);
      const current = await availability(actor, { productId: command.productId, warehouseId: command.warehouseId }, tx);
      if (current.pickable < command.quantity) throw new Error("Not enough pickable stock to reserve.");
      const created = await tx.stockReservation.create({ data: { organisationId: actor.organisationId, productId: command.productId, warehouseId: command.warehouseId, locationId: place.id, lotId: command.lotCode?.trim() || "", quantity: command.quantity, sourceType: command.sourceType ?? "FULFILMENT_LINE", sourceId: command.sourceId ?? command.requestKey, requestKey: command.requestKey } });
      return { requestKey: command.requestKey, movementIds: [created.id], replayed: false };
    });
  },
  releaseReservation(actor, command) {
    return run(async (tx) => {
      if (command.sourceId && command.requestKey.startsWith("release-source:")) {
        const rows = await tx.stockReservation.findMany({ where: { organisationId: actor.organisationId, sourceId: command.sourceId, status: "ACTIVE" } });
        if (!rows.length) return { requestKey: command.requestKey, movementIds: [], replayed: true };
        await tx.stockReservation.updateMany({ where: { id: { in: rows.map((row) => row.id) } }, data: { status: "RELEASED" } });
        return { requestKey: command.requestKey, movementIds: rows.map((row) => row.id), replayed: false };
      }
      const prior = await tx.stockReservation.findUnique({ where: { organisationId_requestKey: { organisationId: actor.organisationId, requestKey: command.requestKey } } });
      if (!prior) return { requestKey: command.requestKey, movementIds: [], replayed: true };
      if (prior.status === "ACTIVE") await tx.stockReservation.update({ where: { id: prior.id }, data: { status: "RELEASED" } });
      return { requestKey: command.requestKey, movementIds: [prior.id], replayed: prior.status !== "ACTIVE" };
    });
  },
  async receiveStock(actor, command) {
    assertCommand(command);
    const result = await run((tx) => receive(tx, actor, command, command.status ?? "AVAILABLE"));
    if ((command.status ?? "AVAILABLE") === "AVAILABLE") await replenished(actor, command.productId, command.warehouseId, `balance:${command.requestKey}`);
    return result;
  },
  returnStock(actor, command, transaction) {
    assertCommand(command);
    const work = (tx: Tx) => receive(tx, actor, command, command.status ?? "QUARANTINE", ["RETURNS", "QUARANTINE"]);
    return transaction ? work(transaction) : run(work);
  },
  shipStock(actor, command) {
    assertCommand(command);
    return run(async (tx) => {
      const done = await replay(tx, actor, command.requestKey, command.productId, command.quantity);
      if (done) return done;
      const place = await locationFor(tx, actor, command.warehouseId, ["PICK_FACE", "SHIPPING", "STORAGE"], command.locationId);
      await materialise(tx, actor, command.warehouseId, command.productId, place.id);
      const positions = await tx.stockPosition.findMany({ where: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, status: "AVAILABLE", quantity: { gt: 0 } }, orderBy: { quantity: "desc" } });
      let remainingStock = command.quantity;
      if (positions.reduce((sum, position) => sum + position.quantity, 0) >= command.quantity) {
        for (const position of positions) {
          if (remainingStock <= 0) break;
          const take = Math.min(position.quantity, remainingStock);
          await changePosition(tx, actor, { warehouseId: command.warehouseId, locationId: position.locationId, productId: command.productId, lotId: position.lotId, status: "AVAILABLE", delta: -take });
          remainingStock -= take;
        }
      } else {
        const lot = await lotId(tx, actor, command.productId, command.lotCode);
        await changePosition(tx, actor, { warehouseId: command.warehouseId, locationId: place.id, productId: command.productId, lotId: lot, status: "AVAILABLE", delta: -command.quantity });
      }
      await changeBalance(tx, actor, command.warehouseId, command.productId, -command.quantity);
      if (command.sourceId) {
        let remaining = command.quantity;
        const reservations = await tx.stockReservation.findMany({ where: { organisationId: actor.organisationId, sourceId: command.sourceId, status: "ACTIVE" }, orderBy: { id: "desc" } });
        for (const reservation of reservations) {
          if (remaining <= 0) break;
          const used = Math.min(reservation.quantity, remaining);
          const left = reservation.quantity - used;
          await tx.stockReservation.update({ where: { id: reservation.id }, data: left > 0 ? { quantity: left } : { quantity: 0, status: "CONSUMED" } });
          remaining -= used;
        }
      }
      for (const serial of command.serials ?? []) {
        await tx.stockSerial.updateMany({ where: { organisationId: actor.organisationId, productId: command.productId, serial, status: "ON_HAND" }, data: { status: "SHIPPED" } });
      }
      const movement = await tx.inventoryMovement.create({ data: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, delta: -command.quantity, reason: command.reason, shipmentId: command.shipmentId ?? null, receiptId: command.receiptId ?? null, manufacturingOrderId: command.manufacturingOrderId ?? null, workOrderId: command.workOrderId ?? null, reference: command.reference, requestKey: command.requestKey, actorUserId: actor.userId } });
      return { requestKey: command.requestKey, movementIds: [movement.id], replayed: false };
    });
  },
  executeMovement(actor, command) {
    assertCommand(command);
    return run(async (tx) => {
      const done = await replay(tx, actor, command.requestKey, command.productId, command.quantity);
      if (done) return done;
      const from = await locationFor(tx, actor, command.warehouseId, ["STORAGE", "PICK_FACE", "BULK"], command.locationId);
      await materialise(tx, actor, command.warehouseId, command.productId, from.id);
      const lot = await lotId(tx, actor, command.productId, command.lotCode);
      const toWarehouse = command.toWarehouseId ?? command.warehouseId;
      const to = await locationFor(tx, actor, toWarehouse, ["STORAGE", "PICK_FACE"], command.toLocationId);
      const toStatus = command.toStatus ?? "AVAILABLE";
      await changePosition(tx, actor, { warehouseId: command.warehouseId, locationId: from.id, productId: command.productId, lotId: lot, status: command.status ?? "AVAILABLE", delta: -command.quantity });
      await changePosition(tx, actor, { warehouseId: toWarehouse, locationId: to.id, productId: command.productId, lotId: lot, status: toStatus, delta: command.quantity });
      const ids: string[] = [];
      if (toWarehouse === command.warehouseId) {
        const movement = await tx.inventoryMovement.create({ data: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, delta: 0, reason: command.reason, shipmentId: command.shipmentId ?? null, receiptId: command.receiptId ?? null, manufacturingOrderId: command.manufacturingOrderId ?? null, workOrderId: command.workOrderId ?? null, reference: command.reference, requestKey: command.requestKey, actorUserId: actor.userId } });
        ids.push(movement.id);
      }
      if (toWarehouse !== command.warehouseId) {
        await changeBalance(tx, actor, command.warehouseId, command.productId, -command.quantity);
        await changeBalance(tx, actor, toWarehouse, command.productId, command.quantity);
        const out = await tx.inventoryMovement.create({ data: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, delta: -command.quantity, reason: command.reason, shipmentId: command.shipmentId ?? null, receiptId: command.receiptId ?? null, manufacturingOrderId: command.manufacturingOrderId ?? null, workOrderId: command.workOrderId ?? null, reference: command.reference, requestKey: `${command.requestKey}:out`, actorUserId: actor.userId } });
        const incoming = await tx.inventoryMovement.create({ data: { organisationId: actor.organisationId, warehouseId: toWarehouse, productId: command.productId, delta: command.quantity, reason: command.reason, shipmentId: command.shipmentId ?? null, receiptId: command.receiptId ?? null, manufacturingOrderId: command.manufacturingOrderId ?? null, workOrderId: command.workOrderId ?? null, reference: command.reference, requestKey: `${command.requestKey}:in`, actorUserId: actor.userId } });
        ids.push(out.id, incoming.id);
      }
      return { requestKey: command.requestKey, movementIds: ids, replayed: false };
    }).then(async (result) => {
      const destination = command.toWarehouseId ?? command.warehouseId;
      const arrived = (command.toStatus ?? "AVAILABLE") === "AVAILABLE" && (destination !== command.warehouseId || command.status === "IN_TRANSIT");
      if (arrived) await replenished(actor, command.productId, destination, `balance:${command.requestKey}`);
      return result;
    });
  },
  reportDiscrepancy(actor, input) {
    return run(async (tx) => {
      const prior = await tx.stockDiscrepancy.findUnique({ where: { organisationId_requestKey: { organisationId: actor.organisationId, requestKey: input.requestKey } } });
      if (prior) return { requestKey: input.requestKey, movementIds: [prior.id], replayed: true };
      const created = await tx.stockDiscrepancy.create({ data: { organisationId: actor.organisationId, productId: input.productId, warehouseId: input.warehouseId, locationId: input.locationId, systemQuantity: input.systemQuantity, reportedQuantity: input.reportedQuantity, sourceType: input.sourceType, sourceId: input.sourceId, requestKey: input.requestKey } });
      return { requestKey: input.requestKey, movementIds: [created.id], replayed: false };
    });
  },
};

async function replenished(actor: LogisticsActor, productId: string, warehouseId: string, requestKey: string) {
  const { stockReplenished } = await import("@/core/stock/replenishment");
  await stockReplenished(actor, { productId, warehouseId, requestKey });
}

async function receive(tx: Tx, actor: LogisticsActor, command: StockCommand, status: string, preferred = ["RECEIVING", "STORAGE"]): Promise<StockCommandResult> {
  const done = await replay(tx, actor, command.requestKey, command.productId, command.quantity);
  if (done) return done;
  await tx.product.findFirstOrThrow({ where: { id: command.productId, organisationId: actor.organisationId, kind: "PRODUCT" } });
  const place = await locationFor(tx, actor, command.warehouseId, preferred, command.locationId);
  const lot = await lotId(tx, actor, command.productId, command.lotCode);
  if (command.lotCode && status === "AVAILABLE") {
    const lotRow = await tx.stockLot.findFirst({ where: { organisationId: actor.organisationId, productId: command.productId, code: command.lotCode.trim() } });
    if (lotRow?.expiresOn && lotRow.expiresOn.getTime() < Date.now()) throw new Error("This lot is past its expiry date. Move it to quarantine unless an authorised exception is recorded.");
  }
  await changePosition(tx, actor, { warehouseId: command.warehouseId, locationId: place.id, productId: command.productId, lotId: lot, status, delta: command.quantity });
  await changeBalance(tx, actor, command.warehouseId, command.productId, command.quantity);
  for (const serial of command.serials ?? []) {
    await tx.stockSerial.upsert({
      where: { organisationId_productId_serial: { organisationId: actor.organisationId, productId: command.productId, serial } },
      create: { organisationId: actor.organisationId, productId: command.productId, serial, status: "ON_HAND", warehouseId: command.warehouseId, locationId: place.id, lotId: lot || null },
      update: { status: "ON_HAND", warehouseId: command.warehouseId, locationId: place.id },
    });
  }
  const movement = await tx.inventoryMovement.create({ data: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, delta: command.quantity, reason: command.reason, shipmentId: command.shipmentId ?? null, receiptId: command.receiptId ?? null, manufacturingOrderId: command.manufacturingOrderId ?? null, workOrderId: command.workOrderId ?? null, reference: command.reference, requestKey: command.requestKey, actorUserId: actor.userId } });
  return { requestKey: command.requestKey, movementIds: [movement.id], replayed: false };
}
