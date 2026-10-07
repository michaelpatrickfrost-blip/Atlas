import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { assertBalanced, decimalUnits } from "../domain/money";
import { translatedLines } from "../domain/accounting";
import { periodAllows } from "../domain/controls";
import { validatePostingLines } from "./posting-validation";
export type PostingLine = { accountId: string; description: string; debit: bigint; credit: bigint; partyId?: string | null; productId?: string | null; projectId?: string | null; department?: string | null; costCentre?: string | null; site?: string | null; taxCode?: string | null };
export async function postLedger(tx: Prisma.TransactionClient, session: Session, input: { entityId: string; date: Date; documentDate?: Date; taxDate?: Date; description: string; sourceKey: string; sourceType: string; sourceId?: string; currency: string; rate: string; lines: PostingLine[]; approverUserId?: string; reversalOfId?: string }) {
  assertBalanced(input.lines);
  if (Number.isNaN(input.date.getTime())) throw new Error("Enter a valid accounting date.");
  const organisationId = session.organisationId;
  const fingerprint = createHash("sha256").update(JSON.stringify({ ...input, approverUserId: undefined, rate: decimalUnits(input.rate, 12).toString() }, (_, value) => typeof value === "bigint" ? value.toString() : value)).digest("hex");
  const existing = await tx.financeJournal.findFirst({ where: { organisationId, sourceKey: input.sourceKey } });
  if (existing) {
    if (existing.status !== "POSTED" || existing.entityId !== input.entityId || existing.sourceType !== input.sourceType || existing.sourceId !== (input.sourceId ?? null) || existing.currency !== input.currency || (existing.postingFingerprint && existing.postingFingerprint !== fingerprint)) throw new Error("Posting key already belongs to a different transaction.");
    return existing;
  }
  const entity = await tx.financeEntity.findFirstOrThrow({ where: { id: input.entityId, organisationId } });
  const periods = await tx.financePeriod.findMany({ where: { entityId: entity.id, organisationId, startAt: { lte: input.date }, endAt: { gte: input.date } }, take: 2 });
  const period = periods[0];
  if (periods.length !== 1 || !periodAllows(period.state, input.sourceType, period.allowedSources)) throw new Error("Accounting date is outside a single permitted open period.");
  await validatePostingLines(tx, session, entity.id, input.currency, input.lines);
  const translated = translatedLines(input.lines, input.rate, input.currency, entity.currency);
  const lines = translated.lines;
  if (translated.difference !== 0n) {
    const account = await controls(tx, organisationId, entity.id);
    const rounding: typeof lines[number] = { accountId: account("ROUNDING"), description: "Exchange translation rounding", transactionDebit: 0n, transactionCredit: 0n,
      debit: translated.difference < 0n ? -translated.difference : 0n, credit: translated.difference > 0n ? translated.difference : 0n };
    await validatePostingLines(tx, session, entity.id, input.currency, [rounding]);
    lines.push(rounding);
  }
  assertBalanced(lines);
  const journal = await tx.financeJournal.create({ data: { organisationId, entityId: entity.id, periodId: period.id,
    reference: `JE-${crypto.randomUUID().slice(0, 12).toUpperCase()}`, description: input.description,
    sourceKey: input.sourceKey, sourceType: input.sourceType, sourceId: input.sourceId, postingFingerprint: fingerprint,
    accountingDate: input.date, documentDate: input.documentDate ?? input.date, taxDate: input.taxDate ?? input.documentDate ?? input.date,
    currency: input.currency, exchangeRate: input.rate, status: "DRAFT", creatorUserId: session.userId,
    approverUserId: input.approverUserId, reversalOfId: input.reversalOfId, lines: { create: lines } } });
  const posted = await tx.financeJournal.update({ where: { id: journal.id, organisationId }, data: { status: "POSTED", postedAt: new Date() } });
  await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.journal.posted", entityType: "FinanceJournal", entityId: journal.id, after: { sourceKey: input.sourceKey, description: input.description, currency: input.currency, rate: input.rate, rounding: translated.difference.toString() } } });
  await tx.domainOutbox.create({ data: { organisationId, eventKey: `finance.journal.posted:${journal.id}`, eventName: "finance.journal.posted", payload: { journalId: journal.id, entityId: entity.id } } });
  return posted;
}
export async function controls(tx: Prisma.TransactionClient, organisationId: string, entityId: string) {
  const accounts = await tx.financeAccount.findMany({ where: { organisationId, entityId, active: true, postingAllowed: true, control: { not: null } } });
  return (key: string) => { const found = accounts.filter(account => account.control === key); if (found.length !== 1) throw new Error(`Configure one active ${key} posting profile in Finance Settings.`); return found[0].id; };
}
