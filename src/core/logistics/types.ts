/**
 * Contract for a future Logistics module. Sales consumes a fulfilment
 * projection through this interface — it never understands warehouse
 * transactions, allocation, picking or shipments (§24-26, §54). No
 * implementation exists yet; see docs/modules/SALES_ORDER_PROCESSING.md
 * §Logistics contract. Until Logistics is installed, the order record
 * hides its Delivery tab entirely rather than showing invented status.
 */
export type FulfilmentLineStatus = {
  lineId: string;
  allocatedQuantity: number;
  pickedQuantity: number;
  shippedQuantity: number;
  returnedQuantity: number;
};

export type FulfilmentProjection = {
  orderId: string;
  lineCount: number;
  readyLineCount: number;
  totalUnitsOrdered: number;
  totalUnitsShipped: number;
  nextDeliveryDate: Date | null;
  lines: FulfilmentLineStatus[];
};

export type FulfilmentProjectionProvider = (orderId: string) => Promise<FulfilmentProjection | null>;

/** Events a future Logistics module would publish; Sales only ever
 *  subscribes, never calls into Logistics internals directly (§50). */
export const LOGISTICS_EVENT_NAMES = [
  "logistics.allocation.created",
  "logistics.order.released",
  "logistics.pick.completed",
  "logistics.shipment.created",
  "logistics.shipment.dispatched",
  "logistics.shipment.delivered",
  "logistics.delivery.failed",
] as const;
