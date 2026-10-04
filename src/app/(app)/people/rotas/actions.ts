"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";

export async function createShift(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.rotaManage);
  await assertModuleEnabled(session, "people");
  const employeeId = String(form.get("employeeId") ?? "");
  const startsAt = new Date(String(form.get("startsAt") ?? ""));
  const endsAt = new Date(String(form.get("endsAt") ?? ""));
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime()) || endsAt <= startsAt) throw new Error("Enter a valid start and end time.");
  const employee = await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
  if (["LEFT", "OFFBOARDING"].includes(employee.status)) throw new Error("Cannot schedule a shift for a leaver.");
  const overlap = await db.rotaShift.count({ where: { organisationId: session.organisationId, employeeId, status: { not: "CANCELLED" }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } });
  if (overlap) throw new Error("This employee already has an overlapping shift.");
  const absence = await db.absenceRecord.count({ where: { organisationId: session.organisationId, employeeId, status: "APPROVED", startDate: { lt: endsAt }, endDate: { gte: new Date(Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth(), startsAt.getUTCDate())) } } });
  if (absence) throw new Error("This employee has approved absence during this shift.");
  await db.rotaShift.create({
    data: {
      organisationId: session.organisationId,
      employeeId,
      startsAt,
      endsAt,
      role: String(form.get("role") ?? "").trim() || null,
      location: String(form.get("location") ?? "").trim() || null,
    },
  });
  revalidatePath("/people/rotas");
  revalidatePath(`/people/${employeeId}`);
}

export async function changeShiftStatus(shiftId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.rotaManage);
  await assertModuleEnabled(session, "people");
  const status = String(form.get("status") ?? "");
  if (!["SCHEDULED", "CONFIRMED", "CANCELLED"].includes(status)) throw new Error("Invalid shift status.");
  const shift = await db.rotaShift.update({ where: { id: shiftId, organisationId: session.organisationId }, data: { status: status as never } });
  revalidatePath("/people/rotas");
  revalidatePath(`/people/${shift.employeeId}`);
}
