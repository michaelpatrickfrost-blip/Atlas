"use server";

import { db } from "@/core/db/client";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeActivity } from "@/core/activity/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { getModule } from "@/core/modules/registry";
import { OPEN_PRODUCTION_ORDER_STATUSES } from "../domain/lifecycle";
import { nextOrderNumber } from "./numbers";
import { totalLeadTimeMinutes } from "../domain/scheduling";
import { readAvailability } from "@/modules/stock/services/availability";
import { readSuggestionDetail } from "./mrp-queries";

/** One demand line pegged by a suggestion (§37). Stored as JSON so it survives
 * edits to the underlying sales order line or forecast row. */
type PegLine = { sourceType: "SALES_ORDER" | "FORECAST" | "SAFETY_STOCK"; sourceId: string; label: string; quantity: number };

async function stockProvider() {
  const provider = getModule("stock")?.stockProvider;
  if (!provider) throw new Error("Inventory is not available — cannot run MRP without it.");
  return provider;
}

/** Net open firm demand plus the unconsumed balance of approved S&OP totals.
 * Closed and part-shipped bookings consume the whole-month forecast without
 * re-entering the outstanding requirement. Routing computes the start-by date. */
export async function runMrp() {
  const session = await requireSession();
  assertCapability(session, C.planManage);
  await assertModuleEnabled(session, "manufacturing");
  assertCapability(session, "sales.order.read");
  assertCapability(session, "customers.read");
  const organisationId = session.organisationId;
  const periodStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const startedAt = new Date();
  const warnings: string[] = [];

  const [demandLines, forecastRows] = await Promise.all([
    db.salesOrderLine.findMany({
      where: {
        order: { organisationId, commercialStatus: { in: ["CONFIRMED", "ON_HOLD", "CLOSED"] }, orderType: { notIn: ["BLANKET", "INTERNAL"] } },
        productId: { not: null },
      },
      include: { order: { select: { reference: true, commercialStatus: true, requestedDeliveryDate: true, promisedDeliveryDate: true, partyId: true, party: { select: { name: true } } } }, product: { select: { id: true, name: true, definitions: { where: { status: "ACTIVE" }, take: 1, orderBy: { version: "desc" } } } } },
      take: 5001,
    }),
    db.manufacturingDemandForecast.findMany({
      where: { organisationId, periodStart: { gte: periodStart } },
      include: { product: { select: { id: true, name: true, definitions: { where: { status: "ACTIVE" }, take: 1, orderBy: { version: "desc" } } } } },
      take: 5001,
    }),
  ]);
  if (demandLines.length > 5000 || forecastRows.length > 5000) throw new Error("MRP source scope exceeds 5,000 rows. Narrow the demand before running MRP.");

  const chain = await readAvailability();
  const shippedRows = await db.fulfilmentLine.groupBy({ by: ["salesOrderLineId"], where: { organisationId, salesOrderLineId: { in: demandLines.map(line => line.id) } }, _sum: { shippedQuantity: true } });
  const shipped = new Map(shippedRows.map(row => [row.salesOrderLineId, Number(row._sum.shippedQuantity ?? 0)]));
  const bookedByMonth = new Map<string, number>();
  for (const line of demandLines) {
    const due = line.requestedDeliveryDate ?? line.order.requestedDeliveryDate ?? line.promisedDeliveryDate ?? line.order.promisedDeliveryDate;
    if (!due || !line.productId || line.order.commercialStatus === "CLOSED" && due < periodStart) continue;
    const key = `${line.productId}|${(due < periodStart ? periodStart : due).toISOString().slice(0, 7)}`;
    bookedByMonth.set(key, (bookedByMonth.get(key) ?? 0) + Math.max(0, line.orderedQuantity - line.cancelledQuantity));
  }
  const manufacturable = demandLines.filter((line) => line.productId && line.product?.definitions.length);
  const manufacturableForecast = forecastRows.filter((row) => row.product.definitions.length);
  if ((demandLines.length || forecastRows.length) && !manufacturable.length && !manufacturableForecast.length) warnings.push("Demand exists, but none of those products have an active BOM/routing yet.");

  const byProduct = new Map<string, { productId: string; pegs: PegLine[]; demandQuantity: number; definitionId: string; earliestDemand: Date | null }>();
  for (const line of manufacturable) {
    const key = line.productId!;
    const entry = byProduct.get(key) ?? { productId: key, pegs: [], demandQuantity: 0, definitionId: line.product!.definitions[0].id, earliestDemand: null };
    const outstanding = line.order.commercialStatus === "CLOSED" ? 0 : Math.max(0, line.orderedQuantity - line.cancelledQuantity - (shipped.get(line.id) ?? 0));
    if (outstanding <= 0) continue;
    const due = line.requestedDeliveryDate ?? line.order.requestedDeliveryDate ?? line.promisedDeliveryDate ?? line.order.promisedDeliveryDate ?? null;
    entry.demandQuantity += outstanding;
    entry.pegs.push({ sourceType: "SALES_ORDER", sourceId: line.id, label: `${line.order.reference} · ${line.order.party.name}`, quantity: outstanding });
    if (due && (!entry.earliestDemand || due < entry.earliestDemand)) entry.earliestDemand = due;
    byProduct.set(key, entry);
  }
  for (const row of manufacturableForecast) {
    const key = row.productId;
    const entry = byProduct.get(key) ?? { productId: key, pegs: [], demandQuantity: 0, definitionId: row.product.definitions[0].id, earliestDemand: null };
    const quantity = row.sourceSopVersionId ? Math.max(0, Number(row.quantity) - (bookedByMonth.get(`${key}|${row.periodStart.toISOString().slice(0, 7)}`) ?? 0)) : Number(row.quantity);
    if (quantity <= 0) continue;
    entry.demandQuantity += quantity;
    entry.pegs.push({ sourceType: "FORECAST", sourceId: row.id, label: `Forecast · ${row.periodStart.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`, quantity });
    if (!entry.earliestDemand || row.periodStart < entry.earliestDemand) entry.earliestDemand = row.periodStart;
    byProduct.set(key, entry);
  }

  const stock = await stockProvider();
  const pictures = new Map(chain.products.map((row) => [row.productId, row]));
  const openSupply = await db.manufacturingOrder.groupBy({
    by: ["productId"],
    where: { organisationId, status: { in: OPEN_PRODUCTION_ORDER_STATUSES } },
    _sum: { quantity: true },
  });
  const openSupplyByProduct = new Map(openSupply.map((row) => [row.productId, Number(row._sum.quantity ?? 0)]));

  const run = await db.manufacturingPlanningRun.create({
    data: { organisationId, triggeredByUserId: session.userId, productCount: byProduct.size, warnings },
  });

  let suggestionCount = 0;
  for (const entry of byProduct.values()) {
    const availability = await stock.getAvailability({ organisationId, userId: session.userId }, { productId: entry.productId });
    const picture = pictures.get(entry.productId);
    const free = picture ? Math.max(0, picture.onHand - picture.held) : availability.available;
    const supply = picture?.incoming ?? openSupplyByProduct.get(entry.productId) ?? 0;
    const net = entry.demandQuantity - free - supply;
    if (net <= 0) continue;
    const neededBy = entry.earliestDemand;
    const startBy = await suggestedStartDate(entry.definitionId, net, neededBy);
    await db.manufacturingSupplySuggestion.create({
      data: {
        organisationId,
        runId: run.id,
        kind: "MAKE",
        productId: entry.productId,
        quantity: net,
        neededBy,
        startBy,
        pegging: entry.pegs as never,
      },
    });
    suggestionCount += 1;
  }

  await db.manufacturingPlanningRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), suggestionCount } });
  await writeActivity({ organisationId, type: "manufacturing.plan.generated", summary: `MRP run found ${suggestionCount} shortage${suggestionCount === 1 ? "" : "s"}`, entityType: "ManufacturingPlanningRun", entityId: run.id });
  return { runId: run.id, suggestionCount, durationMs: Date.now() - startedAt.getTime(), warnings };
}

/** §9, §46: "when do we need to start" — the customer/forecast date minus the
 * product's actual manufacturing lead time, computed from its live routing at
 * the suggested quantity (not a separate static lead-time field that could
 * silently drift from the real routing). */
async function suggestedStartDate(definitionId: string, quantity: number, neededBy: Date | null): Promise<Date | null> {
  if (!neededBy) return null;
  const operations = await db.productOperation.findMany({ where: { definitionId } });
  if (!operations.length) return neededBy;
  const leadMinutes = totalLeadTimeMinutes(operations.map((op) => ({ setupMinutes: Number(op.setupMinutes), runMinutesPerUnit: Number(op.runMinutesPerUnit) })), quantity);
  return new Date(neededBy.getTime() - leadMinutes * 60_000);
}

/** §41, §157: firm a MAKE suggestion into a real, explainable Production Order.
 * Pegs the resulting order to the single largest demand line when one dominates,
 * so the order detail page can still show "why" even though a suggestion can
 * cover several sales orders at once. */
export async function firmSuggestion(suggestionId: string) {
  const session = await requireSession();
  assertCapability(session, C.planFirm);
  await assertModuleEnabled(session, "manufacturing");
  return db.$transaction(async (tx) => {
    const organisationId = session.organisationId;
    const suggestion = await tx.manufacturingSupplySuggestion.findFirst({ where: { id: suggestionId, organisationId } });
    if (!suggestion || suggestion.kind !== "MAKE") throw new Error("Choose an available Make proposal. Buy proposals go to Procurement.");
    if (suggestion.status === "FIRMED" && suggestion.resultingOrderId) {
      return tx.manufacturingOrder.findFirstOrThrow({ where: { id: suggestion.resultingOrderId, organisationId } });
    }
    if (suggestion.status !== "PENDING") throw new Error("This proposal has already been actioned.");
    const latest = await tx.manufacturingPlanningRun.findFirst({ where: { organisationId, finishedAt: { not: null } }, orderBy: { startedAt: "desc" }, select: { id: true } });
    if (latest?.id !== suggestion.runId) throw new Error("A newer material plan exists. Review its proposals before firming.");
    const detail = readSuggestionDetail(suggestion.pegging);
    const pegs = detail.demand;
    const largestPeg = pegs.slice().sort((a, b) => b.quantity - a.quantity)[0];
    const short = detail.materials.filter((row) => row.shortage > 0);
    const product = await tx.product.findFirst({ where: { id: suggestion.productId, organisationId, active: true }, include: { definitions: { where: { status: "ACTIVE" }, take: 1, orderBy: { version: "desc" } } } });
    if (!product?.definitions[0]) throw new Error("Review the active product recipe before creating production.");
    const claimed = await tx.manufacturingSupplySuggestion.updateMany({ where: { id: suggestion.id, organisationId, status: "PENDING", updatedAt: suggestion.updatedAt }, data: { status: "FIRMED" } });
    if (claimed.count !== 1) throw new Error("This proposal changed or has already been firmed.");
    const orderNumber = await nextOrderNumber(tx, organisationId);
    const order = await tx.manufacturingOrder.create({ data: {
      organisationId, orderNumber, productId: product.id, definitionId: product.definitions[0].id,
      quantity: suggestion.quantity, unitOfMeasure: product.unitOfMeasure, requiredDate: suggestion.neededBy,
      priority: suggestion.startBy && suggestion.startBy < new Date() ? 10 : 0,
      sourceSalesOrderLineId: largestPeg && ["SALES_ORDER", "FIRM"].includes(largestPeg.sourceType) ? largestPeg.sourceId : null,
      notes: `Firmed from MRP run ${suggestion.runId}. ${pegs.length} source demand link(s) retained on the proposal.${short.length ? ` ${short.length} component shortage(s) need review before release.` : ""}`,
      createdByUserId: session.userId,
    } });
    await tx.manufacturingSupplySuggestion.updateMany({ where: { id: suggestion.id, organisationId, status: "FIRMED" }, data: { resultingOrderId: order.id } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "manufacturing.order.firmed", entityType: "ManufacturingOrder", entityId: order.id, after: { orderNumber, fromSuggestion: suggestion.id } } });
    await tx.activity.create({ data: { organisationId, type: "manufacturing.order.firmed", summary: `${orderNumber} firmed from the plan`, entityType: "ManufacturingOrder", entityId: order.id } });
    return order;
  }, { isolationLevel: "Serializable" });
}

export async function dismissSuggestion(suggestionId: string) {
  const session = await requireSession();
  assertCapability(session, C.planManage);
  await assertModuleEnabled(session, "manufacturing");
  const updated = await db.manufacturingSupplySuggestion.updateMany({ where: { id: suggestionId, organisationId: session.organisationId, status: "PENDING" }, data: { status: "DISMISSED" } });
  if (!updated.count) throw new Error("This suggestion is no longer pending.");
}

export async function latestPlan(organisationId: string) {
  const run = await db.manufacturingPlanningRun.findFirst({ where: { organisationId, finishedAt: { not: null } }, orderBy: { startedAt: "desc" } });
  if (!run) return { run: null, suggestions: [] };
  const suggestions = await db.manufacturingSupplySuggestion.findMany({
    where: { runId: run.id, status: "PENDING" },
    include: { product: { select: { name: true, code: true } } },
    orderBy: [{ neededBy: "asc" }],
  });
  return {
    run,
    suggestions: suggestions.map((s) => ({
      id: s.id,
      kind: s.kind,
      productId: s.productId,
      product: s.product.name,
      productCode: s.product.code,
      quantity: Number(s.quantity),
      neededBy: s.neededBy,
      startBy: s.startBy,
      overdueToStart: Boolean(s.startBy && s.startBy < new Date()),
      pegging: (s.pegging as unknown as PegLine[]) ?? [],
    })),
  };
}
