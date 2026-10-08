import { db } from "@/core/db/client";
import type { RecordRelationshipProvider } from "@/core/relationships/types";

export const productRecordRelationships: RecordRelationshipProvider = async (session, context) => {
  if (!session.capabilities.has("core.products.read")) return { links: [] };
  const ids = context.anchors.filter(anchor => anchor.moduleId === "products" && anchor.type === "product").map(anchor => anchor.id);
  if (!ids.length) return { links: [] };
  const products = await db.product.findMany({ where: { organisationId: session.organisationId, id: { in: ids } }, select: { id: true, code: true, name: true }, orderBy: { code: "asc" }, take: 51 });
  return { hasMore: products.length > 50, links: products.slice(0, 50).map(product => ({ id: product.id, title: `${product.code} · ${product.name}`, kind: "Product", href: `/products/${product.id}`, direction: "related" as const })) };
};
