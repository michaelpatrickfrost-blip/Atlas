import { expect, it } from "vitest";
import { distributeValue, outputCost, proportionalValue, productionCostAllocation } from "@/modules/finance/domain/production-cost";
import { lineAmounts } from "@/modules/finance/domain/money";
it("allocates new backflush material in full and only proportions pre-existing WIP", () => {
  expect(productionCostAllocation(1600n, 600n, 3, 10, false)).toBe(900n);
  expect(productionCostAllocation(2100n, 1400n, 7, 7, true)).toBe(2100n);
  expect(900n + 2100n).toBe(3000n);
});
it("proportions materials already issued before production and clears the last penny at finish", () => {
  expect(productionCostAllocation(3001n, 0n, 3, 10, false)).toBe(900n);
  expect(productionCostAllocation(2101n, 0n, 7, 7, true)).toBe(2101n);
  expect(proportionalValue(1001n, 1, 1)).toBe(1001n);
});
it("separates good output and reported scrap without losing money", () => {
  expect(outputCost(3001n, 8, 2)).toEqual({ inventory: 2401n, scrap: 600n });
  expect(outputCost(3001n, 0, 2)).toEqual({ inventory: 0n, scrap: 3001n });
});
it("allocates one mixed-cycle cost exactly across different load footprints", () => {
  const rows = distributeValue(10001n, [{ id: "large", quantity: 200 }, { id: "small", quantity: 75 }]);
  expect(rows).toEqual([{ id: "large", value: 7273n }, { id: "small", value: 2728n }]);
  expect(rows.reduce((sum, row) => sum + row.value, 0n)).toBe(10001n);
  expect(distributeValue(2n, [{ id: "c", quantity: 1 }, { id: "b", quantity: 1 }, { id: "a", quantity: 1 }])).toEqual([{ id: "c", value: 0n }, { id: "b", value: 1n }, { id: "a", value: 1n }]);
});
it("retains exact monetary values above Number’s integer range", () => {
  const value = 999999999999999999n;
  expect(distributeValue(value, [{ id: "a", quantity: 0.000001 }, { id: "b", quantity: 0.000002 }]).reduce((sum, row) => sum + row.value, 0n)).toBe(value);
});
it("prices kg per tonne without a rounded per-kg penny price", () => {
  expect(lineAmounts("1250", 25000n, 2000, "1000")).toEqual({ net: 31250n, tax: 6250n, gross: 37500n });
  expect(lineAmounts("10.5", 2000n, 0, "1000").net).toBe(21n);
  expect(() => lineAmounts("1", 2000n, 0, "0")).toThrow();
});
it("rejects inconsistent WIP and allocation quantities", () => {
  expect(() => productionCostAllocation(99n, 100n, 1, 2, false)).toThrow();
  expect(() => proportionalValue(100n, 3, 2)).toThrow();
});
