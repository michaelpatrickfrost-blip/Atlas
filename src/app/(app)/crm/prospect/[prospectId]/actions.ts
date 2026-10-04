"use server";

import { redirect } from "next/navigation";
import { setProspectLifecycleStage, convertProspect, assignProspect } from "@/modules/crm/services/prospects";
import { logActivity } from "@/modules/crm/services/activities";
import type { SalesActivityType } from "@/generated/prisma/client";

export async function qualifyFormAction(prospectId: string) {
  await setProspectLifecycleStage(prospectId, "QUALIFIED");
}

export async function disqualifyFormAction(prospectId: string, formData: FormData) {
  await setProspectLifecycleStage(prospectId, "DISQUALIFIED", { reason: String(formData.get("reason") || "") || undefined });
}

export async function nurtureFormAction(prospectId: string, formData: FormData) {
  const reviewDate = formData.get("nextReviewAt");
  await setProspectLifecycleStage(prospectId, "NURTURE", {
    reason: String(formData.get("reason") || "") || undefined,
    nextReviewAt: reviewDate ? new Date(String(reviewDate)) : undefined,
  });
}

export async function logProspectActivityFormAction(prospectId: string, formData: FormData) {
  await logActivity({
    type: formData.get("type") as SalesActivityType,
    subject: String(formData.get("subject")),
    notes: String(formData.get("notes") || "") || undefined,
    prospectId,
    completedNow: true,
  });
}

export async function assignProspectFormAction(prospectId: string, formData: FormData) {
  await assignProspect(prospectId, String(formData.get("ownerUserId") || ""));
}

export async function assignProspectTaskFormAction(prospectId: string, formData: FormData) {
  const ownerUserId = String(formData.get("ownerUserId") || "");
  const due = String(formData.get("dueAt") || "");
  if (!ownerUserId) throw new Error("Choose who should do this task.");
  const dueAt = due ? new Date(`${due}T12:00:00.000Z`) : undefined;
  if (dueAt && Number.isNaN(dueAt.getTime())) throw new Error("Enter a valid due date.");
  await logActivity({
    type: "TASK",
    subject: String(formData.get("subject") || ""),
    notes: String(formData.get("notes") || "") || undefined,
    prospectId,
    assigneeUserId: ownerUserId,
    dueAt,
    completedNow: false,
  });
}

export async function convertProspectFormAction(prospectId: string, formData: FormData) {
  const opportunity = await convertProspect(prospectId, {
    opportunityName: String(formData.get("opportunityName")),
    valueAmount: Math.round(Number(formData.get("valueAmount") || 0) * 100),
  });
  redirect(`/crm/opportunities/${opportunity.id}`);
}
