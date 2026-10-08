import { db } from "@/core/db/client";
import type { RecordContextProvider, RecordRelationshipProvider } from "@/core/relationships/types";

export const manufacturingRecordContext: RecordContextProvider = async (session, record) => {
  if (record.moduleId !== "manufacturing" || record.type !== "order" || !session.capabilities.has("manufacturing.order.read")) return null;
  const order = await db.manufacturingOrder.findFirst({ where: { organisationId: session.organisationId, id: record.id }, select: { productId: true, sourceSalesOrderLineId: true } });
  if (!order) return null;
  return { record, anchors: [
    { moduleId: "products", type: "product", id: order.productId },
    ...(order.sourceSalesOrderLineId ? [{ moduleId: "sales", type: "order-line", id: order.sourceSalesOrderLineId }] : []),
  ] };
};

export const manufacturingRecordRelationships: RecordRelationshipProvider = async (session, context) => {
  if (!session.capabilities.has("manufacturing.order.read") || context.record.moduleId !== "sales" || context.record.type !== "order") return { links: [] };
  const orders = await db.manufacturingOrder.findMany({
    where: { organisationId: session.organisationId, sourceSalesOrderLine: { orderId: context.record.id, order: { organisationId: session.organisationId } } },
    select: { id: true, orderNumber: true, quantity: true, unitOfMeasure: true, status: true }, orderBy: { orderNumber: "asc" }, take: 51,
  });
  return { hasMore: orders.length > 50, links: orders.slice(0, 50).map(order => ({ id: order.id, title: order.orderNumber, kind: "Manufacturing order", href: `/manufacturing/produce/${order.id}`, direction: "downstream" as const, detail: `${Number(order.quantity).toLocaleString("en-GB")} ${order.unitOfMeasure} · ${order.status.replaceAll("_", " ")}` })) };
};
