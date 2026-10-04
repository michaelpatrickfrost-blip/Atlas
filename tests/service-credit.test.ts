import { describe, expect, it } from "vitest";
import { serviceCreditAmounts } from "@/modules/service/domain/credit";

describe("service credit against a customer invoice", () => {
  it("adds VAT in the same proportion as the invoice line", () => {
    expect(serviceCreditAmounts(10_000n, 50_000n, 10_000n, 60_000n)).toEqual({ net: 10_000n, tax: 2_000n, gross: 12_000n });
  });

  it("refuses a credit larger than the amount still owed", () => {
    expect(() => serviceCreditAmounts(50_000n, 50_000n, 10_000n, 12_000n)).toThrow(/still owes/);
  });

  it("refuses a zero amount", () => {
    expect(() => serviceCreditAmounts(0n, 50_000n, 10_000n, 60_000n)).toThrow(/credit amount/);
  });
});
