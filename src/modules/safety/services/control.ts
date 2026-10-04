"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { DOMAIN_EVENTS, emit } from "@/core/events/bus";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { canOverrideControl, canReleaseHold, ENERGY_TYPES, permitTransition, puwerOverall, failedInspectionEffects } from "../domain/work";
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

export async function createPermit(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.permitRequest);
  const title = text(formData, "title");
  if (!title) throw new Error("Describe the work.");
  const permit = await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "permit", "PTW");
    return tx.safetyPermit.create({
      data: {
        organisationId: session.organisationId,
        reference,
        kind: text(formData, "kind") || "HIGH_RISK",
        title,
        description: optional(formData, "description"),
        hazards: optional(formData, "hazards"),
        startsAt: when(formData, "startsAt"),
        expiresAt: when(formData, "expiresAt"),
        requestedByUserId: session.userId,
        contractorPartyId: optional(formData, "contractorPartyId"),
        isolationRequired: flag(formData, "isolationRequired"),
        payload: {
          people: optional(formData, "people"),
          ppe: optional(formData, "ppe"),
          methodStatement: optional(formData, "methodStatement"),
          rescuePlan: optional(formData, "rescuePlan"),
        },
      },
    });
  });
  revalidatePath("/safety/control");
  redirect(`/safety/control/permits/${permit.id}`);
}

export async function advancePermit(formData: FormData) {
  const session = await requireSession();
  const permitId = text(formData, "permitId");
  const to = text(formData, "to");
  const permit = await db.safetyPermit.findFirst({ where: { id: permitId, organisationId: session.organisationId } });
  if (!permit) throw new Error("That permit is not in this company.");
  if (permit.expiresAt && permit.expiresAt.getTime() <= Date.now() && !["CLOSED", "EXPIRED"].includes(permit.status)) {
    await db.safetyPermit.update({ where: { id: permit.id }, data: { status: "EXPIRED" } });
    throw new Error("This permit has expired. It is no longer valid. Close it or raise a new one.");
  }
  if (!permitTransition(permit.status, to, permit.isolationRequired)) throw new Error(`A permit cannot move from ${permit.status} to ${to}.`);
  if (["RISK_REVIEWED", "CONTROLS_CONFIRMED", "ISOLATION_CONFIRMED"].includes(to)) assertCapability(session, C.permitIssue);
  if (to === "AUTHORISED") assertCapability(session, C.permitAuthorise);
  if (["WORK_COMPLETE", "AREA_INSPECTED", "HANDED_BACK", "CLOSED", "SUSPENDED"].includes(to)) assertCapability(session, C.permitClose);
  if (to === "IN_PROGRESS") assertCapability(session, C.permitRequest);
  await db.safetyPermit.update({
    where: { id: permit.id },
    data: {
      status: to,
      controlsConfirmed: optional(formData, "controlsConfirmed") ?? permit.controlsConfirmed,
      authorisedByUserId: to === "AUTHORISED" ? session.userId : permit.authorisedByUserId,
      suspendedReason: to === "SUSPENDED" ? text(formData, "reason") : permit.suspendedReason,
      conditionsChanged: flag(formData, "conditionsChanged") || permit.conditionsChanged,
      handbackAt: to === "HANDED_BACK" ? new Date() : permit.handbackAt,
      closedAt: to === "CLOSED" ? new Date() : permit.closedAt,
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.permit.advanced", entityType: "SafetyPermit", entityId: permit.id, before: { status: permit.status }, after: { status: to, reference: permit.reference } });
  if (to === "AUTHORISED") await emit(DOMAIN_EVENTS.safetyPermitAuthorised, { organisationId: session.organisationId, permitId: permit.id });
  if (to === "SUSPENDED") await emit(DOMAIN_EVENTS.safetyPermitSuspended, { organisationId: session.organisationId, permitId: permit.id });
  if (to === "CLOSED") await emit(DOMAIN_EVENTS.safetyPermitClosed, { organisationId: session.organisationId, permitId: permit.id });
  revalidatePath(`/safety/control/permits/${permit.id}`);
}

export async function extendPermit(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.permitAuthorise);
  const permit = await db.safetyPermit.findFirst({ where: { id: text(formData, "permitId"), organisationId: session.organisationId } });
  if (!permit) throw new Error("That permit is not in this company.");
  if (!["AUTHORISED", "IN_PROGRESS", "SUSPENDED"].includes(permit.status)) throw new Error("Only a live permit can be extended.");
  const expiresAt = when(formData, "expiresAt");
  if (!expiresAt || expiresAt.getTime() <= Date.now()) throw new Error("The new expiry has to be in the future.");
  const reason = text(formData, "reason");
  if (reason.length < 4) throw new Error("Say why the permit is being extended.");
  await db.safetyPermit.update({ where: { id: permit.id }, data: { expiresAt, extensionCount: { increment: 1 }, suspendedReason: permit.status === "SUSPENDED" ? permit.suspendedReason : reason } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.permit.extended", entityType: "SafetyPermit", entityId: permit.id, after: { expiresAt: expiresAt.toISOString(), reason, reference: permit.reference } });
  revalidatePath(`/safety/control/permits/${permit.id}`);
}

export async function createIsolation(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.isolationApply);
  const assetLabel = text(formData, "assetLabel");
  if (!assetLabel) throw new Error("Name the asset being isolated.");
  const energy = formData.getAll("energy").map(String).filter((item) => ENERGY_TYPES.includes(item as (typeof ENERGY_TYPES)[number]));
  await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "isolation", "ISO");
    await tx.safetyIsolation.create({
      data: {
        organisationId: session.organisationId,
        reference,
        assetLabel,
        targetType: optional(formData, "targetType"),
        targetId: optional(formData, "targetId"),
        energyTypes: energy,
        permitId: optional(formData, "permitId"),
        status: "PLANNED",
      },
    });
  });
  revalidatePath("/safety/control");
  redirect(`/safety/control`);
}

export async function applyIsolationLock(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.isolationApply);
  const isolation = await db.safetyIsolation.findFirst({ where: { id: text(formData, "isolationId"), organisationId: session.organisationId } });
  if (!isolation) throw new Error("That isolation is not in this company.");
  const identifier = text(formData, "identifier");
  if (!identifier) throw new Error("Record the lock or tag identifier.");
  await db.safetyIsolationLock.create({ data: { organisationId: session.organisationId, isolationId: isolation.id, identifier, appliedByUserId: session.userId } });
  await db.safetyIsolation.update({ where: { id: isolation.id }, data: { status: "APPLIED", appliedByUserId: session.userId, appliedAt: isolation.appliedAt ?? new Date() } });
  await emit(DOMAIN_EVENTS.safetyIsolationApplied, { organisationId: session.organisationId, isolationId: isolation.id });
  revalidatePath("/safety/control");
}

export async function verifyIsolation(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.isolationVerify);
  const isolation = await db.safetyIsolation.findFirst({ where: { id: text(formData, "isolationId"), organisationId: session.organisationId }, include: { locks: true } });
  if (!isolation) throw new Error("That isolation is not in this company.");
  if (!isolation.locks.some((lock) => !lock.removedAt)) throw new Error("Apply at least one lock before verifying the isolation.");
  await db.safetyIsolation.update({ where: { id: isolation.id }, data: { status: "VERIFIED", verifiedByUserId: session.userId } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.isolation.verified", entityType: "SafetyIsolation", entityId: isolation.id, after: { reference: isolation.reference } });
  revalidatePath("/safety/control");
}

export async function clearIsolation(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.isolationRemove);
  const isolation = await db.safetyIsolation.findFirst({ where: { id: text(formData, "isolationId"), organisationId: session.organisationId }, include: { locks: true } });
  if (!isolation) throw new Error("That isolation is not in this company.");
  const open = isolation.locks.filter((lock) => !lock.removedAt);
  if (open.length) throw new Error(`${open.length} lock${open.length === 1 ? "" : "s"} still applied. Work must not restart until every lock is removed by an authorised person.`);
  await db.safetyIsolation.update({ where: { id: isolation.id }, data: { status: "CLEARED", removedByUserId: session.userId, clearedAt: new Date() } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.isolation.cleared", entityType: "SafetyIsolation", entityId: isolation.id, after: { reference: isolation.reference } });
  await emit(DOMAIN_EVENTS.safetyIsolationCleared, { organisationId: session.organisationId, isolationId: isolation.id });
  revalidatePath("/safety/control");
}

export async function removeIsolationLock(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.isolationRemove);
  const lock = await db.safetyIsolationLock.findFirst({ where: { id: text(formData, "lockId"), organisationId: session.organisationId } });
  if (!lock || lock.removedAt) throw new Error("That lock is not active.");
  await db.safetyIsolationLock.update({ where: { id: lock.id }, data: { removedAt: new Date(), removedByUserId: session.userId } });
  revalidatePath("/safety/control");
}

export async function placeSafetyHold(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.holdManage);
  const targetLabel = text(formData, "targetLabel");
  const reason = text(formData, "reason");
  const targetType = text(formData, "targetType") || "ASSET";
  const targetId = text(formData, "targetId") || targetLabel;
  if (!targetLabel || reason.length < 4) throw new Error("Name what is held and why.");
  const hold = await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "hold", "HLD");
    const created = await tx.safetyHold.create({
      data: { organisationId: session.organisationId, reference, targetType, targetId, targetLabel, reason, placedByUserId: session.userId },
    });
    const maintenance = await tx.safetyAction.create({
      data: {
        organisationId: session.organisationId,
        reference: await nextSafetyReference(tx, session.organisationId, "action", "ACT"),
        title: `Repair · ${targetLabel}`,
        detail: reason,
        sourceType: "SAFETY_HOLD",
        sourceId: created.id,
        priority: "HIGH",
        ownerUserId: session.userId,
        capaStage: "CORRECTION",
      },
    });
    await tx.safetyHold.update({ where: { id: created.id }, data: { maintenanceActionId: maintenance.id } });
    if (targetType === "MANUFACTURING_RESOURCE") {
      await tx.manufacturingWorkOrder.updateMany({
        where: { organisationId: session.organisationId, resourceId: targetId, status: { in: ["WAITING", "READY", "RUNNING", "PAUSED"] } },
        data: { status: "BLOCKED", pauseReason: `safety-hold:${created.id}` },
      });
    }
    return created;
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.hold.placed", entityType: "SafetyHold", entityId: hold.id, after: { reference: hold.reference, targetType, targetId, reason } });
  await emit(DOMAIN_EVENTS.safetyEquipmentHoldAdded, { organisationId: session.organisationId, holdId: hold.id, targetType, targetId });
  revalidatePath("/safety");
  redirect(`/safety/control/holds/${hold.id}`);
}

export async function updateReturnToService(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.holdManage);
  const hold = await db.safetyHold.findFirst({ where: { id: text(formData, "holdId"), organisationId: session.organisationId, status: "ACTIVE" } });
  if (!hold) throw new Error("That hold is not active.");
  await db.safetyHold.update({
    where: { id: hold.id },
    data: {
      repairComplete: flag(formData, "repairComplete"),
      inspectionComplete: flag(formData, "inspectionComplete"),
      safetyVerified: flag(formData, "safetyVerified"),
      verificationNote: optional(formData, "verificationNote"),
    },
  });
  revalidatePath(`/safety/control/holds/${hold.id}`);
}

export async function releaseSafetyHold(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.holdManage);
  const hold = await db.safetyHold.findFirst({ where: { id: text(formData, "holdId"), organisationId: session.organisationId, status: "ACTIVE" } });
  if (!hold) throw new Error("That hold is not active.");
  const gate = canReleaseHold(hold);
  if (!gate.ok) throw new Error(gate.reason);
  await db.$transaction(async (tx) => {
    await tx.safetyHold.update({ where: { id: hold.id }, data: { status: "RELEASED", releasedByUserId: session.userId, releasedAt: new Date(), safetyVerified: true } });
    if (hold.targetType === "MANUFACTURING_RESOURCE") {
      await tx.manufacturingWorkOrder.updateMany({
        where: { organisationId: session.organisationId, resourceId: hold.targetId, status: "BLOCKED", pauseReason: `safety-hold:${hold.id}` },
        data: { status: "READY", pauseReason: null },
      });
    }
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.hold.released", entityType: "SafetyHold", entityId: hold.id, after: { reference: hold.reference } });
  await emit(DOMAIN_EVENTS.safetyEquipmentHoldRemoved, { organisationId: session.organisationId, holdId: hold.id, targetType: hold.targetType, targetId: hold.targetId });
  revalidatePath(`/safety/control/holds/${hold.id}`);
}

export async function overrideSafetyHold(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.holdManage);
  const hold = await db.safetyHold.findFirst({ where: { id: text(formData, "holdId"), organisationId: session.organisationId, status: "ACTIVE" } });
  if (!hold) throw new Error("That hold is not active.");
  const expiresAt = when(formData, "expiresAt");
  if (!expiresAt) throw new Error("An override has to expire.");
  const gate = canOverrideControl({ who: session.userId, why: text(formData, "why"), scope: text(formData, "scope"), approvedBy: text(formData, "approvedBy"), expiresAt, now: new Date() });
  if (!gate.ok) throw new Error(gate.reason);
  await db.safetyHold.update({
    where: { id: hold.id },
    data: { status: "OVERRIDDEN", overrideByUserId: session.userId, overrideReason: text(formData, "why"), overrideScope: text(formData, "scope"), overrideApprovedByUserId: text(formData, "approvedBy"), overrideExpiresAt: expiresAt },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.hold.overridden", entityType: "SafetyHold", entityId: hold.id, after: { why: text(formData, "why"), scope: text(formData, "scope"), approvedBy: text(formData, "approvedBy"), expiresAt: expiresAt.toISOString() } });
  revalidatePath(`/safety/control/holds/${hold.id}`);
}

export async function saveStatutoryCheck(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.statutoryManage);
  const assetLabel = text(formData, "assetLabel");
  const kind = text(formData, "kind") || "OTHER";
  if (!assetLabel) throw new Error("Name the equipment.");
  const checklist = Object.fromEntries(formData.getAll("check").map((entry) => {
    const [key, value] = String(entry).split(":");
    return [key, value];
  }));
  const overall = kind === "PUWER" ? puwerOverall(checklist) : optional(formData, "overall");
  const seriousDefect = flag(formData, "seriousDefect") || overall === "UNSAFE_FOR_USE";
  const saved = await db.$transaction(async (tx) => {
    const reference = await nextSafetyReference(tx, session.organisationId, "statutory", kind === "LOLER" ? "LOL" : kind === "PUWER" ? "PUW" : "STC");
    const created = await tx.safetyStatutoryCheck.create({
      data: {
        organisationId: session.organisationId,
        reference,
        kind,
        assetLabel,
        targetType: optional(formData, "targetType"),
        targetId: optional(formData, "targetId") || assetLabel,
        safeWorkingLoad: optional(formData, "safeWorkingLoad"),
        examiner: optional(formData, "examiner"),
        scheme: optional(formData, "scheme"),
        lastExaminedAt: when(formData, "lastExaminedAt"),
        nextDueAt: when(formData, "nextDueAt"),
        seriousDefect,
        defectSummary: optional(formData, "defectSummary"),
        restriction: optional(formData, "restriction"),
        reportNote: optional(formData, "reportNote"),
        overall,
        checklist,
        status: seriousDefect ? "RESTRICTED" : "CURRENT",
      },
    });
    if (!seriousDefect) return { check: created, holdId: null as string | null };
    const hold = await tx.safetyHold.create({
      data: {
        organisationId: session.organisationId,
        reference: await nextSafetyReference(tx, session.organisationId, "hold", "HLD"),
        targetType: optional(formData, "targetType") || "ASSET",
        targetId: optional(formData, "targetId") || assetLabel,
        targetLabel: assetLabel,
        reason: text(formData, "defectSummary") || "Serious defect on examination. Equipment is restricted until it is verified back into service.",
        placedByUserId: session.userId,
      },
    });
    return { check: created, holdId: hold.id };
  });
  if (saved.holdId) {
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "safety.hold.placed", entityType: "SafetyHold", entityId: saved.holdId, after: { reason: "Serious statutory defect", reference: saved.check.reference } });
    await emit(DOMAIN_EVENTS.safetyEquipmentHoldAdded, { organisationId: session.organisationId, holdId: saved.holdId });
  }
  revalidatePath("/safety/assurance");
  redirect(saved.holdId ? `/safety/control/holds/${saved.holdId}` : `/safety/equipment/${saved.check.id}`);
}

function makeHold(targetLabel: string, targetType: string, targetId: string, reason: string) {
  const form = new FormData();
  form.set("targetLabel", targetLabel);
  form.set("targetType", targetType);
  form.set("targetId", targetId);
  form.set("reason", reason);
  return form;
}

export async function completeInspection(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.inspectionExecute);
  const inspectionId = text(formData, "inspectionId");
  const inspection = await db.safetyInspection.findFirst({ where: { id: inspectionId, organisationId: session.organisationId }, include: { template: true } });
  if (!inspection) throw new Error("That inspection is not in this company.");
  const questions = Array.isArray(inspection.template?.questions) ? inspection.template.questions as Array<{ id: string; prompt: string; onFail?: string[] }> : [];
  const responses = questions.map((question) => ({ id: question.id, prompt: question.prompt, answer: text(formData, `q_${question.id}`) }));
  const failed = responses.filter((response) => response.answer === "NO" || response.answer === "FAIL");
  await db.safetyInspection.update({
    where: { id: inspection.id },
    data: { status: failed.length ? "FAILED" : "COMPLETE", completedAt: new Date(), inspectorUserId: session.userId, responses, commitment: "COMMITTED" },
  });
  for (const question of questions) {
    const answer = text(formData, `q_${question.id}`);
    if (answer !== "NO" && answer !== "FAIL") continue;
    const effects = failedInspectionEffects(question.onFail ?? ["action"]);
    if (effects.includes("photo") && !text(formData, `photo_${question.id}`)) throw new Error(`Add a photograph note for: ${question.prompt}`);
    if (effects.includes("action") || effects.includes("maintenance") || effects.includes("defect")) {
      await db.$transaction(async (tx) => {
        const reference = await nextSafetyReference(tx, session.organisationId, "action", "ACT");
        await tx.safetyAction.create({
          data: {
            organisationId: session.organisationId,
            reference,
            title: effects.includes("maintenance") ? `Maintenance · ${question.prompt}` : `Inspection · ${question.prompt}`,
            detail: optional(formData, `note_${question.id}`),
            sourceType: effects.includes("maintenance") ? "MAINTENANCE" : "INSPECTION",
            sourceId: inspection.id,
            priority: effects.includes("escalate") ? "HIGH" : "MEDIUM",
            ownerUserId: session.userId,
          },
        });
      });
    }
    if (effects.includes("risk_review") && text(formData, "riskId")) {
      await db.safetyReviewRequest.create({ data: { organisationId: session.organisationId, riskId: text(formData, "riskId"), reason: "CONTROL_FAILURE", sourceType: "INSPECTION", sourceId: inspection.id } });
    }
    if (effects.includes("hold")) {
      await placeSafetyHold(makeHold(inspection.title, "ASSET", inspection.title, question.prompt));
    }
  }
  revalidatePath("/safety/assurance");
}

export async function createInspection(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, C.inspectionManage);
  const title = text(formData, "title");
  if (!title) throw new Error("Name the inspection.");
  const questions = text(formData, "questions").split("\n").map((line) => line.trim()).filter(Boolean).map((prompt, index) => ({
    id: `q${index + 1}`,
    prompt,
    onFail: ["action"],
  }));
  const inspection = await db.$transaction(async (tx) => {
    const template = await tx.safetyInspectionTemplate.create({ data: { organisationId: session.organisationId, name: title, cadence: text(formData, "cadence") || "WEEKLY", questions } });
    const reference = await nextSafetyReference(tx, session.organisationId, "inspection", "INS");
    return tx.safetyInspection.create({
      data: { organisationId: session.organisationId, reference, templateId: template.id, title, scheduledFor: when(formData, "scheduledFor") ?? new Date(), status: "DUE" },
    });
  });
  revalidatePath("/safety/assurance");
  redirect(`/safety/assurance/inspections/${inspection.id}`);
}
