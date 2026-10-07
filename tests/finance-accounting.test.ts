import { describe, expect, it } from "vitest";
import { accountingDay, settlementValue, translatedLines, validateDimensions, compareStatementRow } from "@/modules/finance/domain/accounting";
import { assertBalanced } from "@/modules/finance/domain/money";
import { periodAllows } from "@/modules/finance/domain/controls";

describe("Account structures and financial dates", () => {
  it("enforces required and prohibited dimensions independently", () => {
    expect(() => validateDimensions({ department: "REQUIRED", site: "PROHIBITED" }, {})).toThrow("department is required");
    expect(() => validateDimensions({ department: "REQUIRED", site: "PROHIBITED" }, { department: "Production", site: "A" })).toThrow("site is prohibited");
    expect(() => validateDimensions({ department: "REQUIRED", projectId: "OPTIONAL" }, { department: "Production" })).not.toThrow();
  });
  it("fails closed for malformed dimension policies", () => {
    expect(() => validateDimensions({ department: "IGNORE" }, {})).toThrow();
    expect(() => validateDimensions({ arbitrary: "REQUIRED" }, {})).toThrow();
  });
  it.each(["2026-02-29", "2026-02-31", "2026-13-01", "01/02/2026", "", "2026-10-07T00:00:00Z"])("rejects a non-accounting day: %s", value => expect(() => accountingDay(value)).toThrow());
  it("supports leap days and complete report end dates", () => {
    expect(accountingDay("2028-02-29").toISOString()).toBe("2028-02-29T00:00:00.000Z");
    expect(accountingDay("2026-10-07", true).toISOString()).toBe("2026-10-07T23:59:59.999Z");
  });
  it("uses explicit source exceptions only while on hold", () => {
    expect(periodAllows("SOFT_CLOSED", "AR_INVOICE", ["AP_INVOICE"])).toBe(false);
    expect(periodAllows("SOFT_CLOSED", "AR_INVOICE", ["AR_INVOICE"])).toBe(true);
    expect(periodAllows("SOFT_CLOSED", "AP_INVOICE", [])).toBe(false);
    expect(periodAllows("CLOSED", "BANK", ["BANK"])).toBe(false);
    expect(periodAllows("LOCKED", "BANK", ["BANK"])).toBe(false);
  });
});

describe("Historical currency translation and realised exchange differences", () => {
  it("retains the EUR 10,000 invoice at GBP 8,600", () => {
    const result = translatedLines([{ debit: 1000000n, credit: 0n }, { debit: 0n, credit: 1000000n }], "0.86", "EUR", "GBP");
    expect(result.lines.map(line => [line.debit, line.credit, line.transactionDebit, line.transactionCredit])).toEqual([[860000n, 0n, 1000000n, 0n], [0n, 860000n, 0n, 1000000n]]);
    expect(result.difference).toBe(0n);
  });
  it("identifies a translation penny without weakening source balancing", () => {
    const result = translatedLines([{ debit: 1n, credit: 0n }, { debit: 1n, credit: 0n }, { debit: 0n, credit: 2n }], "0.5", "EUR", "GBP");
    expect(result.difference).toBe(1n);
    expect(() => assertBalanced(result.lines)).toThrow();
    expect(assertBalanced([...result.lines, { debit: 0n, credit: 1n }])).toBe(2n);
    expect(() => translatedLines([{ debit: 2n, credit: 0n }, { debit: 0n, credit: 1n }], "0.5", "EUR", "GBP")).toThrow();
  });
  it("rejects same-currency reinterpretation and invalid rates", () => {
    const lines = [{ debit: 100n, credit: 0n }, { debit: 0n, credit: 100n }];
    expect(() => translatedLines(lines, "1.1", "GBP", "GBP")).toThrow("must be 1");
    expect(() => translatedLines(lines, "0", "EUR", "GBP")).toThrow();
    expect(() => translatedLines(lines, "-1", "EUR", "GBP")).toThrow();
  });
  it("posts the specified GBP 150 realised supplier loss", () => {
    expect(settlementValue({ outstanding: 1000000n, carryingOutstanding: 860000n, amount: 1000000n, bankAmount: 875000n, incoming: false })).toEqual({ carryingAmount: 860000n, realisedFx: -15000n });
  });
  it.each([{ incoming: true, bankAmount: 875000n, expected: 15000n }, { incoming: true, bankAmount: 850000n, expected: -10000n }, { incoming: false, bankAmount: 850000n, expected: 10000n }])("handles gain/loss direction: %o", ({ incoming, bankAmount, expected }) => {
    expect(settlementValue({ outstanding: 1000000n, carryingOutstanding: 860000n, amount: 1000000n, bankAmount, incoming }).realisedFx).toBe(expected);
  });
  it("clears retained carrying value across partial payments including the final penny", () => {
    const first = settlementValue({ outstanding: 3n, carryingOutstanding: 2n, amount: 1n, bankAmount: 1n, incoming: true });
    const second = settlementValue({ outstanding: 2n, carryingOutstanding: 2n - first.carryingAmount, amount: 1n, bankAmount: 1n, incoming: true });
    const last = settlementValue({ outstanding: 1n, carryingOutstanding: 2n - first.carryingAmount - second.carryingAmount, amount: 1n, bankAmount: 1n, incoming: true });
    expect(first.carryingAmount + second.carryingAmount + last.carryingAmount).toBe(2n);
    expect(first.realisedFx + second.realisedFx + last.realisedFx).toBe(1n);
  });
  it("uses the remaining carrying balance after a posted credit", () => {
    expect(settlementValue({ outstanding: 800000n, carryingOutstanding: 688000n, amount: 800000n, bankAmount: 700000n, incoming: false })).toEqual({ carryingAmount: 688000n, realisedFx: -12000n });
  });
  it("retains amounts beyond JavaScript integer precision", () => {
    const amount = 9007199254740993n;
    expect(settlementValue({ outstanding: amount, carryingOutstanding: amount, amount, bankAmount: amount + 15000n, incoming: true }).realisedFx).toBe(15000n);
  });
  it.each([{ amount: 101n, bankAmount: 100n }, { amount: 0n, bankAmount: 100n }, { amount: -1n, bankAmount: 100n }, { amount: 100n, bankAmount: 0n }])("rejects invalid allocation: %o", values => {
    expect(() => settlementValue({ outstanding: 100n, carryingOutstanding: 100n, incoming: true, ...values })).toThrow();
  });
});

describe("Bank statement evidence", () => {
  const original = { amount: 1200000n, date: accountingDay("2026-10-07"), reference: "INV-001" };
  it("accepts exact retry evidence", () => expect(() => compareStatementRow(original, { ...original })).not.toThrow());
  it.each([{ amount: 1200001n }, { date: accountingDay("2026-10-08") }, { reference: "INV-002" }])("rejects changed evidence under the same ID: %o", change => expect(() => compareStatementRow(original, { ...original, ...change })).toThrow("different values"));
});
