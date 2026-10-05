import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";

export const STANDARD_CHART: Array<[string, string, string, string]> = [["1000", "Bank", "ASSET", "BANK"], ["1100", "Trade receivables", "ASSET", "AR"], ["1200", "Inventory", "ASSET", "INVENTORY"], ["1300", "Fixed assets", "ASSET", "ASSET"], ["1390", "Accumulated depreciation", "ASSET", "DEPRECIATION_ACCUMULATED"], ["2000", "Trade payables", "LIABILITY", "AP"], ["2100", "VAT output", "LIABILITY", "VAT_OUTPUT"], ["2110", "VAT input", "ASSET", "VAT_INPUT"], ["2200", "Goods received not invoiced", "LIABILITY", "GRNI"], ["3000", "Opening equity", "EQUITY", "EQUITY"], ["4000", "Revenue", "REVENUE", "REVENUE"], ["5000", "Operating expenses", "EXPENSE", "EXPENSE"], ["5100", "Depreciation", "EXPENSE", "DEPRECIATION"], ["5200", "Purchase price variance", "EXPENSE", "PURCHASE_VARIANCE"]];
export const CLOSE_TASKS = ["Bank reconciliation", "Accounts receivable", "Accounts payable", "Stock valuation", "Accruals", "Fixed assets", "Payroll", "Intercompany", "VAT", "Management accounts"];

/** One set of books: legal entity, standard chart of accounts, an accounting period and its close tasks. */
export async function openBooks(tx: Prisma.TransactionClient, input: { organisationId: string; name: string; code: string; currency: string; startAt: Date; endAt: Date; actorUserId: string; reason?: string }) {
  const entity = await tx.financeEntity.create({ data: { organisationId: input.organisationId, name: input.name, code: input.code, currency: input.currency } });
  await tx.financeAccount.createMany({ data: STANDARD_CHART.map(([code, name, type, control]) => ({ organisationId: input.organisationId, entityId: entity.id, code, name, type, control })) });
  const period = await tx.financePeriod.create({ data: { organisationId: input.organisationId, entityId: entity.id, name: `${input.startAt.toISOString().slice(0, 10)} – ${input.endAt.toISOString().slice(0, 10)}`, startAt: input.startAt, endAt: input.endAt } });
  await tx.financeCloseTask.createMany({ data: CLOSE_TASKS.map((name) => ({ organisationId: input.organisationId, entityId: entity.id, periodId: period.id, name })) });
  await tx.auditEntry.create({ data: { organisationId: input.organisationId, actorUserId: input.actorUserId, action: "finance.entity.created", entityType: "FinanceEntity", entityId: entity.id, after: { name: input.name, code: input.code, currency: input.currency, reason: input.reason ?? null } } });
  return entity;
}

/** The books an invoice in this currency goes into. A company that has none gets standard books for the
 * current calendar year, so a delivery is never left uninvoiced because Finance was not set up first. */
export async function booksFor(organisationId: string, currency: string, actorUserId: string) {
  const existing = await db.financeEntity.findFirst({ where: { organisationId, currency }, orderBy: { name: "asc" } });
  if (existing) return existing;
  const organisation = await db.organisation.findUnique({ where: { id: organisationId }, select: { name: true } });
  const year = new Date().getUTCFullYear(), code = (await db.financeEntity.count({ where: { organisationId } })) ? `MAIN-${currency}` : "MAIN";
  try {
    return await db.$transaction((tx) => openBooks(tx, { organisationId, name: organisation?.name ?? "Main company", code, currency, startAt: new Date(Date.UTC(year, 0, 1)), endAt: new Date(Date.UTC(year, 11, 31, 23, 59, 59)), actorUserId, reason: "Opened automatically for the first invoice" }));
  } catch (error) {
    const again = await db.financeEntity.findFirst({ where: { organisationId, currency }, orderBy: { name: "asc" } });
    if (again) return again;
    throw error;
  }
}
