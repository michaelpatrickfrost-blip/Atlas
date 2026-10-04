import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { unitsPerPallet } from "@/core/products/physical";
import { addressPart, chosenCourierColumns, DEFAULT_HANDLING_TYPES, nestDecision, packQuantity, palletLimit } from "../domain/handling";
import { createShipment } from "./shipping";
import { milestone, nextReference } from "./numbers";

type TypeInput = { code: string; name: string; lengthMm: number; widthMm: number; heightMm: number; tareWeightGrams: number; canContain: boolean };

function cleanCode(value: string) {
  const code = value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24);
  if (!code) throw new Error("Enter a short code for this handling unit.");
  return code;
}

function millimetres(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 20000) throw new Error(`Enter ${label} in millimetres.`);
  return value;
}

export async function skuPacks(organisationId: string, productIds: string[]) {
  const ids = [...new Set(productIds)].filter(Boolean);
  if (!ids.length) return new Map<string, { code: string; perPallet: number | null; unit: string }>();
  const products = await db.product.findMany({ where: { organisationId, id: { in: ids } }, select: { id: true, code: true, unitOfMeasure: true, unitsPerPack: true, packsPerLayer: true, layersPerPallet: true } });
  return new Map(products.map((product) => [product.id, { code: product.code, perPallet: unitsPerPallet(product), unit: product.unitOfMeasure }]));
}

export async function handlingTypes(organisationId: string) {
  const rows = await db.handlingUnitType.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
  if (rows.length) return rows;
  if (process.env.ATLAS_RUNTIME === "desktop") return DEFAULT_HANDLING_TYPES.map((type, index) => ({ ...type, id: `default-${index}`, organisationId, active: true }));
  await db.handlingUnitType.createMany({ data: DEFAULT_HANDLING_TYPES.map((type) => ({ ...type, organisationId })), skipDuplicates: true });
  return db.handlingUnitType.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
}

export async function saveHandlingType(session: Session, input: TypeInput & { active?: boolean }) {
  const code = cleanCode(input.code);
  const name = input.name.trim().slice(0, 80);
  if (!name) throw new Error("Name this handling unit.");
  const data = {
    name,
    lengthMm: millimetres(input.lengthMm, "the length"),
    widthMm: millimetres(input.widthMm, "the width"),
    heightMm: millimetres(input.heightMm, "the height"),
    tareWeightGrams: Number.isSafeInteger(input.tareWeightGrams) && input.tareWeightGrams >= 0 ? input.tareWeightGrams : 0,
    canContain: input.canContain,
    active: input.active ?? true,
  };
  await db.handlingUnitType.upsert({
    where: { organisationId_code: { organisationId: session.organisationId, code } },
    create: { organisationId: session.organisationId, code, ...data },
    update: data,
  });
}

export async function retireHandlingType(session: Session, code: string) {
  await handlingTypes(session.organisationId);
  const type = await db.handlingUnitType.findFirst({ where: { organisationId: session.organisationId, code: cleanCode(code) } });
  if (!type) throw new Error("That handling unit type is no longer in the catalogue.");
  await db.handlingUnitType.update({ where: { id: type.id }, data: { active: false } });
}

export async function removeHandlingType(session: Session, code: string) {
  await handlingTypes(session.organisationId);
  const type = await db.handlingUnitType.findFirst({ where: { organisationId: session.organisationId, code: cleanCode(code) } });
  if (!type) return;
  const used = await db.logisticsPackage.count({ where: { organisationId: session.organisationId, typeCode: type.code } });
  if (used) throw new Error(`${type.name} is already on a packed unit. Retire it instead of deleting it.`);
  await db.handlingUnitType.delete({ where: { id: type.id } });
}

export async function packOntoUnit(session: Session, input: { taskId: string; typeCode: string; parentId?: string; lengthMm?: number; widthMm?: number; heightMm?: number; weightGrams?: number; lines: Array<{ taskLineId: string; quantity: number }> }) {
  const types = await handlingTypes(session.organisationId);
  const type = types.find((item) => item.code === cleanCode(input.typeCode) && item.active);
  if (!type) throw new Error("Choose a handling unit type. Retired types stay on history and cannot be packed onto.");
  const task = await db.warehouseTask.findFirst({ where: { id: input.taskId, organisationId: session.organisationId, kind: "PACK" }, include: { lines: true, requirement: true } });
  if (!task?.requirementId || !task.requirement) throw new Error("This pack is no longer on the board.");
  if (task.status === "COMPLETE") throw new Error("This pack is already complete.");
  const chosen = input.lines.filter((line) => line.quantity > 0);
  if (!chosen.length) throw new Error("Enter a quantity to pack.");
  const parent = input.parentId ? await db.logisticsPackage.findFirst({ where: { id: input.parentId, organisationId: session.organisationId } }) : null;
  if (input.parentId) {
    if (!parent) throw new Error("That pallet is no longer on this order.");
    const parentType = types.find((item) => item.code === (parent?.typeCode ?? parent?.packageType));
    const decision = nestDecision({ parentCanContain: parentType?.canContain ?? false, parentStatus: parent.status, sameOrder: parent.requirementId === task.requirementId });
    if (!decision.ok) throw new Error(decision.message);
  }
  const fulfilmentLines = await db.fulfilmentLine.findMany({ where: { organisationId: session.organisationId, id: { in: task.lines.map((line) => line.fulfilmentLineId).filter((id): id is string => Boolean(id)) } } });
  const products = await db.product.findMany({ where: { organisationId: session.organisationId, id: { in: task.lines.map((line) => line.productId).filter((id): id is string => Boolean(id)) } }, select: { id: true, code: true, grossWeightGrams: true, unitsPerPack: true, packsPerLayer: true, layersPerPallet: true } });
  const packageId = await db.$transaction(async (tx) => {
    const lengthMm = input.lengthMm || type.lengthMm;
    const widthMm = input.widthMm || type.widthMm;
    const heightMm = input.heightMm || type.heightMm;
    const created = await tx.logisticsPackage.create({ data: {
      organisationId: session.organisationId,
      reference: await nextReference(tx, session.organisationId, "HU", type.code === "PALLET" ? "PAL" : "HU"),
      requirementId: task.requirementId,
      parentId: parent?.id,
      packageType: type.code,
      typeCode: type.code,
      status: "PACKED",
      lengthMm, widthMm, heightMm,
      tareWeightGrams: type.tareWeightGrams,
      packedByUserId: session.userId,
      packedAt: new Date(),
    } });
    let goodsGrams = type.tareWeightGrams;
    for (const row of chosen) {
      const line = task.lines.find((item) => item.id === row.taskLineId);
      if (!line?.fulfilmentLineId) throw new Error("One of those lines is no longer on this pack.");
      const fulfilment = fulfilmentLines.find((item) => item.id === line.fulfilmentLineId);
      if (!fulfilment) throw new Error("That order line is no longer open.");
      const decision = packQuantity({ picked: fulfilment.pickedQuantity, packed: fulfilment.packedQuantity, requested: row.quantity });
      if (!decision.ok) throw new Error(`${line.productCode || line.description}: ${decision.message}`);
      const product = products.find((item) => item.id === line.productId);
      const fit = palletLimit(type.code, decision.quantity, product ? unitsPerPallet(product) : null);
      if (!fit.ok) throw new Error(`${product?.code ?? line.description}: ${fit.message}`);
      goodsGrams += (product?.grossWeightGrams ?? 0) * decision.quantity;
      await tx.packageContent.create({ data: { organisationId: session.organisationId, packageId: created.id, productId: line.productId, description: line.description, quantity: decision.quantity, lotCode: line.lotCode, serials: line.serials, fulfilmentLineId: line.fulfilmentLineId } });
      await tx.fulfilmentLine.update({ where: { id: fulfilment.id }, data: { packedQuantity: { increment: decision.quantity } } });
      const confirmed = line.confirmedQuantity + decision.quantity;
      await tx.warehouseTaskLine.update({ where: { id: line.id }, data: { confirmedQuantity: confirmed, status: confirmed >= line.requiredQuantity ? "DONE" : "LOCATED" } });
      fulfilment.packedQuantity += decision.quantity;
      line.confirmedQuantity = confirmed;
    }
    const weightGrams = input.weightGrams && input.weightGrams > 0 ? input.weightGrams : goodsGrams || null;
    await tx.logisticsPackage.update({ where: { id: created.id }, data: { weightGrams, barcode: created.reference, expectedWeightGrams: goodsGrams || null } });
    return created.id;
  });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.package.created", entityType: "LogisticsPackage", entityId: packageId, summary: `${type.name} packed for ${task.requirement.reference}`, partyId: task.requirement.partyId, event: "logisticsPackageCreated", eventKey: `logistics.package.created:${packageId}`, payload: { packageId, requirementId: task.requirementId } });
  return packageId;
}

export async function finishPack(session: Session, taskId: string) {
  const task = await db.warehouseTask.findFirst({ where: { id: taskId, organisationId: session.organisationId, kind: "PACK" }, include: { lines: true, requirement: true } });
  if (!task?.requirementId || !task.requirement) throw new Error("This pack is no longer on the board.");
  if (task.status === "COMPLETE") return;
  if (task.lines.some((line) => line.status === "OPEN" || line.status === "LOCATED")) throw new Error("Pack the remaining quantity onto a handling unit before completing this work.");
  const lines = await db.fulfilmentLine.findMany({ where: { organisationId: session.organisationId, requirementId: task.requirementId } });
  const quantities = lines.map((line) => ({ fulfilmentLineId: line.id, quantity: line.packedQuantity - line.shippedQuantity })).filter((line) => line.quantity > 0);
  if (!quantities.length) throw new Error("Nothing has been packed onto a handling unit yet.");
  const shipmentId = await createShipment(session, task.requirementId, quantities);
  await db.logisticsPackage.updateMany({ where: { organisationId: session.organisationId, requirementId: task.requirementId, shipmentId: null }, data: { shipmentId, status: "STAGED" } });
  await db.warehouseTask.update({ where: { id: task.id }, data: { status: "COMPLETE", completedAt: new Date(), shipmentId } });
  await db.fulfilmentRequirement.update({ where: { id: task.requirementId }, data: { status: "STAGED" } });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.pack.completed", entityType: "WarehouseTask", entityId: task.id, summary: `${task.requirement.reference} packed`, partyId: task.requirement.partyId, event: "logisticsPackCompleted", eventKey: `logistics.pack.completed:${task.id}`, payload: { taskId, shipmentId } });
  return shipmentId;
}

export async function courierRecords(organisationId: string, shipmentIds: string[]) {
  const ids = [...new Set(shipmentIds)].slice(0, 200);
  if (!ids.length) return [];
  const shipments = await db.shipment.findMany({
    where: { organisationId, id: { in: ids } },
    include: {
      party: { select: { name: true } },
      packages: { include: { contents: true, parent: { select: { reference: true } } } },
      sources: { include: { line: true, requirement: { include: { salesOrder: { select: { reference: true, customerPoReference: true, requestedDeliveryDate: true, promisedDeliveryDate: true, deliveryInstructions: true } } } } } },
    },
  });
  const productIds = shipments.flatMap((shipment) => shipment.packages.flatMap((box) => box.contents.map((content) => content.productId).filter((id): id is string => Boolean(id))));
  const products = await db.product.findMany({ where: { organisationId, id: { in: productIds } }, select: { id: true, code: true, unitOfMeasure: true, unitsPerPack: true, packsPerLayer: true, layersPerPallet: true } });
  const records: Array<Record<string, string | number>> = [];
  for (const shipment of shipments) {
    const source = shipment.sources[0];
    const order = source?.requirement.salesOrder;
    const when = shipment.expectedDeliveryAt ?? order?.promisedDeliveryDate ?? order?.requestedDeliveryDate ?? source?.requirement.promisedOn ?? source?.requirement.requestedOn;
    const shared = {
      shipment: shipment.reference,
      customer: shipment.party.name,
      customerPo: order?.customerPoReference ?? "",
      order: order?.reference ?? source?.requirement.reference ?? "",
      deliveryDate: when ? when.toLocaleDateString("en-GB") : "",
      address1: addressPart(shipment.shipTo, "line1"),
      address2: addressPart(shipment.shipTo, "line2"),
      city: addressPart(shipment.shipTo, "city"),
      region: addressPart(shipment.shipTo, "region"),
      postcode: addressPart(shipment.shipTo, "postcode"),
      country: addressPart(shipment.shipTo, "country"),
      instructions: order?.deliveryInstructions ?? source?.requirement.shippingInstructions ?? "",
      carrier: shipment.carrierCode,
      service: shipment.serviceLevel,
      tracking: shipment.trackingNumber ?? "",
    };
    const packed = shipment.packages.flatMap((box) => box.contents.map((content) => ({ box, content })));
    if (!packed.length) {
      for (const row of shipment.sources) records.push({ ...shared, itemCode: "", item: row.line.description, quantity: row.quantity, itemsPerPallet: "", unit: row.line.unitOfMeasure, handlingUnit: "", handlingType: "", parentUnit: "", lengthMm: "", widthMm: "", heightMm: "", weightKg: "" });
      if (!shipment.sources.length) records.push({ ...shared, itemCode: "", item: "", quantity: "", itemsPerPallet: "", unit: "", handlingUnit: "", handlingType: "", parentUnit: "", lengthMm: "", widthMm: "", heightMm: "", weightKg: "" });
      continue;
    }
    for (const { box, content } of packed) {
      const product = products.find((item) => item.id === content.productId);
      records.push({
        ...shared,
        itemCode: product?.code ?? "",
        item: content.description,
        quantity: content.quantity,
        itemsPerPallet: product ? unitsPerPallet(product) ?? "" : "",
        unit: product?.unitOfMeasure ?? "",
        handlingUnit: box.reference,
        handlingType: box.typeCode ?? box.packageType,
        parentUnit: box.parent?.reference ?? "",
        lengthMm: box.lengthMm ?? "",
        widthMm: box.widthMm ?? "",
        heightMm: box.heightMm ?? "",
        weightKg: box.weightGrams ? (box.weightGrams / 1000).toFixed(1) : "",
      });
    }
  }
  return records;
}

export { chosenCourierColumns };
