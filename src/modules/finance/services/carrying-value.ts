import type { Prisma } from "@/generated/prisma/client";
import { convert } from "../domain/money";

/** Invoice control value less actual posted credits and retained settlement clearings. */
export async function invoiceCarryingValue(tx: Prisma.TransactionClient, organisationId: string, documentId: string) {
  const doc = await tx.financeDocument.findFirstOrThrow({ where: { id: documentId, organisationId, status: "POSTED" }, include: { entity: true, settlements: true, children: { where: { kind: { in: ["AR_CREDIT", "AP_CREDIT"] }, status: "POSTED" }, select: { journalId: true } } } });
  if (!doc.journalId || !["AR_INVOICE", "AR_DEBIT", "AP_INVOICE", "AP_DEBIT"].includes(doc.kind)) throw new Error("Posted invoice journal is missing.");
  const receivable = doc.kind.startsWith("AR_");
  const journals = [doc.journalId, ...doc.children.flatMap(credit => credit.journalId ? [credit.journalId] : [])];
  const posted = await tx.financeJournalLine.aggregate({ where: { organisationId, journalId: { in: journals }, account: { control: receivable ? "AR" : "AP" }, journal: { organisationId, status: "POSTED" } }, _sum: { debit: true, credit: true } });
  const value = receivable ? (posted._sum.debit ?? 0n) - (posted._sum.credit ?? 0n) : (posted._sum.credit ?? 0n) - (posted._sum.debit ?? 0n);
  const cleared = doc.settlements.reduce((sum, settlement) => sum + (settlement.carryingAmount ?? convert(settlement.amount, doc.exchangeRate.toString(), doc.currency, doc.entity.currency)), 0n);
  return { doc, carryingOutstanding: value - cleared };
}
