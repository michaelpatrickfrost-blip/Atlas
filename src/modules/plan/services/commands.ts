"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { PLAN_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { canEditPlan, planWhere } from "../domain/access";
import { briefFields, briefText } from "../domain/commercial";
import { metricByKey, planTypeLabel, templateFor, type MetricUnit } from "../domain/catalogue";
import { applyScenario, distribute, editAllowed, explainDriver, parsePlanningNumber, planWindow, promoteForecast, type PlanCell } from "../domain/engine";
import { pointOnWindow } from "../domain/timeline";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/plan", "layout");
}

async function enabled(session: Session) {
  await assertModuleEnabled(session, "plan");
}

function day(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
}

async function opened(session: Session, planId: string) {
  await enabled(session);
  const plan = await db.businessPlan.findFirst({ where: { id: planId, ...planWhere(session) }, include: { versions: true, cells: true, modelLinks: true, measures: true, shares: true } });
  if (!plan) throw new Error("That plan is not available.");
  return plan;
}

async function owned(session: Session, planId: string) {
  const plan = await opened(session, planId);
  if (plan.locked) throw new Error("This plan is locked. Unlock it before editing.");
  if (!canEditPlan(plan, session.userId)) throw new Error("This plan is shared with you to read. Ask the owner if you need to change it.");
  return plan;
}

function workingVersion(versions: Array<{ id: string; kind: string; status: string }>) {
  return versions.find((version) => version.kind === "forecast" && ["draft", "active"].includes(version.status)) ?? versions.find((version) => version.kind === "forecast");
}

function cellsOf(rows: Array<{ versionId: string; metricKey: string; periodKey: string; dimensionKey: string; kind: string; value: unknown }>, versionId: string): PlanCell[] {
  return rows.filter((row) => row.versionId === versionId && (row.kind === "plan" || row.kind === "forecast")).map((row) => ({ metricKey: row.metricKey, periodKey: row.periodKey, dimensionKey: row.dimensionKey, kind: row.kind as "plan" | "forecast", value: Number(row.value) }));
}

export async function createPlan(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.create);
  await enabled(session);
  const type = text(form, "type") || "custom";
  const template = templateFor(type);
  const window = planWindow({ mode: text(form, "mode") as "year" | "quarter" | "custom", year: Number(text(form, "year")), quarter: Number(text(form, "quarter")), start: text(form, "start"), end: text(form, "end") });
  const sensitive = form.get("sensitive") === "on";
  const parentId = text(form, "parent");
  if (parentId && !await db.businessPlan.findFirst({ where: { id: parentId, ...planWhere(session) } })) throw new Error("Choose a plan you can open.");
  if (sensitive && !session.capabilities.has(PLAN_CAPABILITIES.sensitiveRead)) throw new Error("This plan contains sensitive figures, which your access does not include.");
  const chosen = form.getAll("metric").map(String).filter((key) => metricByKey(key));
  const metrics = (form.has("measuresChosen") ? chosen : chosen.length ? chosen : template.metricKeys).filter((key) => {
    const metric = metricByKey(key);
    return metric && (!metric.sensitive || sensitive);
  });
  const links = form.getAll("link").map(String);
  const name = text(form, "name") || `${window.label} ${planTypeLabel(type)} plan`;
  const plan = await db.$transaction(async (tx) => {
    const created = await tx.businessPlan.create({
      data: {
        organisationId: session.organisationId,
        name,
        purpose: text(form, "purpose") || template.purpose,
        planType: type,
        ownerUserId: session.userId,
        ownerName: session.userName,
        teamName: text(form, "team"),
        periodLabel: window.label,
        periodStart: new Date(`${window.start}T00:00:00Z`),
        periodEnd: new Date(`${window.end}T00:00:00Z`),
        sensitive,
        audience: "private",
        parentPlanId: parentId || null,
      },
    });
    const version = await tx.planVersion.create({ data: { organisationId: session.organisationId, planId: created.id, name: "Working forecast", kind: "forecast", status: "draft", ownerUserId: session.userId, shared: true } });
    if (metrics.length) await tx.planMeasure.createMany({ data: metrics.map((metricKey, sortOrder) => ({ organisationId: session.organisationId, planId: created.id, metricKey, sortOrder })) });
    const blocks = ["summary", "chart", "table", "assumptions", "drivers", "goals", "actions", "risks", "decisions", "production"].map((kind, sortOrder) => ({ organisationId: session.organisationId, planId: created.id, kind, title: kind, sortOrder }));
    await tx.planBlock.createMany({ data: blocks });
    if (template.assumptions.length) await tx.planAssumption.createMany({ data: template.assumptions.map((assumption) => ({ organisationId: session.organisationId, planId: created.id, versionId: version.id, name: assumption.name, note: assumption.note })) });
    if (form.get("starterWork") === "on" && template.goals.length) await tx.planGoal.createMany({ data: template.goals.map((goal) => ({ organisationId: session.organisationId, planId: created.id, title: goal.title, targetText: goal.targetText, metricKey: goal.metricKey, qualitative: goal.qualitative ?? false, detail: goal.detail ?? "", ownerName: session.userName, startsOn: new Date(`${window.start}T00:00:00Z`), endsOn: new Date(`${window.end}T00:00:00Z`) })) });
    for (const phase of form.get("starterWork") === "on" ? template.phases ?? [] : []) {
      const initiative = await tx.planInitiative.create({ data: { organisationId: session.organisationId, planId: created.id, title: phase.title, detail: phase.detail, ownerName: session.userName, startsOn: new Date(`${pointOnWindow(window.start, window.end, phase.start)}T00:00:00Z`), endsOn: new Date(`${pointOnWindow(window.start, window.end, phase.end)}T00:00:00Z`) } });
      if (phase.actions.length) await tx.planAction.createMany({ data: phase.actions.map((action) => ({ organisationId: session.organisationId, planId: created.id, initiativeId: initiative.id, title: action.title, detail: action.detail, ownerName: session.userName, startsOn: new Date(`${pointOnWindow(window.start, window.end, action.start)}T00:00:00Z`), dueOn: new Date(`${pointOnWindow(window.start, window.end, action.end)}T00:00:00Z`) })) });
    }
    await tx.planReview.create({ data: { organisationId: session.organisationId, planId: created.id, title: template.cadence, agenda: ["Performance", "Variance", "Risks", "Actions", "Decisions", "Forecast"] } });
    for (const raw of links) {
      const [fromKey, toKey, rate] = raw.split("|");
      if (!metricByKey(fromKey) || !metricByKey(toKey) || !Number.isFinite(Number(rate))) continue;
      await tx.planModelLink.create({ data: { organisationId: session.organisationId, planId: created.id, fromKey, toKey, passthrough: Number(rate), note: "Kept when the plan was created." } });
    }
    return created;
  });
  await writeActivity({ organisationId: session.organisationId, type: "plan.created", summary: `${name} created`, entityType: "BusinessPlan", entityId: plan.id });
  refresh();
  revalidatePath("/plan", "layout");
  redirect(`/plan/plans/${plan.id}`);
}

export async function saveCell(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  if (plan.locked && !session.capabilities.has(PLAN_CAPABILITIES.lock)) throw new Error("This plan is locked.");
  const metric = metricByKey(text(form, "metric"));
  if (!metric) throw new Error("Choose a measure Atlas knows.");
  const kind = text(form, "kind") === "forecast" ? "forecast" : "plan";
  const periodKey = text(form, "period");
  const dimensionKey = text(form, "dimension").toLowerCase();
  const dimensionLabel = text(form, "dimensionLabel") || text(form, "dimension");
  const baseline = plan.versions.some((version) => version.kind === "baseline" && version.status === "approved");
  let version = kind === "plan" && baseline
    ? plan.versions.find((item) => item.kind === "revision" && item.status === "draft")
    : workingVersion(plan.versions);
  if (kind === "plan" && baseline && !version) {
    const approved = plan.versions.find((item) => item.kind === "baseline" && item.status === "approved");
    version = await db.planVersion.create({ data: { organisationId: session.organisationId, planId: plan.id, name: "Proposed revision", kind: "revision", status: "draft", ownerUserId: session.userId, shared: true, basedOnId: approved?.id } });
    const copies = cellsOf(plan.cells, approved?.id ?? "").filter((cell) => cell.kind === "plan");
    if (copies.length) await db.planCell.createMany({ data: copies.map((cell) => ({ organisationId: session.organisationId, planId: plan.id, versionId: version!.id, ...cell, updatedByName: session.userName })) });
  }
  if (!version) throw new Error("This plan has no working forecast.");
  const refusal = editAllowed({ planLocked: false, lockedPeriods: plan.lockedPeriods, periodKey, versionKind: version.kind, versionStatus: version.status });
  if (refusal) throw new Error(refusal);
  const parsed = parsePlanningNumber(text(form, "value"), metric.unit as MetricUnit);
  const where = { versionId: version.id, metricKey: metric.key, periodKey, dimensionKey, kind };
  if (parsed == null) {
    await db.planCell.deleteMany({ where: { ...where, organisationId: session.organisationId, planId: plan.id } });
  } else {
    await db.planCell.upsert({
      where: { versionId_metricKey_periodKey_dimensionKey_kind: where },
      create: { organisationId: session.organisationId, planId: plan.id, ...where, dimensionLabel, value: parsed, updatedByName: session.userName },
      update: { value: parsed, dimensionLabel, updatedByName: session.userName },
    });
  }
  if (kind === "plan") await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "plan.target.changed", entityType: "BusinessPlan", entityId: plan.id, after: { metric: metric.name, period: periodKey, value: parsed } });
  await db.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { revision: { increment: 1 } } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addMeasure(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const metric = metricByKey(text(form, "metric"));
  if (!metric) throw new Error("Choose one of the listed measures. Nothing was added.");
  if (metric.sensitive && !plan.sensitive) throw new Error("Mark the plan as sensitive before adding this measure.");
  const count = plan.measures.length;
  await db.planMeasure.upsert({ where: { planId_metricKey: { planId: plan.id, metricKey: metric.key } }, create: { organisationId: session.organisationId, planId: plan.id, metricKey: metric.key, sortOrder: count }, update: {} });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addAssumption(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const version = workingVersion(plan.versions);
  if (!version) throw new Error("This plan has no working forecast.");
  const name = text(form, "name");
  if (!name) throw new Error("Name the assumption.");
  await db.planAssumption.create({ data: { organisationId: session.organisationId, planId: plan.id, versionId: version.id, name, valueText: text(form, "value"), note: text(form, "note"), effectiveOn: text(form, "effective") ? new Date(`${text(form, "effective")}T00:00:00Z`) : null, series: text(form, "series") ? text(form, "series").split(",").map((part) => { const [label, value] = part.split("="); return { label: label?.trim(), value: value?.trim() }; }).filter((row) => row.label) : [] } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "plan.assumption.changed", entityType: "BusinessPlan", entityId: plan.id, after: { name } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addDriver(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const version = workingVersion(plan.versions);
  if (!version) throw new Error("This plan has no working forecast.");
  const inputs = [1, 2, 3, 4].flatMap((index) => {
    const label = text(form, `label${index}`);
    const value = Number(text(form, `value${index}`));
    return label && Number.isFinite(value) ? [{ label, value }] : [];
  });
  const explained = explainDriver(inputs);
  if ("error" in explained) throw new Error(explained.error);
  await db.planDriver.create({ data: { organisationId: session.organisationId, planId: plan.id, versionId: version.id, name: text(form, "name") || "Driver", outputLabel: text(form, "output") || "Result", outputUnit: text(form, "unit") || "count", inputs } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addLink(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.modelManage);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const fromKey = text(form, "from");
  const toKey = text(form, "to");
  const passthrough = Number(text(form, "passthrough"));
  if (!metricByKey(fromKey) || !metricByKey(toKey) || fromKey === toKey || !Number.isFinite(passthrough)) throw new Error("Choose two different measures and how much of the change passes through.");
  await db.planModelLink.upsert({ where: { planId_fromKey_toKey: { planId: plan.id, fromKey, toKey } }, create: { organisationId: session.organisationId, planId: plan.id, fromKey, toKey, passthrough, note: text(form, "note") }, update: { passthrough, note: text(form, "note") } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "plan.model.changed", entityType: "BusinessPlan", entityId: plan.id, after: { from: fromKey, to: toKey, passthrough } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function createScenario(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.scenarioCreate);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const base = workingVersion(plan.versions);
  if (!base) throw new Error("This plan has no working forecast.");
  const name = text(form, "name");
  if (!name) throw new Error("Name the scenario.");
  const metricKey = text(form, "metric");
  const percent = Number(text(form, "percent"));
  const baseCells = cellsOf(plan.cells, base.id);
  let nextCells = baseCells;
  if (metricKey) {
    if (!Number.isFinite(percent)) throw new Error("Enter the percentage change.");
    const applied = applyScenario(baseCells, plan.modelLinks.map((link) => ({ fromKey: link.fromKey, toKey: link.toKey, passthrough: Number(link.passthrough) })), { metricKey, percent });
    if (applied.cycle) throw new Error(`This connection loops: ${applied.cycle.join(" → ")}`);
    if (applied.skipped.includes(metricKey)) throw new Error("Enter a forecast for that measure before the scenario can scale it.");
    nextCells = applied.cells;
  }
  const scenario = await db.planVersion.create({ data: { organisationId: session.organisationId, planId: plan.id, name, kind: "scenario", status: "draft", shared: false, ownerUserId: session.userId, basedOnId: base.id, note: text(form, "note") } });
  if (nextCells.length) await db.planCell.createMany({ data: nextCells.map((cell) => ({ organisationId: session.organisationId, planId: plan.id, versionId: scenario.id, ...cell, updatedByName: session.userName })) });
  await writeActivity({ organisationId: session.organisationId, type: "plan.scenario.created", summary: `${name} created`, entityType: "BusinessPlan", entityId: plan.id });
  refresh();
  revalidatePath("/plan", "layout");
  redirect(`/plan/plans/${plan.id}?scenario=${scenario.id}`);
}

export async function promoteScenario(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.approve);
  await enabled(session);
  const plan = await opened(session, text(form, "planId"));
  const scenario = plan.versions.find((version) => version.id === text(form, "scenarioId") && version.kind === "scenario");
  const working = workingVersion(plan.versions);
  if (!scenario || !working) throw new Error("Choose a scenario on this plan.");
  if (plan.locked) throw new Error("Unlock the plan before promoting a scenario.");
  const baseline = cellsOf(plan.cells, plan.versions.find((version) => version.kind === "baseline" && version.status === "approved")?.id ?? "");
  const promoted = promoteForecast(baseline, cellsOf(plan.cells, working.id).filter((cell) => cell.kind === "forecast"), cellsOf(plan.cells, scenario.id).filter((cell) => cell.kind === "forecast"));
  if (baseline.some((cell, index) => cell !== promoted.baselinePlan[index])) throw new Error("The approved plan was left unchanged.");
  await db.$transaction(async (tx) => {
    for (const cell of promoted.workingForecast) {
      await tx.planCell.upsert({
        where: { versionId_metricKey_periodKey_dimensionKey_kind: { versionId: working.id, metricKey: cell.metricKey, periodKey: cell.periodKey, dimensionKey: cell.dimensionKey, kind: "forecast" } },
        create: { organisationId: session.organisationId, planId: plan.id, versionId: working.id, metricKey: cell.metricKey, periodKey: cell.periodKey, dimensionKey: cell.dimensionKey, kind: "forecast", value: cell.value, updatedByName: session.userName },
        update: { value: cell.value, updatedByName: session.userName },
      });
    }
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "plan.scenario.promoted", entityType: "BusinessPlan", entityId: plan.id, after: { scenario: scenario.name } });
  await writeActivity({ organisationId: session.organisationId, type: "plan.scenario.promoted", summary: `${scenario.name} promoted to the forecast`, entityType: "BusinessPlan", entityId: plan.id });
  await emit(DOMAIN_EVENTS.planScenarioPromoted, { organisationId: session.organisationId, planId: plan.id });
  await db.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { revision: { increment: 1 } } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function submitPlan(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.submit);
  await enabled(session);
  const plan = await opened(session, text(form, "planId"));
  await db.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { status: "submitted" } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "plan.submitted", entityType: "BusinessPlan", entityId: plan.id, after: { name: plan.name } });
  await writeActivity({ organisationId: session.organisationId, type: "plan.submitted", summary: `${plan.name} submitted`, entityType: "BusinessPlan", entityId: plan.id });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function approvePlan(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.approve);
  await enabled(session);
  const plan = await opened(session, text(form, "planId"));
  const revision = plan.versions.find((version) => version.kind === "revision" && version.status === "draft");
  const source = revision ?? workingVersion(plan.versions);
  if (!source) throw new Error("There is nothing to approve.");
  const planCells = cellsOf(plan.cells, source.id).filter((cell) => cell.kind === "plan");
  await db.$transaction(async (tx) => {
    await tx.planVersion.updateMany({ where: { organisationId: session.organisationId, planId: plan.id, kind: "baseline", status: "approved" }, data: { status: "superseded" } });
    const baseline = await tx.planVersion.create({ data: { organisationId: session.organisationId, planId: plan.id, name: `${plan.periodLabel} baseline`, kind: "baseline", status: "approved", ownerUserId: session.userId, shared: true, approvedAt: new Date(), basedOnId: source.id } });
    if (planCells.length) await tx.planCell.createMany({ data: planCells.map((cell) => ({ organisationId: session.organisationId, planId: plan.id, versionId: baseline.id, ...cell, updatedByName: session.userName })) });
    if (revision) await tx.planVersion.updateMany({ where: { id: revision.id, organisationId: session.organisationId }, data: { status: "approved" } });
    await tx.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { status: "active" } });
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "plan.approved", entityType: "BusinessPlan", entityId: plan.id, after: { name: plan.name } });
  await writeActivity({ organisationId: session.organisationId, type: "plan.approved", summary: `${plan.name} approved`, entityType: "BusinessPlan", entityId: plan.id });
  await emit(DOMAIN_EVENTS.planApproved, { organisationId: session.organisationId, planId: plan.id });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function lockPlan(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.lock);
  await enabled(session);
  const plan = await opened(session, text(form, "planId"));
  const locking = text(form, "unlock") !== "1";
  await db.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { locked: locking } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: locking ? "plan.locked" : "plan.unlocked", entityType: "BusinessPlan", entityId: plan.id, after: { name: plan.name } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addGoal(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const title = text(form, "title");
  if (!title) throw new Error("Name the goal.");
  await db.planGoal.create({ data: { organisationId: session.organisationId, planId: plan.id, parentId: text(form, "parent") || null, title, ownerName: text(form, "owner") || session.userName, targetText: text(form, "target"), detail: text(form, "detail"), metricKey: text(form, "metric") || null, qualitative: form.get("qualitative") === "on", startsOn: day(text(form, "start")), endsOn: day(text(form, "end")) } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addInitiative(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const title = text(form, "title");
  if (!title) throw new Error("Name the initiative.");
  await db.planInitiative.create({ data: { organisationId: session.organisationId, planId: plan.id, goalId: text(form, "goal") || null, title, detail: text(form, "detail"), ownerName: text(form, "owner") || session.userName, projectId: text(form, "project") || null, startsOn: day(text(form, "start")), endsOn: day(text(form, "end")) } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function createProjectForInitiative(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  assertCapability(session, "projects.manage");
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const initiative = await db.planInitiative.findFirst({ where: { id: text(form, "initiativeId"), organisationId: session.organisationId, planId: plan.id } });
  if (!initiative) throw new Error("That initiative is not on this plan.");
  if (!await db.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "projects", enabled: true, entitled: true } })) throw new Error("Projects is not enabled.");
  const memberIds = [...new Set([session.userId, ...plan.shares.map((share) => share.userId)])];
  const project = await db.project.create({ data: { organisationId: session.organisationId, name: initiative.title, reference: `PRJ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, ownerUserId: session.userId, notes: `From ${plan.name}. ${initiative.detail || plan.purpose}`.slice(0, 2000), visibility: plan.audience === "company" ? "COMPANY" : "PRIVATE", members: { create: memberIds.map((userId) => ({ organisationId: session.organisationId, userId, role: userId === session.userId ? "OWNER" : "MEMBER" })) } } });
  await db.planInitiative.updateMany({ where: { id: initiative.id, organisationId: session.organisationId }, data: { projectId: project.id } });
  await writeActivity({ organisationId: session.organisationId, type: "plan.project.created", summary: `${initiative.title} opened as a project`, entityType: "BusinessPlan", entityId: plan.id });
  refresh();
  revalidatePath("/plan", "layout");
  redirect(`/projects/${project.id}`);
}

export async function addAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const title = text(form, "title");
  if (!title) throw new Error("Name the action.");
  await db.planAction.create({ data: { organisationId: session.organisationId, planId: plan.id, initiativeId: text(form, "initiative") || null, title, detail: text(form, "detail"), ownerName: text(form, "owner") || session.userName, startsOn: day(text(form, "start")), dueOn: day(text(form, "due")) } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function completeAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  await db.planAction.updateMany({ where: { id: text(form, "actionId"), organisationId: session.organisationId, planId: plan.id }, data: { status: "done" } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addRisk(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const title = text(form, "title");
  if (!title) throw new Error("Name the risk.");
  await db.planRisk.create({ data: { organisationId: session.organisationId, planId: plan.id, title, impactText: text(form, "impact"), metricKey: text(form, "metric") || null, severity: text(form, "severity") || "watch" } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addDependency(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  await db.planDependency.create({ data: { organisationId: session.organisationId, planId: plan.id, title: text(form, "title") || "Dependency", dependsOnPlanId: text(form, "dependsOn") || null, note: text(form, "note") } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addDecision(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const title = text(form, "title");
  const reason = text(form, "reason");
  if (!title || !reason) throw new Error("Record the decision and the reason.");
  await db.planDecision.create({ data: { organisationId: session.organisationId, planId: plan.id, title, reason, impact: text(form, "impact"), ownerName: text(form, "owner") || session.userName, decidedOn: text(form, "date") ? new Date(`${text(form, "date")}T00:00:00Z`) : new Date() } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "plan.decision.recorded", entityType: "BusinessPlan", entityId: plan.id, after: { title } });
  await writeActivity({ organisationId: session.organisationId, type: "plan.decision.recorded", summary: title, entityType: "BusinessPlan", entityId: plan.id });
  await emit(DOMAIN_EVENTS.planDecisionRecorded, { organisationId: session.organisationId, planId: plan.id });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addComment(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const body = text(form, "body");
  if (!body) throw new Error("Write the note.");
  await db.planComment.create({ data: { organisationId: session.organisationId, planId: plan.id, targetType: text(form, "targetType") || "plan", targetKey: text(form, "targetKey"), body, authorName: session.userName } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addUpdate(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const summary = text(form, "summary");
  if (!summary) throw new Error("Write the update.");
  await db.planUpdate.create({ data: { organisationId: session.organisationId, planId: plan.id, tone: text(form, "tone") || "watch", summary, detail: text(form, "detail"), actionsText: text(form, "actions"), authorName: session.userName } });
  await writeActivity({ organisationId: session.organisationId, type: "plan.update.published", summary: `${plan.name}: ${summary}`.slice(0, 180), entityType: "BusinessPlan", entityId: plan.id });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function completeReview(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.review);
  await enabled(session);
  const plan = await opened(session, text(form, "planId"));
  const review = await db.planReview.findFirst({ where: { id: text(form, "reviewId"), organisationId: session.organisationId, planId: plan.id } });
  if (!review) throw new Error("That review is not on this plan.");
  if (review.status === "completed") throw new Error("This review already has a snapshot.");
  const visible = new Set(plan.versions.filter((version) => version.kind !== "scenario" || version.shared || version.ownerUserId === session.userId || session.capabilities.has(PLAN_CAPABILITIES.scenarioShare) || session.capabilities.has(PLAN_CAPABILITIES.approve)).map((version) => version.id));
  const snapshot = { takenAt: new Date().toISOString(), cells: plan.cells.filter((cell) => visible.has(cell.versionId)).map((cell) => ({ versionId: cell.versionId, metricKey: cell.metricKey, periodKey: cell.periodKey, dimensionKey: cell.dimensionKey, kind: cell.kind, value: Number(cell.value) })) };
  await db.planReview.updateMany({ where: { id: review.id, organisationId: session.organisationId, status: { not: "completed" } }, data: { status: "completed", completedAt: new Date(), snapshot } });
  await writeActivity({ organisationId: session.organisationId, type: "plan.review.completed", summary: `${review.title} completed`, entityType: "BusinessPlan", entityId: plan.id });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addReview(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const title = text(form, "title");
  if (!title) throw new Error("Name the review.");
  await db.planReview.create({ data: { organisationId: session.organisationId, planId: plan.id, title, scheduledFor: text(form, "date") ? new Date(`${text(form, "date")}T00:00:00Z`) : null, agenda: ["Performance", "Variance", "Risks", "Actions", "Decisions", "Forecast"] } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function distributeTargets(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const metric = metricByKey(text(form, "metric"));
  const version = workingVersion(plan.versions);
  if (!metric || !version) throw new Error("Choose a measure on the working forecast.");
  const total = parsePlanningNumber(text(form, "total"), metric.unit);
  if (total == null) throw new Error("Enter the total to split.");
  const buckets = text(form, "rows").split(",").map((part) => part.trim()).filter(Boolean).map((part) => {
    const [key, weight] = part.split("=");
    return { key: key.trim(), weight: weight == null ? undefined : Number(weight) };
  });
  const method = text(form, "method") as "equal" | "share" | "capacity" | "driver";
  const split = distribute(total, buckets, method === "equal" ? "equal" : method);
  if ("error" in split) throw new Error(split.error);
  const periodKey = text(form, "period") || plan.periodLabel;
  for (const row of split.rows) {
    await db.planCell.upsert({
      where: { versionId_metricKey_periodKey_dimensionKey_kind: { versionId: version.id, metricKey: metric.key, periodKey, dimensionKey: row.key.toLowerCase(), kind: "plan" } },
      create: { organisationId: session.organisationId, planId: plan.id, versionId: version.id, metricKey: metric.key, periodKey, dimensionKey: row.key.toLowerCase(), dimensionLabel: row.key, kind: "plan", value: row.value, updatedByName: session.userName },
      update: { value: row.value, dimensionLabel: row.key, updatedByName: session.userName },
    });
  }
  await db.planComment.create({ data: { organisationId: session.organisationId, planId: plan.id, targetType: "metric", targetKey: metric.key, body: `${split.method}. ${split.rows.map((row) => `${row.key} ${row.value}`).join(", ")}`, authorName: session.userName } });
  await db.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { revision: { increment: 1 } } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function importGrid(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  await enabled(session);
  const plan = await owned(session, text(form, "planId"));
  const version = workingVersion(plan.versions);
  if (!version || plan.locked) throw new Error("The working forecast is not open for import.");
  const lines = text(form, "grid").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.toLowerCase().startsWith("metric"));
  const errors: string[] = [];
  const rows: Array<{ metricKey: string; periodKey: string; dimensionKey: string; dimensionLabel: string; kind: "plan" | "forecast"; value: number }> = [];
  lines.forEach((line, index) => {
    const [metricKey, periodKey, dimension, kindText, valueText] = line.split(",").map((part) => part.trim());
    const metric = metricByKey(metricKey);
    const kind = kindText === "forecast" ? "forecast" : kindText === "plan" ? "plan" : null;
    const value = metric ? parsePlanningNumber(valueText ?? "", metric.unit) : null;
    if (!metric || !periodKey || !kind || value == null) errors.push(`Line ${index + 1} needs measure, period, kind and value.`);
    else if (metric.sensitive && !plan.sensitive) errors.push(`Line ${index + 1} is a sensitive measure. Mark the plan sensitive first.`);
    else rows.push({ metricKey, periodKey, dimensionKey: (dimension ?? "").toLowerCase(), dimensionLabel: dimension ?? "", kind, value });
  });
  if (errors.length) throw new Error(errors.slice(0, 6).join(" "));
  for (const row of rows) {
    await db.planMeasure.upsert({ where: { planId_metricKey: { planId: plan.id, metricKey: row.metricKey } }, create: { organisationId: session.organisationId, planId: plan.id, metricKey: row.metricKey }, update: {} });
    await db.planCell.upsert({
      where: { versionId_metricKey_periodKey_dimensionKey_kind: { versionId: version.id, metricKey: row.metricKey, periodKey: row.periodKey, dimensionKey: row.dimensionKey, kind: row.kind } },
      create: { organisationId: session.organisationId, planId: plan.id, versionId: version.id, ...row, updatedByName: session.userName },
      update: { value: row.value, updatedByName: session.userName },
    });
  }
  await db.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { revision: { increment: 1 } } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function sharePlan(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  const plan = await opened(session, text(form, "planId"));
  if (plan.ownerUserId !== session.userId) throw new Error("The owner shares this plan.");
  const userId = text(form, "userId");
  if (!userId || userId === plan.ownerUserId) throw new Error("Choose someone else in this company.");
  if (!await db.membership.findFirst({ where: { organisationId: session.organisationId, userId, active: true } })) throw new Error("Choose someone in this company.");
  const access = text(form, "access") === "edit" ? "edit" : "view";
  await db.planShare.upsert({
    where: { planId_userId: { planId: plan.id, userId } },
    create: { organisationId: session.organisationId, planId: plan.id, userId, access, sharedByUserId: session.userId },
    update: { access },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "plan.shared", entityType: "BusinessPlan", entityId: plan.id, after: { userId, access } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function unsharePlan(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  const plan = await opened(session, text(form, "planId"));
  if (plan.ownerUserId !== session.userId) throw new Error("The owner shares this plan.");
  await db.planShare.deleteMany({ where: { id: text(form, "shareId"), organisationId: session.organisationId, planId: plan.id } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function setPlanAudience(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  const plan = await opened(session, text(form, "planId"));
  if (plan.ownerUserId !== session.userId) throw new Error("The owner shares this plan.");
  const audience = text(form, "audience") === "company" ? "company" : "private";
  await db.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { audience } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: audience === "company" ? "plan.shared.company" : "plan.made.private", entityType: "BusinessPlan", entityId: plan.id, after: { audience } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function addNote(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  const plan = await owned(session, text(form, "planId"));
  const title = text(form, "title");
  const body = text(form, "body");
  if (!title || !body) throw new Error("Give the note a title and the detail.");
  await db.planNote.create({ data: { organisationId: session.organisationId, planId: plan.id, title, body, authorUserId: session.userId, authorName: session.userName } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function saveGoalProgress(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  const plan = await owned(session, text(form, "planId"));
  const progressNote = text(form, "progress");
  if (!progressNote) throw new Error("Write what changed on this goal.");
  await db.planGoal.updateMany({ where: { id: text(form, "goalId"), organisationId: session.organisationId, planId: plan.id }, data: { progressNote } });
  refresh();
  revalidatePath("/plan", "layout");
}

export async function savePlanBrief(form: FormData) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.edit);
  const plan = await owned(session, text(form, "planId"));
  const fields = briefFields(plan.planType);
  if (!fields.length) throw new Error("This plan does not use that brief.");
  const brief: Record<string, string> = {};
  for (const [key] of fields) brief[key] = text(form, key).slice(0, 4000);
  const previous = Object.fromEntries(fields.map(([key]) => [key, briefText(plan.brief, key)]));
  await db.businessPlan.updateMany({ where: { id: plan.id, organisationId: session.organisationId }, data: { brief: { ...previous, ...brief } } });
  refresh();
  revalidatePath("/plan", "layout");
}
