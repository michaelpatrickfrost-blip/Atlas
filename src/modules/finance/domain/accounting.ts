import { z } from "zod";
import { assertBalanced, convert, decimalUnits, roundRatio } from "./money";

export const DIMENSIONS = ["department", "costCentre", "site", "projectId"] as const;
export const dimensionRulesSchema = z.object({
  department: z.enum(["OPTIONAL", "REQUIRED", "PROHIBITED"]).optional(),
  costCentre: z.enum(["OPTIONAL", "REQUIRED", "PROHIBITED"]).optional(),
  site: z.enum(["OPTIONAL", "REQUIRED", "PROHIBITED"]).optional(),
  projectId: z.enum(["OPTIONAL", "REQUIRED", "PROHIBITED"]).optional(),
}).strict();
export const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const;
export const POSTING_PROFILES = {
  BANK: "ASSET", AR: "ASSET", INVENTORY: "ASSET", WIP: "ASSET", PREPAYMENT: "ASSET",
  ASSET: "ASSET", DEPRECIATION_ACCUMULATED: "ASSET", AP: "LIABILITY",
  VAT_OUTPUT: "LIABILITY", VAT_INPUT: "ASSET", GRNI: "LIABILITY", ACCRUAL: "LIABILITY",
  DEFERRED_REVENUE: "LIABILITY", EQUITY: "EQUITY", REVENUE: "REVENUE",
  FX_GAIN: "REVENUE", FX_LOSS: "EXPENSE", ROUNDING: "EXPENSE", EXPENSE: "EXPENSE",
  COGS: "EXPENSE", DEPRECIATION: "EXPENSE", PURCHASE_VARIANCE: "EXPENSE",
  MANUFACTURING_VARIANCE: "EXPENSE", STOCK_WRITE_OFF: "EXPENSE",
} as const;

export function validateDimensions(rules: unknown, line: Partial<Record<typeof DIMENSIONS[number], string | null>>) {
  const parsed = dimensionRulesSchema.parse(rules);
  for (const dimension of DIMENSIONS) {
    const present = Boolean(line[dimension]?.trim());
    if (parsed[dimension] === "REQUIRED" && !present) throw new Error(`${dimension} is required for this account.`);
    if (parsed[dimension] === "PROHIBITED" && present) throw new Error(`${dimension} is prohibited for this account.`);
  }
}

/** A UTC accounting day never overflows silently (e.g. 31 February). */
export function accountingDay(value: string, end = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Enter a date in YYYY-MM-DD format.");
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Enter a real calendar date.");
  return date;
}

export function translatedLines<T extends { debit: bigint; credit: bigint }>(lines: T[], rate: string, currency: string, baseCurrency: string) {
  assertBalanced(lines);
  if (currency === baseCurrency && decimalUnits(rate, 12) !== 1000000000000n) throw new Error("Same-currency exchange rate must be 1.");
  const translated = lines.map(line => ({ ...line, transactionDebit: line.debit, transactionCredit: line.credit,
    debit: convert(line.debit, rate, currency, baseCurrency), credit: convert(line.credit, rate, currency, baseCurrency) }));
  const difference = translated.reduce((total, line) => total + line.debit - line.credit, 0n);
  // Only the discrepancy actually created by translating balanced source lines can be rounded.
  if (difference > BigInt(lines.length) || difference < -BigInt(lines.length)) throw new Error("Exchange rounding exceeded the permitted line-rounding bound.");
  return { lines: translated, difference };
}

/** Clear retained carrying value, including the final penny, without rewriting the invoice. */
export function settlementValue(input: { outstanding: bigint; carryingOutstanding: bigint; amount: bigint; bankAmount: bigint; incoming: boolean }) {
  const { outstanding, carryingOutstanding, amount, bankAmount, incoming } = input;
  if (outstanding <= 0n || carryingOutstanding < 0n || amount <= 0n || amount > outstanding || bankAmount <= 0n) throw new Error("Invalid settlement or outstanding amount.");
  const carryingAmount = amount === outstanding ? carryingOutstanding : roundRatio(carryingOutstanding * amount, outstanding);
  return { carryingAmount, realisedFx: incoming ? bankAmount - carryingAmount : carryingAmount - bankAmount };
}

export function compareStatementRow(existing: { amount: bigint; date: Date; reference: string }, row: { amount: bigint; date: Date; reference: string }) {
  if (existing.amount !== row.amount || existing.date.getTime() !== row.date.getTime() || existing.reference !== row.reference) {
    throw new Error("Statement external ID already exists with different values. Review the source statement.");
  }
}
