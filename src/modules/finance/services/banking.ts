"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { requireFinance, documentScope, documentCapability } from "./access";
import { financeTransaction } from "./transaction";
import { controls, postLedger, type PostingLine } from "./ledger";
import { invoiceCarryingValue } from "./carrying-value";
import { minor, money } from "../domain/money";
import { accountingDay, settlementValue, compareStatementRow } from "../domain/accounting";
import { suggestMatches } from "../domain/controls";

export async function importFinanceStatement(bankId: string, input: unknown) {
  const session = await requireSession();
  assertCapability(session, "finance.bank.manage");
  await requireFinance(session, "finance.bank.manage");
  const rows = z.array(z.object({ externalId: z.string().trim().min(1).max(100), date: z.string(), reference: z.string().trim().min(1).max(300), amount: z.string() })).min(1).max(1000).parse(input);
  if (new Set(rows.map(row => row.externalId)).size !== rows.length) throw new Error("Statement contains repeated external IDs. Review the import before saving.");
  const result = await financeTransaction(async tx => {
    const organisationId = session.organisationId, bank = await tx.financeBank.findFirstOrThrow({ where: { id: bankId, organisationId } });
    let imported = 0, existing = 0;
    for (const row of rows) {
      const amount = minor(row.amount, bank.currency), date = accountingDay(row.date);
      if (amount === 0n) throw new Error("Statement transaction cannot be zero.");
      const prior = await tx.financeBankTransaction.findFirst({ where: { organisationId, bankId, externalId: row.externalId } });
      if (prior) { compareStatementRow(prior, { ...row, amount, date }); existing++; continue; }
      await tx.financeBankTransaction.create({ data: { organisationId, bankId, externalId: row.externalId, date, reference: row.reference, amount } }); imported++;
    }
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.statement.imported", entityType: "FinanceBank", entityId: bankId, after: { imported, unchanged: existing } } });
    return { imported, existing };
  }); revalidatePath("/finance", "layout"); return result;
}

export async function reconcileFinanceStatement(transactionId: string, input: unknown) {
  const session = await requireSession();
  assertCapability(session, "finance.bank.manage");
  await requireFinance(session, "finance.bank.manage");
  const allocations = z.array(z.object({ documentId: z.string().min(1), amount: z.string(), bankAmount: z.string().optional() })).min(1).max(100).parse(input);
  if (new Set(allocations.map(row => row.documentId)).size !== allocations.length) throw new Error("Choose each invoice once.");
  await financeTransaction(async tx => {
    const organisationId = session.organisationId, statement = await tx.financeBankTransaction.findFirstOrThrow({ where: { id: transactionId, organisationId }, include: { bank: { include: { entity: true } }, settlements: true } });
    if (statement.bank.currency !== statement.bank.entity.currency) throw new Error("This bank account needs a foreign-bank valuation policy before reconciliation.");
    const incoming = statement.amount > 0n, profiles = await controls(tx, organisationId, statement.bank.entityId);
    const lines: PostingLine[] = [], settled: Array<{ documentId: string; amount: bigint; bankAmount: bigint; carryingAmount: bigint; realisedFx: bigint }> = [];
    let total = 0n;
    for (const row of allocations) {
      const doc = await tx.financeDocument.findFirstOrThrow({ where: { AND: [documentScope(session), { id: row.documentId, entityId: statement.bank.entityId, status: "POSTED", kind: { in: incoming ? ["AR_INVOICE", "AR_DEBIT"] : ["AP_INVOICE", "AP_DEBIT"] } }] } });
      assertCapability(session, documentCapability(doc.kind, true));
      const amount = minor(row.amount, doc.currency), sameCurrency = doc.currency === statement.bank.currency;
      if (!sameCurrency && !row.bankAmount) throw new Error(`Enter the ${statement.bank.currency} bank amount for ${doc.reference}.`);
      const bankAmount = row.bankAmount ? minor(row.bankAmount, statement.bank.currency) : amount;
      if (sameCurrency && bankAmount !== amount) throw new Error("Same-currency invoice and bank allocations must agree.");
      if (statement.status === "RECONCILED") {
        const previous = statement.settlements.find(settlement => settlement.documentId === doc.id);
        if (!previous || previous.amount !== amount || (previous.bankAmount ?? previous.amount) !== bankAmount || statement.settlements.length !== allocations.length) throw new Error("This bank transaction was already reconciled with different allocations.");
        continue;
      }
      if (statement.status !== "UNRECONCILED" || statement.allocated !== 0n) throw new Error("This bank transaction requires a review before allocation.");
      if (statement.date < (doc.accountingDate ?? doc.documentDate)) throw new Error("Receipt/payment cannot settle an invoice before its accounting date. Use a reviewed prepayment workflow.");
      if (doc.risk) throw new Error(`Invoice ${doc.reference} is held for review: ${doc.risk}`);
      const { carryingOutstanding } = await invoiceCarryingValue(tx, organisationId, doc.id);
      const values = settlementValue({ outstanding: doc.gross - doc.settled, carryingOutstanding, amount, bankAmount, incoming });
      total += bankAmount;
      lines.push({ accountId: profiles(incoming ? "AR" : "AP"), description: doc.reference, debit: incoming ? 0n : values.carryingAmount, credit: incoming ? values.carryingAmount : 0n, partyId: doc.partyId, projectId: doc.projectId, department: doc.department, costCentre: doc.costCentre, site: doc.site });
      if (values.realisedFx !== 0n) lines.push({ accountId: profiles(values.realisedFx > 0n ? "FX_GAIN" : "FX_LOSS"), description: `Realised exchange difference: ${doc.reference}`, debit: values.realisedFx < 0n ? -values.realisedFx : 0n, credit: values.realisedFx > 0n ? values.realisedFx : 0n, partyId: doc.partyId, projectId: doc.projectId, department: doc.department, costCentre: doc.costCentre, site: doc.site });
      settled.push({ documentId: doc.id, amount, bankAmount, ...values });
    }
    if (statement.status === "RECONCILED") return;
    if (total !== (incoming ? statement.amount : -statement.amount)) throw new Error("Allocate the full bank amount exactly. The invoices may be partially settled.");
    lines.unshift({ accountId: statement.bank.accountId, description: statement.reference, debit: incoming ? total : 0n, credit: incoming ? 0n : total });
    await postLedger(tx, session, { entityId: statement.bank.entityId, date: statement.date, description: statement.reference, sourceKey: `bank:${transactionId}`, sourceType: "BANK", sourceId: transactionId, currency: statement.bank.currency, rate: "1", lines });
    for (const settlement of settled) {
      await tx.financeSettlement.create({ data: { ...settlement, organisationId, bankTransactionId: transactionId, actorUserId: session.userId } });
      await tx.financeDocument.update({ where: { id: settlement.documentId, organisationId }, data: { settled: { increment: settlement.amount } } });
      await tx.financeTimeline.create({ data: { organisationId, documentId: settlement.documentId, actorUserId: session.userId, action: "SETTLED", detail: `${statement.reference}: ${money(settlement.bankAmount, statement.bank.currency)} bank allocation; carrying value ${money(settlement.carryingAmount, statement.bank.entity.currency)}; realised FX ${money(settlement.realisedFx, statement.bank.entity.currency)}.` } });
    }
    await tx.financeBankTransaction.update({ where: { id: transactionId, organisationId, status: "UNRECONCILED", allocated: 0n }, data: { status: "RECONCILED", allocated: total } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.bank.reconciled", entityType: "FinanceBankTransaction", entityId: transactionId, after: { amount: total.toString(), allocations: settled.map(row => ({ ...row, amount: row.amount.toString(), bankAmount: row.bankAmount.toString(), carryingAmount: row.carryingAmount.toString(), realisedFx: row.realisedFx.toString() })) } } });
  }); revalidatePath("/finance", "layout");
}

export async function financeReconciliationForm(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.bank.manage");
  return reconcileFinanceStatement(String(form.get("transactionId") ?? ""), [...form.entries()].filter(([key, value]) => key.startsWith("amount:") && String(value).trim()).map(([key, value]) => ({ documentId: key.slice(7), amount: String(value), bankAmount: String(form.get(`bank:${key.slice(7)}`) ?? "").trim() || undefined })));
}

export async function getFinanceReconciliation(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "finance.bank.read");
  await requireFinance(session, "finance.bank.read");
  const filter = z.object({ entityId: z.string().optional(), bankId: z.string().optional(), page: z.number().int().min(0).max(100000).default(0), query: z.string().trim().max(100).optional(), transactionId: z.string().optional(), status: z.enum(["UNRECONCILED", "RECONCILED", "ALL"]).default("UNRECONCILED") }).parse(input);
  const organisationId = session.organisationId, entities = await db.financeEntity.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
  const entity = filter.entityId ? entities.find(entity => entity.id === filter.entityId) : entities[0];
  if (filter.entityId && !entity) throw new Error("Legal entity is not available.");
  if (!entity) return { entities, entity: null, banks: [], rows: [], count: 0, invoices: [], suggestions: [], bankBalances: [] };
  const banks = await db.financeBank.findMany({ where: { organisationId, entityId: entity.id }, include: { account: true } });
  if (filter.bankId && !banks.some(bank => bank.id === filter.bankId)) throw new Error("Bank is not available in this entity.");
  const where = { organisationId, ...(filter.transactionId ? { id: filter.transactionId } : {}), bank: { entityId: entity.id }, ...(filter.bankId ? { bankId: filter.bankId } : {}), ...(filter.status !== "ALL" ? { status: filter.status } : {}) };
  const [rows, count, invoices, bankBalances] = await Promise.all([
    db.financeBankTransaction.findMany({ where, include: { settlements: { select: { documentId: true, amount: true, bankAmount: true, realisedFx: true } } }, orderBy: [{ date: "desc" }, { id: "desc" }], take: 50, skip: filter.page * 50 }),
    db.financeBankTransaction.count({ where }),
    db.financeDocument.findMany({ where: { AND: [documentScope(session), { entityId: entity.id, status: "POSTED", kind: { in: ["AR_INVOICE", "AR_DEBIT", "AP_INVOICE", "AP_DEBIT"] }, settled: { lt: db.financeDocument.fields.gross }, risk: null, ...(filter.query ? { OR: [{ reference: { contains: filter.query, mode: "insensitive" } }, { party: { name: { contains: filter.query, mode: "insensitive" } } }] } : {}) }] }, select: { id: true, reference: true, kind: true, currency: true, gross: true, settled: true, accountingDate: true, documentDate: true, party: { select: { name: true } } }, orderBy: [{ dueAt: "asc" }, { id: "asc" }], take: 200 }),
    db.financeJournalLine.groupBy({ by: ["accountId"], where: { organisationId, accountId: { in: banks.map(bank => bank.accountId) }, journal: { organisationId, entityId: entity.id, status: "POSTED" } }, _sum: { debit: true, credit: true } }),
  ]);
  const suggestions = rows.filter(row => row.status === "UNRECONCILED").map(row => {
    const bank = banks.find(bank => bank.id === row.bankId)!;
    const eligible = invoices.filter(doc => doc.currency === bank.currency && (doc.accountingDate ?? doc.documentDate) <= row.date && doc.kind.startsWith(row.amount > 0n ? "AR_" : "AP_")).map(doc => ({ ...doc, outstanding: doc.gross - doc.settled }));
    return { transactionId: row.id, matches: suggestMatches(row.amount < 0n ? -row.amount : row.amount, eligible).map(match => ({ ...match, confidence: match.ids.every(id => row.reference.toUpperCase().includes(eligible.find(doc => doc.id === id)!.reference.toUpperCase())) ? 95 : match.confidence })) };
  });
  return { entities, entity, banks, rows, count, invoices, suggestions, bankBalances };
}

export async function importFinanceStatementForm(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.bank.manage");
  const raw = String(form.get("transactions") ?? "").trim();
  const rows = raw.split(/\r?\n/).map(line => { const parts = line.split("\t"); if (parts.length !== 4) throw new Error("Use four tab-separated columns: external ID, date, reference, signed amount."); return { externalId: parts[0], date: parts[1], reference: parts[2], amount: parts[3] }; });
  return importFinanceStatement(String(form.get("bankId") ?? ""), rows);
}

