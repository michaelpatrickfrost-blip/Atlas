import { settleProductionCost } from "@/core/finance/manufacturing";
import { componentQuantity } from "@/core/shared/measurement";
import { roundedQuantity, addQuantity } from "@/core/shared/quantity";
import type { Prisma } from "@/generated/prisma/client";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import type { Session } from "@/core/auth/session";
import { getModule } from "@/core/modules/registry";

function stockQuantity(value: number, what: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${what} must be a valid stock quantity.`);
  return roundedQuantity(value);
}

function key(...parts: string[]) {
  const value = parts.join(":");
  if (value.length > 120) throw new Error("This production request reference is too long. Reload and try again.");
  return value;
}

/** The production order's warehouse; picks and records the first warehouse when none was set. */
async function productionWarehouse(db: Prisma.TransactionClient, organisationId: string, order: { id: string; warehouseId: string | null }) {
  if (order.warehouseId) {
    await db.warehouse.findFirstOrThrow({ where: { id: order.warehouseId, organisationId } });
    return order.warehouseId;
  }
  const warehouse = await db.warehouse.findFirst({ where: { organisationId, kind: "WAREHOUSE" }, orderBy: { code: "asc" }, select: { id: true } });
  if (!warehouse) throw new Error("Create a warehouse in Inventory before reporting production.");
  await db.manufacturingOrder.updateMany({ where: { id: order.id, organisationId, warehouseId: null }, data: { warehouseId: warehouse.id } });
  return warehouse.id;
}

/**
 * Completing the last routing step books finished goods into blocked production holding and uses up the bill-of-materials
 * components for the good quantity plus all scrap reported on the order. Stock moves first and every move
 * has a repeat-safe key. Every move uses the completion transaction, so failure
 * leaves stock and completion unchanged. Warehouse collection makes output available and triggers replenishment after its own commit.
 */
export async function backflushOnCompletion(
  session: Session,
  workOrder: { id: string; productionOrderId: string; sequence: number; producedQuantity: number; scrapQuantity: number },
  goodQuantity: number,
  scrapQuantity: number,
  requestKey: string,
  db: Prisma.TransactionClient,
  trace: { reportId?: string; lotCode: string; serials: string[]; finish?: boolean; remainingBefore?: number },
) {
  const organisationId = session.organisationId;
  const later = await db.manufacturingWorkOrder.count({ where: { organisationId, productionOrderId: workOrder.productionOrderId, sequence: { gt: workOrder.sequence } } });
  if (later > 0) return;

  const order = await db.manufacturingOrder.findFirstOrThrow({ where: { id: workOrder.productionOrderId, organisationId } });
  const provider = getModule("stock")?.stockProvider;
  if (!provider || !(await getEnabledModuleIds(organisationId)).has("stock")) throw new Error("Turn on the Inventory app so production can update stock.");

  const unfinished = await db.manufacturingWorkOrder.count({ where: { organisationId, productionOrderId: order.id, id: { not: workOrder.id }, status: { not: "COMPLETE" } } });
  if (unfinished) throw new Error("Complete the other routing steps before reporting finished goods.");
  const earlierScrap = await db.manufacturingWorkOrder.aggregate({
    where: { organisationId, productionOrderId: order.id, id: { not: workOrder.id } },
    _sum: { scrapQuantity: true },
  });
  const totalScrap = addQuantity(Number(earlierScrap._sum.scrapQuantity ?? 0), workOrder.scrapQuantity);
  const good = stockQuantity(goodQuantity, "Good quantity");
  if (addQuantity(workOrder.producedQuantity, totalScrap) > Number(order.quantity)) throw new Error("Good and scrap quantities exceed the planned production quantity.");
  const warehouseId = await productionWarehouse(db, organisationId, order);

  const issued = await db.inventoryMovement.groupBy({ by: ["productId"], where: { organisationId, manufacturingOrderId: order.id, delta: { lt: 0 } }, _sum: { delta: true } });
  const alreadyUsed = new Map(issued.map(row => [row.productId, Math.abs(Number(row._sum.delta ?? 0))]));
  const lines = order.definitionId ? await db.productBomLine.findMany({ where: { organisationId, definitionId: order.definitionId }, orderBy: { position: "asc" } }) : [];
  const materialMovementIds: string[] = [];
  for (const line of lines) {
    const target = componentQuantity(addQuantity(workOrder.producedQuantity, totalScrap), Number(line.quantityPerUnit), Number(line.scrapPercent));
    const quantity = stockQuantity(Math.max(0, addQuantity(target, -(alreadyUsed.get(line.componentProductId) ?? 0))), "Component consumption");
    if (quantity > 0) {
    const movement = await provider.shipStock(session, {
      requestKey: key("mfg", workOrder.id, requestKey, "use", line.id),
      productId: line.componentProductId,
      warehouseId,
      quantity,
      lotCode: null,
      serials: [],
      reason: `Used in ${order.orderNumber}`,
      reference: order.orderNumber,
      productionReportId: trace.reportId,
      manufacturingOrderId: order.id,
      workOrderId: workOrder.id,
    }, db);
    materialMovementIds.push(...movement.movementIds);
    }
    if (trace.reportId) {
      const previousTotal = addQuantity(workOrder.producedQuantity, -good, workOrder.scrapQuantity, -scrapQuantity);
      const previousTarget = previousTotal > 0 ? componentQuantity(addQuantity(previousTotal, Number(earlierScrap._sum.scrapQuantity ?? 0)), Number(line.quantityPerUnit), Number(line.scrapPercent)) : 0;
      let toLink = Math.max(0, addQuantity(target, -previousTarget));
      const allocations = await db.stockMovementAllocation.findMany({ where: { organisationId, productId: line.componentProductId, direction: "OUT", movement: { organisationId, manufacturingOrderId: order.id } }, include: { materialUses: { select: { quantity: true } } }, orderBy: [{ movement: { createdAt: "asc" } }, { id: "asc" }] });
      if (trace.finish !== false) toLink = Math.max(toLink, allocations.reduce((sum, allocation) => addQuantity(sum, Math.max(0, addQuantity(Number(allocation.quantity), -allocation.materialUses.reduce((used, row) => addQuantity(used, Number(row.quantity)), 0)))), 0));
      for (const allocation of allocations) {
        if (!toLink) break;
        const unused = addQuantity(Number(allocation.quantity), -allocation.materialUses.reduce((sum, row) => addQuantity(sum, Number(row.quantity)), 0));
        const take = Math.min(Math.max(0, unused), toLink);
        if (take) await db.manufacturingMaterialUse.create({ data: { organisationId, reportId: trace.reportId, stockAllocationId: allocation.id, componentProductId: line.componentProductId, quantity: take } });
        toLink = addQuantity(toLink, -take);
      }
      if (toLink) await db.manufacturingMaterialUse.create({ data: { organisationId, reportId: trace.reportId, componentProductId: line.componentProductId, quantity: toLink } });
    }
  }

  let receiptMovementId: string | undefined;
  if (good > 0) {
    const receipt = await provider.stageProduction(session, {
      requestKey: key("mfg", workOrder.id, requestKey, "made"),
      productId: order.productId,
      warehouseId,
      quantity: good,
      lotCode: trace.lotCode,
      serials: trace.serials,
      status: "BLOCKED",
      reason: `Production holding area · ${order.orderNumber}`,
      reference: order.orderNumber,
      productionReportId: trace.reportId,
      manufacturingOrderId: order.id,
      workOrderId: workOrder.id,
    }, db);
    receiptMovementId = receipt.movementIds[0];
  }
  await settleProductionCost(session, db, { productionOrderId: order.id, workOrderId: workOrder.id, warehouseId, productId: order.productId, reportId: trace.reportId, receiptMovementId, newMaterialMovementIds: materialMovementIds, goodQuantity: good, scrapQuantity, remainingBefore: trace.remainingBefore ?? Number(order.quantity), finish: trace.finish !== false, requestKey });
  return { productId: order.productId, warehouseId, requestKey: `balance:${key("mfg", workOrder.id, requestKey, "made")}`, staged:true };
}
