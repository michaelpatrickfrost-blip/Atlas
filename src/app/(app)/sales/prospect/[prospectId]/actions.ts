"use server";

import { redirect } from "next/navigation";
import { setProspectLifecycleStage, convertProspect } from "@/modules/sales/services/prospects";
import { logActivity } from "@/modules/sales/services/activities";
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

export async function convertProspectFormAction(prospectId: string, formData: FormData) {
  const opportunity = await convertProspect(prospectId, {
    opportunityName: String(formData.get("opportunityName")),
    valueAmount: Math.round(Number(formData.get("valueAmount") || 0) * 100),
  });
  redirect(`/sales/opportunities/${opportunity.id}`);
}
