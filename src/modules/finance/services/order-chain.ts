import { db } from "@/core/db/client";
import type { SalesInvoiceChainProvider } from "@/core/finance/connections";
import { documentScope } from "./access";

/** Operational order views consume only this authorised Finance-owned projection. */
export const salesInvoiceChain: SalesInvoiceChainProvider = async (session, orderId) => {
  if (!session.capabilities.has("finance.receivables.read")) return [];
  const order = await db.salesOrder.findFirst({ where: { id: orderId, organisationId: session.organisationId }, select: { id: true } });
  if (!order) return [];
  const invoices = await db.financeDocument.findMany({
    where: { AND: [documentScope(session), { salesOrderId: orderId, kind: "AR_INVOICE", status: { not: "CANCELLED" } }] },
    select: { id: true, reference: true, status: true, documentDate: true, lines: { select: { salesOrderLineId: true, quantity: true } } },
    orderBy: { documentDate: "asc" },
  });
  return invoices.map(invoice => ({ ...invoice, documentDate: invoice.documentDate.toISOString(), lines: invoice.lines.map(line => ({ ...line, quantity: Number(line.quantity) })) }));
};
