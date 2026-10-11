import { expect, it } from "vitest";
import { remainingProductionQuantity } from "@/core/planning/production-quantity";
const step = (sequence: number, status: string, producedQuantity: number, scrapQuantity = 0) => ({ sequence, status, producedQuantity, scrapQuantity });
it("does not count partial finished receipts as open supply again", () => {
  expect(remainingProductionQuantity({ quantity: 10, workOrders: [step(1, "RUNNING", 3)] })).toBe(7);
});
it("accounts for earlier scrap and short completion before the final operation", () => {
  expect(remainingProductionQuantity({ quantity: 10, workOrders: [step(1, "COMPLETE", 8, 1), step(2, "RUNNING", 3, 1)] })).toBe(4);
});
it("retains fractional supply and planned orders without operations", () => {
  expect(remainingProductionQuantity({ quantity: 0.3, workOrders: [step(1, "RUNNING", 0.1)] })).toBe(0.2);
  expect(remainingProductionQuantity({ quantity: 0.3, workOrders: [] })).toBe(0.3);
});
it("a completed final operation has no unreceived open supply", () => {
  expect(remainingProductionQuantity({ quantity: 10, workOrders: [step(1, "COMPLETE", 8, 1)] })).toBe(0);
});
