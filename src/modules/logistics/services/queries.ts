import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { policyFor } from "./numbers";

const day = (date = new Date()) => { const start = new Date(date); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1); return { start, end }; };

export async function todayBoard(organisationId: string) {
  const { start, end } = day();
  const policy = await policyFor(organisationId);
  const [requirements, tasks, shipments, returns] = await Promise.all([
    db.fulfilmentRequirement.findMany({ where: { organisationId, status: { notIn: ["CANCELLED", "DELIVERED"] } }, include: { party: { select: { name: true } }, lines: true }, orderBy: [{ priority: "desc" }, { promisedOn: "asc" }], take: 300 }),
    db.warehouseTask.findMany({ where: { organisationId, status: { not: "CANCELLED" } }, include: { lines: true }, take: 400 }),
    db.shipment.findMany({ where: { organisationId, status: { notIn: ["CANCELLED", "DELIVERED"] } }, include: { party: { select: { name: true } } }, take: 300 }),
    db.returnAuthorisation.findMany({ where: { organisationId, status: { in: ["RECEIVED", "INSPECTING", "AWAITING_GOODS"] } }, take: 100 }),
  ]);
  const open = requirements.filter((row) => !["SHIPPED", "CANCELLED"].includes(row.status));
  const picks = tasks.filter((task) => task.kind === "PICK");
  const packs = tasks.filter((task) => task.kind === "PACK");
  const pickUnits = picks.reduce((sum, task) => sum + task.lines.reduce((lineSum, line) => lineSum + line.requiredQuantity, 0), 0);
  const pickedUnits = picks.reduce((sum, task) => sum + task.lines.reduce((lineSum, line) => lineSum + line.confirmedQuantity, 0), 0);
  const cutOffs = policy.cutOffs && typeof policy.cutOffs === "object" ? policy.cutOffs as Record<string, string> : {};
  const carriers = new Map<string, number>();
  for (const shipment of shipments.filter((row) => !row.dispatchedAt && (!row.plannedDispatchAt || row.plannedDispatchAt < end))) carriers.set(shipment.carrierCode, (carriers.get(shipment.carrierCode) ?? 0) + 1);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const attention = [
    ...open.filter((row) => row.promisedOn && row.promisedOn < start).slice(0, 12).map((row) => ({ href: `/logistics/fulfil/${row.id}`, label: `${row.reference} risks missing ${row.party.name}`, tone: "critical" as const })),
    ...requirements.filter((row) => row.lines.some((line) => line.allocationStatus === "SHORT")).slice(0, 8).map((row) => ({ href: `/logistics/fulfil/${row.id}`, label: `${row.reference} is short`, tone: "warning" as const })),
    ...open.filter((row) => !row.lines.some((line) => line.orderedQuantity > line.cancelledQuantity)).slice(0, 8).map((row) => ({ href: `/logistics/fulfil/${row.id}`, label: `${row.reference} has no items to fulfil. Check the sales order.`, tone: "warning" as const })),
    ...open.filter((row) => row.holdSummary).slice(0, 8).map((row) => ({ href: `/logistics/fulfil/${row.id}`, label: `${row.reference} · ${row.holdSummary}`, tone: "warning" as const })),
    ...shipments.filter((row) => row.status === "EXCEPTION").slice(0, 8).map((row) => ({ href: `/logistics/shipments/${row.id}`, label: `${row.reference} needs a delivery decision`, tone: "critical" as const })),
    ...returns.filter((row) => row.status === "RECEIVED" || row.status === "INSPECTING").slice(0, 8).map((row) => ({ href: `/logistics/returns/${row.id}`, label: `${row.reference} is waiting for inspection`, tone: "warning" as const })),
  ];
  for (const [carrier, count] of carriers) {
    const cutoff = cutOffs[carrier];
    if (!cutoff) continue;
    const [hour, minute] = cutoff.split(":").map(Number);
    if (nowMinutes > hour * 60 + minute) attention.push({ href: "/logistics/dispatch", label: `${count} ${carrier} shipment${count === 1 ? "" : "s"} missed the ${cutoff} cut-off`, tone: "critical" });
  }
  return {
    open: open.length,
    readyToPick: open.filter((row) => row.lines.some((line) => line.orderedQuantity > line.cancelledQuantity) && (row.status === "RELEASED" || row.lines.every((line) => line.allocationStatus === "ALLOCATED"))).length,
    packing: packs.filter((task) => task.status !== "COMPLETE").length,
    readyToDispatch: shipments.filter((row) => ["READY", "LABELLED", "STAGED", "LOADED"].includes(row.status)).length,
    attention: attention.slice(0, 12),
    dispatch: [...carriers.entries()].map(([carrier, count]) => ({ carrier, count, cutoff: cutOffs[carrier] ?? "—" })),
    warehouse: { picking: pickUnits ? Math.round((pickedUnits / pickUnits) * 100) : 0, packing: packs.length ? Math.round((packs.filter((task) => task.status === "COMPLETE").length / packs.length) * 100) : 0, ready: shipments.filter((row) => ["READY", "LABELLED", "STAGED"].includes(row.status)).length, exceptions: tasks.filter((task) => task.lines.some((line) => line.status === "EXCEPTION" || line.status === "SHORT")).length },
    mode: policy.mode,
  };
}

export async function fulfilBoard(organisationId: string, view?: string) {
  const rows = await db.fulfilmentRequirement.findMany({ where: { organisationId }, include: { party: { select: { name: true } }, lines: true, salesOrder: { select: { reference: true, customerPoReference: true, requestedDeliveryDate: true } } }, orderBy: [{ priority: "desc" }, { promisedOn: "asc" }], take: 200 });
  const filtered = rows.filter((row) => {
    if (view === "ready") return row.status === "RELEASED";
    if (view === "short") return row.lines.some((line) => line.allocationStatus === "SHORT");
    if (view === "hold") return Boolean(row.holdSummary);
    if (view === "risk") return Boolean(row.promisedOn && row.promisedOn < new Date() && !["SHIPPED", "DELIVERED", "CANCELLED"].includes(row.status));
    if (view === "stock") return row.lines.some((line) => line.allocationStatus === "UNALLOCATED" || line.allocationStatus === "SHORT");
    return row.status !== "CANCELLED";
  });
  const count = (status: string) => rows.filter((row) => row.status === status).length;
  return { rows: filtered, buckets: [
    { label: "Ready to release", value: rows.filter((row) => row.status === "OPEN" && !row.holdSummary && row.lines.some((line) => line.orderedQuantity > line.cancelledQuantity)).length, view: "" },
    { label: "Picking", value: count("RELEASED") + count("PICKING"), view: "ready" },
    { label: "Packing", value: count("PACKING"), view: "" },
    { label: "Ready to dispatch", value: count("STAGED") + count("PART_SHIPPED"), view: "" },
    { label: "Exceptions", value: rows.filter((row) => row.holdSummary || row.lines.some((line) => line.allocationStatus === "SHORT")).length, view: "short" },
  ] };
}

export async function fulfilmentDetail(organisationId: string, id: string) {
  return db.fulfilmentRequirement.findFirst({ where: { id, organisationId }, include: { party: true, salesOrder: { select: { reference: true, customerPoReference: true, requestedDeliveryDate: true, promisedDeliveryDate: true } }, lines: true, tasks: { include: { lines: true }, orderBy: { createdAt: "desc" } }, packages: { include: { contents: true, parent: { select: { reference: true } } } } } });
}

export async function taskDetail(organisationId: string, id: string) {
  return db.warehouseTask.findFirst({ where: { id, organisationId }, include: { lines: { orderBy: { sequence: "asc" } }, requirement: { include: { party: true, salesOrder: { select: { reference: true, customerPoReference: true, requestedDeliveryDate: true, promisedDeliveryDate: true } }, packages: { include: { contents: true } } } }, wave: true } });
}

export async function dispatchBoard(organisationId: string) {
  const shipments = await db.shipment.findMany({ where: { organisationId, status: { notIn: ["CANCELLED", "DELIVERED"] } }, include: { party: { select: { name: true } }, packages: true }, orderBy: { plannedDispatchAt: "asc" }, take: 200 });
  const groups = new Map<string, number>();
  for (const shipment of shipments.filter((row) => ["READY", "LABELLED", "STAGED", "LOADED"].includes(row.status))) groups.set(shipment.carrierCode, (groups.get(shipment.carrierCode) ?? 0) + 1);
  return { shipments, groups: [...groups.entries()].map(([carrier, count]) => ({ carrier, count })), missed: shipments.filter((row) => row.status === "EXCEPTION").length, missingLabels: shipments.filter((row) => row.status === "READY").length };
}

export async function shipmentDetail(organisationId: string, id: string) {
  return db.shipment.findFirst({ where: { id, organisationId }, include: { party: true, packages: { include: { contents: true, children: true } }, sources: { include: { line: true, requirement: true } }, events: { orderBy: { occurredAt: "desc" } }, stops: true } });
}

export async function receiveBoard(organisationId: string) {
  return db.expectedReceipt.findMany({ where: { organisationId }, include: { lines: true, warehouse: true }, orderBy: { expectedOn: "asc" }, take: 100 });
}

export async function receiptDetail(organisationId: string, id: string) {
  return db.expectedReceipt.findFirst({ where: { id, organisationId }, include: { lines: true, warehouse: true } });
}

export async function returnsBoard(organisationId: string) {
  return db.returnAuthorisation.findMany({ where: { organisationId }, include: { party: { select: { name: true } }, lines: true }, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function returnDetail(organisationId: string, id: string) {
  return db.returnAuthorisation.findFirst({ where: { id, organisationId }, include: { party: true, lines: true } });
}

export async function loadDetail(organisationId: string, id: string) {
  return db.logisticsLoad.findFirst({ where: { id, organisationId }, include: { stops: { include: { shipment: { include: { packages: true } } }, orderBy: { sequence: "asc" } } } });
}

export async function reportBoard(organisationId: string, canSeeCost: boolean) {
  const since = new Date(); since.setDate(since.getDate() - 30);
  const [shipments, tasks, returns, requirements] = await Promise.all([
    db.shipment.findMany({ where: { organisationId, createdAt: { gte: since } }, include: { sources: true }, take: 500 }),
    db.warehouseTask.findMany({ where: { organisationId, createdAt: { gte: since } }, include: { lines: true }, take: 500 }),
    db.returnAuthorisation.findMany({ where: { organisationId, createdAt: { gte: since } }, include: { lines: true }, take: 200 }),
    db.fulfilmentRequirement.findMany({ where: { organisationId, status: { notIn: ["CANCELLED", "DELIVERED", "SHIPPED"] } }, take: 300 }),
  ]);
  const delivered = shipments.filter((row) => row.status === "DELIVERED");
  const measured = delivered.filter((row) => row.onTime !== null);
  const onTime = measured.filter((row) => row.onTime).length;
  const inFull = delivered.filter((row) => row.inFull).length;
  const otif = measured.filter((row) => row.onTime && row.inFull).length;
  const picks = tasks.filter((task) => task.kind === "PICK" && task.completedAt && task.startedAt);
  const hours = picks.reduce((sum, task) => sum + (task.completedAt!.getTime() - task.startedAt!.getTime()) / 3_600_000, 0);
  const lines = picks.reduce((sum, task) => sum + task.lines.length, 0);
  const wrong = tasks.reduce((sum, task) => sum + task.lines.filter((line) => line.exceptionReason === "Wrong product" || line.exceptionReason === "Wrong location").length, 0);
  const carriers = new Map<string, { shipments: number; cost: number; onTime: number; measured: number }>();
  for (const shipment of shipments) {
    const current = carriers.get(shipment.carrierCode) ?? { shipments: 0, cost: 0, onTime: 0, measured: 0 };
    current.shipments += 1;
    if (canSeeCost) current.cost += shipment.actualCostMinor ?? shipment.estimatedCostMinor ?? 0;
    if (shipment.onTime !== null) { current.measured += 1; if (shipment.onTime) current.onTime += 1; }
    carriers.set(shipment.carrierCode, current);
  }
  return {
    fulfilled: delivered.length,
    shipments: shipments.length,
    units: shipments.reduce((sum, row) => sum + row.sources.reduce((inner, source) => inner + source.quantity, 0), 0),
    backlog: requirements.length,
    otif: measured.length ? Math.round((otif / measured.length) * 100) : null,
    onTime: measured.length ? Math.round((onTime / measured.length) * 100) : null,
    inFull: delivered.length ? Math.round((inFull / delivered.length) * 100) : null,
    picksPerHour: hours > 0 ? Math.round((lines / hours) * 10) / 10 : null,
    exceptions: wrong,
    returns: returns.length,
    reasons: count(returns.map((row) => row.reason)),
    failures: count(delivered.map((row) => row.failureReason).filter((reason): reason is string => Boolean(reason))),
    carriers: [...carriers.entries()].map(([carrier, stats]) => ({ carrier, ...stats, cost: canSeeCost ? stats.cost : null })),
    freight: canSeeCost ? shipments.reduce((sum, row) => sum + (row.actualCostMinor ?? 0), 0) : null,
    cycleNote: "Cycle time is the gap from confirmation to release, pick, pack, dispatch and delivery. It appears on each order once those timestamps exist.",
  };
}

function count(values: string[]) {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export async function customerLogistics(organisationId: string, partyId: string) {
  const [open, last, next, returns, delivered] = await Promise.all([
    db.fulfilmentRequirement.count({ where: { organisationId, partyId, status: { notIn: ["CANCELLED", "DELIVERED", "SHIPPED"] } } }),
    db.shipment.findFirst({ where: { organisationId, partyId, deliveredAt: { not: null } }, orderBy: { deliveredAt: "desc" } }),
    db.fulfilmentRequirement.findFirst({ where: { organisationId, partyId, promisedOn: { not: null }, status: { notIn: ["CANCELLED", "DELIVERED", "SHIPPED"] } }, orderBy: { promisedOn: "asc" } }),
    db.returnAuthorisation.count({ where: { organisationId, partyId, status: { notIn: ["CLOSED", "REJECTED"] } } }),
    db.shipment.findMany({ where: { organisationId, partyId, status: "DELIVERED", onTime: { not: null } }, select: { onTime: true, inFull: true }, take: 100 }),
  ]);
  const otif = delivered.length ? Math.round((delivered.filter((row) => row.onTime && row.inFull).length / delivered.length) * 100) : null;
  return { open, last: last?.deliveredAt ?? null, next: next?.promisedOn ?? null, returns, otif };
}

export async function searchLogistics(session: Session, query: string) {
  const organisationId = session.organisationId;
  const text = query.trim();
  if (!text) return [];
  const commands = [
    [/waiting to pick|ready to pick/i, "Orders waiting to pick", "/logistics/fulfil?view=ready"],
    [/due today|dispatch/i, "Shipments due today", "/logistics/dispatch"],
    [/short/i, "Short picks", "/logistics/fulfil?view=short"],
    [/at risk/i, "Orders at risk", "/logistics/fulfil?view=risk"],
    [/return/i, "Returns", "/logistics/returns"],
    [/receive/i, "Receive", "/logistics/receive"],
  ].filter(([pattern]) => (pattern as RegExp).test(text)).map(([, title, href]) => ({ id: String(href), title: String(title), href: String(href), group: "Logistics" }));
  const [shipments, fulfilments, returns] = await Promise.all([
    db.shipment.findMany({ where: { organisationId, OR: [{ reference: { contains: text, mode: "insensitive" } }, { trackingNumber: { contains: text, mode: "insensitive" } }] }, take: 5 }),
    db.fulfilmentRequirement.findMany({ where: { organisationId, reference: { contains: text, mode: "insensitive" } }, take: 5 }),
    db.returnAuthorisation.findMany({ where: { organisationId, reference: { contains: text, mode: "insensitive" } }, take: 5 }),
  ]);
  return [
    ...commands,
    ...shipments.map((row) => ({ id: row.id, title: row.reference, subtitle: row.trackingNumber ?? row.status, href: `/logistics/shipments/${row.id}`, group: "Shipments" })),
    ...fulfilments.map((row) => ({ id: row.id, title: row.reference, subtitle: row.status, href: `/logistics/fulfil/${row.id}`, group: "Fulfilment" })),
    ...returns.map((row) => ({ id: row.id, title: row.reference, subtitle: row.status, href: `/logistics/returns/${row.id}`, group: "Returns" })),
  ];
}

export async function logisticsAttention(organisationId: string) {
  const board = await todayBoard(organisationId);
  return board.attention.slice(0, 5).map((item) => ({ id: item.href + item.label, label: item.label, href: item.href, severity: item.tone === "critical" ? "critical" as const : "warning" as const }));
}

export async function saveLogisticsView(session: Session, name: string, scope: string, definition: unknown) {
  if (!name.trim()) throw new Error("Name the view.");
  await db.logisticsSavedView.create({ data: { organisationId: session.organisationId, ownerUserId: scope === "COMPANY" ? null : session.userId, scope, name: name.trim(), definition: definition ?? {} } });
}
