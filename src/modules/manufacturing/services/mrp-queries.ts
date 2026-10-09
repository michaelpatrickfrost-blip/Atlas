// Query services for MRP results.
import { db } from "@/core/db/client";
import { readAvailability } from "@/modules/stock/services/availability";
import { OPEN_PRODUCTION_ORDER_STATUSES } from "../domain/lifecycle";
import { manHoursInWindow } from "../domain/calendar";
import type { MaterialShortage, NetRequirement, PlannedMaterial, PlannedOperation, PlannedOrder, PlannerCockpitView } from "../domain/mrp-types";
import { MaterialReadiness, PlannedOrderStatus, SupplyType, type CostKind } from "../domain/mrp-types";

/** What `storeResultsPlanningRun` writes into `pegging`, read back for display. */
export type SuggestionDetail = {
  demand: { sourceType: string; sourceId: string; label: string; quantity: number }[];
  operations: PlannedOperation[];
  materials: PlannedMaterial[];
  cost: Record<CostKind, number> | null;
  hours: { setup: number; run: number; crew: number } | null;
  batchCount: number;
};

export function readSuggestionDetail(pegging: unknown): SuggestionDetail {
  const value = (pegging ?? {}) as Partial<SuggestionDetail> & { sourceType?: string };
  // Tolerate the pre-existing shape (a bare array of demand pegs) so a run created
  // before this change still renders instead of throwing on a live page.
  if (Array.isArray(pegging)) {
    return { demand: pegging as SuggestionDetail["demand"], operations: [], materials: [], cost: null, hours: null, batchCount: 0 };
  }
  // Dates were written into the JSON pegging as Date objects; Prisma round-trips
  // them back as ISO strings, so coerce them so pages can call .getTime()/.toLocaleDateString().
  const toDate = (value: unknown) => (value ? new Date(value as string) : null);
  const operations = (value.operations ?? []).map((operation) => ({ ...operation, start: toDate(operation.start), end: toDate(operation.end) }));
  const materials = (value.materials ?? []).map((material) => ({ ...material, requiredBy: toDate(material.requiredBy) }));
  return {
    demand: value.demand ?? [],
    operations,
    materials,
    cost: value.cost ?? null,
    hours: value.hours ?? null,
    batchCount: value.batchCount ?? 0,
  };
}

/** Latest identified run, with its suggestions. */
export async function getLatestMrpRun(organisationId: string) {
  const run = await db.manufacturingPlanningRun.findFirst({
    where: { organisationId, finishedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    include: { suggestions: true },
  });
  if (!run) return null;
  return {
    runId: run.id,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    productCount: run.productCount,
    suggestionCount: run.suggestionCount,
    warnings: run.warnings,
    suggestions: run.suggestions,
  };
}

/** Suggestions still awaiting a decision, newest run first. */
export async function pendingSuggestions(organisationId: string) {
  const run = await getLatestMrpRun(organisationId);
  if (!run) return [];
  return db.manufacturingSupplySuggestion.findMany({
    where: { organisationId, runId: run.runId, status: "PENDING" },
    include: { product: { select: { id: true, name: true, code: true, basePriceAmount: true } } },
    orderBy: [{ neededBy: "asc" }],
    take: 500,
  });
}

/** A suggestion as the planner needs to read it: what to make, from which
 * components, on which machines, for how many hours and at what cost. */
export async function plannedProposals(organisationId: string): Promise<PlannedOrder[]> {
  const suggestions = await pendingSuggestions(organisationId);
  return suggestions.map((suggestion) => {
    const detail = readSuggestionDetail(suggestion.pegging);
    return {
      id: suggestion.id,
      productId: suggestion.productId,
      quantity: Number(suggestion.quantity),
      requiredDate: suggestion.neededBy ?? new Date(),
      startDate: suggestion.startBy ?? suggestion.neededBy ?? new Date(),
      finishDate: suggestion.neededBy ?? new Date(),
      supplyType: suggestion.kind === "MAKE" ? SupplyType.MAKE : suggestion.kind === "BUY" ? SupplyType.BUY : SupplyType.TRANSFER,
      status: PlannedOrderStatus.PROPOSED,
      pegging: detail.demand.map((peg) => ({
        demandId: peg.sourceId,
        demandType: "FIRM" as never,
        demandQuantity: peg.quantity,
        sourceLabel: peg.label,
      })),
      materialStatus: detail.materials.some((row) => row.shortage > 0) ? MaterialReadiness.PARTIAL : MaterialReadiness.READY,
      plannedCost: (suggestion.product as unknown as { basePriceAmount?: number }).basePriceAmount,
      cost: detail.cost ?? undefined,
      hours: detail.hours ?? undefined,
      operations: detail.operations,
      materials: detail.materials,
      batchCount: detail.batchCount,
    };
  });
}

/** Material shortfalls across the latest run, from the saved netting rather than a
 * second guess at the numbers. */
export async function getMaterialShortages(organisationId: string, limit = 50): Promise<MaterialShortage[]> {
  const suggestions = await pendingSuggestions(organisationId);
  const shortages: MaterialShortage[] = [];
  for (const suggestion of suggestions) {
    const detail = readSuggestionDetail(suggestion.pegging);
    // A short component is a shortage of the component, not only of the parent:
    // the buyer needs to know which part is missing.
    for (const material of detail.materials) {
      if (material.shortage <= 0) continue;
      shortages.push({
        productId: material.productId,
        productName: material.productName ?? "Component",
        productCode: material.productCode ?? material.productId,
        requiredQuantity: material.quantity,
        availableQuantity: material.onHand,
        shortageQuantity: material.shortage,
        requiredDate: material.requiredBy ?? suggestion.neededBy ?? new Date(),
        affectedDemand: [],
        suggestedActions: [
          { action: "EXPEDITE_SUPPLY", description: `Buy or expedite ${material.shortage} for ${suggestion.product?.name ?? "the plan"}`, canApply: true },
        ],
        priority: material.shortage / Math.max(material.quantity, 1) > 0.5 ? "CRITICAL" : material.shortage / Math.max(material.quantity, 1) > 0.2 ? "HIGH" : "NORMAL",
      });
    }
    if (!detail.materials.length && suggestion.kind === "BUY") {
      shortages.push({
        productId: suggestion.productId,
        productName: suggestion.product?.name ?? "Part",
        productCode: suggestion.product?.code ?? suggestion.productId,
        requiredQuantity: Number(suggestion.quantity),
        availableQuantity: 0,
        shortageQuantity: Number(suggestion.quantity),
        requiredDate: suggestion.neededBy ?? new Date(),
        affectedDemand: [],
        suggestedActions: [{ action: "EXPEDITE_SUPPLY", description: `Buy ${Number(suggestion.quantity)} to cover the plan`, canApply: true }],
        priority: "HIGH",
      });
    }
  }
  const order = { CRITICAL: 0, HIGH: 1, NORMAL: 2 } as const;
  const merged = new Map<string, MaterialShortage>();
  for (const row of shortages) {
    const existing = merged.get(row.productId);
    if (!existing) {
      merged.set(row.productId, row);
      continue;
    }
    existing.requiredQuantity += row.requiredQuantity;
    existing.availableQuantity = Math.max(existing.availableQuantity, row.availableQuantity);
    existing.shortageQuantity += row.shortageQuantity;
    if (row.requiredDate < existing.requiredDate) existing.requiredDate = row.requiredDate;
    if (order[row.priority] < order[existing.priority]) existing.priority = row.priority;
  }
  return [...merged.values()]
    .sort((a, b) => order[a.priority] - order[b.priority] || new Date(a.requiredDate).getTime() - new Date(b.requiredDate).getTime())
    .slice(0, limit);
}

/** Hours each work centre would carry if every pending proposal were firmed,
 * against the hours it actually opens for. Configured shifts are used where they
 * exist; otherwise the board says so instead of pretending to be exact. */
export async function capacityFromPlan(organisationId: string, withinDays = 28) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + withinDays * 86_400_000);
  const [proposals, centres, shifts] = await Promise.all([
    plannedProposals(organisationId),
    db.manufacturingWorkCentre.findMany({ where: { organisationId, active: true }, orderBy: { name: "asc" } }),
    db.manufacturingShift.findMany({ where: { organisationId, active: true, resourceId: null } }),
  ]);

  const load = new Map<string, { hours: number; orders: number }>();
  for (const proposal of proposals) {
    for (const operation of proposal.operations ?? []) {
      if (!operation.workCentreId) continue;
      const current = load.get(operation.workCentreId) ?? { hours: 0, orders: 0 };
      current.hours += operation.durationMinutes / 60;
      current.orders += 1;
      load.set(operation.workCentreId, current);
    }
  }

  return centres.map((centre) => {
    const centreShifts = shifts.filter((shift) => shift.workCentreId === centre.id).map((shift) => ({ daysOfWeek: shift.daysOfWeek, startMinute: shift.startMinute, endMinute: shift.endMinute, crewCount: shift.crewCount }));
    const usingConfiguredShifts = centreShifts.length > 0;
    const availableHours = usingConfiguredShifts ? manHoursInWindow(centreShifts, now, windowEnd) : 5 * 8 * (withinDays / 7);
    const required = load.get(centre.id) ?? { hours: 0, orders: 0 };
    return {
      workCentreId: centre.id,
      workCentre: centre.name,
      code: centre.code,
      requiredHours: Math.round(required.hours * 10) / 10,
      availableHours: Math.round(availableHours * 10) / 10,
      utilization: availableHours > 0 ? Math.min(999, Math.round((required.hours / availableHours) * 100)) : 0,
      orders: required.orders,
      usingConfiguredShifts,
      overloaded: availableHours > 0 && required.hours > availableHours,
    };
  });
}

/** Demand inside the horizon, from confirmed Sales lines only, so the outlook
 * cannot be inflated by drafts, closed orders or cancelled quantities. */
export async function demandOutlook(organisationId: string, days: number) {
  const now = new Date();
  const end = new Date(now.getTime() + days * 86_400_000);
  const lines = await db.salesOrderLine.findMany({
    where: {
      productId: { not: null },
      order: { organisationId, commercialStatus: { in: ["CONFIRMED", "ON_HOLD"] }, orderType: { notIn: ["BLANKET", "INTERNAL"] } },
      OR: [{ requestedDeliveryDate: { gte: now, lte: end } }, { requestedDeliveryDate: null, order: { requestedDeliveryDate: { gte: now, lte: end } } }],
    },
    select: {
      orderedQuantity: true,
      cancelledQuantity: true,
      requestedDeliveryDate: true,
      order: { select: { requestedDeliveryDate: true, promisedDeliveryDate: true } },
    },
    take: 5001,
  });
  const grouped = new Map<string, number>();
  for (const line of lines) {
    const on = line.requestedDeliveryDate ?? line.order.requestedDeliveryDate ?? line.order.promisedDeliveryDate;
    if (!on) continue;
    const key = on.toISOString().slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + Math.max(0, line.orderedQuantity - line.cancelledQuantity));
  }
  return [...grouped.entries()]
    .map(([date, quantity]) => ({ date: new Date(date), quantity }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Planner cockpit: every figure comes from saved planning output, the shared
 * availability chain or the real shift calendar. Nothing is a placeholder. */
export async function buildPlannerCockpit(organisationId: string): Promise<PlannerCockpitView> {
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86_400_000);
  const [run, shortages, capacity, demand7, demand30, lateOrders, chain, proposals] = await Promise.all([
    getLatestMrpRun(organisationId),
    getMaterialShortages(organisationId, 1000),
    capacityFromPlan(organisationId),
    demandOutlook(organisationId, 7),
    demandOutlook(organisationId, 30),
    db.manufacturingOrder.count({
      where: { organisationId, status: { in: OPEN_PRODUCTION_ORDER_STATUSES }, requiredDate: { lt: now } },
    }),
    readAvailability(),
    plannedProposals(organisationId),
  ]);

  // "At risk" is demand the plan cannot cover: a pending proposal whose own
  // components are short, plus any confirmed line with no cover at all.
  const uncovered = chain.products.filter((row) => row.openDemand > 0 && row.available + row.incoming < row.openDemand).length;
  const atRisk = shortages.filter((row) => row.priority === "CRITICAL").length + uncovered;
  const shortagesByPriority = {
    CRITICAL: shortages.filter((row) => row.priority === "CRITICAL"),
    HIGH: shortages.filter((row) => row.priority === "HIGH"),
    NORMAL: shortages.filter((row) => row.priority === "NORMAL"),
  };

  // The plan in plain terms: what we will make, the hours it takes and what it
  // costs, straight from the saved proposals (the same rows Planned Orders shows).
  const names = new Map<string, { name: string; code: string }>();
  const products = await db.product.findMany({ where: { organisationId, id: { in: proposals.map((proposal) => proposal.productId) } }, select: { id: true, name: true, code: true } });
  for (const product of products) names.set(product.id, { name: product.name, code: product.code });

  const plan = proposals.map((proposal) => {
    const detailCost = (proposal.cost ?? {}) as Record<string, number>;
    const costByKind: Record<string, number> = {};
    for (const [kind, value] of Object.entries(detailCost)) if (value) costByKind[kind] = value;
    const totalCostMinor = Object.values(detailCost).reduce((sum, value) => sum + value, 0);
    return {
      productId: proposal.productId,
      productName: names.get(proposal.productId)?.name ?? "Product",
      productCode: names.get(proposal.productId)?.code ?? "",
      quantity: proposal.quantity,
      neededBy: proposal.requiredDate,
      machineHours: Math.round(((proposal.hours?.setup ?? 0) + (proposal.hours?.run ?? 0)) * 10) / 10,
      crewHours: Math.round((proposal.hours?.crew ?? 0) * 10) / 10,
      totalCostMinor,
      costByKind,
      shortComponents: (proposal.materials ?? []).filter((row) => row.shortage > 0).length,
    };
  });

  return {
    shortageCount: shortages.length,
    overloadedResources: capacity.filter((row) => row.overloaded).length,
    lateOrders,
    atRiskDemand: atRisk,
    requiringAction: run?.suggestionCount ?? 0,
    demand7,
    demand30,
    planningHorizon: { start: now, end: thirtyDaysOut },
    topBottlenecks: capacity
      .filter((row) => row.requiredHours > 0)
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 3)
      .map((row) => ({ workCentre: row.workCentre, utilization: row.utilization, capacity: row.availableHours, requiredHours: row.requiredHours, usingConfiguredShifts: row.usingConfiguredShifts })),
    capacity,
    plan,
    shortagesByPriority,
    mrpRun: run,
  };
}

/** Net requirements for one product, rebuilt from the saved proposals so the
 * product view and the plan cannot disagree. */
export async function getNetRequirementsForProduct(organisationId: string, productId: string): Promise<NetRequirement[] | null> {
  const suggestions = await db.manufacturingSupplySuggestion.findMany({
    where: { organisationId, productId, status: { in: ["PENDING", "FIRMED"] } },
    include: { product: { select: { name: true, code: true } } },
    orderBy: { neededBy: "asc" },
  });
  if (!suggestions.length) return null;
  return suggestions.map((suggestion) => {
    const detail = readSuggestionDetail(suggestion.pegging);
    return {
      productId,
      quantity: Number(suggestion.quantity),
      requiredDate: suggestion.neededBy ?? new Date(),
      safetyStock: 0,
      existingSupply: 0,
      netQuantity: Number(suggestion.quantity),
      pegging: detail.demand.map((peg) => ({
        demandId: peg.sourceId,
        demandType: "FIRM" as never,
        demandQuantity: peg.quantity,
        sourceLabel: peg.label,
      })),
    };
  });
}
