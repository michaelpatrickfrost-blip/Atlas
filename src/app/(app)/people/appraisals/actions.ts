"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";
import { logEmployeeHistory } from "@/modules/people/domain/history";
import { nextAppraisalDate, cycleLabel } from "@/modules/people/domain/scheduling";

export async function scheduleAppraisal(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.appraisalManage);
  await assertModuleEnabled(session, "people");
  const employeeId = String(form.get("employeeId") ?? "");
  const cycle = String(form.get("cycle") ?? "").trim();
  const scheduledAt = new Date(String(form.get("scheduledAt") ?? ""));
  const templateId = String(form.get("templateId") ?? "") || null;
  if (!cycle || cycle.length > 150) throw new Error("Enter a cycle label, e.g. '2026 H1 review'.");
  if (isNaN(scheduledAt.getTime())) throw new Error("Enter a valid date.");
  const employee = await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId }, include: { manager: { select: { userId: true } } } });
  if (templateId) await db.appraisalTemplate.findFirstOrThrow({ where: { id: templateId, organisationId: session.organisationId } });
  const reviewerUserId = String(form.get("reviewerUserId") ?? "") || employee.manager?.userId || session.userId;

  await db.membership.findFirstOrThrow({ where: { organisationId: session.organisationId, userId: reviewerUserId } });
  const appraisal = await db.appraisal.create({
    data: { organisationId: session.organisationId, employeeId, cycle, scheduledAt, reviewerUserId, templateId },
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
  const existing = await db.appraisal.findFirstOrThrow({ where: { id: appraisalId, organisationId: session.organisationId }, include: { template: true } });
  const answers = existing.template
    ? existing.template.questions.map((question, i) => ({ question, answer: String(form.get(`answer_${i}`) ?? "").trim().slice(0, 2000) }))
    : undefined;

  const appraisal = await db.$transaction(async (tx) => {
  const appraisal = await tx.appraisal.update({
    where: { id: appraisalId, organisationId: session.organisationId, status: "SCHEDULED" },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      rating: rating as never,
      strengths: String(form.get("strengths") ?? "").slice(0, 5000) || null,
      areasForGrowth: String(form.get("areasForGrowth") ?? "").slice(0, 5000) || null,
      goals: String(form.get("goals") ?? "").slice(0, 5000) || null,
      answers: answers as never,
    },
    include: { employee: { include: { manager: { select: { userId: true } } } } },
  });

  const org = await tx.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { hrAppraisalCadenceMonths: true } });
  const nextAt = nextAppraisalDate(new Date(), appraisal.employee.appraisalCadenceMonths, org.hrAppraisalCadenceMonths);
  await tx.appraisal.create({
    data: {
      organisationId: session.organisationId,
      employeeId: appraisal.employeeId,
      reviewerUserId: appraisal.employee.manager?.userId ?? appraisal.reviewerUserId,
      cycle: cycleLabel(nextAt),
      scheduledAt: nextAt,
      templateId: existing.templateId,
    },
  });

    return appraisal;
  });

  await logEmployeeHistory({ organisationId: session.organisationId, employeeId: appraisal.employeeId, type: "APPRAISAL_COMPLETED", description: `Appraisal "${appraisal.cycle}" completed${rating ? ` — rated ${rating.replaceAll("_", " ")}` : ""}.` });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "appraisal.completed", entityType: "Appraisal", entityId: appraisalId });
  revalidatePath("/people/appraisals");
  revalidatePath("/people/my-team");
  revalidatePath("/people/workspace");
  revalidatePath(`/people/${appraisal.employeeId}`);
}
