import { db } from "@/core/db/client";
import type { RecordRelationshipProvider } from "@/core/relationships/types";

/** Customer Master is Core and does not depend on module enablement. */
export const customerRecordRelationships: RecordRelationshipProvider = async (session, context) => {
  if (!session.capabilities.has("customers.read")) return { links: [] };
  const ids = context.anchors.filter(anchor => anchor.moduleId === "core" && anchor.type === "customer").map(anchor => anchor.id);
  if (!ids.length) return { links: [] };
  const parties = await db.party.findMany({ where: { organisationId: session.organisationId, identityScrubbed: false, id: { in: ids } }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 51 });
  return { hasMore: parties.length > 50, links: parties.slice(0, 50).map(party => ({ id: party.id, title: party.name, kind: "Customer", href: `/customers/${party.id}`, direction: "related" as const })) };
};
