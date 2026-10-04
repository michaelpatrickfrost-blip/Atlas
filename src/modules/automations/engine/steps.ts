import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { sessionForUser } from "@/core/auth/session";
import { sendEmail } from "@/core/email/send";
import { merge } from "@/core/email/render";
import { newToken } from "@/core/security/secrets";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { writeAudit } from "@/core/audit/log";
import type { Step } from "./catalogue";
import type { LoadedContext } from "./context";

export type StepResult = { step: string; type: string; status: "OK" | "SKIPPED" | "STOP" | "FAILED"; detail: string };

async function resolveRecipient(organisationId: string, ownerSession: Session, ctx: LoadedContext, to: string | undefined): Promise<{ email: string; name?: string } | null> {
  if (!to) return null;
  if (to.startsWith("custom:")) { const email = to.slice(7); return email ? { email } : null; }
  if (to === "rule_owner") return { email: ownerSession.userEmail, name: ownerSession.userName };
  if (to.startsWith("user:")) {
    const user = await db.user.findFirst({ where: { id: to.slice(5), memberships: { some: { organisationId } } }, select: { email: true, name: true } });
    return user ? { email: user.email, name: user.name } : null;
  }
  if (to === "owner" && ctx.ids.ownerUserId) {
    const user = await db.user.findFirst({ where: { id: ctx.ids.ownerUserId, memberships: { some: { organisationId } } }, select: { email: true, name: true } });
    return user ? { email: user.email, name: user.name } : null;
  }
  // "contact" (default)
  const email = ctx.display.contact && typeof ctx.display.contact === "object" ? (ctx.display.contact as Record<string, unknown>).email : undefined;
  return typeof email === "string" && email ? { email, name: String((ctx.display.contact as Record<string, unknown>).name ?? "") } : null;
}

function addDays(d: Date, n: number) { const copy = new Date(d); copy.setDate(copy.getDate() + n); return copy; }

export async function runStep(organisationId: string, ownerSession: Session, step: Step, ctx: LoadedContext, dryRun: boolean): Promise<StepResult> {
  const base = { step: step.id, type: step.type };
  try {
    switch (step.type) {
      case "stop_unless": {
        const { evaluateConditions } = await import("./conditions");
        const ok = evaluateConditions([{ field: step.params.field, op: step.params.op, value: step.params.value }], ctx);
        return ok ? { ...base, status: "OK", detail: "Condition met, continuing." } : { ...base, status: "STOP", detail: "Condition not met; automation stopped here." };
      }
      case "wait": {
        return { ...base, status: "OK", detail: dryRun ? `Would wait ${step.params.amount} ${step.params.unit}.` : "Wait handled by the scheduler." };
      }
      case "send_email": {
        const recipient = await resolveRecipient(organisationId, ownerSession, ctx, step.params.to);
        if (!recipient) return { ...base, status: "SKIPPED", detail: "No email address could be found for the recipient." };
        if (dryRun) return { ...base, status: "OK", detail: `Would email ${recipient.email}.` };
        const result = await sendEmail({ organisationId, to: recipient.email, toName: recipient.name, templateId: step.params.template || undefined, accountId: step.params.account || undefined, actorUserId: ownerSession.userId, context: ctx.display, partyId: ctx.ids.partyId, contactId: ctx.ids.contactId, messageClass: "TRANSACTIONAL" });
        return result.status === "SENT" ? { ...base, status: "OK", detail: `Emailed ${recipient.email}.` } : { ...base, status: "FAILED", detail: result.error ?? "Could not send." };
      }
      case "send_csat": {
        const recipient = await resolveRecipient(organisationId, ownerSession, ctx, step.params.to);
        if (!recipient) return { ...base, status: "SKIPPED", detail: "No email address for the CSAT recipient." };
        if (dryRun) return { ...base, status: "OK", detail: `Would send a satisfaction survey to ${recipient.email}.` };
        const survey = await db.csatSurvey.findFirst({ where: { id: step.params.survey, organisationId } });
        if (!survey) return { ...base, status: "FAILED", detail: "That survey no longer exists." };
        const token = newToken(18);
        const response = await db.csatResponse.create({ data: { organisationId, surveyId: survey.id, token, partyId: ctx.ids.partyId, contactId: ctx.ids.contactId, email: recipient.email, entityType: ctx.ids.caseId ? "case" : ctx.ids.orderId ? "order" : undefined, entityId: ctx.ids.caseId ?? ctx.ids.orderId } });
        const { publicBaseUrl } = await import("@/core/email/render");
        const csatUrl = `${publicBaseUrl()}/csat/${token}`;
        const result = await sendEmail({ organisationId, to: recipient.email, toName: recipient.name, templateId: step.params.template || undefined, accountId: step.params.account || undefined, actorUserId: ownerSession.userId, context: { ...ctx.display, csat: { url: csatUrl } }, partyId: ctx.ids.partyId, contactId: ctx.ids.contactId,
          ...(step.params.template ? {} : { subject: survey.question, blocks: [{ id: "h", type: "heading", text: survey.question }, { id: "c", type: "csat", question: survey.question }] as never }) });
        return result.status === "SENT" ? { ...base, status: "OK", detail: `Survey sent to ${recipient.email}. Response ${response.id}.` } : { ...base, status: "FAILED", detail: result.error ?? "Could not send." };
      }
      case "send_invite": {
        const recipient = await resolveRecipient(organisationId, ownerSession, ctx, step.params.to);
        if (!recipient) return { ...base, status: "SKIPPED", detail: "No email address for the invite." };
        const inDays = Number(step.params.inDays || 1), atHour = Number(step.params.atHour || 10), minutes = Number(step.params.minutes || 30);
        const start = addDays(new Date(), inDays); start.setHours(atHour, 0, 0, 0);
        const end = new Date(start.getTime() + minutes * 60000);
        const title = merge(step.params.title || "Meeting", ctx.display as never);
        if (dryRun) return { ...base, status: "OK", detail: `Would invite ${recipient.email} to "${title}" on ${start.toDateString()}.` };
        const result = await sendEmail({ organisationId, to: recipient.email, toName: recipient.name, templateId: step.params.template || undefined, accountId: step.params.account || undefined, actorUserId: ownerSession.userId, context: { ...ctx.display, event: { name: title, date: start.toLocaleString("en-GB"), venue: step.params.location ?? "" } },
          ...(step.params.template ? {} : { subject: `Invitation: ${title}`, blocks: [{ id: "h", type: "heading", text: title }, { id: "t", type: "text", text: "A calendar invitation is attached." }] as never }),
          calendar: { title, startsAt: start.toISOString(), endsAt: end.toISOString(), location: step.params.location, attendees: [{ email: recipient.email, name: recipient.name }], organiserEmail: "" } as never,
          partyId: ctx.ids.partyId, contactId: ctx.ids.contactId });
        return result.status === "SENT" ? { ...base, status: "OK", detail: `Invited ${recipient.email} to "${title}".` } : { ...base, status: "FAILED", detail: result.error ?? "Could not send." };
      }
      case "notify_user": {
        const recipient = await resolveRecipient(organisationId, ownerSession, ctx, step.params.to);
        const message = merge(step.params.message || "", ctx.display as never);
        if (dryRun) return { ...base, status: "OK", detail: `Would notify: ${message}` };
        if (!recipient) return { ...base, status: "SKIPPED", detail: "No one to notify." };
        const user = await db.user.findFirst({ where: { email: recipient.email, memberships: { some: { organisationId } } }, select: { id: true } });
        if (!user) return { ...base, status: "SKIPPED", detail: "The recipient is not an Atlas user; nothing to notify in-app." };
        await db.projectInboxItem.create({ data: { organisationId, userId: user.id, label: message.slice(0, 300), kind: "AUTOMATION" } });
        return { ...base, status: "OK", detail: `Notified ${recipient.email}.` };
      }
      case "create_invoice": {
        if (!ctx.ids.orderId) return { ...base, status: "SKIPPED", detail: "No order on this event." };
        if (dryRun) return { ...base, status: "OK", detail: "Would raise a draft invoice for the order." };
        const { createDraftInvoiceForOrder } = await import("@/modules/finance/services/auto-invoice");
        const result = await createDraftInvoiceForOrder(ownerSession, ctx.ids.orderId, "automation");
        return { ...base, status: "OK", detail: result.created ? `Draft invoice ${result.reference} raised.` : `Invoice ${result.reference} already existed.` };
      }
      case "create_task": {
        if (!ctx.ids.partyId && !ctx.ids.prospectId && !ctx.ids.opportunityId) return { ...base, status: "SKIPPED", detail: "No CRM record to attach the task to." };
        const subject = merge(step.params.subject || "Follow up", ctx.display as never);
        if (dryRun) return { ...base, status: "OK", detail: `Would create task "${subject}".` };
        const recipient = await resolveRecipient(organisationId, ownerSession, ctx, step.params.assignee);
        const assignee = recipient ? await db.user.findFirst({ where: { email: recipient.email, memberships: { some: { organisationId } } }, select: { id: true } }) : null;
        await db.salesActivity.create({ data: { organisationId, type: "TASK", subject, ownerUserId: assignee?.id ?? ownerSession.userId, partyId: ctx.ids.partyId, prospectId: ctx.ids.prospectId, opportunityId: ctx.ids.opportunityId, dueAt: step.params.dueInDays ? addDays(new Date(), Number(step.params.dueInDays)) : undefined } });
        return { ...base, status: "OK", detail: `Task "${subject}" created.` };
      }
      case "create_case": {
        if (!ctx.ids.partyId) return { ...base, status: "SKIPPED", detail: "No customer on this event." };
        const subject = merge(step.params.subject || "Follow up", ctx.display as never);
        if (dryRun) return { ...base, status: "OK", detail: `Would open a service case "${subject}".` };
        const seq = await db.serviceSequence.upsert({ where: { organisationId_prefix: { organisationId, prefix: "CASE" } }, create: { organisationId, prefix: "CASE", value: 1 }, update: { value: { increment: 1 } } });
        const number = `CASE-${String(seq.value).padStart(6, "0")}`;
        const created = await db.serviceCase.create({ data: { organisationId, number, partyId: ctx.ids.partyId, contactId: ctx.ids.contactId, subject, type: "QUERY", priority: ["LOW", "NORMAL", "HIGH", "URGENT"].includes(step.params.priority) ? step.params.priority : "NORMAL", ownerUserId: ownerSession.userId, createdByUserId: ownerSession.userId } });
        return { ...base, status: "OK", detail: `Case ${created.number} opened.` };
      }
      case "add_tag": {
        const tag = (step.params.tag || "").trim();
        if (!tag) return { ...base, status: "SKIPPED", detail: "No tag given." };
        if (dryRun) return { ...base, status: "OK", detail: `Would tag with #${tag}.` };
        if (ctx.ids.orderId) await db.salesOrder.update({ where: { id: ctx.ids.orderId }, data: { tags: { push: tag } } });
        else return { ...base, status: "SKIPPED", detail: "Nothing on this event can be tagged yet." };
        return { ...base, status: "OK", detail: `Tagged #${tag}.` };
      }
      case "add_to_audience": {
        if (!ctx.ids.contactId) return { ...base, status: "SKIPPED", detail: "No contact to add." };
        if (dryRun) return { ...base, status: "OK", detail: "Would add the contact to the audience." };
        const audience = await db.marketingAudience.findFirst({ where: { id: step.params.audience, organisationId } });
        if (!audience) return { ...base, status: "FAILED", detail: "That audience no longer exists." };
        const profile = await db.marketingProfile.findFirst({ where: { contactId: ctx.ids.contactId, organisationId } });
        if (!profile) return { ...base, status: "SKIPPED", detail: "This contact has no marketing profile yet." };
        await db.marketingAudienceMember.upsert({ where: { audienceId_profileId: { audienceId: audience.id, profileId: profile.id } }, create: { organisationId, audienceId: audience.id, profileId: profile.id }, update: {} });
        return { ...base, status: "OK", detail: `Added to "${audience.name}".` };
      }
      case "webhook": {
        const url = step.params.url || "";
        if (!/^https?:\/\//i.test(url)) return { ...base, status: "FAILED", detail: "Enter a valid webhook URL." };
        if (dryRun) return { ...base, status: "OK", detail: `Would call ${url}.` };
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ctx.display), signal: AbortSignal.timeout(10000) });
        return res.ok ? { ...base, status: "OK", detail: `Webhook responded ${res.status}.` } : { ...base, status: "FAILED", detail: `Webhook responded ${res.status}.` };
      }
      default:
        return { ...base, status: "SKIPPED", detail: "Unknown step." };
    }
  } catch (error) {
    return { ...base, status: "FAILED", detail: error instanceof Error ? error.message : "Step failed." };
  }
}

/** Not currently used directly (kept for future direct dispatch); run.ts resolves the session itself. */
export async function actorSession(organisationId: string, userId: string) {
  return sessionForUser(organisationId, userId);
}
void emit; void DOMAIN_EVENTS; void writeAudit;
