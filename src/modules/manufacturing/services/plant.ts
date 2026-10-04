"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { resourceType } from "../domain/plant";

export async function loadPlant() {
  const session = await requireSession();
  assertCapability(session, C.orderRead);
  const organisationId = session.organisationId;
  const [centres, resources, steps] = await Promise.all([
    db.manufacturingWorkCentre.findMany({ where: { organisationId }, orderBy: { name: "asc" } }),
    db.manufacturingResource.findMany({ where: { organisationId }, orderBy: { name: "asc" } }),
    db.productOperation.findMany({
      where: { organisationId, definition: { status: "ACTIVE" }, OR: [{ workCentreId: { not: null } }, { resourceId: { not: null } }] },
      select: { name: true, workCentreId: true, resourceId: true, definition: { select: { product: { select: { id: true, code: true, name: true } } } } },
    }),
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
        products: productsFor((step) => step.resourceId === resource.id),
      })),
      products: productsFor((step) => step.workCentreId === centre.id && !step.resourceId),
    })),
  };
}

export async function saveWorkCentre(input: { id?: string; code: string; name: string; description: string }) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
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

export async function saveMachine(input: { id?: string; workCentreId: string; name: string; type: string; nominalUnitsPerHour: number | null }) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
  const name = input.name.trim().slice(0, 120);
  const type = resourceType(input.type);
  const rate = input.nominalUnitsPerHour == null || input.nominalUnitsPerHour === 0 ? null : Number(input.nominalUnitsPerHour);
  if (!name) throw new Error("Enter the machine name.");
  if (rate != null && (!Number.isFinite(rate) || rate < 0)) throw new Error("Enter how many units an hour this machine can run, or leave it blank.");
  const centre = await db.manufacturingWorkCentre.findFirst({ where: { id: input.workCentreId, organisationId: session.organisationId, active: true } });
  if (!centre) throw new Error("Choose a work centre in this company.");
  const existing = input.id ? await db.manufacturingResource.findFirst({ where: { id: input.id, organisationId: session.organisationId } }) : null;
  if (input.id && !existing) throw new Error("That machine is not in this company.");
  const saved = existing
    ? await db.manufacturingResource.update({ where: { id: existing.id }, data: { workCentreId: centre.id, name, type, nominalUnitsPerHour: rate, active: true } })
    : await db.manufacturingResource.create({ data: { organisationId: session.organisationId, workCentreId: centre.id, name, type, nominalUnitsPerHour: rate } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: existing ? "manufacturing.resource.updated" : "manufacturing.resource.created", entityType: "ManufacturingResource", entityId: saved.id, after: { name, type, workCentreId: centre.id } });
  revalidatePath("/manufacturing/plant");
  revalidatePath("/products");
}

export async function retirePlantRecord(kind: "centre" | "machine", id: string) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
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
