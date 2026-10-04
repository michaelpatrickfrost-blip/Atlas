import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";

export async function openCustomerProject(tx: Prisma.TransactionClient, session: Session, input: { name: string; partyId: string; opportunityId?: string | null }) {
  const name = input.name.trim().slice(0, 200);
  if (!name) throw new Error("Enter a project name.");
  await tx.party.findFirstOrThrow({ where: { id: input.partyId, organisationId: session.organisationId } });
  if (input.opportunityId) await tx.opportunity.findFirstOrThrow({ where: { id: input.opportunityId, organisationId: session.organisationId, partyId: input.partyId } });
  const project = await tx.project.create({
    data: {
      organisationId: session.organisationId,
      partyId: input.partyId,
      opportunityId: input.opportunityId || null,
      ownerUserId: session.userId,
      name,
      reference: `PRJ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      visibility: "COMPANY",
      projectType: "CUSTOMER",
      status: "PLANNED",
      members: { create: { organisationId: session.organisationId, userId: session.userId, role: "OWNER" } },
    },
  });
  await tx.auditEntry.create({
    data: { organisationId: session.organisationId, actorUserId: session.userId, action: "ProjectCreated", entityType: "Project", entityId: project.id, after: { name, partyId: input.partyId, opportunityId: input.opportunityId ?? null }, workProjectId: project.id },
  });
  return project;
}
