"use server";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { commercialLineNet, settleSale } from "../domain/uk-sale";
import { revalidatePath } from "next/cache";
export async function redeemServiceRecovery(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.order.edit_draft");
  await assertModuleEnabled(session, "sales"); await assertModuleEnabled(session, "service");
  const orderId = String(form.get("orderId") ?? ""), recoveryId = String(form.get("recoveryId") ?? "");
  await db.$transaction(async tx => {
    const order = await tx.salesOrder.findFirstOrThrow({ where: { id: orderId, organisationId: session.organisationId, commercialStatus: "DRAFT" }, include: { lines: true } });
    if (await tx.serviceRedemption.findFirst({ where: { organisationId: session.organisationId, recoveryId, orderId } })) return;
    const now = new Date();
    const benefit = await tx.serviceRecovery.findFirst({ where: { id: recoveryId, organisationId: session.organisationId, partyId: order.partyId, status: { in: ["APPROVED", "PARTIALLY_REDEEMED"] }, validFrom: { lte: now }, expiresAt: { gt: now }, currency: order.currency } });
    if (!benefit || benefit.usedCount >= benefit.usageLimit) throw new Error("This benefit is unavailable or already used.");
    if (order.headerDiscountPercent) throw new Error("Review the existing overall order discount before applying service recovery.");
    if (order.netAmount < benefit.minimumOrder) throw new Error("This order does not meet the benefit’s minimum value.");
    const eligible = order.lines.filter(line => line.productId && !benefit.excludedProductIds.includes(line.productId) && (!benefit.eligibleProductIds.length || benefit.eligibleProductIds.includes(line.productId)) && line.orderedQuantity > line.cancelledQuantity && line.unitPriceAmount > 0);
    const total = eligible.reduce((sum, line) => sum + commercialLineNet(line.unitPriceAmount, line.orderedQuantity - line.cancelledQuantity, line.discountPercent ?? 0), 0);
    const discount = Math.min(total, benefit.maximum ?? total, benefit.type === "PERCENT" ? Math.round(total * benefit.value / 10000) : benefit.value);
    if (discount <= 0) throw new Error("No eligible product value is available on this order.");
    let left = discount;
    for (const [index, line] of eligible.entries()) {
      const base = line.unitPriceAmount * (line.orderedQuantity - line.cancelledQuantity), net = commercialLineNet(line.unitPriceAmount, line.orderedQuantity - line.cancelledQuantity, line.discountPercent ?? 0);
      const share = index === eligible.length - 1 ? left : Math.min(left, Math.floor(discount * net / total)); left -= share;
      await tx.salesOrderLine.update({ where: { id: line.id }, data: { discountPercent: 100 * (1 - (net - share) / base) } });
    }
    const updated = await tx.salesOrderLine.findMany({ where: { orderId } });
    const active = updated.filter(line => !["SECTION", "NOTE"].includes(line.type));
    const totals = settleSale(active.map(line => ({ net: commercialLineNet(line.unitPriceAmount, line.orderedQuantity - line.cancelledQuantity, line.discountPercent ?? 0), taxCategory: line.taxCategory })), 0, (order.deliveryAddressSnapshot as { country?: string } | null)?.country);
    for (const [index, line] of active.entries()) await tx.salesOrderLine.update({ where: { id: line.id }, data: { netAmount: totals.lines[index].net, taxAmount: totals.lines[index].tax } });
    await tx.salesOrder.update({ where: { id: orderId }, data: { netAmount: totals.net, taxAmount: totals.tax, grossAmount: totals.gross, discountAmount: order.discountAmount + discount } });
    const changed = await tx.serviceRecovery.updateMany({ where: { id: recoveryId, organisationId: session.organisationId, version: benefit.version }, data: { usedCount: { increment: 1 }, status: benefit.usedCount + 1 >= benefit.usageLimit ? "REDEEMED" : "PARTIALLY_REDEEMED", version: { increment: 1 } } });
    if (!changed.count) throw new Error("Benefit changed. Refresh before applying.");
    await tx.serviceRedemption.create({ data: { organisationId: session.organisationId, recoveryId, orderId, amount: discount, actorUserId: session.userId } });
    await tx.serviceEntry.create({ data: { organisationId: session.organisationId, caseId: benefit.caseId, kind: "RECOVERY_REDEEMED", visibility: "INTERNAL", body: `${benefit.number} used on ${order.reference}: ${order.currency} ${(discount / 100).toFixed(2)}.`, authorUserId: session.userId } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "service.recovery.redeemed", entityType: "SalesOrder", entityId: orderId, before: { netAmount: order.netAmount, lines: order.lines.map(line => ({ id: line.id, discountPercent: line.discountPercent })) }, after: { recoveryId, discount, netAmount: totals.net } } });
  }, { isolationLevel: "Serializable" }); revalidatePath(`/sales/orders/${orderId}`); revalidatePath("/service", "layout");
}
