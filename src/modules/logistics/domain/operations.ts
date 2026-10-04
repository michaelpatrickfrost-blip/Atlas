/** Pure logistics decisions. No database and no other module's tables. */

export type AllocationState = "UNALLOCATED" | "PART_ALLOCATED" | "ALLOCATED" | "SHORT" | "BLOCKED";

export function allocationStatus(input: { required: number; allocated: number; blocked: boolean; pickableRemaining: number }): AllocationState {
  if (input.blocked) return "BLOCKED";
  if (input.required <= 0 || input.allocated >= input.required) return "ALLOCATED";
  if (input.allocated <= 0 && input.pickableRemaining <= 0) return "SHORT";
  if (input.allocated <= 0) return "UNALLOCATED";
  if (input.pickableRemaining <= 0) return "SHORT";
  return "PART_ALLOCATED";
}

export function holdLabel(type: string): string {
  const labels: Record<string, string> = {
    CREDIT: "Credit hold",
    PRICING_APPROVAL: "Commercial hold",
    CUSTOMER_REQUEST: "Customer-requested hold",
    COMPLIANCE: "Compliance hold",
    STOCK_REVIEW: "Stock investigation",
    DELIVERY_ISSUE: "Delivery hold",
    MANUAL: "Manual hold",
  };
  return labels[type] ?? "Blocked";
}

export function releaseDecision(holds: string[]): { allowed: boolean; message: string | null } {
  if (!holds.length) return { allowed: true, message: null };
  return { allowed: false, message: `Blocked\n\n${holds.join("\n")}` };
}

export type ShortageView = {
  short: number;
  availableNow: number;
  incoming: Array<{ quantity: number; when: string }>;
  reservedElsewhere: number;
  actions: string[];
};

export function explainShortage(input: {
  required: number;
  allocated: number;
  availableNow: number;
  reservedElsewhere: number;
  incoming?: Array<{ quantity: number; when: string }>;
}): ShortageView {
  const short = Math.max(0, input.required - input.allocated);
  const incoming = input.incoming ?? [];
  const actions = short > 0 ? ["A delivery and invoice are raised when this is back in stock", "Review allocation"] : ["Review allocation"];
  if (incoming.some((row) => row.quantity > 0)) actions.unshift("Wait for incoming stock");
  if (input.allocated > 0 && short > 0) actions.unshift("Split shipment");
  actions.push("Change warehouse");
  return { short, availableNow: input.availableNow, incoming, reservedElsewhere: input.reservedElsewhere, actions };
}

export function shortageText(view: ShortageView): string[] {
  const lines = [
    `${view.short} units short`,
    `Available now\n${view.availableNow}`,
    `Already reserved elsewhere\n${view.reservedElsewhere}`,
  ];
  for (const row of view.incoming) lines.push(`Incoming\n${row.quantity}${row.when ? ` · ${row.when}` : ""}`);
  return lines;
}

export function verifyScan(input: { phase: "location" | "product"; expected: string; scanned: string }):
  | { ok: true }
  | { ok: false; title: string; expected: string; scanned: string } {
  const scanned = input.scanned.trim();
  const expected = input.expected.trim();
  if (!scanned) return { ok: false, title: "Scan required", expected, scanned };
  if (scanned.toLowerCase() !== expected.toLowerCase()) {
    return { ok: false, title: input.phase === "location" ? "Wrong location" : "Wrong item", expected, scanned };
  }
  return { ok: true };
}

export function quantityDecision(input: { required: number; scanned: number; policy: "PROHIBITED" | "WARNING" | "ALLOWED" }):
  | { outcome: "exact"; allowed: true }
  | { outcome: "short"; allowed: true; actions: string[] }
  | { outcome: "over"; allowed: boolean; warning: string | null } {
  if (input.scanned < input.required) {
    return { outcome: "short", allowed: true, actions: ["Short pick", "Find another location", "Report stock issue"] };
  }
  if (input.scanned > input.required) {
    if (input.policy === "PROHIBITED") return { outcome: "over", allowed: false, warning: `Only ${input.required} can be picked.` };
    if (input.policy === "WARNING") return { outcome: "over", allowed: true, warning: `${input.scanned - input.required} over the required quantity.` };
    return { outcome: "over", allowed: true, warning: null };
  }
  return { outcome: "exact", allowed: true };
}

/** Company switch: dispatch records the delivery, or delivery stays a later confirmation. */
export function dispatchMovesToDelivery(dispatchConfirmsDelivery: boolean) {
  return dispatchConfirmsDelivery;
}

export function warehouseSteps(mode: string): string[] {
  if (mode === "SIMPLE") return ["Pick", "Ship"];
  if (mode === "ADVANCED") return ["Reserve", "Wave", "Pick", "Consolidate", "Pack", "Stage", "Load", "Ship"];
  return ["Pick", "Pack", "Ship"];
}

export type LotCandidate = { code: string; expiresOn: string | null; quantity: number; sequence: number };

export function orderLots(strategy: string, lots: LotCandidate[]): LotCandidate[] {
  const copy = [...lots];
  if (strategy === "LIFO") return copy.sort((a, b) => b.sequence - a.sequence);
  if (strategy === "FEFO") {
    return copy.sort((a, b) => {
      if (a.expiresOn === b.expiresOn) return a.sequence - b.sequence;
      if (!a.expiresOn) return 1;
      if (!b.expiresOn) return -1;
      return a.expiresOn.localeCompare(b.expiresOn);
    });
  }
  if (strategy === "LEAST_PACKAGES") return copy.sort((a, b) => b.quantity - a.quantity || a.sequence - b.sequence);
  return copy.sort((a, b) => a.sequence - b.sequence);
}

export function explainPriority(input: { promisedOn: Date | null; now: Date; expedited: boolean; ageDays: number; manual: number | null }): { score: number; reason: string } {
  if (input.manual !== null) return { score: clamp(input.manual), reason: "Manual priority" };
  let score = 40;
  const reasons: string[] = [];
  if (input.expedited) { score += 30; reasons.push("Expedited service"); }
  if (input.promisedOn) {
    const days = Math.ceil((input.promisedOn.getTime() - input.now.getTime()) / 86_400_000);
    if (days <= 0) { score += 25; reasons.push("Promised date is due"); }
    else if (days === 1) { score += 15; reasons.push("Promised tomorrow"); }
  }
  if (input.ageDays >= 3) { score += 10; reasons.push("Order is ageing"); }
  return { score: clamp(score), reason: reasons.join(" · ") || "Standard priority" };
}

function clamp(value: number) { return Math.max(1, Math.min(100, Math.round(value))); }

export type CarrierRuleView = { name: string; priority: number; explanation: string; carrierCode: string; serviceLevel: string; match: { maxWeightGrams?: number; customerId?: string; region?: string; pallet?: boolean } };

export function matchCarrier(rules: CarrierRuleView[], facts: { weightGrams: number | null; customerId: string; region: string | null; pallet: boolean }): { carrierCode: string; serviceLevel: string; explanation: string } {
  const ordered = [...rules].sort((a, b) => a.priority - b.priority);
  for (const rule of ordered) {
    if (rule.match.maxWeightGrams !== undefined && (facts.weightGrams === null || facts.weightGrams > rule.match.maxWeightGrams)) continue;
    if (rule.match.customerId && rule.match.customerId !== facts.customerId) continue;
    if (rule.match.region && rule.match.region !== facts.region) continue;
    if (rule.match.pallet && !facts.pallet) continue;
    return { carrierCode: rule.carrierCode, serviceLevel: rule.serviceLevel, explanation: rule.explanation || rule.name };
  }
  return { carrierCode: "MANUAL", serviceLevel: "STANDARD", explanation: "No carrier rule matched. Manual carrier." };
}

export function assessOtif(input: { promisedOn: Date | null; deliveredAt: Date | null; ordered: number; delivered: number; fullPercent: number; failureReason?: string | null }): { onTime: boolean | null; inFull: boolean; otif: boolean | null; failureReason: string | null } {
  const onTime = input.promisedOn && input.deliveredAt ? input.deliveredAt.getTime() <= endOfPromise(input.promisedOn) : null;
  const inFull = input.ordered <= 0 ? true : (input.delivered / input.ordered) * 100 >= input.fullPercent;
  const failed = onTime === false || !inFull;
  return { onTime, inFull, otif: onTime === null ? null : onTime && inFull, failureReason: failed ? (input.failureReason?.trim() || "Not classified") : null };
}

function endOfPromise(date: Date) {
  const end = new Date(date);
  if (end.getUTCHours() === 0 && end.getUTCMinutes() === 0) end.setUTCHours(23, 59, 59, 999);
  return end.getTime();
}

export function cycleHours(points: Array<Date | null>): Array<number | null> {
  const hours: Array<number | null> = [];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    hours.push(from && to ? Math.round(((to.getTime() - from.getTime()) / 3_600_000) * 10) / 10 : null);
  }
  return hours;
}

export function weightVariance(expectedGrams: number | null, actualGrams: number | null): { deltaGrams: number; review: boolean } | null {
  if (expectedGrams === null || actualGrams === null || expectedGrams < 0 || actualGrams < 0) return null;
  const deltaGrams = actualGrams - expectedGrams;
  const review = expectedGrams === 0 ? actualGrams > 0 : Math.abs(deltaGrams) / expectedGrams > 0.1;
  return { deltaGrams, review };
}

export function replenishmentNeed(input: { pickFace: number; required: number; bulk: number }): { quantity: number; from: string; to: string } | null {
  if (input.pickFace >= input.required || input.bulk <= 0) return null;
  return { quantity: Math.min(input.required - input.pickFace, input.bulk), from: "Bulk", to: "Pick face" };
}

export function crossDockSuggestion(input: { received: number; demandedToday: number }): { crossDock: number; putAway: number } | null {
  if (input.received <= 0 || input.demandedToday <= 0) return null;
  const crossDock = Math.min(input.received, input.demandedToday);
  return { crossDock, putAway: input.received - crossDock };
}

export function overReceiptDecision(input: { expected: number; received: number; tolerancePercent: number; mode: "REJECT" | "TOLERANCE" | "APPROVAL" }): { accepted: boolean; needsApproval: boolean; difference: number } {
  const difference = input.received - input.expected;
  if (difference <= 0) return { accepted: true, needsApproval: false, difference };
  if (input.mode === "REJECT") return { accepted: false, needsApproval: false, difference };
  const limit = input.expected * (input.tolerancePercent / 100);
  if (input.mode === "TOLERANCE") return { accepted: difference <= limit, needsApproval: false, difference };
  return { accepted: difference <= limit, needsApproval: difference > limit, difference };
}

export function sequenceStops<T extends { sequence: number; code: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code));
}

export const PICK_EXCEPTIONS = ["Stock missing", "Damaged", "Wrong product", "Wrong location", "Blocked stock", "Cannot access location", "Insufficient quantity", "Barcode unreadable", "Other"] as const;

export const RETURN_REASONS = ["Damaged in transit", "Wrong item", "Incorrect quantity", "Defective", "Customer changed mind", "Specification issue", "Late delivery", "Duplicate shipment", "Quality issue", "Other"] as const;

export const DISPOSITIONS = ["Restock", "Quarantine", "Repair", "Replace", "Scrap", "Return to supplier", "Customer keeps item", "Investigation"] as const;

export const FAILURE_REASONS = ["Stock unavailable", "Late inbound", "Picking delay", "Packing delay", "Carrier missed", "Carrier delay", "Customer unavailable", "Wrong address", "Vehicle issue", "Quality hold", "Credit hold", "Customer change", "Other"] as const;

export function normalisedTracking(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value.includes("deliver") && value.includes("attempt")) return "Delivery attempted";
  if (value.includes("out for")) return "Out for delivery";
  if (value.includes("deliver")) return "Delivered";
  if (value.includes("depot") || value.includes("hub")) return "At depot";
  if (value.includes("collect")) return "Collected";
  if (value.includes("return")) return "Returned to sender";
  if (value.includes("exception") || value.includes("fail") || value.includes("delay")) return "Exception";
  if (value.includes("transit")) return "In transit";
  return "In transit";
}

/** A cancelled delivery opens again only when the sale is live and nothing has left. */
export function restoredDeliveryStatus(input: { orderStatus: string; requirementStatus: string; blocked: boolean; shipped: number }) {
  if (input.orderStatus === "CANCELLED") return "CANCELLED";
  if (input.shipped > 0) return null;
  if (input.requirementStatus === "CANCELLED") return input.blocked ? "BLOCKED" : "OPEN";
  return null;
}

export function postcodeOf(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const record = snapshot as Record<string, unknown>;
  const value = record.postcode ?? record.postalCode ?? record.zip;
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null;
}

export function proposeRoute(stops: Array<{ shipmentId: string; postcode: string; priority: number }>): Array<{ shipmentId: string; sequence: number; explanation: string }> {
  const ordered = [...stops].sort((a, b) => b.priority - a.priority || a.postcode.localeCompare(b.postcode));
  return ordered.map((stop, index) => ({ shipmentId: stop.shipmentId, sequence: index + 1, explanation: "Grouped by priority, then postcode. Specialist route optimisation is not connected." }));
}
