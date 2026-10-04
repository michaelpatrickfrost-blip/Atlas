"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CSAT_CAPABILITIES } from "@/core/permissions/capabilities";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";

const text = (f: FormData, k: string, max = 2000, required = false) => { const v = String(f.get(k) ?? "").trim(); if (v.length > max || (required && !v)) throw new Error(`Please enter ${k}.`); return v; };

export async function saveSurvey(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  const id = text(f, "id", 60);
  const data = { name: text(f, "name", 150, true), question: text(f, "question", 300, true), followUpQuestion: text(f, "followUpQuestion", 300) || "Anything we could do better?", thanksText: text(f, "thanksText", 300) || "Thank you for your feedback.", context: text(f, "context", 30) || "GENERAL" };
  if (id) await db.csatSurvey.updateMany({ where: { id, organisationId: session.organisationId }, data });
  else await db.csatSurvey.create({ data: { ...data, organisationId: session.organisationId, createdBy: session.userId } });
  revalidatePath("/csat", "layout");
}

export async function setSurveyActive(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  await db.csatSurvey.updateMany({ where: { id: text(f, "id", 60, true), organisationId: session.organisationId }, data: { active: text(f, "active", 5) === "true" } });
  revalidatePath("/csat", "layout");
}

/** Public: a customer taps 1-5 from the email. No session; the token is the authority. */
export async function recordCsatScore(token: string, score: number) {
  const response = await db.csatResponse.findUnique({ where: { token }, include: { survey: true } });
  if (!response || response.respondedAt) return null;
  await db.csatResponse.update({ where: { token }, data: { score: Math.min(5, Math.max(1, score)), respondedAt: new Date() } });
  await emit(DOMAIN_EVENTS.csatResponded, { organisationId: response.organisationId, responseId: response.id, partyId: response.partyId ?? undefined, score });
  return response.survey;
}

export async function recordCsatComment(token: string, comment: string) {
  await db.csatResponse.updateMany({ where: { token }, data: { comment: comment.slice(0, 2000) } });
}
