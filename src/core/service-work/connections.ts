import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { getModule } from "@/core/modules/registry";
import { assertModuleEnabled } from "@/core/modules/access";
import { isModuleEnabled } from "@/core/modules/runtime";
export type ServiceCreditInput = { affectedQuantity?:number; productId?: string; salesOrderLineId?: string; caseId: string; caseNumber: string; partyId: string; invoiceId: string; lineId: string; net: string; quantity: number | null; reason: string; requestKey: string };
export type ServiceCreditProvider = (tx: Prisma.TransactionClient, session: Session, input: ServiceCreditInput) => Promise<{ id: string; reference: string; requestReference: string }>;
export type ServiceOperationInput = { caseId: string; caseNumber: string; partyId: string; subject: string; description: string; context: { salesOrderId?: string; salesOrderLineId?: string; productId?: string; shipmentId?: string; affectedQuantity?: number | null; lotCode?: string }; requestKey: string };
export type ServiceOperationProvider = (tx: Prisma.TransactionClient, session: Session, input: ServiceOperationInput) => Promise<{ id: string; reference: string; entityType: string; href: string }>;
export type ServiceOrderProjection = { cases: { id: string; number: string; subject: string }[]; recoveries: { id: string; number: string; type: string; value: number; currency: string; expiresAt: Date }[] };
export async function serviceOrderProjection(session: Session, partyId: string, orderId: string): Promise<ServiceOrderProjection> {
  if (!await isModuleEnabled(session, "service")) return { cases: [], recoveries: [] };
  return await getModule("service")?.serviceOrderProjectionProvider?.(session, partyId, orderId) ?? { cases: [], recoveries: [] };
}
export async function prepareServiceCredit(tx: Prisma.TransactionClient, session: Session, input: ServiceCreditInput) {
  await assertModuleEnabled(session, "finance");
  const provider = getModule("finance")?.serviceCreditProvider;
  if (!provider) throw new Error("Finance credit requests are unavailable.");
  return provider(tx, session, input);
}
export async function prepareServiceOperation(tx: Prisma.TransactionClient, session: Session, moduleId: string, input: ServiceOperationInput) {
  await assertModuleEnabled(session, moduleId);
  const provider = getModule(moduleId)?.serviceOperationProvider;
  if (!provider) throw new Error("This remedy connection is unavailable.");
  return provider(tx, session, input);
}

export async function triggerCaseSurvey(session:Session,caseId:string){
 if(await isModuleEnabled(session,'csat'))await getModule('csat')?.serviceSurveyConsumer?.(session,caseId);
}
