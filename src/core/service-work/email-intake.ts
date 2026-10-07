import { db } from "@/core/db/client";
/** Existing IMAP thread matching supplies the source. Unknown senders cannot attach to a case. */
export async function appendServiceReply(input: { organisationId: string; caseId: string; sourceKey: string; partyId: string | null; contactId: string | null; text: string }) {
  if (!input.partyId || !input.contactId) return;
  const partyId=input.partyId;
  await db.$transaction(async tx => {
    const c = await tx.serviceCase.findFirst({ where: { id: input.caseId, organisationId: input.organisationId, partyId, organisation: { moduleStates: { some: { moduleId: "service", enabled: true, entitled: true } } } } });
    if (!c) return;
    const entry = await tx.serviceEntry.createMany({ skipDuplicates: true, data: [{ organisationId: input.organisationId, caseId: c.id, sourceKey: input.sourceKey, kind: "CUSTOMER_EMAIL_RECEIVED", visibility: "PUBLIC", body: input.text.slice(0, 20000), authorUserId: c.ownerUserId }] });
    if (!entry.count) return;
    if (!["CLOSED", "CANCELLED"].includes(c.status)) await tx.serviceCase.update({ where: { id: c.id }, data: { status: "OPEN", ...(c.status === "RESOLVED" ? { reopenCount: { increment: 1 }, resolvedAt: null } : {}), version: { increment: 1 } } });
    await tx.domainOutbox.create({ data: { organisationId: input.organisationId, eventKey: input.sourceKey, eventName: "customer.case.replied", payload: { caseId: c.id } } });
  });
}
