"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";

export async function scheduleOneToOne(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.oneToOneManage);
  await assertModuleEnabled(session, "people");
  const employeeId = String(form.get("employeeId") ?? "");
  const scheduledAt = new Date(String(form.get("scheduledAt") ?? ""));
  if (isNaN(scheduledAt.getTime())) throw new Error("Enter a valid date and time.");
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
  await db.oneToOne.create({
    data: { organisationId: session.organisationId, employeeId, scheduledAt, managerUserId: session.userId, talkingPoints: String(form.get("talkingPoints") ?? "").slice(0, 3000) || null },
  });
  revalidatePath("/people/one-to-ones");
  revalidatePath(`/people/${employeeId}`);
}

export async function completeOneToOne(id: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.oneToOneManage);
  await assertModuleEnabled(session, "people");
  const oneToOne = await db.oneToOne.update({
    where: { id, organisationId: session.organisationId },
    data: { status: "COMPLETED", completedAt: new Date(), notes: String(form.get("notes") ?? "").slice(0, 5000) || null, actionPoints: String(form.get("actionPoints") ?? "").slice(0, 3000) || null },
  });
  revalidatePath("/people/one-to-ones");
  revalidatePath(`/people/${oneToOne.employeeId}`);
}
