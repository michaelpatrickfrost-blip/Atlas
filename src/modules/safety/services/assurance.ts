"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { DOMAIN_EVENTS, emit } from "@/core/events/bus";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
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
function lines(form: FormData, key: string) {
  return text(form, key).split("\n").map((line) => line.trim()).filter(Boolean);
}

export async function saveSubstance(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.coshhManage);
  const tradeName = text(formData, "tradeName");
  if (!tradeName) throw new Error("Name the substance.");
  const substance = await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "substance", "CHEM");
    return tx.safetySubstance.create({
      data: {
        organisationId: session.organisationId,
        reference,
        tradeName,
        manufacturer: optional(formData, "manufacturer"),
        useSummary: optional(formData, "useSummary"),
        signalWord: optional(formData, "signalWord"),
        hazardStatements: lines(formData, "hazardStatements"),
        precautionaryStatements: lines(formData, "precautionaryStatements"),
        pictograms: lines(formData, "pictograms"),
        classifications: lines(formData, "classifications"),
        storageRequirements: optional(formData, "storageRequirements"),
        ppe: optional(formData, "ppe"),
        emergencyResponse: optional(formData, "emergencyResponse"),
        disposalGuidance: optional(formData, "disposalGuidance"),
        exposureLimits: optional(formData, "exposureLimits"),
        status: "REQUESTED",
      },
    });
  });
  revalidatePath("/safety/risk");
  redirect(`/safety/substances/${substance.id}`);
}

export async function addSafetyDataSheet(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.coshhManage);
  const substance = await db.safetySubstance.findFirst({ where: { id: text(formData, "substanceId"), organisationId: session.organisationId } });
  if (!substance) throw new Error("That substance is not in this company.");
  const versionLabel = text(formData, "versionLabel");
  if (!versionLabel) throw new Error("Record the safety data sheet version.");
  await db.$transaction(async (tx) => {
    await tx.safetySds.updateMany({ where: { organisationId: session.organisationId, substanceId: substance.id, supersededAt: null }, data: { supersededAt: new Date() } });
    await tx.safetySds.create({
      data: { organisationId: session.organisationId, substanceId: substance.id, versionLabel, supplier: optional(formData, "supplier"), issueDate: when(formData, "issueDate"), language: text(formData, "language") || "en", note: optional(formData, "note") },
    });
  });
  const assessments = await db.safetyCoshhAssessment.findMany({ where: { organisationId: session.organisationId, substanceId: substance.id, status: "APPROVED" } });
  if (assessments.length) await emit(DOMAIN_EVENTS.safetyCoshhReviewRequired, { organisationId: session.organisationId, substanceId: substance.id });
  await db.safetySubstance.update({ where: { id: substance.id }, data: { status: substance.status === "APPROVED" ? "ASSESSED" : "SDS_SUPPLIED" } });
  revalidatePath(`/safety/substances/${substance.id}`);
}

export async function saveCoshhAssessment(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.coshhManage);
  const substance = await db.safetySubstance.findFirst({ where: { id: text(formData, "substanceId"), organisationId: session.organisationId } });
  if (!substance) throw new Error("That substance is not in this company.");
  const task = text(formData, "task");
  if (!task) throw new Error("Describe the task or use.");
  const latest = await db.safetyCoshhAssessment.findFirst({ where: { substanceId: substance.id }, orderBy: { revision: "desc" } });
  await db.safetyCoshhAssessment.create({
    data: {
      organisationId: session.organisationId,
      substanceId: substance.id,
      revision: (latest?.revision ?? 0) + 1,
      task,
      quantity: optional(formData, "quantity"),
      frequency: optional(formData, "frequency"),
      duration: optional(formData, "duration"),
      route: optional(formData, "route"),
      peopleExposed: optional(formData, "peopleExposed"),
      hazard: optional(formData, "hazard"),
      controls: optional(formData, "controls"),
      engineeringControls: optional(formData, "engineeringControls"),
      lev: optional(formData, "lev"),
      ppe: optional(formData, "ppe"),
      storage: optional(formData, "storage"),
      spillResponse: optional(formData, "spillResponse"),
      waste: optional(formData, "waste"),
      emergencyAction: optional(formData, "emergencyAction"),
      exposureLimits: optional(formData, "exposureLimits"),
      healthSurveillance: flag(formData, "healthSurveillance"),
      residualRisk: optional(formData, "residualRisk"),
      canEliminate: text(formData, "canEliminate") === "" ? null : text(formData, "canEliminate") === "yes",
      canSubstitute: text(formData, "canSubstitute") === "" ? null : text(formData, "canSubstitute") === "yes",
      substitutionReason: optional(formData, "substitutionReason"),
      reviewDate: when(formData, "reviewDate"),
      authorUserId: session.userId,
      status: "DRAFT",
    },
  });
  await db.safetySubstance.update({ where: { id: substance.id }, data: { status: "ASSESSED" } });
  revalidatePath(`/safety/substances/${substance.id}`);
}

export async function approveSubstance(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.coshhManage);
  const substance = await db.safetySubstance.findFirst({ where: { id: text(formData, "substanceId"), organisationId: session.organisationId }, include: { sheets: true, assessments: true } });
  if (!substance) throw new Error("That substance is not in this company.");
  if (!substance.sheets.some((sheet) => !sheet.supersededAt)) throw new Error("Add a current safety data sheet before approval.");
  if (!substance.assessments.length) throw new Error("Complete a COSHH assessment before approval.");
  await db.safetySubstance.update({ where: { id: substance.id }, data: { status: "APPROVED", approvedByUserId: session.userId, approvedAt: new Date() } });
  await db.safetyCoshhAssessment.updateMany({ where: { organisationId: session.organisationId, substanceId: substance.id, status: "DRAFT" }, data: { status: "APPROVED" } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.coshh.approved", entityType: "SafetySubstance", entityId: substance.id, after: { reference: substance.reference } });
  revalidatePath(`/safety/substances/${substance.id}`);
}

export async function saveCompetence(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.competenceManage);
  const employeeId = text(formData, "employeeId");
  const key = text(formData, "key");
  const employee = await db.employee.findFirst({ where: { id: employeeId, organisationId: session.organisationId } });
  if (!employee) throw new Error("Choose a person from People. Safety does not keep a separate employee list.");
  if (!key) throw new Error("Name the competence.");
  await db.safetyCompetence.upsert({
    where: { organisationId_employeeId_key: { organisationId: session.organisationId, employeeId, key } },
    create: { organisationId: session.organisationId, employeeId, key, label: text(formData, "label") || key, issuedAt: when(formData, "issuedAt"), expiresAt: when(formData, "expiresAt"), evidenceNote: optional(formData, "evidenceNote") },
    update: { label: text(formData, "label") || key, issuedAt: when(formData, "issuedAt"), expiresAt: when(formData, "expiresAt"), evidenceNote: optional(formData, "evidenceNote") },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.competence.saved", entityType: "Employee", entityId: employeeId, after: { key, expiresAt: optional(formData, "expiresAt") } });
  revalidatePath("/safety/assurance");
}

export async function saveSafetyDocument(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.documentManage);
  const title = text(formData, "title");
  if (!title) throw new Error("Name the document.");
  const supersedesId = optional(formData, "supersedesId");
  await db.$transaction(async (tx) => {
    if (supersedesId) await tx.safetyDocument.updateMany({ where: { id: supersedesId, organisationId: session.organisationId }, data: { status: "SUPERSEDED" } });
    const previous = supersedesId ? await tx.safetyDocument.findFirst({ where: { id: supersedesId, organisationId: session.organisationId } }) : null;
    const reference = previous?.reference ?? await nextSafetyReference(tx, session.organisationId, "document", "DOC");
    await tx.safetyDocument.create({
      data: {
        organisationId: session.organisationId,
        reference,
        kind: text(formData, "kind") || "PROCEDURE",
        title,
        revision: previous ? previous.revision + 1 : 1,
        status: text(formData, "status") || "DRAFT",
        body: optional(formData, "body"),
        effectiveFrom: when(formData, "effectiveFrom"),
        reviewDate: when(formData, "reviewDate"),
        supersedesId,
        requiresAcknowledgement: flag(formData, "requiresAcknowledgement"),
      },
    });
  });
  revalidatePath("/safety/assurance");
  redirect("/safety/assurance");
}

export async function acknowledgeDocument(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.documentRead);
  const document = await db.safetyDocument.findFirst({ where: { id: text(formData, "documentId"), organisationId: session.organisationId, status: "ACTIVE" } });
  if (!document) throw new Error("Only an active document can be acknowledged.");
  await db.safetyAcknowledgement.upsert({
    where: { documentId_userId: { documentId: document.id, userId: session.userId } },
    create: { organisationId: session.organisationId, documentId: document.id, userId: session.userId },
    update: { acknowledgedAt: new Date() },
  });
  revalidatePath("/safety/assurance");
}

export async function saveAudit(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.auditManage);
  const title = text(formData, "title");
  if (!title) throw new Error("Name the audit.");
  await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "audit", "AUD");
    await tx.safetyAudit.create({
      data: { organisationId: session.organisationId, reference, kind: text(formData, "kind") || "INTERNAL", title, scope: optional(formData, "scope"), auditorUserId: session.userId, status: "PLANNED" },
    });
  });
  revalidatePath("/safety/assurance");
  redirect("/safety/assurance");
}

export async function addAuditFinding(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.auditExecute);
  const audit = await db.safetyAudit.findFirst({ where: { id: text(formData, "auditId"), organisationId: session.organisationId } });
  if (!audit || audit.approvedAt) throw new Error("A completed audit cannot be changed quietly. Add a follow-up instead.");
  const statement = text(formData, "statement");
  if (!statement) throw new Error("Describe the finding.");
  const finding = await db.safetyFinding.create({ data: { organisationId: session.organisationId, auditId: audit.id, kind: text(formData, "kind") || "OBSERVATION", statement } });
  if (flag(formData, "createAction")) {
    await db.$transaction(async (tx) => {
      await tx.safetyAction.create({
        data: {
          organisationId: session.organisationId,
          reference: await nextSafetyReference(tx, session.organisationId, "action", "ACT"),
          title: statement,
          sourceType: "AUDIT",
          sourceId: finding.id,
          priority: text(formData, "kind") === "CRITICAL" || text(formData, "kind") === "MAJOR" ? "HIGH" : "MEDIUM",
          ownerUserId: session.userId,
          capaStage: "FINDING",
        },
      });
    });
  }
  await db.safetyAudit.update({ where: { id: audit.id }, data: { status: "IN_PROGRESS", startedAt: audit.startedAt ?? new Date() } });
  revalidatePath("/safety/assurance");
}

export async function approveAudit(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.auditManage);
  const audit = await db.safetyAudit.findFirst({ where: { id: text(formData, "auditId"), organisationId: session.organisationId } });
  if (!audit) throw new Error("That audit is not in this company.");
  if (audit.approvedAt) throw new Error("This audit is already approved.");
  await db.safetyAudit.update({ where: { id: audit.id }, data: { status: "APPROVED", completedAt: new Date(), approvedAt: new Date(), approvedByUserId: session.userId } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.audit.approved", entityType: "SafetyAudit", entityId: audit.id, after: { reference: audit.reference } });
  revalidatePath("/safety/assurance");
}

export async function saveChange(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.changeManage);
  const title = text(formData, "title");
  if (!title) throw new Error("Describe the change.");
  await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "change", "MOC");
    await tx.safetyChange.create({
      data: { organisationId: session.organisationId, reference, title, trigger: text(formData, "trigger") || "PROCESS_CHANGE", impact: optional(formData, "impact"), proposedByUserId: session.userId, status: "PROPOSED" },
    });
  });
  revalidatePath("/safety/assurance");
  redirect("/safety/assurance");
}

export async function advanceChange(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.changeManage);
  const change = await db.safetyChange.findFirst({ where: { id: text(formData, "changeId"), organisationId: session.organisationId } });
  if (!change) throw new Error("That change is not in this company.");
  const status = text(formData, "status");
  const allowed = ["IMPACT_ASSESSED", "ACTIONS_SET", "APPROVED", "IMPLEMENTED", "REVIEWED"];
  if (!allowed.includes(status)) throw new Error("Choose the next change step.");
  await db.safetyChange.update({
    where: { id: change.id },
    data: { status, impact: optional(formData, "impact") ?? change.impact, approvedByUserId: status === "APPROVED" ? session.userId : change.approvedByUserId, implementedAt: status === "IMPLEMENTED" ? new Date() : change.implementedAt, reviewDue: when(formData, "reviewDue") ?? change.reviewDue },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.change.advanced", entityType: "SafetyChange", entityId: change.id, after: { status, reference: change.reference } });
  revalidatePath("/safety/assurance");
}

export async function linkSafetyRecord(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.riskCreate);
  const sourceId = text(formData, "sourceId");
  const targetId = text(formData, "targetId");
  if (!sourceId || !targetId) throw new Error("Choose both records to link.");
  await db.safetyLink.create({
    data: { organisationId: session.organisationId, sourceType: text(formData, "sourceType"), sourceId, targetType: text(formData, "targetType"), targetId, label: optional(formData, "label") },
  });
  revalidatePath("/safety");
}
