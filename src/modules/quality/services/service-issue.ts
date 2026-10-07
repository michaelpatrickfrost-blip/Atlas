import type { ServiceOperationProvider } from "@/core/service-work/connections";
import { assertCapability } from "@/core/permissions/check";
import { workNumber } from "@/core/service-work/engine";
export const requestServiceQuality: ServiceOperationProvider = async (tx, session, input) => {
  assertCapability(session, "service.case.update");
  const record = await tx.nonConformance.create({ data: { organisationId: session.organisationId, number: await workNumber(tx, session.organisationId, "NC"), title: `${input.caseNumber}: ${input.subject}`.slice(0, 250), source: "CUSTOMER", productId: input.context.productId || null, partyId: input.partyId, quantityAffected: input.context.affectedQuantity, defect: input.description || input.subject, reportedByUserId: session.userId } });
  return { id: record.id, reference: record.number, entityType: "NonConformance", href: `/quality/ncr/${record.id}` };
};
