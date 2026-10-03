"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";

export async function scheduleAppraisal(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.appraisalManage);
  await assertModuleEnabled(session, "people");
  const employeeId = String(form.get("employeeId") ?? "");
  const cycle = String(form.get("cycle") ?? "").trim();
  const scheduledAt = new Date(String(form.get("scheduledAt") ?? ""));
  if (!cycle || cycle.length > 150) throw new Error("Enter a cycle label, e.g. '2026 H1 review'.");
  if (isNaN(scheduledAt.getTime())) throw new Error("Enter a valid date.");
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });

  const appraisal = await db.appraisal.create({
    data: { organisationId: session.organisationId, employeeId, cycle, scheduledAt, reviewerUserId: String(form.get("reviewerUserId") ?? session.userId) },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "appraisal.scheduled", entityType: "Appraisal", entityId: appraisal.id });
  revalidatePath("/people/appraisals");
  revalidatePath(`/people/${employeeId}`);
}

export async function completeAppraisal(appraisalId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.appraisalManage);
  await assertModuleEnabled(session, "people");
  const rating = String(form.get("rating") ?? "") || null;
  const appraisal = await db.appraisal.update({
    where: { id: appraisalId, organisationId: session.organisationId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      rating: rating as never,
      strengths: String(form.get("strengths") ?? "").slice(0, 5000) || null,
      areasForGrowth: String(form.get("areasForGrowth") ?? "").slice(0, 5000) || null,
      goals: String(form.get("goals") ?? "").slice(0, 5000) || null,
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "appraisal.completed", entityType: "Appraisal", entityId: appraisalId });
  revalidatePath("/people/appraisals");
  revalidatePath(`/people/${appraisal.employeeId}`);
}
