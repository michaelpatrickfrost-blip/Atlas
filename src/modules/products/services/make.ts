"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { assertRecipe, SUPPLY, type MakeDefinition, type MakeLine, type MakeOperation, type SupplyPolicy } from "@/modules/products/domain/make";

const number = (value: unknown, label: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Enter ${label}.`);
  return parsed;
};
const minor = (value: unknown, label: string) => {
  const parsed = number(value, label);
  if (parsed < 0 || parsed > 1_000_000) throw new Error(`${label} must be between 0 and 1,000,000.`);
  return Math.round(parsed * 100);
};

export async function saveProductRecipe(productId: string, input: {
  supply: string;
  batchQuantity: number;
  yieldPercent: number;
  lines: Array<{ componentId: string; quantityPerUnit: number; scrapPercent: number; notes?: string }>;
  operations: Array<{ name: string; workCentre?: string; workCentreId?: string | null; resourceId?: string | null; setupMinutes: number; runMinutesPerUnit: number; crewSize: number; machineRate: number; labourRate: number; overheadRate?: number; logistics: number; machineIncludesLabour: boolean; machineIncludesOverhead?: boolean }>;
  subcontract?: number;
}) {
  const session = await requireSession();
  assertCapability(session, "core.products.manage");
  if (!SUPPLY.includes(input.supply as SupplyPolicy)) throw new Error("Choose make, buy, work in progress or subcontract.");
  const product = await db.product.findFirst({ where: { id: productId, organisationId: session.organisationId, kind: "PRODUCT" } });
  if (!product) throw new Error("Choose a product in this company.");
  const lines: MakeLine[] = (input.lines ?? []).slice(0, 40).map((line) => ({
    componentId: String(line.componentId ?? ""),
    quantityPerUnit: number(line.quantityPerUnit, "a component quantity"),
    scrapPercent: number(line.scrapPercent ?? 0, "scrap"),
    notes: String(line.notes ?? "").trim().slice(0, 240),
  })).filter((line) => line.componentId);
  const operations: MakeOperation[] = (input.operations ?? []).slice(0, 20).map((operation) => ({
    name: String(operation.name ?? "").trim().slice(0, 80),
    setupMinutes: number(operation.setupMinutes ?? 0, "setup time"),
    runMinutesPerUnit: number(operation.runMinutesPerUnit ?? 0, "run time"),
    crewSize: number(operation.crewSize ?? 1, "crew size"),
    machineMinorPerHour: minor(operation.machineRate ?? 0, "Machine rate"),
    labourMinorPerHour: minor(operation.labourRate ?? 0, "Labour rate"),
    logisticsMinorPerBatch: minor(operation.logistics ?? 0, "Logistics"),
    machineIncludesLabour: Boolean(operation.machineIncludesLabour),
    workCentre: String(operation.workCentre ?? "").trim().slice(0, 80),
    workCentreId: String(operation.workCentreId ?? "").trim() || null,
    resourceId: String(operation.resourceId ?? "").trim() || null,
    overheadMinorPerHour: minor(operation.overheadRate ?? 0, "Overhead rate"),
    machineIncludesOverhead: Boolean(operation.machineIncludesOverhead),
  })).filter((operation) => operation.name);
  if (operations.some((operation) => operation.setupMinutes < 0 || operation.runMinutesPerUnit < 0 || operation.crewSize < 0)) throw new Error("Time and crew size cannot be negative.");
  const supply = input.supply as SupplyPolicy;
  const subcontractMinorPerUnit = supply === "SUBCONTRACT" ? minor(input.subcontract ?? 0, "Subcontract price") : 0;
  if ((supply === "MAKE" || supply === "WIP") && !lines.length && !operations.length) throw new Error("Add a component or a step, or mark the product as bought.");
  if (supply === "SUBCONTRACT" && !lines.length && !operations.length && !subcontractMinorPerUnit) throw new Error("Enter the subcontract price, or add a component you still supply.");
  const components = lines.length ? await db.product.findMany({ where: { organisationId: session.organisationId, id: { in: lines.map((line) => line.componentId) }, kind: "PRODUCT" }, select: { id: true, basePriceAmount: true } }) : [];
  if (components.length !== new Set(lines.map((line) => line.componentId)).size) throw new Error("Choose components from this company's products.");
  const centreIds = [...new Set(operations.map((operation) => operation.workCentreId).filter((id): id is string => !!id))];
  const resourceIds = [...new Set(operations.map((operation) => operation.resourceId).filter((id): id is string => !!id))];
  const [centres, machines] = await Promise.all([
    centreIds.length ? db.manufacturingWorkCentre.findMany({ where: { organisationId: session.organisationId, id: { in: centreIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
    resourceIds.length ? db.manufacturingResource.findMany({ where: { organisationId: session.organisationId, id: { in: resourceIds } }, select: { id: true, name: true, workCentreId: true } }) : Promise.resolve([]),
  ]);
  if (centres.length !== centreIds.length || machines.length !== resourceIds.length) throw new Error("Choose a work centre and machine from Manufacturing.");
  const centreName = new Map(centres.map((centre) => [centre.id, centre.name]));
  const machineCentre = new Map(machines.map((machine) => [machine.id, machine.workCentreId]));
  for (const operation of operations) {
    if (operation.resourceId && !operation.workCentreId) throw new Error(`Choose the work centre for ${operation.name}.`);
    if (operation.resourceId && machineCentre.get(operation.resourceId) !== operation.workCentreId) throw new Error(`${operation.name} must use a machine in the work centre you chose.`);
    if (operation.workCentreId) operation.workCentre = centreName.get(operation.workCentreId) ?? operation.workCentre;
  }
  const active = await db.productDefinition.findMany({
    where: { organisationId: session.organisationId, status: "ACTIVE" },
    include: { lines: true, operations: true, product: { select: { basePriceAmount: true } } },
  });
  const catalog = new Map<string, MakeDefinition>();
  for (const row of active) {
    if (row.productId === productId) continue;
    catalog.set(row.productId, {
      productId: row.productId,
      supply: row.supply as SupplyPolicy,
      batchQuantity: Number(row.batchQuantity),
      yieldPercent: Number(row.yieldPercent),
      purchaseMinor: row.product.basePriceAmount,
      lines: row.lines.map((line) => ({ componentId: line.componentProductId, quantityPerUnit: Number(line.quantityPerUnit), scrapPercent: Number(line.scrapPercent), notes: line.notes })),
      operations: row.operations.map((operation) => ({ name: operation.name, setupMinutes: Number(operation.setupMinutes), runMinutesPerUnit: Number(operation.runMinutesPerUnit), crewSize: Number(operation.crewSize), machineMinorPerHour: operation.machineMinorPerHour, labourMinorPerHour: operation.labourMinorPerHour, logisticsMinorPerBatch: operation.logisticsMinorPerBatch, machineIncludesLabour: operation.machineIncludesLabour, workCentre: operation.workCentre, workCentreId: operation.workCentreId, resourceId: operation.resourceId, overheadMinorPerHour: operation.overheadMinorPerHour, machineIncludesOverhead: operation.machineIncludesOverhead })),
    });
  }
  const draft: MakeDefinition = { productId, supply, batchQuantity: number(input.batchQuantity, "a batch size"), yieldPercent: number(input.yieldPercent, "yield"), purchaseMinor: product.basePriceAmount, subcontractMinorPerUnit, lines: supply === "BUY" ? [] : lines, operations: supply === "BUY" ? [] : operations };
  assertRecipe(productId, draft, catalog);
  const previous = await db.productDefinition.findFirst({ where: { organisationId: session.organisationId, productId, status: "ACTIVE" }, select: { version: true } });
  const version = (previous?.version ?? 0) + 1;
  await db.$transaction(async (tx) => {
    await tx.productDefinition.updateMany({ where: { organisationId: session.organisationId, productId, status: "ACTIVE" }, data: { status: "RETIRED" } });
    await tx.productDefinition.create({
      data: {
        organisationId: session.organisationId,
        productId,
        version,
        status: "ACTIVE",
        supply,
        batchQuantity: draft.batchQuantity,
        yieldPercent: draft.yieldPercent,
        subcontractMinorPerUnit,
        createdByUserId: session.userId,
        lines: { create: draft.lines.map((line, index) => ({ organisationId: session.organisationId, componentProductId: line.componentId, quantityPerUnit: line.quantityPerUnit, scrapPercent: line.scrapPercent, notes: line.notes ?? "", position: index })) },
        operations: { create: draft.operations.map((operation, index) => ({ organisationId: session.organisationId, name: operation.name, workCentre: operation.workCentre ?? "", workCentreId: operation.workCentreId || null, resourceId: operation.resourceId || null, position: index, setupMinutes: operation.setupMinutes, runMinutesPerUnit: operation.runMinutesPerUnit, crewSize: operation.crewSize, machineMinorPerHour: operation.machineMinorPerHour, labourMinorPerHour: operation.labourMinorPerHour, overheadMinorPerHour: operation.overheadMinorPerHour ?? 0, logisticsMinorPerBatch: operation.logisticsMinorPerBatch, machineIncludesLabour: operation.machineIncludesLabour, machineIncludesOverhead: operation.machineIncludesOverhead ?? false })) },
      },
    });
  });
  revalidatePath("/products");
  revalidatePath("/stock");
  revalidatePath("/manufacturing/plant");
}
