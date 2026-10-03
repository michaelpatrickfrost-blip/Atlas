import { db } from "@/core/db/client";

export async function writeActivity(params: {
  organisationId: string;
  type: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  metadata?: unknown;
}) {
  await db.activity.create({
    data: {
      organisationId: params.organisationId,
      type: params.type,
      summary: params.summary,
      entityType: params.entityType,
      entityId: params.entityId,
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
