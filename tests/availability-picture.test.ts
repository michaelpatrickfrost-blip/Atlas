import { describe, expect, it } from "vitest";
import { availabilityPicture } from "@/core/availability/picture";
import { buildCoverage } from "@/modules/planning/domain/netting";
import type { InventorySnapshot, PlanningDemand } from "@/core/planning/types";

describe("commercial availability", () => {
  it("treats planned production as forecasted stock and does not count a reservation twice", () => {
    const picture = availabilityPicture({ onHand: 100, reserved: 30, held: 0, ordered: 30, delivered: 0, allocated: 30, shipped: 0, invoiced: 0, planned: 0, inProduction: 0 });
    expect(picture.available).toBe(70);
    expect(picture.openDemand).toBe(30);
    expect(picture.toInvoice).toBe(0);
  });

  it("uses the larger of the production plan and open production, and invoices only what was delivered", () => {
    const picture = availabilityPicture({ onHand: 20, reserved: 0, held: 5, ordered: 40, delivered: 10, allocated: 10, shipped: 10, invoiced: 4, planned: 80, inProduction: 25 });
    expect(picture.incoming).toBe(80);
    expect(picture.openDemand).toBe(30);
    expect(picture.forecasted).toBe(20 - 5 + 80 - 30);
    expect(picture.available).toBe(picture.forecasted);
    expect(picture.toInvoice).toBe(6);
    expect(picture.availableNow).toBe(15);
  });

  it("drops delivered demand out of what planning still has to cover", () => {
    const snapshot: InventorySnapshot = { products: [{ id: "p", code: "P", name: "Product", unitOfMeasure: "each", active: true }], warehouses: [], balances: [{ id: "b", productId: "p", warehouseId: "a", quantity: 10 }] };
    const demand: PlanningDemand[] = [{ id: "line", productId: "p", orderId: "o", reference: "SO-1", quantity: 12, unitOfMeasure: "each", requiredDate: "2026-10-10" }];
    const [row] = buildCoverage(snapshot, demand, { incoming: { p: 8 }, delivered: { line: 5 } });
    expect(row.demand).toBe(7);
    expect(row.incoming).toBe(8);
    expect(row.forecasted).toBe(11);
    expect(row.shortage).toBe(0);
    expect(row.orders[0].covered).toBe(7);
  });
});
