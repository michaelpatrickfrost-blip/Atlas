import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import type { DeliveredInvoiceRequest } from "@/core/finance/handoff";
import { writeAudit } from "@/core/audit/log";
import { roundRatio } from "../domain/money";
import crypto from "node:crypto";
import { booksFor } from "./books";

const TAX: Record<string, { code: string; bps: number }> = {
  STANDARD: { code: "STANDARD", bps: 2000 },
  ZERO_RATED: { code: "ZERO", bps: 0 },
  EXEMPT: { code: "EXEMPT", bps: 0 },
  OUTSIDE_SCOPE: { code: "OUTSIDE_SCOPE", bps: 0 },
};

function share(total: bigint, part: number, whole: number) {
  if (part <= 0 || whole <= 0) return 0n;
  return roundRatio(total * BigInt(part), BigInt(whole));
}

/** A delivered shipment raises one draft invoice per order, dated on the delivery. Posted journals stay a finance step. */
export async function invoiceDeliveredShipment(session: Session, request: DeliveredInvoiceRequest) {
  const organisationId = session.organisationId;
  const byOrder = new Map<string, Map<string, number>>();
  for (const line of request.lines) {
    if (line.quantity <= 0) continue;
    const rows = byOrder.get(line.salesOrderId) ?? new Map<string, number>();
    rows.set(line.salesOrderLineId, (rows.get(line.salesOrderLineId) ?? 0) + line.quantity);
    byOrder.set(line.salesOrderId, rows);
  }
  for (const [orderId, quantities] of byOrder) {
    const duplicateKey = byOrder.size === 1 ? `delivery:${request.shipmentId}` : `delivery:${request.shipmentId}:${orderId}`;
    const existing = await db.financeDocument.findFirst({ where: { organisationId, duplicateKey } });
    if (existing) continue;
    const order = await db.salesOrder.findFirst({
      where: { id: orderId, organisationId, commercialStatus: "CONFIRMED" },
      include: { lines: true, paymentTerm: true },
    });
    if (!order || ["BLANKET", "INTERNAL"].includes(order.orderType)) continue;
    const entity = await booksFor(organisationId, order.currency, session.userId);
    const lineIds = [...quantities.keys()];
    const already = await db.financeDocumentLine.findMany({
      where: { organisationId, salesOrderLineId: { in: lineIds }, document: { organisationId, kind: "AR_INVOICE", status: { not: "CANCELLED" } } },
      select: { salesOrderLineId: true, quantity: true },
    });
    const invoiced = new Map<string, number>();
    for (const row of already) if (row.salesOrderLineId) invoiced.set(row.salesOrderLineId, (invoiced.get(row.salesOrderLineId) ?? 0) + Number(row.quantity));
    const lines = [];
    let net = 0n;
    let tax = 0n;
    let number = 1;
    for (const source of order.lines) {
      const whole = source.orderedQuantity - source.cancelledQuantity;
      const open = whole - (invoiced.get(source.id) ?? 0);
      const quantity = Math.min(quantities.get(source.id) ?? 0, Math.max(0, open));
      if (quantity <= 0 || whole <= 0) continue;
      const treatment = TAX[source.taxCategory ?? ""] ?? TAX.OUTSIDE_SCOPE;
      const lineNet = share(BigInt(source.netAmount), quantity, whole);
      const lineTax = treatment.bps ? roundRatio(lineNet * BigInt(treatment.bps), 10000n) : 0n;
      if (lineNet === 0n && lineTax === 0n) continue;
      net += lineNet;
      tax += lineTax;
      lines.push({
        number: number++,
        salesOrderLineId: source.id,
        productId: source.productId,
        description: source.descriptionSnapshot,
        quantity: String(quantity),
        unitPrice: BigInt(source.unitPriceAmount),
        net: lineNet,
        tax: lineTax,
        taxCode: treatment.code,
        taxRateBps: treatment.bps,
      });
    }
    if (!lines.length || net + tax <= 0n) continue;
    const due = new Date(request.deliveredAt);
    due.setDate(due.getDate() + (order.paymentTerm?.days ?? 0));
    try {
    const invoice = await db.financeDocument.create({
      data: {
        organisationId,
        entityId: entity.id,
        kind: "AR_INVOICE",
        reference: `INV-${crypto.randomUUID().slice(0, 10).toUpperCase()}`,
        title: `Invoice for ${order.reference}`,
        creatorUserId: session.userId,
        partyId: order.partyId,
        salesOrderId: order.id,
        salesOrderRevision: order.revision,
        duplicateKey,
        currency: order.currency,
        documentDate: request.deliveredAt,
        dueAt: due,
        net,
        tax,
        gross: net + tax,
        externalReference: request.shipmentReference,
        reason: `Delivered ${request.shipmentReference} on ${request.deliveredAt.toLocaleDateString("en-GB")}. Draft until Finance posts it.`,
        lines: { create: lines },
      },
    });
    await db.financeTimeline.create({ data: { organisationId, documentId: invoice.id, actorUserId: session.userId, action: "GENERATED_FROM_DELIVERY", detail: `${order.reference} invoiced from ${request.shipmentReference}. Document date is the delivery date.` } });
    await writeAudit({ organisationId, actorUserId: session.userId, action: "finance.sales_invoice.generated", entityType: "FinanceDocument", entityId: invoice.id, after: { orderId, shipmentId: request.shipmentId, basis: "DELIVERY", documentDate: request.deliveredAt.toISOString(), gross: (net + tax).toString() } });
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code !== "P2002") throw error;
    }
  }
}
