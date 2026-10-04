import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { metricByKey, type MetricUnit } from "../domain/catalogue";

export type LiveActual = {
  value: number | null;
  byPeriod: Record<string, number>;
  note: string;
  href?: string;
  partial: boolean;
  contributors: Array<{ label: string; href?: string; detail: string }>;
};

const EMPTY = (note: string): LiveActual => ({ value: null, byPeriod: {}, note, partial: false, contributors: [] });

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function range(start: Date, end: Date) {
  const to = new Date(end);
  to.setUTCHours(23, 59, 59, 999);
  return { gte: start, lte: to };
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function liveActuals(session: Session, keys: string[], start: Date, end: Date, enabled: Set<string>): Promise<Record<string, LiveActual>> {
  const wanted = new Set(keys);
  const result: Record<string, LiveActual> = {};
  const can = (capability?: string) => !capability || session.capabilities.has(capability);
  const span = range(start, end);

  const need = (key: string) => {
    if (!wanted.has(key)) return false;
    const metric = metricByKey(key);
    if (!metric) return false;
    if (metric.source !== "plan" && metric.source !== "crm" && !enabled.has(metric.source)) {
      result[key] = EMPTY(`${metric.owner} is not enabled, so this actual is not available.`);
      return false;
    }
    if (!can(metric.readCapability)) {
      result[key] = EMPTY("You do not have access to the records behind this measure.");
      return false;
    }
    return true;
  };

  if (["revenue", "orders", "customers_ordering", "sales_volume"].some(need)) {
    const orders = await db.salesOrder.findMany({
      where: { organisationId: session.organisationId, commercialStatus: { in: ["CONFIRMED", "CLOSED"] }, orderDate: span },
      select: { id: true, reference: true, netAmount: true, partyId: true, orderDate: true },
      orderBy: { netAmount: "desc" },
      take: 5000,
    });
    const partial = orders.length === 5000;
    const names = new Map<string, string>();
    if (session.capabilities.has("customers.read")) {
      const parties = await db.party.findMany({ where: { organisationId: session.organisationId, id: { in: [...new Set(orders.map((order) => order.partyId))].slice(0, 40) } }, select: { id: true, name: true }, take: 40 });
      for (const party of parties) names.set(party.id, party.name);
    }
    if (wanted.has("revenue")) {
      const byPeriod: Record<string, number> = {};
      for (const order of orders) byPeriod[monthKey(order.orderDate)] = (byPeriod[monthKey(order.orderDate)] ?? 0) + order.netAmount;
      result.revenue = {
        value: orders.reduce((total, order) => total + order.netAmount, 0),
        byPeriod,
        note: partial ? "Sum of the largest 5,000 confirmed orders in this period, excluding VAT." : "Confirmed and closed orders in this period, excluding VAT.",
        href: "/sales/orders",
        partial,
        contributors: orders.slice(0, 6).map((order) => ({ label: order.reference, href: `/sales/orders/${order.id}`, detail: names.get(order.partyId) ?? "Customer" })),
      };
    }
    if (wanted.has("orders")) {
      const byPeriod: Record<string, number> = {};
      for (const order of orders) byPeriod[monthKey(order.orderDate)] = (byPeriod[monthKey(order.orderDate)] ?? 0) + 1;
      result.orders = { value: orders.length, byPeriod, note: partial ? "Count stopped at 5,000 orders." : "Confirmed and closed orders in this period.", href: "/sales/orders", partial, contributors: [] };
    }
    if (wanted.has("customers_ordering")) {
      result.customers_ordering = { value: new Set(orders.map((order) => order.partyId)).size, byPeriod: {}, note: partial ? "Distinct customers in the first 5,000 orders." : "Distinct customers with a confirmed order in this period.", href: "/customers", partial, contributors: [] };
    }
    if (wanted.has("sales_volume")) {
      const lines = await db.salesOrderLine.findMany({
        where: { order: { organisationId: session.organisationId, commercialStatus: { in: ["CONFIRMED", "CLOSED"] }, orderDate: span } },
        select: { orderedQuantity: true, cancelledQuantity: true, productId: true, descriptionSnapshot: true, order: { select: { orderDate: true } } },
        take: 5000,
      });
      const byPeriod: Record<string, number> = {};
      let total = 0;
      for (const line of lines) {
        const quantity = line.orderedQuantity - line.cancelledQuantity;
        total += quantity;
        const key = monthKey(line.order.orderDate);
        byPeriod[key] = (byPeriod[key] ?? 0) + quantity;
      }
      result.sales_volume = { value: total, byPeriod, note: lines.length === 5000 ? "Quantity from the first 5,000 order lines." : "Ordered quantity on confirmed orders, after cancellations.", href: "/sales/orders", partial: lines.length === 5000, contributors: [] };
    }
  }

  if (["pipeline", "win_rate"].some(need)) {
    if (wanted.has("pipeline")) {
      const opportunities = await db.opportunity.findMany({
        where: { organisationId: session.organisationId, status: "OPEN", expectedCloseDate: span },
        select: { id: true, name: true, valueAmount: true, expectedCloseDate: true },
        orderBy: { valueAmount: "desc" },
        take: 5000,
      });
      const byPeriod: Record<string, number> = {};
      for (const opportunity of opportunities) {
        if (!opportunity.expectedCloseDate) continue;
        const key = monthKey(opportunity.expectedCloseDate);
        byPeriod[key] = (byPeriod[key] ?? 0) + opportunity.valueAmount;
      }
      result.pipeline = {
        value: opportunities.reduce((total, opportunity) => total + opportunity.valueAmount, 0),
        byPeriod,
        note: "Open opportunities with an expected close date in this period.",
        href: "/sales/pipeline",
        partial: opportunities.length === 5000,
        contributors: opportunities.slice(0, 6).map((opportunity) => ({ label: opportunity.name, href: `/sales/opportunities/${opportunity.id}`, detail: "Open opportunity" })),
      };
    }
    if (wanted.has("win_rate")) {
      const closed = await db.opportunity.findMany({
        where: { organisationId: session.organisationId, status: { in: ["WON", "LOST"] }, actualCloseDate: span },
        select: { status: true, actualCloseDate: true },
        take: 5000,
      });
      const won = closed.filter((opportunity) => opportunity.status === "WON").length;
      result.win_rate = closed.length
        ? { value: (won / closed.length) * 100, byPeriod: {}, note: `${won} won of ${closed.length} closed in this period.`, href: "/sales/pipeline", partial: closed.length === 5000, contributors: [] }
        : EMPTY("No opportunities were won or lost in this period.");
    }
  }

  if (["quotes", "quote_value"].some(need)) {
    const quotes = await db.quote.findMany({
      where: { organisationId: session.organisationId, createdAt: span },
      select: { id: true, reference: true, netAmount: true, createdAt: true },
      orderBy: { netAmount: "desc" },
      take: 5000,
    });
    const partial = quotes.length === 5000;
    if (wanted.has("quotes")) {
      const byPeriod: Record<string, number> = {};
      for (const quote of quotes) byPeriod[monthKey(quote.createdAt)] = (byPeriod[monthKey(quote.createdAt)] ?? 0) + 1;
      result.quotes = { value: quotes.length, byPeriod, note: partial ? "Count stopped at 5,000 quotations." : "Quotations raised in this period.", href: "/sales/quotes", partial, contributors: [] };
    }
    if (wanted.has("quote_value")) {
      const byPeriod: Record<string, number> = {};
      for (const quote of quotes) byPeriod[monthKey(quote.createdAt)] = (byPeriod[monthKey(quote.createdAt)] ?? 0) + quote.netAmount;
      result.quote_value = {
        value: quotes.reduce((total, quote) => total + quote.netAmount, 0),
        byPeriod,
        note: partial ? "Value of the largest 5,000 quotations in this period, excluding VAT." : "Quotation value raised in this period, excluding VAT.",
        href: "/sales/quotes",
        partial,
        contributors: quotes.slice(0, 6).map((quote) => ({ label: quote.reference, href: `/sales/quotes/${quote.id}`, detail: "Quotation" })),
      };
    }
  }

  if (need("sales_activities")) {
    const activities = await db.salesActivity.findMany({
      where: { organisationId: session.organisationId, createdAt: span },
      select: { type: true, subject: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    const byPeriod: Record<string, number> = {};
    for (const activity of activities) byPeriod[monthKey(activity.createdAt)] = (byPeriod[monthKey(activity.createdAt)] ?? 0) + 1;
    result.sales_activities = {
      value: activities.length,
      byPeriod,
      note: activities.length === 5000 ? "Count stopped at 5,000 activities." : "Calls, meetings and tasks recorded in this period.",
      href: "/sales",
      partial: activities.length === 5000,
      contributors: activities.slice(0, 6).map((activity) => ({ label: activity.subject, detail: activity.type })),
    };
  }

  if (["tickets", "complaints", "first_response_hours", "resolution_hours"].some(need)) {
    if (wanted.has("tickets") && session.capabilities.has("service.ticket.read")) {
      const tickets = await db.serviceTicket.findMany({ where: { organisationId: session.organisationId, createdAt: span }, select: { createdAt: true }, take: 5000 });
      const byPeriod: Record<string, number> = {};
      for (const ticket of tickets) byPeriod[monthKey(ticket.createdAt)] = (byPeriod[monthKey(ticket.createdAt)] ?? 0) + 1;
      result.tickets = { value: tickets.length, byPeriod, note: tickets.length === 5000 ? "Count stopped at 5,000 tickets." : "Tickets opened in this period.", href: "/service", partial: tickets.length === 5000, contributors: [] };
    }
    if (session.capabilities.has("service.case.read") && ["complaints", "first_response_hours", "resolution_hours"].some((key) => wanted.has(key))) {
      const cases = await db.serviceCase.findMany({
        where: { organisationId: session.organisationId, createdAt: span },
        select: { id: true, number: true, type: true, createdAt: true, firstResponseAt: true, resolvedAt: true },
        take: 5000,
      });
      if (wanted.has("complaints")) {
        const complaints = cases.filter((item) => item.type === "COMPLAINT" || item.type === "QUALITY_COMPLAINT");
        const byPeriod: Record<string, number> = {};
        for (const item of complaints) byPeriod[monthKey(item.createdAt)] = (byPeriod[monthKey(item.createdAt)] ?? 0) + 1;
        result.complaints = { value: complaints.length, byPeriod, note: "Complaint cases opened in this period.", href: "/service", partial: cases.length === 5000, contributors: complaints.slice(0, 6).map((item) => ({ label: item.number, href: "/service", detail: item.type })) };
      }
      if (wanted.has("first_response_hours")) {
        const hours = cases.flatMap((item) => item.firstResponseAt ? [(item.firstResponseAt.getTime() - item.createdAt.getTime()) / 3_600_000] : []).filter((hour) => hour >= 0);
        result.first_response_hours = hours.length ? { value: hours.reduce((total, hour) => total + hour, 0) / hours.length, byPeriod: {}, note: `Average of ${hours.length} cases with a stored response time.`, href: "/service", partial: cases.length === 5000, contributors: [] } : EMPTY("No cases in this period have a first response time.");
      }
      if (wanted.has("resolution_hours")) {
        const hours = cases.flatMap((item) => item.resolvedAt ? [(item.resolvedAt.getTime() - item.createdAt.getTime()) / 3_600_000] : []).filter((hour) => hour >= 0);
        result.resolution_hours = hours.length ? { value: hours.reduce((total, hour) => total + hour, 0) / hours.length, byPeriod: {}, note: `Average of ${hours.length} resolved cases.`, href: "/service", partial: cases.length === 5000, contributors: [] } : EMPTY("No cases in this period have a resolution time.");
      }
    }
  }

  if (["headcount", "labour_hours"].some(need)) {
    const employees = await db.employee.findMany({ where: { organisationId: session.organisationId, status: "ACTIVE" }, select: { contractedWeeklyHours: true, department: true }, take: 5000 });
    if (wanted.has("headcount")) result.headcount = { value: employees.length, byPeriod: {}, note: employees.length === 5000 ? "Count stopped at 5,000 active employees." : "Active employees now.", href: "/people", partial: employees.length === 5000, contributors: [] };
    if (wanted.has("labour_hours")) {
      const known = employees.filter((employee) => employee.contractedWeeklyHours != null);
      result.labour_hours = { value: known.reduce((total, employee) => total + (employee.contractedWeeklyHours ?? 0), 0), byPeriod: {}, note: `${known.length} active employees have contracted weekly hours. People without hours are left out.`, href: "/people", partial: employees.length === 5000, contributors: [] };
    }
  }

  if (["otif", "shipments", "warehouse_throughput"].some(need)) {
    const shipments = await db.shipment.findMany({
      where: { organisationId: session.organisationId, createdAt: span },
      select: { onTime: true, inFull: true, createdAt: true, deliveredAt: true },
      take: 5000,
    });
    const byPeriod: Record<string, number> = {};
    for (const shipment of shipments) byPeriod[monthKey(shipment.createdAt)] = (byPeriod[monthKey(shipment.createdAt)] ?? 0) + 1;
    if (wanted.has("shipments") || wanted.has("warehouse_throughput")) {
      const row: LiveActual = { value: shipments.length, byPeriod, note: shipments.length === 5000 ? "Count stopped at 5,000 shipments." : "Shipments created in this period.", href: "/logistics", partial: shipments.length === 5000, contributors: [] };
      if (wanted.has("shipments")) result.shipments = row;
      if (wanted.has("warehouse_throughput")) result.warehouse_throughput = { ...row, note: `${row.note} This is a shipment count, not a calculated warehouse-hours model.` };
    }
    if (wanted.has("otif")) {
      const measured = shipments.filter((shipment) => shipment.onTime != null);
      const hit = measured.filter((shipment) => shipment.onTime && shipment.inFull).length;
      result.otif = measured.length ? { value: (hit / measured.length) * 100, byPeriod: {}, note: `${hit} of ${measured.length} shipments with an on-time result were on time and in full.`, href: "/logistics/reports", partial: shipments.length === 5000, contributors: [] } : EMPTY("No shipment in this period has an on-time result yet.");
    }
  }

  if (need("stock_on_hand")) {
    const stock = await db.stockPosition.aggregate({ where: { organisationId: session.organisationId, status: "AVAILABLE" }, _sum: { quantity: true } });
    result.stock_on_hand = { value: stock._sum.quantity ?? 0, byPeriod: {}, note: "Available quantity now. It is not a forecast of stock at the end of the period.", href: "/stock", partial: false, contributors: [] };
  }

  if (["production_scheduled", "production_completed"].some(need)) {
    const orders = await db.manufacturingOrder.findMany({
      where: { organisationId: session.organisationId, OR: [{ requiredDate: span }, { plannedStart: span }, { actualFinish: span }] },
      select: { quantity: true, status: true, orderNumber: true, requiredDate: true, actualFinish: true },
      take: 5000,
    });
    if (wanted.has("production_scheduled")) {
      const open = orders.filter((order) => ["PLANNED", "READY", "RELEASED", "RUNNING"].includes(order.status));
      result.production_scheduled = { value: open.reduce((total, order) => total + num(order.quantity), 0), byPeriod: {}, note: "Open manufacturing orders dated in this period.", href: "/manufacturing", partial: orders.length === 5000, contributors: open.slice(0, 6).map((order) => ({ label: order.orderNumber, href: "/manufacturing/produce", detail: order.status })) };
    }
    if (wanted.has("production_completed")) {
      const done = orders.filter((order) => order.status === "COMPLETE" || order.status === "CLOSED");
      result.production_completed = { value: done.reduce((total, order) => total + num(order.quantity), 0), byPeriod: {}, note: "Completed and closed manufacturing orders dated in this period.", href: "/manufacturing", partial: orders.length === 5000, contributors: [] };
    }
  }

  if (need("production_plan")) {
    const lines = await db.productionPlanLine.findMany({
      where: { organisationId: session.organisationId, startsOn: { lte: end }, endsOn: { gte: start } },
      select: { quantity: true },
      take: 5000,
    });
    result.production_plan = { value: lines.reduce((total, line) => total + num(line.quantity), 0), byPeriod: {}, note: "Saved Production Planning quantities that overlap this period. This is a live total, not a copy.", href: "/planning/plans", partial: lines.length === 5000, contributors: [] };
  }

  for (const key of keys) {
    if (!result[key]) {
      const metric = metricByKey(key);
      result[key] = EMPTY(metric?.source === "plan" ? "Entered on the plan. There is no live source for this measure yet." : "No live value for this measure.");
    }
  }
  return result;
}

export async function productionPicture(session: Session, start: Date, end: Date, enabled: Set<string>) {
  const picture = { plans: [] as Array<{ id: string; name: string; quantity: number }>, products: [] as Array<{ id: string; name: string; demand: number; planned: number; scheduled: number; orders: Array<{ id: string; reference: string; quantity: number }> }>, centres: [] as Array<{ name: string; rate: string }>, note: "" };
  if (!enabled.has("planning") && !enabled.has("manufacturing") && !enabled.has("sales")) {
    picture.note = "Sales, Manufacturing and Production Planning are not enabled, so there is nothing to compare.";
    return picture;
  }
  const span = range(start, end);
  if (enabled.has("planning") && session.capabilities.has("planning.demand.read")) {
    const plans = await db.productionPlan.findMany({ where: { organisationId: session.organisationId, startsOn: { lte: end }, endsOn: { gte: start } }, include: { lines: { select: { quantity: true, productId: true } } }, take: 20 });
    picture.plans = plans.map((plan) => ({ id: plan.id, name: plan.name, quantity: plan.lines.reduce((total, line) => total + num(line.quantity), 0) }));
  }
  if (enabled.has("manufacturing") && session.capabilities.has("manufacturing.order.read")) {
    const centres = await db.manufacturingResource.findMany({ where: { organisationId: session.organisationId, active: true }, select: { name: true, nominalUnitsPerHour: true, workCentre: { select: { name: true } } }, take: 30 });
    picture.centres = centres.map((centre) => ({ name: `${centre.workCentre.name} · ${centre.name}`, rate: centre.nominalUnitsPerHour == null ? "No hourly rate stored" : `${num(centre.nominalUnitsPerHour)} units/hour` }));
  }
  const demand = new Map<string, { name: string; demand: number; planned: number; scheduled: number; orders: Array<{ id: string; reference: string; quantity: number }> }>();
  const ensure = (id: string, name: string) => demand.get(id) ?? demand.set(id, { name, demand: 0, planned: 0, scheduled: 0, orders: [] }).get(id)!;
  if (enabled.has("sales") && session.capabilities.has("sales.order.read")) {
    const lines = await db.salesOrderLine.findMany({
      where: { productId: { not: null }, order: { organisationId: session.organisationId, commercialStatus: { in: ["CONFIRMED", "CLOSED"] }, orderDate: span } },
      select: { productId: true, descriptionSnapshot: true, orderedQuantity: true, cancelledQuantity: true, order: { select: { id: true, reference: true } } },
      take: 5000,
    });
    for (const line of lines) {
      if (!line.productId) continue;
      const row = ensure(line.productId, line.descriptionSnapshot);
      const quantity = line.orderedQuantity - line.cancelledQuantity;
      row.demand += quantity;
      if (row.orders.length < 5) row.orders.push({ id: line.order.id, reference: line.order.reference, quantity });
    }
  }
  if (enabled.has("planning") && session.capabilities.has("planning.demand.read")) {
    const lines = await db.productionPlanLine.findMany({ where: { organisationId: session.organisationId, startsOn: { lte: end }, endsOn: { gte: start } }, select: { productId: true, quantity: true }, take: 5000 });
    for (const line of lines) ensure(line.productId, line.productId).planned += num(line.quantity);
  }
  if (enabled.has("manufacturing") && session.capabilities.has("manufacturing.order.read")) {
    const orders = await db.manufacturingOrder.findMany({ where: { organisationId: session.organisationId, status: { in: ["PLANNED", "READY", "RELEASED", "RUNNING"] }, OR: [{ requiredDate: span }, { plannedStart: span }] }, select: { productId: true, quantity: true }, take: 5000 });
    for (const order of orders) ensure(order.productId, order.productId).scheduled += num(order.quantity);
  }
  if (session.capabilities.has("core.products.read") || session.capabilities.has("stock.read") || session.capabilities.has("sales.order.read")) {
    const products = await db.product.findMany({ where: { organisationId: session.organisationId, id: { in: [...demand.keys()].slice(0, 40) } }, select: { id: true, name: true, code: true }, take: 40 });
    for (const product of products) {
      const row = demand.get(product.id);
      if (row) row.name = `${product.code} ${product.name}`;
    }
  }
  picture.products = [...demand.entries()].map(([id, row]) => ({ id, ...row })).sort((a, b) => (b.demand - b.scheduled) - (a.demand - a.scheduled)).slice(0, 12);
  if (!picture.products.length && !picture.plans.length) picture.note = "Nothing in Sales, Manufacturing or Production Planning overlaps this period.";
  else picture.note = "These figures are read live. They are copied onto the plan only when you take a snapshot. Hourly rates are not turned into a monthly capacity.";
  return picture;
}

export function unitOf(key: string): MetricUnit {
  return metricByKey(key)?.unit ?? "count";
}
