import { eligiblePositions, unreservedPositions } from "../domain/eligibility";
import { costStockTransfer } from "@/core/finance/manufacturing";
import { costStockConsumption } from "@/core/finance/manufacturing";
import { createHash } from "node:crypto";
import { measuredQuantity } from "@/core/shared/measurement";
import { validQuantity, addQuantity } from "@/core/shared/quantity";
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

async function commandFor(tx: Tx, actor: LogisticsActor, entered: StockCommand, operation: string) {
  const product = await tx.product.findFirstOrThrow({ where: { id: entered.productId, organisationId: actor.organisationId, kind: "PRODUCT" } });
  const measure = measuredQuantity(entered.quantity, entered.enteredUnit || product.unitOfMeasure, product.unitOfMeasure);
  if (product.trackingMode === "SERIAL" && (!Number.isSafeInteger(measure.quantity) || (operation !== "reserve" && new Set(entered.serials ?? []).size !== measure.quantity))) throw new Error("Serial-tracked products require a whole quantity and one unique serial per unit.");
  if (product.trackingMode !== "SERIAL" && (entered.serials?.length ?? 0) > 0) throw new Error("Serial identities can only be entered for serial-tracked products.");
  const fingerprint = createHash("sha256").update(JSON.stringify({ operation, ...entered, requestKey: undefined, serials: [...(entered.serials ?? [])].sort(), measurement: measure })).digest("hex");
  return { ...entered, quantity: measure.quantity, fingerprint, trackingMode: product.trackingMode, measurement: { enteredQuantity: measure.enteredQuantity, enteredUnit: measure.enteredUnit, baseUnit: measure.baseUnit, conversionFactor: measure.conversionFactor } };
}

async function locationFor(tx: Tx, actor: LogisticsActor, warehouseId: string, preferred: string[], explicit?: string | null) {
  const rows = await layout(tx, actor, warehouseId);
  if (explicit) {
    const match = rows.find((row) => row.id === explicit || row.code === explicit);
    if (!match) throw new Error("That location is not in this warehouse.");
    return match;
  }
  return rows.find((row) => preferred.some((capability) => row.capabilities.includes(capability))) ?? rows[0];
}

async function availability(actor: LogisticsActor, query: { productId: string; warehouseId?: string }, client: Pick<Tx, "inventoryBalance" | "stockPosition" | "stockReservation" | "stockLot" | "qualityHold" | "product"> = db): Promise<StockAvailability> {
  const where = { organisationId: actor.organisationId, productId: query.productId, ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}) };
  const [balances, positions, reservations, lots, holds, product] = await Promise.all([
    client.inventoryBalance.findMany({ where }),
    client.stockPosition.findMany({ where }),
    client.stockReservation.findMany({ where: { ...where, status: "ACTIVE" } }),
    client.stockLot.findMany({ where: { organisationId: actor.organisationId, productId: query.productId } }),
    client.qualityHold.findMany({ where: { organisationId: actor.organisationId, productId: query.productId, status: "ACTIVE", ...(query.warehouseId ? { OR: [{ warehouseId: null }, { warehouseId: query.warehouseId }] } : {}) } }),
    client.product.findFirstOrThrow({ where: { organisationId: actor.organisationId, id: query.productId } }),
  ]);
  const onHand = balances.reduce((sum, row) => addQuantity(sum, Number(row.quantity)), 0);
  const reserved = reservations.reduce((sum, row) => addQuantity(sum, Number(row.quantity)), 0);
  const quarantine = positions.filter((row) => row.status === "QUARANTINE").reduce((sum, row) => addQuantity(sum, Number(row.quantity)), 0);
  const blocked = positions.filter((row) => row.status === "BLOCKED").reduce((sum, row) => addQuantity(sum, Number(row.quantity)), 0);
  const inTransit = positions.filter((row) => row.status === "IN_TRANSIT").reduce((sum, row) => addQuantity(sum, Number(row.quantity)), 0);
  const eligible = eligiblePositions(positions.map(row => ({ ...row, quantity: Number(row.quantity) })), lots, holds, product.trackingMode);
  const eligibleQuantity = positions.length ? eligible.reduce((sum,row) => addQuantity(sum,row.quantity),0) : product.trackingMode === "NONE" && !holds.length ? onHand : 0;
  const available = Math.max(0, addQuantity(eligibleQuantity, -reserved));
  const pickable = available;
  return { productId: query.productId, warehouseId: query.warehouseId ?? null, onHand, reserved, available, pickable, quarantine, blocked, inTransit };
}

async function replay(tx: Tx, actor: LogisticsActor, requestKey: string, productId: string, quantity: number, fingerprint: string): Promise<StockCommandResult | null> {
  const prior = await tx.inventoryMovement.findMany({ where: { organisationId: actor.organisationId, requestKey: { in: [requestKey, `${requestKey}:out`, `${requestKey}:in`] } } });
  if (!prior.length) return null;
  if (prior.some((row) => row.productId !== productId)) throw new Error("This request was already used for a different product.");
  if (prior.some(row => row.requestFingerprint && row.requestFingerprint !== fingerprint)) throw new Error("This request reference already belongs to different stock movement details.");
  const moved = prior.reduce((sum, row) => addQuantity(sum, Math.abs(Number(row.delta))), 0);
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
  if (!balance || Number(balance.quantity) === 0) return;
  await tx.stockPosition.create({ data: { organisationId: actor.organisationId, warehouseId, locationId, productId, lotId: "", status: "AVAILABLE", quantity: Number(balance.quantity) } });
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
  if (!validQuantity(command.quantity) || command.quantity <= 0 || command.quantity > 1_000_000_000) throw new Error("Enter a positive quantity with up to six decimal places.");
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
    return rows.map((row): StockReservationView => ({ id: row.id, productId: row.productId, warehouseId: row.warehouseId, quantity: Number(row.quantity), sourceType: row.sourceType, sourceId: row.sourceId, status: row.status }));
  },
  requestReservation(actor, entered) {
    const command = entered;
    assertCommand(command);
    return run(async (tx) => {
      const command = await commandFor(tx, actor, entered, "reserve");
      const prior = await tx.stockReservation.findUnique({ where: { organisationId_requestKey: { organisationId: actor.organisationId, requestKey: command.requestKey } } });
      if (prior) {
        if (prior.requestFingerprint && prior.requestFingerprint !== command.fingerprint) throw new Error("This reservation reference was used for different details.");
        if (prior.productId !== command.productId || prior.warehouseId !== command.warehouseId || prior.sourceId !== (command.sourceId ?? command.requestKey) || Number(prior.quantity) !== command.quantity || prior.locationId !== (command.locationId ?? null) || prior.sourceType !== (command.sourceType ?? "FULFILMENT_LINE") || (command.lotCode && (await tx.stockLot.findFirst({where:{id:prior.lotId,organisationId:actor.organisationId}}))?.code !== command.lotCode.trim())) throw new Error("This reservation was already used for a different request.");
        return { requestKey: command.requestKey, movementIds: [prior.id], replayed: true };
      }
      const place = await locationFor(tx, actor, command.warehouseId, ["PICK_FACE", "STORAGE"], command.locationId);
      await materialise(tx, actor, command.warehouseId, command.productId, place.id);
      const [positions, lots, holds, reservations] = await Promise.all([
        tx.stockPosition.findMany({ where: { organisationId: actor.organisationId, productId: command.productId, warehouseId: command.warehouseId } }),
        tx.stockLot.findMany({ where: { organisationId: actor.organisationId, productId: command.productId } }),
        tx.qualityHold.findMany({ where: { organisationId: actor.organisationId, productId: command.productId, status: "ACTIVE" } }),
        tx.stockReservation.findMany({ where: { organisationId: actor.organisationId, productId: command.productId, warehouseId: command.warehouseId, status: "ACTIVE" } }),
      ]);
      const selectedLot = command.lotCode ? lots.find(lot => lot.code === command.lotCode?.trim()) : null;
      if (command.lotCode && !selectedLot) throw new Error("Choose an existing batch to reserve.");
      const free = unreservedPositions(eligiblePositions(positions.map(row => ({ ...row, quantity: Number(row.quantity) })), lots, holds, command.trackingMode), reservations.map(row => ({ ...row, quantity: Number(row.quantity) })));
      const pickable = free.filter(row => (!command.locationId || row.locationId === place.id) && (!selectedLot || row.lotId === selectedLot.id)).reduce((sum, row) => addQuantity(sum, row.quantity), 0);
      if (pickable < command.quantity) throw new Error("Not enough eligible unreserved stock at the selected location and batch.");
      const created = await tx.stockReservation.create({ data: { organisationId: actor.organisationId, productId: command.productId, warehouseId: command.warehouseId, locationId: command.locationId ? place.id : null, lotId: command.lotCode ? (await tx.stockLot.findFirstOrThrow({ where: { organisationId: actor.organisationId, productId: command.productId, code: command.lotCode.trim() } })).id : "", quantity: command.quantity, sourceType: command.sourceType ?? "FULFILMENT_LINE", sourceId: command.sourceId ?? command.requestKey, requestKey: command.requestKey, requestFingerprint: command.fingerprint } });
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
  async receiveStock(actor, command, transaction) {
    assertCommand(command);
    const work = (tx: Tx) => receive(tx, actor, command, command.status ?? "AVAILABLE");
    if (transaction) return work(transaction);
    const result = await run(work);
    if ((command.status ?? "AVAILABLE") === "AVAILABLE") await replenished(actor, command.productId, command.warehouseId, `balance:${command.requestKey}`);
    return result;
  },
  returnStock(actor, command, transaction) {
    assertCommand(command);
    const work = (tx: Tx) => receive(tx, actor, command, command.status ?? "QUARANTINE", ["RETURNS", "QUARANTINE"]);
    return transaction ? work(transaction) : run(work);
  },
  shipStock(actor, entered, transaction) {
    const command = entered;
    assertCommand(command);
    const work = async (tx: Tx): Promise<StockCommandResult> => {
      const command = await commandFor(tx, actor, entered, "ship");
      const done = await replay(tx, actor, command.requestKey, command.productId, command.quantity, command.fingerprint);
      if (done) return done;
      const place = await locationFor(tx, actor, command.warehouseId, ["PICK_FACE", "SHIPPING", "STORAGE"], command.locationId);
      await materialise(tx, actor, command.warehouseId, command.productId, place.id);
      const selectedLot = command.lotCode?.trim() ? await tx.stockLot.findFirstOrThrow({ where: { organisationId: actor.organisationId, productId: command.productId, code: command.lotCode.trim() } }) : null;
      const [allPositions, lots, reservations, holds, serialRows] = await Promise.all([
        tx.stockPosition.findMany({ where: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, status: "AVAILABLE", quantity: { gt: 0 } } }),
        tx.stockLot.findMany({ where: { organisationId: actor.organisationId, productId: command.productId } }),
        tx.stockReservation.findMany({ where: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, status: "ACTIVE", ...(command.sourceId ? { sourceId: { not: command.sourceId } } : {}) } }),
        tx.qualityHold.findMany({ where: { organisationId: actor.organisationId, productId: command.productId, status: "ACTIVE", OR: [{ warehouseId: null }, { warehouseId: command.warehouseId }] } }),
        tx.stockSerial.findMany({ where: { organisationId: actor.organisationId, productId: command.productId, serial: { in: command.serials ?? [] }, warehouseId: command.warehouseId, status: "ON_HAND" } }),
      ]);
      if (command.trackingMode === "SERIAL" && serialRows.length !== command.quantity) throw new Error("Every selected serial must be on hand in this warehouse.");
      const eligible = eligiblePositions(allPositions.map(row => ({ ...row, quantity: Number(row.quantity) })), lots, holds, command.trackingMode);
      const positions = unreservedPositions(eligible, reservations.map(row => ({ ...row, quantity: Number(row.quantity) }))).filter(row => (!selectedLot || row.lotId === selectedLot.id) && (!command.locationId || row.locationId === place.id));
      if (positions.reduce((sum,row) => addQuantity(sum,row.quantity),0) < command.quantity) throw new Error("Not enough available stock after expiry, quality holds and other orders’ reservations.");
      const allocations: Array<{ locationId: string; lotId: string; quantity: number; serials: string[] }> = [];
      let remainingStock = command.quantity;
      for (const position of positions) {
        if (remainingStock <= 0) break;
        const serials = serialRows.filter(row => row.locationId === position.locationId && (row.lotId ?? "") === position.lotId).map(row => row.serial);
        const take = Math.min(position.quantity, remainingStock, command.trackingMode === "SERIAL" ? serials.length : Infinity);
        if (take <= 0) continue;
        await changePosition(tx, actor, { warehouseId: command.warehouseId, locationId: position.locationId, productId: command.productId, lotId: position.lotId, status: "AVAILABLE", delta: -take });
        allocations.push({ locationId: position.locationId, lotId: position.lotId, quantity: take, serials: serials.slice(0, take) });
        remainingStock = addQuantity(remainingStock, -take);
      }
      if (remainingStock > 0) throw new Error("The selected batches, locations or serials cannot cover this movement without using reserved or held stock.");
      await changeBalance(tx, actor, command.warehouseId, command.productId, -command.quantity);
      if (command.sourceId) {
        let remaining = command.quantity;
        const reservations = await tx.stockReservation.findMany({ where: { organisationId: actor.organisationId, sourceId: command.sourceId, productId: command.productId, warehouseId: command.warehouseId, status: "ACTIVE" }, orderBy: { id: "desc" } });
        for (const reservation of reservations) {
          if (remaining <= 0) break;
          const used = Math.min(Number(reservation.quantity), remaining);
          const left = addQuantity(Number(reservation.quantity), -used);
          await tx.stockReservation.update({ where: { id: reservation.id }, data: left > 0 ? { quantity: left } : { quantity: 0, status: "CONSUMED" } });
          remaining = addQuantity(remaining, -used);
        }
      }
      for (const serial of command.serials ?? []) {
        await tx.stockSerial.updateMany({ where: { organisationId: actor.organisationId, productId: command.productId, serial, warehouseId: command.warehouseId, status: "ON_HAND" }, data: { status: "SHIPPED" } });
      }
      const movement = await tx.inventoryMovement.create({ data: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, ...command.measurement, requestFingerprint: command.fingerprint, delta: -command.quantity, reason: command.reason, shipmentId: command.shipmentId ?? null, receiptId: command.receiptId ?? null, productionReportId: command.productionReportId ?? null, manufacturingOrderId: command.manufacturingOrderId ?? null, workOrderId: command.workOrderId ?? null, reference: command.reference, requestKey: command.requestKey, actorUserId: actor.userId } });
      await tx.stockMovementAllocation.createMany({ data: allocations.map(row => ({ organisationId: actor.organisationId, movementId: movement.id, productId: command.productId, warehouseId: command.warehouseId, ...row, status: "AVAILABLE", direction: "OUT" })) });
      await costStockConsumption(actor, tx, { movementId: movement.id, warehouseId: command.warehouseId, productId: command.productId, quantity: command.quantity, productionOrderId: command.manufacturingOrderId, workOrderId: command.workOrderId, shipmentId: command.shipmentId });
      return { requestKey: command.requestKey, movementIds: [movement.id], replayed: false };
    };
    return transaction ? work(transaction) : run(work);
  },
  async stageProduction(actor, entered, tx) {
    assertCommand(entered);
    const command=await commandFor(tx,actor,entered,"stage-production");
    if (!command.manufacturingOrderId || !command.workOrderId) throw new Error("Production holding requires its production order and work order.");
    const prior=await tx.stockProductionBatch.findUnique({where:{organisationId_requestKey:{organisationId:actor.organisationId,requestKey:command.requestKey}}});
    if(prior){if(prior.manufacturingOrderId!==command.manufacturingOrderId||prior.workOrderId!==command.workOrderId||prior.warehouseId!==command.warehouseId)throw new Error("This holding request belongs to another production order.");return receive(tx,actor,{...entered,locationId:prior.locationId,lotCode:command.lotCode||command.reference},"BLOCKED");}
    const foreignBatch = await tx.stockProductionBatch.findFirst({ where: { organisationId: actor.organisationId, productId: command.productId, lotCode: command.lotCode || command.reference, manufacturingOrderId: { not: command.manufacturingOrderId } } });
    if (foreignBatch) throw new Error("Use an output batch identity belonging to this production order. Another order already uses that batch.");
    await tx.warehouse.findFirstOrThrow({where:{id:command.warehouseId,organisationId:actor.organisationId}});
    const locations=await layout(tx,actor,command.warehouseId);
    const storage=locations.find(row=>row.active&&row.capabilities.some(cap=>["STORAGE","PICK_FACE","BULK"].includes(cap)));
    if(!storage)throw new Error("Set up an active storage location before reporting production.");
    await materialise(tx,actor,command.warehouseId,command.productId,storage.id);
    const location=await tx.stockLocation.upsert({where:{warehouseId_code:{warehouseId:command.warehouseId,code:"PROD-HOLD"}},create:{organisationId:actor.organisationId,warehouseId:command.warehouseId,code:"PROD-HOLD",name:"Production holding area",capabilities:["PRODUCTION_STAGING"],sequence:45},update:{}});
    if(!location.active||location.organisationId!==actor.organisationId||!location.capabilities.includes("PRODUCTION_STAGING"))throw new Error("Review the production holding location’s setup in Inventory.");
    const result=await receive(tx,actor,{...entered,locationId:location.id,lotCode:command.lotCode||command.reference},"BLOCKED");
    // Retain the receive fingerprint, whose physical location/status are part of replay.
    await tx.stockProductionBatch.create({data:{organisationId:actor.organisationId,manufacturingOrderId:command.manufacturingOrderId,workOrderId:command.workOrderId,productionReportId:command.productionReportId,requestKey:command.requestKey,productId:command.productId,warehouseId:command.warehouseId,locationId:location.id,lotCode:command.lotCode||command.reference,serials:command.serials??[],quantity:command.quantity,createdByUserId:actor.userId}});
    return result;
  },
  executeMovement(actor, entered, transaction) {
    assertCommand(entered);
    const work = async (tx: Tx): Promise<StockCommandResult> => {
      const command = await commandFor(tx, actor, entered, "move");
      const done = await replay(tx, actor, command.requestKey, command.productId, command.quantity, command.fingerprint);
      if (done) return done;
      const from = await locationFor(tx, actor, command.warehouseId, ["STORAGE", "PICK_FACE", "BULK"], command.locationId);
      await materialise(tx, actor, command.warehouseId, command.productId, from.id);
      const lot = command.lotCode?.trim() ? (await tx.stockLot.findFirstOrThrow({ where: { organisationId: actor.organisationId, productId: command.productId, code: command.lotCode.trim() } })).id : "";
      if (command.trackingMode === "LOT" && !lot) throw new Error("Select the batch to move.");
      const toWarehouse = command.toWarehouseId ?? command.warehouseId;
      const to = await locationFor(tx, actor, toWarehouse, ["STORAGE", "PICK_FACE"], command.toLocationId);
      if (!from.active || !to.active) throw new Error("Choose active stock locations.");
      if (!transaction && [from,to].some(place=>place.capabilities.includes("PRODUCTION_STAGING"))) throw new Error("Use Production handoff to collect stock from the holding area.");
      const status = command.status ?? "AVAILABLE", toStatus = command.toStatus ?? "AVAILABLE";
      const source = await tx.stockPosition.findFirstOrThrow({ where: { organisationId: actor.organisationId, warehouseId: command.warehouseId, locationId: from.id, productId: command.productId, lotId: lot, status } });
      if (status === "AVAILABLE" && toStatus !== "QUARANTINE" && toStatus !== "BLOCKED") {
        const [lots, holds, reservations] = await Promise.all([
          tx.stockLot.findMany({ where: { organisationId: actor.organisationId, productId: command.productId } }),
          tx.qualityHold.findMany({ where: { organisationId: actor.organisationId, productId: command.productId, status: "ACTIVE" } }),
          tx.stockReservation.findMany({ where: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, status: "ACTIVE" } }),
        ]);
        const positions = await tx.stockPosition.findMany({ where: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId } });
        const free = unreservedPositions(eligiblePositions(positions.map(row => ({ ...row, quantity: Number(row.quantity) })), lots, holds, command.trackingMode), reservations.map(row => ({ ...row, quantity: Number(row.quantity) })));
        if ((free.find(row => row.id === source.id)?.quantity ?? 0) < command.quantity) throw new Error("This movement would use expired, held or reserved stock.");
      }
      if (toStatus === "AVAILABLE") {
        const held = await tx.qualityHold.count({ where: { organisationId: actor.organisationId, productId: command.productId, status: "ACTIVE", AND: [{ OR: [{ warehouseId: null }, { warehouseId: toWarehouse }] }, { OR: [{ locationId: null }, { locationId: to.id }] }, { OR: [{ lotCode: null }, { lotCode: command.lotCode || null }] }] } });
        if (held) throw new Error("Quality has an active hold on this stock. It cannot become available until authorised release.");
      }
      if (toStatus === "AVAILABLE" && lot) {
        const row = await tx.stockLot.findFirstOrThrow({ where: { id: lot, organisationId: actor.organisationId } });
        if (row.expiresOn && row.expiresOn <= new Date()) throw new Error("Expired batches must remain in quarantine.");
      }
      if (command.trackingMode === "SERIAL") {
        const serials = await tx.stockSerial.findMany({ where: { organisationId: actor.organisationId, productId: command.productId, warehouseId: command.warehouseId, locationId: from.id, lotId: lot || null, status: "ON_HAND", serial: { in: command.serials ?? [] } } });
        if (serials.length !== command.quantity) throw new Error("Every serial must be on hand at the selected source location and batch.");
      }
      await changePosition(tx, actor, { warehouseId: command.warehouseId, locationId: from.id, productId: command.productId, lotId: lot, status, delta: -command.quantity });
      await changePosition(tx, actor, { warehouseId: toWarehouse, locationId: to.id, productId: command.productId, lotId: lot, status: toStatus, delta: command.quantity });
      if (command.trackingMode === "SERIAL") await tx.stockSerial.updateMany({ where: { organisationId: actor.organisationId, productId: command.productId, serial: { in: command.serials ?? [] }, warehouseId: command.warehouseId, locationId: from.id, status: "ON_HAND" }, data: { warehouseId: toWarehouse, locationId: to.id } });
      const common = { organisationId: actor.organisationId, productId: command.productId, ...command.measurement, requestFingerprint: command.fingerprint, reason: command.reason, reference: command.reference, actorUserId: actor.userId };
      const out = await tx.inventoryMovement.create({ data: { ...common, warehouseId: command.warehouseId, delta: toWarehouse === command.warehouseId ? 0 : -command.quantity, requestKey: toWarehouse === command.warehouseId ? command.requestKey : `${command.requestKey}:out` } });
      let incoming = out;
      if (toWarehouse !== command.warehouseId) {
        await changeBalance(tx, actor, command.warehouseId, command.productId, -command.quantity);
        await changeBalance(tx, actor, toWarehouse, command.productId, command.quantity);
        incoming = await tx.inventoryMovement.create({ data: { ...common, warehouseId: toWarehouse, delta: command.quantity, requestKey: `${command.requestKey}:in` } });
        await costStockTransfer(actor, tx, { productId: command.productId, quantity: command.quantity, fromWarehouseId: command.warehouseId, toWarehouseId: toWarehouse, outMovementId: out.id, inMovementId: incoming.id });
      }
      await tx.stockMovementAllocation.createMany({ data: [
        { organisationId: actor.organisationId, movementId: out.id, productId: command.productId, warehouseId: command.warehouseId, locationId: from.id, lotId: lot, serials: command.serials ?? [], quantity: command.quantity, status, direction: "OUT" },
        { organisationId: actor.organisationId, movementId: incoming.id, productId: command.productId, warehouseId: toWarehouse, locationId: to.id, lotId: lot, serials: command.serials ?? [], quantity: command.quantity, status: toStatus, direction: "IN" },
      ] });
      return { requestKey: command.requestKey, movementIds: incoming.id === out.id ? [out.id] : [out.id, incoming.id], replayed: false };
    };
    if (transaction) return work(transaction);
    return run(work).then(async result => {
      if ((entered.toStatus ?? "AVAILABLE") === "AVAILABLE") await replenished(actor, entered.productId, entered.toWarehouseId ?? entered.warehouseId, `balance:${entered.requestKey}`);
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

async function receive(tx: Tx, actor: LogisticsActor, entered: StockCommand, status: string, preferred = ["RECEIVING", "STORAGE"]): Promise<StockCommandResult> {
  const command = await commandFor(tx, actor, entered, `receive:${status}`);
  const done = await replay(tx, actor, command.requestKey, command.productId, command.quantity, command.fingerprint);
  if (done) return done;
  await tx.product.findFirstOrThrow({ where: { id: command.productId, organisationId: actor.organisationId, kind: "PRODUCT" } });
  if (command.trackingMode === "LOT" && !command.lotCode?.trim()) throw new Error("Enter the supplier or production batch for this lot-tracked product.");
  if ((command.lotCode?.length ?? 0) > 80) throw new Error("Batch references can contain up to 80 characters.");
  const place = await locationFor(tx, actor, command.warehouseId, preferred, command.locationId);
  const lot = await lotId(tx, actor, command.productId, command.lotCode);
  if (command.lotCode && status === "AVAILABLE") {
    const lotRow = await tx.stockLot.findFirst({ where: { organisationId: actor.organisationId, productId: command.productId, code: command.lotCode.trim() } });
    if (lotRow?.expiresOn && lotRow.expiresOn.getTime() < Date.now()) throw new Error("This lot is past its expiry date. Move it to quarantine unless an authorised exception is recorded.");
  }
  await changePosition(tx, actor, { warehouseId: command.warehouseId, locationId: place.id, productId: command.productId, lotId: lot, status, delta: command.quantity });
  await changeBalance(tx, actor, command.warehouseId, command.productId, command.quantity);
  for (const serial of command.serials ?? []) {
    const previous = await tx.stockSerial.findUnique({ where: { organisationId_productId_serial: { organisationId: actor.organisationId, productId: command.productId, serial } } });
    if (previous?.status === "ON_HAND") throw new Error(`Serial ${serial} is already on hand. Use a transfer to move it.`);
    await tx.stockSerial.upsert({
      where: { organisationId_productId_serial: { organisationId: actor.organisationId, productId: command.productId, serial } },
      create: { organisationId: actor.organisationId, productId: command.productId, serial, status: "ON_HAND", warehouseId: command.warehouseId, locationId: place.id, lotId: lot || null },
      update: { status: "ON_HAND", warehouseId: command.warehouseId, locationId: place.id, lotId: lot || null },
    });
  }
  const movement = await tx.inventoryMovement.create({ data: { organisationId: actor.organisationId, warehouseId: command.warehouseId, productId: command.productId, ...command.measurement, requestFingerprint: command.fingerprint, delta: command.quantity, reason: command.reason, shipmentId: command.shipmentId ?? null, receiptId: command.receiptId ?? null, productionReportId: command.productionReportId ?? null, manufacturingOrderId: command.manufacturingOrderId ?? null, workOrderId: command.workOrderId ?? null, reference: command.reference, requestKey: command.requestKey, actorUserId: actor.userId } });
  await tx.stockMovementAllocation.create({ data: { organisationId: actor.organisationId, movementId: movement.id, productId: command.productId, warehouseId: command.warehouseId, locationId: place.id, lotId: lot, serials: command.serials ?? [], status, direction: "IN", quantity: command.quantity } });
  return { requestKey: command.requestKey, movementIds: [movement.id], replayed: false };
}
