/**
 * Logistics contracts. Sales, Stock, Finance, Purchasing and Fleet meet Logistics
 * here. Callers use these providers; they do not read another module's tables.
 */

export type LogisticsActor = { organisationId: string; userId: string };

export type FulfilmentLineStatus = {
  lineId: string;
  allocatedQuantity: number;
  pickedQuantity: number;
  packedQuantity: number;
  shippedQuantity: number;
  deliveredQuantity: number;
  returnedQuantity: number;
  allocationStatus: string;
};

export type FulfilmentProjection = {
  requirementId?: string | null;
  orderId: string;
  reference: string | null;
  lineCount: number;
  readyLineCount: number;
  awaitingLineCount: number;
  shippedLineCount: number;
  totalUnitsOrdered: number;
  totalUnitsShipped: number;
  nextDeliveryDate: Date | null;
  expectedCompletion: Date | null;
  holdLabel: string | null;
  lines: FulfilmentLineStatus[];
};

export type FulfilmentProjectionProvider = (ctx: {
  organisationId: string;
  orderId: string;
}) => Promise<FulfilmentProjection | null>;

export type SalesLogisticsEvent = {
  kind: "confirmed" | "amended" | "cancelled" | "hold_added" | "hold_released";
  organisationId: string;
  orderId: string;
  eventKey: string;
  actorUserId: string;
};

export type SalesLogisticsConsumer = (event: SalesLogisticsEvent) => Promise<void>;

export type AvailabilityQuery = { productId: string; warehouseId?: string };

export type IncomingSupply = { quantity: number; date: string | null; reference: string };

export type StockAvailability = {
  productId: string;
  warehouseId: string | null;
  onHand: number;
  reserved: number;
  available: number;
  pickable: number;
  quarantine: number;
  blocked: number;
  inTransit: number;
};

export type StockLocationView = {
  id: string;
  warehouseId: string;
  parentId: string | null;
  code: string;
  name: string;
  capabilities: string[];
  sequence: number;
};

export type StockLotView = {
  id: string;
  productId: string;
  code: string;
  expiresOn: string | null;
  bestBeforeOn: string | null;
  removalOn: string | null;
};

export type StockSerialView = {
  id: string;
  productId: string;
  serial: string;
  status: string;
  warehouseId: string | null;
  locationId: string | null;
};

export type StockReservationView = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  sourceType: string;
  sourceId: string;
  status: string;
};

export type StockCommand = {
  requestKey: string;
  productId: string;
  warehouseId: string;
  locationId?: string | null;
  lotCode?: string | null;
  serials?: string[];
  quantity: number;
  status?: "AVAILABLE" | "QUARANTINE" | "BLOCKED" | "IN_TRANSIT" | "SCRAP";
  toWarehouseId?: string;
  toLocationId?: string | null;
  toStatus?: "AVAILABLE" | "QUARANTINE" | "BLOCKED" | "IN_TRANSIT" | "SCRAP";
  reason: string;
  reference: string;
  sourceType?: string;
  sourceId?: string;
  shipmentId?: string;
  receiptId?: string;
  manufacturingOrderId?: string;
  workOrderId?: string;
};

export type StockCommandResult = { requestKey: string; movementIds: string[]; replayed: boolean };

export type StockProvider = {
  getAvailability(actor: LogisticsActor, query: AvailabilityQuery): Promise<StockAvailability>;
  getLocations(actor: LogisticsActor, warehouseId?: string): Promise<StockLocationView[]>;
  getLots(actor: LogisticsActor, productId: string): Promise<StockLotView[]>;
  getSerials(actor: LogisticsActor, productId: string): Promise<StockSerialView[]>;
  getReservations(actor: LogisticsActor, productId: string): Promise<StockReservationView[]>;
  requestReservation(actor: LogisticsActor, command: StockCommand): Promise<StockCommandResult>;
  releaseReservation(actor: LogisticsActor, command: Pick<StockCommand, "requestKey" | "productId" | "warehouseId" | "quantity" | "sourceType" | "sourceId" | "reason" | "reference">): Promise<StockCommandResult>;
  executeMovement(actor: LogisticsActor, command: StockCommand): Promise<StockCommandResult>;
  receiveStock(actor: LogisticsActor, command: StockCommand): Promise<StockCommandResult>;
  shipStock(actor: LogisticsActor, command: StockCommand): Promise<StockCommandResult>;
  returnStock(actor: LogisticsActor, command: StockCommand, transaction?: import("@/generated/prisma/client").Prisma.TransactionClient): Promise<StockCommandResult>;
  reportDiscrepancy(actor: LogisticsActor, input: { requestKey: string; productId: string; warehouseId: string; locationId?: string | null; systemQuantity: number; reportedQuantity: number; sourceType: string; sourceId: string }): Promise<StockCommandResult>;
};

export type CarrierRate = {
  carrierCode: string;
  serviceLevel: string;
  amountMinor: number | null;
  currency: string;
  explanation: string;
};

export type CarrierShipmentRequest = {
  shipmentId: string;
  reference: string;
  serviceLevel: string;
  weightGrams: number | null;
  packageCount: number;
};

export type CarrierProvider = {
  code: string;
  getRates(actor: LogisticsActor, request: CarrierShipmentRequest): Promise<CarrierRate[]>;
  createShipment(actor: LogisticsActor, request: CarrierShipmentRequest): Promise<{ trackingNumber: string; labelRef: string }>;
  cancelShipment(actor: LogisticsActor, request: { shipmentId: string; requestKey: string }): Promise<void>;
  getLabel(actor: LogisticsActor, shipmentId: string): Promise<{ title: string; lines: string[] }>;
  getTracking(actor: LogisticsActor, trackingNumber: string): Promise<{ status: string; rawStatus: string | null }>;
  getProofOfDelivery(actor: LogisticsActor, shipmentId: string): Promise<{ deliveredAt: string | null; receiver: string | null } | null>;
};

export type PurchaseExpectation = {
  sourceReference: string;
  supplierName: string;
  warehouseCode: string | null;
  dueOn: string | null;
  lines: Array<{ productId: string | null; description: string; quantity: number }>;
};

export type PurchaseReceiptProvider = {
  listExpected(actor: LogisticsActor): Promise<PurchaseExpectation[]>;
};

export type FleetVehicle = { ref: string; label: string; maxWeightKg: number | null; maxPallets: number | null };

export type FleetProvider = {
  listVehicles(actor: LogisticsActor): Promise<FleetVehicle[]>;
};

export type RouteProposal = { shipmentId: string; sequence: number; explanation: string };

export type RoutePlanningProvider = {
  propose(actor: LogisticsActor, stops: Array<{ shipmentId: string; postcode: string; priority: number }>): Promise<RouteProposal[]>;
};

export type QualityProvider = {
  inspectionRequired(actor: LogisticsActor, productId: string): Promise<boolean>;
};

export type ExternalFulfilmentProvider = {
  submitOrder(actor: LogisticsActor, requirementId: string): Promise<{ externalId: string }>;
  cancelOrder(actor: LogisticsActor, externalId: string): Promise<void>;
  getStatus(actor: LogisticsActor, externalId: string): Promise<{ status: string }>;
  getShipment(actor: LogisticsActor, externalId: string): Promise<{ tracking: string | null }>;
  getInventoryProjection(actor: LogisticsActor, productId: string): Promise<{ available: number }>;
};

export const LOGISTICS_EVENT_NAMES = [
  "logistics.fulfilment.created",
  "logistics.fulfilment.allocated",
  "logistics.fulfilment.short",
  "logistics.order.released",
  "logistics.pick.created",
  "logistics.pick.completed",
  "logistics.pick.exception",
  "logistics.package.created",
  "logistics.pack.completed",
  "logistics.shipment.created",
  "logistics.shipment.dispatched",
  "logistics.shipment.delivered",
  "logistics.shipment.exception",
  "logistics.delivery.failed",
  "logistics.receipt.created",
  "logistics.receipt.completed",
  "logistics.receipt.discrepancy",
  "logistics.return.created",
  "logistics.return.received",
  "logistics.return.inspected",
  "logistics.return.resolved",
  "logistics.transfer.dispatched",
  "logistics.transfer.received",
] as const;
