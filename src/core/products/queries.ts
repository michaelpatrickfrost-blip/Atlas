import { db } from "@/core/db/client";

/** Fast product search for order-line entry (§14) — matches code, name or
 *  description. Customer-specific codes are matched separately by the
 *  pricing/order-line layer via CustomerProduct, not here. */
export function searchProducts(organisationId: string, query: string, limit = 10) {
  return db.product.findMany({
    where: {
      organisationId,
      active: true,
      sellable: true,
      OR: [
        { code: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
  });
}

export function listProducts(organisationId: string) {
  return db.product.findMany({ where: { organisationId, active: true }, orderBy: { name: "asc" } });
}

export function getProduct(organisationId: string, productId: string) {
  return db.product.findFirst({ where: { organisationId, id: productId } });
}
