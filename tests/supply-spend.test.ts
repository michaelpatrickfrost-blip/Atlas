import { describe, expect, it } from "vitest";
import { signedSpend, spendBreakdown, unbilledCommitment, type SpendDocument } from "@/modules/finance/domain/supply-spend";
const doc = (input: Partial<SpendDocument>): SpendDocument => ({ id: "doc", kind: "AP_INVOICE", net: 10000n, gross: 12000n, settled: 0n, currency: "GBP", documentDate: new Date("2026-10-01"), accountingDate: new Date("2026-10-05"), party: { name: "Supplier" }, category: "Materials", costCentre: "Plant", site: "Factory", children: [], ...input });
describe("Supply Finance reporting", () => {
  it("deducts supplier credits and keeps separate currencies", () => {
    const result = spendBreakdown([doc({}), doc({ kind: "AP_CREDIT", net: 2500n }), doc({ kind: "AP_DEBIT", net: 500n }), doc({ currency: "EUR", net: 1000n })], "supplier");
    expect(result).toContainEqual({ label: "Supplier", currency: "GBP", net: "8000", documents: 3 });
    expect(result).toContainEqual({ label: "Supplier", currency: "EUR", net: "1000", documents: 1 });
  });
  it("uses accounting months with an explicit document-date fallback", () => {
    expect(spendBreakdown([doc({ documentDate: new Date("2026-09-01") })], "month")[0].label).toBe("2026-10");
    expect(spendBreakdown([doc({ accountingDate: null, documentDate: new Date("2026-09-01") })], "month")[0].label).toBe("2026-09");
  });
  it("counts only the remaining unbilled purchase amount", () => {
    expect(unbilledCommitment(doc({ children: [{ net: 4000n, currency: "GBP" }] }))).toBe(6000n);
    expect(unbilledCommitment(doc({ children: [{ net: 11000n, currency: "GBP" }] }))).toBe(0n);
    expect(() => unbilledCommitment(doc({ children: [{ net: 1n, currency: "EUR" }] }))).toThrow("different currency");
  });
  it("retains integer precision for large posted values", () => {
    expect(signedSpend("AP_CREDIT", 900719925474099300n)).toBe(-900719925474099300n);
    expect(spendBreakdown([doc({ net: 900719925474099301n })], "site")[0].net).toBe("900719925474099301");
  });
});
