import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { boughtParts, buildTree, cover, intermediates, rolledCost, usedBy, type BuildNode, type MakeDefinition, type SupplyPolicy } from "@/modules/products/domain/make";
import { readAvailability } from "@/modules/stock/services/availability";

const supplyOf = (value: string): SupplyPolicy => value === "BUY" || value === "WIP" || value === "SUBCONTRACT" ? value : "MAKE";

export async function loadProductWorkspace(productId: string) {
  const session = await requireSession();
  if (!can(session, "core.products.read") && !can(session, "stock.read")) throw new Error("FORBIDDEN: missing capability \"core.products.read\"");
  const product = await db.product.findFirst({ where: { id: productId, organisationId: session.organisationId } });
  if (!product) return null;
  const seeRecipe = can(session, "core.products.read");
  const seeStock = can(session, "stock.read");
  const seeOrders = can(session, "sales.order.read");
  const seePlan = can(session, "planning.demand.read");
  const [definitions, stock, warehouses, orders, plans, catalogue] = await Promise.all([
    seeRecipe ? db.productDefinition.findMany({ where: { organisationId: session.organisationId, status: "ACTIVE" }, include: { lines: { orderBy: { position: "asc" } }, operations: { orderBy: { position: "asc" } } } }) : Promise.resolve([]),
    seeStock ? db.inventoryBalance.findMany({ where: { organisationId: session.organisationId } }) : Promise.resolve([]),
    seeStock ? db.warehouse.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    seeOrders ? db.salesOrderLine.findMany({ where: { productId, order: { organisationId: session.organisationId, commercialStatus: { in: ["CONFIRMED", "ON_HOLD"] } } }, select: { orderedQuantity: true, cancelledQuantity: true, promisedDeliveryDate: true, requestedDeliveryDate: true, order: { select: { promisedDeliveryDate: true, requestedDeliveryDate: true, reference: true } } } }) : Promise.resolve([]),
    seePlan ? db.productionPlanLine.findMany({ where: { organisationId: session.organisationId, productId }, select: { quantity: true, startsOn: true, endsOn: true } }) : Promise.resolve([]),
    seeRecipe ? db.product.findMany({ where: { organisationId: session.organisationId, kind: "PRODUCT" }, select: { id: true, code: true, name: true, categoryCode: true, unitOfMeasure: true, basePriceAmount: true, baseCurrency: true, active: true, netWeightGrams: true, grossWeightGrams: true, lengthMm: true, widthMm: true, heightMm: true, volumeMl: true, unitsPerPack: true, packsPerLayer: true, layersPerPallet: true, stackable: true, originCountry: true, commodityCode: true, customsDescription: true, hazardClass: true, unNumber: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);
  const referencedCentres = [...new Set(definitions.flatMap((row) => row.operations.map((operation) => operation.workCentreId).filter((id): id is string => !!id)))];
  const referencedMachines = [...new Set(definitions.flatMap((row) => row.operations.map((operation) => operation.resourceId).filter((id): id is string => !!id)))];
  const [categories, centres, machines] = await Promise.all([
    db.productCategory.findMany({ where: { organisationId: session.organisationId }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
    db.manufacturingWorkCentre.findMany({ where: { organisationId: session.organisationId, OR: [{ active: true }, ...(referencedCentres.length ? [{ id: { in: referencedCentres } }] : [])] }, select: { id: true, code: true, name: true, active: true }, orderBy: { name: "asc" } }),
    db.manufacturingResource.findMany({ where: { organisationId: session.organisationId, OR: [{ active: true }, ...(referencedMachines.length ? [{ id: { in: referencedMachines } }] : [])] }, select: { id: true, name: true, type: true, workCentreId: true, active: true }, orderBy: { name: "asc" } }),
  ]);
  const names = new Map(catalogue.map((item) => [item.id, item]));
  const catalog = new Map<string, MakeDefinition>();
  for (const item of catalogue) catalog.set(item.id, { productId: item.id, supply: "BUY", batchQuantity: 1, yieldPercent: 100, purchaseMinor: item.basePriceAmount, lines: [], operations: [] });
  for (const row of definitions) {
    catalog.set(row.productId, {
      productId: row.productId,
      supply: supplyOf(row.supply),
      batchQuantity: Number(row.batchQuantity),
      yieldPercent: Number(row.yieldPercent),
      purchaseMinor: names.get(row.productId)?.basePriceAmount ?? product.basePriceAmount,
      subcontractMinorPerUnit: row.subcontractMinorPerUnit,
      lines: row.lines.map((line) => ({ componentId: line.componentProductId, quantityPerUnit: Number(line.quantityPerUnit), scrapPercent: Number(line.scrapPercent), notes: line.notes })),
      operations: row.operations.map((operation) => ({ name: operation.name, setupMinutes: Number(operation.setupMinutes), runMinutesPerUnit: Number(operation.runMinutesPerUnit), crewSize: Number(operation.crewSize), machineMinorPerHour: operation.machineMinorPerHour, labourMinorPerHour: operation.labourMinorPerHour, logisticsMinorPerBatch: operation.logisticsMinorPerBatch, machineIncludesLabour: operation.machineIncludesLabour, workCentre: operation.workCentre, workCentreId: operation.workCentreId, resourceId: operation.resourceId, overheadMinorPerHour: operation.overheadMinorPerHour, machineIncludesOverhead: operation.machineIncludesOverhead })),
    });
  }
  const definition = definitions.find((row) => row.productId === productId) ?? null;
  const recipe = catalog.get(productId);
  const onHand = stock.filter((row) => row.productId === productId).reduce((sum, row) => sum + row.quantity, 0);
  const picture = seeStock ? (await readAvailability()).products.find((row) => row.productId === productId) : undefined;
  const available = picture?.available ?? onHand;
  const confirmed = orders.reduce((sum, line) => sum + Math.max(0, line.orderedQuantity - line.cancelledQuantity), 0);
  const planned = plans.reduce((sum, line) => sum + Number(line.quantity), 0);
  const gaps = cover(onHand, confirmed, planned);
  if (picture) gaps.orderGap = Math.max(0, -picture.available);
  let unitMinor = product.basePriceAmount;
  let recipeError = "";
  let unitCost: ReturnType<typeof rolledCost> | null = null;
  try {
    if (recipe && product.kind === "PRODUCT") {
      unitCost = rolledCost(productId, 1, catalog, [], true);
      unitMinor = unitCost.totalMinor;
    }
  } catch (error) { recipeError = error instanceof Error ? error.message : "The recipe could not be costed."; }
  const coverCost = !recipeError && recipe && recipe.supply !== "BUY" && gaps.orderGap > 0 ? rolledCost(productId, gaps.orderGap, catalog, [], false) : null;
  const labelPart = (componentId: string) => ({ code: names.get(componentId)?.code ?? "Part", name: names.get(componentId)?.name ?? "Part", unit: names.get(componentId)?.unitOfMeasure ?? "", onHand: stock.filter((row) => row.productId === componentId).reduce((sum, row) => sum + row.quantity, 0) });
  let parts: Array<{ componentId: string; quantity: number; code: string; name: string; onHand: number; unit: string; netWeightGrams: number | null; grossWeightGrams: number | null; lengthMm: number | null; widthMm: number | null; heightMm: number | null; volumeMl: number | null; unitsPerPack: number | null; packsPerLayer: number | null; layersPerPallet: number | null; stackable: boolean | null }> = [];
  let stages: Array<{ componentId: string; quantity: number; supply: SupplyPolicy; code: string; name: string; onHand: number; unit: string }> = [];
  try {
    if (!recipeError && recipe && recipe.supply !== "BUY" && gaps.orderGap > 0) {
      parts = boughtParts(productId, gaps.orderGap, catalog).map((part) => {
        const item = names.get(part.componentId);
        return { ...part, ...labelPart(part.componentId), netWeightGrams: item?.netWeightGrams ?? null, grossWeightGrams: item?.grossWeightGrams ?? null, lengthMm: item?.lengthMm ?? null, widthMm: item?.widthMm ?? null, heightMm: item?.heightMm ?? null, volumeMl: item?.volumeMl ?? null, unitsPerPack: item?.unitsPerPack ?? null, packsPerLayer: item?.packsPerLayer ?? null, layersPerPallet: item?.layersPerPallet ?? null, stackable: item?.stackable ?? null };
      });
      stages = intermediates(productId, gaps.orderGap, catalog).map((stage) => ({ ...stage, ...labelPart(stage.componentId) }));
    }
  } catch { parts = []; stages = []; }
interface NamedNode { id: string; code: string; name: string; unit: string; supply: SupplyPolicy; quantity: number; onHand: number; children: NamedNode[] }
const nameNode = (node: BuildNode): NamedNode => ({
  id: node.productId, ...labelPart(node.productId), supply: node.supply, quantity: node.quantity, children: node.children.map(nameNode),
});
  const tree = !recipeError && recipe && recipe.supply !== "BUY" ? nameNode(buildTree(productId, 1, catalog)) : null;
  const months = Array.from({ length: 6 }, (_, index) => {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCMonth(start.getUTCMonth() + index);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const quantity = orders.reduce((sum, line) => {
      const when = line.promisedDeliveryDate ?? line.requestedDeliveryDate ?? line.order.promisedDeliveryDate ?? line.order.requestedDeliveryDate;
      if (!when || when < start || when >= end) return sum;
      return sum + Math.max(0, line.orderedQuantity - line.cancelledQuantity);
    }, 0);
    return { label: start.toLocaleDateString("en-GB", { timeZone: "Europe/London", month: "short" }), quantity };
  });
  return {
    session,
    product,
    canEdit: can(session, "core.products.manage"),
    seeStock,
    seeOrders,
    seePlan,
    seeRecipe,
    supply: recipe?.supply ?? "BUY",
    batchQuantity: recipe?.batchQuantity ?? 1,
    yieldPercent: recipe?.yieldPercent ?? 100,
    version: definition?.version ?? 0,
    onHand,
    available,
    confirmed,
    planned,
    gaps,
    unitMinor,
    unitCost,
    recipeError,
    coverCost,
    subcontractMinor: recipe?.subcontractMinorPerUnit ?? 0,
    parts,
    stages,
    tree,
    parents: usedBy(productId, catalog).map((id) => ({ id, ...labelPart(id), supply: catalog.get(id)?.supply ?? "MAKE" })),
    months,
    peak: Math.max(1, ...months.map((month) => month.quantity)),
    warehouses: warehouses.map((warehouse) => ({ ...warehouse, quantity: stock.find((row) => row.warehouseId === warehouse.id && row.productId === productId)?.quantity ?? 0 })),
    lines: (recipe?.supply === "BUY" ? [] : recipe?.lines ?? []).map((line) => ({ ...line, code: names.get(line.componentId)?.code ?? "", name: names.get(line.componentId)?.name ?? "Former product", unit: names.get(line.componentId)?.unitOfMeasure ?? "", categoryCode: names.get(line.componentId)?.categoryCode ?? "", categoryName: categories.find((category) => category.code === names.get(line.componentId)?.categoryCode)?.name ?? names.get(line.componentId)?.categoryCode ?? "", supply: catalog.get(line.componentId)?.supply ?? "BUY", onHand: stock.filter((row) => row.productId === line.componentId).reduce((sum, row) => sum + row.quantity, 0) })),
    operations: (recipe?.supply === "BUY" ? [] : recipe?.operations ?? []).map((operation) => ({ ...operation, centreName: centres.find((centre) => centre.id === operation.workCentreId)?.name ?? operation.workCentre ?? "", machineName: machines.find((machine) => machine.id === operation.resourceId)?.name ?? "" })),
    choices: catalogue.filter((item) => item.id !== productId && item.active).map((item) => ({ id: item.id, code: item.code, name: item.name, unit: item.unitOfMeasure, categoryCode: item.categoryCode ?? "", categoryName: categories.find((category) => category.code === item.categoryCode)?.name ?? item.categoryCode ?? "", supply: catalog.get(item.id)?.supply ?? "BUY", label: `${item.code} · ${item.name}`, costMinor: item.basePriceAmount, stock: stock.filter((row) => row.productId === item.id).reduce((sum, row) => sum + row.quantity, 0) })),
    categories: categories.filter((category) => category.active || category.code === product.categoryCode),
    categoryName: categories.find((category) => category.code === product.categoryCode)?.name ?? product.categoryCode ?? "",
    plant: centres.map((centre) => ({ ...centre, machines: machines.filter((machine) => machine.workCentreId === centre.id) })),
    movements: seeStock ? await db.inventoryMovement.findMany({ where: { organisationId: session.organisationId, productId }, include: { warehouse: { select: { name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 12 }) : [],
    ...await productLinks(session.organisationId, productId),
  };
}

async function productLinks(organisationId: string, productId: string) {
  const [rows, choices] = await Promise.all([
    db.productLink.findMany({
      where: { organisationId, OR: [{ productId }, { relatedProductId: productId }] },
      select: { productId: true, relatedProductId: true, kind: true, quantity: true, notes: true, product: { select: { id: true, code: true, name: true, packUnit: true } }, related: { select: { id: true, code: true, name: true, unitOfMeasure: true } } },
    }),
    db.product.findMany({ where: { organisationId, active: true, NOT: { id: productId } }, select: { id: true, code: true, name: true, unitOfMeasure: true }, orderBy: { name: "asc" } }),
  ]);
  const amount = (value: { toString(): string }) => Number(value);
  return {
    contains: rows.filter((row) => row.productId === productId && row.kind === "CONTAINS").map((row) => ({ relatedProductId: row.relatedProductId, quantity: String(amount(row.quantity)), notes: row.notes })),
    requires: rows.filter((row) => row.productId === productId && row.kind === "REQUIRES").map((row) => ({ relatedProductId: row.relatedProductId, quantity: String(amount(row.quantity)), notes: row.notes })),
    packedIn: rows.filter((row) => row.relatedProductId === productId && row.kind === "CONTAINS").map((row) => ({ id: row.product.id, code: row.product.code, name: row.product.name, quantity: amount(row.quantity), packUnit: row.product.packUnit })),
    neededBy: rows.filter((row) => row.relatedProductId === productId && row.kind === "REQUIRES").map((row) => ({ id: row.product.id, code: row.product.code, name: row.product.name, quantity: amount(row.quantity) })),
    linkChoices: choices.map((item) => ({ id: item.id, code: item.code, name: item.name, unit: item.unitOfMeasure })),
  };
}
