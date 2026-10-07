"use server";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { projectScope } from "@/core/permissions/work-access";
import type { Prisma } from "@/generated/prisma/client";
import { documentScope, requireFinance } from "./access";
import { accountingDay } from "../domain/accounting";

async function journalScope(session: Session, entityId: string): Promise<Prisma.FinanceJournalWhereInput> {
  const projects = session.capabilities.has("projects.read") ? await db.project.findMany({ where: projectScope(session), select: { id: true } }) : [];
  return { organisationId: session.organisationId, entityId,
    documents: { every: documentScope(session) }, lines: { every: { OR: [{ projectId: null }, { projectId: { in: projects.map(project => project.id) } }] } } };
}

export async function getFinanceLedger(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "finance.ledger.read");
  await requireFinance(session, "finance.ledger.read");
  const parsed = z.object({ entityId: z.string().optional(), accountId: z.string().optional(), start: z.string().optional(), end: z.string().optional(), query: z.string().trim().max(100).optional(), page: z.number().int().min(0).max(100000).default(0) }).parse(input);
  const now = new Date().toISOString().slice(0, 10), start = accountingDay(parsed.start || now.slice(0, 8) + "01"), end = accountingDay(parsed.end || now, true);
  if (start > end) throw new Error("Report start must precede the end date.");
  const organisationId = session.organisationId, entities = await db.financeEntity.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
  const entity = parsed.entityId ? entities.find(entity => entity.id === parsed.entityId) : entities[0];
  if (parsed.entityId && !entity) throw new Error("Legal entity is not available.");
  if (!entity) return { entities, entity: null, accounts: [], balances: [], entries: [], count: 0, start, end, debit: 0n, credit: 0n, opening: 0n, movement: 0n };
  const accounts = await db.financeAccount.findMany({ where: { organisationId, entityId: entity.id }, orderBy: { code: "asc" } });
  if (parsed.accountId && !accounts.some(account => account.id === parsed.accountId)) throw new Error("Account is not available in this entity.");
  const scope = await journalScope(session, entity.id), journal = { ...scope, status: "POSTED" };
  const where: Prisma.FinanceJournalLineWhereInput = { organisationId, ...(parsed.accountId ? { accountId: parsed.accountId } : {}), journal: { ...journal, accountingDate: { gte: start, lte: end }, ...(parsed.query ? { OR: [{ reference: { contains: parsed.query, mode: "insensitive" } }, { description: { contains: parsed.query, mode: "insensitive" } }, { sourceId: parsed.query }] } : {}) } };
  const [balances, entries, count, opening, movement] = await Promise.all([
    db.financeJournalLine.groupBy({ by: ["accountId"], where: { organisationId, journal: { ...journal, accountingDate: { lte: end } } }, _sum: { debit: true, credit: true } }),
    db.financeJournalLine.findMany({ where, include: { account: { select: { code: true, name: true } }, journal: { select: { id: true, reference: true, accountingDate: true, currency: true, sourceType: true } } }, orderBy: [{ journal: { accountingDate: "desc" } }, { id: "asc" }], take: 50, skip: parsed.page * 50 }),
    db.financeJournalLine.count({ where }),
    db.financeJournalLine.aggregate({ where: { organisationId, ...(parsed.accountId ? { accountId: parsed.accountId } : {}), journal: { ...journal, accountingDate: { lt: start } } }, _sum: { debit: true, credit: true } }),
    db.financeJournalLine.aggregate({ where, _sum: { debit: true, credit: true } }),
  ]);
  return { entities, entity, accounts, balances, entries, count, start, end,
    debit: balances.reduce((total, row) => total + ((row._sum.debit ?? 0n) > (row._sum.credit ?? 0n) ? (row._sum.debit ?? 0n) - (row._sum.credit ?? 0n) : 0n), 0n),
    credit: balances.reduce((total, row) => total + ((row._sum.credit ?? 0n) > (row._sum.debit ?? 0n) ? (row._sum.credit ?? 0n) - (row._sum.debit ?? 0n) : 0n), 0n),
    opening: (opening._sum.debit ?? 0n) - (opening._sum.credit ?? 0n), movement: (movement._sum.debit ?? 0n) - (movement._sum.credit ?? 0n) };
}

export async function getFinanceJournalDetail(id: string) {
  const session = await requireSession();
  assertCapability(session, "finance.ledger.read");
  await requireFinance(session, "finance.ledger.read");
  const organisationId = session.organisationId;
  const initial = await db.financeJournal.findFirstOrThrow({ where: { organisationId, id }, select: { entityId: true } });
  const journal = await db.financeJournal.findFirstOrThrow({ where: { ...await journalScope(session, initial.entityId), id }, include: { entity: true, period: true, lines: { include: { account: { select: { code: true, name: true } } }, orderBy: { id: "asc" } }, documents: { where: documentScope(session), select: { id: true, reference: true, kind: true, salesOrderId: true } } } });
  const reversal = await db.financeJournal.findFirst({ where: { organisationId, reversalOfId: id }, select: { id: true, reference: true } });
  const original = journal.reversalOfId ? await db.financeJournal.findFirst({ where: { ...await journalScope(session, initial.entityId), id: journal.reversalOfId }, select: { id: true, reference: true } }) : null;
  const audit = await db.auditEntry.findMany({ where: { organisationId, entityType: "FinanceJournal", entityId: id }, select: { action: true, actorUserId: true, createdAt: true }, orderBy: { createdAt: "asc" } });
  return { journal, reversal, original, audit };
}

export async function getFinanceSubledgerReconciliation(entityId: string) {
  const session = await requireSession();
  assertCapability(session, "finance.ledger.read");
  await requireFinance(session, "finance.ledger.read");
  const organisationId = session.organisationId, entity = await db.financeEntity.findFirstOrThrow({ where: { id: entityId, organisationId } }), journal = { ...await journalScope(session, entity.id), status: "POSTED" };
  const rows = [];
  for (const side of ["AR", "AP"] as const) {
    if (!session.capabilities.has(side === "AR" ? "finance.receivables.read" : "finance.payables.read")) continue;
    const documents: Prisma.FinanceDocumentWhereInput = { AND: [documentScope(session), { entityId, status: "POSTED", kind: { in: [`${side}_INVOICE`, `${side}_DEBIT`, `${side}_CREDIT`] } }] };
    const [ledger, sourced, paid, legacy] = await Promise.all([
      db.financeJournalLine.aggregate({ where: { organisationId, account: { control: side }, journal }, _sum: { debit: true, credit: true } }),
      db.financeJournalLine.aggregate({ where: { organisationId, account: { control: side }, journal: { ...journal, documents: { some: documents, every: documentScope(session) } } }, _sum: { debit: true, credit: true } }),
      db.financeSettlement.aggregate({ where: { organisationId, document: documents, carryingAmount: { not: null } }, _sum: { carryingAmount: true } }),
      db.financeSettlement.aggregate({ where: { organisationId, document: documents, carryingAmount: null }, _sum: { amount: true } }),
    ]);
    const ledgerBalance = side === "AR" ? (ledger._sum.debit ?? 0n) - (ledger._sum.credit ?? 0n) : (ledger._sum.credit ?? 0n) - (ledger._sum.debit ?? 0n);
    const documentValue = side === "AR" ? (sourced._sum.debit ?? 0n) - (sourced._sum.credit ?? 0n) : (sourced._sum.credit ?? 0n) - (sourced._sum.debit ?? 0n);
    const subledger = documentValue - (paid._sum.carryingAmount ?? 0n) - (legacy._sum.amount ?? 0n);
    rows.push({ side, ledgerBalance, subledger, difference: ledgerBalance - subledger });
  }
  return { entity, rows, basis: "Current posted invoice and credit carrying values, less retained cash settlements. Manual control-account adjustments remain visible as differences. Authorised projects/documents only." };
}
