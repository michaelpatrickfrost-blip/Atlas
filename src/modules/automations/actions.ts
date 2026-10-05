'use server';

import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';

export async function createAutomation(formData: {
  name: string;
  description?: string;
  enabled?: boolean;
}) {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.create');

  return db.automation.create({
    data: {
      organisationId: session.organisationId,
      name: formData.name,
      description: formData.description || '',
      enabled: formData.enabled ?? true,
      ownerUserId: session.userId,
    },
  });
}

export async function updateAutomation(
  automationId: string,
  formData: {
    name?: string;
    description?: string;
    enabled?: boolean;
  }
) {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.update');

  return db.automation.update({
    where: { id: automationId },
    data: {
      name: formData.name || undefined,
      description: formData.description !== undefined ? formData.description : undefined,
      enabled: formData.enabled !== undefined ? formData.enabled : undefined,
    },
  });
}

export async function deleteAutomation(automationId: string) {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.delete');

  return db.automation.delete({
    where: { id: automationId },
  });
}

export async function toggleAutomation(
  automationId: string,
  enabled: boolean
) {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.update');

  return db.automation.update({
    where: { id: automationId },
    data: { enabled },
  });
}
