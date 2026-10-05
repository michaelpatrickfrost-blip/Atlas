'use server';

import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';

export async function createMarketingCampaign(formData: {
  name: string;
  description?: string;
  objective: string;
  status?: string;
}) {
  const session = await requireSession();
  await assertCapability(session, 'marketing.write');

  return db.marketingCampaign.create({
    data: {
      organisationId: session.organisationId,
      name: formData.name,
      status: formData.status || 'DRAFT',
      ownerUserId: session.userId,
    },
  });
}

export async function updateMarketingCampaign(
  campaignId: string,
  formData: {
    name?: string;
    status?: string;
  }
) {
  const session = await requireSession();
  await assertCapability(session, 'marketing.write');

  const updates: Record<string, any> = {};
  if (formData.name) updates.name = formData.name;
  if (formData.status) updates.status = formData.status;

  return db.marketingCampaign.update({
    where: { id: campaignId },
    data: updates,
  });
}

export async function deleteMarketingCampaign(campaignId: string) {
  const session = await requireSession();
  await assertCapability(session, 'marketing.write');

  return db.marketingCampaign.delete({
    where: { id: campaignId },
  });
}

export async function createMarketingAudience(formData: {
  name: string;
  type: string;
}) {
  const session = await requireSession();
  await assertCapability(session, 'marketing.write');

  return db.marketingAudience.create({
    data: {
      organisationId: session.organisationId,
      name: formData.name,
      kind: formData.type,
      ownerUserId: session.userId,
    },
  });
}

export async function updateMarketingAudience(
  audienceId: string,
  formData: {
    name?: string;
  }
) {
  const session = await requireSession();
  await assertCapability(session, 'marketing.write');

  return db.marketingAudience.update({
    where: { id: audienceId },
    data: {
      name: formData.name || undefined,
    },
  });
}

export async function createMarketingContent(formData: {
  name: string;
  type: string;
  body?: string;
  status?: string;
}) {
  const session = await requireSession();
  await assertCapability(session, 'marketing.write');

  return db.marketingContent.create({
    data: {
      organisationId: session.organisationId,
      name: formData.name,
      kind: formData.type,
      body: formData.body || '',
      status: formData.status || 'DRAFT',
      ownerUserId: session.userId,
    },
  });
}

export async function updateMarketingContent(
  contentId: string,
  formData: {
    name?: string;
    type?: string;
    body?: string;
    status?: string;
  }
) {
  const session = await requireSession();
  await assertCapability(session, 'marketing.write');

  const updates: Prisma.MarketingContentUpdateInput = {};
  if (formData.name) updates.name = formData.name;
  if (formData.type) updates.kind = formData.type;
  if (formData.body !== undefined) updates.body = formData.body;
  if (formData.status) updates.status = formData.status;

  return db.marketingContent.update({
    where: { id: contentId },
    data: updates,
  });
}
