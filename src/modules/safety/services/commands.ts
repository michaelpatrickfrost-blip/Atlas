"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { DOMAIN_EVENTS, emit } from "@/core/events/bus";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import type { Prisma } from "@/generated/prisma/client";
import { DEFAULT_FIVE_BY_FIVE, explainRisk, FOUR_BY_FOUR, QUALITATIVE_MATRIX, THREE_BY_THREE, type RiskMatrixConfig } from "../domain/matrix";
import { GB_OBLIGATION_TEMPLATES, GB_SAFETY_TEMPLATE_VERSION } from "../domain/localisation";
import { PROFILE_FEATURES, SENSITIVE_RECORD_KINDS, nextCapa, suggestedInvestigationDepth } from "../domain/work";
import { workplaceInput, WorkplaceValidationError } from "../domain/workplace";
import { assistRiddor, riddorDecisionComplete } from "../domain/riddor";
import { nextSafetyReference } from "./numbers";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function optional(form: FormData, key: string) {
  return text(form, key) || null;
}
function flag(form: FormData, key: string) {
  const value = form.get(key);
  return value === "on" || value === "yes" || value === "true";
}
function when(form: FormData, key: string) {
  const value = text(form, key);
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid date.");
  return date;
}
function whole(form: FormData, key: string) {
  const value = text(form, key);
  if (!value) return null;
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`${key} must be a whole number.`);
  return number;
}

function matrixChoice(key: string): RiskMatrixConfig {
  if (key === "3") return THREE_BY_THREE;
  if (key === "4") return FOUR_BY_FOUR;
  if (key === "qualitative") return QUALITATIVE_MATRIX;
  return DEFAULT_FIVE_BY_FIVE;
}

async function activeMatrix(organisationId: string) {
  const matrix = await db.safetyMatrix.findFirst({ where: { organisationId, active: true }, orderBy: { createdAt: "desc" } });
  return { id: matrix?.id ?? null, config: (matrix?.config as RiskMatrixConfig | undefined) ?? DEFAULT_FIVE_BY_FIVE };
}

export async function saveSafetyProfile(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.profileManage);
  const operatingProfile = text(formData, "profile");
  const preset = PROFILE_FEATURES[operatingProfile];
  if (!preset) throw new Error("Choose the kind of workplace.");
  const features = [...new Set([...preset.features, ...formData.getAll("feature").map(String)])];
  const jurisdiction = text(formData, "jurisdiction") || "GB";
  await db.$transaction(async (tx) => {
    await tx.safetyProfile.upsert({
      where: { organisationId: session.organisationId },
      create: { organisationId: session.organisationId, operatingProfile, features, jurisdiction, anonymousReports: flag(formData, "anonymousReports") },
      update: { operatingProfile, features, jurisdiction, anonymousReports: flag(formData, "anonymousReports") },
    });
    const existingMatrix = await tx.safetyMatrix.findFirst({ where: { organisationId: session.organisationId, active: true } });
    if (!existingMatrix) {
      await tx.safetyMatrix.create({ data: { organisationId: session.organisationId, name: "Default 5×5", config: DEFAULT_FIVE_BY_FIVE as Prisma.InputJsonValue } });
    }
    if (jurisdiction === "GB") {
      const already = await tx.safetyObligation.count({ where: { organisationId: session.organisationId, ruleVersion: GB_SAFETY_TEMPLATE_VERSION } });
      if (!already) {
        await tx.safetyObligation.createMany({
          data: GB_OBLIGATION_TEMPLATES.map((item) => ({ ...item, organisationId: session.organisationId, ruleVersion: GB_SAFETY_TEMPLATE_VERSION, status: "TO_CONFIRM" })),
        });
      }
    }
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.profile.saved", entityType: "SafetyProfile", entityId: session.organisationId, after: { operatingProfile, features } });
  revalidatePath("/safety");
}

export async function saveRiskMatrix(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.profileManage);
  const config = matrixChoice(text(formData, "size"));
  const name = config.qualitative ? "Qualitative" : `${config.likelihoodLabels.length}×${config.severityLabels.length}`;
  await db.$transaction(async (tx) => {
    await tx.safetyMatrix.updateMany({ where: { organisationId: session.organisationId, active: true }, data: { active: false } });
    await tx.safetyMatrix.create({ data: { organisationId: session.organisationId, name, config: config as Prisma.InputJsonValue, active: true } });
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.matrix.saved", entityType: "SafetyMatrix", entityId: session.organisationId, after: { name } });
  revalidatePath("/safety/risk");
}

export async function createRisk(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riskCreate);
  const title = text(formData, "title");
  const hazard = text(formData, "hazard");
  if (!title || !hazard) throw new Error("Name the risk and the hazard.");
  const risk = await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "risk", "RSK");
    const created = await tx.safetyRisk.create({
      data: {
        organisationId: session.organisationId,
        reference,
        title,
        category: text(formData, "category") || "Other",
        ownerUserId: session.userId,
        assessments: {
          create: {
            organisationId: session.organisationId,
            revision: 1,
            hazard,
            whoHarmed: text(formData, "whoHarmed"),
            howHarmed: text(formData, "howHarmed"),
            existingControls: text(formData, "existingControls"),
            authorUserId: session.userId,
            changeReason: "First revision",
          },
        },
      },
    });
    return created;
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.risk.created", entityType: "SafetyRisk", entityId: risk.id, after: { reference: risk.reference } });
  await emit(DOMAIN_EVENTS.safetyRiskCreated, { organisationId: session.organisationId, riskId: risk.id });
  revalidatePath("/safety");
  redirect(`/safety/risk/${risk.id}`);
}

export async function addControl(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riskCreate);
  const assessmentId = text(formData, "assessmentId");
  const description = text(formData, "description");
  const hierarchy = text(formData, "hierarchy");
  if (!description) throw new Error("Describe the control.");
  const assessment = await db.safetyAssessment.findFirst({ where: { id: assessmentId, organisationId: session.organisationId } });
  if (!assessment || assessment.status === "APPROVED" || assessment.status === "SUPERSEDED") throw new Error("Add controls on the draft revision. Approved history is kept as it was.");
  await db.safetyControl.create({ data: { organisationId: session.organisationId, assessmentId, hierarchy, description, inPlace: flag(formData, "inPlace") } });
  revalidatePath(`/safety/risk/${assessment.riskId}`);
}

export async function rateAssessment(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riskCreate);
  const assessmentId = text(formData, "assessmentId");
  const assessment = await db.safetyAssessment.findFirst({ where: { id: assessmentId, organisationId: session.organisationId } });
  if (!assessment || assessment.status !== "DRAFT") throw new Error("Only a draft revision can be rated. Start a new revision to change an approved assessment.");
  const matrix = await activeMatrix(session.organisationId);
  const initial = explainRisk(matrix.config, whole(formData, "initialLikelihood"), whole(formData, "initialSeverity"), optional(formData, "initialQualitative"));
  const residual = explainRisk(matrix.config, whole(formData, "residualLikelihood"), whole(formData, "residualSeverity"), optional(formData, "residualQualitative"));
  await db.safetyAssessment.update({
    where: { id: assessment.id },
    data: {
      matrixId: matrix.id,
      initialLikelihood: initial.score == null ? null : whole(formData, "initialLikelihood"),
      initialSeverity: initial.score == null ? null : whole(formData, "initialSeverity"),
      initialRating: initial.label,
      initialExplanation: initial.explanation,
      residualLikelihood: residual.score == null ? null : whole(formData, "residualLikelihood"),
      residualSeverity: residual.score == null ? null : whole(formData, "residualSeverity"),
      residualRating: residual.label,
      residualExplanation: residual.explanation,
      responsibleUserId: optional(formData, "responsibleUserId") ?? session.userId,
      targetDate: when(formData, "targetDate"),
      reviewDate: when(formData, "reviewDate"),
      evidenceNote: optional(formData, "evidenceNote"),
    },
  });
  revalidatePath(`/safety/risk/${assessment.riskId}`);
}

export async function approveAssessment(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riskApprove);
  const assessmentId = text(formData, "assessmentId");
  const assessment = await db.safetyAssessment.findFirst({ where: { id: assessmentId, organisationId: session.organisationId }, include: { controls: true } });
  if (!assessment || assessment.status !== "DRAFT") throw new Error("This revision is not waiting for approval.");
  if (!assessment.initialRating || !assessment.residualRating) throw new Error("Record the initial and residual risk before approval.");
  if (!assessment.reviewDate) throw new Error("Set the next review date.");
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.safetyAssessment.updateMany({
      where: { organisationId: session.organisationId, riskId: assessment.riskId, status: "APPROVED" },
      data: { status: "SUPERSEDED", effectiveTo: now },
    });
    await tx.safetyAssessment.update({
      where: { id: assessment.id },
      data: { status: "APPROVED", approverUserId: session.userId, reviewerUserId: optional(formData, "reviewerUserId"), approvedAt: now, effectiveFrom: now },
    });
    await tx.safetyRisk.update({ where: { id: assessment.riskId }, data: { status: "CONTROLLED" } });
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.risk.approved", entityType: "SafetyAssessment", entityId: assessment.id, after: { revision: assessment.revision } });
  await emit(DOMAIN_EVENTS.safetyRiskApproved, { organisationId: session.organisationId, riskId: assessment.riskId, assessmentId: assessment.id });
  revalidatePath(`/safety/risk/${assessment.riskId}`);
}

export async function reviseAssessment(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riskCreate);
  const riskId = text(formData, "riskId");
  const reason = text(formData, "changeReason");
  if (reason.length < 4) throw new Error("Say why this revision is needed.");
  const current = await db.safetyAssessment.findFirst({ where: { organisationId: session.organisationId, riskId, status: "APPROVED" }, orderBy: { revision: "desc" }, include: { controls: true } });
  const latest = current ?? await db.safetyAssessment.findFirst({ where: { organisationId: session.organisationId, riskId }, orderBy: { revision: "desc" }, include: { controls: true } });
  if (!latest) throw new Error("There is no assessment to revise.");
  const openDraft = await db.safetyAssessment.findFirst({ where: { organisationId: session.organisationId, riskId, status: "DRAFT" } });
  if (openDraft) throw new Error("Finish the open draft before starting another revision.");
  await db.$transaction(async (tx) => {
    const created = await tx.safetyAssessment.create({
      data: {
        organisationId: session.organisationId,
        riskId,
        revision: latest.revision + 1,
        hazard: latest.hazard,
        whoHarmed: latest.whoHarmed,
        howHarmed: latest.howHarmed,
        existingControls: latest.existingControls,
        authorUserId: session.userId,
        changeReason: reason,
        matrixId: latest.matrixId,
      },
    });
    if (latest.controls.length) {
      await tx.safetyControl.createMany({
        data: latest.controls.map((control) => ({ organisationId: session.organisationId, assessmentId: created.id, hierarchy: control.hierarchy, description: control.description, inPlace: control.inPlace })),
      });
    }
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.risk.revised", entityType: "SafetyRisk", entityId: riskId, after: { changeReason: reason } });
  revalidatePath(`/safety/risk/${riskId}`);
}

export async function requestRiskReview(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riskCreate);
  const riskId = text(formData, "riskId");
  const reason = text(formData, "reason");
  const risk = await db.safetyRisk.findFirst({ where: { id: riskId, organisationId: session.organisationId } });
  if (!risk) throw new Error("That risk is not in this company.");
  await db.safetyReviewRequest.create({ data: { organisationId: session.organisationId, riskId, reason, sourceType: optional(formData, "sourceType"), sourceId: optional(formData, "sourceId") } });
  await db.safetyRisk.update({ where: { id: riskId }, data: { status: "REVIEW_DUE" } });
  await emit(DOMAIN_EVENTS.safetyRiskReviewRequired, { organisationId: session.organisationId, riskId, reason });
  revalidatePath(`/safety/risk/${riskId}`);
}

export async function reportIncident(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.incidentReport);
  const summary = text(formData, "summary");
  if (summary.length < 4) throw new Error("Say what happened.");
  const kind = text(formData, "kind") || "NEAR_MISS";
  const profile = await db.safetyProfile.findUnique({ where: { organisationId: session.organisationId } });
  const anonymous = flag(formData, "anonymous");
  if (anonymous && !profile?.anonymousReports) throw new Error("This company has not enabled anonymous reporting.");
  const confidential = kind === "INJURY" || kind === "ILL_HEALTH" || flag(formData, "confidential");
  const incident = await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "incident", "INC");
    return tx.safetyIncident.create({
      data: {
        organisationId: session.organisationId,
        reference,
        kind,
        summary,
        whereLabel: optional(formData, "where"),
        occurredAt: when(formData, "occurredAt") ?? new Date(),
        reportedByUserId: anonymous ? null : session.userId,
        involvedLabel: optional(formData, "involved"),
        immediateDanger: flag(formData, "immediateDanger"),
        anyoneStillAtRisk: flag(formData, "anyoneStillAtRisk"),
        isolationRequired: flag(formData, "isolationRequired"),
        areaClosureRequired: flag(formData, "areaClosureRequired"),
        firstAidRequired: flag(formData, "firstAidRequired"),
        emergencyServicesRequired: flag(formData, "emergencyServicesRequired"),
        managementNotified: flag(formData, "managementNotified"),
        actualConsequence: text(formData, "actualConsequence") || "NONE",
        potentialConsequence: text(formData, "potentialConsequence") || "NONE",
        evidenceNote: optional(formData, "evidence"),
        confidential,
        anonymous,
        commitment: "COMMITTED",
        status: flag(formData, "immediateDanger") ? "IMMEDIATE_CONTROL" : "REPORTED",
      },
    });
  });
  const depth = suggestedInvestigationDepth(incident.actualConsequence, incident.potentialConsequence);
  if (depth === "STRUCTURED" || incident.immediateDanger) {
    await db.safetyAction.create({
      data: {
        organisationId: session.organisationId,
        reference: await db.$transaction((tx) => nextSafetyReference(tx, session.organisationId, "action", "ACT")),
        title: `Immediate review · ${incident.reference}`,
        sourceType: "INCIDENT",
        sourceId: incident.id,
        priority: "HIGH",
        ownerUserId: session.userId,
        capaStage: "FINDING",
      },
    });
  }
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.incident.reported", entityType: "SafetyIncident", entityId: incident.id, after: { reference: incident.reference, kind } });
  await writeActivity({ organisationId: session.organisationId, type: "safety.incident.reported", summary: `${incident.reference} reported`, entityType: "SafetyIncident", entityId: incident.id });
  await emit(DOMAIN_EVENTS.safetyIncidentReported, { organisationId: session.organisationId, incidentId: incident.id, kind });
  if (kind === "HAZARD" || kind === "UNSAFE_CONDITION") await emit(DOMAIN_EVENTS.safetyHazardReported, { organisationId: session.organisationId, incidentId: incident.id });
  revalidatePath("/safety");
  redirect(`/safety/incidents/${incident.id}`);
}

export async function saveImmediateControl(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.incidentInvestigate);
  const incidentId = text(formData, "incidentId");
  const incident = await db.safetyIncident.findFirst({ where: { id: incidentId, organisationId: session.organisationId } });
  if (!incident) throw new Error("That incident is not in this company.");
  await db.safetyIncident.update({
    where: { id: incident.id },
    data: {
      anyoneStillAtRisk: flag(formData, "anyoneStillAtRisk"),
      isolationRequired: flag(formData, "isolationRequired"),
      areaClosureRequired: flag(formData, "areaClosureRequired"),
      firstAidRequired: flag(formData, "firstAidRequired"),
      emergencyServicesRequired: flag(formData, "emergencyServicesRequired"),
      managementNotified: flag(formData, "managementNotified"),
      actualConsequence: text(formData, "actualConsequence") || incident.actualConsequence,
      potentialConsequence: text(formData, "potentialConsequence") || incident.potentialConsequence,
      narrative: optional(formData, "narrative") ?? incident.narrative,
      status: "IMMEDIATE_CONTROL",
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.incident.immediate_control", entityType: "SafetyIncident", entityId: incident.id, after: { reference: incident.reference } });
  revalidatePath(`/safety/incidents/${incident.id}`);
}

export async function openInvestigation(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.incidentInvestigate);
  const incidentId = text(formData, "incidentId");
  const incident = await db.safetyIncident.findFirst({ where: { id: incidentId, organisationId: session.organisationId } });
  if (!incident) throw new Error("That incident is not in this company.");
  const method = text(formData, "method") || (suggestedInvestigationDepth(incident.actualConsequence, incident.potentialConsequence) === "STRUCTURED" ? "FIVE_WHYS" : "SIMPLE");
  await db.safetyInvestigation.upsert({
    where: { incidentId },
    create: { organisationId: session.organisationId, incidentId, method, leadUserId: session.userId, timeline: optional(formData, "timeline") },
    update: { method, timeline: optional(formData, "timeline") },
  });
  await db.safetyIncident.update({ where: { id: incidentId }, data: { status: "INVESTIGATING" } });
  await emit(DOMAIN_EVENTS.safetyIncidentInvestigationStarted, { organisationId: session.organisationId, incidentId });
  revalidatePath(`/safety/incidents/${incidentId}`);
}

export async function addCause(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.incidentInvestigate);
  const investigationId = text(formData, "investigationId");
  const investigation = await db.safetyInvestigation.findFirst({ where: { id: investigationId, organisationId: session.organisationId } });
  if (!investigation) throw new Error("Open the investigation first.");
  const statement = text(formData, "statement");
  if (!statement) throw new Error("Describe the contributor.");
  await db.safetyCause.create({ data: { organisationId: session.organisationId, investigationId, category: text(formData, "category") || "Other", statement } });
  revalidatePath(`/safety/incidents/${investigation.incidentId}`);
}

export async function saveRootCause(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.incidentInvestigate);
  const investigationId = text(formData, "investigationId");
  const investigation = await db.safetyInvestigation.findFirst({ where: { id: investigationId, organisationId: session.organisationId } });
  if (!investigation) throw new Error("Open the investigation first.");
  await db.safetyInvestigation.update({
    where: { id: investigation.id },
    data: {
      immediateCauses: optional(formData, "immediateCauses"),
      underlyingCauses: optional(formData, "underlyingCauses"),
      rootCause: optional(formData, "rootCause"),
      timeline: optional(formData, "timeline") ?? investigation.timeline,
    },
  });
  revalidatePath(`/safety/incidents/${investigation.incidentId}`);
}

export async function reviewRiddor(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riddorReview);
  const incidentId = text(formData, "incidentId");
  const incident = await db.safetyIncident.findFirst({ where: { id: incidentId, organisationId: session.organisationId } });
  if (!incident) throw new Error("That incident is not in this company.");
  const workRelated = text(formData, "workRelated");
  const assistance = assistRiddor({
    workRelated: workRelated === "" ? null : workRelated === "yes",
    personClass: optional(formData, "personClass"),
    outcome: optional(formData, "outcome"),
  });
  const decision = text(formData, "decision") || "PENDING";
  if (decision !== "PENDING") {
    assertCapability(session, C.riddorManage);
    const check = riddorDecisionComplete({ decision, rationale: text(formData, "rationale") });
    if (!check.ok) throw new Error(check.reason);
  }
  await db.safetyRiddorDecision.upsert({
    where: { incidentId },
    create: {
      organisationId: session.organisationId,
      incidentId,
      workRelated: workRelated === "" ? null : workRelated === "yes",
      personClass: optional(formData, "personClass"),
      outcome: optional(formData, "outcome"),
      potentialCategory: assistance.potentialCategory,
      decision,
      rationale: optional(formData, "rationale"),
      responsibleUserId: session.userId,
      decidedByUserId: decision === "PENDING" ? null : session.userId,
      decidedAt: decision === "PENDING" ? null : new Date(),
      reportDate: when(formData, "reportDate"),
      reportingMethod: optional(formData, "reportingMethod"),
      submissionReference: optional(formData, "submissionReference"),
      ruleVersion: assistance.ruleVersion,
      guidance: `${assistance.guidance} ${assistance.reminder ?? ""}`.trim(),
    },
    update: {
      workRelated: workRelated === "" ? null : workRelated === "yes",
      personClass: optional(formData, "personClass"),
      outcome: optional(formData, "outcome"),
      potentialCategory: assistance.potentialCategory,
      decision,
      rationale: optional(formData, "rationale"),
      decidedByUserId: decision === "PENDING" ? null : session.userId,
      decidedAt: decision === "PENDING" ? null : new Date(),
      reportDate: when(formData, "reportDate"),
      reportingMethod: optional(formData, "reportingMethod"),
      submissionReference: optional(formData, "submissionReference"),
      ruleVersion: assistance.ruleVersion,
      guidance: `${assistance.guidance} ${assistance.reminder ?? ""}`.trim(),
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.riddor.reviewed", entityType: "SafetyIncident", entityId: incidentId, after: { decision, potentialCategory: assistance.potentialCategory, ruleVersion: assistance.ruleVersion } });
  revalidatePath(`/safety/incidents/${incidentId}`);
}

export async function createSafetyAction(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.actionManage);
  const title = text(formData, "title");
  if (!title) throw new Error("Describe the action.");
  const action = await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "action", "ACT");
    return tx.safetyAction.create({
      data: {
        organisationId: session.organisationId,
        reference,
        title,
        detail: optional(formData, "detail"),
        ownerUserId: optional(formData, "ownerUserId") ?? session.userId,
        dueDate: when(formData, "dueDate"),
        priority: text(formData, "priority") || "MEDIUM",
        sourceType: text(formData, "sourceType") || "MANAGEMENT",
        sourceId: optional(formData, "sourceId"),
        capaStage: optional(formData, "capaStage"),
        estimatedCostMinor: whole(formData, "estimatedCostMinor"),
      },
    });
  });
  await emit(DOMAIN_EVENTS.safetyActionCreated, { organisationId: session.organisationId, actionId: action.id, sourceType: action.sourceType });
  revalidatePath("/safety");
}

export async function advanceAction(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.actionManage);
  const actionId = text(formData, "actionId");
  const action = await db.safetyAction.findFirst({ where: { id: actionId, organisationId: session.organisationId } });
  if (!action) throw new Error("That action is not in this company.");
  const requested = text(formData, "capaStage");
  const stage = requested || (action.capaStage ? nextCapa(action.capaStage) : null);
  const status = text(formData, "status") || (stage === "CLOSED" ? "CLOSED" : action.status === "OPEN" ? "IN_PROGRESS" : action.status);
  await db.safetyAction.update({
    where: { id: action.id },
    data: { capaStage: stage, status, evidence: optional(formData, "evidence") ?? action.evidence, effectivenessNote: optional(formData, "effectivenessNote") ?? action.effectivenessNote },
  });
  if (status === "COMPLETE" || status === "CLOSED") await emit(DOMAIN_EVENTS.safetyActionCompleted, { organisationId: session.organisationId, actionId: action.id });
  revalidatePath("/safety/assurance");
}

export async function verifyAction(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.actionVerify);
  const actionId = text(formData, "actionId");
  const action = await db.safetyAction.findFirst({ where: { id: actionId, organisationId: session.organisationId } });
  if (!action) throw new Error("That action is not in this company.");
  const note = text(formData, "verificationNote");
  if (note.length < 4) throw new Error("Say what you checked.");
  await db.safetyAction.update({
    where: { id: action.id },
    data: { status: "VERIFIED", verifiedByUserId: session.userId, verifiedAt: new Date(), verificationNote: note, capaStage: action.capaStage === "VERIFICATION" ? "EFFECTIVENESS" : action.capaStage },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.action.verified", entityType: "SafetyAction", entityId: action.id, after: { reference: action.reference } });
  await emit(DOMAIN_EVENTS.safetyActionVerified, { organisationId: session.organisationId, actionId: action.id });
  revalidatePath("/safety/assurance");
}

export async function saveWorkplaceRecord(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riskCreate);
  const enabled = await db.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "safety", enabled: true, entitled: true } });
  if (!enabled) throw new Error("Safety is not enabled for this company.");
  let input;
  try { input = workplaceInput(formData); } catch (error) {
    if (error instanceof WorkplaceValidationError) return { error: error.message };
    throw error;
  }
  if (SENSITIVE_RECORD_KINDS.has(input.kind)) assertCapability(session, C.healthSurveillanceRead);
  const id = text(formData, "recordId");
  const result = await db.$transaction(async (tx) => {
    const previous = id ? await tx.safetyRecord.findFirst({ where: { id, organisationId: session.organisationId } }) : null;
    if (id && !previous) throw new Error("Record unavailable.");
    if (previous?.sensitive) assertCapability(session, C.healthSurveillanceRead);
    if (previous && previous.kind !== input.kind) return { error: "Keep the record type unchanged. Create a separate record for another type." };
    const payload = { ...(previous?.payload && typeof previous.payload === "object" && !Array.isArray(previous.payload) ? previous.payload : {}), ...input.payload };
    let recordId = id;
    if (previous) {
      const version = text(formData, "version");
      if (version !== previous.updatedAt.toISOString()) return { error: "This record changed in another window. Reload before saving; your entered work is still here." };
      const updated = await tx.safetyRecord.updateMany({ where: { id, organisationId: session.organisationId, updatedAt: previous.updatedAt }, data: { title: input.title, status: input.status, dueAt: input.dueAt, payload, updatedAt: new Date() } });
      if (!updated.count) return { error: "This record changed in another window. Reload before saving; your entered work is still here." };
    } else {
      const reference = await nextSafetyReference(tx, session.organisationId, "workplace_record", "WSR");
      const created = await tx.safetyRecord.create({ data: { organisationId: session.organisationId, reference, kind: input.kind, title: input.title, status: input.status, dueAt: input.dueAt, payload, ownerUserId: session.userId, sensitive: SENSITIVE_RECORD_KINDS.has(input.kind), commitment: "COMMITTED" } });
      recordId = created.id;
    }
    // Audit excludes free-text operational/private content; the authoritative record keeps it.
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: previous ? "safety.record.updated" : "safety.record.created", entityType: "SafetyRecord", entityId: recordId, before: previous ? { status: previous.status, dueAt: previous.dueAt } : undefined, after: { kind: input.kind, status: input.status, dueAt: input.dueAt } }, tx);
    return { recordId };
  });
  if ("error" in result) return { error: result.error! };
  revalidatePath("/safety");
  revalidatePath("/safety/assurance");
  revalidatePath("/safety/workplace");
  revalidatePath(`/safety/records/${result.recordId}`);
  redirect(`/safety/records/${result.recordId}`);
}
