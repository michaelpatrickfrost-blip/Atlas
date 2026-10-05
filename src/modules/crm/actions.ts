'use server';

import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';

export async function createCrmProject(formData: {
  name: string;
  description?: string;
  stage?: string;
}) {
  const session = await requireSession();
  await assertCapability(session, 'crm.write');

  return db.project.create({
    data: {
      organisationId: session.organisationId,
      name: formData.name,
      description: formData.description || '',
      status: formData.stage || 'IDENTIFIED',
      ownerUserId: session.userId,
    },
  });
}

export async function updateCrmProject(
  projectId: string,
  formData: {
    name?: string;
    description?: string;
    stage?: string;
  }
) {
  const session = await requireSession();
  await assertCapability(session, 'crm.write');

  const updates: Record<string, any> = {};
  if (formData.name) updates.name = formData.name;
  if (formData.description !== undefined) updates.description = formData.description;
  if (formData.stage) updates.status = formData.stage;

  return db.project.update({
    where: { id: projectId },
    data: updates,
  });
}
