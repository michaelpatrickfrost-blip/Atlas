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
import { QualityInputError } from "../domain/workspace";
import { evaluateMeasurement } from "../domain/workflow";
import { requireSpecification } from "./queries";
import type { Prisma } from "@/generated/prisma/client";

function field(form: FormData, key: string, max = 2000) {
  const value = String(form.get(key) ?? "").trim();
  if (value.length > max) throw new QualityInputError(`${key} is too long.`);
  return value;
}
function required(form: FormData, key: string, max = 2000) {
  const value = field(form, key, max);
  if (!value) throw new QualityInputError(`${key} is required.`);
  return value;
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
  if(productId&&!await db.product.findFirst({where:{id:productId,organisationId:session.organisationId}}))throw new Error("Product not found.");
  if(specificationId){const spec=await db.qualitySpecification.findFirst({where:{id:specificationId,organisationId:session.organisationId}});if(!spec||productId&&spec.productId!==productId)throw new Error("Choose a specification for this company and product.");}
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
  const quantityInspected = Number(field(form, "quantityInspected", 10));
  if(!Number.isSafeInteger(quantityInspected)||quantityInspected<1||quantityInspected>2147483647)return {error:"Enter a positive whole quantity inspected."};
  const lotCode = field(form, "lotCode", 80) || null;
  const warehouseId = field(form, "warehouseId", 100) || null;
  const locationId = field(form, "locationId", 100) || null;
  const characteristicIds = form.getAll("characteristicId").map(String);

  let outcome;
  try { outcome = await db.$transaction(async (tx) => {
    const controlPoint = await tx.qualityControlPoint.findFirst({ where: { id: controlPointId, organisationId: session.organisationId }, include: { specification: { include: { characteristics: true } } } });
    if (!controlPoint || !controlPoint.active) throw new Error("Active control point not found.");
    if(warehouseId&&!await tx.warehouse.findFirst({where:{id:warehouseId,organisationId:session.organisationId}}))throw new QualityInputError("Choose a warehouse from this company.");
    if(locationId&&!await tx.stockLocation.findFirst({where:{id:locationId,organisationId:session.organisationId,...(warehouseId?{warehouseId}:{})}}))throw new QualityInputError("Choose a location from this company and warehouse.");
    if(controlPoint.specification&&controlPoint.specification.status!=="EFFECTIVE")throw new QualityInputError("Use an effective specification for inspection.");
    const productId = controlPoint.productId ?? controlPoint.specification?.productId;
    if (!productId) throw new QualityInputError("Configure a product or product specification for this control point before inspection.");
    if(!await tx.product.findFirst({where:{id:productId,organisationId:session.organisationId}}))throw new Error("Product unavailable.");
    if(controlPoint.specification&&(controlPoint.specification.organisationId!==session.organisationId||controlPoint.specification.productId!==productId))throw new Error("Specification unavailable for this company and product.");
    const number = await nextNumber(tx, session.organisationId, "INS");
    const characteristicById = new Map((controlPoint.specification?.characteristics ?? []).map((c) => [c.id, c]));
    let anyFail = false;
    const measurementRows: { characteristicId: string | null; valueNumber: number | null; pass: boolean; name: string }[] = [];
    const configured=controlPoint.specification?.characteristics??[];
    if(new Set(characteristicIds).size!==characteristicIds.length||characteristicIds.length!==configured.length||characteristicIds.some(id=>!characteristicById.has(id)))throw new QualityInputError("Complete every configured characteristic exactly once.");
    for(const characteristic of configured){
      const raw=field(form,`value:${characteristic.id}`,100),answer=field(form,`pass:${characteristic.id}`,10);
      const numeric=raw?Number(raw):null;
      if(characteristic.method==="MEASUREMENT"&&(numeric===null||!Number.isFinite(numeric)))throw new QualityInputError(`Enter a finite measurement for ${characteristic.name}.`);
      if(characteristic.method!=="MEASUREMENT"&&!["1","0"].includes(answer))throw new QualityInputError(`Record pass or fail for ${characteristic.name}.`);
      const pass=evaluateMeasurement(characteristic.method,numeric,characteristic.lowerLimit!==null?Number(characteristic.lowerLimit):null,characteristic.upperLimit!==null?Number(characteristic.upperLimit):null,answer==="1");
      if(!pass)anyFail=true;
      measurementRows.push({characteristicId:characteristic.id,valueNumber:characteristic.method==="MEASUREMENT"?numeric:null,pass,name:characteristic.name});
    }
    if(!configured.length){const answer=field(form,"pass",10);if(!["1","0"].includes(answer))throw new QualityInputError("Explicitly record pass or fail for this inspection.");anyFail=answer==="0";measurementRows.push({characteristicId:null,valueNumber:null,pass:!anyFail,name:"Manual inspection"});}
    const result=anyFail?"FAIL":"PASS";
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
          source: controlPoint.trigger === "RECEIPT" ? "INCOMING" : controlPoint.trigger === "PRODUCTION" ? "MANUFACTURING" : "FINAL", status: "OPEN", severity: "MAJOR", productId, specificationId: controlPoint.specificationId,
          inspectionId: inspection.id, holdId: hold.id, quantityAffected: quantityInspected,
          defect: failedNames, reportedByUserId: session.userId,
        },
      });
      ncrId = ncr.id;
    }
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: `quality.inspection.${result.toLowerCase()}`, entityType: "QualityInspection", entityId: inspection.id }, tx);
    return { inspectionId: inspection.id, result, holdId, ncrId, warehouseId, locationId, productId, lotCode, quantity: quantityInspected };
  }); } catch(error) {if(error instanceof QualityInputError)return {error:error.message};throw error;}

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
 const actions = await import("./ncr-actions");
 return actions.reportNcr(form);
}
export async function updateNcrInvestigation(form: FormData) {
 const session = await requireSession();
 assertCapability(session, QUALITY_CAPABILITIES.ncrManage);
 const actions = await import("./ncr-actions");
 return actions.updateNcrInvestigation(form);
}
export async function addNcrAction(form: FormData) {
 const session = await requireSession();
 assertCapability(session, QUALITY_CAPABILITIES.ncrManage);
 const actions = await import("./ncr-actions");
 return actions.addNcrAction(form);
}
export async function updateNcrAction(form: FormData) {
 const session = await requireSession();
 assertCapability(session, QUALITY_CAPABILITIES.ncrManage);
 const actions = await import("./ncr-actions");
 return actions.updateNcrAction(form);
}
export async function closeNcr(form: FormData) {
 const session = await requireSession();
 assertCapability(session, QUALITY_CAPABILITIES.ncrClose);
 const actions = await import("./ncr-actions");
 return actions.closeNcr(form);
}
