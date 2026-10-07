import type { ServiceOperationProvider } from "@/core/service-work/connections";
import { assertCapability } from "@/core/permissions/check";
import { workNumber } from "@/core/service-work/engine";
export const requestServiceReplacement: ServiceOperationProvider = async (tx, session, input) => {
  assertCapability(session, "sales.order.create");
  const source = await tx.salesOrder.findFirst({ where: { organisationId: session.organisationId, partyId: input.partyId, id: input.context.salesOrderId }, include: { lines: true } });
  const line = source?.lines.find(line => line.id === input.context.salesOrderLineId && line.productId === input.context.productId);
  const quantity = input.context.affectedQuantity;
  if (!source || !line || !quantity || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > line.orderedQuantity - line.cancelledQuantity) throw new Error("Choose a valid source order line and replacement quantity.");
  const order = await tx.salesOrder.create({ data: { organisationId: session.organisationId, partyId: input.partyId, reference: await workNumber(tx, session.organisationId, "SR"), orderType: "REPLACEMENT", currency: source.currency, ownerUserId: session.userId, externalReference: input.caseNumber, customerNotes: `Replacement requested for ${source.reference}. ${input.subject}`, internalNotes: "Draft service remedy. Sales must review pricing and confirm; no stock movement has occurred.", invoiceAddressSnapshot: source.invoiceAddressSnapshot ?? undefined, deliveryAddressSnapshot: source.deliveryAddressSnapshot ?? undefined, lines: { create: [{ lineNumber: 1, productId: line.productId, descriptionSnapshot: line.descriptionSnapshot, orderedQuantity: quantity, unitOfMeasure: line.unitOfMeasure, unitPriceAmount: line.unitPriceAmount, discountPercent: line.discountPercent, netAmount: Math.round(line.netAmount * quantity / line.orderedQuantity), taxAmount: Math.round(line.taxAmount * quantity / line.orderedQuantity) }] }, netAmount: Math.round(line.netAmount * quantity / line.orderedQuantity), taxAmount: Math.round(line.taxAmount * quantity / line.orderedQuantity), grossAmount: Math.round((line.netAmount + line.taxAmount) * quantity / line.orderedQuantity) } });
  return { id: order.id, reference: order.reference, entityType: "SalesOrder", href: `/sales/orders/${order.id}` };
};
