import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { salesFinanceSource } from "@/core/finance/connections";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { roundRatio } from "../domain/money";
import { requireFinance } from "./access";

/**
 * Raises a draft order-on-account invoice for a confirmed order, for Automations (no browser session).
 * Same checks as the manual Generate invoice button; idempotent per order. Posting stays a Finance decision.
 */
export async function createDraftInvoiceForOrder(session: Session, orderId: string, reason: string) {
  await requireFinance(session, "finance.receivables.manage");
  const organisationId = session.organisationId;
  const key = `sales-order:${orderId}`;
  const existing = await db.financeDocument.findFirst({ where: { organisationId, duplicateKey: key } });
  if (existing) return { id: existing.id, reference: existing.reference, created: false };
  const invoice = await db.$transaction(async (tx) => {
    const source = await salesFinanceSource(session, tx, orderId);
    const entity = await tx.financeEntity.findFirst({ where: { organisationId, currency: source.currency }, orderBy: { name: "asc" } });
    if (!entity) throw new Error(`Finance has no books in ${source.currency}.`);
    if (source.lines.some((l) => !["STANDARD", "ZERO_RATED", "EXEMPT", "OUTSIDE_SCOPE"].includes(l.taxCategory ?? ""))) throw new Error("Sales tax treatment must be verified before invoicing.");
    const lines = source.lines.map((l, i) => ({
      number: i + 1, salesOrderLineId: l.id, productId: l.productId, description: l.description, quantity: String(l.quantity), unitPrice: l.unitPrice, net: l.net, tax: l.tax,
      taxCode: l.taxCategory === "ZERO_RATED" ? "ZERO" : l.taxCategory === "STANDARD" ? "STANDARD" : l.taxCategory === "EXEMPT" ? "EXEMPT" : "OUTSIDE_SCOPE", taxRateBps: l.taxCategory === "STANDARD" ? 2000 : 0,
    }));
    if (lines.some((l) => l.tax > 0n && roundRatio(l.net * 2000n, 10000n) !== l.tax)) throw new Error("Unsupported tax mapping; review Finance tax policy first.");
    const documentDate = new Date();
    const doc = await tx.financeDocument.create({
      data: {
        organisationId, entityId: entity.id, kind: "AR_INVOICE", reference: `INV-${crypto.randomUUID().slice(0, 10).toUpperCase()}`, title: `Invoice for ${source.reference}`,
        creatorUserId: session.userId, partyId: source.partyId, salesOrderId: orderId, salesOrderRevision: source.revision, duplicateKey: key, currency: source.currency,
        documentDate, dueAt: new Date(documentDate.getTime() + source.paymentDays * 86400000), net: source.net, tax: source.tax, gross: source.gross, reason: `Automation: ${reason}`, lines: { create: lines },
      },
    });
    await tx.financeTimeline.create({ data: { organisationId, documentId: doc.id, actorUserId: session.userId, action: "GENERATED_FROM_SALES", detail: `${source.reference} revision ${source.revision}; raised by automation: ${reason}.` } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.sales_invoice.generated", entityType: "FinanceDocument", entityId: doc.id, after: { orderId, via: "automation" } } });
    return doc;
  });
  await emit(DOMAIN_EVENTS.financeInvoiceCreated, { organisationId, invoiceId: invoice.id, orderId, partyId: invoice.partyId });
  return { id: invoice.id, reference: invoice.reference, created: true };
}
