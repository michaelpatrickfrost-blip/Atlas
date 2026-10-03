import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";

export type OrderListFilter = "all" | "draft" | "needs_attention" | "open" | "complete";

export async function listOrders(organisationId: string, filter: OrderListFilter = "all") {
  const where: Prisma.SalesOrderWhereInput = { organisationId };

  if (filter === "draft") where.commercialStatus = "DRAFT";
  if (filter === "open") where.commercialStatus = { in: ["CONFIRMED", "ON_HOLD", "PENDING_APPROVAL"] };
  if (filter === "complete") where.commercialStatus = "CLOSED";
  if (filter === "needs_attention") {
    where.OR = [{ commercialStatus: "ON_HOLD" }, { commercialStatus: "PENDING_APPROVAL" }];
  }

  return db.salesOrder.findMany({
    where,
    include: { party: true, holds: { where: { releasedAt: null } }, approvals: { where: { status: "PENDING" } } },
    orderBy: { createdAt: "desc" },
  });
}

export function getOrder(organisationId: string, orderId: string) {
  return db.salesOrder.findFirst({
    where: { organisationId, id: orderId },
    include: {
      party: true,
      pricingParty:true,
      revisions:{orderBy:{revision:"desc"}},
      quote: true,
      priceList: true,
      paymentTerm: true,
      lines: { include: { product: true }, orderBy: { lineNumber: "asc" } },
      holds: { orderBy: { createdAt: "desc" } },
      approvals: { orderBy: { requestedAt: "desc" } },
      changeEvents: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
}

export async function nextOrderReference(organisationId: string): Promise<string> {
  if(!organisationId) throw new Error("Organisation is required.");
  return `SO-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
}
