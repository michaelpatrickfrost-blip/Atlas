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
  forecastIsResidual?: boolean; // S&OP has already consumed gross firm bookings.
  probability?: number; // 0-100 for forecast/CRM demand
  notes?: string;
}

/** Physical state for one product, aggregated across every warehouse. Keys are
 * ALWAYS product ids: an earlier version keyed balances as product-site while
 * reading them by product, which silently reported zero stock. */
export interface InventoryState {
  productId: string;
  onHand: number; // Physical stock
  allocated: number; // Reserved for stock movements still to go out
  qualityHeld: number; // Active quality hold
  available: number; // max(0, onHand - allocated - qualityHeld)
  safetyStock: number; // Target safety stock level
}

// ===== RECIPE INPUT (owned by Products) =====

export interface RecipeComponent {
  componentProductId: string;
  quantityPerUnit: number;
  scrapPercent: number; // 0-100
  position: number;
  notes?: string;
}

/** One routing step. Machine/labour/overhead rates mirror the Products recipe so
 * the plan and the product page price the same work the same way. */
export interface RecipeOperation {
  position: number;
  name: string;
  setupMinutes: number;
  runMinutesPerUnit: number;
  crewSize: number;
  workCentreId: string | null;
  workCentreCode: string | null;
  workCentreName: string | null;
  resourceId: string | null;
  resourceName: string | null;
  resourceType: string | null;
  machineMinorPerHour: number;
  labourMinorPerHour: number;
  overheadMinorPerHour: number;
  logisticsMinorPerBatch: number;
  machineIncludesLabour: boolean;
  machineIncludesOverhead: boolean;
}

export interface Recipe {
  productId: string;
  definitionId: string;
  version: number;
  supply: string; // MAKE | WIP | BUY | SUBCONTRACT
  batchQuantity: number;
  yieldPercent: number; // 0-100
  subcontractMinorPerUnit: number;
  components: RecipeComponent[];
  operations: RecipeOperation[];
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

export type CostKind = "material" | "machine" | "labour" | "overhead" | "subcontract" | "logistics";
export type CostBuckets = Record<CostKind, number>;

/** A routing step of a proposed order: the machine, the people and the hours. */
export interface PlannedOperation {
  sequence: number;
  name: string;
  workCentreId: string | null;
  workCentreCode: string | null;
  workCentreName: string | null;
  resourceId: string | null;
  resourceName: string | null;
  batches: number;
  setupMinutes: number;
  runMinutes: number;
  /** Machine-occupied minutes: setup + run for the whole order. */
  durationMinutes: number;
  crewSize: number;
  /** crew size × machine hours. */
  labourHours: number;
  start: Date | null;
  end: Date | null;
}

/** A component the make will consume, netted against what is on hand now. */
export interface PlannedMaterial {
  productId: string;
  productCode: string | null;
  productName: string | null;
  quantity: number;
  onHand: number;
  covered: number;
  shortage: number;
  requiredBy: Date | null;
}

export interface PlannedOrder {
  id?: string;
  productId: string;
  quantity: number;
  requiredDate: Date; // When it's needed
  startDate: Date; // Suggested start (from the real routing or lead time)
  finishDate: Date; // Suggested finish
  supplyType: SupplyType;
  status: PlannedOrderStatus;
  pegging: PeggingLine[];
  materialStatus?: MaterialReadiness;
  capacityStatus?: CapacityStatus;
  plannedCost?: number; // Estimated cost in minor units
  /** Breakdown of `plannedCost` and the time the order occupies. */
  cost?: CostBuckets;
  hours?: { setup: number; run: number; crew: number };
  operations?: PlannedOperation[];
  materials?: PlannedMaterial[];
  batchCount?: number;
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

/** Capacity load per work centre, from the pending plan against the real calendar. */
export interface WorkCentreCapacity {
  workCentreId: string;
  workCentre: string;
  code: string;
  requiredHours: number;
  availableHours: number;
  utilization: number; // 0-100+%
  orders: number;
  /** False means the naive weekday figure was used, which the board says out loud. */
  usingConfiguredShifts: boolean;
  overloaded: boolean;
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
    requiredHours: number;
    usingConfiguredShifts: boolean;
  }>;

  capacity: WorkCentreCapacity[];

  // The plan in plain terms: one row per thing to make, with its hours, cost and
  // any component it cannot cover — so "what will production get" reads at a glance.
  plan: Array<{
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    neededBy: Date;
    machineHours: number;
    crewHours: number;
    totalCostMinor: number;
    costByKind: Record<string, number>;
    shortComponents: number;
  }>;

  // Supply risk
  shortagesByPriority: {
    CRITICAL: MaterialShortage[];
    HIGH: MaterialShortage[];
    NORMAL: MaterialShortage[];
  };

  mrpRun: { startedAt: Date; productCount: number; suggestionCount: number; warnings: string[] } | null;
}

/** Inputs the engine plans from. `recipes` is the reachable manufacturing
 * catalogue keyed by product, which drives exploding and the cost split.
 * `prices` is the standard price of a bought unit, used wherever a product has no
 * recipe (or the recipe is bought), so a bought part is never costed at zero.
 * `names` exists so the engine can label a shortage without touching the database. */
export interface MrpInput {
  demand: DemandLine[];
  inventory: Map<string, InventoryState>;
  recipes: Map<string, Recipe>;
  prices: Map<string, number>;
  existingSupply: Map<string, number>;
  leadTimes: Map<string, number>;
  safetyStock: Map<string, number>;
  names: Map<string, { name: string; code: string }>;
}
