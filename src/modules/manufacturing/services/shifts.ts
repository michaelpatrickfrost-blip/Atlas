"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { parseTimeToMinute, formatMinuteOfDay } from "../domain/calendar";
import { optionalStore } from "./optional";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** §25-27: the planner's flexible man-hours calendar. One row per shift —
 * a work centre (every resource in it) or one specific machine, which days it
 * runs, the hours, and how many people crew it. */
export async function listShifts(organisationId: string) {
  const [shifts, workCentres, resources] = await Promise.all([
    optionalStore(() => db.manufacturingShift.findMany({ where: { organisationId, active: true }, orderBy: { startMinute: "asc" } }), []),
    db.manufacturingWorkCentre.findMany({ where: { organisationId, active: true }, orderBy: { name: "asc" } }),
    db.manufacturingResource.findMany({ where: { organisationId, active: true }, orderBy: { name: "asc" } }),
  ]);
  const centreName = new Map(workCentres.map((c) => [c.id, c.name]));
  const resourceName = new Map(resources.map((r) => [r.id, r.name]));
  return {
    workCentres: workCentres.map((c) => ({ id: c.id, name: c.name })),
    resources: resources.map((r) => ({ id: r.id, name: r.name, workCentreId: r.workCentreId })),
    shifts: shifts.map((s) => ({
      id: s.id,
      label: s.label,
      workCentreId: s.workCentreId,
      workCentreName: centreName.get(s.workCentreId) ?? "",
      resourceId: s.resourceId,
      resourceName: s.resourceId ? resourceName.get(s.resourceId) ?? "" : null,
      days: s.daysOfWeek.map((d) => DAY_LABELS[d]).join(" "),
      daysOfWeek: s.daysOfWeek,
      start: formatMinuteOfDay(s.startMinute),
      end: formatMinuteOfDay(s.endMinute),
      crewCount: s.crewCount,
    })),
  };
}

export async function saveShift(input: { id?: string; workCentreId: string; resourceId?: string | null; label?: string; daysOfWeek: number[]; start: string; end: string; crewCount: number }) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
  const startMinute = parseTimeToMinute(input.start);
  const endMinute = parseTimeToMinute(input.end);
  if (endMinute <= startMinute) throw new Error("End time must be after the start time.");
  if (!input.daysOfWeek.length) throw new Error("Choose at least one day.");
  if (input.crewCount < 1) throw new Error("Crew count must be at least 1.");
  const centre = await db.manufacturingWorkCentre.findFirst({ where: { id: input.workCentreId, organisationId: session.organisationId } });
  if (!centre) throw new Error("Choose a work centre in this company.");

  const data = {
    organisationId: session.organisationId,
    workCentreId: centre.id,
    resourceId: input.resourceId || null,
    label: (input.label ?? "").trim().slice(0, 80),
    daysOfWeek: [...new Set(input.daysOfWeek)].sort(),
    startMinute,
    endMinute,
    crewCount: Math.round(input.crewCount),
  };
  const saved = input.id
    ? await db.manufacturingShift.update({ where: { id: input.id }, data })
    : await db.manufacturingShift.create({ data });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: input.id ? "manufacturing.shift.updated" : "manufacturing.shift.created", entityType: "ManufacturingShift", entityId: saved.id, after: data });
  revalidatePath("/manufacturing/schedule");
}

export async function deleteShift(shiftId: string) {
  const session = await requireSession();
  assertCapability(session, C.resourceManage);
  const updated = await db.manufacturingShift.updateMany({ where: { id: shiftId, organisationId: session.organisationId }, data: { active: false } });
  if (!updated.count) throw new Error("This shift no longer exists.");
  revalidatePath("/manufacturing/schedule");
}
