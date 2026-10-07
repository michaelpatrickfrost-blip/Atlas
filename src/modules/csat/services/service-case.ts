import { randomBytes } from "node:crypto";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { sendEmail } from "@/core/email/send";
import { publicBaseUrl } from "@/core/email/render";
import { serviceCaseScope } from "@/core/permissions/service-access";
/** Resolution survey uses the existing CSAT and email systems. A source key prevents repeat invitations. */
export async function surveyResolvedServiceCase(session: Session, caseId: string) {
  const c = await db.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: caseId, status: { in: ["RESOLVED", "CLOSED"] } }] } });
  if (!c) return;
  const survey = await db.csatSurvey.findFirst({ where: { organisationId: session.organisationId, active: true, context: { in: ["SUPPORT", "CUSTOMER_SERVICE"] } }, orderBy: { createdAt: "asc" } });
  if (!survey) return;
  const contact = c.contactId ? await db.contact.findFirst({ where: { id: c.contactId, partyId: c.partyId, identityScrubbed: false, party: { organisationId: session.organisationId } }, select: { id: true, email: true } }) : null;
  if (!contact?.email) return;
  const suppressed = await db.marketingSuppression.count({ where: { organisationId: session.organisationId, channel: { in: ["ALL", "EMAIL"] }, profile: { contactId: contact.id } } });
  if (suppressed) return;
  if (await db.csatResponse.count({ where: { organisationId: session.organisationId, contactId: contact.id, sentAt: { gte: new Date(Date.now() - 7 * 86400000) } } })) return;
  let response;
  try { response = await db.csatResponse.create({ data: { organisationId: session.organisationId, surveyId: survey.id, token: randomBytes(32).toString("hex"), partyId: c.partyId, contactId: contact.id, email: contact.email, entityType: "ServiceCase", entityId: c.id, sourceKey: `service-case:${c.id}`, deliveryStatus: "PREPARING", serviceContext: { agentUserId: c.ownerUserId, queueId: c.queueId, caseType: c.type, productId: (c.context as { productId?: string }).productId ?? null } } }); }
  catch (error) { if ((error as { code?: string }).code === "P2002") return; throw error; }
  try {
    const result = await sendEmail({ organisationId: session.organisationId, actorUserId: session.userId, to: contact.email, partyId: c.partyId, contactId: contact.id, entityType: "ServiceCase", entityId: c.id, subject: `How did we do? ${c.number}`, text: `${survey.question}\n\nShare your feedback: ${publicBaseUrl()}/csat/${response.token}`, scheduledAt: new Date(Date.now() + 30 * 60000) });
    await db.csatResponse.update({ where: { id: response.id }, data: { deliveryStatus: result.status, emailMessageId: result.id } });
    await db.serviceEntry.create({ data: { organisationId: session.organisationId, caseId: c.id, kind: "CSAT_QUEUED", visibility: "INTERNAL", body: "Support survey queued for 30 minutes after resolution. Original customer responses cannot be edited by agents.", authorUserId: session.userId } });
  } catch {
    await db.csatResponse.update({ where: { id: response.id }, data: { deliveryStatus: "FAILED" } });
    await db.serviceEntry.create({ data: { organisationId: session.organisationId, caseId: c.id, kind: "CSAT_DELIVERY_FAILED", visibility: "INTERNAL", body: "Survey could not be queued. Check the company email configuration.", authorUserId: session.userId } });
  }
}
