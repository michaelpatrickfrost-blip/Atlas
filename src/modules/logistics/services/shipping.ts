import { addQuantity } from "@/core/shared/quantity";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assessOtif, dispatchMovesToDelivery, matchCarrier, normalisedTracking, postcodeOf, weightVariance } from "../domain/operations";
import { milestone, nextReference, policyFor, stock } from "./numbers";

export async function createShipment(session: Session, requirementId: string, lineQuantities: Array<{ fulfilmentLineId: string; quantity: number }>) {
  const requirement = await db.fulfilmentRequirement.findFirst({ where: { id: requirementId, organisationId: session.organisationId }, include: { lines: true, party: true } });
  if (!requirement) throw new Error("This fulfilment no longer exists.");
  if (requirement.holdSummary) throw new Error(`Blocked\n\n${requirement.holdSummary}`);
  if (!requirement.partialPolicy && lineQuantities.some((row) => {
    const line = requirement.lines.find((item) => item.id === row.fulfilmentLineId);
    return line && row.quantity < Number(line.orderedQuantity) - Number(line.cancelledQuantity) - Number(line.shippedQuantity);
  })) throw new Error("This customer is set to deliver complete. Ship the whole order, or ask Sales to allow a partial delivery.");
  const rules = await db.carrierRule.findMany({ where: { organisationId: session.organisationId, active: true } });
  const units = await db.logisticsPackage.findMany({ where: { organisationId: session.organisationId, requirementId } });
  const pallet = units.some((unit) => ["PALLET", "STILLAGE", "ROLL_CAGE", "CONTAINER"].includes(unit.typeCode ?? unit.packageType));
  const choice = matchCarrier(rules.map((rule) => ({ ...rule, match: rule.match as { maxWeightGrams?: number; customerId?: string; region?: string; pallet?: boolean } })), { weightGrams: units.reduce((sum, unit) => sum + (unit.weightGrams ?? 0), 0) || null, customerId: requirement.partyId, region: postcodeOf(requirement.shipTo), pallet });
  const shipmentId = await db.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({ data: { organisationId: session.organisationId, reference: await nextReference(tx, session.organisationId, "SH", "SH"), partyId: requirement.partyId, shipTo: requirement.shipTo ?? {}, status: "READY", carrierCode: choice.carrierCode, carrierReason: choice.explanation, serviceLevel: requirement.serviceLevel || choice.serviceLevel, plannedDispatchAt: requirement.promisedOn, expectedDeliveryAt: requirement.promisedOn } });
    for (const row of lineQuantities) {
      const line = requirement.lines.find((item) => item.id === row.fulfilmentLineId);
      const cap = line && Number(line.packedQuantity) > 0 ? Math.min(Number(line.pickedQuantity), Number(line.packedQuantity)) : Number(line?.pickedQuantity ?? 0);
      const open = cap - (Number(line?.shippedQuantity ?? 0));
      if (!line || row.quantity <= 0 || row.quantity > open) throw new Error("A shipment line is larger than the picked quantity still to ship.");
      await tx.shipmentSource.create({ data: { organisationId: session.organisationId, shipmentId: shipment.id, requirementId, salesOrderId: requirement.salesOrderId, fulfilmentLineId: line.id, quantity: row.quantity } });
    }
    return shipment.id;
  });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.shipment.created", entityType: "Shipment", entityId: shipmentId, summary: `Shipment created for ${requirement.party.name}`, partyId: requirement.partyId, event: "logisticsShipmentCreated", eventKey: `logistics.shipment.created:${shipmentId}`, payload: { shipmentId, requirementId } });
  return shipmentId;
}

export async function addPackage(session: Session, shipmentId: string, input: { packageType: string; parentId?: string; weightGrams?: number; lengthMm?: number; widthMm?: number; heightMm?: number; contents: Array<{ fulfilmentLineId?: string; description: string; quantity: number; productId?: string; lotCode?: string; serials?: string[] }> }) {
  const shipment = await db.shipment.findFirst({ where: { id: shipmentId, organisationId: session.organisationId } });
  if (!shipment) throw new Error("This shipment no longer exists.");
  if (["DISPATCHED", "DELIVERED", "CANCELLED"].includes(shipment.status)) throw new Error(`This package cannot be changed. Shipment ${shipment.reference} is ${shipment.status.toLowerCase()}.`);
  const packageId = await db.$transaction(async (tx) => {
    const created = await tx.logisticsPackage.create({ data: { organisationId: session.organisationId, reference: await nextReference(tx, session.organisationId, "PKG", input.packageType === "PALLET" ? "PAL" : "BOX"), shipmentId, parentId: input.parentId, packageType: input.packageType, weightGrams: input.weightGrams, lengthMm: input.lengthMm, widthMm: input.widthMm, heightMm: input.heightMm, packedByUserId: session.userId, packedAt: new Date() } });
    for (const content of input.contents) {
      await tx.packageContent.create({ data: { organisationId: session.organisationId, packageId: created.id, productId: content.productId, description: content.description, quantity: content.quantity, lotCode: content.lotCode, serials: content.serials ?? [], fulfilmentLineId: content.fulfilmentLineId } });
      if (content.fulfilmentLineId) await tx.fulfilmentLine.update({ where: { id: content.fulfilmentLineId }, data: { packedQuantity: { increment: content.quantity } } });
    }
    return created.id;
  });
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.package.created", entityType: "LogisticsPackage", entityId: packageId, summary: `Package added to ${shipment.reference}`, event: "logisticsPackageCreated", eventKey: `logistics.package.created:${packageId}`, payload: { packageId, shipmentId } });
  return packageId;
}

export async function recordWeight(session: Session, packageId: string, actualGrams: number) {
  const box = await db.logisticsPackage.findFirst({ where: { id: packageId, organisationId: session.organisationId }, include: { contents: true, shipment: true } });
  if (!box) throw new Error("This package no longer exists.");
  const products = await db.product.findMany({ where: { organisationId: session.organisationId, id: { in: box.contents.map((content) => content.productId).filter((id): id is string => Boolean(id)) } } });
  const expected = box.contents.reduce((sum, content) => sum + (products.find((product) => product.id === content.productId)?.grossWeightGrams ?? 0) * Number(content.quantity), 0);
  const variance = weightVariance(expected || null, actualGrams);
  await db.logisticsPackage.update({ where: { id: box.id }, data: { weightGrams: actualGrams, expectedWeightGrams: expected || null } });
  if (variance?.review) throw new Error(`Weight needs a look. Expected ${(expected / 1000).toFixed(1)} kg, actual ${(actualGrams / 1000).toFixed(1)} kg.`);
}

export async function stageShipment(session: Session, shipmentId: string, lane: string) {
  const shipment = await ownedShipment(session.organisationId, shipmentId);
  await db.shipment.update({ where: { id: shipment.id }, data: { status: "STAGED", stageLane: lane } });
}

export async function labelShipment(session: Session, shipmentId: string) {
  const shipment = await ownedShipment(session.organisationId, shipmentId);
  const tracking = shipment.trackingNumber ?? `${shipment.carrierCode}-${shipment.reference}`;
  await db.shipment.update({ where: { id: shipment.id }, data: { status: "LABELLED", trackingNumber: tracking } });
  return { title: shipment.reference, lines: [shipment.carrierCode, shipment.serviceLevel, tracking, shipment.carrierReason] };
}

export async function dispatchShipment(session: Session, shipmentId: string, requestKey: string) {
  if (!requestKey || requestKey.length > 80) throw new Error("A valid dispatch reference is required.");
  const provider = await stock();
  const shipment = await db.$transaction(async tx => {
    const organisationId = session.organisationId;
    const prior = await tx.logisticsOperation.findUnique({ where: { organisationId_requestKey: { organisationId, requestKey } } });
    const shipment = await tx.shipment.findFirstOrThrow({ where: { id: shipmentId, organisationId }, include: { sources: { include: { line: true, requirement: true } }, packages: { include: { contents: true } } } });
    if (prior) {
      if (prior.action !== "shipment.dispatch" || (prior.result as { shipmentId?:string }).shipmentId !== shipmentId) throw new Error("This dispatch reference belongs to another operation.");
      return { ...shipment, replayed:true };
    }
    if (["DISPATCHED","DELIVERED","CANCELLED"].includes(shipment.status)) throw new Error("This shipment has already been dispatched or cancelled.");
    if (!shipment.sources.length) throw new Error("Add the picked quantities before dispatching this shipment.");
    if (shipment.sources.some(source => source.requirement.holdSummary)) throw new Error(`Blocked: ${shipment.sources.find(source => source.requirement.holdSummary)?.requirement.holdSummary}`);
    for (const source of shipment.sources) {
      const line = await tx.fulfilmentLine.findFirstOrThrow({ where: { id:source.line.id,organisationId } });
      if (addQuantity(Number(line.shippedQuantity),Number(source.quantity)) > Math.min(Number(line.pickedQuantity),addQuantity(Number(line.orderedQuantity),-Number(line.cancelledQuantity)))) throw new Error("The picked quantity changed. Refresh this shipment before dispatching.");
      if (line.productId) {
        if (!source.requirement.warehouseId) throw new Error("Choose the source warehouse before dispatching physical products.");
        const product = await tx.product.findFirstOrThrow({ where: { id:line.productId,organisationId } });
        const contents = shipment.packages.flatMap(unit => unit.contents).filter(content => content.fulfilmentLineId === line.id && content.productId === line.productId);
        let selections: Array<{quantity:number;lotCode:string|null;serials:string[]}>;
        if (contents.length) {
          selections = contents.map(content => ({quantity:Number(content.quantity),lotCode:content.lotCode,serials:content.serials}));
          if (selections.reduce((sum,row) => addQuantity(sum,row.quantity),0) !== Number(source.quantity)) throw new Error("The packed batch quantities must exactly match this shipment line.");
        } else if (product.trackingMode === "SERIAL") {
          const picks = await tx.warehouseTaskLine.findMany({ where: { organisationId,fulfilmentLineId:line.id,productId:line.productId,task:{organisationId,kind:"PICK",status:"COMPLETE"} }, orderBy:{sequence:"asc"} });
          const serials = await tx.stockSerial.findMany({ where: { organisationId,productId:line.productId,warehouseId:source.requirement.warehouseId,status:"ON_HAND",serial:{in:picks.flatMap(pick=>pick.serials)} },orderBy:{serial:"asc"} });
          selections = [{quantity:Number(source.quantity),lotCode:null,serials:serials.slice(0,Number(source.quantity)).map(row=>row.serial)}];
        } else if (product.trackingMode === "LOT") {
          const picks = await tx.warehouseTaskLine.findMany({ where: { organisationId,fulfilmentLineId:line.id,productId:line.productId,task:{organisationId,kind:"PICK",status:"COMPLETE"},lotCode:{not:null} },orderBy:{sequence:"asc"} });
          let remaining = Number(source.quantity);
          selections = [];
          for (const pick of picks) { const take=Math.min(remaining,Number(pick.confirmedQuantity));if(take>0)selections.push({quantity:take,lotCode:pick.lotCode,serials:[]});remaining=addQuantity(remaining,-take); }
          if (remaining>0) throw new Error("Record the picked batches before dispatching this lot-tracked product.");
        } else selections = [{quantity:Number(source.quantity),lotCode:null,serials:[]}];
        for (const [index,selection] of selections.entries()) await provider.shipStock(session,{requestKey:`${requestKey}:${source.id}:${index}`,productId:line.productId,warehouseId:source.requirement.warehouseId,...selection,reason:`Shipped · ${shipment.reference}`,reference:shipment.reference,sourceId:line.id,shipmentId:shipment.id},tx);
      }
      await tx.fulfilmentLine.update({ where:{id:line.id},data:{shippedQuantity:{increment:Number(source.quantity)}} });
    }
    for (const requirementId of new Set(shipment.sources.map(source=>source.requirementId))) {
      const lines=await tx.fulfilmentLine.findMany({where:{organisationId,requirementId}});
      const complete=lines.length>0&&lines.every(line=>Number(line.shippedQuantity)>=addQuantity(Number(line.orderedQuantity),-Number(line.cancelledQuantity)));
      await tx.fulfilmentRequirement.update({where:{id:requirementId},data:{status:complete?"SHIPPED":"PART_SHIPPED"}});
    }
    await tx.shipment.update({where:{id:shipment.id},data:{status:"DISPATCHED",dispatchedAt:new Date(),trackingNumber:shipment.trackingNumber??`${shipment.carrierCode}-${shipment.reference}`}});
    await tx.trackingEvent.create({data:{organisationId,shipmentId:shipment.id,status:"Collected",occurredAt:new Date(),requestKey:`${requestKey}:collected`}});
    await tx.logisticsOperation.create({data:{organisationId,requestKey,action:"shipment.dispatch",result:{shipmentId}}});
    await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:"logistics.shipment.dispatched",entityType:"Shipment",entityId:shipment.id,after:{requestKey,sources:shipment.sources.map(source=>({id:source.id,quantity:Number(source.quantity)}))}}});
    return {...shipment,replayed:false};
  },{isolationLevel:"Serializable"});
  if (!shipment.replayed) await milestone({organisationId:session.organisationId,actorUserId:session.userId,action:"logistics.shipment.dispatched",entityType:"Shipment",entityId:shipment.id,summary:`${shipment.reference} dispatched`,partyId:shipment.partyId,event:"logisticsShipmentDispatched",eventKey:`logistics.shipment.dispatched:${shipment.id}`,payload:{shipmentId:shipment.id,carrier:shipment.carrierCode}});
  await deliverIfCompanySaysSo(session,shipment.id);
}

async function deliverIfCompanySaysSo(session: Session, shipmentId: string) {
  const policy = await policyFor(session.organisationId);
  if (!dispatchMovesToDelivery(policy.dispatchConfirmsDelivery)) return;
  const current = await db.shipment.findFirst({ where: { id: shipmentId, organisationId: session.organisationId } });
  if (!current || ["DELIVERED", "CANCELLED", "EXCEPTION"].includes(current.status)) return;
  if (!["DISPATCHED", "IN_TRANSIT", "LOADED"].includes(current.status)) return;
  await confirmDelivery(session, shipmentId, { outcome: "DELIVERED" });
}

export async function recordTracking(session: Session, shipmentId: string, rawStatus: string, requestKey: string) {
  const shipment = await ownedShipment(session.organisationId, shipmentId);
  const status = normalisedTracking(rawStatus);
  await db.trackingEvent.create({ data: { organisationId: session.organisationId, shipmentId, status, rawStatus, occurredAt: new Date(), requestKey } }).catch((error: { code?: string }) => { if (error.code !== "P2002") throw error; });
  const next = status === "Delivered" ? "DELIVERED" : status === "Exception" || status === "Delivery attempted" ? "EXCEPTION" : status === "Returned to sender" ? "EXCEPTION" : "IN_TRANSIT";
  await db.shipment.update({ where: { id: shipment.id }, data: { status: shipment.status === "DELIVERED" ? "DELIVERED" : next, rawCarrierStatus: rawStatus } });
  if (next === "EXCEPTION") await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.shipment.exception", entityType: "Shipment", entityId: shipment.id, summary: `${shipment.reference} · ${status}`, partyId: shipment.partyId, event: "logisticsShipmentException", eventKey: `logistics.shipment.exception:${requestKey}`, payload: { shipmentId, status } });
}

export async function confirmDelivery(session: Session, shipmentId: string, input: { outcome: "DELIVERED" | "PARTIAL" | "FAILED"; receiver?: string; note?: string; failureReason?: string }) {
  const shipment = await db.shipment.findFirst({ where: { id: shipmentId, organisationId: session.organisationId }, include: { sources: { include: { line: true, requirement: true } }, party: true } });
  if (!shipment) throw new Error("This shipment no longer exists.");
  const policy = await policyFor(session.organisationId);
  if (input.outcome === "FAILED") {
    await db.shipment.update({ where: { id: shipment.id }, data: { status: "EXCEPTION", failureReason: input.failureReason || "Customer unavailable" } });
    await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.delivery.failed", entityType: "Shipment", entityId: shipment.id, summary: `${shipment.reference} delivery failed`, partyId: shipment.partyId, event: "logisticsDeliveryFailed", eventKey: `logistics.delivery.failed:${shipment.id}`, payload: { shipmentId, reason: input.failureReason } });
    return;
  }
  if (shipment.status === "DELIVERED") {
    await raiseDeliveryInvoice(session, shipment);
    return;
  }
  const deliveredAt = new Date();
  const ordered = shipment.sources.reduce((sum, source) => sum + (Number(source.line.orderedQuantity) - Number(source.line.cancelledQuantity)), 0);
  const delivered = shipment.sources.reduce((sum, source) => sum + Number(source.quantity), 0);
  const otif = assessOtif({ promisedOn: shipment.expectedDeliveryAt ?? shipment.sources[0]?.requirement.promisedOn ?? null, deliveredAt, ordered, delivered: input.outcome === "PARTIAL" ? Math.max(0, delivered - 1) : delivered, fullPercent: policy.otifFullPercent, failureReason: input.failureReason });
  await db.shipment.update({ where: { id: shipment.id }, data: { status: "DELIVERED", deliveredAt, onTime: otif.onTime, inFull: otif.inFull, failureReason: otif.failureReason, pod: { receiver: input.receiver ?? null, note: input.note ?? null, at: deliveredAt.toISOString() } } });
  for (const source of shipment.sources) await db.fulfilmentLine.update({ where: { id: source.line.id }, data: { deliveredQuantity: { increment: Number(source.quantity) } } });
  if (input.outcome === "DELIVERED") {
    const requirementIds = [...new Set(shipment.sources.map((source) => source.requirementId))];
    for (const requirementId of requirementIds) {
      const lines = await db.fulfilmentLine.findMany({ where: { organisationId: session.organisationId, requirementId } });
      const complete = lines.length > 0 && lines.every((line) => Number(line.deliveredQuantity) >= Number(line.orderedQuantity) - Number(line.cancelledQuantity));
      if (complete) await db.fulfilmentRequirement.update({ where: { id: requirementId }, data: { status: "DELIVERED" } });
    }
  }
  await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "logistics.shipment.delivered", entityType: "Shipment", entityId: shipment.id, summary: `${shipment.reference} delivered`, partyId: shipment.partyId, event: "logisticsShipmentDelivered", eventKey: `logistics.shipment.delivered:${shipment.id}`, payload: { shipmentId, onTime: otif.onTime, inFull: otif.inFull } });
  await raiseDeliveryInvoice(session, { ...shipment, deliveredAt });
}

async function raiseDeliveryInvoice(session: Session, shipment: { id: string; reference: string; deliveredAt: Date | null; sources: Array<{ quantity: number | import("@/generated/prisma/client").Prisma.Decimal; line: { salesOrderLineId: string }; requirement: { salesOrderId: string } }> }) {
  const { handoffDeliveredShipment } = await import("@/core/finance/handoff");
  try {
    await handoffDeliveredShipment(session, {
      shipmentId: shipment.id,
      shipmentReference: shipment.reference,
      deliveredAt: shipment.deliveredAt ?? new Date(),
      lines: shipment.sources.map((source) => ({ salesOrderId: source.requirement.salesOrderId, salesOrderLineId: source.line.salesOrderLineId, quantity: Number(source.quantity) })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The delivery invoice could not be raised.";
    await milestone({ organisationId: session.organisationId, actorUserId: session.userId, action: "finance.delivery_invoice.waiting", entityType: "Shipment", entityId: shipment.id, summary: message, payload: { shipmentId: shipment.id, message } });
  }
}

export async function createLoad(session: Session, input: { vehicleLabel: string; driverName?: string; routeName?: string; departure?: Date; shipmentIds: string[]; maxWeightKg?: number; maxPallets?: number }) {
  const shipments = await db.shipment.findMany({ where: { organisationId: session.organisationId, id: { in: input.shipmentIds } }, include: { party: true } });
  if (!shipments.length) throw new Error("Choose the shipments on this load.");
  return db.$transaction(async (tx) => {
    const load = await tx.logisticsLoad.create({ data: { organisationId: session.organisationId, reference: await nextReference(tx, session.organisationId, "LD", "R"), vehicleLabel: input.vehicleLabel, driverName: input.driverName, routeName: input.routeName, plannedDepartureAt: input.departure, maxWeightKg: input.maxWeightKg, maxPallets: input.maxPallets, status: "LOADING" } });
    let sequence = 1;
    for (const shipment of shipments) {
      await tx.loadStop.create({ data: { organisationId: session.organisationId, loadId: load.id, shipmentId: shipment.id, sequence: sequence++, partyName: shipment.party.name, windowLabel: null } });
      await tx.shipment.update({ where: { id: shipment.id }, data: { loadId: load.id, carrierCode: "OWN_FLEET", carrierReason: "Own fleet load." } });
    }
    return load.id;
  });
}

export async function loadShipment(session: Session, loadId: string, barcode: string) {
  const load = await db.logisticsLoad.findFirst({ where: { id: loadId, organisationId: session.organisationId }, include: { stops: { include: { shipment: true } } } });
  if (!load) throw new Error("This load no longer exists.");
  const scanned = barcode.trim();
  const stop = load.stops.find((item) => item.shipment.reference === scanned || item.shipment.trackingNumber === scanned);
  if (stop) {
    await db.logisticsPackage.updateMany({ where: { organisationId: session.organisationId, shipmentId: stop.shipmentId }, data: { status: "LOADED" } });
    await db.loadStop.update({ where: { id: stop.id }, data: { status: "LOADED" } });
    await db.shipment.update({ where: { id: stop.shipmentId }, data: { status: "LOADED" } });
    return;
  }
  const unit = await db.logisticsPackage.findFirst({ where: { organisationId: session.organisationId, OR: [{ barcode: scanned }, { reference: scanned }] } });
  const unitStop = unit?.shipmentId ? load.stops.find((item) => item.shipmentId === unit.shipmentId) : null;
  if (!unit || !unitStop) throw new Error(`That shipment is not on ${load.reference}.`);
  const shipmentId = unit.shipmentId;
  if (!shipmentId) throw new Error(`That shipment is not on ${load.reference}.`);
  await db.logisticsPackage.update({ where: { id: unit.id }, data: { status: "LOADED" } });
  const siblings = await db.logisticsPackage.findMany({ where: { organisationId: session.organisationId, shipmentId, parentId: null } });
  if (siblings.every((item) => item.id === unit.id || item.status === "LOADED")) {
    await db.loadStop.update({ where: { id: unitStop.id }, data: { status: "LOADED" } });
    await db.shipment.update({ where: { id: shipmentId }, data: { status: "LOADED" } });
  }
}

export async function departLoad(session: Session, loadId: string) {
  const load = await db.logisticsLoad.findFirst({ where: { id: loadId, organisationId: session.organisationId }, include: { stops: true } });
  if (!load) throw new Error("This load no longer exists.");
  const waiting = load.stops.filter((stop) => stop.status !== "LOADED");
  if (waiting.length) throw new Error(`${waiting.length} expected shipment${waiting.length === 1 ? " is" : "s are"} not loaded. Scan them, or a supervisor must authorise leaving them behind.`);
  for (const stop of load.stops) await dispatchShipment(session, stop.shipmentId, `load:${load.id}:${stop.shipmentId}`);
  await db.logisticsLoad.update({ where: { id: load.id }, data: { status: "DEPARTED" } });
}

async function ownedShipment(organisationId: string, shipmentId: string) {
  const shipment = await db.shipment.findFirst({ where: { id: shipmentId, organisationId } });
  if (!shipment) throw new Error("This shipment no longer exists.");
  return shipment;
}
