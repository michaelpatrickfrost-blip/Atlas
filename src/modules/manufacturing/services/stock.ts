import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { getModule } from "@/core/modules/registry";

function wholeUnits(value: number, what: string) {
  if (!Number.isInteger(value)) throw new Error(`${what} must be a whole number of units because stock is counted in whole units.`);
  return value;
}

function key(...parts: string[]) {
  return parts.join(":").slice(0, 120);
}

/** The production order's warehouse; picks and records the first warehouse when none was set. */
async function productionWarehouse(organisationId: string, order: { id: string; warehouseId: string | null }) {
  if (order.warehouseId) return order.warehouseId;
  const warehouse = await db.warehouse.findFirst({ where: { organisationId, kind: "WAREHOUSE" }, orderBy: { code: "asc" }, select: { id: true } });
  if (!warehouse) throw new Error("Create a warehouse in Inventory before reporting production.");
  await db.manufacturingOrder.updateMany({ where: { id: order.id, organisationId, warehouseId: null }, data: { warehouseId: warehouse.id } });
  return warehouse.id;
}

/**
 * Completing the last routing step books the finished goods into stock and uses up the bill-of-materials
 * components for the good quantity plus all scrap reported on the order. Stock moves first and every move
 * has a repeat-safe key, so a retried completion never double-counts.
 */
export async function backflushOnCompletion(
  session: Session,
  workOrder: { id: string; productionOrderId: string; sequence: number },
  goodQuantity: number,
  scrapQuantity: number,
  requestKey: string,
) {
  const organisationId = session.organisationId;
  const later = await db.manufacturingWorkOrder.count({ where: { organisationId, productionOrderId: workOrder.productionOrderId, sequence: { gt: workOrder.sequence } } });
  if (later > 0) return;

  const order = await db.manufacturingOrder.findFirstOrThrow({ where: { id: workOrder.productionOrderId, organisationId } });
  const provider = getModule("stock")?.stockProvider;
  if (!provider) throw new Error("Turn on the Inventory app so production can update stock.");

  const earlierScrap = await db.manufacturingWorkOrder.aggregate({
    where: { organisationId, productionOrderId: order.id, id: { not: workOrder.id } },
    _sum: { scrapQuantity: true },
  });
  const totalScrap = Number(earlierScrap._sum.scrapQuantity ?? 0) + scrapQuantity;
  const good = wholeUnits(goodQuantity, "Good quantity");
  const warehouseId = await productionWarehouse(organisationId, order);

  const lines = order.definitionId ? await db.productBomLine.findMany({ where: { organisationId, definitionId: order.definitionId } }) : [];
  for (const line of lines) {
    const quantity = Math.ceil((good + totalScrap) * Number(line.quantityPerUnit) * (1 + Number(line.scrapPercent) / 100));
    if (quantity <= 0) continue;
    await provider.shipStock(session, {
      requestKey: key("mfg", workOrder.id, requestKey, "use", line.id),
      productId: line.componentProductId,
      warehouseId,
      quantity,
      lotCode: null,
      serials: [],
      reason: `Used in ${order.orderNumber}`,
      reference: order.orderNumber,
      manufacturingOrderId: order.id,
      workOrderId: workOrder.id,
    });
  }

  if (good > 0) {
    await provider.receiveStock(session, {
      requestKey: key("mfg", workOrder.id, requestKey, "made"),
      productId: order.productId,
      warehouseId,
      quantity: good,
      lotCode: null,
      serials: [],
      status: "AVAILABLE",
      reason: `Produced · ${order.orderNumber}`,
      reference: order.orderNumber,
      manufacturingOrderId: order.id,
      workOrderId: workOrder.id,
    });
  }
}
