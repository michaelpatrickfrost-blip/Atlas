"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertModuleEnabled } from "@/core/modules/access";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { resourceType, PROCESS_KINDS } from "../domain/plant";

export async function loadPlant() {
  const session = await requireSession();
  assertCapability(session, C.orderRead);
  const organisationId = session.organisationId;
  const [centres, resources, steps, downtime] = await Promise.all([
    db.manufacturingWorkCentre.findMany({ where: { organisationId }, orderBy: { name: "asc" } }),
    db.manufacturingResource.findMany({ where: { organisationId }, orderBy: { name: "asc" } }),
    db.productOperation.findMany({
      where: { organisationId, definition: { status: "ACTIVE" }, OR: [{ workCentreId: { not: null } }, { resourceId: { not: null } }] },
      select: { name: true, workCentreId: true, resourceId: true, eligibleResourceIds: true, definition: { select: { product: { select: { id: true, code: true, name: true } } } } },
    }),
    db.manufacturingDowntime.findMany({ where: { organisationId, active: true, endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 500 }),
  ]);
  const productsFor = (match: (step: typeof steps[number]) => boolean) => {
    const seen = new Map<string, { id: string; code: string; name: string; steps: string[] }>();
    for (const step of steps.filter(match)) {
      const product = step.definition.product;
      const row = seen.get(product.id) ?? { ...product, steps: [] };
      if (!row.steps.includes(step.name)) row.steps.push(step.name);
      seen.set(product.id, row);
    }
    return [...seen.values()];
  };
  return {
    canEdit: session.capabilities.has(C.resourceManage),
    downtime: downtime.map((d) => ({ id: d.id, resourceId: d.resourceId, startsAt: d.startsAt.toISOString(), endsAt: d.endsAt.toISOString(), reason: d.reason })),
    centres: centres.map((centre) => ({
      id: centre.id,
      code: centre.code,
      name: centre.name,
      description: centre.description,
      active: centre.active,
      machines: resources.filter((resource) => resource.workCentreId === centre.id).map((resource) => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        nominalUnitsPerHour: resource.nominalUnitsPerHour == null ? null : Number(resource.nominalUnitsPerHour),
        active: resource.active,
        processKind: resource.processKind,
        calendarMode: resource.calendarMode,
        timezone: resource.timezone,
        products: productsFor((step) => step.resourceId === resource.id || step.eligibleResourceIds.includes(resource.id) || !step.resourceId && !step.eligibleResourceIds.length && step.workCentreId === resource.workCentreId),
      })),
      products: productsFor((step) => step.workCentreId === centre.id && !step.resourceId),
    })),
  };
}

export async function saveWorkCentre(input: { id?: string; code: string; name: string; description: string }) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
  await assertModuleEnabled(session, "manufacturing");
  const code = input.code.trim().slice(0, 40);
  const name = input.name.trim().slice(0, 120);
  const description = input.description.trim().slice(0, 500) || null;
  if (!code || !name) throw new Error("Enter a code and a name for the work centre.");
  const existing = input.id ? await db.manufacturingWorkCentre.findFirst({ where: { id: input.id, organisationId: session.organisationId } }) : null;
  if (input.id && !existing) throw new Error("That work centre is not in this company.");
  const duplicate = await db.manufacturingWorkCentre.findFirst({ where: { organisationId: session.organisationId, code, ...(existing ? { NOT: { id: existing.id } } : {}) }, select: { id: true } });
  if (duplicate) throw new Error("That work centre code is already used.");
  const saved = existing
    ? await db.manufacturingWorkCentre.update({ where: { id: existing.id }, data: { code, name, description, active: true } })
    : await db.manufacturingWorkCentre.create({ data: { organisationId: session.organisationId, code, name, description } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: existing ? "manufacturing.work_centre.updated" : "manufacturing.work_centre.created", entityType: "ManufacturingWorkCentre", entityId: saved.id, after: { code, name } });
  revalidatePath("/manufacturing/plant");
  revalidatePath("/products");
}

export async function saveMachine(input: { id?: string; workCentreId: string; name: string; type: string; nominalUnitsPerHour: number | null; processKind?: string; calendarMode?: string; timezone?: string }) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
  await assertModuleEnabled(session, "manufacturing");
  const name = input.name.trim().slice(0, 120);
  const type = resourceType(input.type);
  const processKind = input.processKind ?? "GENERAL";
  const calendarMode = input.calendarMode ?? "CONTINUOUS";
  const timezone = input.timezone ?? "Europe/London";
  if (!PROCESS_KINDS.some((p) => p.id === processKind)) throw new Error("Choose a valid process type.");
  if (!["SHIFTS", "CONTINUOUS"].includes(calendarMode)) throw new Error("Choose shift hours or continuous operation.");
  try { new Intl.DateTimeFormat("en-GB", { timeZone: timezone }).format(); } catch { throw new Error("Enter a valid plant timezone, such as Europe/London."); }
  const rate = input.nominalUnitsPerHour == null || input.nominalUnitsPerHour === 0 ? null : Number(input.nominalUnitsPerHour);
  if (!name) throw new Error("Enter the machine name.");
  if (rate != null && (!Number.isFinite(rate) || rate < 0)) throw new Error("Enter how many units an hour this machine can run, or leave it blank.");
  const centre = await db.manufacturingWorkCentre.findFirst({ where: { id: input.workCentreId, organisationId: session.organisationId, active: true } });
  if (!centre) throw new Error("Choose a work centre in this company.");
  const existing = input.id ? await db.manufacturingResource.findFirst({ where: { id: input.id, organisationId: session.organisationId } }) : null;
  if (input.id && !existing) throw new Error("That machine is not in this company.");
  if (existing && existing.workCentreId !== centre.id) {
    const used = await db.productOperation.count({ where: { organisationId: session.organisationId, definition: { status: "ACTIVE" }, OR: [{ resourceId: existing.id }, { eligibleResourceIds: { has: existing.id } }] } });
    const booked = await db.manufacturingWorkOrder.count({ where: { organisationId: session.organisationId, resourceId: existing.id, status: { not: "COMPLETE" } } });
    if (used || booked) throw new Error("This machine has routings or open production. Keep its work centre, or review those assignments first.");
  }
  const data = { workCentreId: centre.id, name, type, nominalUnitsPerHour: rate, active: true, processKind, calendarMode, timezone };
  const saved = existing
    ? await db.manufacturingResource.update({ where: { id: existing.id, organisationId: session.organisationId, updatedAt: existing.updatedAt }, data })
    : await db.manufacturingResource.create({ data: { organisationId: session.organisationId, ...data } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: existing ? "manufacturing.resource.updated" : "manufacturing.resource.created", entityType: "ManufacturingResource", entityId: saved.id, after: { name, type, workCentreId: centre.id, processKind, calendarMode, timezone, nominalUnitsPerHour: rate } });
  revalidatePath("/manufacturing/plant");
  revalidatePath("/products");
  revalidatePath("/manufacturing/schedule");
}

export async function saveDowntime(input: { resourceId: string; startsAt: string; endsAt: string; reason: string }) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
  await assertModuleEnabled(session, "manufacturing");
  const startsAt = new Date(input.startsAt), endsAt = new Date(input.endsAt), reason = input.reason.trim().slice(0, 500);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt || endsAt.getTime() - startsAt.getTime() > 366 * 86_400_000) throw new Error("Enter a valid downtime window, up to one year.");
  if (!reason) throw new Error("Enter the maintenance, holiday or outage reason.");
  await db.$transaction(async (tx) => {
    const resource = await tx.manufacturingResource.findFirst({ where: { id: input.resourceId, organisationId: session.organisationId, active: true } });
    if (!resource) throw new Error("Choose an active machine in this company.");
    const saved = await tx.manufacturingDowntime.create({ data: { organisationId: session.organisationId, resourceId: resource.id, startsAt, endsAt, reason, createdByUserId: session.userId } });
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.downtime.created", entityType: "ManufacturingDowntime", entityId: saved.id, after: { resourceId: resource.id, startsAt, endsAt, reason } }, tx);
  }, { isolationLevel: "Serializable" });
  revalidatePath("/manufacturing/plant");
  revalidatePath("/manufacturing/schedule");
}

export async function cancelDowntime(id: string) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
  await assertModuleEnabled(session, "manufacturing");
  await db.$transaction(async (tx) => {
    const changed = await tx.manufacturingDowntime.updateMany({ where: { id, organisationId: session.organisationId, active: true }, data: { active: false } });
    if (!changed.count) throw new Error("This downtime is already cancelled or is not in this company.");
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.downtime.cancelled", entityType: "ManufacturingDowntime", entityId: id }, tx);
  });
  revalidatePath("/manufacturing/plant");
  revalidatePath("/manufacturing/schedule");
}

export async function retirePlantRecord(kind: "centre" | "machine", id: string) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
  await assertModuleEnabled(session, "manufacturing");
  if (kind === "centre") {
    const centre = await db.manufacturingWorkCentre.findFirst({ where: { id, organisationId: session.organisationId } });
    if (!centre) throw new Error("That work centre is not in this company.");
    await db.$transaction([
      db.manufacturingWorkCentre.update({ where: { id: centre.id }, data: { active: false } }),
      db.manufacturingResource.updateMany({ where: { organisationId: session.organisationId, workCentreId: centre.id }, data: { active: false } }),
    ]);
  } else {
    const machine = await db.manufacturingResource.findFirst({ where: { id, organisationId: session.organisationId } });
    if (!machine) throw new Error("That machine is not in this company.");
    await db.manufacturingResource.update({ where: { id: machine.id }, data: { active: false } });
  }
  revalidatePath("/manufacturing/plant");
  revalidatePath("/products");
}
