// Comprehensive MRP/Planning domain model

// ===== DEMAND MODEL =====

export enum DemandType {
  FIRM = "FIRM", // Confirmed sales orders, confirmed releases
  FORECAST = "FORECAST", // Forecast, CRM projects at probability
  SAFETY_STOCK = "SAFETY_STOCK", // Replenishment of safety stock
}

export enum DemandSource {
  SALES_ORDER = "SALES_ORDER",
  SALES_CALL_OFF = "SALES_CALL_OFF",
  INTERNAL_DEMAND = "INTERNAL_DEMAND",
  FORECAST = "FORECAST",
  SAFETY_STOCK = "SAFETY_STOCK",
  SALES_PROJECT = "SALES_PROJECT", // CRM project, probability-weighted
}

export interface DemandLine {
  id: string;
  demandType: DemandType;
  source: DemandSource;
  productId: string;
  quantity: number;
  requiredDate: Date;
  sourceId: string; // SalesOrderId, ForecastId, etc
  sourceLineId?: string;
  forecastIsResidual?: boolean; // S&OP already consumed whole-period firm bookings, including fulfilled orders.
  probability?: number; // 0-100 for forecast/CRM demand
  notes?: string;
}

export interface InventoryState {
  productId: string;
  siteId: string;
  onHand: number; // Physical stock
  allocated: number; // Reserved for firm orders
  qualityHeld: number; // Quality hold
  available: number; // onHand - allocated - qualityHeld
  safetyStock: number; // Target safety stock level
}

// ===== BOM & PRODUCTION STRUCTURE =====

export interface BomComponent {
  componentProductId: string;
  quantityPerUnit: number;
  scrapPercent: number; // 0-100
  position: number;
  notes?: string;
}

export interface ProductionOperation {
  position: number;
  name: string;
  setupMinutes: number;
  runMinutesPerUnit: number;
  workCentreId?: string;
  resourceId?: string;
  crewSize: number;
  setupCost: number; // minor units
  runCost: number; // minor units per unit
  labourCost: number;
  overheadCost: number;
}

export interface ProductionVersion {
  definitionId: string;
  productId: string;
  bomComponents: BomComponent[];
  operations: ProductionOperation[];
  yield: number; // Expected yield %
  scrapPercent: number;
  minBatchSize: number;
  maxBatchSize: number;
  preferredBatchSize: number;
}

// ===== NET REQUIREMENTS =====

export interface NetRequirement {
  productId: string;
  quantity: number;
  requiredDate: Date;
  safetyStock: number;
  existingSupply: number; // Existing production/purchase orders
  netQuantity: number; // quantity - existingSupply
  pegging: PeggingLine[]; // What demand drives this requirement
}

export interface PeggingLine {
  demandId: string;
  demandType: DemandType;
  demandQuantity: number;
  sourceLabel: string;
}

// ===== PLANNED ORDERS & SUPPLY PLANNING =====

export interface PlannedOrder {
  id?: string;
  productId: string;
  quantity: number;
  requiredDate: Date; // When it's needed
  startDate: Date; // Suggested start (based on lead time)
  finishDate: Date; // Suggested finish
  supplyType: SupplyType;
  status: PlannedOrderStatus;
  pegging: PeggingLine[];
  materialStatus?: MaterialReadiness;
  capacityStatus?: CapacityStatus;
  plannedCost?: number; // Estimated cost in minor units
}

export enum SupplyType {
  MAKE = "MAKE", // Manufacturing order
  BUY = "BUY", // Purchase order
  TRANSFER = "TRANSFER", // Stock transfer
}

export enum PlannedOrderStatus {
  PROPOSED = "PROPOSED",
  FIRMED = "FIRMED", // Converted to real order
  CANCELLED = "CANCELLED",
}

export enum MaterialReadiness {
  READY = "READY",
  PARTIAL = "PARTIAL",
  SHORT = "SHORT",
  QUALITY_HOLD = "QUALITY_HOLD",
}

export enum CapacityStatus {
  OK = "OK",
  OVERLOAD = "OVERLOAD",
  MAINTENANCE = "MAINTENANCE",
}

// ===== SHORTAGE & EXCEPTION WORKBENCH =====

export interface MaterialShortage {
  productId: string;
  productName: string;
  productCode: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  requiredDate: Date;
  affectedDemand: DemandLine[];
  suggestedActions: ShortageAction[];
  priority: "CRITICAL" | "HIGH" | "NORMAL";
}

export interface ShortageAction {
  action: "EXPEDITE_SUPPLY" | "REDUCE_DEMAND" | "SUBSTITUTE" | "TRANSFER_STOCK";
  description: string;
  estimatedCost?: number;
  canApply: boolean;
}

// ===== CAPACITY PLANNING =====

export interface CapacityRequirement {
  workCentreId: string;
  resourceId?: string;
  periodStart: Date;
  periodEnd: Date;
  requiredHours: number;
  availableHours: number;
  utilization: number; // 0-100%
  load: CapacityLoad[];
}

export interface CapacityLoad {
  orderId: string;
  productId: string;
  productName: string;
  operationName: string;
  requiredHours: number;
  priority: number;
}

// ===== PLANNING RESULTS =====

export interface MrpRunResult {
  runId: string;
  startedAt: Date;
  finishedAt?: Date;
  plannedOrders: PlannedOrder[];
  shortages: MaterialShortage[];
  capacityIssues: CapacityRequirement[];
  warnings: string[];
  peggingMap: Map<string, PeggingLine[]>; // productId -> pegging
}

export interface PlannerCockpitView {
  // Attention section
  shortageCount: number;
  overloadedResources: number;
  lateOrders: number;
  atRiskDemand: number;
  requiringAction: number;

  // 7/30 day outlook
  demand7: { quantity: number; date: Date }[];
  demand30: { quantity: number; date: Date }[];
  planningHorizon: { start: Date; end: Date };

  // Bottlenecks
  topBottlenecks: Array<{
    workCentre: string;
    utilization: number;
    capacity: number;
  }>;

  // Supply risk
  shortagesByPriority: Map<string, MaterialShortage[]>;
}
