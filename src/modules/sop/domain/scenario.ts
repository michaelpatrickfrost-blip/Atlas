import type { DemandRow } from './engine';
import { monthOffset } from './engine';

export type ScenarioAssumptions = {
  demandPercent: number;
  pricePercent: number;
  productionPercent: number;
  receiptDelayMonths: number;
  unitCostPercent: number;
};

/** Recalculate stock chronologically without modifying the retained source rows. */
export function scenarioRows(source: DemandRow[], assumptions: ScenarioAssumptions, unitCostMinor: number | null) {
  const receipts = new Map<string, number>();
  for (const row of source) {
    const key = row.productId + '|' + monthOffset(row.period, assumptions.receiptDelayMonths);
    receipts.set(key, (receipts.get(key) ?? 0) + row.receipts);
  }
  const openings = new Map<string, number | null>();
  return source.map(original => {
    const row = { ...original };
    row.consensus = Math.max(row.confirmedOrders, row.consensus * (1 + assumptions.demandPercent / 100));
    row.adjustment += row.consensus - original.consensus;
    row.remainingDemand = Math.max(row.openOrders, row.consensus - row.fulfilled);
    row.priceMinor = Math.round(row.priceMinor * (1 + assumptions.pricePercent / 100));
    row.receipts = receipts.get(row.productId + '|' + row.period) ?? 0;
    row.production *= 1 + assumptions.productionPercent / 100;
    row.opening = openings.has(row.productId) ? openings.get(row.productId)! : original.opening;
    // Current stock starts at the first period for which the base had stock evidence.
    if (row.opening == null && original.opening != null) row.opening = original.opening;
    const available = row.opening == null ? null : Math.max(0, row.opening + row.receipts + row.production);
    row.constrained = available == null ? null : Math.min(row.remainingDemand, Math.max(0, available - row.safetyStock));
    row.atRisk = row.constrained == null ? null : row.remainingDemand - row.constrained;
    row.closing = available == null ? null : available - row.remainingDemand;
    openings.set(row.productId, row.closing == null ? null : Math.max(0, row.closing));
    row.revenueMinor = Math.round(row.committedRevenueMinor + Math.max(0, row.consensus - row.confirmedOrders) * row.priceMinor);
    row.costMinor = unitCostMinor == null ? null : Math.round(row.consensus * unitCostMinor * (1 + assumptions.unitCostPercent / 100));
    row.marginMinor = row.costMinor == null ? null : row.revenueMinor - row.costMinor;
    return row;
  });
}

export function forecastBridge(before: DemandRow[], after: DemandRow[]) {
  const old = new Map(before.map(row => [row.productId + '|' + row.period, row]));
  const next = new Map(after.map(row => [row.productId + '|' + row.period, row]));
  let volume = 0, price = 0, interaction = 0, committed = 0;
  for (const key of new Set([...old.keys(), ...next.keys()])) {
    const a = old.get(key), b = next.get(key), oldQuantity = Math.max(0,(a?.consensus ?? 0)-(a?.confirmedOrders??0)), newQuantity = Math.max(0,(b?.consensus ?? 0)-(b?.confirmedOrders??0));
    committed += (b?.committedRevenueMinor??0)-(a?.committedRevenueMinor??0);
    const oldPrice = a?.priceMinor ?? b?.priceMinor ?? 0, newPrice = b?.priceMinor ?? oldPrice;
    volume += (newQuantity - oldQuantity) * oldPrice;
    price += oldQuantity * (newPrice - oldPrice);
    interaction += (newQuantity - oldQuantity) * (newPrice - oldPrice);
  }
  const opening = before.reduce((sum, row) => sum + row.revenueMinor, 0);
  const closing = after.reduce((sum, row) => sum + row.revenueMinor, 0);
  return { opening, volume, price, interaction, committed, rounding: closing - opening - volume - price - interaction - committed, closing };
}
