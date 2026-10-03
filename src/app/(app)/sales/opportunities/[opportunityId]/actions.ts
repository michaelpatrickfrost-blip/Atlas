"use server";

import {
  updateOpportunityValue,
  updateOpportunityCloseDate,
  setOpportunityNextAction,
  setOpportunityForecastCategory,
  winOpportunity,
  loseOpportunity,
  addStakeholder,
  addMilestone,
  toggleMilestone,
} from "@/modules/sales/services/opportunities";
import { logActivity } from "@/modules/sales/services/activities";
import type { ForecastCategory, OpportunityStakeholderRole, SalesActivityType } from "@/generated/prisma/client";

export async function updateValueFormAction(opportunityId: string, formData: FormData) {
  await updateOpportunityValue(opportunityId, Math.round(Number(formData.get("valueAmount") || 0) * 100), String(formData.get("valueCurrency") || "GBP"));
}

export async function updateCloseDateFormAction(opportunityId: string, formData: FormData) {
  const value = formData.get("expectedCloseDate");
  await updateOpportunityCloseDate(opportunityId, value ? new Date(String(value)) : null);
}

export async function setNextActionFormAction(opportunityId: string, formData: FormData) {
  await setOpportunityNextAction(opportunityId, String(formData.get("nextActionNote")), new Date(String(formData.get("nextActionAt"))));
}

export async function setForecastCategoryFormAction(opportunityId: string, formData: FormData) {
  await setOpportunityForecastCategory(opportunityId, formData.get("forecastCategory") as ForecastCategory);
}

export async function winFormAction(opportunityId: string) {
  await winOpportunity(opportunityId);
}

export async function loseFormAction(opportunityId: string, formData: FormData) {
  const lossReasonId = String(formData.get("lossReasonId") || "") || null;
  await loseOpportunity(opportunityId, lossReasonId, String(formData.get("lossNotes") || "") || undefined, String(formData.get("competitor") || "") || undefined);
}

export async function addStakeholderFormAction(opportunityId: string, formData: FormData) {
  const roles = formData.getAll("roles") as OpportunityStakeholderRole[];
  await addStakeholder(opportunityId, String(formData.get("contactId")), roles.length > 0 ? roles : ["OTHER"]);
}

export async function addMilestoneFormAction(opportunityId: string, formData: FormData) {
  const due = formData.get("dueDate");
  await addMilestone(opportunityId, String(formData.get("label")), due ? new Date(String(due)) : undefined);
}

export async function toggleMilestoneFormAction(milestoneId: string, opportunityId: string, done: boolean) {
  await toggleMilestone(milestoneId, opportunityId, done);
}

export async function logOpportunityActivityFormAction(opportunityId: string, partyId: string, formData: FormData) {
  await logActivity({
    type: formData.get("type") as SalesActivityType,
    subject: String(formData.get("subject")),
    notes: String(formData.get("notes") || "") || undefined,
    opportunityId,
    partyId,
    completedNow: true,
  });
}
