import { db } from "@/core/db/client";
import type { RecordContextProvider, RecordRelationshipProvider } from "@/core/relationships/types";
import { documentScope } from "./access";

export const financeRecordContext: RecordContextProvider = async (session, record) => {
  if (record.moduleId !== "finance" || record.type !== "document") return null;
  const document = await db.financeDocument.findFirst({ where: { AND: [documentScope(session), { id: record.id }] }, select: { salesOrderId: true, partyId: true } });
  return document ? { record, anchors: [
    ...(document.salesOrderId ? [{ moduleId: "sales", type: "order", id: document.salesOrderId }] : []),
    ...(document.partyId ? [{ moduleId: "core", type: "customer", id: document.partyId }] : []),
  ] } : null;
};

export const financeRecordRelationships: RecordRelationshipProvider = async (session, context) => {
  if (!session.capabilities.has("finance.receivables.read") || context.record.moduleId !== "sales" || context.record.type !== "order") return { links: [] };
  const documents = await db.financeDocument.findMany({ where: { AND: [documentScope(session), { salesOrderId: context.record.id, kind: { in: ["AR_INVOICE", "AR_CREDIT", "AR_DEBIT"] } }] }, select: { id: true, reference: true, status: true, kind: true }, orderBy: { documentDate: "asc" }, take: 51 });
  return { hasMore: documents.length > 50, links: documents.slice(0, 50).map(document => ({ id: document.id, title: document.reference, kind: document.kind === "AR_INVOICE" ? "Invoice" : document.kind === "AR_CREDIT" ? "Credit note" : "Debit note", href: `/finance/documents/${document.id}`, direction: "downstream" as const, detail: document.status.replaceAll("_", " ") })) };
};
