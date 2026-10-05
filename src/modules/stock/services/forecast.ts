import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { forecastStock, type Forecast } from "../domain/forecast";
import { readAvailability } from "./availability";

/** Usage is what left stock: sales, production and manual issues. Moves between
 * places and count corrections are not usage. */
export const USAGE_WINDOW_DAYS = 90;
const NOT_USAGE = ["Transfer out", "In transit", "Stock count"];

export type ForecastRow = Forecast & {
  id: string;
  code: string;
  name: string;
  unit: string;
  onHand: number;
  available: number;
  incoming: number;
  openDemand: number;
  monthlyUsage: number | null;
  leadTimeDays: number;
  safetyStock: number;
  /** MAKE, WIP, SUBCONTRACT or BUY, from the active recipe. */
  supply: string;
  definitionId: string | null;
  /** Components still needed by open production orders. Already taken off available. */
  productionNeed: number;
};

export async function readStockForecast(productId?: string): Promise<ForecastRow[]> {
  const session = await requireSession();
  assertCapability(session, "stock.read");
  await assertModuleEnabled(session, "stock");
  const organisationId = session.organisationId;
  const today = new Date();
  const since = new Date(today.getTime() - USAGE_WINDOW_DAYS * 86_400_000);
  const month = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  const [products, used, picture, planned, definitions, orders] = await Promise.all([
    db.product.findMany({
      where: { organisationId, kind: "PRODUCT", active: true, ...(productId ? { id: productId } : {}) },
      select: { id: true, code: true, name: true, unitOfMeasure: true, safetyStockLevel: true, leadTimeDays: true, monthlyUsage: true },
      orderBy: { name: "asc" },
    }),
    db.inventoryMovement.groupBy({
      by: ["productId"],
      where: { organisationId, delta: { lt: 0 }, createdAt: { gte: since }, NOT: NOT_USAGE.map((prefix) => ({ reason: { startsWith: prefix } })), ...(productId ? { productId } : {}) },
      _sum: { delta: true },
      _min: { createdAt: true },
    }),
    readAvailability(),
    db.manufacturingDemandForecast.findMany({ where: { organisationId, periodStart: month }, select: { productId: true, quantity: true } }),
    db.productDefinition.findMany({ where: { organisationId, status: "ACTIVE" }, select: { id: true, productId: true, supply: true, lines: { select: { componentProductId: true, quantityPerUnit: true, scrapPercent: true } } } }),
    db.manufacturingOrder.findMany({ where: { organisationId, status: { in: ["PLANNED", "READY", "RELEASED", "RUNNING"] } }, select: { productId: true, definitionId: true, quantity: true } }),
  ]);
  const planMonth = new Map(planned.map((row) => [row.productId, Number(row.quantity)]));
  const recipe = new Map(definitions.map((row) => [row.productId, row]));
  const recipeById = new Map(definitions.map((row) => [row.id, row]));
  const productionNeed = new Map<string, number>();
  for (const order of orders) {
    const lines = (order.definitionId ? recipeById.get(order.definitionId) : recipe.get(order.productId))?.lines ?? [];
    for (const line of lines) productionNeed.set(line.componentProductId, (productionNeed.get(line.componentProductId) ?? 0) + Number(order.quantity) * Number(line.quantityPerUnit) * (1 + Number(line.scrapPercent) / 100));
  }
  const usage = new Map(used.map((row) => [row.productId, row]));
  const available = new Map(picture.products.map((row) => [row.productId, row]));
  return products.map((product) => {
    const ledger = usage.get(product.id);
    const first = ledger?._min.createdAt;
    const windowDays = first ? Math.min(USAGE_WINDOW_DAYS, Math.max(14, Math.ceil((today.getTime() - first.getTime()) / 86_400_000))) : USAGE_WINDOW_DAYS;
    const stock = available.get(product.id);
    const need = Math.ceil(productionNeed.get(product.id) ?? 0);
    const input = { available: (stock?.available ?? 0) - need, planMonth: planMonth.get(product.id) ?? null, usedInWindow: -(ledger?._sum.delta ?? 0), windowDays, monthlyUsage: product.monthlyUsage, leadTimeDays: product.leadTimeDays, safetyStock: product.safetyStockLevel };
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      unit: product.unitOfMeasure,
      onHand: stock?.onHand ?? 0,
      available: input.available,
      incoming: stock?.incoming ?? 0,
      openDemand: stock?.openDemand ?? 0,
      monthlyUsage: product.monthlyUsage,
      leadTimeDays: product.leadTimeDays,
      safetyStock: product.safetyStockLevel,
      supply: recipe.get(product.id)?.supply ?? "BUY",
      definitionId: recipe.get(product.id)?.id ?? null,
      productionNeed: need,
      ...forecastStock(input, today),
    };
  });
}
