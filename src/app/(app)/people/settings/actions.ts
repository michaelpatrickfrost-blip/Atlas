"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES, HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";

export async function updateHrSettings(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);
  await assertModuleEnabled(session, "people");
  const hrAppraisalCadenceMonths = Math.max(1, Number(form.get("hrAppraisalCadenceMonths") ?? 6));
  const hrOneToOneCadenceWeeks = Math.max(1, Number(form.get("hrOneToOneCadenceWeeks") ?? 2));
  const hrStandardWeeklyHours = Math.max(1, Number(form.get("hrStandardWeeklyHours") ?? 37.5));
  const hrOvertimeMultiplier = Math.max(1, Number(form.get("hrOvertimeMultiplier") ?? 1.5));
  await db.organisation.update({
    where: { id: session.organisationId },
    data: { hrAppraisalCadenceMonths, hrOneToOneCadenceWeeks, hrStandardWeeklyHours, hrOvertimeMultiplier },
  });
  revalidatePath("/people/settings");
}

export async function createAppraisalTemplate(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.appraisalManage);
  await assertModuleEnabled(session, "people");
  const name = String(form.get("name") ?? "").trim();
  const questions = String(form.get("questions") ?? "").split("\n").map((q) => q.trim()).filter(Boolean);
  if (!name || name.length > 150) throw new Error("Enter a template name.");
  if (questions.length === 0) throw new Error("Enter at least one question, one per line.");
  await db.appraisalTemplate.create({ data: { organisationId: session.organisationId, name, questions } });
  revalidatePath("/people/settings");
}

export async function toggleAppraisalTemplateActive(templateId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.appraisalManage);
  await assertModuleEnabled(session, "people");
  const active = form.get("active") === "on";
  await db.appraisalTemplate.update({ where: { id: templateId, organisationId: session.organisationId }, data: { active } });
  revalidatePath("/people/settings");
}

export async function createOneToOneTemplate(form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.oneToOneManage);
  await assertModuleEnabled(session, "people");
  const name = String(form.get("name") ?? "").trim();
  const talkingPoints = String(form.get("talkingPoints") ?? "").split("\n").map((q) => q.trim()).filter(Boolean);
  if (!name || name.length > 150) throw new Error("Enter a template name.");
  if (talkingPoints.length === 0) throw new Error("Enter at least one talking point, one per line.");
  await db.oneToOneTemplate.create({ data: { organisationId: session.organisationId, name, talkingPoints } });
  revalidatePath("/people/settings");
}

export async function toggleOneToOneTemplateActive(templateId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.oneToOneManage);
  await assertModuleEnabled(session, "people");
  const active = form.get("active") === "on";
  await db.oneToOneTemplate.update({ where: { id: templateId, organisationId: session.organisationId }, data: { active } });
  revalidatePath("/people/settings");
}
