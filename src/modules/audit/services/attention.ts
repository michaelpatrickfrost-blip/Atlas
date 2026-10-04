import { can } from "@/core/permissions/check";
import { ECHO_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { echoTarget } from "@/core/audit/systems";
import type { AttentionProvider } from "@/core/modules/types";

export const auditAttention: AttentionProvider = async ({ session }) => {
  if (!can(session, ECHO_CAPABILITIES.read)) return [];
  const mentions = await db.echoMention.findMany({
    where: { organisationId: session.organisationId, userId: session.userId, seenAt: null },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { note: { select: { entityType: true, entityId: true } } },
  });
  return mentions.flatMap((mention) => {
    const target = echoTarget(mention.note.entityType);
    if (!target || !session.capabilities.has(target.capability)) return [];
    return [{
      id: `echo-${mention.id}`,
      label: "Someone pointed you at a record",
      href: `${target.href(mention.note.entityId)}?echo=1`,
      severity: "info" as const,
    }];
  });
};
