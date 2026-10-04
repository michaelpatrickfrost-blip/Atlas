import { describe, expect, it } from "vitest";
import { isUkSaleCountry, parseHeaderDiscount, presentationTotals, settleSale, vatOnNet } from "@/modules/sales/domain/uk-sale";

describe("UK sales VAT", () => {
  it("charges 20% on a UK address and on a sale with no country yet", () => {
    expect(vatOnNet(10000, "STANDARD", "GB").amount).toBe(2000);
    expect(vatOnNet(10000, "STANDARD", "United Kingdom").treatment).toBe("STANDARD");
    expect(vatOnNet(10000, "STANDARD", null).amount).toBe(2000);
    expect(vatOnNet(10000, "STANDARD", "").explanation).toMatch(/20%/);
  });

  it("charges no VAT when the delivery address is outside the UK", () => {
    for (const country of ["FR", "France", "US", "IE", "DE"]) {
      const tax = vatOnNet(25000, "STANDARD", country);
      expect(tax.amount).toBe(0);
      expect(tax.treatment).toBe("EXPORT");
    }
    expect(isUkSaleCountry("England")).toBe(true);
    expect(isUkSaleCountry("Germany")).toBe(false);
  });

  it("keeps a zero-rated product free of VAT in the UK", () => {
    expect(vatOnNet(10000, "ZERO_RATED", "GB").amount).toBe(0);
    expect(vatOnNet(10000, "EXEMPT", "GB").amount).toBe(0);
  });
});

describe("overall discount", () => {
  it("takes the discount off before VAT and can be removed", () => {
    const discounted = settleSale([{ net: 10000, taxCategory: "STANDARD" }], 10, "GB");
    expect(discounted.headerDiscount).toBe(1000);
    expect(discounted.net).toBe(9000);
    expect(discounted.tax).toBe(1800);
    expect(discounted.gross).toBe(10800);

    const removed = settleSale([{ net: 10000, taxCategory: "STANDARD" }], 0, "GB");
    expect(removed.headerDiscount).toBe(0);
    expect(removed.tax).toBe(2000);
    expect(removed.gross).toBe(12000);
  });

  it("does not add VAT to an export after the discount", () => {
    const sale = settleSale([{ net: 10000, taxCategory: "STANDARD" }, { net: 5000, taxCategory: "STANDARD" }], 10, "FR");
    expect(sale.headerDiscount).toBe(1500);
    expect(sale.net).toBe(13500);
    expect(sale.tax).toBe(0);
    expect(sale.gross).toBe(13500);
    expect(sale.lines.reduce((sum, line) => sum + line.share, 0)).toBe(1500);
  });

  it("rejects a discount outside 0 to 100", () => {
    expect(parseHeaderDiscount("")).toBe(0);
    expect(parseHeaderDiscount("12.5")).toBe(12.5);
    expect(() => parseHeaderDiscount(101)).toThrow(/overall discount/);
    expect(() => parseHeaderDiscount(-1)).toThrow(/overall discount/);
  });

  it("shows the overall discount separately from the goods", () => {
    const view = presentationTotals({
      lines: [{ type: "PRODUCT", unitAmount: 10000, quantity: 1, discountPercent: 0 }],
      netAmount: 9000,
      headerDiscountPercent: 10,
      deliveryCountry: "GB",
    });
    expect(view.overallDiscount).toBe(1000);
    expect(view.vatLabel).toBe("VAT");
    expect(presentationTotals({ lines: [], netAmount: 0, deliveryCountry: "US" }).vatLabel).toBe("No VAT");
  });
});
