import { scaledQuantity } from "@/core/shared/measurement";

/** Allocate minor units once. The last quantity takes every remaining penny. */
export function proportionalValue(value: bigint, quantity: number, totalQuantity: number) {
  const part = scaledQuantity(quantity), total = scaledQuantity(totalQuantity);
  if (value < 0n || part < 0n || total <= 0n || part > total) throw new Error("Invalid cost allocation quantities.");
  return part === total ? value : (value * part + total / 2n) / total;
}
export function outputCost(value: bigint, good: number, scrap: number) {
  const total = Number(scaledQuantity(good) + scaledQuantity(scrap)) / 1_000_000;
  if (!total) return { inventory: 0n, scrap: value };
  const inventory = proportionalValue(value, good, total);
  return { inventory, scrap: value - inventory };
}
export function productionCostAllocation(wip: bigint, newlyIssued: bigint, reported: number, remainingBefore: number, finish: boolean) {
  if (newlyIssued < 0n || wip < newlyIssued) throw new Error("Production WIP is inconsistent with its new material issues.");
  if (finish) return wip;
  return newlyIssued + (reported ? proportionalValue(wip - newlyIssued, reported, remainingBefore) : 0n);
}
export function distributeValue(value: bigint, weights: Array<{ id: string; quantity: number }>) {
  const total = weights.reduce((sum, row) => sum + scaledQuantity(row.quantity), 0n);
  if (value < 0n || total <= 0n) throw new Error("Enter positive shared-cost allocation weights.");
  const rows = weights.map(row => ({ id: row.id, value: value * scaledQuantity(row.quantity) / total, remainder: value * scaledQuantity(row.quantity) % total }));
  let left = value - rows.reduce((sum, row) => sum + row.value, 0n);
  for (const row of [...rows].sort((a, b) => a.remainder > b.remainder ? -1 : a.remainder < b.remainder ? 1 : a.id.localeCompare(b.id))) { if (!left) break; row.value += 1n; left -= 1n; }
  return rows.map(({ id, value }) => ({ id, value }));
}
