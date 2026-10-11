import { addQuantity } from "@/core/shared/quantity";

export type EligiblePosition = { id: string; warehouseId: string; locationId: string; lotId: string; status: string; quantity: number };
type Lot = { id: string; code: string; expiresOn: Date | null; removalOn: Date | null };
type Hold = { warehouseId: string | null; locationId: string | null; lotCode: string | null };
type Reservation = { id: string; locationId: string | null; lotId: string | null; quantity: number };

/** Use the same physical exclusions for planning, reservations and actual issues. */
export function eligiblePositions(positions: EligiblePosition[], lots: Lot[], holds: Hold[], trackingMode: string, now = new Date()) {
  const byId = new Map(lots.map(row => [row.id, row]));
  return positions.filter(position => {
    if (position.status !== "AVAILABLE" || position.quantity <= 0) return false;
    const lot = byId.get(position.lotId);
    if (trackingMode === "LOT" && !lot) return false;
    if (lot?.expiresOn && lot.expiresOn <= now) return false;
    return !holds.some(hold => (!hold.warehouseId || hold.warehouseId === position.warehouseId) && (!hold.locationId || hold.locationId === position.locationId) && (!hold.lotCode || hold.lotCode === lot?.code));
  }).sort((a,b) => (byId.get(a.lotId)?.removalOn?.getTime() ?? byId.get(a.lotId)?.expiresOn?.getTime() ?? Infinity) - (byId.get(b.lotId)?.removalOn?.getTime() ?? byId.get(b.lotId)?.expiresOn?.getTime() ?? Infinity) || a.id.localeCompare(b.id));
}

/** Allocate each reservation once, most specific first. A broad reservation is not deducted in every bin. */
export function unreservedPositions(positions: EligiblePosition[], reservations: Reservation[]) {
  const rows = positions.map(row => ({ ...row }));
  const ordered = [...reservations].sort((a,b) => Number(Boolean(b.locationId)) + Number(Boolean(b.lotId)) - Number(Boolean(a.locationId)) - Number(Boolean(a.lotId)) || a.id.localeCompare(b.id));
  let unmatched = 0;
  for (const reservation of ordered) {
    let remaining = reservation.quantity;
    for (const row of rows) {
      if (remaining <= 0) break;
      if ((reservation.locationId && reservation.locationId !== row.locationId) || (reservation.lotId && reservation.lotId !== row.lotId)) continue;
      const protectedQuantity = Math.min(row.quantity, remaining);
      row.quantity = addQuantity(row.quantity, -protectedQuantity);
      remaining = addQuantity(remaining, -protectedQuantity);
    }
    unmatched = addQuantity(unmatched, remaining);
  }
  // An unfulfilled specific reservation must also remain protected from a later general issue.
  for (const row of rows) {
    const protectedQuantity = Math.min(row.quantity, unmatched);
    row.quantity = addQuantity(row.quantity, -protectedQuantity);
    unmatched = addQuantity(unmatched, -protectedQuantity);
  }
  return rows.filter(row => row.quantity > 0);
}
