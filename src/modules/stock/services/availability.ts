"use server";

import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { availabilityPicture, type AvailabilityPicture } from "@/core/availability/picture";
import { incomingArrivals, type SupplyArrival } from "@/core/availability/stock-promise";
import type { ManufacturingOrderStatus } from "@/generated/prisma/client";

const READ = ["stock.read", "planning.demand.read", "sales.order.read", "sales.quote.read", "manufacturing.order.read", "manufacturing.plan.read", "logistics.fulfilment.read"];
/** Open shop-floor orders. Matches manufacturing OPEN_PRODUCTION_ORDER_STATUSES. */
const OPEN_PRODUCTION: ManufacturingOrderStatus[] = ["PLANNED", "READY", "RELEASED", "RUNNING"];

export type ProductAvailability = AvailabilityPicture & { productId: string };
export type CommercialPicture = { products: ProductAvailability[]; deliveredByLine: Record<string, number>; arrivals: Record<string, SupplyArrival[]> };

type Bucket = {
  onHand: number;
  reserved: number;
  held: number;
  ordered: number;
  delivered: number;
  allocated: number;
  shipped: number;
  invoiced: number;
  planned: number;
  inProduction: number;
};

const empty = (): Bucket => ({ onHand: 0, reserved: 0, held: 0, ordered: 0, delivered: 0, allocated: 0, shipped: 0, invoiced: 0, planned: 0, inProduction: 0 });

async function optional<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await query;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2021" || code === "P2022") return fallback;
    throw error;
  }
}

function sameUnit(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export async function readAvailability(): Promise<CommercialPicture> {
  const session = await requireSession();
  if (!READ.some((capability) => session.capabilities.has(capability))) throw new Error('FORBIDDEN: missing capability "stock.read"');
  const organisationId = session.organisationId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [products, balances, reservations, positions, salesLines, fulfilment, invoices, plans, production, receipts] = await Promise.all([
    db.product.findMany({ where: { organisationId }, select: { id: true, unitOfMeasure: true } }),
    db.inventoryBalance.findMany({ where: { organisationId }, select: { productId: true, quantity: true } }),
    optional(db.stockReservation.findMany({ where: { organisationId, status: "ACTIVE" }, select: { productId: true, quantity: true } }), []),
    optional(db.stockPosition.findMany({ where: { organisationId, status: { in: ["QUARANTINE", "BLOCKED"] } }, select: { productId: true, quantity: true } }), []),
    db.salesOrderLine.findMany({
      where: { type: "PRODUCT", productId: { not: null }, order: { organisationId, commercialStatus: "CONFIRMED", orderType: { not: "BLANKET" } } },
      select: { id: true, productId: true, orderedQuantity: true, cancelledQuantity: true, unitOfMeasure: true },
    }),
    optional(db.fulfilmentLine.findMany({
      where: { organisationId },
      select: { productId: true, salesOrderLineId: true, allocatedQuantity: true, shippedQuantity: true, deliveredQuantity: true },
    }), []),
    optional(db.financeDocumentLine.findMany({
      where: { organisationId, productId: { not: null }, document: { organisationId, kind: { in: ["AR_INVOICE", "AR_CREDIT"] }, status: { not: "CANCELLED" } } },
      select: { productId: true, quantity: true, document: { select: { kind: true } } },
    }), []),
    optional(db.productionPlanLine.findMany({ where: { organisationId, endsOn: { gte: today } }, select: { productId: true, quantity: true, endsOn: true } }), []),
    optional(db.manufacturingOrder.findMany({ where: { organisationId, status: { in: OPEN_PRODUCTION } }, select: { productId: true, quantity: true, plannedFinish: true, requiredDate: true } }), []),
    optional(db.receiptLine.findMany({
      where: { organisationId, productId: { not: null }, status: { in: ["OPEN", "DISCREPANCY"] }, receipt: { organisationId, status: { notIn: ["COMPLETE", "CANCELLED"] } } },
      select: { productId: true, expectedQuantity: true, receivedQuantity: true, receipt: { select: { expectedOn: true } } },
    }), []),
  ]);
  const units = new Map(products.map((product) => [product.id, product.unitOfMeasure]));
  const buckets = new Map<string, Bucket>();
  const bucket = (productId: string) => {
    const current = buckets.get(productId) ?? empty();
    buckets.set(productId, current);
    return current;
  };
  const deliveredByLine: Record<string, number> = {};
  for (const row of balances) bucket(row.productId).onHand += row.quantity;
  for (const row of reservations) bucket(row.productId).reserved += row.quantity;
  for (const row of positions) bucket(row.productId).held += row.quantity;
  for (const line of salesLines) {
    if (!line.productId) continue;
    const unit = units.get(line.productId);
    if (unit && !sameUnit(line.unitOfMeasure, unit)) continue;
    bucket(line.productId).ordered += Math.max(0, line.orderedQuantity - line.cancelledQuantity);
  }
  for (const line of fulfilment) {
    deliveredByLine[line.salesOrderLineId] = (deliveredByLine[line.salesOrderLineId] ?? 0) + line.deliveredQuantity;
    if (!line.productId) continue;
    const row = bucket(line.productId);
    row.delivered += line.deliveredQuantity;
    row.allocated += line.allocatedQuantity;
    row.shipped += line.shippedQuantity;
  }
  for (const line of invoices) {
    if (!line.productId) continue;
    const quantity = Number(line.quantity);
    bucket(line.productId).invoiced += line.document.kind === "AR_CREDIT" ? -quantity : quantity;
  }
  for (const line of plans) bucket(line.productId).planned += Number(line.quantity);
  for (const order of production) bucket(order.productId).inProduction += Number(order.quantity);
  const rows: ProductAvailability[] = [...buckets].map(([productId, row]) => ({ productId, ...availabilityPicture(row) }));
  const day = (value: Date | null | undefined) => (value ? value.toISOString().slice(0, 10) : "");
  const group = new Map<string, { receipts: SupplyArrival[]; plan: SupplyArrival[]; production: SupplyArrival[] }>();
  const bucketSupply = (productId: string) => {
    const current = group.get(productId) ?? { receipts: [], plan: [], production: [] };
    group.set(productId, current);
    return current;
  };
  for (const line of receipts) {
    if (!line.productId || !line.receipt.expectedOn) continue;
    const quantity = line.expectedQuantity - line.receivedQuantity;
    if (quantity <= 0) continue;
    bucketSupply(line.productId).receipts.push({ on: day(line.receipt.expectedOn), quantity, source: "receipt" });
  }
  for (const line of plans) bucketSupply(line.productId).plan.push({ on: day(line.endsOn), quantity: Number(line.quantity), source: "plan" });
  for (const order of production) {
    const on = day(order.plannedFinish ?? order.requiredDate);
    if (!on) continue;
    bucketSupply(order.productId).production.push({ on, quantity: Number(order.quantity), source: "production" });
  }
  const arrivals: Record<string, SupplyArrival[]> = {};
  for (const [productId, supply] of group) arrivals[productId] = incomingArrivals(supply);
  return { products: rows, deliveredByLine, arrivals };
}

export async function readOrderChain(orderId: string) {
  const session = await requireSession();
  if (!session.capabilities.has("sales.order.read") && !session.capabilities.has("logistics.fulfilment.read")) return null;
  const order = await db.salesOrder.findFirst({
    where: { id: orderId, organisationId: session.organisationId },
    select: { id: true, lines: { where: { type: "PRODUCT" }, select: { id: true, productId: true, descriptionSnapshot: true, orderedQuantity: true, cancelledQuantity: true, unitOfMeasure: true } } },
  });
  if (!order) return null;
  const lineIds = order.lines.map((line) => line.id);
  const [fulfilment, invoices, picture] = await Promise.all([
    optional(db.fulfilmentLine.findMany({ where: { organisationId: session.organisationId, salesOrderLineId: { in: lineIds } }, select: { salesOrderLineId: true, allocatedQuantity: true, shippedQuantity: true, deliveredQuantity: true } }), []),
    optional(db.financeDocument.findMany({
      where: { organisationId: session.organisationId, salesOrderId: orderId, kind: "AR_INVOICE", status: { not: "CANCELLED" } },
      select: { id: true, reference: true, status: true, documentDate: true, lines: { select: { salesOrderLineId: true, quantity: true } } },
      orderBy: { documentDate: "asc" },
    }), []),
    readAvailability(),
  ]);
  const available = new Map(picture.products.map((row) => [row.productId, row.available]));
  const lines = order.lines.map((line) => {
    const movement = fulfilment.filter((row) => row.salesOrderLineId === line.id);
    const invoiced = invoices.reduce((sum, invoice) => sum + invoice.lines.filter((row) => row.salesOrderLineId === line.id).reduce((inner, row) => inner + Number(row.quantity), 0), 0);
    return {
      id: line.id,
      description: line.descriptionSnapshot,
      unit: line.unitOfMeasure,
      ordered: Math.max(0, line.orderedQuantity - line.cancelledQuantity),
      allocated: movement.reduce((sum, row) => sum + row.allocatedQuantity, 0),
      shipped: movement.reduce((sum, row) => sum + row.shippedQuantity, 0),
      delivered: movement.reduce((sum, row) => sum + row.deliveredQuantity, 0),
      invoiced,
      available: line.productId ? available.get(line.productId) ?? 0 : null,
    };
  });
  return {
    lines,
    invoices: invoices.map((invoice) => ({ id: invoice.id, reference: invoice.reference, status: invoice.status, documentDate: invoice.documentDate.toISOString() })),
  };
}
