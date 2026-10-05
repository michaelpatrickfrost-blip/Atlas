'use server';

import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { Prisma } from '@/generated/prisma/client';

export async function createAutomation(formData: {
  name: string;
  description?: string;
  trigger: string;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  enabled?: boolean;
}) {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.create');

  return db.automation.create({
    data: {
      organisationId: session.organisationId,
      name: formData.name,
      description: formData.description || '',
      trigger: formData.trigger,
      conditions: formData.conditions || {},
      actions: formData.actions || {},
      enabled: formData.enabled ?? true,
      version: 1,
      ownerUserId: session.userId,
    },
  });
}

export async function updateAutomation(
  automationId: string,
  formData: {
    name?: string;
    description?: string;
    trigger?: string;
    conditions?: Record<string, any>;
    actions?: Record<string, any>;
    enabled?: boolean;
  }
) {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.update');

  const updates: Prisma.AutomationUpdateInput = {};
  if (formData.name) updates.name = formData.name;
  if (formData.description !== undefined) updates.description = formData.description;
  if (formData.trigger) updates.trigger = formData.trigger;
  if (formData.conditions !== undefined) updates.conditions = formData.conditions;
  if (formData.actions !== undefined) updates.actions = formData.actions;
  if (formData.enabled !== undefined) updates.enabled = formData.enabled;

  const automation = await db.automation.findUniqueOrThrow({
    where: { id: automationId },
    select: { version: true },
  });

  return db.automation.update({
    where: { id: automationId },
    data: {
      ...updates,
      version: (automation.version || 0) + 1,
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
