import { db } from "@/core/db/client";

export async function writeActivity(params: {
  organisationId: string;
  type: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  /** Links this activity to a customer for the unified customer Activity tab,
   *  independent of entityType/entityId. See docs/CUSTOMER_MASTER.md §Activity. */
  partyId?: string;
  metadata?: unknown;
}) {
  await db.activity.create({
    data: {
      organisationId: params.organisationId,
      type: params.type,
      summary: params.summary,
      entityType: params.entityType,
      entityId: params.entityId,
      partyId: params.partyId,
      metadata: params.metadata as never,
    },
  });
}

export async function getRecentActivity(organisationId: string, limit = 10) {
  return db.activity.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getCustomerActivity(organisationId: string, partyId: string, limit = 30) {
  return db.activity.findMany({
    where: { organisationId, partyId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
