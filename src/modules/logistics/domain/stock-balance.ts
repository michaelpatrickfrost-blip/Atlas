/** How much of a waiting order can leave when stock comes back. Pure: no database. */

export type WaitingBalance = {
  id: string;
  open: number;
  allocated: number;
  shipped: number;
  onPick: number;
  partialAllowed: boolean;
  /** True while the order is still short of stock. A fully allocated in-stock order stays with the warehouse. */
  short: boolean;
  promisedAt: number | null;
  placedAt: number;
};

export type BalanceRelease = { id: string; deliver: number; reserve: number };

export function coverWaitingStock(available: number, orders: WaitingBalance[]): BalanceRelease[] {
  const ranked = [...orders].sort((left, right) => {
    const leftPromise = left.promisedAt ?? Number.MAX_SAFE_INTEGER;
    const rightPromise = right.promisedAt ?? Number.MAX_SAFE_INTEGER;
    if (leftPromise !== rightPromise) return leftPromise - rightPromise;
    return left.placedAt - right.placedAt;
  });
  let left = Math.max(0, Math.floor(available));
  const plan: BalanceRelease[] = [];
  for (const order of ranked) {
    if (order.open <= 0 || !order.short) continue;
    const unshipped = Math.max(0, order.allocated - order.shipped - order.onPick);
    const gap = Math.max(0, order.open - Math.max(0, order.allocated - order.shipped));
    const take = Math.min(gap, left);
    const deliver = unshipped + take;
    if (deliver <= 0) continue;
    if (take === 0 && !(gap === 0 && unshipped > 0)) continue;
    if (!order.partialAllowed && order.onPick > 0) continue;
    const covered = order.partialAllowed
      ? deliver > 0 && (take > 0 || unshipped > 0)
      : order.onPick === 0 && unshipped + take >= order.open;
    if (!covered) continue;
    plan.push({ id: order.id, deliver, reserve: take });
    left -= take;
  }
  return plan;
}
