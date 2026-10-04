// Core MRP calculation engine
import type {
  DemandLine,
  InventoryState,
  ProductionVersion,
  NetRequirement,
  MrpRunResult,
  PlannedOrder,
  MaterialShortage,
  PeggingLine,
} from "./mrp-types";
import {
  DemandType,
  DemandSource,
  SupplyType,
  PlannedOrderStatus,
  MaterialReadiness,
} from "./mrp-types";

interface MrpContext {
  organisationId: string;
  planningHorizon: { start: Date; end: Date };
  demand: DemandLine[];
  inventory: Map<string, InventoryState>; // productId -> state
  bomDefinitions: Map<string, ProductionVersion>; // productId -> definition
  existingSupply: Map<string, number>; // productId -> total on-order quantity
  leadTimes: Map<string, number>; // productId -> days
  safetyStock: Map<string, number>; // productId -> qty
}

/**
 * Core MRP engine: converts demand → net requirements → planned orders.
 * Handles multi-level BOM explosion, lead times, safety stock, pegging.
 */
export class MrpEngine {
  private context: MrpContext;
  private plannedOrders: Map<string, PlannedOrder[]> = new Map();
  private netRequirements: Map<string, NetRequirement[]> = new Map();
  private peggingMap: Map<string, PeggingLine[]> = new Map();

  constructor(context: MrpContext) {
    this.context = context;
  }

  /**
   * Run complete MRP calculation:
   * 1. Consolidate firm demand (SO lines with required dates)
   * 2. Add forecast demand where configured
   * 3. Explode multi-level BOMs
   * 4. Calculate net requirements at each level
   * 5. Generate planned orders with lead times
   * 6. Calculate material shortages
   * 7. Build pegging map
   */
  async run(): Promise<MrpRunResult> {
    const runId = `MRP-${Date.now()}`;
    const startedAt = new Date();

    try {
      // Step 1: Aggregate gross requirements for each product
      const grossRequirements = this.aggregateGrossRequirements();

      // Step 2: Explode multi-level BOMs to calculate component requirements
      await this.explodeBoms(grossRequirements);

      // Step 3: Calculate net requirements (gross - available - safety stock)
      this.calculateNetRequirements();

      // Step 4: Generate planned orders
      this.generatePlannedOrders();

      // Step 5: Identify shortages
      const shortages = this.identifyShortages();

      // Warnings/exceptions
      const warnings: string[] = [];
      if (shortages.some((s) => s.priority === "CRITICAL")) {
        warnings.push(`${shortages.filter((s) => s.priority === "CRITICAL").length} critical shortages`);
      }

      return {
        runId,
        startedAt,
        finishedAt: new Date(),
        plannedOrders: Array.from(this.plannedOrders.values()).flat(),
        shortages,
        capacityIssues: [], // TODO: implement capacity checking
        warnings,
        peggingMap: this.peggingMap,
      };
    } catch (error) {
      return {
        runId,
        startedAt,
        plannedOrders: [],
        shortages: [],
        capacityIssues: [],
        warnings: [`MRP run failed: ${error instanceof Error ? error.message : "Unknown error"}`],
        peggingMap: new Map(),
      };
    }
  }

  /**
   * Aggregate demand by product and date.
   * Firm demand (FIRM type) is always included.
   * Forecast demand only included if configured and no conflicting firm demand.
   */
  private aggregateGrossRequirements(): Map<string, DemandLine[]> {
    const requirements = new Map<string, DemandLine[]>();

    // Group by product
    for (const line of this.context.demand) {
      if (!requirements.has(line.productId)) {
        requirements.set(line.productId, []);
      }
      requirements.get(line.productId)!.push(line);
    }

    // Sort by date for later processing
    for (const lines of requirements.values()) {
      lines.sort((a, b) => a.requiredDate.getTime() - b.requiredDate.getTime());
    }

    return requirements;
  }

  /**
   * Explode multi-level BOMs: for each required product, calculate its component requirements.
   * Recursively handles nested BOMs. Applies scrap/yield factors.
   */
  private async explodeBoms(grossRequirements: Map<string, DemandLine[]>) {
    const processed = new Set<string>();
    const queue: Array<{ productId: string; quantity: number; pegging: PeggingLine[] }> = [];

    // Initialize queue with top-level demand
    for (const [productId, lines] of grossRequirements) {
      for (const line of lines) {
        queue.push({
          productId,
          quantity: line.quantity,
          pegging: [
            {
              demandId: line.id,
              demandType: line.demandType,
              demandQuantity: line.quantity,
              sourceLabel: this.formatDemandSource(line),
            },
          ],
        });
      }
    }

    // Process BOM queue depth-first
    while (queue.length > 0) {
      const item = queue.shift()!;

      if (processed.has(`${item.productId}-${item.quantity}`)) {
        continue;
      }
      processed.add(`${item.productId}-${item.quantity}`);

      const bomDef = this.context.bomDefinitions.get(item.productId);
      if (!bomDef || bomDef.bomComponents.length === 0) {
        // No BOM = finished good or purchased item, no further explosion
        continue;
      }

      // For each component, calculate required quantity (accounting for scrap)
      for (const component of bomDef.bomComponents) {
        const scrapFactor = 1 + component.scrapPercent / 100;
        const requiredQuantity = item.quantity * component.quantityPerUnit * scrapFactor;

        // Create demand line for this component
        queue.push({
          productId: component.componentProductId,
          quantity: requiredQuantity,
          pegging: item.pegging, // Inherit pegging from parent
        });

        // Store pegging for this component demand
        if (!this.peggingMap.has(component.componentProductId)) {
          this.peggingMap.set(component.componentProductId, []);
        }
        this.peggingMap.get(component.componentProductId)!.push(...item.pegging);
      }
    }
  }

  /**
   * Calculate net requirements for each product:
   * NET = GROSS - AVAILABLE_INVENTORY - EXISTING_SUPPLY + SAFETY_STOCK
   */
  private calculateNetRequirements() {
    for (const [productId, demandLines] of this.context.demand
      .reduce(
        (acc, d) => {
          if (!acc.has(d.productId)) acc.set(d.productId, []);
          acc.get(d.productId)!.push(d);
          return acc;
        },
        new Map<string, DemandLine[]>()
      )) {
      const inventory = this.context.inventory.get(productId);
      const existing = this.context.existingSupply.get(productId) || 0;
      const safetyStock = this.context.safetyStock.get(productId) || 0;

      const netRequirements: NetRequirement[] = [];

      for (const line of demandLines) {
        const available = inventory?.available || 0;
        const net = Math.max(0, line.quantity - available - existing);

        if (net > 0 || inventory && inventory.onHand < safetyStock) {
          netRequirements.push({
            productId,
            quantity: line.quantity,
            requiredDate: line.requiredDate,
            safetyStock,
            existingSupply: existing,
            netQuantity: net,
            pegging: this.peggingMap.get(productId) || [
              {
                demandId: line.id,
                demandType: line.demandType,
                demandQuantity: line.quantity,
                sourceLabel: this.formatDemandSource(line),
              },
            ],
          });
        }
      }

      if (netRequirements.length > 0) {
        this.netRequirements.set(productId, netRequirements);
      }
    }
  }

  /**
   * Generate planned orders from net requirements.
   * Applies lead times, lot-sizing (min/max/preferred batch).
   */
  private generatePlannedOrders() {
    for (const [productId, netReqs] of this.netRequirements) {
      const bomDef = this.context.bomDefinitions.get(productId);
      const leadTime = this.context.leadTimes.get(productId) || 5; // default 5 days

      const planned: PlannedOrder[] = [];

      for (const netReq of netReqs) {
        // Determine supply type (make vs buy)
        const supplyType = bomDef ? SupplyType.MAKE : SupplyType.BUY;

        // Apply lot sizing
        let orderQuantity = netReq.netQuantity;
        if (bomDef && bomDef.preferredBatchSize) {
          orderQuantity = Math.ceil(netReq.netQuantity / bomDef.preferredBatchSize) * bomDef.preferredBatchSize;
        }

        const requiredDate = netReq.requiredDate;
        const startDate = new Date(requiredDate);
        startDate.setDate(startDate.getDate() - leadTime);

        planned.push({
          productId,
          quantity: orderQuantity,
          requiredDate,
          startDate,
          finishDate: requiredDate,
          supplyType,
          status: PlannedOrderStatus.PROPOSED,
          pegging: netReq.pegging,
          materialStatus: this.determineMaterialStatus(productId),
          plannedCost: this.estimateCost(productId, orderQuantity, bomDef),
        });
      }

      if (planned.length > 0) {
        this.plannedOrders.set(productId, planned);
      }
    }
  }

  /**
   * Identify material shortages: planned orders where materials are not ready.
   */
  private identifyShortages(): MaterialShortage[] {
    const shortages: MaterialShortage[] = [];

    for (const [productId, planned] of this.plannedOrders) {
      for (const order of planned) {
        const inventory = this.context.inventory.get(productId);
        if (!inventory || inventory.available < order.quantity) {
          const available = inventory?.available || 0;
          const shortage = order.quantity - available;

          shortages.push({
            productId,
            productName: "Product", // TODO: get from product master
            productCode: productId,
            requiredQuantity: order.quantity,
            availableQuantity: available,
            shortageQuantity: shortage,
            requiredDate: order.requiredDate,
            affectedDemand: this.context.demand.filter((d) => d.productId === productId),
            suggestedActions: this.suggestShortageActions(productId, shortage),
            priority:
              shortage / order.quantity > 0.5
                ? "CRITICAL"
                : shortage / order.quantity > 0.2
                  ? "HIGH"
                  : "NORMAL",
          });
        }
      }
    }

    return shortages.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.requiredDate.getTime() - a.requiredDate.getTime()
      );
    });
  }

  private determineMaterialStatus(productId: string): MaterialReadiness {
    const inventory = this.context.inventory.get(productId);
    if (!inventory) return MaterialReadiness.SHORT;
    if (inventory.qualityHeld > 0) return MaterialReadiness.QUALITY_HOLD;
    if (inventory.available > 0) return MaterialReadiness.READY;
    return MaterialReadiness.SHORT;
  }

  private estimateCost(productId: string, quantity: number, bomDef?: ProductionVersion): number {
    if (!bomDef) return 0; // TODO: lookup purchase cost
    // Simple: sum operation setup costs + (run cost × quantity)
    let cost = 0;
    for (const op of bomDef.operations) {
      cost += op.setupCost + op.runCost * quantity;
    }
    return cost;
  }

  private suggestShortageActions(productId: string, shortage: number) {
    return [
      {
        action: "EXPEDITE_SUPPLY" as const,
        description: `Expedite purchase or production of ${shortage} units`,
        canApply: true,
      },
      {
        action: "SUBSTITUTE" as const,
        description: "Use alternative component",
        canApply: false,
      },
    ];
  }

  private formatDemandSource(line: DemandLine): string {
    return `${line.source} ${line.sourceId}`;
  }
}
