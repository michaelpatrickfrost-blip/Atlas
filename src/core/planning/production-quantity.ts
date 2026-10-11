import { addQuantity } from "@/core/shared/quantity";
/** Finished receipts are already on hand; open supply contains only output still possible. */
export function remainingProductionQuantity(order: { quantity: number; workOrders: Array<{ sequence: number; status: string; producedQuantity: number; scrapQuantity: number }> }) {
  const steps = [...order.workOrders].sort((a, b) => a.sequence - b.sequence);
  if (!steps.length) return order.quantity;
  let possible = order.quantity;
  for (const step of steps.slice(0, -1)) possible = step.status === "COMPLETE" ? Math.min(possible, step.producedQuantity) : Math.max(0, addQuantity(possible, -step.scrapQuantity));
  const last = steps.at(-1)!;
  return last.status === "COMPLETE" ? 0 : Math.max(0, addQuantity(possible, -last.producedQuantity, -last.scrapQuantity));
}
