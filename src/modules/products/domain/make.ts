export const COMPONENT_GROUPS = [
  { supply: "WIP", title: "Work in progress", detail: "An intermediate you make and can hold in stock. It has its own bill, and this product consumes it." },
  { supply: "MAKE", title: "Made here", detail: "A subassembly made in this plant, then used on this bill." },
  { supply: "BUY", title: "Bought materials", detail: "Purchased parts. Their cost is the standard price." },
  { supply: "SUBCONTRACT", title: "Sent out", detail: "A supplier makes this component. You may still supply some of its parts." },
] as const;

export const SUPPLY = ["MAKE", "BUY", "WIP", "SUBCONTRACT"] as const;
export type SupplyPolicy = (typeof SUPPLY)[number];

export type MakeLine = { componentId: string; quantityPerUnit: number; scrapPercent: number; notes?: string };
export type MakeOperation = {
  name: string;
  setupMinutes: number;
  runMinutesPerUnit: number;
  crewSize: number;
  machineMinorPerHour: number;
  labourMinorPerHour: number;
  logisticsMinorPerBatch: number;
  machineIncludesLabour: boolean;
  /** Named place this step runs. A linked work centre and machine are the plant record Manufacturing releases onto. */
  workCentre?: string;
  workCentreId?: string | null;
  resourceId?: string | null;
  overheadMinorPerHour?: number;
  machineIncludesOverhead?: boolean;
};
export type MakeDefinition = {
  productId: string;
  supply: SupplyPolicy;
  batchQuantity: number;
  yieldPercent: number;
  purchaseMinor: number;
  /** Fee paid per good unit when the product is sent out. */
  subcontractMinorPerUnit?: number;
  lines: MakeLine[];
  operations: MakeOperation[];
};
export type CostKind = "material" | "machine" | "labour" | "overhead" | "subcontract" | "logistics";
export type CostRow = { label: string; kind: CostKind; minor: number; detail: string };

const round = (value: number) => Math.round(value);

export function cover(onHand: number, confirmed: number, planned: number) {
  return { orderGap: Math.max(0, confirmed - onHand), planGap: Math.max(0, planned - onHand) };
}

function goodYield(definition: MakeDefinition) {
  if (!(definition.yieldPercent > 0 && definition.yieldPercent <= 100)) throw new Error("Yield must be between 0 and 100 percent.");
  if (!(definition.batchQuantity > 0)) throw new Error("Batch size must be greater than zero.");
  return definition.yieldPercent / 100;
}

/** Component quantity required for one good unit, after yield and scrap. */
export function componentPerGoodUnit(line: MakeLine, yieldPercent: number) {
  if (!(line.quantityPerUnit > 0)) throw new Error("Each component needs a quantity.");
  if (line.scrapPercent < 0 || line.scrapPercent > 100) throw new Error("Scrap must be between 0 and 100 percent.");
  if (!(yieldPercent > 0 && yieldPercent <= 100)) throw new Error("Yield must be between 0 and 100 percent.");
  return line.quantityPerUnit * (1 + line.scrapPercent / 100) / (yieldPercent / 100);
}

export function assertRecipe(productId: string, definition: MakeDefinition, catalog: Map<string, MakeDefinition>) {
  if (!SUPPLY.includes(definition.supply)) throw new Error("Choose make, buy, work in progress or subcontract.");
  goodYield(definition);
  const seen = new Set<string>();
  for (const line of definition.lines) {
    if (line.componentId === productId) throw new Error("A product cannot contain itself.");
    if (seen.has(line.componentId)) throw new Error("Each component can appear once. Combine the quantities.");
    seen.add(line.componentId);
    componentPerGoodUnit(line, definition.yieldPercent);
  }
  const next = new Map(catalog);
  next.set(productId, { ...definition, productId });
  standardUnitMinor(productId, next);
}

function hours(definition: MakeDefinition, quantity: number, spreadSetup: boolean) {
  const batches = spreadSetup ? quantity / definition.batchQuantity : Math.ceil(quantity / definition.batchQuantity);
  let setup = 0;
  let run = 0;
  let crew = 0;
  for (const operation of definition.operations) {
    const setupHours = batches * (operation.setupMinutes / 60);
    const runHours = quantity * (operation.runMinutesPerUnit / 60);
    setup += setupHours;
    run += runHours;
    crew += operation.crewSize * (setupHours + runHours);
  }
  return { setup, run, crew };
}

export type CostBuckets = Record<CostKind, number>;
export type MakeCost = { totalMinor: number; buckets: CostBuckets; hours: { setup: number; run: number; crew: number } };
export type BuildNode = { productId: string; supply: SupplyPolicy; quantity: number; children: BuildNode[] };

const emptyBuckets = (): CostBuckets => ({ material: 0, machine: 0, labour: 0, overhead: 0, subcontract: 0, logistics: 0 });

function operationCost(definition: MakeDefinition, quantity: number, spreadSetup: boolean) {
  const batches = spreadSetup ? quantity / definition.batchQuantity : Math.ceil(quantity / definition.batchQuantity);
  const buckets = emptyBuckets();
  let setup = 0;
  let run = 0;
  let crew = 0;
  for (const operation of definition.operations) {
    const setupHours = batches * (operation.setupMinutes / 60);
    const runHours = quantity * (operation.runMinutesPerUnit / 60);
    const span = setupHours + runHours;
    setup += setupHours;
    run += runHours;
    crew += operation.crewSize * span;
    buckets.machine += span * operation.machineMinorPerHour;
    if (!operation.machineIncludesLabour) buckets.labour += operation.crewSize * span * operation.labourMinorPerHour;
    if (!operation.machineIncludesOverhead) buckets.overhead += span * (operation.overheadMinorPerHour ?? 0);
    buckets.logistics += batches * operation.logisticsMinorPerBatch;
  }
  for (const key of Object.keys(buckets) as CostKind[]) buckets[key] = round(buckets[key]);
  return { buckets, hours: { setup, run, crew } };
}

/** Rolled cost. Setup is shared across a normal batch when `spreadSetup` is set, and charged per batch started otherwise. */
export function rolledCost(productId: string, quantity: number, catalog: Map<string, MakeDefinition>, stack: string[] = [], spreadSetup = false): MakeCost {
  const zero = { totalMinor: 0, buckets: emptyBuckets(), hours: { setup: 0, run: 0, crew: 0 } };
  if (!(quantity > 0)) return zero;
  const definition = catalog.get(productId);
  if (!definition || definition.supply === "BUY") {
    const material = round((definition?.purchaseMinor ?? 0) * quantity);
    return { totalMinor: material, buckets: { ...emptyBuckets(), material }, hours: zero.hours };
  }
  if (stack.includes(productId)) throw new Error("This recipe loops. Remove the component that leads back to itself.");
  if (stack.length > 12) throw new Error("This recipe is nested more than 12 levels deep.");
  goodYield(definition);
  const buckets = emptyBuckets();
  const hours = { setup: 0, run: 0, crew: 0 };
  for (const line of definition.lines) {
    const needed = quantity * componentPerGoodUnit(line, definition.yieldPercent);
    const child = rolledCost(line.componentId, needed, catalog, [...stack, productId], spreadSetup);
    for (const key of Object.keys(buckets) as CostKind[]) buckets[key] += child.buckets[key];
    hours.setup += child.hours.setup;
    hours.run += child.hours.run;
    hours.crew += child.hours.crew;
  }
  const own = operationCost(definition, quantity, spreadSetup);
  for (const key of Object.keys(buckets) as CostKind[]) buckets[key] += own.buckets[key];
  hours.setup += own.hours.setup;
  hours.run += own.hours.run;
  hours.crew += own.hours.crew;
  if (definition.supply === "SUBCONTRACT") buckets.subcontract += round((definition.subcontractMinorPerUnit ?? 0) * quantity);
  return { totalMinor: Object.values(buckets).reduce((sum, value) => sum + value, 0), buckets, hours };
}

/** Stable cost of one good unit. Setup is shared across the batch. */
export function standardUnitMinor(productId: string, catalog: Map<string, MakeDefinition>, stack: string[] = []): number {
  return rolledCost(productId, 1, catalog, stack, true).totalMinor;
}

/** Parents whose active recipe consumes this product. */
export function usedBy(productId: string, catalog: Map<string, MakeDefinition>) {
  return [...catalog.values()].filter((definition) => definition.supply !== "BUY" && definition.lines.some((line) => line.componentId === productId)).map((definition) => definition.productId);
}

/** Multi-level recipe. Bought items stop the branch. Quantity is what that node must supply. */
export function buildTree(productId: string, quantity: number, catalog: Map<string, MakeDefinition>, stack: string[] = []): BuildNode {
  const definition = catalog.get(productId);
  const supply = definition?.supply ?? "BUY";
  if (!definition || supply === "BUY" || !(quantity > 0) || stack.includes(productId) || stack.length > 12) return { productId, supply, quantity, children: [] };
  return {
    productId,
    supply,
    quantity,
    children: definition.lines.map((line) => buildTree(line.componentId, quantity * componentPerGoodUnit(line, definition.yieldPercent), catalog, [...stack, productId])),
  };
}

/** Made, WIP and subcontracted items underneath a product, excluding the product itself. */
export function intermediates(productId: string, quantity: number, catalog: Map<string, MakeDefinition>) {
  const totals = new Map<string, { quantity: number; supply: SupplyPolicy }>();
  const visit = (node: BuildNode, root: boolean) => {
    if (!root && node.supply !== "BUY") totals.set(node.productId, { quantity: (totals.get(node.productId)?.quantity ?? 0) + node.quantity, supply: node.supply });
    node.children.forEach((child) => visit(child, false));
  };
  visit(buildTree(productId, quantity, catalog), true);
  return [...totals.entries()].map(([componentId, row]) => ({ componentId, ...row }));
}

/** Cost to produce a specific quantity of good units, with a setup for every batch started. */
export function costToMake(productId: string, quantity: number, catalog: Map<string, MakeDefinition>): { totalMinor: number; rows: CostRow[]; hours: { setup: number; run: number; crew: number } } {
  if (!(quantity > 0)) return { totalMinor: 0, rows: [], hours: { setup: 0, run: 0, crew: 0 } };
  const definition = catalog.get(productId);
  if (!definition || definition.supply === "BUY") {
    const minor = round((definition?.purchaseMinor ?? 0) * quantity);
    return { totalMinor: minor, rows: minor ? [{ label: "Purchase price", kind: "material", minor, detail: `${quantity} at the standard price` }] : [], hours: { setup: 0, run: 0, crew: 0 } };
  }
  const rows: CostRow[] = [];
  for (const line of definition.lines) {
    const needed = quantity * componentPerGoodUnit(line, definition.yieldPercent);
    const each = standardUnitMinor(line.componentId, catalog, [productId]);
    const minor = round(needed * each);
    rows.push({ label: line.componentId, kind: "material", minor, detail: `${needed} including yield and scrap` });
  }
  const time = hours(definition, quantity, false);
  for (const operation of definition.operations) {
    const batches = Math.ceil(quantity / definition.batchQuantity);
    const setupHours = batches * (operation.setupMinutes / 60);
    const runHours = quantity * (operation.runMinutesPerUnit / 60);
    const machine = round((setupHours + runHours) * operation.machineMinorPerHour);
    if (machine) rows.push({ label: operation.name, kind: "machine", minor: machine, detail: `${batches} setup${batches === 1 ? "" : "s"} and run time` });
    if (!operation.machineIncludesLabour) {
      const labour = round(operation.crewSize * (setupHours + runHours) * operation.labourMinorPerHour);
      if (labour) rows.push({ label: `${operation.name} crew`, kind: "labour", minor: labour, detail: `${operation.crewSize} people` });
    }
    const logistics = round(batches * operation.logisticsMinorPerBatch);
    if (logistics) rows.push({ label: `${operation.name} logistics`, kind: "logistics", minor: logistics, detail: "Per batch started" });
  }
  return { totalMinor: rows.reduce((sum, row) => sum + row.minor, 0), rows, hours: time };
}

/** Purchased parts underneath a made or WIP product. Intermediates are exploded rather than ordered twice. */
export function boughtParts(productId: string, quantity: number, catalog: Map<string, MakeDefinition>, stack: string[] = []): Array<{ componentId: string; quantity: number }> {
  const definition = catalog.get(productId);
  if (!(quantity > 0)) return [];
  if (!definition || definition.supply === "BUY") return [{ componentId: productId, quantity }];
  if (stack.includes(productId)) throw new Error("This recipe loops. Remove the component that leads back to itself.");
  const totals = new Map<string, number>();
  for (const line of definition.lines) {
    const needed = quantity * componentPerGoodUnit(line, definition.yieldPercent);
    for (const part of boughtParts(line.componentId, needed, catalog, [...stack, productId])) {
      totals.set(part.componentId, (totals.get(part.componentId) ?? 0) + part.quantity);
    }
  }
  return [...totals.entries()].map(([componentId, amount]) => ({ componentId, quantity: amount }));
}
