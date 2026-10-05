import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";

/** Quoted and ordered values on a sales project are read from the documents linked to it. */
export async function refreshSalesProjectValues(organisationId: string, salesProjectId: string | null | undefined, tx: Prisma.TransactionClient | typeof db = db) {
  if (!salesProjectId) return;
  const project = await tx.salesProject.findFirst({ where: { id: salesProjectId, organisationId }, select: { potentialValueAmount: true, probability: true } });
  if (!project) return;
  const [quotes, orders] = await Promise.all([
    tx.quote.aggregate({ where: { organisationId, salesProjectId, status: { not: "DECLINED" } }, _sum: { totalAmount: true } }),
    tx.salesOrder.aggregate({ where: { organisationId, salesProjectId, commercialStatus: { not: "CANCELLED" } }, _sum: { grossAmount: true } }),
  ]);
  const quoted = quotes._sum.totalAmount ?? 0, ordered = orders._sum.grossAmount ?? 0, potential = project.potentialValueAmount ?? 0;
  await tx.salesProject.update({
    where: { id: salesProjectId },
    data: { quotedValueAmount: quoted, orderedValueAmount: ordered, remainingValueAmount: Math.max(0, potential - ordered), expectedValueAmount: project.probability == null ? null : Math.round((potential * project.probability) / 100), lastActivityAt: new Date() },
  });
}
