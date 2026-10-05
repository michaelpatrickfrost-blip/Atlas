"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CSAT_CAPABILITIES } from "@/core/permissions/capabilities";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { writeAudit } from "@/core/audit/log";
import { csatTemplate } from "../domain/templates";

const text = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const need = (value: string, label: string) => { if (!value) throw new Error(`Enter ${label}.`); return value; };
/** One reason per line; duplicates and blanks dropped, at most twelve. */
const reasonList = (value: string) => [...new Set(value.split(/\r?\n/).map((line) => line.trim().slice(0, 60)).filter(Boolean))].slice(0, 12);

export async function saveSurvey(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  const id = text(f, "id", 60);
  const data = {
    name: need(text(f, "name", 150), "a name for the survey"), question: need(text(f, "question", 300), "the question"),
    followUpQuestion: text(f, "followUpQuestion", 300) || "Anything we could do better?", lowFollowUpQuestion: text(f, "lowFollowUpQuestion", 300), thanksText: text(f, "thanksText", 300) || "Thank you for your feedback.",
    lowLabel: text(f, "lowLabel", 40) || "Very unhappy", highLabel: text(f, "highLabel", 40) || "Very happy", reasons: reasonList(String(f.get("reasons") ?? "")),
    emailSubject: text(f, "emailSubject", 200), emailIntro: text(f, "emailIntro", 2000),
  };
  if (id) {
    const changed = await db.csatSurvey.updateMany({ where: { id, organisationId: session.organisationId }, data });
    if (!changed.count) throw new Error("This survey no longer exists.");
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "csat.survey.updated", entityType: "CsatSurvey", entityId: id, after: { name: data.name, question: data.question } });
    revalidatePath("/csat", "layout");
    return;
  }
  const survey = await db.csatSurvey.create({ data: { ...data, context: text(f, "context", 30) || "GENERAL", organisationId: session.organisationId, createdBy: session.userId } });
  revalidatePath("/csat", "layout");
  redirect(`/csat/surveys/${survey.id}`);
}

/** Create a survey from a ready-made template, then open it for editing. */
export async function createSurveyFromTemplate(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  const template = csatTemplate(text(f, "template", 30));
  if (!template) throw new Error("That template is not available.");
  const survey = await db.csatSurvey.create({ data: { organisationId: session.organisationId, createdBy: session.userId, name: template.name, context: template.key, question: template.question, followUpQuestion: template.followUpQuestion, lowFollowUpQuestion: template.lowFollowUpQuestion, thanksText: template.thanksText, lowLabel: template.lowLabel, highLabel: template.highLabel, reasons: template.reasons, emailSubject: template.emailSubject, emailIntro: template.emailIntro } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "csat.survey.created", entityType: "CsatSurvey", entityId: survey.id, after: { template: template.key } });
  revalidatePath("/csat", "layout");
  redirect(`/csat/surveys/${survey.id}`);
}

export async function setSurveyActive(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  await db.csatSurvey.updateMany({ where: { id: need(text(f, "id", 60), "the survey"), organisationId: session.organisationId }, data: { active: text(f, "active", 5) === "true" } });
  revalidatePath("/csat", "layout");
}

/** A survey that has been sent keeps its answers, so it is turned off instead of deleted. */
export async function deleteSurvey(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  const id = need(text(f, "id", 60), "the survey");
  if (await db.csatResponse.count({ where: { surveyId: id, organisationId: session.organisationId } })) throw new Error("This survey has been sent. Turn it off instead, so its results are kept.");
  await db.csatSurvey.deleteMany({ where: { id, organisationId: session.organisationId } });
  revalidatePath("/csat", "layout");
  redirect("/csat/surveys");
}

/** Public: a customer taps 1-5 from the email. No session; the token is the authority. */
export async function recordCsatScore(token: string, score: number) {
  const response = await db.csatResponse.findUnique({ where: { token }, include: { survey: true } });
  if (!response || response.respondedAt) return null;
  const value = Math.min(5, Math.max(1, Math.round(Number(score)) || 1));
  await db.csatResponse.update({ where: { token }, data: { score: value, respondedAt: new Date() } });
  await emit(DOMAIN_EVENTS.csatResponded, { organisationId: response.organisationId, responseId: response.id, partyId: response.partyId ?? undefined, score: value });
  return response.survey;
}

/** Public: the comment and ticked reasons after scoring. Only reasons the survey offers are kept. */
export async function recordCsatComment(token: string, comment: string, reasons: string[] = []) {
  const response = await db.csatResponse.findUnique({ where: { token }, select: { survey: { select: { reasons: true } } } });
  if (!response) return;
  await db.csatResponse.updateMany({ where: { token }, data: { comment: String(comment).slice(0, 2000), reasons: (Array.isArray(reasons) ? reasons : []).filter((reason) => response.survey.reasons.includes(reason)) } });
}
