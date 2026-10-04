"use server";
import { db } from "@/core/db/client";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { stockProvider } from "@/modules/stock/services/provider";
import { evaluateMeasurement, canClose } from "../domain/workflow";
import { requireSpecification, requireNcr } from "./queries";
import type { Prisma } from "@/generated/prisma/client";

function field(form: FormData, key: string, max = 2000) {
  const value = String(form.get(key) ?? "").trim();
  if (value.length > max) throw new Error(`${key} is too long.`);
  return value;
}
function required(form: FormData, key: string, max = 2000) {
  const value = field(form, key, max);
  if (!value) throw new Error(`${key} is required.`);
  return value;
}
function optionalNumber(form: FormData, key: string): number | null {
  const raw = field(form, key, 40);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${key} must be a number.`);
  return n;
}

async function requireQuality(session: Session) {
  await assertModuleEnabled(session, "quality");
}

async function nextNumber(tx: Prisma.TransactionClient, organisationId: string, prefix: string) {
  const seq = await tx.qualitySequence.upsert({ where: { organisationId_prefix: { organisationId, prefix } }, create: { organisationId, prefix, value: 1 }, update: { value: { increment: 1 } } });
  return `${prefix}-${String(seq.value).padStart(6, "0")}`;
}

export async function createSpecification(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.specManage);
  await requireQuality(session);
  const productId = required(form, "productId", 100);
  const code = required(form, "code", 60);
  const title = required(form, "title", 250);
  const revision = required(form, "revision", 30);
  const characteristicNames = form.getAll("characteristicName").map(String);
  const characteristicMethods = form.getAll("characteristicMethod").map(String);
  const characteristicUnits = form.getAll("characteristicUnit").map(String);
  const characteristicTargets = form.getAll("characteristicTarget").map(String);
  const characteristicLower = form.getAll("characteristicLower").map(String);
  const characteristicUpper = form.getAll("characteristicUpper").map(String);
  const id = await db.$transaction(async (tx) => {
    if (!(await tx.product.findFirst({ where: { id: productId, organisationId: session.organisationId } }))) throw new Error("Product not found.");
    const spec = await tx.qualitySpecification.create({
      data: {
        organisationId: session.organisationId, productId, code, title, revision, status: "DRAFT", createdByUserId: session.userId,
      },
    });
    for (let i = 0; i < characteristicNames.length; i++) {
      const name = characteristicNames[i]?.trim();
      if (!name) continue;
      const method = (characteristicMethods[i] ?? "PASS_FAIL").trim() || "PASS_FAIL";
      await tx.qualityCharacteristic.create({
        data: {
          organisationId: session.organisationId, specificationId: spec.id, name, method: method as "PASS_FAIL",
          unit: characteristicUnits[i]?.trim() || null,
          target: characteristicTargets[i] ? Number(characteristicTargets[i]) : null,
          lowerLimit: characteristicLower[i] ? Number(characteristicLower[i]) : null,
          upperLimit: characteristicUpper[i] ? Number(characteristicUpper[i]) : null,
          position: i,
        },
      });
    }
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "quality.specification.created", entityType: "QualitySpecification", entityId: spec.id });
    return spec.id;
  });
  revalidatePath("/quality/specifications");
  redirect(`/quality/specifications/${id}`);
}

export async function setSpecificationStatus(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.specManage);
  await requireQuality(session);
  const id = required(form, "specificationId", 100);
  const status = required(form, "status", 20);
  const spec = await requireSpecification(session, id);
  await db.qualitySpecification.update({
    where: { id: spec.id },
    data: { status: status as "EFFECTIVE", effectiveFrom: status === "EFFECTIVE" ? new Date() : spec.effectiveFrom },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "quality.specification.status", entityType: "QualitySpecification", entityId: spec.id, after: { status } });
  revalidatePath(`/quality/specifications/${id}`);
}

export async function createControlPoint(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.controlPointManage);
  await requireQuality(session);
  const code = required(form, "code", 60);
  const name = required(form, "name", 250);
  const productId = field(form, "productId", 100) || null;
  const specificationId = field(form, "specificationId", 100) || null;
  const trigger = required(form, "trigger", 20);
  const sampleSize = Math.max(1, Number(field(form, "sampleSize", 10)) || 1);
  await db.qualityControlPoint.create({
    data: { organisationId: session.organisationId, code, name, productId, specificationId, trigger: trigger as "MANUAL", sampleSize, operation: field(form, "operation", 120) || null },
  });
  revalidatePath("/quality/control-points");
  redirect("/quality/control-points");
}

/** Execute an inspection: records measurements, evaluates pass/fail, and on failure automatically
 *  places a Quality Hold (quarantining matching stock when a warehouse is known) and opens an NCR. */
export async function executeInspection(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.checkExecute);
  await requireQuality(session);
  const controlPointId = required(form, "controlPointId", 100);
  const quantityInspected = Math.max(1, Number(field(form, "quantityInspected", 10)) || 1);
  const lotCode = field(form, "lotCode", 80) || null;
  const warehouseId = field(form, "warehouseId", 100) || null;
  const locationId = field(form, "locationId", 100) || null;
  const characteristicIds = form.getAll("characteristicId").map(String);
  const values = form.getAll("value").map(String);
  const manualPass = form.getAll("pass").map(String);

  const outcome = await db.$transaction(async (tx) => {
    const controlPoint = await tx.qualityControlPoint.findFirst({ where: { id: controlPointId, organisationId: session.organisationId }, include: { specification: { include: { characteristics: true } } } });
    if (!controlPoint) throw new Error("Control point not found.");
    const productId = controlPoint.productId;
    if (!productId) throw new Error("This control point has no product configured.");
    const number = await nextNumber(tx, session.organisationId, "INS");
    const characteristicById = new Map((controlPoint.specification?.characteristics ?? []).map((c) => [c.id, c]));
    let anyFail = false;
    const measurementRows: { characteristicId: string | null; valueNumber: number | null; pass: boolean; name: string }[] = [];
    for (let i = 0; i < characteristicIds.length; i++) {
      const characteristic = characteristicById.get(characteristicIds[i]);
      const numeric = values[i] !== "" && values[i] !== undefined && !Number.isNaN(Number(values[i])) ? Number(values[i]) : null;
      const recordedPass = manualPass[i] === "1" || manualPass[i] === "true";
      const pass = characteristic ? evaluateMeasurement(characteristic.method, numeric, characteristic.lowerLimit ? Number(characteristic.lowerLimit) : null, characteristic.upperLimit ? Number(characteristic.upperLimit) : null, recordedPass) : recordedPass;
      if (!pass) anyFail = true;
      measurementRows.push({ characteristicId: characteristic?.id ?? null, valueNumber: numeric, pass, name: characteristic?.name ?? "Check" });
    }
    const result = measurementRows.length ? (anyFail ? "FAIL" : "PASS") : "PASS";
    const inspection = await tx.qualityInspection.create({
      data: {
        organisationId: session.organisationId, number, controlPointId, specificationId: controlPoint.specificationId, productId,
        lotCode, warehouseId, locationId, quantityInspected, result, inspectedByUserId: session.userId, notes: field(form, "notes", 2000) || null,
      },
    });
    for (const row of measurementRows) {
      await tx.qualityMeasurement.create({ data: { organisationId: session.organisationId, inspectionId: inspection.id, characteristicId: row.characteristicId, valueNumber: row.valueNumber, pass: row.pass } });
    }
    let holdId: string | null = null;
    let ncrId: string | null = null;
    if (result === "FAIL") {
      const holdNumber = await nextNumber(tx, session.organisationId, "QH");
      const hold = await tx.qualityHold.create({
        data: {
          organisationId: session.organisationId, number: holdNumber, productId, lotCode, warehouseId, locationId,
          quantity: quantityInspected, status: "ACTIVE", reason: `Failed inspection ${number}`, inspectionId: inspection.id, placedByUserId: session.userId,
        },
      });
      holdId = hold.id;
      const ncrNumber = await nextNumber(tx, session.organisationId, "NCR");
      const failedNames = measurementRows.filter((r) => !r.pass).map((r) => r.name).join(", ") || "Inspection failure";
      const ncr = await tx.nonConformance.create({
        data: {
          organisationId: session.organisationId, number: ncrNumber, title: `${failedNames} — ${number}`,
          source: "FINAL", status: "OPEN", severity: "MAJOR", productId, specificationId: controlPoint.specificationId,
          inspectionId: inspection.id, holdId: hold.id, quantityAffected: quantityInspected,
          defect: failedNames, reportedByUserId: session.userId,
        },
      });
      ncrId = ncr.id;
    }
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: `quality.inspection.${result.toLowerCase()}`, entityType: "QualityInspection", entityId: inspection.id });
    return { inspectionId: inspection.id, result, holdId, ncrId, warehouseId, locationId, productId, lotCode, quantity: quantityInspected };
  });

  if (outcome.holdId && outcome.warehouseId) {
    try {
      await stockProvider.executeMovement(
        { organisationId: session.organisationId, userId: session.userId },
        {
          requestKey: `quality-hold:${outcome.holdId}`, productId: outcome.productId, warehouseId: outcome.warehouseId,
          locationId: outcome.locationId ?? undefined, toLocationId: outcome.locationId ?? undefined, lotCode: outcome.lotCode ?? undefined,
          quantity: outcome.quantity, status: "AVAILABLE", toStatus: "QUARANTINE",
          reason: "Quality hold — failed inspection", reference: `quality-hold:${outcome.holdId}`,
        },
      );
    } catch {
      // Stock could not be located/quarantined automatically (e.g. untracked position) — the
      // QualityHold record remains authoritative and a quality manager can quarantine manually.
    }
  }

  revalidatePath("/quality", "layout");
  if (outcome.ncrId) redirect(`/quality/ncr/${outcome.ncrId}`);
  redirect(`/quality/checks?inspected=${outcome.inspectionId}`);
}

export async function releaseHold(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.holdRelease);
  await requireQuality(session);
  const id = required(form, "holdId", 100);
  const note = required(form, "releaseNote", 2000);
  const hold = await db.qualityHold.findFirst({ where: { id, organisationId: session.organisationId } });
  if (!hold) throw new Error("Hold not found.");
  if (hold.status !== "ACTIVE") throw new Error("This hold is already released.");
  await db.qualityHold.update({ where: { id: hold.id }, data: { status: "RELEASED", releasedByUserId: session.userId, releasedAt: new Date(), releaseNote: note } });
  if (hold.warehouseId) {
    try {
      await stockProvider.executeMovement(
        { organisationId: session.organisationId, userId: session.userId },
        {
          requestKey: `quality-release:${hold.id}`, productId: hold.productId, warehouseId: hold.warehouseId,
          locationId: hold.locationId ?? undefined, toLocationId: hold.locationId ?? undefined, lotCode: hold.lotCode ?? undefined,
          quantity: hold.quantity, status: "QUARANTINE", toStatus: "AVAILABLE",
          reason: "Quality hold released", reference: `quality-release:${hold.id}`,
        },
      );
    } catch {
      // Position may already have moved; the hold record itself is the authoritative release.
    }
  }
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "quality.hold.released", entityType: "QualityHold", entityId: hold.id, after: { note } });
  revalidatePath("/quality", "layout");
}

export async function reportNcr(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.ncrReport);
  await requireQuality(session);
  const title = required(form, "title", 250);
  const defect = required(form, "defect", 2000);
  const source = required(form, "source", 20);
  const severity = required(form, "severity", 20);
  const productId = field(form, "productId", 100) || null;
  const quantityAffected = optionalNumber(form, "quantityAffected");
  const containment = field(form, "containment", 4000) || null;
  const id = await db.$transaction(async (tx) => {
    const number = await nextNumber(tx, session.organisationId, "NCR");
    const ncr = await tx.nonConformance.create({
      data: {
        organisationId: session.organisationId, number, title, defect, source: source as "OTHER", severity: severity as "MINOR",
        productId, quantityAffected, containment, status: containment ? "CONTAINED" : "OPEN", reportedByUserId: session.userId,
      },
    });
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "quality.ncr.reported", entityType: "NonConformance", entityId: ncr.id });
    return ncr.id;
  });
  revalidatePath("/quality/ncr");
  redirect(`/quality/ncr/${id}`);
}

export async function updateNcrInvestigation(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.ncrManage);
  await requireQuality(session);
  const id = required(form, "ncrId", 100);
  const ncr = await requireNcr(session, id);
  const containment = field(form, "containment", 4000) || ncr.containment;
  const rootCause = field(form, "rootCause", 4000) || ncr.rootCause;
  const rootCauseConfirmed = field(form, "rootCauseConfirmed") === "1";
  const disposition = field(form, "disposition", 30) || ncr.disposition;
  const dispositionNote = field(form, "dispositionNote", 2000) || ncr.dispositionNote;
  const status = disposition !== "PENDING" ? "DISPOSITIONED" : rootCause ? "INVESTIGATING" : ncr.status;
  await db.nonConformance.updateMany({
    where: { id: ncr.id, organisationId: session.organisationId, version: ncr.version },
    data: { containment, rootCause, rootCauseConfirmed, disposition: disposition as "PENDING", dispositionNote, status: status as "OPEN", version: { increment: 1 } },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "quality.ncr.investigation_updated", entityType: "NonConformance", entityId: ncr.id });
  revalidatePath(`/quality/ncr/${id}`);
}

export async function addNcrAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.ncrManage);
  await requireQuality(session);
  const ncrId = required(form, "ncrId", 100);
  await requireNcr(session, ncrId);
  const description = required(form, "description", 2000);
  const ownerUserId = field(form, "ownerUserId", 100) || session.userId;
  const dueRaw = field(form, "dueDate", 20);
  const effectivenessCriterion = field(form, "effectivenessCriterion", 2000) || null;
  const effectivenessReviewRaw = field(form, "effectivenessReviewDate", 20);
  await db.nonConformanceAction.create({
    data: {
      organisationId: session.organisationId, ncrId, description, ownerUserId,
      dueDate: dueRaw ? new Date(dueRaw) : null, effectivenessCriterion,
      effectivenessReviewDate: effectivenessReviewRaw ? new Date(effectivenessReviewRaw) : null,
    },
  });
  revalidatePath(`/quality/ncr/${ncrId}`);
}

export async function updateNcrAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.ncrManage);
  await requireQuality(session);
  const actionId = required(form, "actionId", 100);
  const ncrId = required(form, "ncrId", 100);
  const status = required(form, "status", 20);
  const effectivenessResult = field(form, "effectivenessResult", 2000) || null;
  const action = await db.nonConformanceAction.findFirst({ where: { id: actionId, organisationId: session.organisationId, ncrId } });
  if (!action) throw new Error("Action not found.");
  await db.nonConformanceAction.update({ where: { id: action.id }, data: { status: status as "OPEN", effectivenessResult: effectivenessResult ?? action.effectivenessResult } });
  revalidatePath(`/quality/ncr/${ncrId}`);
}

export async function closeNcr(form: FormData) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.ncrClose);
  await requireQuality(session);
  const id = required(form, "ncrId", 100);
  const ncr = await requireNcr(session, id);
  const gate = canClose(ncr);
  if (!gate.ok) throw new Error(gate.reason);
  await db.nonConformance.updateMany({
    where: { id: ncr.id, organisationId: session.organisationId, version: ncr.version },
    data: { status: "CLOSED", closedByUserId: session.userId, closedAt: new Date(), version: { increment: 1 } },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "quality.ncr.closed", entityType: "NonConformance", entityId: ncr.id });
  revalidatePath(`/quality/ncr/${id}`);
  revalidatePath("/quality/ncr");
}
