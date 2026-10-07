import type { Prisma, ServiceWorkItem } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";

export async function workNumber(tx: Prisma.TransactionClient, organisationId: string, prefix: string) {
  const sequence = await tx.serviceSequence.upsert({ where: { organisationId_prefix: { organisationId, prefix } }, create: { organisationId, prefix, value: 1 }, update: { value: { increment: 1 } } });
  return `${prefix}-${String(sequence.value).padStart(6, "0")}`;
}
export async function workEvent(tx: Prisma.TransactionClient, session: Session, work: ServiceWorkItem, kind: string, body: string, visibility = "INTERNAL") {
  const entry = await tx.serviceWorkEntry.create({ data: { organisationId: session.organisationId, workId: work.id, kind, body, visibility, actorUserId: session.userId } });
  await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: `service.work.${kind.toLowerCase()}`, entityType: "ServiceWorkItem", entityId: work.id, after: { entryId: entry.id, kind } } });
  await tx.domainOutbox.create({ data: { organisationId: session.organisationId, eventKey: `service-work:${entry.id}`, eventName: `${work.kind.toLowerCase()}.${kind.toLowerCase()}`, payload: { workId: work.id, entryId: entry.id, parentCaseId: work.parentCaseId, parentId: work.parentId } } });
  if (work.parentCaseId) {
    await tx.serviceEntry.create({ data: { organisationId: session.organisationId, caseId: work.parentCaseId, kind: `LINKED_${work.kind}_${kind}`, visibility: "INTERNAL", body: `${work.number}: ${kind.toLowerCase().replaceAll("_", " ")}. Open linked work for the permitted response.`, authorUserId: session.userId } });
    await tx.serviceCase.updateMany({ where: { id: work.parentCaseId, organisationId: session.organisationId }, data: { version: { increment: 1 } } });
  }
  if (work.parentId) { await tx.serviceWorkItem.updateMany({where:{id:work.parentId,organisationId:session.organisationId},data:{version:{increment:1}}}); await tx.serviceWorkEntry.create({ data: { organisationId: session.organisationId, workId: work.parentId, kind: "LINKED_WORK_UPDATED", visibility: "INTERNAL", body: `${work.number}: ${kind.toLowerCase().replaceAll("_", " ")}.`, actorUserId: session.userId } }); }
}
export async function lockWork(tx: Prisma.TransactionClient, session: Session, id: string, version: number, data: Prisma.ServiceWorkItemUncheckedUpdateManyInput) {
  if (!Number.isSafeInteger(version) || version < 1) throw new Error("Refresh the record before saving.");
  const changed = await tx.serviceWorkItem.updateMany({ where: { id, organisationId: session.organisationId, version }, data: { ...data, version: { increment: 1 } } });
  if (changed.count !== 1) throw new Error("This record changed. Refresh before saving.");
}
