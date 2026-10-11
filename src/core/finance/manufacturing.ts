import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import type { LogisticsActor } from "@/core/logistics/types";

export type StockCostMovement = { movementId: string; warehouseId: string; productId: string; quantity: number; productionOrderId?: string; workOrderId?: string; shipmentId?: string };
export type StockCostTransfer = { productId: string; quantity: number; fromWarehouseId: string; toWarehouseId: string; outMovementId: string; inMovementId: string };
export type ProductionCostReport = { workOrderId: string; productionOrderId: string; warehouseId: string; productId: string; receiptMovementId?: string; newMaterialMovementIds: string[]; goodQuantity: number; scrapQuantity: number; remainingBefore: number; finish: boolean; requestKey: string };
export type LoadCostMember = { warehouseId:string|null; costBasisCaptured:boolean; definitionId:string|null; machineMinorPerHour:number; labourMinorPerHour:number; overheadMinorPerHour:number; machineIncludesLabour:boolean; machineIncludesOverhead:boolean };
export type MaterialCostBasis = { productId: string; amountMinor: number; quantity: number; currency: string; source: "CARRYING_VALUE" | "APPROVED_PURCHASE" };
export type ManufacturingCostProvider = {
  materialCosts: (session: Session) => Promise<MaterialCostBasis[]>;
  validateLoad:(organisationId:string,tx:Prisma.TransactionClient,members:LoadCostMember[])=>Promise<void>;
  view: (session: Session, productionOrderId: string) => Promise<{ configured: boolean; currency: string; wip: string; materials: string; usage: string; finished: string; scrap: string }>;
  validateRelease: (session: Session, tx: Prisma.TransactionClient, warehouseId: string, definitionId: string) => Promise<void>;
  consume: (actor: LogisticsActor, tx: Prisma.TransactionClient, input: StockCostMovement) => Promise<void>;
  transfer: (actor: LogisticsActor, tx: Prisma.TransactionClient, input: StockCostTransfer) => Promise<void>;
  settle: (session: Session, tx: Prisma.TransactionClient, input: ProductionCostReport) => Promise<void>;
};
export async function costStockConsumption(actor: LogisticsActor, tx: Prisma.TransactionClient, input: StockCostMovement) {
  const { getEnabledModuleIds } = await import("@/core/modules/runtime");
  const { getModule } = await import("@/core/modules/registry");
  if (!(await getEnabledModuleIds(actor.organisationId)).has("finance")) return;
  await getModule("finance")?.manufacturingCostProvider?.consume(actor, tx, input);
}
export async function settleProductionCost(session: Session, tx: Prisma.TransactionClient, input: ProductionCostReport) {
  const { getEnabledModuleIds } = await import("@/core/modules/runtime");
  const { getModule } = await import("@/core/modules/registry");
  if (!(await getEnabledModuleIds(session.organisationId)).has("finance")) return;
  await getModule("finance")?.manufacturingCostProvider?.settle(session, tx, input);
}

export async function validateProductionCostRelease(session: Session, tx: Prisma.TransactionClient, warehouseId: string, definitionId: string) {
 const { getEnabledModuleIds } = await import("@/core/modules/runtime");
 const { getModule } = await import("@/core/modules/registry");
 if (!(await getEnabledModuleIds(session.organisationId)).has("finance")) return;
 await getModule("finance")?.manufacturingCostProvider?.validateRelease(session, tx, warehouseId, definitionId);
}

export async function productionCostProjection(session: Session, productionOrderId: string) {
 const { getEnabledModuleIds } = await import("@/core/modules/runtime");
 const { getModule } = await import("@/core/modules/registry");
 if (!session.capabilities.has("manufacturing.cost.read") || !session.capabilities.has("finance.ledger.read") || !(await getEnabledModuleIds(session.organisationId)).has("finance")) return null;
 return await getModule("finance")?.manufacturingCostProvider?.view(session, productionOrderId) ?? null;
}

export async function costStockTransfer(actor: LogisticsActor, tx: Prisma.TransactionClient, input: StockCostTransfer) {
  const { getEnabledModuleIds } = await import("@/core/modules/runtime");
  const { getModule } = await import("@/core/modules/registry");
  if (!(await getEnabledModuleIds(actor.organisationId)).has("finance")) return;
  await getModule("finance")?.manufacturingCostProvider?.transfer(actor, tx, input);
}

export async function validateMachineLoadCost(organisationId:string,tx:Prisma.TransactionClient,members:LoadCostMember[]){
 const { getEnabledModuleIds }=await import("@/core/modules/runtime");const { getModule }=await import("@/core/modules/registry");
 if(!(await getEnabledModuleIds(organisationId)).has("finance"))return;
 await getModule("finance")?.manufacturingCostProvider?.validateLoad(organisationId,tx,members);
}

export async function materialCostBasis(session: Session) {
  const { getEnabledModuleIds } = await import("@/core/modules/runtime");
  const { getModule } = await import("@/core/modules/registry");
  if (!session.capabilities.has("manufacturing.cost.read") || !session.capabilities.has("finance.ledger.read") || !(await getEnabledModuleIds(session.organisationId)).has("finance")) return [];
  return await getModule("finance")?.manufacturingCostProvider?.materialCosts(session) ?? [];
}
