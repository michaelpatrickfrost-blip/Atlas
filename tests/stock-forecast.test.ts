import { describe, expect, it } from "vitest";
import { forecastStock } from "@/modules/stock/domain/forecast";

const today = new Date("2026-10-05T00:00:00Z");
const base = { available: 100, usedInWindow: 0, windowDays: 90, monthlyUsage: null, leadTimeDays: 0, safetyStock: 0 };

describe("forecastStock", () => {
  it("reads usage from the ledger and dates the run-out", () => {
    const result = forecastStock({ ...base, available: 100, usedInWindow: 180 }, today);
    expect(result.dailyUsage).toBe(2);
    expect(result.usageSource).toBe("history");
    expect(result.daysOfCover).toBe(50);
    expect(result.runsOutOn).toBe("2026-11-24");
    expect(result.state).toBe("COVERED");
    expect(result.suggestedOrder).toBe(0);
  });
  it("lets a set monthly figure replace history", () => {
    const result = forecastStock({ ...base, usedInWindow: 900, monthlyUsage: 30 }, today);
    expect(result.dailyUsage).toBe(1);
    expect(result.usageSource).toBe("set");
    expect(result.next30).toBe(30);
  });
  it("orders now at the reorder point and covers lead time, a month and safety stock", () => {
    const result = forecastStock({ ...base, available: 40, monthlyUsage: 60, leadTimeDays: 10, safetyStock: 20 }, today);
    expect(result.reorderPoint).toBe(40);
    expect(result.state).toBe("ORDER_NOW");
    expect(result.suggestedOrder).toBe(60);
  });
  it("warns two weeks ahead of the reorder point", () => {
    expect(forecastStock({ ...base, available: 60, monthlyUsage: 60, leadTimeDays: 10, safetyStock: 20 }, today).state).toBe("ORDER_SOON");
  });
  it("flags a shortfall against orders even with no usage", () => {
    const result = forecastStock({ ...base, available: -5 }, today);
    expect(result.state).toBe("ORDER_NOW");
    expect(result.suggestedOrder).toBe(5);
  });
  it("says nothing when there is no usage and no safety stock", () => {
    const result = forecastStock(base, today);
    expect(result.state).toBe("NO_USAGE");
    expect(result.daysOfCover).toBeNull();
  });
});
