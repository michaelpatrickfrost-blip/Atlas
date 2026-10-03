"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";

const ABSENCE_TYPES = ["SICKNESS", "HOLIDAY", "UNPAID", "COMPASSIONATE", "MATERNITY_PATERNITY", "OTHER"];

export async function logAbsence(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.absenceManage);
  await assertModuleEnabled(session, "people");
  const employeeId = String(form.get("employeeId") ?? "");
  const type = String(form.get("type") ?? "");
  const startDate = new Date(String(form.get("startDate") ?? ""));
  const endDate = new Date(String(form.get("endDate") ?? ""));
  if (!ABSENCE_TYPES.includes(type)) throw new Error("Invalid absence type.");
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) throw new Error("Enter a valid date range.");
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });

  const record = await db.absenceRecord.create({
    data: {
      organisationId: session.organisationId,
      employeeId,
      type: type as never,
      startDate,
      endDate,
      reason: String(form.get("reason") ?? "").slice(0, 1000) || null,
      certifiedByDoctor: form.get("certifiedByDoctor") === "on",
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "absence.logged", entityType: "AbsenceRecord", entityId: record.id, after: { type, startDate, endDate } });
  revalidatePath("/people/absence");
  revalidatePath(`/people/${employeeId}`);
}
