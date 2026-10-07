import type { ServiceOperationProvider } from "@/core/service-work/connections";
import { assertCapability } from "@/core/permissions/check";
import { nextReference } from "./numbers";
/** Creates an RMA only. Authorisation, receipt, quarantine and disposition stay in Logistics. */
export const requestServiceReturn: ServiceOperationProvider = async (tx, session, input) => {
  assertCapability(session, "service.case.update");
  const { salesOrderId, salesOrderLineId, productId, shipmentId, affectedQuantity } = input.context;
  if (!shipmentId || !salesOrderId || !productId || !affectedQuantity || !Number.isSafeInteger(affectedQuantity) || affectedQuantity < 1) throw new Error("Choose a delivered order line and affected quantity first.");
  const shipment = await tx.shipment.findFirst({ where: { id: shipmentId, organisationId: session.organisationId, partyId: input.partyId, status: "DELIVERED" }, include: { sources: { where: { organisationId: session.organisationId, salesOrderId }, include: { line: true } } } });
  const delivered = shipment?.sources.filter(source => source.line.productId === productId && source.line.salesOrderLineId === salesOrderLineId).reduce((sum, source) => sum + source.quantity, 0) ?? 0;
  const existing = await tx.returnLine.aggregate({ where: { organisationId: session.organisationId, productId, returnAuthorisation: { shipmentId, status: { notIn: ["REJECTED", "CANCELLED"] } } }, _sum: { quantity: true } });
  if (affectedQuantity + (existing._sum.quantity ?? 0) > delivered) throw new Error("Return quantity exceeds delivery after existing returns.");
  const record = await tx.returnAuthorisation.create({ data: { organisationId: session.organisationId, partyId: input.partyId, salesOrderId, shipmentId, reference: await nextReference(tx, session.organisationId, "RT", "RMA"), status: "REQUESTED", reason: "Damaged", requestedResolution: `${input.caseNumber}: ${input.subject}`, lines: { create: [{ organisationId: session.organisationId, productId, description: input.subject, quantity: affectedQuantity, lotCode: input.context.lotCode }] } } });
  return { id: record.id, reference: record.reference, entityType: "ReturnAuthorisation", href: `/logistics/returns/${record.id}` };
};
