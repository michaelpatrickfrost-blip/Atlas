import type { Prisma } from "@/generated/prisma/client";
/** Existing sold history remains readable; every new commercial commitment checks eligibility. */
export async function assertProductsSellable(client: Pick<Prisma.TransactionClient, "product">, organisationId: string, productIds: Array<string | null | undefined>) {
  const ids = [...new Set(productIds.filter((id): id is string => !!id))];
  if (!ids.length) return;
  const products = await client.product.findMany({ where: { organisationId, id: { in: ids }, active: true, sellable: true }, select: { id: true } });
  if (products.length !== ids.length) throw new Error("An item is internal, inactive or unavailable for Sales. Review the product's Sellable setting.");
}
