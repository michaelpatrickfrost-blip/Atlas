"use server";
import { assertModuleEnabled } from "@/core/modules/access";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeActivity } from "@/core/activity/log";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import type { SalesActivityType } from "@/generated/prisma/client";

export type LogActivityInput = {
  type: SalesActivityType;
  subject: string;
  notes?: string;
  partyId?: string;
  prospectId?: string;
  opportunityId?: string;
  dueAt?: Date;
  completedNow?: boolean;
};

export async function logActivity(input: LogActivityInput) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.activityManage);
  await assertModuleEnabled(session, "crm");

  if(!input.subject.trim() || input.subject.length>300) throw new Error("Enter an activity subject.");
  if(input.partyId) await db.party.findFirstOrThrow({where:{id:input.partyId,organisationId:session.organisationId}});
  if(input.prospectId) await db.prospect.findFirstOrThrow({where:{id:input.prospectId,organisationId:session.organisationId}});
  if(input.opportunityId) await db.opportunity.findFirstOrThrow({where:{id:input.opportunityId,organisationId:session.organisationId}});
  const activity = await db.salesActivity.create({
    data: {
      organisationId: session.organisationId,
      type: input.type,
      subject: input.subject,
      notes: input.notes,
      ownerUserId: session.userId,
      partyId: input.partyId,
      prospectId: input.prospectId,
      opportunityId: input.opportunityId,
      dueAt: input.dueAt,
      completedAt: input.completedNow ? new Date() : undefined,
    },
  });

  if (input.prospectId) {
    const prospect = await db.prospect.findUnique({ where: { id: input.prospectId }, select: { firstContactedAt: true } });
    await db.prospect.update({
      where: { id: input.prospectId },
      data: { lastContactedAt: new Date(), firstContactedAt: prospect?.firstContactedAt ?? new Date() },
    });
  }

  revalidatePath("/crm/today");
  if (input.prospectId) revalidatePath(`/crm/prospect/${input.prospectId}`);
  if (input.opportunityId) revalidatePath(`/crm/opportunities/${input.opportunityId}`);

  return activity;
}

export async function completeActivity(activityId: string, outcome?: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.activityManage);
  await assertModuleEnabled(session, "crm");

  const activity = await db.salesActivity.update({
    where: { id: activityId, organisationId: session.organisationId },
    data: { completedAt: new Date(), outcome },
  });

  if (activity.partyId) {
    await writeActivity({
      organisationId: session.organisationId,
      type: DOMAIN_EVENTS.salesActivityCompleted,
      summary: `${activity.subject} completed`,
      entityType: "SalesActivity",
      entityId: activity.id,
      partyId: activity.partyId,
    });
  }
  await emit(DOMAIN_EVENTS.salesActivityCompleted, { activityId, organisationId: session.organisationId });

  revalidatePath("/crm/today");
  return activity;
}
