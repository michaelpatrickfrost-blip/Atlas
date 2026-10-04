// MRP calculation services - wire domain logic to database
import { db } from "@/core/db/client";
import { MrpEngine } from "../domain/mrp-engine";
import type {
  DemandLine,
  InventoryState,
  ProductionVersion,
  MrpRunResult,
} from "../domain/mrp-types";
import { DemandType, DemandSource } from "../domain/mrp-types";

/**
 * Run complete MRP for an organisation.
 * Loads demand, inventory, BOMs and runs the calculation.
 */
export async function runMrp(organisationId: string, userId: string, horizonDays = 90): Promise<MrpRunResult> {
  const now = new Date();
  const horizonStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days back for WIP
  const horizonEnd = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  // Load all inputs
  const [demand, inventory, boms, existingSupply, leadTimes, safetyStocks] = await Promise.all([
    loadDemand(organisationId, horizonStart, horizonEnd),
    loadInventory(organisationId),
    loadBomDefinitions(organisationId),
    loadExistingSupply(organisationId),
    loadLeadTimes(organisationId),
    loadSafetyStocks(organisationId),
  ]);

  // Create MRP context
  const context = {
    organisationId,
    planningHorizon: { start: horizonStart, end: horizonEnd },
    demand,
    inventory,
    bomDefinitions: boms,
    existingSupply,
    leadTimes,
    safetyStock: safetyStocks,
  };

  // Run calculation
  const engine = new MrpEngine(context);
  const result = await engine.run();

  // Store planning run and suggestions
  await storeResultsPlanningRun(organisationId, userId, result);

  return result;
}

/**
 * Load all demand: confirmed sales orders + forecasts.
 */
async function loadDemand(organisationId: string, start: Date, end: Date): Promise<DemandLine[]> {
  const demand: DemandLine[] = [];

  // Load confirmed sales orders (firm demand)
  const orders = await db.salesOrder.findMany({
    where: {
      organisationId,
      commercialStatus: "CONFIRMED",
      lines: { some: {} },
    },
    include: {
      lines: {
        where: {
          requestedDeliveryDate: { gte: start, lte: end },
        },
      },
    },
  });

  const shippedRows = await db.fulfilmentLine.findMany({
    where: { organisationId, salesOrderLineId: { in: orders.flatMap((order) => order.lines.map((line) => line.id)) } },
    select: { salesOrderLineId: true, shippedQuantity: true },
  });
  const shipped = new Map<string, number>();
  for (const row of shippedRows) shipped.set(row.salesOrderLineId, (shipped.get(row.salesOrderLineId) ?? 0) + row.shippedQuantity);

  for (const order of orders) {
    for (const line of order.lines) {
      if (!line.productId) continue;
      const open = line.orderedQuantity - line.cancelledQuantity - (shipped.get(line.id) ?? 0);
      if (open <= 0) continue;
      demand.push({
        id: line.id,
        demandType: DemandType.FIRM,
        source: DemandSource.SALES_ORDER,
        productId: line.productId,
        quantity: open,
        requiredDate: line.requestedDeliveryDate || new Date(),
        sourceId: order.id,
        sourceLineId: line.id,
        notes: `SO ${order.reference}`,
      });
    }
  }

  // Load forecast demand
  const forecasts = await db.manufacturingDemandForecast.findMany({
    where: {
      organisationId,
      periodStart: { gte: start, lte: end },
    },
  });

  for (const forecast of forecasts) {
    demand.push({
      id: forecast.id,
      demandType: DemandType.FORECAST,
      source: DemandSource.FORECAST,
      productId: forecast.productId,
      quantity: Number(forecast.quantity),
      requiredDate: forecast.periodStart,
      sourceId: forecast.id,
      notes: forecast.notes || "Forecast",
    });
  }

  return demand;
}

/**
 * Load current inventory state by product/site.
 */
async function loadInventory(organisationId: string): Promise<Map<string, InventoryState>> {
  const inventory = new Map<string, InventoryState>();

  // Load stock balances
  const balances = await db.inventoryBalance.findMany({
    where: { organisationId },
    include: { warehouse: true },
  });

  for (const balance of balances) {
    const siteId = balance.warehouse?.siteId || "DEFAULT";
    const key = `${balance.productId}-${siteId}`;

    if (!inventory.has(key)) {
      inventory.set(key, {
        productId: balance.productId,
        siteId,
        onHand: 0,
        allocated: 0,
        qualityHeld: 0,
        available: 0,
        safetyStock: 0,
      });
    }

    const state = inventory.get(key)!;
    state.onHand += Number(balance.quantity);
  }

  // Stock already reserved for fulfilments is not available to plan against
  const warehouses = await db.warehouse.findMany({ where: { organisationId }, select: { id: true, siteId: true } });
  const siteOf = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.siteId || "DEFAULT"]));
  const reservations = await db.stockReservation.findMany({
    where: { organisationId, status: "ACTIVE" },
    select: { productId: true, warehouseId: true, quantity: true },
  });
  for (const reservation of reservations) {
    const state = inventory.get(`${reservation.productId}-${siteOf.get(reservation.warehouseId) ?? "DEFAULT"}`);
    if (state) state.allocated += reservation.quantity;
  }

  // Load quality holds
  const holds = await db.qualityHold.findMany({
    where: { organisationId },
  });

  for (const hold of holds) {
    for (const [key, state] of inventory) {
      if (state.productId === hold.productId) {
        state.qualityHeld += Number(hold.quantity);
      }
    }
  }

  // Calculate available = onHand - allocated - qualityHeld
  for (const state of inventory.values()) {
    state.available = Math.max(0, state.onHand - state.allocated - state.qualityHeld);
  }

  return inventory;
}

/**
 * Load BOM definitions for all products.
 */
async function loadBomDefinitions(organisationId: string): Promise<Map<string, ProductionVersion>> {
  const boms = new Map<string, ProductionVersion>();

  const definitions = await db.productDefinition.findMany({
    where: { organisationId },
    include: {
      lines: true,
      operations: true,
    },
  });

  for (const def of definitions) {
    boms.set(def.productId, {
      definitionId: def.id,
      productId: def.productId,
      bomComponents: def.lines.map((line) => ({
        componentProductId: line.componentProductId,
        quantityPerUnit: Number(line.quantityPerUnit),
        scrapPercent: Number(line.scrapPercent || 0),
        position: line.position,
        notes: line.notes || "",
      })),
      operations: def.operations.map((op) => ({
        position: op.position,
        name: op.name,
        setupMinutes: Number(op.setupMinutes || 0),
        runMinutesPerUnit: Number(op.runMinutesPerUnit || 0),
        workCentreId: op.workCentreId || undefined,
        resourceId: op.resourceId || undefined,
        crewSize: Number(op.crewSize || 1),
        setupCost: op.machineMinorPerHour || 0, // TODO: more sophisticated cost model
        runCost: op.labourMinorPerHour || 0,
        labourCost: 0,
        overheadCost: op.overheadMinorPerHour || 0,
      })),
      yield: 1.0, // TODO: load from product definition
      scrapPercent: 0, // TODO: load from product definition
      minBatchSize: 1,
      maxBatchSize: 999999,
      preferredBatchSize: 1,
    });
  }

  return boms;
}

/**
 * Load existing supply (open manufacturing orders + purchase orders).
 */
async function loadExistingSupply(organisationId: string): Promise<Map<string, number>> {
  const supply = new Map<string, number>();

  // Manufacturing orders in progress
  const moOrders = await db.manufacturingOrder.findMany({
    where: {
      organisationId,
      status: { in: ["PLANNED", "READY", "RELEASED", "RUNNING"] },
    },
  });

  for (const order of moOrders) {
    const current = supply.get(order.productId) || 0;
    supply.set(order.productId, current + Number(order.quantity));
  }

  // TODO: Load purchase orders from Procurement/Finance module

  return supply;
}

/**
 * Load lead times (default 5 days for manufacturing, varies for purchase).
 */
async function loadLeadTimes(organisationId: string): Promise<Map<string, number>> {
  const leadTimes = new Map<string, number>();

  // TODO: Load from product definitions or supplier data
  // For now, return defaults
  const products = await db.product.findMany({
    where: { organisationId },
    select: { id: true },
  });

  for (const product of products) {
    leadTimes.set(product.id, 5); // default 5 days
  }

  return leadTimes;
}

/**
 * Load safety stock levels.
 */
async function loadSafetyStocks(organisationId: string): Promise<Map<string, number>> {
  const safetyStocks = new Map<string, number>();

  // TODO: Load from product definitions or inventory configuration
  // For now, return defaults
  const products = await db.product.findMany({
    where: { organisationId },
    select: { id: true },
  });

  for (const product of products) {
    safetyStocks.set(product.id, 100); // default 100 units TODO: make configurable
  }

  return safetyStocks;
}

/**
 * Store MRP run results in the database.
 */
async function storeResultsPlanningRun(
  organisationId: string,
  userId: string,
  result: MrpRunResult
) {
  // Store planning run record
  const run = await db.manufacturingPlanningRun.create({
    data: {
      organisationId,
      triggeredByUserId: userId,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      productCount: new Set(result.plannedOrders.map((o) => o.productId)).size,
      suggestionCount: result.plannedOrders.length,
      warnings: result.warnings,
    },
  });

  // Store planned order suggestions
  for (const order of result.plannedOrders) {
    await db.manufacturingSupplySuggestion.create({
      data: {
        organisationId,
        runId: run.id,
        kind: order.supplyType,
        productId: order.productId,
        quantity: order.quantity,
        neededBy: order.requiredDate,
        startBy: order.startDate,
        status: "PENDING",
        pegging: order.pegging as unknown as object,
      },
    });
  }
}
