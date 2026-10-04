import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { moveTiming, placeCode, placeKind, starterLocations } from "../domain/places";

function label(value: string, empty: string, maximum: number) {
  const cleaned = value.trim().slice(0, maximum);
  if (!cleaned) throw new Error(empty);
  return cleaned;
}

function whole(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000) throw new Error("Enter a positive whole quantity up to 1,000,000.");
  return value;
}

export async function createSite(session: Session, name: string, code: string) {
  await db.site.create({ data: { organisationId: session.organisationId, name: label(name, "Name the site.", 80), code: placeCode(code) } });
}

export async function createPlace(session: Session, input: { name: string; code: string; kind: string; siteId: string }) {
  const kind = placeKind(input.kind);
  const siteId = input.siteId.trim();
  if (siteId) {
    const site = await db.site.findFirst({ where: { id: siteId, organisationId: session.organisationId } });
    if (!site) throw new Error("Choose a site in this company.");
  }
  await db.$transaction(async (tx) => {
    const place = await tx.warehouse.create({ data: { organisationId: session.organisationId, name: label(input.name, "Name the warehouse or yard.", 150), code: placeCode(input.code), kind, siteId: siteId || null } });
    for (const row of starterLocations(kind)) {
      await tx.stockLocation.create({ data: { organisationId: session.organisationId, warehouseId: place.id, code: row.code, name: row.name, capabilities: row.capabilities, sequence: row.sequence } });
    }
  });
}

export async function assignSite(session: Session, placeId: string, siteId: string) {
  const place = await db.warehouse.findFirst({ where: { id: placeId, organisationId: session.organisationId } });
  if (!place) throw new Error("That place is not in this company.");
  const next = siteId.trim();
  if (next) {
    const site = await db.site.findFirst({ where: { id: next, organisationId: session.organisationId } });
    if (!site) throw new Error("Choose a site in this company.");
  }
  await db.warehouse.update({ where: { id: place.id }, data: { siteId: next || null } });
}

export async function addLocation(session: Session, placeId: string, name: string, code: string) {
  const place = await db.warehouse.findFirst({ where: { id: placeId, organisationId: session.organisationId } });
  if (!place) throw new Error("That place is not in this company.");
  const count = await db.stockLocation.count({ where: { warehouseId: place.id } });
  await db.stockLocation.create({ data: { organisationId: session.organisationId, warehouseId: place.id, code: placeCode(code), name: label(name, "Name the location.", 80), capabilities: ["STORAGE"], sequence: 100 + count } });
}

export async function ensureStarterLocations(session: Session, placeId: string) {
  const place = await db.warehouse.findFirst({ where: { id: placeId, organisationId: session.organisationId } });
  if (!place) throw new Error("That place is not in this company.");
  const existing = await db.stockLocation.count({ where: { warehouseId: place.id } });
  if (existing) return;
  await db.stockLocation.createMany({ data: starterLocations(place.kind === "YARD" ? "YARD" : "WAREHOUSE").map((row) => ({ organisationId: session.organisationId, warehouseId: place.id, code: row.code, name: row.name, capabilities: row.capabilities, sequence: row.sequence })) });
}

export async function retireLocation(session: Session, locationId: string) {
  const location = await db.stockLocation.findFirst({ where: { id: locationId, organisationId: session.organisationId }, include: { positions: { where: { quantity: { gt: 0 } } } } });
  if (!location) throw new Error("That location is not in this company.");
  if (location.positions.length) throw new Error("Move the stock off this location before retiring it.");
  const active = await db.stockLocation.count({ where: { warehouseId: location.warehouseId, active: true } });
  if (location.active && active <= 1) throw new Error("Keep at least one location in this place.");
  await db.stockLocation.update({ where: { id: location.id }, data: { active: false } });
}

export async function readPlace(session: Session, placeId: string) {
  const place = await db.warehouse.findFirst({
    where: { id: placeId, organisationId: session.organisationId },
    include: { site: true, locations: { orderBy: { sequence: "asc" } } },
  });
  if (!place) return null;
  const [positions, balances, products] = await Promise.all([
    db.stockPosition.findMany({ where: { organisationId: session.organisationId, warehouseId: place.id, quantity: { gt: 0 } }, include: { product: { select: { id: true, code: true, name: true, unitOfMeasure: true } } } }),
    db.inventoryBalance.findMany({ where: { organisationId: session.organisationId, warehouseId: place.id } }),
    db.product.findMany({ where: { organisationId: session.organisationId, kind: "PRODUCT", active: true }, select: { id: true, code: true, name: true, unitOfMeasure: true }, orderBy: { name: "asc" } }),
  ]);
  const located = new Map<string, number>();
  for (const row of positions) located.set(row.productId, (located.get(row.productId) ?? 0) + row.quantity);
  const unlocated = balances.flatMap((balance) => {
    const loose = balance.quantity - (located.get(balance.productId) ?? 0);
    return loose > 0 ? [{ productId: balance.productId, quantity: loose }] : [];
  });
  return { place, positions, unlocated, products };
}

export async function productLocations(session: Session, productId: string) {
  const [positions, balances, moves] = await Promise.all([
    db.stockPosition.findMany({ where: { organisationId: session.organisationId, productId, quantity: { gt: 0 } }, include: { location: true, warehouse: { include: { site: true } } }, orderBy: { quantity: "desc" } }),
    db.inventoryBalance.findMany({ where: { organisationId: session.organisationId, productId, quantity: { gt: 0 } }, include: { warehouse: { include: { site: true } } } }),
    db.internalMove.findMany({ where: { organisationId: session.organisationId, productId, status: "IN_TRANSIT" }, include: { toWarehouse: { include: { site: true } }, fromWarehouse: { include: { site: true } } } }),
  ]);
  const located = new Map<string, number>();
  for (const row of positions) located.set(row.warehouseId, (located.get(row.warehouseId) ?? 0) + row.quantity);
  const loose = balances.flatMap((balance) => {
    const quantity = balance.quantity - (located.get(balance.warehouseId) ?? 0);
    return quantity > 0 ? [{ warehouse: balance.warehouse, quantity }] : [];
  });
  return { positions, loose, moves };
}

export async function putOnLocation(session: Session, input: { locationId: string; productId: string; quantity: number; requestKey: string }) {
  const quantity = whole(input.quantity);
  if (!input.requestKey || input.requestKey.length > 100) throw new Error("A movement reference is required.");
  await db.$transaction(async (tx) => {
    const prior = await tx.inventoryMovement.findUnique({ where: { organisationId_requestKey: { organisationId: session.organisationId, requestKey: input.requestKey } } });
    if (prior) return;
    const location = await tx.stockLocation.findFirst({ where: { id: input.locationId, organisationId: session.organisationId, active: true } });
    if (!location) throw new Error("Choose an active location.");
    await tx.product.findFirstOrThrow({ where: { id: input.productId, organisationId: session.organisationId, kind: "PRODUCT", active: true } });
    const [balance, positions] = await Promise.all([
      tx.inventoryBalance.findUnique({ where: { warehouseId_productId: { warehouseId: location.warehouseId, productId: input.productId } } }),
      tx.stockPosition.findMany({ where: { organisationId: session.organisationId, warehouseId: location.warehouseId, productId: input.productId } }),
    ]);
    const loose = (balance?.quantity ?? 0) - positions.reduce((sum, row) => sum + row.quantity, 0);
    if (quantity > loose) throw new Error("There is not that much stock waiting to be placed.");
    await tx.stockPosition.upsert({
      where: { warehouseId_locationId_productId_lotId_status: { warehouseId: location.warehouseId, locationId: location.id, productId: input.productId, lotId: "", status: "AVAILABLE" } },
      create: { organisationId: session.organisationId, warehouseId: location.warehouseId, locationId: location.id, productId: input.productId, quantity },
      update: { quantity: { increment: quantity } },
    });
    await tx.inventoryMovement.create({ data: { organisationId: session.organisationId, warehouseId: location.warehouseId, productId: input.productId, delta: 0, reason: `Placed in ${location.name}`, reference: location.code, requestKey: input.requestKey, actorUserId: session.userId } });
  }, { isolationLevel: "Serializable" });
}

export async function moveLocated(session: Session, input: { productId: string; fromLocationId: string; toLocationId: string; quantity: number; reason: string; requestKey: string }) {
  const quantity = whole(input.quantity);
  const reason = label(input.reason, "Enter a reason.", 1000);
  if (!input.requestKey || input.requestKey.length > 100) throw new Error("A movement reference is required.");
  if (input.fromLocationId === input.toLocationId) throw new Error("Choose two different locations.");
  await db.$transaction(async (tx) => {
    const organisationId = session.organisationId;
    const already = await tx.internalMove.findUnique({ where: { organisationId_requestKey: { organisationId, requestKey: input.requestKey } } });
    if (already) return;
    const prior = await tx.inventoryMovement.findFirst({ where: { organisationId, requestKey: { in: [input.requestKey, `${input.requestKey}:out`] } } });
    if (prior) return;
    const locations = await tx.stockLocation.findMany({ where: { organisationId, id: { in: [input.fromLocationId, input.toLocationId] }, active: true }, include: { warehouse: { select: { id: true, siteId: true, name: true } } } });
    const from = locations.find((row) => row.id === input.fromLocationId);
    const to = locations.find((row) => row.id === input.toLocationId);
    if (!from || !to) throw new Error("Choose two locations in this company.");
    await tx.product.findFirstOrThrow({ where: { id: input.productId, organisationId, kind: "PRODUCT", active: true } });
    const taken = await tx.stockPosition.updateMany({ where: { organisationId, warehouseId: from.warehouseId, locationId: from.id, productId: input.productId, lotId: "", status: "AVAILABLE", quantity: { gte: quantity } }, data: { quantity: { decrement: quantity } } });
    if (taken.count !== 1) throw new Error("That location does not have enough of this product.");
    const timing = from.warehouseId === to.warehouseId ? "now" : moveTiming(from.warehouse.siteId, to.warehouse.siteId);
    if (timing === "transit") {
      const issued = await tx.inventoryBalance.updateMany({ where: { organisationId, warehouseId: from.warehouseId, productId: input.productId, quantity: { gte: quantity } }, data: { quantity: { decrement: quantity } } });
      if (issued.count !== 1) throw new Error("The source place does not have enough stock.");
      const count = await tx.internalMove.count({ where: { organisationId } });
      const move = await tx.internalMove.create({ data: { organisationId, reference: `MV-${String(count + 1).padStart(4, "0")}`, productId: input.productId, fromWarehouseId: from.warehouseId, toWarehouseId: to.warehouseId, fromLocationId: from.id, toLocationId: to.id, quantity, reason, requestKey: input.requestKey, actorUserId: session.userId } });
      await tx.inventoryMovement.create({ data: { organisationId, warehouseId: from.warehouseId, productId: input.productId, delta: -quantity, reason: `In transit · ${reason}`, reference: move.reference, requestKey: `${input.requestKey}:out`, actorUserId: session.userId } });
      return;
    }
    await tx.stockPosition.upsert({
      where: { warehouseId_locationId_productId_lotId_status: { warehouseId: to.warehouseId, locationId: to.id, productId: input.productId, lotId: "", status: "AVAILABLE" } },
      create: { organisationId, warehouseId: to.warehouseId, locationId: to.id, productId: input.productId, quantity },
      update: { quantity: { increment: quantity } },
    });
    if (from.warehouseId !== to.warehouseId) {
      const issued = await tx.inventoryBalance.updateMany({ where: { organisationId, warehouseId: from.warehouseId, productId: input.productId, quantity: { gte: quantity } }, data: { quantity: { decrement: quantity } } });
      if (issued.count !== 1) throw new Error("The source place does not have enough stock.");
      await tx.inventoryBalance.upsert({ where: { warehouseId_productId: { warehouseId: to.warehouseId, productId: input.productId } }, create: { organisationId, warehouseId: to.warehouseId, productId: input.productId, quantity }, update: { quantity: { increment: quantity } } });
      await tx.inventoryMovement.create({ data: { organisationId, warehouseId: from.warehouseId, productId: input.productId, delta: -quantity, reason: `Transfer out · ${reason}`, reference: to.code, requestKey: `${input.requestKey}:out`, actorUserId: session.userId } });
      await tx.inventoryMovement.create({ data: { organisationId, warehouseId: to.warehouseId, productId: input.productId, delta: quantity, reason: `Transfer in · ${reason}`, reference: from.code, requestKey: `${input.requestKey}:in`, actorUserId: session.userId } });
      return;
    }
    await tx.inventoryMovement.create({ data: { organisationId, warehouseId: from.warehouseId, productId: input.productId, delta: 0, reason: `Moved from ${from.name} to ${to.name}`, reference: to.code, requestKey: input.requestKey, actorUserId: session.userId } });
  }, { isolationLevel: "Serializable" });
}
