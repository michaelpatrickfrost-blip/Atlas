"use server";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { sendEmail } from "@/core/email/send";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function sendCaseEmail(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "service.case.communication");
  const id = String(form.get("caseId") ?? ""), body = z.string().min(1).max(20000).parse(String(form.get("body") ?? ""));
  const c = await db.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id, status: { notIn: ["CLOSED", "CANCELLED"] } }] } });
  if (!c?.contactId) throw new Error("Choose a case contact before sending email.");
  const contact = await db.contact.findFirst({ where: { id: c.contactId, partyId: c.partyId, identityScrubbed: false, party: { organisationId: session.organisationId } } });
  if (!contact?.email) throw new Error("This contact has no email address.");
  const locked = await db.serviceCase.updateMany({ where: { id, organisationId: session.organisationId, version: Number(form.get("version")) }, data: { version: { increment: 1 } } });
  if (!locked.count) throw new Error("Case changed. Refresh before sending.");
  const result = await sendEmail({ organisationId: session.organisationId, actorUserId: session.userId, to: contact.email, contactId: contact.id, partyId: c.partyId, entityType: "ServiceCase", entityId: id, subject: `${c.number}: ${c.subject}`, text: body, scheduledAt: new Date(Date.now() + 60000) });
  await db.serviceEntry.create({ data: { organisationId: session.organisationId, caseId: id, kind: "EMAIL_QUEUED", sourceKey: `outbound:${result.id}`, visibility: "PUBLIC", body: `${body}\n\nDelivery: ${result.status.toLowerCase()}.`, authorUserId: session.userId } });
  await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "service.email.queued", entityType: "ServiceCase", entityId: id, after: { emailMessageId: result.id, contactId: contact.id } } });
  revalidatePath("/service", "layout");
}
export async function invalidateCaseCsat(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "service.case.approve");
  const caseId = String(form.get("caseId") ?? ""), reason = z.string().min(5).max(1000).parse(String(form.get("reason") ?? ""));
  if (!await db.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: caseId }] } })) throw new Error("Case unavailable.");
  await db.$transaction(async tx => {
    const changed = await tx.csatResponse.updateMany({ where: { id: String(form.get("responseId") ?? ""), organisationId: session.organisationId, entityType: "ServiceCase", entityId: caseId, invalidatedAt: null }, data: { invalidReason: reason, invalidatedBy: session.userId, invalidatedAt: new Date() } });
    if (!changed.count) throw new Error("Response unavailable or already marked invalid.");
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "service.csat.invalidated", entityType: "CsatResponse", entityId: String(form.get("responseId")), after: { reason } } });
  }); revalidatePath("/service", "layout");
}
