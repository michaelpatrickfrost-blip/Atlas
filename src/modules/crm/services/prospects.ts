"use server";
import {assertRecordCreationAllowed} from "@/core/policies/record-creation";
import { assertModuleEnabled } from "@/core/modules/access";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { findPossibleDuplicates } from "@/core/customers/duplicate-detection";
import { nextCustomerCode } from "@/core/customers/code";
import { getDefaultPipeline } from "@/modules/crm/services/pipelines";
import { assertCrmPush } from "@/modules/crm/services/manager-level";
import type { ProspectLifecycleStage } from "@/generated/prisma/client";

// Queries live in prospects-queries.ts — this file is commands only (every
// export must be an async Server Action, since some are called directly from
// client components such as the quick-create form's duplicate check).

export type CreateProspectInput = {
  companyName: string;
  contactFirstName?: string;
  contactSurname?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  website?: string;
  country?: string;
  source?: string;
  sourceDetail?: string;
  campaign?: string;
  ownerUserId?: string;
  estimatedValueAmount?: number;
};

export async function checkProspectDuplicatesAction(input: { companyName: string; email?: string }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectCreate);
  await assertModuleEnabled(session, "crm");
  if (!input.companyName.trim()) return [];
  return findPossibleDuplicates(session.organisationId, { name: input.companyName, email: input.email });
}

export async function createProspect(input: CreateProspectInput) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectCreate);
  await assertModuleEnabled(session, "crm");

  if(!input.companyName.trim() || input.companyName.length>200) throw new Error("Enter a company name.");
  if(input.ownerUserId) await db.membership.findFirstOrThrow({where:{userId:input.ownerUserId,organisationId:session.organisationId}});
  const prospect = await db.prospect.create({
    data: {
      organisationId: session.organisationId,
      companyName: input.companyName,
      contactFirstName: input.contactFirstName,
      contactSurname: input.contactSurname,
      email: input.email,
      phone: input.phone,
      jobTitle: input.jobTitle,
      website: input.website,
      country: input.country,
      source: input.source,
      sourceDetail: input.sourceDetail,
      campaign: input.campaign,
      originalSource: input.source,
      ownerUserId: input.ownerUserId ?? session.userId,
      assignedAt: input.ownerUserId || session.userId ? new Date() : null,
      estimatedValueAmount: input.estimatedValueAmount,
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "prospect.created",
    entityType: "Prospect",
    entityId: prospect.id,
    after: { companyName: prospect.companyName, source: prospect.source },
  });
  await emit(DOMAIN_EVENTS.salesProspectCreated, { prospectId: prospect.id, organisationId: session.organisationId });

  revalidatePath("/crm/prospect");
  return prospect;
}

export async function assignProspect(prospectId: string, ownerUserId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectAssign);
  await assertModuleEnabled(session, "crm");

  const prospect = await db.prospect.findFirst({ where: { id: prospectId, organisationId: session.organisationId }, select: { id: true } });
  if (!prospect) throw new Error("Prospect unavailable.");
  await db.membership.findFirstOrThrow({ where: { organisationId: session.organisationId, userId: ownerUserId, active: true } });
  await db.prospect.update({
    where: { id: prospect.id },
    data: { ownerUserId, assignedAt: new Date() },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "prospect.assigned",
    entityType: "Prospect",
    entityId: prospectId,
    after: { ownerUserId },
  });
  await emit(DOMAIN_EVENTS.salesProspectAssigned, { prospectId, ownerUserId });

  revalidatePath("/crm/prospect");
  revalidatePath(`/crm/prospect/${prospectId}`);
}

export async function setProspectLifecycleStage(prospectId: string, stage: ProspectLifecycleStage, extra?: { reason?: string; nextReviewAt?: Date }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectManage);
  await assertModuleEnabled(session, "crm");
  await assertCrmPush(session);

  const data: Parameters<typeof db.prospect.update>[0]["data"] = { lifecycleStage: stage };
  if (stage === "DISQUALIFIED") {
    data.disqualifiedReason = extra?.reason;
    data.disqualifiedAt = new Date();
  }
  if (stage === "NURTURE") {
    data.nurtureReason = extra?.reason;
    data.nextReviewAt = extra?.nextReviewAt;
  }
  if (stage === "NEW" || stage === "CONTACTED" || stage === "QUALIFIED") {
    data.disqualifiedReason = null;
    data.disqualifiedAt = null;
  }

  await db.prospect.update({ where: { id: prospectId }, data });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: `prospect.${stage.toLowerCase()}`,
    entityType: "Prospect",
    entityId: prospectId,
    after: { stage, reason: extra?.reason },
  });

  if (stage === "QUALIFIED") await emit(DOMAIN_EVENTS.salesProspectQualified, { prospectId });
  if (stage === "DISQUALIFIED") await emit(DOMAIN_EVENTS.salesProspectDisqualified, { prospectId, reason: extra?.reason });
  if (stage === "NURTURE") await emit(DOMAIN_EVENTS.salesProspectNurtured, { prospectId });

  revalidatePath("/crm/prospect");
  revalidatePath(`/crm/prospect/${prospectId}`);
}

/**
 * Convert a prospect into an Opportunity attached to the canonical Customer
 * (Party). Never creates a parallel history — the prospect's source,
 * attribution and prior activities stay on the Prospect row (linked via
 * Opportunity.prospectId) rather than being copied and forked (§25).
 */
export async function convertProspect(prospectId: string, opts: { existingPartyId?: string; opportunityName: string; valueAmount: number }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectManage);
  await assertModuleEnabled(session, "crm");
  assertCapability(session, SALES_CAPABILITIES.opportunityCreate);
  await assertModuleEnabled(session, "crm");
  await assertCrmPush(session);

  const prospect = await db.prospect.findFirstOrThrow({ where: { id: prospectId, organisationId: session.organisationId }, include: { industry: true } });

  if (prospect.lifecycleStage === "CONVERTED") {
    const done = await db.opportunity.findFirst({ where: { organisationId: session.organisationId, prospectId: prospect.id }, orderBy: { createdAt: "desc" } });
    if (done) return done;
  }
  if (prospect.lifecycleStage === "DISQUALIFIED") throw new Error("This prospect was disqualified. Reopen it before converting.");
  const name = opts.opportunityName.trim().slice(0, 200);
  if (!name) throw new Error("Give the opportunity a name.");
  if (!Number.isSafeInteger(opts.valueAmount) || opts.valueAmount < 0 || opts.valueAmount > 2_000_000_000) throw new Error("Enter a value of zero or more.");
  // The pipeline is resolved before any customer record is created, so a failed convert leaves nothing behind.
  const pipeline = await getDefaultPipeline(session.organisationId);

  let partyId = opts.existingPartyId ?? prospect.partyId ?? undefined;
  if (!partyId) {
    await assertRecordCreationAllowed(session.organisationId,"customers");
    const customerCode = await nextCustomerCode(session.organisationId);
    const party = await db.party.create({
      data: {
        organisationId: session.organisationId,
        kind: "COMPANY",
        name: prospect.companyName,
        customerCode,
        status: "PROSPECT",
        countryOfRegistration: prospect.country,
        industry: prospect.industry?.name,
        tags: prospect.tags,
        accountManagerUserId: prospect.ownerUserId,
        relationshipStartDate: new Date(),
        contacts: prospect.contactFirstName
          ? {
              create: [
                {
                  firstName: prospect.contactFirstName,
                  surname: prospect.contactSurname ?? "",
                  jobTitle: prospect.jobTitle,
                  email: prospect.email,
                  phone: prospect.phone,
                  isPrimary: true,
                  roles: ["PRIMARY"],
                },
              ],
            }
          : undefined,
        creditProfile: { create: {} },
      },
    });
    partyId = party.id;
  } else if (prospect.industry || prospect.tags.length) {
    const party = await db.party.findFirst({ where: { id: partyId, organisationId: session.organisationId }, select: { industry: true, tags: true } });
    if (party) {
      await db.party.update({
        where: { id: partyId },
        data: {
          industry: party.industry || prospect.industry?.name,
          tags: [...new Set([...party.tags, ...prospect.tags])],
        },
      });
    }
  }

  const opportunity = await db.opportunity.create({
    data: {
      organisationId: session.organisationId,
      partyId,
      prospectId: prospect.id,
      name,
      pipelineId: pipeline.id,
      stageId: pipeline.stages[0].id,
      probability: pipeline.stages[0].defaultProbability,
      valueAmount: opts.valueAmount,
      ownerUserId: prospect.ownerUserId ?? session.userId,
      territory: prospect.territory,
      source: prospect.originalSource ?? prospect.source,
      campaign: prospect.campaign,
      industryId: prospect.industryId,
      tags: prospect.tags,
    },
  });

  await db.prospect.update({ where: { id: prospect.id }, data: { lifecycleStage: "CONVERTED", convertedAt: new Date(), partyId } });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "prospect.converted",
    entityType: "Prospect",
    entityId: prospect.id,
    after: { opportunityId: opportunity.id, partyId },
  });
  await emit(DOMAIN_EVENTS.salesProspectConverted, { prospectId: prospect.id, opportunityId: opportunity.id, partyId });
  await emit(DOMAIN_EVENTS.salesOpportunityCreated, { opportunityId: opportunity.id, organisationId: session.organisationId });

  revalidatePath("/crm/prospect");
  revalidatePath("/crm/pipeline");
  revalidatePath("/customers");

  return opportunity;
}

function cleanIndustryName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) throw new Error("Industry names need 2 to 60 characters.");
  return name;
}

function cleanTag(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 32);
}

async function industryForCompany(organisationId: string, name: string) {
  const existing = await db.crmIndustry.findFirst({ where: { organisationId, name: { equals: name, mode: "insensitive" } } });
  return existing ?? db.crmIndustry.create({ data: { organisationId, name } });
}

export async function createIndustry(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectManage);
  await assertModuleEnabled(session, "crm");
  await industryForCompany(session.organisationId, cleanIndustryName(String(formData.get("name") ?? "")));
  revalidatePath("/crm/prospect");
  revalidatePath("/crm/reports");
}

export async function saveProspectGrouping(prospectId: string, formData: FormData) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectManage);
  await assertModuleEnabled(session, "crm");
  const prospect = await db.prospect.findFirst({ where: { id: prospectId, organisationId: session.organisationId }, include: { opportunity: { select: { id: true } } } });
  if (!prospect) throw new Error("Prospect not found.");

  const typed = String(formData.get("newIndustry") ?? "");
  const selected = String(formData.get("industryId") ?? "");
  let industryId: string | null = null;
  if (typed.trim()) {
    industryId = (await industryForCompany(session.organisationId, cleanIndustryName(typed))).id;
  } else if (selected) {
    const industry = await db.crmIndustry.findFirst({ where: { id: selected, organisationId: session.organisationId } });
    if (!industry) throw new Error("Choose an industry from this company.");
    industryId = industry.id;
  }

  const remove = String(formData.get("removeTag") ?? "");
  const add = cleanTag(String(formData.get("tag") ?? ""));
  const tags = prospect.tags.filter((tag) => tag !== remove);
  if (add && !tags.some((tag) => tag.toLowerCase() === add.toLowerCase())) {
    if (tags.length >= 12) throw new Error("A prospect can have up to 12 tags.");
    tags.push(add);
  }

  await db.prospect.update({ where: { id: prospect.id }, data: { industryId, tags } });
  if (prospect.opportunity) await db.opportunity.update({ where: { id: prospect.opportunity.id }, data: { industryId, tags } });
  revalidatePath("/crm/prospect");
  revalidatePath(`/crm/prospect/${prospect.id}`);
  revalidatePath("/crm/reports");
}
