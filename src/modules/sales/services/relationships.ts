import { db } from "@/core/db/client";
import type { RecordContextProvider, RecordRelationshipProvider, RecordRelationship } from "@/core/relationships/types";

export const salesRecordContext: RecordContextProvider = async (session, record) => {
  if (record.moduleId !== "sales" || record.type !== "order" || !session.capabilities.has("sales.order.read")) return null;
  const order = await db.salesOrder.findFirst({
    where: { organisationId: session.organisationId, id: record.id },
    select: { quoteId: true, partyId: true, lines: { select: { productId: true } } },
  });
  if (!order) return null;
  return { record, anchors: [
    { moduleId: "core", type: "customer", id: order.partyId },
    ...(order.quoteId ? [{ moduleId: "sales", type: "quote", id: order.quoteId }] : []),
    ...order.lines.flatMap(line => line.productId ? [{ moduleId: "products", type: "product", id: line.productId }] : []),
  ] };
};

export const salesRecordRelationships: RecordRelationshipProvider = async (session, context) => {
  const links: RecordRelationship[] = [];
  if (session.capabilities.has("sales.quote.read")) {
    const ids = context.anchors.filter(anchor => anchor.moduleId === "sales" && anchor.type === "quote").map(anchor => anchor.id);
    if (ids.length) {
      const quotes = await db.quote.findMany({ where: { organisationId: session.organisationId, id: { in: ids } }, select: { id: true, reference: true, status: true }, take: 51, orderBy: { reference: "asc" } });
      links.push(...quotes.slice(0, 50).map(quote => ({ id: quote.id, title: quote.reference, kind: "Quotation", href: `/sales/quotes/${quote.id}`, direction: "upstream" as const, detail: quote.status.replaceAll("_", " ") })));
    }
  }
  if (session.capabilities.has("sales.order.read")) {
    const ids = context.anchors.filter(anchor => anchor.moduleId === "sales" && anchor.type === "order").map(anchor => anchor.id);
    const lineIds = context.anchors.filter(anchor => anchor.moduleId === "sales" && anchor.type === "order-line").map(anchor => anchor.id);
    if (ids.length || lineIds.length) {
      const orders = await db.salesOrder.findMany({ where: { organisationId: session.organisationId, OR: [{ id: { in: ids } }, { lines: { some: { id: { in: lineIds } } } }] }, select: { id: true, reference: true, commercialStatus: true }, take: 51, orderBy: { reference: "asc" } });
      links.push(...orders.slice(0, 50).map(order => ({ id: order.id, title: order.reference, kind: "Sales order", href: `/sales/orders/${order.id}`, direction: "upstream" as const, detail: order.commercialStatus.replaceAll("_", " ") })));
      return { links, hasMore: orders.length > 50 };
    }
  }
  return { links };
};
