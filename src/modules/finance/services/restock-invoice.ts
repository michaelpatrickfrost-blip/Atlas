import crypto from "node:crypto";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { writeAudit } from "@/core/audit/log";
import { linesReadyToInvoice } from "@/core/availability/stock-promise";
import { readAvailability } from "@/modules/stock/services/availability";
import { roundRatio } from "../domain/money";

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

/** Confirmed lines marked on the quotation are invoiced once free stock covers the remaining quantity.
 * Where Logistics is on, stock coming back raises the delivery first and the invoice follows that delivery. */
export async function invoiceWhenBackInStock(session: Session, productIds: string[]) {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (!ids.length) return 0;
  const organisationId = session.organisationId;
  const { getEnabledModuleIds } = await import("@/core/modules/runtime");
  if ((await getEnabledModuleIds(organisationId)).has("logistics")) {
    const balances = await db.inventoryBalance.findMany({ where: { organisationId, productId: { in: ids }, quantity: { gt: 0 } }, select: { productId: true, warehouseId: true, quantity: true } });
    const { stockReplenished } = await import("@/core/stock/replenishment");
    for (const balance of balances) {
      await stockReplenished(session, { productId: balance.productId, warehouseId: balance.warehouseId, requestKey: `balance:restock:${balance.productId}:${balance.warehouseId}:${balance.quantity}` });
    }
    return balances.length;
  }
  const picture = await readAvailability();
  const free = new Map(picture.products.map((row) => [row.productId, row.availableNow]));
  const waiting = await db.salesOrderLine.findMany({
    where: {
      invoiceWhenInStock: true,
      productId: { in: ids },
      order: { organisationId, commercialStatus: "CONFIRMED", orderType: { notIn: ["BLANKET", "INTERNAL"] } },
    },
    include: { order: { include: { paymentTerm: true } } },
    orderBy: [{ order: { confirmationDate: "asc" } }, { lineNumber: "asc" }],
  });
  if (!waiting.length) return 0;
  const already = await db.financeDocumentLine.findMany({
    where: {
      organisationId,
      salesOrderLineId: { in: waiting.map((line) => line.id) },
      document: { organisationId, kind: "AR_INVOICE", status: { not: "CANCELLED" } },
    },
    select: { salesOrderLineId: true, quantity: true },
  });
  const invoiced = new Map<string, number>();
  for (const row of already) if (row.salesOrderLineId) invoiced.set(row.salesOrderLineId, (invoiced.get(row.salesOrderLineId) ?? 0) + Number(row.quantity));
  const byProduct = new Map<string, typeof waiting>();
  for (const line of waiting) {
    const list = byProduct.get(line.productId!) ?? [];
    list.push(line);
    byProduct.set(line.productId!, list);
  }
  const ready = new Map<string, { line: (typeof waiting)[number]; quantity: number }>();
  for (const [productId, lines] of byProduct) {
    const ranked = lines.map((line) => ({ id: line.id, remaining: Math.max(0, line.orderedQuantity - line.cancelledQuantity - (invoiced.get(line.id) ?? 0)), line }));
    for (const row of linesReadyToInvoice(free.get(productId) ?? 0, ranked)) ready.set(row.id, { line: row.line, quantity: row.remaining });
  }
  if (!ready.size) return 0;
  const keys = [...ready.keys()].map((id) => `restock:${id}`);
  const existing = new Set((await db.financeDocument.findMany({ where: { organisationId, duplicateKey: { in: keys } }, select: { duplicateKey: true } })).map((row) => row.duplicateKey));
  let created = 0;
  const today = new Date();
  for (const row of ready.values()) {
    const source = row.line;
    const duplicateKey = `restock:${source.id}`;
    if (existing.has(duplicateKey)) continue;
    const order = source.order;
    const entity = await db.financeEntity.findFirst({ where: { organisationId, currency: order.currency }, orderBy: { name: "asc" } });
    if (!entity) continue;
    const whole = source.orderedQuantity - source.cancelledQuantity;
    if (row.quantity <= 0 || whole <= 0) continue;
    const treatment = TAX[source.taxCategory ?? ""] ?? TAX.OUTSIDE_SCOPE;
    const lineNet = share(BigInt(source.netAmount), row.quantity, whole);
    const lineTax = treatment.bps ? roundRatio(lineNet * BigInt(treatment.bps), 10000n) : 0n;
    if (lineNet === 0n && lineTax === 0n) continue;
    const due = new Date(today);
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
          documentDate: today,
          dueAt: due,
          net: lineNet,
          tax: lineTax,
          gross: lineNet + lineTax,
          reason: `Invoiced when back in stock on ${today.toLocaleDateString("en-GB")}. Draft until Finance posts it.`,
          lines: {
            create: [{
              number: 1,
              salesOrderLineId: source.id,
              productId: source.productId,
              description: source.descriptionSnapshot,
              quantity: String(row.quantity),
              unitPrice: BigInt(source.unitPriceAmount),
              net: lineNet,
              tax: lineTax,
              taxCode: treatment.code,
              taxRateBps: treatment.bps,
            }],
          },
        },
      });
      await db.financeTimeline.create({ data: { organisationId, documentId: invoice.id, actorUserId: session.userId, action: "GENERATED_FROM_RESTOCK", detail: `${order.reference} invoiced because the quoted quantity is back in stock.` } });
      await writeAudit({ organisationId, actorUserId: session.userId, action: "finance.sales_invoice.generated", entityType: "FinanceDocument", entityId: invoice.id, after: { orderId: order.id, basis: "RESTOCK", documentDate: today.toISOString(), gross: (lineNet + lineTax).toString() } });
      created += 1;
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code !== "P2002") throw error;
    }
  }
  return created;
}
