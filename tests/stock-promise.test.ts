import { describe, expect, it } from "vitest";
import { forecastCover, incomingArrivals, linesReadyToInvoice, quotationSupplyNote, stockPromiseLabel } from "@/core/availability/stock-promise";

describe("quotation stock promise", () => {
  const arrivals = incomingArrivals({
    receipts: [{ on: "2026-11-02", quantity: 4, source: "receipt" }],
    plan: [{ on: "2026-11-20", quantity: 30, source: "plan" }],
    production: [{ on: "2026-11-12", quantity: 10, source: "production" }],
  });

  it("uses the larger production plan when open production is smaller, and still counts the receipt", () => {
    expect(arrivals.map((row) => row.source)).toEqual(["receipt", "plan"]);
  });

  it("uses the plan when nothing is in production", () => {
    const planOnly = incomingArrivals({ receipts: [], plan: [{ on: "2026-12-01", quantity: 8, source: "plan" }], production: [] });
    expect(planOnly).toEqual([{ on: "2026-12-01", quantity: 8, source: "plan" }]);
  });

  it("names the date that covers the quoted quantity", () => {
    expect(forecastCover(2, 5, arrivals)).toEqual({ on: "2026-11-02", source: "receipt" });
    expect(forecastCover(0, 8, arrivals)).toEqual({ on: "2026-11-20", source: "plan" });
    expect(forecastCover(0, 40, arrivals)).toBeNull();
    expect(stockPromiseLabel(0, 8, arrivals)).toBe("Forecasted in on 20 November 2026 · production plan");
    expect(stockPromiseLabel(0, 40, arrivals)).toBe("Out of stock. No dated supply covers this quantity.");
    expect(stockPromiseLabel(8, 8, arrivals)).toBe("In stock");
  });

  it("puts the forecast and the invoice promise on the quotation", () => {
    expect(quotationSupplyNote({ quantity: 8, freeNow: 0, arrivals, invoiceWhenInStock: true })).toBe("Forecasted in on 20 November 2026 · production plan. Delivered and invoiced when back in stock.");
    expect(quotationSupplyNote({ quantity: 8, freeNow: 0, arrivals, invoiceWhenInStock: false })).toBe("Forecasted in on 20 November 2026 · production plan");
    expect(quotationSupplyNote({ quantity: 1, freeNow: null, arrivals: [], invoiceWhenInStock: true })).toBe("Delivered and invoiced when back in stock.");
    expect(quotationSupplyNote({ quantity: 1, freeNow: 0, arrivals: [], invoiceWhenInStock: false, kind: "SERVICE" })).toBeNull();
  });

  it("does not truncate calculation inputs at the thirteenth arrival", () => {
    const receipts = Array.from({ length: 15 }, (_, i) => ({ on: `2026-11-${String(i + 1).padStart(2, "0")}`, quantity: 1, source: "receipt" as const }));
    const supply = incomingArrivals({ receipts, plan: [], production: [] });
    expect(forecastCover(0, 15, supply)).toEqual({ on: "2026-11-15", source: "receipt" });
  });

  it("invoices the oldest confirmed line only when free stock covers it", () => {
    const ready = linesReadyToInvoice(6, [
      { id: "older", remaining: 4 },
      { id: "newer", remaining: 4 },
      { id: "done", remaining: 0 },
    ]);
    expect(ready.map((line) => line.id)).toEqual(["older"]);
    expect(linesReadyToInvoice(9, [
      { id: "older", remaining: 4 },
      { id: "newer", remaining: 4 },
    ]).map((line) => line.id)).toEqual(["older", "newer"]);
  });
});
