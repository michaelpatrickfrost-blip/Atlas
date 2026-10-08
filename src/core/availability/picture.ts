/** One availability picture for Sales, Inventory, Planning and Manufacturing.
 * Planned production is incoming supply. It is not a second stock ledger. */
export type AvailabilityInput = {
  onHand: number;
  reserved: number;
  held: number;
  ordered: number;
  delivered: number;
  allocated: number;
  shipped: number;
  invoiced: number;
  planned: number;
  inProduction: number;
  expectedReceipts?: number;
  /** Sum of max(shipped, delivered) per matching source line, never across unrelated lines. */
  fulfilledQuantity?: number;
};

export type AvailabilityPicture = {
  onHand: number;
  reserved: number;
  held: number;
  ordered: number;
  delivered: number;
  allocated: number;
  shipped: number;
  invoiced: number;
  openDemand: number;
  planned: number;
  inProduction: number;
  incoming: number;
  forecasted: number;
  available: number;
  availableNow: number;
  toInvoice: number;
};

const whole = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

export function availabilityPicture(input: AvailabilityInput): AvailabilityPicture {
  const ordered = whole(input.ordered);
  const delivered = Math.min(ordered, whole(input.delivered));
  // Shipped goods have already left the inventory ledger, even before proof of delivery.
  const shipped = Math.min(ordered, whole(input.shipped));
  const openDemand = Math.max(0, ordered - whole(input.fulfilledQuantity ?? Math.max(shipped, delivered)));
  const planned = whole(input.planned);
  const inProduction = whole(input.inProduction);
  const incoming = Math.max(planned, inProduction) + whole(input.expectedReceipts ?? 0);
  const held = whole(input.held);
  const reserved = whole(input.reserved);
  const committed = Math.max(openDemand, reserved);
  const forecasted = input.onHand - held + incoming - committed;
  return {
    onHand: input.onHand,
    reserved,
    held,
    ordered,
    delivered,
    allocated: whole(input.allocated),
    shipped,
    invoiced: whole(input.invoiced),
    openDemand,
    planned,
    inProduction,
    incoming,
    forecasted,
    available: forecasted,
    availableNow: Math.max(0, input.onHand - reserved - held),
    toInvoice: Math.max(0, delivered - whole(input.invoiced)),
  };
}
