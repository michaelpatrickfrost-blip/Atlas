"use server";
import { assertModuleEnabled } from "@/core/modules/access";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { formatMoney } from "@/core/shared/money";
import { getDefaultPipeline } from "@/modules/crm/services/pipelines";
import type { ForecastCategory, OpportunityStakeholderRole } from "@/generated/prisma/client";

// Queries live in opportunities-queries.ts — this file is commands only
// (every export must be an async Server Action, since some are called
// directly from client components such as the pipeline stage selector).

async function assertOwnedByOrg(organisationId: string, opportunityId: string) {
  const opportunity = await db.opportunity.findFirst({ where: { id: opportunityId, organisationId }, select: { id: true } });
  if (!opportunity) throw new Error("NOT_FOUND: opportunity does not belong to this organisation");
}

async function recordChange(opportunityId: string, type: "STAGE" | "VALUE" | "CLOSE_DATE" | "OWNER" | "FORECAST_CATEGORY", fromValue: string | null, toValue: string | null, userId: string) {
  await db.opportunityChangeEvent.create({
    data: { opportunityId, type, fromValue, toValue, changedByUserId: userId },
  });
}

// ---------- Commands ----------

export type CreateOpportunityInput = {
  partyId: string;
  name: string;
  valueAmount: number;
  valueCurrency?: string;
  pipelineId?: string;
  ownerUserId?: string;
  expectedCloseDate?: Date;
  primaryContactId?: string;
};

export async function createOpportunity(input: CreateOpportunityInput) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityCreate);
  await assertModuleEnabled(session, "crm");

  if(!input.name.trim() || input.name.length>200 || !Number.isSafeInteger(input.valueAmount) || input.valueAmount<0 || input.valueAmount>2147483647) throw new Error("Enter a name and valid opportunity value.");
  await db.party.findFirstOrThrow({where:{id:input.partyId,organisationId:session.organisationId}});
  if(input.ownerUserId) await db.membership.findFirstOrThrow({where:{userId:input.ownerUserId,organisationId:session.organisationId}});
  if(input.primaryContactId) await db.contact.findFirstOrThrow({where:{id:input.primaryContactId,partyId:input.partyId}});
  const pipeline = input.pipelineId
    ? await db.pipeline.findFirstOrThrow({ where: { id: input.pipelineId, organisationId: session.organisationId }, include: { stages: { orderBy: { order: "asc" } } } })
    : await getDefaultPipeline(session.organisationId);

  if (!pipeline || pipeline.stages.length === 0) {
    throw new Error("NO_PIPELINE: organisation has no sales pipeline configured");
  }

  const opportunity = await db.opportunity.create({
    data: {
      organisationId: session.organisationId,
      partyId: input.partyId,
      name: input.name,
      pipelineId: pipeline.id,
      stageId: pipeline.stages[0].id,
      probability: pipeline.stages[0].defaultProbability,
      valueAmount: input.valueAmount,
      valueCurrency: input.valueCurrency ?? "GBP",
      ownerUserId: input.ownerUserId ?? session.userId,
      expectedCloseDate: input.expectedCloseDate,
      primaryContactId: input.primaryContactId,
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "opportunity.created",
    entityType: "Opportunity",
    entityId: opportunity.id,
    after: { name: opportunity.name, valueAmount: opportunity.valueAmount },
  });
  await emit(DOMAIN_EVENTS.salesOpportunityCreated, { opportunityId: opportunity.id, organisationId: session.organisationId });

  revalidatePath("/crm/pipeline");
  return opportunity;
}

export async function moveOpportunityStage(opportunityId: string, stageId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  const before = await db.opportunity.findUniqueOrThrow({ where: { id: opportunityId }, include: { stage: true } });
  const newStage = await db.pipelineStage.findFirstOrThrow({ where: { id: stageId, pipelineId: before.pipelineId, pipeline: { organisationId: session.organisationId } } });
  if (before.status !== "OPEN") throw new Error("Only open opportunities can change stage.");

  const after = await db.opportunity.update({
    where: { id: opportunityId },
    data: { stageId, probability: newStage.defaultProbability, stageEnteredAt: new Date() },
    include: { stage: true },
  });

  await recordChange(opportunityId, "STAGE", before.stage.name, after.stage.name, session.userId);
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "opportunity.stage_changed",
    entityType: "Opportunity",
    entityId: opportunityId,
    before: { stage: before.stage.name },
    after: { stage: after.stage.name },
  });
  await emit(DOMAIN_EVENTS.salesOpportunityStageChanged, { opportunityId, fromStage: before.stage.name, toStage: after.stage.name });

  revalidatePath("/crm/pipeline");
  revalidatePath(`/crm/opportunities/${opportunityId}`);
}

export async function updateOpportunityValue(opportunityId: string, valueAmount: number, valueCurrency = "GBP") {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  if(!Number.isSafeInteger(valueAmount) || valueAmount<0 || valueAmount>2147483647 || !/^[A-Z]{3}$/.test(valueCurrency)) throw new Error("Enter a valid value and currency.");
  const before = await db.opportunity.findUniqueOrThrow({ where: { id: opportunityId } });
  await db.opportunity.update({ where: { id: opportunityId,organisationId:session.organisationId }, data: { valueAmount, valueCurrency } });

  await recordChange(opportunityId, "VALUE", formatMoney(before.valueAmount, before.valueCurrency), formatMoney(valueAmount, valueCurrency), session.userId);
  await emit(DOMAIN_EVENTS.salesOpportunityValueChanged, { opportunityId, valueAmount });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
}

export async function updateOpportunityCloseDate(opportunityId: string, expectedCloseDate: Date | null) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  const before = await db.opportunity.findUniqueOrThrow({ where: { id: opportunityId } });
  await db.opportunity.update({ where: { id: opportunityId }, data: { expectedCloseDate } });

  await recordChange(
    opportunityId,
    "CLOSE_DATE",
    before.expectedCloseDate?.toLocaleDateString("en-GB") ?? null,
    expectedCloseDate?.toLocaleDateString("en-GB") ?? null,
    session.userId,
  );
  await emit(DOMAIN_EVENTS.salesOpportunityCloseDateChanged, { opportunityId, expectedCloseDate });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
}

export async function setOpportunityForecastCategory(opportunityId: string, forecastCategory: ForecastCategory) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  const before = await db.opportunity.findUniqueOrThrow({ where: { id: opportunityId } });
  await db.opportunity.update({ where: { id: opportunityId }, data: { forecastCategory } });
  await recordChange(opportunityId, "FORECAST_CATEGORY", before.forecastCategory, forecastCategory, session.userId);

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/forecast");
}

export async function setOpportunityNextAction(opportunityId: string, nextActionNote: string, nextActionAt: Date) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  await db.opportunity.update({ where: { id: opportunityId }, data: { nextActionNote, nextActionAt } });
  revalidatePath(`/crm/opportunities/${opportunityId}`);
}

export async function winOpportunity(opportunityId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityClose);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  const opportunity = await db.opportunity.update({
    where: { id: opportunityId },
    data: { status: "WON", actualCloseDate: new Date(), forecastCategory: "CLOSED" },
  });

  await writeActivity({
    organisationId: session.organisationId,
    type: DOMAIN_EVENTS.salesOpportunityWon,
    summary: `${session.userName} won ${opportunity.name} — ${formatMoney(opportunity.valueAmount, opportunity.valueCurrency)}`,
    entityType: "Opportunity",
    entityId: opportunityId,
    partyId: opportunity.partyId,
    metadata: { valueAmount: opportunity.valueAmount, valueCurrency: opportunity.valueCurrency },
  });
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "opportunity.won",
    entityType: "Opportunity",
    entityId: opportunityId,
  });
  await emit(DOMAIN_EVENTS.salesOpportunityWon, { opportunityId, organisationId: session.organisationId });

  revalidatePath("/crm/pipeline");
  revalidatePath(`/crm/opportunities/${opportunityId}`);
}

export async function loseOpportunity(opportunityId: string, lossReasonId: string | null, lossNotes?: string, competitor?: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityClose);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  const opportunity = await db.opportunity.update({
    where: { id: opportunityId },
    data: { status: "LOST", actualCloseDate: new Date(), forecastCategory: "OMITTED", lossReasonId, lossNotes, competitor },
  });

  await writeActivity({
    organisationId: session.organisationId,
    type: DOMAIN_EVENTS.salesOpportunityLost,
    summary: `${opportunity.name} marked lost`,
    entityType: "Opportunity",
    entityId: opportunityId,
    partyId: opportunity.partyId,
  });
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "opportunity.lost",
    entityType: "Opportunity",
    entityId: opportunityId,
    after: { lossReasonId, competitor },
  });
  await emit(DOMAIN_EVENTS.salesOpportunityLost, { opportunityId, organisationId: session.organisationId, lossReasonId });

  revalidatePath("/crm/pipeline");
  revalidatePath(`/crm/opportunities/${opportunityId}`);
}

export async function addStakeholder(opportunityId: string, contactId: string, roles: OpportunityStakeholderRole[]) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  await db.opportunityStakeholder.upsert({
    where: { opportunityId_contactId: { opportunityId, contactId } },
    create: { opportunityId, contactId, roles },
    update: { roles },
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
}

export async function addMilestone(opportunityId: string, label: string, dueDate?: Date) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  const count = await db.opportunityMilestone.count({ where: { opportunityId } });
  await db.opportunityMilestone.create({ data: { opportunityId, label, dueDate, order: count } });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
}

export async function toggleMilestone(milestoneId: string, opportunityId: string, done: boolean) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  await assertModuleEnabled(session, "crm");
  await assertOwnedByOrg(session.organisationId, opportunityId);

  await db.opportunityMilestone.update({ where: { id: milestoneId }, data: { status: done ? "DONE" : "PENDING" } });
  revalidatePath(`/crm/opportunities/${opportunityId}`);
}
