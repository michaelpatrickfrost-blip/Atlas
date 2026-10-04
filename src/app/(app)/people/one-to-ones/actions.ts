"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { logEmployeeHistory } from "@/modules/people/domain/history";
import { nextOneToOneDate } from "@/modules/people/domain/scheduling";

export async function scheduleOneToOne(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.oneToOneManage);
  await assertModuleEnabled(session, "people");
  const employeeId = String(form.get("employeeId") ?? "");
  const scheduledAt = new Date(String(form.get("scheduledAt") ?? ""));
  const templateId = String(form.get("templateId") ?? "") || null;
  if (isNaN(scheduledAt.getTime())) throw new Error("Enter a valid date and time.");
  const employee = await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId }, include: { manager: { select: { userId: true } } } });
  if (templateId) await db.oneToOneTemplate.findFirstOrThrow({ where: { id: templateId, organisationId: session.organisationId } });
  const managerUserId = employee.manager?.userId ?? session.userId;
  await db.oneToOne.create({
    data: { organisationId: session.organisationId, employeeId, scheduledAt, managerUserId, templateId, talkingPoints: String(form.get("talkingPoints") ?? "").slice(0, 3000) || null },
  });
  revalidatePath("/people/one-to-ones");
  revalidatePath("/people/my-team");
  revalidatePath("/people/workspace");
  revalidatePath(`/people/${employeeId}`);
}

export async function completeOneToOne(id: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.oneToOneManage);
  await assertModuleEnabled(session, "people");
  const existing = await db.oneToOne.findFirstOrThrow({ where: { id, organisationId: session.organisationId }, include: { template: true } });
  const answers = existing.template
    ? existing.template.talkingPoints.map((topic, i) => ({ topic, notes: String(form.get(`answer_${i}`) ?? "").trim().slice(0, 2000) }))
    : undefined;

  const oneToOne = await db.$transaction(async (tx) => {
  const oneToOne = await tx.oneToOne.update({
    where: { id: id, organisationId: session.organisationId, status: "SCHEDULED" },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      notes: String(form.get("notes") ?? "").slice(0, 5000) || null,
      actionPoints: String(form.get("actionPoints") ?? "").slice(0, 3000) || null,
      answers: answers as never,
    },
    include: { employee: { select: { oneToOneCadenceWeeks: true } } },
  });

  const org = await tx.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { hrOneToOneCadenceWeeks: true } });
  const nextAt = nextOneToOneDate(new Date(), oneToOne.employee.oneToOneCadenceWeeks, org.hrOneToOneCadenceWeeks);
  await tx.oneToOne.create({
    data: { organisationId: session.organisationId, employeeId: oneToOne.employeeId, managerUserId: oneToOne.managerUserId, scheduledAt: nextAt, templateId: existing.templateId },
  });

    return oneToOne;
  });

  if (oneToOne.actionPoints) {
    await logEmployeeHistory({ organisationId: session.organisationId, employeeId: oneToOne.employeeId, type: "ONE_TO_ONE_COMPLETED", description: `One-to-one completed — actions: ${oneToOne.actionPoints}` });
  }
  revalidatePath("/people/one-to-ones");
  revalidatePath("/people/my-team");
  revalidatePath("/people/workspace");
  revalidatePath(`/people/${oneToOne.employeeId}`);
}
