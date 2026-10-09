import { db } from "@/core/db/client";
import { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import type { SupplyPurchaseProvider } from "@/core/supply/types";

export const supplyPurchaseProvider: SupplyPurchaseProvider = {
  async read(session, id) {
    assertCapability(session, "manufacturing.plan.read");
    await assertModuleEnabled(session, "manufacturing");
    const row = await db.manufacturingSupplySuggestion.findFirst({ where: { id, organisationId: session.organisationId, kind: "BUY", status: "PENDING" }, include: { product: { select: { name: true, code: true, unitOfMeasure: true } } } });
    if (!row) throw new Error("This Buy proposal has already been actioned or is not available.");
    const latest = await db.manufacturingPlanningRun.findFirst({ where: { organisationId: session.organisationId, finishedAt: { not: null } }, orderBy: { startedAt: "desc" }, select: { id: true } });
    if (latest?.id !== row.runId) throw new Error("This Buy proposal is from an older run. Review the latest material plan.");
    return { id: row.id, runId: row.runId, productId: row.productId, productName: row.product.name, productCode: row.product.code, unit: row.product.unitOfMeasure, quantity: row.quantity.toString(), neededBy: row.neededBy?.toISOString().slice(0, 10) ?? null, version: row.updatedAt.toISOString() };
  },
  async claim(session, tx, input) {
    assertCapability(session, "manufacturing.plan.firm");
    await assertModuleEnabled(session, "manufacturing");
    const organisationId = session.organisationId;
    const proposal = await tx.manufacturingSupplySuggestion.findFirst({ where: { id: input.id, organisationId, kind: "BUY", status: "PENDING" } });
    const latest = await tx.manufacturingPlanningRun.findFirst({ where: { organisationId, finishedAt: { not: null } }, orderBy: { startedAt: "desc" }, select: { id: true } });
    if (!proposal || proposal.updatedAt.toISOString() !== input.version || proposal.runId !== latest?.id) throw new Error("The Buy proposal changed or a newer plan exists. Review it before purchasing.");
    if (proposal.productId !== input.productId || !proposal.quantity.eq(new Prisma.Decimal(input.quantity))) throw new Error("Keep the proposed product and quantity when converting. Use a separate reviewed purchase for another requirement.");
    const claimed = await tx.manufacturingSupplySuggestion.updateMany({ where: { id: input.id, organisationId, status: "PENDING", updatedAt: proposal.updatedAt }, data: { status: "FIRMED", resultingPurchaseDocumentId: input.documentId } });
    if (claimed.count !== 1) throw new Error("This Buy proposal has already been converted.");
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "manufacturing.buy.converted", entityType: "ManufacturingSupplySuggestion", entityId: proposal.id, after: { runId: proposal.runId, purchaseDocumentId: input.documentId, productId: input.productId, quantity: input.quantity } } });
  },
};
