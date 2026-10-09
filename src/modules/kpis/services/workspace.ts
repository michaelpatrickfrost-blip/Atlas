import { readGoalMeasure } from "./read-measure";
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { can } from "@/core/permissions/check";
import { isModuleEnabled } from "@/core/modules/runtime";
import { judgeGoal, type GoalDirection, type GoalVerdict, type MeasurePoint } from "@/modules/kpis/domain/progress";
import { goalWhere, planWhere } from "./access";

export type GoalMarker = {
  id: string;
  name: string;
  department: string;
  teamName: string;
  metricId: string;
  sliceLabel: string;
  direction: GoalDirection;
  target: number;
  unit: string;
  startsAt: string;
  endsAt: string;
  ownerName: string;
  score: { actual:number|null; verdict:GoalVerdict; summary:string; elapsed:number; currency?:string };
};

export type GoalCard = {
  id: string;
  name: string;
  notes: string;
  scope: string;
  visibility: string;
  department: string;
  teamName: string;
  metricId: string;
  metricName: string;
  metricDefinition: string;
  sourceNote?: string;
  sampleSize?: number;
  metricHref: string;
  sliceLabel: string;
  unit: string;
  direction: GoalDirection;
  target: number;
  current: number;
  personName: string;
  employeeId: string | null;
  planId: string | null;
  planTitle: string;
  planKind: string;
  support: string;
  status: string;
  ownerName: string;
  startsAt: string;
  endsAt: string;
  reviewOn: string | null;
  snapshot: boolean;
  currency?: string;
  points: MeasurePoint[];
  verdict: GoalVerdict;
  summary: string;
  elapsed: number;
  day: number;
  days: number;
  expected: number | null;
  actual: number | null;
  contextName?: string;
  contextActual: number | null;
  contextNote?: string;
  updates: { id: string; value: number|null; note: string; at: string; actor: string }[];
};

export type PlanCard = {
  id: string;
  kind: string;
  title: string;
  reason: string;
  support: string;
  status: string;
  personName: string;
  employeeId: string;
  ownerName: string;
  startOn: string;
  reviewOn: string;
  endOn: string;
  employeeComment: string;
  outcome: string;
  objectives: { goal: string; measure: string; support: string; by: string }[];
  reviews: { id: string; heldOn: string; progress: string; managerNotes: string; employeeNotes: string }[];
};

function directionOf(value: string): GoalDirection {
  return value === "AT_MOST" ? "AT_MOST" : "AT_LEAST";
}

function objectivesOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const goal = String(row.goal ?? "").trim();
    if (!goal) return [];
    return [{ goal, measure: String(row.measure ?? ""), support: String(row.support ?? ""), by: String(row.by ?? "") }];
  });
}

async function ownerNames(organisationId: string, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, string>();
  const people = await db.user.findMany({ where: { id: { in: unique }, memberships: { some: { organisationId } } }, select: { id: true, name: true } });
  return new Map(people.map((person) => [person.id, person.name]));
}

export async function loadGoalMarkers(session: Session, metricIds?:string[]): Promise<GoalMarker[]> {
  if (!can(session, "kpis.read")) return [];
  if (!(await isModuleEnabled(session, "kpis"))) return [];
  const rows = await db.kpi.findMany({
    where: { organisationId: session.organisationId, visibility: "COMPANY", status: "ACTIVE", metricId: metricIds?{in:metricIds}:{ not: "" } },
    orderBy: { endsAt: "asc" },
    take: 100,
  });
  const names = await ownerNames(session.organisationId, rows.map((row) => row.ownerUserId));
  const metrics=await getAnalyticsMetrics(session);const byMetric=new Map(metrics.map(m=>[m.id,m]));
  return Promise.all(rows.map(async row=>{
   const metric=byMetric.get(row.metricId);const reading=await readGoalMeasure(session,metric,row.startsAt,row.endsAt,row.sliceLabel);
   const judged=judgeGoal({actual:reading.actual,blocked:reading.blocked,target:row.target,direction:directionOf(row.direction),startsAt:row.startsAt,endsAt:row.endsAt,snapshot:metric?.snapshot,unit:row.unit,currency:reading.currency||row.sliceLabel});
   return {id:row.id,name:row.name,department:row.department,teamName:row.teamName,metricId:row.metricId,sliceLabel:row.sliceLabel,direction:directionOf(row.direction),target:row.target,unit:row.unit,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),ownerName:names.get(row.ownerUserId)??"Owner",score:{actual:reading.actual,verdict:judged.verdict,summary:judged.summary,elapsed:judged.elapsed,currency:reading.currency||row.sliceLabel}};
  }));
}

export async function loadGoalWorkspace(session: Session) {
  const [rows, plans, names] = await Promise.all([
    db.kpi.findMany({
      where: goalWhere(session),
      include: { updates: { orderBy: { createdAt: "desc" }, take: 12 } },
      orderBy: [{ status: "asc" }, { endsAt: "asc" }],
      take: 200,
    }),
    db.performancePlan.findMany({
      where: planWhere(session),
      include: { reviews: { orderBy: { heldOn: "desc" }, take: 8 } },
      orderBy: { endOn: "asc" },
      take: 100,
    }),
    db.membership.findMany({ where: { organisationId: session.organisationId }, select: { userId: true, user: { select: { name: true } } } }),
  ]);
  const nameOf = new Map(names.map((member) => [member.userId, member.user.name]));
  const metrics = await getAnalyticsMetrics(session).catch(() => []);
  const byMetric = new Map(metrics.map((metric) => [metric.id, metric]));
  const goals: GoalCard[] = await Promise.all(rows.map(async (row) => {
    const metric = row.metricId ? byMetric.get(row.metricId) : undefined;
    const live = row.visibility === "COMPANY" && Boolean(row.metricId);
    const reading = row.metricId ? await readGoalMeasure(session,metric,row.startsAt,row.endsAt,row.sliceLabel) : {points:[],actual:row.current,currency:undefined,blocked:undefined,sampleSize:undefined,note:undefined};
    const points=reading.points;
    const actual = live ? reading.actual : row.current;
    const judged = judgeGoal({
      actual: live && reading.blocked ? null : actual,
      blocked: live ? reading.blocked : undefined,
      target: row.target,
      direction: directionOf(row.direction),
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      snapshot: metric?.snapshot,
      unit: row.unit,
      currency: reading.currency || (row.unit === "money" ? row.sliceLabel : undefined),
    });
    return {
      id: row.id,
      name: row.name,
      notes: row.notes ?? "",
      scope: row.scope,
      visibility: row.visibility,
      department: row.department,
      teamName: row.teamName,
      metricId: row.metricId,
      metricName: metric?.name ?? "",
      metricDefinition: metric?.definition ?? "",
      sourceNote:reading.note,
      sampleSize:reading.sampleSize,
      metricHref: metric?.href ?? "",
      sliceLabel: row.sliceLabel,
      unit: row.unit,
      direction: directionOf(row.direction),
      target: row.target,
      current: row.current,
      personName: row.personName,
      employeeId: row.employeeId,
      planId: row.planId,
      planTitle: row.planTitle,
      planKind: row.planKind,
      support: row.support,
      status: row.status,
      ownerName: nameOf.get(row.ownerUserId) ?? "Owner",
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      reviewOn: row.reviewOn?.toISOString() ?? null,
      snapshot: Boolean(metric?.snapshot),
      currency: reading.currency || (row.unit === "money" ? row.sliceLabel : undefined),
      points: points.slice(0, 12),
      verdict: judged.verdict,
      summary: row.status === "CLOSED" ? `Closed. ${judged.summary}` : judged.summary,
      elapsed: judged.elapsed,
      day: judged.day,
      days: judged.days,
      expected: judged.expected,
      actual: live && reading.blocked ? null : actual,
      contextName: !live && metric ? metric.name : undefined,
      contextActual: !live && metric ? reading.actual : null,
      contextNote: !live && metric ? reading.blocked : undefined,
      updates: row.updates.map((update) => ({ id: update.id, value: live?null:update.value, note: update.note ?? "", at: update.createdAt.toISOString(), actor: nameOf.get(update.actorUserId) ?? "Someone" })),
    };
  }));
  const planCards: PlanCard[] = plans.map((plan) => ({
    id: plan.id,
    kind: plan.kind,
    title: plan.title,
    reason: plan.reason,
    support: plan.support ?? "",
    status: plan.status,
    personName: plan.personName,
    employeeId: plan.employeeId,
    ownerName: nameOf.get(plan.ownerUserId) ?? "Owner",
    startOn: plan.startOn.toISOString(),
    reviewOn: plan.reviewOn.toISOString(),
    endOn: plan.endOn.toISOString(),
    employeeComment: plan.employeeComment ?? "",
    outcome: plan.outcome ?? "",
    objectives: objectivesOf(plan.objectives),
    reviews: plan.reviews.map((review) => ({ id: review.id, heldOn: review.heldOn.toISOString(), progress: review.progress, managerNotes: review.managerNotes ?? "", employeeNotes: review.employeeNotes ?? "" })),
  }));
  return { goals, plans: planCards };
}

export async function loadMeasureChoices(session: Session) {
  const metrics=(await getAnalyticsMetrics(session)).filter(m=>m.goalQuery||m.snapshot);
  return Promise.all(metrics.map(async metric=>{
   const end=new Date(),start=new Date(end.getTime()-90*86400000);
   const reading=await readGoalMeasure(session,metric,start,end,"");
   return {id:metric.id,name:metric.name,subject:metric.subject,definition:metric.definition,grain:metric.grain,unit:metric.unit??"count",snapshot:metric.snapshot,href:metric.href,points:reading.points.slice(0,20),suggestion:metric.goalSuggestion,note:reading.note,blocked:reading.blocked};
  }));
}
export type MeasureChoice = Awaited<ReturnType<typeof loadMeasureChoices>>[number];
