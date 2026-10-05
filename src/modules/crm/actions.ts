'use server';

import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { Prisma } from '@/generated/prisma/client';

export async function createCrmProject(formData: {
  name: string;
  description?: string;
  contactId: string;
  stage?: string;
}) {
  const session = await requireSession();
  await assertCapability(session, 'crm.write');

  return db.crmProject.create({
    data: {
      organisationId: session.organisationId,
      name: formData.name,
      description: formData.description || '',
      contactId: formData.contactId,
      stage: formData.stage || 'IDENTIFIED',
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
    contactId?: string;
  }
) {
  const session = await requireSession();
  await assertCapability(session, 'crm.write');

  const updates: Prisma.CrmProjectUpdateInput = {};
  if (formData.name) updates.name = formData.name;
  if (formData.description !== undefined) updates.description = formData.description;
  if (formData.stage) updates.stage = formData.stage;
  if (formData.contactId) updates.contactId = formData.contactId;

  return db.crmProject.update({
    where: { id: projectId },
    data: updates,
  });
}

export async function addProjectOrganisation(
  projectId: string,
  organisationId: string
) {
  const session = await requireSession();
  await assertCapability(session, 'crm.write');

  const project = await db.crmProject.findUniqueOrThrow({
    where: { id: projectId },
    select: { linkedOrganisationIds: true },
  });

  const organisationIds = new Set(project.linkedOrganisationIds as string[]);
  organisationIds.add(organisationId);

  return db.crmProject.update({
    where: { id: projectId },
    data: {
      linkedOrganisationIds: Array.from(organisationIds),
    },
  });
}

export async function removeProjectOrganisation(
  projectId: string,
  organisationId: string
) {
  const session = await requireSession();
  await assertCapability(session, 'crm.write');

  const project = await db.crmProject.findUniqueOrThrow({
    where: { id: projectId },
    select: { linkedOrganisationIds: true },
  });

  const organisationIds = new Set(project.linkedOrganisationIds as string[]);
  organisationIds.delete(organisationId);

  return db.crmProject.update({
    where: { id: projectId },
    data: {
      linkedOrganisationIds: Array.from(organisationIds),
    },
  });
}
