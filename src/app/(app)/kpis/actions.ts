"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import { db } from "@/core/db/client";
import { goalDate as dateOnly, GoalInputError } from "@/modules/kpis/domain/input";
import { readGoalMeasure, validateGoalSelection } from "@/modules/kpis/services/read-measure";
import { canEditConduct, employeeInConductScope } from "@/modules/people/services/conduct-access";
import { goalWhere, planWhere } from "@/modules/kpis/services/access";
import { leadIdsFor } from "@/modules/kpis/services/leads";

const kinds = ["department", "team", "personal", "pip", "development"] as const;
type Kind = (typeof kinds)[number];

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}
function refresh() {
  for (const path of ["/kpis", "/home", "/analytics", "/profile", "/people/me", "/people"]) revalidatePath(path);
}

async function memberName(organisationId: string, userId: string) {
  const membership = await db.membership.findFirst({ where: { organisationId, userId, active:true }, select: { user: { select: { name: true } } } });
  if (!membership) throw new GoalInputError("Choose an owner in this company.");
  return membership.user.name;
}

async function personRecord(organisationId: string, employeeId: string) {
  const employee = await db.employee.findFirst({
    where: { id: employeeId, organisationId },
    select: { id: true, userId: true, firstName: true, lastName: true, jobTitle: true, department: true, manager: { select: { userId: true } } },
  });
  if (!employee) throw new GoalInputError("Choose a person in this company.");
  return employee;
}

function readKind(value: string): Kind {
  if (!(kinds as readonly string[]).includes(value)) throw new GoalInputError("Choose what kind of goal this is.");
  return value as Kind;
}

function readTarget(raw: string, money: boolean) {
  const value = Number(raw);
  if (!raw.trim() || !Number.isFinite(value) || value < 0) throw new GoalInputError("Enter a target of zero or more.");
  const stored=money?Math.round(value*100):value;
  if(!Number.isFinite(stored)||Math.abs(stored)>Number.MAX_SAFE_INTEGER)throw new GoalInputError("Enter a target within the supported numeric range.");
  return stored;
}

export async function createKpi(form: FormData) {
  const session=await requireSession();assertCapability(session,"kpis.manage");
  form.set("kind", "team");
  return saveGoal(form);
}

export async function saveGoal(form: FormData) {
 const session=await requireSession();assertCapability(session,"core.profile.self");
 try {return await saveGoalInternal(session,form);}catch(error){if(error instanceof GoalInputError)return {error:error.message};throw error;}
}
async function saveGoalInternal(session:Awaited<ReturnType<typeof requireSession>>,form: FormData) {
  const kind = readKind(text(form, "kind"));
  const personal = kind === "personal" || kind === "pip" || kind === "development";
  if (personal) await assertModuleEnabled(session, "people");
  else {
    assertCapability(session, "kpis.manage");
    await assertModuleEnabled(session, "kpis");
  }
  const name = text(form, "name");
  const notes = text(form, "notes");
  const direction = text(form, "direction") === "AT_MOST" ? "AT_MOST" : "AT_LEAST";
  const startsAt = dateOnly(text(form, "startsAt"));
  const endsAt = dateOnly(text(form, "endsAt"));
  if (endsAt < startsAt) throw new GoalInputError("The end date needs to be on or after the start.");
  const reviewText = text(form, "reviewOn");
  const reviewOn = reviewText ? dateOnly(reviewText) : null;
  const ownerUserId = text(form, "ownerUserId") || session.userId;
  await memberName(session.organisationId, ownerUserId);
  const metricId = text(form, "metricId");
  const sliceLabel = text(form, "sliceLabel").slice(0, 200);
  const metrics = metricId ? await getAnalyticsMetrics(session) : [];
  const metric = metrics.find((item) => item.id === metricId);
  if (metricId && !metric) throw new GoalInputError("Choose a measure you are allowed to see.");
  if (kind === "department" && !metric) throw new GoalInputError("A department goal needs a live measure from that app.");
  let unit = metric?.unit ?? (text(form, "unit").slice(0, 30) || "count");
  const target = readTarget(text(form, "target"), unit === "money");
  if (metric) {
    validateGoalSelection(metric,sliceLabel);
    if(metric.unit==="percent"&&target>100)throw new GoalInputError("A percentage target must be between 0 and 100.");
    unit = metric.unit ?? "count";
  }
  if (!name || name.length > 150) throw new GoalInputError("Give the goal a name of 150 characters or fewer.");
  if (notes.length > 2000) throw new GoalInputError("Keep the description under 2,000 characters.");

  if (!personal) {
    const teamName = (text(form, "teamName") || metric?.subject || "Company").slice(0, 100);
    if (!teamName) throw new GoalInputError("Name the team.");
    const goal = await db.kpi.create({
      data: {
        organisationId: session.organisationId,
        name, teamName, ownerUserId, unit, direction, target, startsAt, endsAt, notes: notes || null, reviewOn,
        scope: kind === "department" ? "DEPARTMENT" : "TEAM",
        visibility: "COMPANY",
        department: teamName,
        metricId: metric?.id ?? "",
        sliceLabel,
        status: "ACTIVE",
      },
    });
    await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpi.created", entityType: "Kpi", entityId: goal.id, after: { scope: goal.scope, metricId: goal.metricId, target } } });
    refresh();
    redirect(`/kpis/${goal.id}`);
  }

  const employeeId = text(form, "employeeId");
  const self = text(form, "self") === "1";
  const employee = await personRecord(session.organisationId, employeeId);
  if (self) {
    if (employee.userId !== session.userId) throw new GoalInputError("You can only set a personal goal for yourself.");
    if (kind !== "personal") throw new GoalInputError("A performance plan is set by a manager or HR.");
  } else if (employee.userId === session.userId) {
    throw new GoalInputError("You cannot put yourself on a performance plan.");
  } else if (!can(session, "kpis.manage")) {
    await employeeInConductScope(session, employee.id, "edit");
  }
  const leads = await leadIdsFor(session.organisationId, employee, ownerUserId);
  const personName = `${employee.firstName} ${employee.lastName}`.trim();
  const support = text(form, "support");
  if (support.length > 4000) throw new GoalInputError("Keep the support under 4,000 characters.");

  if (kind === "personal") {
    const goal = await db.kpi.create({
      data: {
        organisationId: session.organisationId, name, teamName: employee.department || "Personal", ownerUserId, unit, direction, target, startsAt, endsAt,
        notes: notes || null, reviewOn, scope: "PERSONAL", visibility: "PRIVATE", department: employee.department || "", metricId: metric?.id ?? "", sliceLabel,
        employeeId: employee.id, personName, support, status: "ACTIVE", leadUserIds: leads,
      },
    });
    await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpi.created", entityType: "Kpi", entityId: goal.id, after: { scope: "PERSONAL", employeeId: employee.id, target } } });
    refresh();
    revalidatePath(`/people/${employee.id}`);
    redirect(`/kpis/${goal.id}`);
  }

  const reason = text(form, "reason");
  if (reason.length < 10 || reason.length > 4000) throw new GoalInputError("Explain why this plan is needed, in at least a short sentence.");
  const title = (text(form, "planTitle") || (kind === "pip" ? "Performance improvement plan" : "Development plan")).slice(0, 160);
  const planReview = reviewOn ?? endsAt;
  if (planReview < startsAt || endsAt < planReview) throw new GoalInputError("Put the review on or after the start, and the end on or after the review.");
  const planKind = kind === "pip" ? "PIP" : "DEVELOPMENT";
  const objective = { goal: name, measure: notes || metric?.name || "Recorded on the goal", support, by: text(form, "endsAt") };
  const plan = await db.performancePlan.create({
    data: {
      organisationId: session.organisationId, employeeId: employee.id, ownerUserId, title, reason, support: support || null,
      startOn: startsAt, reviewOn: planReview, endOn: endsAt, status: "ACTIVE", kind: planKind, personName, leadUserIds: leads,
      objectives: [objective],
      goals: {
        create: {
          organisationId: session.organisationId, name, teamName: employee.department || "Personal", ownerUserId, unit, direction, target, startsAt, endsAt,
          notes: notes || null, reviewOn: planReview, scope: planKind, visibility: "PRIVATE", department: employee.department || "", metricId: metric?.id ?? "", sliceLabel,
          employeeId: employee.id, personName, planTitle: title, planKind, support, status: "ACTIVE", leadUserIds: leads,
        },
      },
    },
    include: { goals: { select: { id: true } } },
  });
  await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpi.plan.opened", entityType: "PerformancePlan", entityId: plan.id, after: { kind: planKind, employeeId: employee.id } } });
  refresh();
  revalidatePath(`/people/${employee.id}`);
  redirect(`/kpis/plans/${plan.id}`);
}

async function visibleGoal(session: Awaited<ReturnType<typeof requireSession>>, id: string) {
  const goal = await db.kpi.findFirst({
    where: { AND: [goalWhere(session), { id }] },
    include: { employee: { select: { userId: true, manager: { select: { userId: true } } } } },
  });
  if (!goal || goal.organisationId !== session.organisationId) throw new Error("That goal is not available to you.");
  return goal;
}

function canRecord(session: Awaited<ReturnType<typeof requireSession>>, goal: { visibility: string; ownerUserId: string; leadUserIds: string[]; employee: { userId: string | null; manager: { userId: string | null } | null } | null }) {
  if (can(session, "kpis.manage") || can(session, HR.conductManage)) return true;
  if (goal.ownerUserId === session.userId || goal.employee?.userId === session.userId || goal.employee?.manager?.userId === session.userId) return true;
  return goal.visibility === "PRIVATE" && goal.leadUserIds.includes(session.userId);
}

export async function updateKpi(id: string, form: FormData) {
  await recordProgress(id, form);
}

export async function recordProgress(id: string, form: FormData) {
  const session = await requireSession();
  const goal = await visibleGoal(session, id);
  if (goal.status === "CLOSED") throw new Error("This goal is closed.");
  if (!canRecord(session, goal)) throw new Error("You cannot update this goal.");
  const note = text(form, "note").slice(0, 2000);
  const live = goal.visibility === "COMPANY" && goal.metricId;
  let value = Number(form.get("value"));
  if (live) {
    if (!note) throw new Error("Add a note. The number itself comes from the live measure.");
    const metrics = await getAnalyticsMetrics(session);
    const metric = metrics.find(item=>item.id===goal.metricId);
    const reading=await readGoalMeasure(session,metric,goal.startsAt,goal.endsAt,goal.sliceLabel);
    if(reading.blocked||reading.actual===null)throw new Error("The live source has no available reading. Try again after checking the source.");
    value=reading.actual;
  } else if (!Number.isFinite(value) || value < 0) throw new Error("Enter the current figure.");
  await db.kpi.update({
    where: { id: goal.id },
    data: { current: live ? goal.current : value, updates: { create: { value, note: note || null, actorUserId: session.userId } } },
  });
  await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpi.updated", entityType: "Kpi", entityId: goal.id, after: { value } } });
  refresh();
  if (goal.employeeId) revalidatePath(`/people/${goal.employeeId}`);
}

export async function closeGoal(id: string) {
  const session = await requireSession();
  const goal = await visibleGoal(session, id);
  const ownPersonal = goal.scope === "PERSONAL" && goal.employee?.userId === session.userId;
  if (!can(session, "kpis.manage") && !can(session, HR.conductManage) && goal.ownerUserId !== session.userId && !ownPersonal) throw new Error("You cannot close this goal.");
  await db.kpi.update({ where: { id: goal.id }, data: { status: "CLOSED" } });
  await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpi.closed", entityType: "Kpi", entityId: goal.id, after: { status: "CLOSED" } } });
  refresh();
}

export async function addPlanGoal(planId: string, form: FormData) {
  const session = await requireSession();
  if (!can(session, "kpis.manage") && !canEditConduct(session)) throw new Error("You cannot add a goal to this plan.");
  const plan = await db.performancePlan.findFirst({ where: { AND: [planWhere(session), { id: planId }] } });
  if (!plan) throw new Error("That plan is not available to you.");
  if (!can(session, "kpis.manage")) await employeeInConductScope(session, plan.employeeId, "edit");
  const name = text(form, "name");
  const notes = text(form, "notes");
  if (!name || name.length > 150) throw new Error("Give the goal a name.");
  const startsAt = plan.startOn;
  const endsAt = plan.endOn;
  const direction = text(form, "direction") === "AT_MOST" ? "AT_MOST" : "AT_LEAST";
  const metricId = text(form, "metricId");
  const metrics = metricId ? await getAnalyticsMetrics(session) : [];
  const metric = metrics.find((item) => item.id === metricId);
  if (metricId && !metric) throw new Error("Choose a measure you are allowed to see.");
  const unit = metric?.unit ?? (text(form, "unit").slice(0, 30) || "count");
  const target = readTarget(text(form, "target"), unit === "money");
  const sliceLabel = text(form, "sliceLabel").slice(0, 200);
  const objective = { goal: name, measure: notes || metric?.name || "Recorded on the goal", support: plan.support ?? "", by: plan.endOn.toISOString().slice(0, 10) };
  const current = Array.isArray(plan.objectives) ? plan.objectives : [];
  await db.performancePlan.update({
    where: { id: plan.id },
    data: {
      objectives: [...current, objective],
      goals: {
        create: {
          organisationId: session.organisationId, name, teamName: "Personal", ownerUserId: session.userId, unit, direction, target, startsAt, endsAt,
          notes: notes || null, reviewOn: plan.reviewOn, scope: plan.kind, visibility: "PRIVATE", department: "", metricId: metric?.id ?? "", sliceLabel,
          employeeId: plan.employeeId, personName: plan.personName, planTitle: plan.title, planKind: plan.kind, support: plan.support ?? "", status: "ACTIVE", leadUserIds: plan.leadUserIds,
        },
      },
    },
  });
  await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpi.created", entityType: "PerformancePlan", entityId: plan.id, after: { name } } });
  refresh();
  revalidatePath(`/people/${plan.employeeId}`);
}

export async function closePlan(planId: string, form: FormData) {
  const session = await requireSession();
  const plan = await db.performancePlan.findFirst({ where: { AND: [planWhere(session), { id: planId }] } });
  if (!plan) throw new Error("That plan is not available to you.");
  if (!can(session, "kpis.manage")) await employeeInConductScope(session, plan.employeeId, "edit");
  const outcome = text(form, "outcome");
  if (outcome.length > 4000) throw new Error("Keep the outcome under 4,000 characters.");
  const status = text(form, "status");
  const next = status === "ACHIEVED" || status === "NOT_MET" || status === "CLOSED" ? status : "CLOSED";
  await db.performancePlan.update({ where: { id: plan.id }, data: { status: next, outcome: outcome || null, goals: { updateMany: { where: { status: "ACTIVE" }, data: { status: "CLOSED" } } } } });
  await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpi.plan.closed", entityType: "PerformancePlan", entityId: plan.id, after: { status: next } } });
  refresh();
  revalidatePath(`/people/${plan.employeeId}`);
}

export async function commentOnPlan(planId: string, form: FormData) {
  const session = await requireSession();
  const plan = await db.performancePlan.findFirst({ where: { AND: [planWhere(session), { id: planId }] }, select: { id: true, employeeId: true } });
  if (!plan) throw new Error("That plan is not available to you.");
  const employee = await db.employee.findFirst({ where: { id: plan.employeeId, organisationId: session.organisationId }, select: { userId: true } });
  if (employee?.userId !== session.userId) throw new Error("Only the person on this plan can add their own comment.");
  const employeeComment = text(form, "employeeComment");
  if (employeeComment.length > 4000) throw new Error("Keep the comment under 4,000 characters.");
  await db.performancePlan.update({ where: { id: plan.id }, data: { employeeComment } });
  refresh();
}

/** Connect an existing shared goal without replacing its identity or history. */
export async function connectGoal(id:string,form:FormData){
 const session=await requireSession();assertCapability(session,"kpis.manage");
 await assertModuleEnabled(session,"kpis");
 try{
  const goal=await db.kpi.findFirst({where:{id,organisationId:session.organisationId,visibility:"COMPANY",status:"ACTIVE"}});
  if(!goal)throw new Error("Goal unavailable.");
  const metric=(await getAnalyticsMetrics(session)).find(m=>m.id===text(form,"metricId"));if(!metric)throw new GoalInputError("Choose a source you are allowed to read.");
  const slice=text(form,"sliceLabel").slice(0,200);validateGoalSelection(metric,slice);
  const target=readTarget(text(form,"target"),metric.unit==="money");if(metric.unit==="percent"&&target>100)throw new GoalInputError("A percentage target must be between 0 and 100.");
  if(text(form,"expectedConnection")!==JSON.stringify([goal.metricId,goal.sliceLabel,goal.target,goal.unit]))throw new GoalInputError("The source changed in another window. Reload before connecting.");
  await db.$transaction(async tx=>{
   const changed=await tx.kpi.updateMany({where:{id:goal.id,organisationId:session.organisationId,metricId:goal.metricId,sliceLabel:goal.sliceLabel,target:goal.target,unit:goal.unit,status:"ACTIVE"},data:{metricId:metric.id,sliceLabel:slice,unit:metric.unit??"count",target}});
   if(!changed.count)throw new GoalInputError("The goal changed in another window. Reload before connecting.");
   await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"kpi.source.connected",entityType:"Kpi",entityId:goal.id,before:{metricId:goal.metricId,target:goal.target,unit:goal.unit},after:{metricId:metric.id,sliceLabel:slice,target,unit:metric.unit??"count"}}});
  });
  refresh();revalidatePath(`/kpis/${goal.id}`);return {saved:true};
 }catch(error){if(error instanceof GoalInputError)return {error:error.message};throw error;}
}
