import { incomingPurchaseSupply } from "@/core/supply/incoming";
import { materialCostBasis } from "@/core/finance/manufacturing";
import { requireSession } from "@/core/auth/session";
import { remainingProductionQuantity } from "@/core/planning/production-quantity";
import { physicalStockState } from "@/modules/stock/services/physical-state";
// MRP calculation services — wire domain logic to the database.
import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";
import { ManufacturingSuggestionKind, ManufacturingSuggestionStatus } from "@/generated/prisma/enums";
import { MrpEngine } from "../domain/mrp-engine";
import type { DemandLine, InventoryState, MrpRunResult, Recipe, RecipeComponent, RecipeOperation } from "../domain/mrp-types";
import { DemandType, DemandSource } from "../domain/mrp-types";

/**
 * Run complete MRP for an organisation: load the inputs, plan them and persist
 * the run. Everything the planner sees afterwards is read back from the saved
 * suggestions rather than recomputed by the page.
 */
export async function runMrp(organisationId: string, userId: string, horizonDays = 90): Promise<MrpRunResult> {
  const now = new Date();
  const horizonStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const horizonEnd = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const [demand, inventory, recipes, prices, existingSupply, leadTimes, safetyStocks] = await Promise.all([
    loadDemand(organisationId, horizonStart, horizonEnd),
    loadInventory(organisationId),
    loadRecipes(organisationId),
    loadPrices(organisationId),
    loadExistingSupply(organisationId),
    loadLeadTimes(organisationId),
    loadSafetyStocks(organisationId),
  ]);

  const names = await loadNames(organisationId, [
    ...demand.map((line) => line.productId),
    ...[...recipes.values()].flatMap((recipe) => [recipe.productId, ...recipe.components.map((component) => component.componentProductId)]),
  ]);

  const engine = new MrpEngine({
    demand,
    inventory,
    recipes,
    prices,
    existingSupply: new Map(),
    datedSupply: existingSupply.rows,
    supplyWarnings: existingSupply.warnings,
    leadTimes,
    safetyStock: safetyStocks,
    names,
  });
  const result = await engine.run();
  await storeResultsPlanningRun(organisationId, userId, result);
  return result;
}

/** Display names for anything the engine may have to label. */
async function loadNames(organisationId: string, productIds: string[]) {
  const ids = [...new Set(productIds)].filter(Boolean);
  if (!ids.length) return new Map<string, { name: string; code: string }>();
  const products = await db.product.findMany({ where: { organisationId, id: { in: ids } }, select: { id: true, name: true, code: true } });
  return new Map(products.map((product) => [product.id, { name: product.name, code: product.code }]));
}

/**
 * Demand: confirmed Sales product lines plus planner/S&OP forecast.
 *
 * S&OP publishes a whole-period total, so gross bookings (including closed orders)
 * consume it, while only the outstanding firm balance enters MRP.
 */
async function loadDemand(organisationId: string, start: Date, end: Date): Promise<DemandLine[]> {
  const demand: DemandLine[] = [];
  const now = new Date();

  const periodStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const orders = await db.salesOrder.findMany({
    where: {
      organisationId,
      commercialStatus: { in: ["CONFIRMED", "ON_HOLD", "CLOSED"] },
      orderType: { notIn: ["BLANKET", "INTERNAL"] },
      OR: [{ commercialStatus: { not: "CLOSED" } }, { requestedDeliveryDate: { gte: periodStart } }, { lines: { some: { requestedDeliveryDate: { gte: periodStart } } } }],
    },
    include: { lines: { where: { type: "PRODUCT", productId: { not: null } } } },
  });
  const shippedRows = await db.fulfilmentLine.findMany({
    where: { organisationId, salesOrderLineId: { in: orders.flatMap((order) => order.lines.map((line) => line.id)) } },
    select: { salesOrderLineId: true, shippedQuantity: true },
  });
  const shipped = new Map<string, number>();
  const bookedByMonth = new Map<string, number>();
  for (const row of shippedRows) shipped.set(row.salesOrderLineId, (shipped.get(row.salesOrderLineId) ?? 0) + Number(row.shippedQuantity));
  for (const order of orders) {
    for (const line of order.lines) {
      const due = line.requestedDeliveryDate ?? order.requestedDeliveryDate ?? line.promisedDeliveryDate ?? order.promisedDeliveryDate;
      if (!line.productId || !due || due > end) continue;
      if (order.commercialStatus === "CLOSED" && due < periodStart) continue;
      const requiredDate = due < periodStart ? periodStart : due;
      const key = `${line.productId}|${requiredDate.toISOString().slice(0, 7)}`;
      const quantity = Math.max(0, Number(line.orderedQuantity) - Number(line.cancelledQuantity));
      bookedByMonth.set(key, (bookedByMonth.get(key) ?? 0) + quantity);
      const open = order.commercialStatus === "CLOSED" ? 0 : Math.max(0, quantity - (shipped.get(line.id) ?? 0));
      if (!open) continue;
      demand.push({
        id: line.id,
        demandType: DemandType.FIRM,
        source: DemandSource.SALES_ORDER,
        productId: line.productId,
        quantity: open,
        requiredDate,
        sourceId: order.id,
        sourceLineId: line.id,
        notes: `SO ${order.reference}`,
      });
    }
  }

  // Approach 1: planner-entered / S&OP-published forecast per product per month.
  const forecasts = await db.manufacturingDemandForecast.findMany({
    where: { organisationId, periodStart: { gte: periodStart, lte: end } },
  });
  for (const forecast of forecasts) {
    demand.push({
      id: forecast.id,
      demandType: DemandType.FORECAST,
      source: DemandSource.FORECAST,
      productId: forecast.productId,
      quantity: Math.max(0, Number(forecast.quantity) - (bookedByMonth.get(`${forecast.productId}|${forecast.periodStart.toISOString().slice(0, 7)}`) ?? 0)),
      forecastIsResidual: true,
      requiredDate: forecast.periodStart,
      sourceId: forecast.id,
      notes: forecast.notes || "Forecast",
    });
  }

  // Approach 2: expected monthly usage set on the product, for every month in the
  // horizon the planner has not given its own figure.
  const standing = await db.product.findMany({ where: { organisationId, kind: "PRODUCT", active: true, monthlyUsage: { gt: 0 } }, select: { id: true, monthlyUsage: true } });
  const entered = new Set(forecasts.map((forecast) => `${forecast.productId}:${forecast.periodStart.toISOString().slice(0, 7)}`));
  for (const product of standing) {
    for (let month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); month <= end; month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))) {
      const key = `${product.id}:${month.toISOString().slice(0, 7)}`;
      if (entered.has(key)) continue;
      demand.push({
        id: `usage:${key}`,
        demandType: DemandType.FORECAST,
        source: DemandSource.FORECAST,
        productId: product.id,
        quantity: Math.max(0, Number(product.monthlyUsage ?? 0) - (bookedByMonth.get(`${product.id}|${month.toISOString().slice(0, 7)}`) ?? 0)),
        forecastIsResidual: true,
        requiredDate: month < now ? now : month,
        sourceId: product.id,
        notes: "Expected usage (Inventory)",
      });
    }
  }

  return demand;
}

/**
 * Physical state per product, across every warehouse.
 *
 * The key must always be the product id. Balances, reservations and holds are all
 * product-scoped, so accumulating them under a product-site key left every lookup
 * by product id empty — MRP then planned against zero stock it could actually see.
 * Using the shared availability figure keeps one definition of available across
 * Sales, Inventory, Planning and Manufacturing.
 */
async function loadInventory(organisationId: string): Promise<Map<string, InventoryState>> {
  const physical = await physicalStockState(organisationId);
  return new Map([...physical].map(([productId,row]) => [productId,{ productId,onHand:row.onHand,allocated:row.reserved,qualityHeld:row.held,available:row.pickable,safetyStock:0 }]));
}

/**
 * Every active definition that could be planned, with the plant it runs on.
 *
 * The catalogue is deliberately wider than "products with demand": MRP plans the
 * components underneath demand too, so a part with no direct sales order still
 * needs its recipe to know whether it is made or bought.
 */
async function loadRecipes(organisationId: string): Promise<Map<string, Recipe>> {
  const recipes = new Map<string, Recipe>();
  const definitions = await db.productDefinition.findMany({
    where: { organisationId, status: "ACTIVE" },
    include: {
      lines: { orderBy: { position: "asc" } },
      operations: { orderBy: { position: "asc" }, include: { centre: { select: { code: true, name: true } }, machine: { select: { name: true, type: true } } } },
    },
  });

  for (const definition of definitions) {
    const components: RecipeComponent[] = definition.lines.map((line) => ({
      componentProductId: line.componentProductId,
      quantityPerUnit: Number(line.quantityPerUnit),
      scrapPercent: Number(line.scrapPercent || 0),
      position: line.position,
      notes: line.notes ?? "",
    }));
    const operations: RecipeOperation[] = definition.operations.map((operation) => ({
      position: operation.position,
      name: operation.name,
      timingMode: operation.timingMode,
      batchCapacity: Number(operation.batchCapacity),
      cycleMinutes: Number(operation.cycleMinutes),
      coolingMinutes: Number(operation.coolingMinutes),
      waitMinutes: Number(operation.waitMinutes),
      setupMinutes: Number(operation.setupMinutes || 0),
      runMinutesPerUnit: Number(operation.runMinutesPerUnit || 0),
      crewSize: Number(operation.crewSize ?? 1),
      workCentreId: operation.workCentreId,
      workCentreCode: operation.centre?.code ?? null,
      workCentreName: operation.centre?.name ?? (operation.workCentre || null),
      resourceId: operation.resourceId,
      resourceName: operation.machine?.name ?? null,
      resourceType: operation.machine?.type ?? null,
      machineMinorPerHour: operation.machineMinorPerHour,
      labourMinorPerHour: operation.labourMinorPerHour,
      overheadMinorPerHour: operation.overheadMinorPerHour,
      logisticsMinorPerBatch: operation.logisticsMinorPerBatch,
      machineIncludesLabour: operation.machineIncludesLabour,
      machineIncludesOverhead: operation.machineIncludesOverhead,
    }));
    recipes.set(definition.productId, {
      productId: definition.productId,
      definitionId: definition.id,
      version: definition.version,
      supply: definition.supply,
      batchQuantity: Number(definition.batchQuantity),
      yieldPercent: Number(definition.yieldPercent),
      subcontractMinorPerUnit: definition.subcontractMinorPerUnit,
      components,
      operations,
    });
  }
  return recipes;
}

/** Finance owns reviewed carrying values and approved purchasing prices. */
async function loadPrices(organisationId: string): Promise<Map<string, { amountMinor: number; quantity: number }>> {
  const session = await requireSession();
  if (session.organisationId !== organisationId) throw new Error("Material cost estimates require the current company.");
  const [basis, products] = await Promise.all([materialCostBasis(session), db.product.findMany({ where: { organisationId }, select: { id: true, baseCurrency: true } })]);
  const currency = new Map(products.map(product => [product.id, product.baseCurrency]));
  return new Map(basis.filter(row => currency.get(row.productId) === row.currency).map(row => [row.productId, { amountMinor: row.amountMinor, quantity: row.quantity }]));
}

/** Count each open quantity once, only from its expected completion/receipt day. */
async function loadExistingSupply(organisationId: string) {
  const session = await requireSession();
  if (session.organisationId !== organisationId) throw new Error("Supply planning requires the current company.");
  const [purchases, openOrders] = await Promise.all([
    incomingPurchaseSupply(session),
    db.manufacturingOrder.findMany({
      where: { organisationId, status: { in: ["PLANNED", "READY", "RELEASED", "RUNNING"] } },
      select: { id: true, productId: true, quantity: true, plannedFinish: true, requiredDate: true, workOrders: { select: {sequence:true,status:true,producedQuantity:true,scrapQuantity:true} } },
    }),
  ]);
  const rows = [...purchases.rows];
  let undated = 0;
  for (const order of openOrders) {
    const quantity = remainingProductionQuantity({quantity:Number(order.quantity),workOrders:order.workOrders.map(w=>({...w,producedQuantity:Number(w.producedQuantity),scrapQuantity:Number(w.scrapQuantity)}))});
    if (!quantity) continue;
    const availableDate = order.plannedFinish ?? order.requiredDate;
    if (!availableDate) { undated++; continue; }
    rows.push({ productId: order.productId, quantity, availableDate, sourceId: order.id });
  }
  return { rows, warnings: [...purchases.warnings, ...(undated ? [`${undated} open production order(s) have no finish/required date and are excluded from dated supply. Schedule them before relying on their output.`] : [])] };
}

/** Planned start is computed from the real routing, so the static lead time is
 * only a fallback for a product with no routing at all. */
async function loadLeadTimes(organisationId: string): Promise<Map<string, number>> {
  const leadTimes = new Map<string, number>();
  const products = await db.product.findMany({ where: { organisationId }, select: { id: true, leadTimeDays: true } });
  for (const product of products) leadTimes.set(product.id, product.leadTimeDays > 0 ? product.leadTimeDays : 5);
  return leadTimes;
}

/** Safety stock is set on the product in Inventory. Zero is a deliberate no-buffer
 * policy, not "unset" — inventing a default buffer would create demand the planner
 * never asked for. */
async function loadSafetyStocks(organisationId: string): Promise<Map<string, number>> {
  const safetyStocks = new Map<string, number>();
  const products = await db.product.findMany({ where: { organisationId }, select: { id: true, safetyStockLevel: true } });
  for (const product of products) safetyStocks.set(product.id, Math.max(0, Number(product.safetyStockLevel)));
  return safetyStocks;
}

/**
 * Persist the run and its suggestions. The per-order detail — operations, hours,
 * materials, cost buckets — goes into `pegging`, which the schema already stores as
 * JSON and which deliberately survives later edits to recipes and source lines.
 */
async function storeResultsPlanningRun(organisationId: string, userId: string, result: MrpRunResult) {
  const run = await db.manufacturingPlanningRun.create({
    data: {
      organisationId,
      triggeredByUserId: userId,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      productCount: new Set(result.plannedOrders.map((order) => order.productId)).size,
      suggestionCount: result.plannedOrders.length,
      warnings: result.warnings,
    },
  });

  if (result.plannedOrders.length) {
    await db.manufacturingSupplySuggestion.createMany({
      data: result.plannedOrders.map((order) => ({
        organisationId,
        runId: run.id,
        kind: ManufacturingSuggestionKind[order.supplyType as keyof typeof ManufacturingSuggestionKind],
        productId: order.productId,
        quantity: order.quantity,
        neededBy: order.requiredDate,
        startBy: order.startDate,
        status: ManufacturingSuggestionStatus.PENDING,
        pegging: {
          demand: order.pegging,
          operations: order.operations ?? [],
          materials: order.materials ?? [],
          cost: order.cost ?? null,
          hours: order.hours ?? null,
          batchCount: order.batchCount ?? 0,
        } as unknown as Prisma.InputJsonValue,
      })),
    });
  }
  result.runId = run.id;
}
