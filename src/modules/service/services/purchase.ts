import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
export async function validatePurchase(tx: Prisma.TransactionClient, session: Session, partyId: string, form: FormData) {
  const value = (key: string) => String(form.get(key) ?? "").trim().slice(0, 100);
  const salesOrderId = value("salesOrderId"), salesOrderLineId = value("salesOrderLineId"), productId = value("productId"), shipmentId = value("shipmentId"), lotCode = value("lotCode");
  const affectedQuantity = value("affectedQuantity") ? Number(value("affectedQuantity")) : null;
  if (affectedQuantity !== null && (!Number.isSafeInteger(affectedQuantity) || affectedQuantity < 1)) throw new Error("Enter a positive whole affected quantity.");
  let unitOfMeasure = "each";
  if (salesOrderId) {
    assertCapability(session, "sales.order.read"); await assertModuleEnabled(session, "sales");
    const order = await tx.salesOrder.findFirst({ where: { id: salesOrderId, organisationId: session.organisationId, partyId }, include: { lines: true } });
    if (!order) throw new Error("The order does not belong to this customer.");
    const line = order.lines.find(line => line.id === salesOrderLineId);
    if ((salesOrderLineId || productId || affectedQuantity) && !line) throw new Error("Select the affected order line.");
    if (line && line.productId !== (productId || null)) throw new Error("The product must come from the selected order line.");
    if (line && affectedQuantity && affectedQuantity > line.orderedQuantity - line.cancelledQuantity) throw new Error("Affected quantity exceeds the live order line.");
    unitOfMeasure = line?.unitOfMeasure ?? "each";
  } else {
    if (salesOrderLineId || shipmentId) throw new Error("Select the customer’s order first.");
    if (productId) { assertCapability(session, "core.products.read"); await assertModuleEnabled(session,"products"); if (!await tx.product.findFirst({ where: { id: productId, organisationId: session.organisationId } })) throw new Error("Product unavailable."); }
  }
  if (shipmentId) {
    assertCapability(session, "logistics.shipment.read"); await assertModuleEnabled(session, "logistics");
    const shipment = await tx.shipment.findFirst({ where: { id: shipmentId, organisationId: session.organisationId, partyId }, include: { sources: { where: { organisationId: session.organisationId }, include: { line: true } } } });
    const sources = shipment?.sources.filter(source => source.salesOrderId === salesOrderId && (!salesOrderLineId || source.line.salesOrderLineId === salesOrderLineId)) ?? [];
    if (!sources.length) throw new Error("The delivery does not contain this order line.");
    if (affectedQuantity && affectedQuantity > sources.reduce((sum, source) => sum + source.quantity, 0)) throw new Error("Affected quantity exceeds the quantity on this delivery.");
  }
  return { salesOrderId, salesOrderLineId, productId, shipmentId, affectedQuantity, unitOfMeasure, lotCode, purchaseVerified: !!salesOrderId };
}
