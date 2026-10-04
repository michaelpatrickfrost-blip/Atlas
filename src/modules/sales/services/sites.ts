import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";

/**
 * Sites (a.k.a. "site projects") are the big commercial engagements —
 * a construction site, a major client project — that accumulate multiple
 * quotes over time. They are stored as Project rows with
 * projectType "SITE" so the work-management Projects module can stay
 * separate.
 */

export function listSites(organisationId: string) {
  return db.project.findMany({
    where: { organisationId, projectType: "SITE" },
    include: {
      party: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
      quotes: {
        where: { status: { not: "DECLINED" } },
        select: { id: true, reference: true, status: true, totalAmount: true, totalCurrency: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { salesOrders: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function getSite(organisationId: string, projectId: string) {
  return db.project.findFirst({
    where: { id: projectId, organisationId, projectType: "SITE" },
    include: {
      party: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true, status: true, valueAmount: true, valueCurrency: true } },
      quotes: {
        select: {
          id: true, reference: true, status: true, kind: true,
          totalAmount: true, totalCurrency: true, netAmount: true, taxAmount: true,
          customerPoReference: true, expiryDate: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      salesOrders: {
        where: { commercialStatus: { not: "CANCELLED" } },
        select: { id: true, reference: true, commercialStatus: true, grossAmount: true, currency: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      members: {
        select: { id: true, userId: true, role: true },
      },
      agreements: {
        where: { status: { not: "CLOSED" } },
        select: { id: true, reference: true, status: true, startsAt: true, endsAt: true, currency: true },
      },
    },
  });
}

export async function createSite(session: Session, input: {
  name: string;
  partyId: string;
  opportunityId?: string;
  notes?: string;
  startAt?: string;
  targetAt?: string;
}) {
  assertCapability(session, "sales.site.manage");
  const reference = "SP-" + Date.now().toString(36).toUpperCase();
  const project = await db.project.create({
    data: {
      organisationId: session.organisationId,
      projectType: "SITE",
      name: input.name,
      reference,
      partyId: input.partyId,
      opportunityId: input.opportunityId || null,
      notes: input.notes || null,
      startAt: input.startAt ? new Date(input.startAt) : null,
      targetAt: input.targetAt ? new Date(input.targetAt) : null,
      status: "PLANNED",
    },
    include: { party: { select: { id: true, name: true } } },
  });
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "sales.site.create",
    entityType: "Project",
    entityId: project.id,
  });
  return project;
}

export async function updateSite(session: Session, projectId: string, input: {
  name?: string;
  partyId?: string;
  notes?: string;
  startAt?: string | null;
  targetAt?: string | null;
  status?: string;
}) {
  assertCapability(session, "sales.site.manage");
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.partyId !== undefined) updates.partyId = input.partyId;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.startAt !== undefined) updates.startAt = input.startAt ? new Date(input.startAt) : null;
  if (input.targetAt !== undefined) updates.targetAt = input.targetAt ? new Date(input.targetAt) : null;
  if (input.status !== undefined) updates.status = input.status;

  const updated = await db.project.update({
    where: { id: projectId },
    data: updates,
    include: { party: { select: { id: true, name: true } } },
  });
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "sales.site.update",
    entityType: "Project",
    entityId: projectId,
  });
  return updated;
}
