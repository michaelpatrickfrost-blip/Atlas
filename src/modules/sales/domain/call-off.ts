import { validQuantity, addQuantity } from "@/core/shared/quantity";
export type CommitmentLine = { key: string; committed: number };
export type ReleasedDraw = { key: string; quantity: number; orderId: string };
export type ProposedDraw = { key: string; quantity: number; label?: string };

export type OpenLine = CommitmentLine & { released: number; remaining: number };

/** Remaining commitment after every live call-off, including drafts.
 *  Cancelling an order removes its draw because that order is omitted here. */
export function openCommitment(lines: CommitmentLine[], draws: ReleasedDraw[], excludeOrderId?: string): OpenLine[] {
  const used = new Map<string, number>();
  for (const draw of draws) {
    if (excludeOrderId && draw.orderId === excludeOrderId) continue;
    if (!validQuantity(draw.quantity) || draw.quantity < 0) throw new Error("A call-off quantity must have up to six decimal places.");
    used.set(draw.key, addQuantity(used.get(draw.key) ?? 0, draw.quantity));
  }
  return lines.map((line) => {
    if (!validQuantity(line.committed) || line.committed <= 0) throw new Error("An agreement line needs a committed quantity.");
    const released = used.get(line.key) ?? 0;
    return { ...line, released, remaining: addQuantity(line.committed, -released) };
  });
}

export function assertDrawFits(lines: CommitmentLine[], draws: ReleasedDraw[], proposed: ProposedDraw[], excludeOrderId?: string) {
  const open = new Map(openCommitment(lines, draws, excludeOrderId).map((line) => [line.key, line]));
  const seen = new Set<string>();
  for (const line of proposed) {
    if (!validQuantity(line.quantity) || line.quantity <= 0) throw new Error("Enter a positive call-off quantity.");
    if (seen.has(line.key)) throw new Error("Each agreement line can be called off once on an order.");
    seen.add(line.key);
    const slot = open.get(line.key);
    if (!slot) throw new Error("This product is not on the call-off agreement.");
    if (line.quantity > slot.remaining) throw new Error(`Only ${slot.remaining} remains on ${line.label ?? "this agreement line"}.`);
  }
  return open;
}
