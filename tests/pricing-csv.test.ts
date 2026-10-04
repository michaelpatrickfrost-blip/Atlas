import { describe, expect, it } from "vitest";
import { readPriceCsv } from "@/core/pricing/csv";
import { chooseAgreement, parseHours } from "@/core/pricing/agreements";

describe("price spreadsheets", () => {
  it("reads the shared template and friendly headings, and skips blank prices", () => {
    const file = ["product_code,product_name,unit_price,minimum_quantity,valid_from,valid_to", "SKU-1,Widget,12.50,10,2026-01-01,2026-12-31", "SKU-2,Spare,,1,,"].join("\n");
    const result = readPriceCsv(file);
    expect(result.skipped).toBe(1);
    expect(result.rows).toEqual([{ line: 2, productCode: "SKU-1", minimumQuantity: 10, unitPrice: 12.5, discountPercent: 0, validFrom: "2026-01-01", validTo: "2026-12-31" }]);
  });

  it("reports a bad price without dropping the rest of the file", () => {
    const result = readPriceCsv("productCode,unitPrice\nSKU-1,12.555\nSKU-2,4");
    expect(result.issues[0]?.message).toMatch(/two decimal/);
    expect(result.rows.map((row) => row.productCode)).toEqual(["SKU-2"]);
  });

  it("reads a discount off the set price", () => {
    const result = readPriceCsv("productCode,unitPrice,discount\nSKU-1,10.00,12.5");
    expect(result.rows[0]).toMatchObject({ unitPrice: 10, discountPercent: 12.5 });
  });

  it("rejects a file with no price column", () => {
    expect(() => readPriceCsv("code,name\nA,Widget")).toThrow(/price columns/);
  });
});

describe("agreement coverage", () => {
  const asOf = new Date("2026-10-03T12:00:00Z");
  const row = (values: { id: string; status?: string; startsOn?: string; endsOn?: string | null; priceListId?: string | null }) => ({
    id: values.id,
    name: "Contract",
    status: values.status ?? "ACTIVE",
    startsOn: new Date(values.startsOn ?? "2026-01-01"),
    endsOn: values.endsOn ? new Date(values.endsOn) : null,
    priceListId: values.priceListId ?? null,
  });

  it("ignores drafts and expired agreements and keeps the latest start", () => {
    const chosen = chooseAgreement([
      row({ id: "draft", status: "DRAFT" }),
      row({ id: "old", startsOn: "2026-01-01" }),
      row({ id: "new", startsOn: "2026-08-01" }),
      row({ id: "ended", endsOn: "2026-09-01" }),
    ], asOf);
    expect(chosen?.id).toBe("new");
  });

  it("stores service targets as whole hours", () => {
    expect(parseHours("4", "Response")).toBe(240);
    expect(parseHours("", "Response")).toBeNull();
    expect(() => parseHours("1.5", "Response")).toThrow(/whole number/);
  });
});
