// Visible lifecycle only — §58, §68 of docs/modules/MANUFACTURING_SOURCE_REQUIREMENTS.md.
// Internal states may grow richer later; do not expose more than this to ordinary users.

export const PRODUCTION_ORDER_STATUSES = ["PLANNED", "READY", "RELEASED", "RUNNING", "COMPLETE", "CLOSED"] as const;
export type ProductionOrderStatus = (typeof PRODUCTION_ORDER_STATUSES)[number];

export const WORK_ORDER_STATUSES = ["WAITING", "READY", "RUNNING", "PAUSED", "BLOCKED", "COMPLETE"] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

/** §58: production orders still open on the shop floor. */
export const OPEN_PRODUCTION_ORDER_STATUSES: ProductionOrderStatus[] = ["PLANNED", "READY", "RELEASED", "RUNNING"];

const ORDER_TRANSITIONS: Record<ProductionOrderStatus, ProductionOrderStatus[]> = {
  PLANNED: ["READY", "CLOSED"],
  READY: ["RELEASED", "PLANNED", "CLOSED"],
  RELEASED: ["RUNNING", "CLOSED"],
  RUNNING: ["COMPLETE"],
  COMPLETE: ["CLOSED"],
  CLOSED: [],
};

export function canTransitionOrder(from: ProductionOrderStatus, to: ProductionOrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

const WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  WAITING: ["READY", "BLOCKED"],
  READY: ["RUNNING", "BLOCKED"],
  RUNNING: ["PAUSED", "COMPLETE", "BLOCKED"],
  PAUSED: ["RUNNING", "BLOCKED"],
  BLOCKED: ["READY", "RUNNING"],
  COMPLETE: [],
};

export function canTransitionWorkOrder(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return WORK_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** §59: the ready-to-release check. Materials/quality/tooling are later phases — only
 * the capacity-independent "has a routing been snapshotted" check exists yet. */
export type ReadyCheck = { ready: boolean; reasons: string[] };

export function readyToRelease(order: { definitionId: string | null; quantity: unknown }): ReadyCheck {
  const reasons: string[] = [];
  if (!order.definitionId) reasons.push("No BOM/routing has been selected for this product yet.");
  if (Number(order.quantity) <= 0) reasons.push("Quantity must be greater than zero.");
  return { ready: reasons.length === 0, reasons };
}
