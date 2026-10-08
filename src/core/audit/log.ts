import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";

export async function writeAudit(params: {
  organisationId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}, client: Pick<Prisma.TransactionClient, "auditEntry"> = db) {
  await client.auditEntry.create({
    data: {
      organisationId: params.organisationId,
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before as never,
      after: params.after as never,
    },
  });
}
