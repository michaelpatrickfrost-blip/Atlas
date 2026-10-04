import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { PLAN_CAPABILITIES } from "@/core/permissions/capabilities";
import { planWhere } from "../domain/access";
import { metricByKey, planTypeLabel } from "../domain/catalogue";
import { buildInsights, capacityGap, combinePeriods, gap, LENS_SECTIONS, offTrack, quarterKey } from "../domain/engine";
import { liveActuals, productionPicture } from "./actuals";

export async function requirePlan(session: Session) {
  assertCapability(session, PLAN_CAPABILITIES.read);
  if (!await db.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "plan", enabled: true, entitled: true } })) throw new Error("Plan is not enabled for this company.");
}

function visible(session: Session) {
  return planWhere(session);
}

export async function enabledModules(organisationId: string) {
  const rows = await db.moduleState.findMany({ where: { organisationId, enabled: true, entitled: true }, select: { moduleId: true } });
  return new Set(rows.map((row) => row.moduleId));
}

export async function planList(session: Session) {
  await requirePlan(session);
  return db.businessPlan.findMany({ where: visible(session), orderBy: { updatedAt: "desc" }, include: { reviews: { where: { status: { not: "completed" } }, take: 1 }, _count: { select: { actions: { where: { status: "open" } }, shares: true } } }, take: 100 });
}

export async function planRecord(session: Session, id: string) {
  await requirePlan(session);
  const plan = await db.businessPlan.findFirst({
    where: { id, ...visible(session) },
    include: {
      versions: { orderBy: { createdAt: "asc" } },
      measures: { orderBy: { sortOrder: "asc" } },
      cells: true,
      assumptions: { orderBy: { createdAt: "asc" } },
      drivers: true,
      blocks: { orderBy: { sortOrder: "asc" } },
      goals: { orderBy: { title: "asc" } },
      initiatives: true,
      actions: { orderBy: { dueOn: "asc" } },
      risks: true,
      dependencies: true,
      decisions: { orderBy: { decidedOn: "desc" } },
      comments: { orderBy: { createdAt: "desc" }, take: 40 },
      reviews: { orderBy: { scheduledFor: "asc" } },
      updates: { orderBy: { createdAt: "desc" }, take: 20 },
      notes: { orderBy: { createdAt: "desc" }, take: 40 },
      shares: { orderBy: { createdAt: "asc" } },
      lenses: true,
      modelLinks: true,
      sourceLinks: { orderBy: { createdAt: "desc" }, take: 8 },
      children: { select: { id: true, name: true, planType: true } },
    },
  });
  if (!plan) throw new Error("That plan is not available.");
  const seeScenarios = session.capabilities.has(PLAN_CAPABILITIES.scenarioShare) || session.capabilities.has(PLAN_CAPABILITIES.approve);
  plan.versions = plan.versions.filter((version) => version.kind !== "scenario" || version.shared || version.ownerUserId === session.userId || seeScenarios);
  const versionIds = new Set(plan.versions.map((version) => version.id));
  plan.cells = plan.cells.filter((cell) => versionIds.has(cell.versionId));
  plan.lenses = plan.lenses.filter((lens) => !lens.ownerUserId || lens.ownerUserId === session.userId);
  return plan;
}

export async function planHome(session: Session) {
  const plans = await planList(session);
  const focus = plans.find((plan) => plan.planType === "company" && plan.status !== "archived") ?? plans.find((plan) => plan.status !== "archived") ?? null;
  const reviews = plans.flatMap((plan) => plan.reviews.map((review) => ({ ...review, planName: plan.name, planId: plan.id }))).slice(0, 6);
  if (!focus) return { plans, focus: null, cards: [], attention: [], reviews, picture: null };
  const record = await planRecord(session, focus.id);
  const enabled = await enabledModules(session.organisationId);
  const actuals = await liveActuals(session, record.measures.map((measure) => measure.metricKey), record.periodStart, record.periodEnd, enabled);
  const working = record.versions.find((version) => version.kind === "forecast") ?? record.versions[0];
  const baseline = record.versions.find((version) => version.kind === "baseline" && version.status === "approved");
  const cards = record.measures.slice(0, 4).map((measure) => {
    const metric = metricByKey(measure.metricKey);
    const planCells = record.cells.filter((cell) => cell.versionId === (baseline ?? working)?.id && cell.metricKey === measure.metricKey && cell.kind === "plan" && cell.dimensionKey === "");
    const forecastCells = record.cells.filter((cell) => cell.versionId === working?.id && cell.metricKey === measure.metricKey && cell.kind === "forecast" && cell.dimensionKey === "");
    const plan = combinePeriods(planCells.map((cell) => ({ ...cell, value: Number(cell.value) })), metric?.aggregation ?? "sum").value;
    const forecast = combinePeriods(forecastCells.map((cell) => ({ ...cell, value: Number(cell.value) })), metric?.aggregation ?? "sum").value;
    return { key: measure.metricKey, name: metric?.name ?? measure.metricKey, unit: metric?.unit ?? "count", direction: metric?.direction ?? "higher", plan, forecast, actual: actuals[measure.metricKey]?.value ?? null, note: actuals[measure.metricKey]?.note ?? "" };
  });
  const overdue = record.actions.filter((action) => action.status === "open" && action.dueOn && action.dueOn < new Date()).length;
  const attention = buildInsights({ measures: cards, capacity: [], overdueActions: overdue, approvals: plans.filter((plan) => plan.status === "submitted").length });
  const demand = cards.find((card) => card.key === "production_demand");
  const capacity = cards.find((card) => card.key === "production_capacity");
  if (demand && capacity && capacityGap(demand.plan, capacity.plan) != null && (capacityGap(demand.plan, capacity.plan) ?? 0) < 0) attention.unshift({ tone: "watch", title: "Production demand is above capacity", detail: "Both figures are the ones entered on this plan." });
  return { plans, focus: record, cards, attention, reviews, picture: await productionPicture(session, record.periodStart, record.periodEnd, enabled) };
}

export function lensSections(lens: string | undefined, saved: string[] | null) {
  if (saved?.length) return saved;
  return LENS_SECTIONS[lens ?? "executive"] ?? LENS_SECTIONS.executive;
}

export function cellValue(cells: Array<{ versionId: string; metricKey: string; periodKey: string; dimensionKey: string; kind: string; value: unknown }>, versionId: string | undefined, metricKey: string, periodKey: string, dimensionKey: string, kind: string) {
  const cell = cells.find((item) => item.versionId === versionId && item.metricKey === metricKey && item.periodKey === periodKey && item.dimensionKey === dimensionKey && item.kind === kind);
  return cell ? Number(cell.value) : null;
}

export function quarterTotals(values: Array<{ periodKey: string; value: number | null }>, method: "sum" | "average" | "none") {
  const groups = new Map<string, number[]>();
  for (const value of values) {
    const quarter = quarterKey(value.periodKey);
    if (!quarter || value.value == null) continue;
    groups.set(quarter, [...(groups.get(quarter) ?? []), value.value]);
  }
  return [...groups.entries()].map(([key, rows]) => ({ key, value: method === "none" ? null : method === "average" ? rows.reduce((total, row) => total + row, 0) / rows.length : rows.reduce((total, row) => total + row, 0) }));
}

export function searchPlanText(query: string, entries: Array<{ title: string; detail: string; href: string }>) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return entries.filter((entry) => words.every((word) => `${entry.title} ${entry.detail}`.toLowerCase().includes(word))).slice(0, 12);
}

export async function planColleagues(session: Session) {
  const rows = await db.membership.findMany({
    where: { organisationId: session.organisationId, active: true, userId: { not: session.userId } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
    take: 200,
  });
  return rows.map((row) => ({ userId: row.userId, name: row.user.name }));
}

export async function memberNames(organisationId: string, userIds: string[]) {
  if (!userIds.length) return new Map<string, string>();
  const users = await db.user.findMany({
    where: { id: { in: userIds }, memberships: { some: { organisationId, active: true } } },
    select: { id: true, name: true },
  });
  return new Map(users.map((user) => [user.id, user.name]));
}

export { gap, offTrack, planTypeLabel };
