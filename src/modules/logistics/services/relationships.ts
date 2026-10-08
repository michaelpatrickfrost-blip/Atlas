import { db } from "@/core/db/client";
import type { RecordContextProvider, RecordRelationshipProvider, RecordRelationship } from "@/core/relationships/types";

export const logisticsRecordContext: RecordContextProvider = async (session, record) => {
  if (record.moduleId !== "logistics") return null;
  if (record.type === "fulfilment" && session.capabilities.has("logistics.fulfilment.read")) {
    const fulfilment = await db.fulfilmentRequirement.findFirst({ where: { organisationId: session.organisationId, id: record.id }, select: { salesOrderId: true, partyId: true } });
    return fulfilment ? { record, anchors: [{ moduleId: "sales", type: "order", id: fulfilment.salesOrderId }, { moduleId: "core", type: "customer", id: fulfilment.partyId }] } : null;
  }
  if (record.type === "shipment" && session.capabilities.has("logistics.shipment.read")) {
    const shipment = await db.shipment.findFirst({ where: { organisationId: session.organisationId, id: record.id }, select: { partyId: true, sources: { where: { organisationId: session.organisationId }, select: { salesOrderId: true } } } });
    return shipment ? { record, anchors: [{ moduleId: "core", type: "customer", id: shipment.partyId }, ...shipment.sources.map(source => ({ moduleId: "sales", type: "order", id: source.salesOrderId }))] } : null;
  }
  return null;
};

export const logisticsRecordRelationships: RecordRelationshipProvider = async (session, context) => {
  if (context.record.moduleId !== "sales" || context.record.type !== "order") return { links: [] };
  const links: RecordRelationship[] = [];
  let hasMore = false;
  if (session.capabilities.has("logistics.fulfilment.read")) {
    const records = await db.fulfilmentRequirement.findMany({ where: { organisationId: session.organisationId, salesOrderId: context.record.id }, select: { id: true, reference: true, status: true }, orderBy: { reference: "asc" }, take: 51 });
    hasMore ||= records.length > 50;
    links.push(...records.slice(0, 50).map(record => ({ id: record.id, title: record.reference, kind: "Fulfilment", href: `/logistics/fulfil/${record.id}`, direction: "downstream" as const, detail: record.status.replaceAll("_", " ") })));
  }
  if (session.capabilities.has("logistics.shipment.read")) {
    const records = await db.shipment.findMany({ where: { organisationId: session.organisationId, sources: { some: { organisationId: session.organisationId, salesOrderId: context.record.id } } }, select: { id: true, reference: true, status: true }, orderBy: { reference: "asc" }, take: 51 });
    hasMore ||= records.length > 50;
    links.push(...records.slice(0, 50).map(record => ({ id: record.id, title: record.reference, kind: "Shipment", href: `/logistics/shipments/${record.id}`, direction: "downstream" as const, detail: record.status.replaceAll("_", " ") })));
  }
  return { links, hasMore };
};
