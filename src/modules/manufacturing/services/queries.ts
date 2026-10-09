import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import type { AttentionItem, SearchResult } from "@/core/modules/types";
import { getModule } from "@/core/modules/registry";
import { OPEN_PRODUCTION_ORDER_STATUSES } from "../domain/lifecycle";
import { manHoursInWindow } from "../domain/calendar";
import { optionalStore } from "./optional";

/** §7: Manufacturing Today — the production command centre. */
export async function todayBoard(organisationId: string) {
  const orders = await db.manufacturingOrder.findMany({
    where: { organisationId, status: { in: OPEN_PRODUCTION_ORDER_STATUSES } },
    include: { product: { select: { name: true, code: true } }, workOrders: { orderBy: { sequence: "asc" } } },
    orderBy: [{ priority: "desc" }, { requiredDate: "asc" }],
    take: 500,
  });

  const byStatus = {
    running: orders.filter((o) => o.status === "RUNNING").length,
    waiting: orders.filter((o) => o.status === "RELEASED").length,
    ready: orders.filter((o) => o.status === "READY").length,
    blocked: orders.filter((o) => o.workOrders.some((w) => w.status === "BLOCKED")).length,
  };

  const now = new Date();
  const overdue = orders.filter((o) => o.requiredDate && o.requiredDate < now && o.status !== "COMPLETE");

  const { getModule } = await import("@/core/modules/registry");
  const holds = await getModule("safety")?.safetyProvider?.activeHolds(organisationId) ?? [];
  const resourceHolds = holds.filter((hold) => hold.targetType === "MANUFACTURING_RESOURCE");

  const attention: AttentionItem[] = [
    ...resourceHolds.map((hold) => ({
      id: `safety-${hold.id}`,
      label: `${hold.label} is unavailable — ${hold.reason}`,
      href: `/manufacturing/produce`,
      severity: "critical" as const,
    })),
    ...overdue.slice(0, 12).map((o) => ({
      id: `overdue-${o.id}`,
      label: `${o.orderNumber} (${o.product.name}) is overdue — required ${o.requiredDate!.toLocaleDateString("en-GB")}`,
      href: `/manufacturing/produce/${o.id}`,
      severity: "critical" as const,
    })),
    ...orders
      .filter((o) => o.workOrders.some((w) => w.status === "BLOCKED"))
      .slice(0, 12)
      .map((o) => ({
        id: `blocked-${o.id}`,
        label: `${o.orderNumber} (${o.product.name}) has a blocked operation`,
        href: `/manufacturing/produce/${o.id}`,
        severity: "warning" as const,
      })),
  ];

  const nextCompletions = orders
    .filter((o) => o.status === "RUNNING" && o.plannedFinish)
    .sort((a, b) => a.plannedFinish!.getTime() - b.plannedFinish!.getTime())
    .slice(0, 8)
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      product: o.product.name,
      quantity: Number(o.quantity),
      plannedFinish: o.plannedFinish,
    }));

  return { total: orders.length, byStatus, attention, nextCompletions };
}

/** §118-119: Produce workspace — the manager/supervisor order list. */
export async function listOrders(organisationId: string, view?: string) {
  const where = { organisationId, ...(view === "active" ? { status: { in: OPEN_PRODUCTION_ORDER_STATUSES } } : {}) };
  const orders = await db.manufacturingOrder.findMany({
    where,
    include: { product: { select: { name: true, code: true } }, workOrders: true, sourceSalesOrderLine: { include: { order: { select: { id: true, reference: true } } } } },
    orderBy: [{ priority: "desc" }, { requiredDate: "asc" }],
    take: 300,
  });
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    productId: o.productId,
    product: o.product.name,
    productCode: o.product.code,
    quantity: Number(o.quantity),
    unitOfMeasure: o.unitOfMeasure,
    requiredDate: o.requiredDate,
    plannedFinish: o.plannedFinish,
    status: o.status,
    progress: o.workOrders.length ? Math.round((o.workOrders.filter((w) => w.status === "COMPLETE").length / o.workOrders.length) * 100) : 0,
    sourceOrderReference: o.sourceSalesOrderLine?.order.reference ?? null,
    sourceOrderId: o.sourceSalesOrderLine?.order.id ?? null,
  }));
}

/** §120: the single Production Order view. */
export async function orderDetail(organisationId: string, orderId: string) {
  const order = await db.manufacturingOrder.findFirst({
    where: { id: orderId, organisationId },
    include: {
      product: { select: { name: true, code: true, unitOfMeasure: true } },
      definition: { include: { lines: { include: { component: { select: { id: true, name: true, code: true } } } } } },
      workOrders: { orderBy: { sequence: "asc" }, include: { workCentre: { select: { name: true } }, resource: { select: { name: true } } } },
      sourceSalesOrderLine: { include: { order: { include: { party: { select: { name: true } } } } } },
    },
  });
  if (!order) return null;
  // §20 plan-vs-actual materials: what backflushing actually consumed for this
  // order, read from the inventory ledger rather than a parallel "actual" table,
  // so the ledger stays the single source of truth. Negative deltas are use.
  const movements = await db.inventoryMovement.findMany({
    where: { organisationId, manufacturingOrderId: order.id, delta: { lt: 0 } },
    include: { product: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "asc" },
  });
  const consumed = new Map<string, { productId: string; name: string; code: string; quantity: number }>();
  for (const move of movements) {
    const row = consumed.get(move.productId) ?? { productId: move.productId, name: move.product.name, code: move.product.code, quantity: 0 };
    row.quantity += Math.abs(move.delta);
    consumed.set(move.productId, row);
  }
  return { ...order, consumption: [...consumed.values()] };
}

export async function manufacturingAttention(organisationId: string): Promise<AttentionItem[]> {
  const board = await todayBoard(organisationId);
  return board.attention;
}

export async function searchManufacturing(session: Session, query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const orders = await db.manufacturingOrder.findMany({
    where: { organisationId: session.organisationId, orderNumber: { contains: query, mode: "insensitive" } },
    include: { product: { select: { name: true } } },
    take: 10,
  });
  return orders.map((o) => ({ id: o.id, title: o.orderNumber, subtitle: o.product.name, href: `/manufacturing/produce/${o.id}`, group: "Manufacturing" }));
}

/** §69-70: Shop Floor home — now/next work across all work centres. A later
 * phase scopes this to the operator's own work centre/badge scan. */
export async function shopFloorQueue(organisationId: string) {
  const workOrders = await db.manufacturingWorkOrder.findMany({
    where: { organisationId, status: { in: ["READY", "RUNNING", "PAUSED", "WAITING", "BLOCKED"] } },
    include: { productionOrder: { select: { orderNumber: true, quantity: true, unitOfMeasure: true, product: { select: { name: true } } } }, workCentre: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { sequence: "asc" }],
    take: 100,
  });
  return workOrders.map((w) => ({
    id: w.id,
    operationName: w.operationName,
    orderNumber: w.productionOrder.orderNumber,
    product: w.productionOrder.product.name,
    quantity: Number(w.productionOrder.quantity),
    unitOfMeasure: w.productionOrder.unitOfMeasure,
    workCentre: w.workCentre?.name ?? "Unassigned",
    status: w.status,
    scheduledStart: w.scheduledStart,
    producedQuantity: Number(w.producedQuantity),
  }));
}

/** §50-51: Schedule, grouped By Work Centre (the brief's stated default). Not
 * finite-capacity aware yet — this renders whatever `releaseOrder` scheduled; it
 * does not detect or resolve overlaps between orders on the same resource. */
export async function scheduleByWorkCentre(organisationId: string) {
  const workCentres = await db.manufacturingWorkCentre.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
  const workOrders = await db.manufacturingWorkOrder.findMany({
    where: { organisationId, status: { not: "COMPLETE" }, scheduledStart: { not: null } },
    include: { productionOrder: { select: { orderNumber: true, id: true, product: { select: { name: true } } } } },
    orderBy: { scheduledStart: "asc" },
  });
  const unassigned = workOrders.filter((w) => !w.workCentreId);
  return workCentres
    .map((wc) => ({
      id: wc.id,
      name: wc.name,
      workOrders: workOrders
        .filter((w) => w.workCentreId === wc.id)
        .map((w) => ({ id: w.id, operationName: w.operationName, orderNumber: w.productionOrder.orderNumber, orderId: w.productionOrder.id, product: w.productionOrder.product.name, start: w.scheduledStart, end: w.scheduledEnd, status: w.status })),
    }))
    .concat(unassigned.length ? [{ id: "unassigned", name: "No work centre assigned", workOrders: unassigned.map((w) => ({ id: w.id, operationName: w.operationName, orderNumber: w.productionOrder.orderNumber, orderId: w.productionOrder.id, product: w.productionOrder.product.name, start: w.scheduledStart, end: w.scheduledEnd, status: w.status })) }] : []);
}

/** The production planner's tool (§50-56). One row per resource (falling back
 * to one row per work centre for orders not yet assigned a specific resource),
 * with everything a planner needs to judge a move: BOM material readiness
 * (via the same `StockProvider` contract MRP uses — §113, never Stock tables
 * directly), the customer this protects, and whether it's locked (§54). */
export async function schedulerBoard(organisationId: string, windowDays = 14) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowDays * 86_400_000);

  const [workCentres, resources, workOrders] = await Promise.all([
    db.manufacturingWorkCentre.findMany({ where: { organisationId, active: true }, orderBy: { name: "asc" } }),
    db.manufacturingResource.findMany({ where: { organisationId, active: true }, orderBy: { name: "asc" } }),
    db.manufacturingWorkOrder.findMany({
      where: { organisationId, status: { notIn: ["COMPLETE"] } },
      include: {
        productionOrder: {
          select: {
            id: true, orderNumber: true, requiredDate: true, quantity: true,
            product: { select: { name: true } },
            sourceSalesOrderLine: { include: { order: { select: { reference: true, party: { select: { name: true } } } } } },
            definition: { select: { lines: { select: { componentProductId: true, quantityPerUnit: true, component: { select: { name: true } } } } } },
          },
        },
      },
    }),
  ]);

  const stock = getModule("stock")?.stockProvider;
  const materialFlags = new Map<string, boolean>();
  if (stock) {
    const uniqueOrders = new Map(workOrders.map((w) => [w.productionOrder.id, w.productionOrder]));
    for (const order of uniqueOrders.values()) {
      const lines = order.definition?.lines ?? [];
      let short = false;
      for (const line of lines) {
        const availability = await stock.getAvailability({ organisationId, userId: "scheduler" }, { productId: line.componentProductId });
        if (availability.available < Number(line.quantityPerUnit) * Number(order.quantity)) { short = true; break; }
      }
      materialFlags.set(order.id, short);
    }
  }

  const toBar = (w: (typeof workOrders)[number]) => ({
    id: w.id,
    operationName: w.operationName,
    orderId: w.productionOrder.id,
    orderNumber: w.productionOrder.orderNumber,
    product: w.productionOrder.product.name,
    start: w.scheduledStart,
    end: w.scheduledEnd,
    status: w.status,
    locked: w.locked,
    resourceId: w.resourceId,
    workCentreId: w.workCentreId,
    requiredDate: w.productionOrder.requiredDate,
    customer: w.productionOrder.sourceSalesOrderLine?.order.party.name ?? null,
    salesOrderReference: w.productionOrder.sourceSalesOrderLine?.order.reference ?? null,
    materialShort: materialFlags.get(w.productionOrder.id) ?? false,
  });

  const rows = resources.map((resource) => ({
    id: resource.id,
    kind: "resource" as const,
    name: resource.name,
    workCentreId: resource.workCentreId,
    workCentreName: workCentres.find((wc) => wc.id === resource.workCentreId)?.name ?? "",
    bars: workOrders.filter((w) => w.resourceId === resource.id).map(toBar),
  }));

  const unassignedByWorkCentre = workCentres.map((wc) => ({
    id: `wc-${wc.id}`,
    kind: "work-centre" as const,
    name: `${wc.name} (unassigned resource)`,
    workCentreId: wc.id,
    workCentreName: wc.name,
    bars: workOrders.filter((w) => w.workCentreId === wc.id && !w.resourceId).map(toBar),
  })).filter((row) => row.bars.length > 0 || resources.every((r) => r.workCentreId !== row.workCentreId));

  const noWorkCentre = workOrders.filter((w) => !w.workCentreId).map(toBar);

  return {
    windowStart: now,
    windowEnd,
    resources: resources.map((r) => ({ id: r.id, name: r.name, workCentreId: r.workCentreId })),
    workCentres: workCentres.map((wc) => ({ id: wc.id, name: wc.name })),
    rows: [...rows, ...unassignedByWorkCentre],
    unassigned: noWorkCentre,
  };
}

/** §21-23: work centre capacity view — scheduled load vs. a naive 8h/weekday
 * theoretical capacity (§25's real calendars are a later phase). */
export async function capacityByWorkCentre(organisationId: string) {
  const workCentres = await db.manufacturingWorkCentre.findMany({ where: { organisationId, active: true } });
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const [workOrders, shifts] = await Promise.all([
    db.manufacturingWorkOrder.findMany({
      where: { organisationId, workCentreId: { not: null }, scheduledStart: { gte: now, lte: weekEnd } },
      include: { productionOrder: { select: { quantity: true, definitionId: true } } },
    }),
    optionalStore(() => db.manufacturingShift.findMany({ where: { organisationId, active: true, resourceId: null } }), []),
  ]);

  // Labour hours need each step's crew size — look it up from the routing by
  // matching sequence to position, the same snapshot `releaseOrder` used.
  const definitionIds = [...new Set(workOrders.map((w) => w.productionOrder.definitionId).filter((id): id is string => Boolean(id)))];
  const operations = definitionIds.length ? await db.productOperation.findMany({ where: { definitionId: { in: definitionIds } } }) : [];
  const crewSizeFor = (w: (typeof workOrders)[number]) => operations.find((op) => op.definitionId === w.productionOrder.definitionId && op.position === w.sequence - 1)?.crewSize ?? 1;

  return workCentres.map((wc) => {
    const load = workOrders.filter((w) => w.workCentreId === wc.id);
    const scheduledHours = load.reduce((sum, w) => sum + (w.scheduledStart && w.scheduledEnd ? (w.scheduledEnd.getTime() - w.scheduledStart.getTime()) / 3_600_000 : 0), 0);
    const labourHours = load.reduce((sum, w) => sum + (w.scheduledStart && w.scheduledEnd ? ((w.scheduledEnd.getTime() - w.scheduledStart.getTime()) / 3_600_000) * Number(crewSizeFor(w)) : 0), 0);
    const centreShifts = shifts.filter((s) => s.workCentreId === wc.id).map((s) => ({ daysOfWeek: s.daysOfWeek, startMinute: s.startMinute, endMinute: s.endMinute, crewCount: s.crewCount }));
    const hasRealShifts = centreShifts.length > 0;
    const theoreticalHours = hasRealShifts ? manHoursInWindow(centreShifts, now, weekEnd) : 5 * 8;
    return {
      id: wc.id,
      name: wc.name,
      scheduledHours: Math.round(scheduledHours * 10) / 10,
      labourHours: Math.round(labourHours * 10) / 10,
      theoreticalHours: Math.round(theoreticalHours * 10) / 10,
      usingConfiguredShifts: hasRealShifts,
      overloadHours: Math.max(0, Math.round((labourHours - theoreticalHours) * 10) / 10),
    };
  });
}

/** §139: Customer Orders at Risk — one of the brief's named signature reports.
 * "At risk" here means the order's required date has passed (or is within 2
 * days) while production has not completed. */
export async function customerOrdersAtRisk(organisationId: string) {
  const now = new Date();
  const soon = new Date(now.getTime() + 2 * 86_400_000);
  const orders = await db.manufacturingOrder.findMany({
    where: { organisationId, status: { in: OPEN_PRODUCTION_ORDER_STATUSES }, requiredDate: { lte: soon } },
    include: {
      product: { select: { name: true } },
      sourceSalesOrderLine: { include: { order: { select: { reference: true, party: { select: { name: true } } } } } },
      workOrders: true,
    },
    orderBy: { requiredDate: "asc" },
  });
  return orders
    .filter((o) => o.sourceSalesOrderLine)
    .map((o) => {
      const complete = o.workOrders.filter((w) => w.status === "COMPLETE").length;
      const progress = o.workOrders.length ? Math.round((complete / o.workOrders.length) * 100) : 0;
      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        productId: o.productId,
        product: o.product.name,
        customer: o.sourceSalesOrderLine!.order.party.name,
        salesOrderReference: o.sourceSalesOrderLine!.order.reference,
        requiredDate: o.requiredDate,
        progress,
        overdue: Boolean(o.requiredDate && o.requiredDate < now),
      };
    });
}

/** Products with an active BOM/routing — the only ones MRP/forecast can act on. */
export async function manufacturableProducts(organisationId: string) {
  const products = await db.product.findMany({
    where: { organisationId, definitions: { some: { status: "ACTIVE" } } },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
  return products;
}
