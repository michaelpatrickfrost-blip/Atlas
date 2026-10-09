import {
  DemandType,
  MaterialReadiness,
  PlannedOrderStatus,
  SupplyType,
  type CostBuckets,
  type CostKind,
  type DemandLine,
  type MaterialShortage,
  type MrpInput,
  type MrpRunResult,
  type NetRequirement,
  type PeggingLine,
  type PlannedMaterial,
  type PlannedOperation,
  type PlannedOrder,
  type Recipe,
} from "./mrp-types";

/** Gross requirement created either by demand or by a planned parent's explosion. */
type GrossRequirement = {
  productId: string;
  quantity: number;
  requiredDate: Date;
  pegging: PeggingLine[];
  /** Set when this requirement came from a planned make, so those components can
   * be shown against the order that consumes them. */
  parentPlannedId?: string;
};

const MAX_BOM_DEPTH = 24;
const MINUTE_MS = 60_000;

const emptyBuckets = (): CostBuckets => ({ material: 0, machine: 0, labour: 0, overhead: 0, subcontract: 0, logistics: 0 });

const round = (value: number) => Math.round(value);

/** Good units produced per unit started. Mirrors Products' recipe rule. */
export function recipeYield(recipe: Recipe) {
  const yieldPercent = recipe.yieldPercent;
  if (!(yieldPercent > 0 && yieldPercent <= 100)) return 1;
  return yieldPercent / 100;
}

/** One component's consumption for a single good unit, after yield and scrap. */
export function componentPerGoodUnit(quantityPerUnit: number, scrapPercent: number, yieldPercent: number) {
  const good = yieldPercent > 0 && yieldPercent <= 100 ? yieldPercent / 100 : 1;
  return (quantityPerUnit * (1 + scrapPercent / 100)) / good;
}

const monthKey = (productId: string, date: Date) =>
  `${productId}:${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

/** Confirmed orders consume forecast in their product/month instead of being added twice. */
export function consumeForecastDemand(lines: DemandLine[]): DemandLine[] {
  const firmByMonth = new Map<string, number>();
  for (const line of lines) {
    if (line.demandType !== DemandType.FIRM) continue;
    const key = monthKey(line.productId, line.requiredDate);
    firmByMonth.set(key, (firmByMonth.get(key) ?? 0) + line.quantity);
  }
  return lines.flatMap((line) => {
    if (line.demandType !== DemandType.FORECAST || line.forecastIsResidual) return line.quantity > 0 ? [line] : [];
    const key = monthKey(line.productId, line.requiredDate);
    const firm = firmByMonth.get(key) ?? 0;
    const consumed = Math.min(line.quantity, firm);
    const remaining = Math.max(0, line.quantity - consumed);
    firmByMonth.set(key, firm - consumed);
    return remaining > 0 ? [{ ...line, quantity: remaining }] : [];
  });
}

/**
 * Deterministic MRP: forecast consumption, level-by-level netting, BOM explosion
 * and lot sizing.
 *
 * The explode order matters. An earlier version walked the BOM in a loop but only
 * ever netted the demand it originally loaded, so component requirements were
 * recorded for pegging and then thrown away — the plan could never see a missing
 * part. Here parents are planned first (topological order), and each parent's
 * planned quantity creates real gross requirements for its components, which are
 * then netted in turn.
 */
export class MrpEngine {
  private readonly gross = new Map<string, GrossRequirement[]>();
  private readonly plannedOrders = new Map<string, PlannedOrder[]>();
  private readonly netRequirements = new Map<string, NetRequirement[]>();
  private readonly peggingMap = new Map<string, PeggingLine[]>();
  private readonly materialDemand = new Map<string, PlannedMaterial[]>();

  constructor(private readonly input: MrpInput) {}

  run(): MrpRunResult {
    const startedAt = new Date();
    const demand = consumeForecastDemand(this.input.demand).filter((line) => line.quantity > 0);

    for (const line of demand) {
      this.addGross({
        productId: line.productId,
        quantity: line.quantity,
        requiredDate: line.requiredDate,
        pegging: [this.peg(line)],
      });
    }

    for (const productId of this.topologicalProducts(demand.map((line) => line.productId))) this.planProduct(productId);

    const shortages = this.identifyShortages();
    const critical = shortages.filter((row) => row.priority === "CRITICAL").length;
    return {
      runId: `MRP-${startedAt.getTime()}`,
      startedAt,
      finishedAt: new Date(),
      plannedOrders: [...this.plannedOrders.values()].flat(),
      shortages,
      capacityIssues: [],
      warnings: critical ? [`${critical} critical shortages`] : [],
      peggingMap: this.peggingMap,
    };
  }

  /** Deepest demand products come back last, so every parent is planned before
   * the components it consumes. Cycles and excessive depth are refused outright
   * rather than silently truncated. */
  private topologicalProducts(roots: string[]) {
    const state = new Map<string, "VISITING" | "DONE">();
    const postOrder: string[] = [];
    const visit = (productId: string, path: string[]) => {
      if (state.get(productId) === "DONE") return;
      if (state.get(productId) === "VISITING") {
        const start = Math.max(0, path.indexOf(productId));
        throw new Error(`BOM loop detected: ${[...path.slice(start), productId].join(" → ")}.`);
      }
      if (path.length >= MAX_BOM_DEPTH) throw new Error(`BOM exceeds the supported depth of ${MAX_BOM_DEPTH} levels.`);
      state.set(productId, "VISITING");
      for (const component of this.input.recipes.get(productId)?.components ?? []) visit(component.componentProductId, [...path, productId]);
      state.set(productId, "DONE");
      postOrder.push(productId);
    };
    for (const root of new Set(roots)) visit(root, []);
    return postOrder.reverse();
  }

  private addGross(requirement: GrossRequirement) {
    this.gross.set(requirement.productId, [...(this.gross.get(requirement.productId) ?? []), requirement]);
    const existing = this.peggingMap.get(requirement.productId) ?? [];
    for (const peg of requirement.pegging) {
      if (!existing.some((row) => row.demandId === peg.demandId && row.sourceLabel === peg.sourceLabel)) existing.push(peg);
    }
    this.peggingMap.set(requirement.productId, existing);
  }

  private planProduct(productId: string) {
    const requirements = [...(this.gross.get(productId) ?? [])].sort((a, b) => a.requiredDate.getTime() - b.requiredDate.getTime());
    if (!requirements.length) return;

    const recipe = this.input.recipes.get(productId);
    const isMade = Boolean(recipe && recipe.supply !== "BUY");
    const safetyStock = Math.max(0, this.input.safetyStock.get(productId) ?? 0);
    const existingSupply = Math.max(0, this.input.existingSupply.get(productId) ?? 0);
    let projected = Math.max(0, this.input.inventory.get(productId)?.available ?? 0) + existingSupply;

    const netRows: NetRequirement[] = [];
    const orderRows: PlannedOrder[] = [];

    for (const requirement of requirements) {
      projected -= requirement.quantity;
      const netQuantity = Math.max(0, safetyStock - projected);
      if (!(netQuantity > 0)) continue;

      const lots = this.lotQuantities(netQuantity, recipe);
      projected += lots.reduce((sum, quantity) => sum + quantity, 0);
      netRows.push({
        productId,
        quantity: requirement.quantity,
        requiredDate: requirement.requiredDate,
        safetyStock,
        existingSupply,
        netQuantity,
        pegging: requirement.pegging,
      });

      for (const quantity of lots) {
        const order = this.buildPlannedOrder(productId, quantity, requirement, recipe, isMade);
        orderRows.push(order);
        if (isMade) this.explodePlannedMake(order, recipe!);
      }
    }

    if (netRows.length) this.netRequirements.set(productId, netRows);
    if (orderRows.length) this.plannedOrders.set(productId, orderRows);
  }

  /** Every field the planner needs to judge a proposal, computed from the live
   * routing at the suggested quantity — never from a summary stored on the row. */
  private buildPlannedOrder(
    productId: string,
    quantity: number,
    requirement: GrossRequirement,
    recipe: Recipe | undefined,
    isMade: boolean,
  ): PlannedOrder {
    const ledgerId = requirement.parentPlannedId ?? `mrp:${requirement.productId}:${requirement.requiredDate.toISOString()}`;
    const operations = isMade ? this.planOperations(recipe!, quantity) : [];
    const materials = isMade ? this.planMaterials(recipe!, quantity, requirement.requiredDate, ledgerId) : [];
    const cost = isMade ? this.costOf(recipe!, quantity) : this.buyCost(quantity, recipe);
    const hours = operations.reduce(
      (total, operation) => ({
        setup: total.setup + operation.setupMinutes / 60,
        run: total.run + operation.runMinutes / 60,
        crew: total.crew + operation.labourHours,
      }),
      { setup: 0, run: 0, crew: 0 },
    );
    const spanMinutes = operations.reduce((sum, operation) => sum + operation.durationMinutes, 0);
    const startDate = new Date(requirement.requiredDate.getTime() - spanMinutes * MINUTE_MS);

    return {
      productId,
      quantity,
      requiredDate: requirement.requiredDate,
      startDate,
      finishDate: requirement.requiredDate,
      supplyType: isMade ? SupplyType.MAKE : SupplyType.BUY,
      status: PlannedOrderStatus.PROPOSED,
      pegging: requirement.pegging,
      materialStatus: this.determineMaterialStatus(materials),
      plannedCost: cost.totalMinor,
      cost: cost.buckets,
      hours: { setup: Math.round(hours.setup * 100) / 100, run: Math.round(hours.run * 100) / 100, crew: Math.round(hours.crew * 100) / 100 },
      operations,
      materials,
      batchCount: operations.length ? Math.max(1, Math.ceil(quantity / Math.max(1, recipe?.batchQuantity ?? quantity))) : 0,
    };
  }

  private planOperations(recipe: Recipe, quantity: number): PlannedOperation[] {
    const batchQuantity = recipe.batchQuantity > 0 ? recipe.batchQuantity : quantity;
    const batches = Math.max(1, Math.ceil(quantity / batchQuantity));
    let cursor: Date | null = null;
    return recipe.operations.map((operation, index) => {
      const setupMinutes = batches * operation.setupMinutes;
      const runMinutes = quantity * operation.runMinutesPerUnit;
      const durationMinutes = setupMinutes + runMinutes;
      const start = cursor;
      const end = cursor ? new Date(cursor.getTime() + durationMinutes * MINUTE_MS) : null;
      cursor = end;
      return {
        sequence: index + 1,
        name: operation.name,
        workCentreId: operation.workCentreId,
        workCentreCode: operation.workCentreCode,
        workCentreName: operation.workCentreName,
        resourceId: operation.resourceId,
        resourceName: operation.resourceName,
        batches,
        setupMinutes,
        runMinutes,
        durationMinutes,
        crewSize: operation.crewSize,
        labourHours: (durationMinutes / 60) * operation.crewSize,
        start,
        end,
      };
    });
  }

  /** Components this make consumes, netted against what is on hand now, so the
   * planner sees which parts are already covered and which are short. */
  private planMaterials(recipe: Recipe, quantity: number, requiredBy: Date, ledgerId: string): PlannedMaterial[] {
    const rows = recipe.components.map((component) => {
      const needed = quantity * componentPerGoodUnit(component.quantityPerUnit, component.scrapPercent, recipe.yieldPercent);
      const onHand = Math.max(0, this.input.inventory.get(component.componentProductId)?.available ?? 0);
      const material: PlannedMaterial = {
        productId: component.componentProductId,
        productCode: null,
        productName: null,
        quantity: needed,
        onHand,
        covered: Math.min(needed, onHand),
        shortage: Math.max(0, needed - onHand),
        requiredBy,
      };
      return material;
    });
    this.materialDemand.set(ledgerId, [...(this.materialDemand.get(ledgerId) ?? []), ...rows]);
    return rows;
  }

  /** Components are required only for the make quantity that survives finished-goods
   * netting. Dated at the planned start, retaining the original customer/forecast peg. */
  private explodePlannedMake(order: PlannedOrder, recipe: Recipe) {
    const ledgerId = `mrp:${order.productId}:${order.requiredDate.toISOString()}:${order.quantity}`;
    for (const component of recipe.components) {
      const quantity = order.quantity * componentPerGoodUnit(component.quantityPerUnit, component.scrapPercent, recipe.yieldPercent);
      if (!(quantity > 0) || !Number.isFinite(quantity)) throw new Error(`Invalid BOM quantity for ${component.componentProductId}.`);
      this.addGross({
        productId: component.componentProductId,
        quantity,
        requiredDate: order.startDate,
        pegging: order.pegging,
        parentPlannedId: ledgerId,
      });
    }
  }

  /** Batch rounding only. The Products recipe owns the real lot policy; treating a
   * zero batch size as if it were one would invent rounding the user never asked
   * for. `maxBatchSize` is deliberately not applied — splitting a requirement
   * across several orders would fabricate orders that no policy requested. */
  private lotQuantities(net: number, recipe?: Recipe) {
    if (!(net > 0)) return [];
    const multiple = recipe && recipe.batchQuantity > 0 ? recipe.batchQuantity : 0;
    if (!multiple) return [net];
    return [Math.ceil(net / multiple) * multiple];
  }

  private determineMaterialStatus(materials: PlannedMaterial[]): MaterialReadiness {
    if (!materials.length) return MaterialReadiness.READY;
    if (materials.some((row) => (this.input.inventory.get(row.productId)?.qualityHeld ?? 0) > 0 && row.shortage > 0)) {
      return MaterialReadiness.QUALITY_HOLD;
    }
    if (materials.some((row) => row.shortage > 0)) return MaterialReadiness.PARTIAL;
    return MaterialReadiness.READY;
  }

  /** Same split the product page shows: materials, machine, labour, overhead,
   * subcontract and logistics. Bought items cost their standard price. */
  private costOf(recipe: Recipe, quantity: number): { totalMinor: number; buckets: CostBuckets } {
    const buckets = emptyBuckets();
    for (const component of recipe.components) {
      const needed = quantity * componentPerGoodUnit(component.quantityPerUnit, component.scrapPercent, recipe.yieldPercent);
      const child = this.rolledCost(component.componentProductId, needed, 0);
      for (const key of Object.keys(buckets) as CostKind[]) buckets[key] += child.buckets[key];
    }
    const batchQuantity = recipe.batchQuantity > 0 ? recipe.batchQuantity : quantity;
    const batches = Math.max(1, Math.ceil(quantity / batchQuantity));
    for (const operation of recipe.operations) {
      const setupHours = batches * (operation.setupMinutes / 60);
      const runHours = quantity * (operation.runMinutesPerUnit / 60);
      const span = setupHours + runHours;
      buckets.machine += span * operation.machineMinorPerHour;
      if (!operation.machineIncludesLabour) buckets.labour += operation.crewSize * span * operation.labourMinorPerHour;
      if (!operation.machineIncludesOverhead) buckets.overhead += span * operation.overheadMinorPerHour;
      buckets.logistics += batches * operation.logisticsMinorPerBatch;
    }
    if (recipe.supply === "SUBCONTRACT") buckets.subcontract += round(recipe.subcontractMinorPerUnit * quantity);
    for (const key of Object.keys(buckets) as CostKind[]) buckets[key] = round(buckets[key]);
    return { totalMinor: Object.values(buckets).reduce((sum, value) => sum + value, 0), buckets };
  }

  /** Multi-level cost of a bought part or an intermediate nobody plans here. */
  private rolledCost(productId: string, quantity: number, depth: number): { totalMinor: number; buckets: CostBuckets } {
    const recipe = this.input.recipes.get(productId);
    if (!recipe || recipe.supply === "BUY") {
      const material = round(this.priceOf(productId) * quantity);
      return { totalMinor: material, buckets: { ...emptyBuckets(), material } };
    }
    if (depth >= MAX_BOM_DEPTH) throw new Error(`Recipe for ${productId} is nested more than ${MAX_BOM_DEPTH} levels deep.`);
    return this.costOf(recipe, quantity);
  }

  /** Standard price of one bought unit. A made product with no price of its own
   * costs nothing here; its components carry the cost. */
  private priceOf(productId: string) {
    return this.input.prices.get(productId) ?? 0;
  }

  private buyCost(quantity: number, recipe?: Recipe) {
    const material = round((recipe ? this.priceOf(recipe.productId) : 0) * quantity);
    return { totalMinor: material, buckets: { ...emptyBuckets(), material } };
  }

  private identifyShortages(): MaterialShortage[] {
    const shortages: MaterialShortage[] = [];
    for (const [productId, rows] of this.netRequirements) {
      for (const row of rows) {
        if (!(row.netQuantity > 0)) continue;
        const available = Math.max(0, this.input.inventory.get(productId)?.available ?? 0);
        const recipe = this.input.recipes.get(productId);
        const made = Boolean(recipe && recipe.supply !== "BUY");
        shortages.push({
          productId,
          productName: this.input.names.get(productId)?.name ?? "Product",
          productCode: this.input.names.get(productId)?.code ?? productId,
          requiredQuantity: row.quantity,
          availableQuantity: available,
          shortageQuantity: row.netQuantity,
          requiredDate: row.requiredDate,
          affectedDemand: this.input.demand.filter((demand) => row.pegging.some((peg) => peg.demandId === demand.id)),
          suggestedActions: [
            {
              action: "EXPEDITE_SUPPLY",
              description: made
                ? `Produce or expedite ${row.netQuantity} of this item`
                : `Purchase or expedite ${row.netQuantity} of this part`,
              canApply: true,
            },
          ],
          priority: row.netQuantity / Math.max(row.quantity, 1) > 0.5 ? "CRITICAL" : row.netQuantity / Math.max(row.quantity, 1) > 0.2 ? "HIGH" : "NORMAL",
        });
      }
    }
    const priority = { CRITICAL: 0, HIGH: 1, NORMAL: 2 } as const;
    return shortages.sort((a, b) => priority[a.priority] - priority[b.priority] || a.requiredDate.getTime() - b.requiredDate.getTime());
  }

  private peg(line: DemandLine): PeggingLine {
    return { demandId: line.id, demandType: line.demandType, demandQuantity: line.quantity, sourceLabel: line.notes || `${line.source} ${line.sourceId}` };
  }
}
