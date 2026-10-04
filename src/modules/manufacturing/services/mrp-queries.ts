// Query services for MRP results
import { db } from "@/core/db/client";
import type { PlannerCockpitView, MaterialShortage } from "../domain/mrp-types";
import { MaterialReadiness } from "../domain/mrp-types";

/**
 * Get the latest MRP run results for planner cockpit.
 */
export async function getLatestMrpRun(organisationId: string) {
  const run = await db.manufacturingPlanningRun.findFirst({
    where: { organisationId },
    orderBy: { startedAt: "desc" },
    include: {
      suggestions: true,
    },
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

/**
 * Get material shortages from latest MRP run.
 */
export async function getMaterialShortages(organisationId: string, limit = 50): Promise<MaterialShortage[]> {
  const run = await getLatestMrpRun(organisationId);
  if (!run) return [];

  const suggestions = await db.manufacturingSupplySuggestion.findMany({
    where: {
      organisationId,
      runId: run.runId,
      status: "PENDING",
    },
    include: {
      product: true,
    },
    take: limit,
  });

  const shortages: MaterialShortage[] = [];

  for (const suggestion of suggestions) {
    // Check if there's actually a shortage
    const inventory = await db.stockBalance.findFirst({
      where: {
        organisationId,
        productId: suggestion.productId,
      },
    });

    const available = inventory ? Number(inventory.quantity) : 0;
    const required = Number(suggestion.quantity);

    if (available < required) {
      shortages.push({
        productId: suggestion.productId,
        productName: suggestion.product.name,
        productCode: suggestion.product.code,
        requiredQuantity: required,
        availableQuantity: available,
        shortageQuantity: required - available,
        requiredDate: suggestion.neededBy || new Date(),
        affectedDemand: [], // TODO: load affected demand from pegging
        suggestedActions: [
          {
            action: "EXPEDITE_SUPPLY",
            description: `Expedite purchase or production of ${required - available} units`,
            canApply: true,
          },
        ],
        priority:
          (required - available) / required > 0.5
            ? "CRITICAL"
            : (required - available) / required > 0.2
              ? "HIGH"
              : "NORMAL",
      });
    }
  }

  return shortages.sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Build planner cockpit view with key metrics and status.
 */
export async function buildPlannerCockpit(organisationId: string): Promise<PlannerCockpitView> {
  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get latest run
  const run = await getLatestMrpRun(organisationId);

  // Count attention items
  const shortages = await getMaterialShortages(organisationId, 1000);
  const criticalShortages = shortages.filter((s) => s.priority === "CRITICAL").length;
  const highShortages = shortages.filter((s) => s.priority === "HIGH").length;

  // Get late orders
  const lateOrders = await db.manufacturingOrder.count({
    where: {
      organisationId,
      status: { in: ["PLANNED", "READY", "RELEASED", "RUNNING"] },
      requiredDate: { lt: now },
    },
  });

  // Get overloaded resources (TODO: implement capacity checking)
  const overloadedResources = 0;

  // Get demand 7/30 days
  const demand7 = await db.salesOrderLine.findMany({
    where: {
      organisationId,
      requestedDeliveryDate: { gte: now, lte: sevenDaysOut },
    },
    select: { quantity: true, requestedDeliveryDate: true },
  });

  const demand30 = await db.salesOrderLine.findMany({
    where: {
      organisationId,
      requestedDeliveryDate: { gte: now, lte: thirtyDaysOut },
    },
    select: { quantity: true, requestedDeliveryDate: true },
  });

  // Group demand by day
  const groupByDate = (lines: typeof demand7) => {
    const grouped: Map<string, number> = new Map();
    for (const line of lines) {
      const date = line.requestedDeliveryDate
        ? line.requestedDeliveryDate.toISOString().split("T")[0]
        : "unknown";
      grouped.set(date, (grouped.get(date) || 0) + Number(line.quantity));
    }

    return Array.from(grouped.entries())
      .map(([dateStr, qty]) => ({
        quantity: qty,
        date: new Date(dateStr),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const topBottlenecks = await db.manufacturingWorkCentre.findMany({
    where: { organisationId },
    take: 3,
  });

  return {
    shortageCount: shortages.length,
    overloadedResources,
    lateOrders,
    atRiskDemand: criticalShortages,
    requiringAction: run?.suggestionCount || 0,

    demand7: groupByDate(demand7),
    demand30: groupByDate(demand30),
    planningHorizon: { start: now, end: thirtyDaysOut },

    topBottlenecks: topBottlenecks.map((wc) => ({
      workCentre: wc.name,
      utilization: 45, // TODO: calculate from scheduled work
      capacity: 100,
    })),

    shortagesByPriority: new Map([
      ["CRITICAL", shortages.filter((s) => s.priority === "CRITICAL")],
      ["HIGH", shortages.filter((s) => s.priority === "HIGH")],
      ["NORMAL", shortages.filter((s) => s.priority === "NORMAL")],
    ]),
  };
}

/**
 * Get planned orders for a product with details.
 */
export async function getPlannedOrdersForProduct(organisationId: string, productId: string) {
  return await db.manufacturingSupplySuggestion.findMany({
    where: {
      organisationId,
      productId,
      status: "PENDING",
    },
    include: {
      run: true,
      product: true,
    },
    orderBy: { neededBy: "asc" },
  });
}

/**
 * Get multi-level net requirements for a product.
 */
export async function getNetRequirementsForProduct(organisationId: string, productId: string) {
  // Load BOM
  const def = await db.productDefinition.findFirst({
    where: { organisationId, productId },
    include: {
      bomLines: { include: { component: true } },
      operations: true,
    },
  });

  if (!def || def.bomLines.length === 0) {
    return null; // No BOM
  }

  // For each component, get planned orders
  const requirements = await Promise.all(
    def.bomLines.map(async (line) => ({
      component: line.component,
      quantityPerUnit: line.quantityPerUnit,
      plannedOrders: await getPlannedOrdersForProduct(organisationId, line.componentProductId),
    }))
  );

  return {
    product: { id: productId },
    bom: def,
    componentRequirements: requirements,
  };
}
