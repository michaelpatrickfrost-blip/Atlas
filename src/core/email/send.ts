import nodemailer from "nodemailer";
import { db } from "@/core/db/client";
import { decryptSecret } from "@/core/security/secrets";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { writeAudit } from "@/core/audit/log";
import { buildIcs, type CalendarInvite } from "./ics";
import { loadBrand, publicBaseUrl, renderEmail, merge, type MergeContext } from "./render";
import { sanitiseBlocks, type EmailBlock } from "./blocks";
import type { EmailAccount } from "@/generated/prisma/client";

export type Attachment = { name: string; contentBase64: string; contentType?: string };

export type SendInput = {
  organisationId: string;
  to: string; toName?: string; cc?: string[];
  /** Either a saved template or inline blocks / raw html. */
  templateId?: string;
  blocks?: EmailBlock[];
  subject?: string;
  html?: string; text?: string;
  context?: MergeContext;
  accountId?: string;
  actorUserId?: string;
  messageClass?: "TRANSACTIONAL" | "MARKETING";
  attachments?: Attachment[];
  calendar?: CalendarInvite;
  scheduledAt?: Date;
  partyId?: string; contactId?: string;
  entityType?: string; entityId?: string;
  campaignId?: string; automationRunId?: string;
};

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function transportFor(account: EmailAccount) {
  const security = account.smtpSecurity;
  return nodemailer.createTransport({
    host: account.smtpHost, port: account.smtpPort,
    secure: security === "SSL",
    requireTLS: security === "STARTTLS",
    ignoreTLS: security === "NONE",
    auth: { user: account.smtpUser, pass: decryptSecret(account.passwordEnc) },
    connectionTimeout: 20_000, greetingTimeout: 20_000, socketTimeout: 40_000,
    tls: { minVersion: "TLSv1.2" },
  });
}

/** Sender choice: explicit account, else the person's own default, else the company default. */
export async function resolveAccount(organisationId: string, actorUserId?: string, accountId?: string) {
  if (accountId) {
    const account = await db.emailAccount.findFirst({ where: { id: accountId, organisationId, active: true } });
    if (!account) throw new Error("That sending account is not available.");
    if (account.scope === "PERSONAL" && account.ownerUserId !== actorUserId) throw new Error("That is another person's mailbox.");
    return account;
  }
  const order = [{ isDefault: "desc" as const }, { createdAt: "asc" as const }];
  if (actorUserId) {
    const own = await db.emailAccount.findFirst({ where: { organisationId, scope: "PERSONAL", ownerUserId: actorUserId, active: true }, orderBy: order });
    if (own) return own;
  }
  const company = await db.emailAccount.findFirst({ where: { organisationId, scope: "COMPANY", active: true }, orderBy: order });
  if (!company) throw new Error("No email account is set up. A company administrator can add one under Settings, IT, Email accounts.");
  return company;
}

async function isSuppressed(organisationId: string, email: string) {
  const contacts = await db.contact.findMany({ where: { party: { organisationId }, OR: [{ email: { equals: email, mode: "insensitive" } }, { alternativeEmail: { equals: email, mode: "insensitive" } }] }, select: { id: true } });
  if (!contacts.length) return false;
  return (await db.marketingSuppression.count({ where: { organisationId, channel: { in: ["ALL", "EMAIL"] }, profile: { contactId: { in: contacts.map((c) => c.id) } } } })) > 0;
}

/** Saves the message, then delivers it (or leaves it queued if scheduled). Never throws for a delivery failure: the row records it. */
export async function sendEmail(input: SendInput): Promise<{ id: string; status: string; error?: string }> {
  if (!EMAIL_RE.test(input.to)) throw new Error("Enter a valid email address.");
  const messageClass = input.messageClass ?? "TRANSACTIONAL";
  const attachments = input.attachments ?? [];
  if (attachments.reduce((n, a) => n + a.contentBase64.length * 0.75, 0) > MAX_ATTACHMENT_BYTES) throw new Error("Attachments are too large (8 MB limit).");
  const account = await resolveAccount(input.organisationId, input.actorUserId, input.accountId);
  const brand = await loadBrand(input.organisationId);
  const sender = input.actorUserId ? await db.user.findUnique({ where: { id: input.actorUserId }, select: { name: true } }) : null;
  const ctx: MergeContext = { company: { name: brand.name }, sender: { name: account.fromName || sender?.name || brand.name }, ...(input.context ?? {}) };

  let blocks = input.blocks;
  let subject = input.subject ?? "";
  let preheader = "";
  if (input.templateId) {
    const template = await db.emailTemplate.findFirst({ where: { id: input.templateId, organisationId: input.organisationId } });
    if (!template) throw new Error("That email template no longer exists.");
    blocks = sanitiseBlocks(template.blocks);
    subject = input.subject || template.subject;
    preheader = template.preheader;
  }
  subject = merge(subject, ctx).slice(0, 300);
  if (!subject) throw new Error("Add a subject.");

  const stub = await db.emailMessage.create({
    data: {
      organisationId: input.organisationId, accountId: account.id, templateId: input.templateId, messageClass,
      toEmail: input.to.toLowerCase(), toName: input.toName ?? "", cc: input.cc ?? [], subject, html: "", text: "",
      attachments: attachments as never, calendar: (input.calendar as never) ?? undefined,
      scheduledAt: input.scheduledAt ?? new Date(), partyId: input.partyId, contactId: input.contactId,
      entityType: input.entityType, entityId: input.entityId, campaignId: input.campaignId,
      automationRunId: input.automationRunId, createdByUserId: input.actorUserId,
    },
  });
  const base = publicBaseUrl();
  const rendered = blocks
    ? renderEmail(blocks, brand, ctx, {
        preheader, signatureHtml: account.signatureHtml || undefined, openPixelUrl: `${base}/api/public/email-open/${stub.openToken}`,
        unsubscribeUrl: messageClass === "MARKETING" ? `${base}/unsubscribe/${stub.openToken}` : undefined,
      })
    : { html: input.html ?? "", text: input.text ?? "" };
  if (!rendered.html && !rendered.text) throw new Error("The email has no content.");
  await db.emailMessage.update({ where: { id: stub.id }, data: { html: rendered.html, text: rendered.text } });

  if (messageClass === "MARKETING" && await isSuppressed(input.organisationId, input.to)) {
    await db.emailMessage.update({ where: { id: stub.id }, data: { status: "SUPPRESSED", error: "Recipient has opted out of marketing email." } });
    return { id: stub.id, status: "SUPPRESSED", error: "Recipient has opted out of marketing email." };
  }
  if (input.scheduledAt && input.scheduledAt.getTime() > Date.now() + 30_000) return { id: stub.id, status: "QUEUED" };
  return deliverMessage(stub.id);
}

export async function deliverMessage(messageId: string): Promise<{ id: string; status: string; error?: string }> {
  const claimed = await db.emailMessage.updateMany({ where: { id: messageId, status: "QUEUED" }, data: { status: "SENDING" } });
  if (!claimed.count) return { id: messageId, status: "SKIPPED" };
  const message = await db.emailMessage.findUniqueOrThrow({ where: { id: messageId } });
  try {
    const account = message.accountId ? await db.emailAccount.findFirst({ where: { id: message.accountId, organisationId: message.organisationId } }) : null;
    if (!account || !account.active) throw new Error("The sending account is no longer active.");
    const sentToday = await db.emailMessage.count({ where: { organisationId: message.organisationId, accountId: account.id, status: "SENT", sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } });
    if (sentToday >= account.dailyLimit) throw new Error(`Daily sending limit of ${account.dailyLimit} reached for ${account.fromEmail}.`);
    const files = (message.attachments as unknown as Attachment[] | null) ?? [];
    const calendar = message.calendar as unknown as CalendarInvite | null;
    const ics = calendar ? buildIcs({ ...calendar, organiserEmail: account.fromEmail, organiserName: account.fromName || undefined }) : null;
    const info = await transportFor(account).sendMail({
      from: { name: account.fromName || account.fromEmail, address: account.fromEmail },
      to: message.toName ? { name: message.toName, address: message.toEmail } : message.toEmail,
      cc: message.cc.length ? message.cc : undefined,
      replyTo: account.replyTo || undefined,
      subject: message.subject, html: message.html, text: message.text,
      headers: message.messageClass === "MARKETING" ? { "List-Unsubscribe": `<${publicBaseUrl()}/unsubscribe/${message.openToken}>` } : undefined,
      attachments: [
        ...files.map((f) => ({ filename: f.name, content: Buffer.from(f.contentBase64, "base64"), contentType: f.contentType })),
        ...(ics ? [{ filename: "invite.ics", content: ics.ics, contentType: "text/calendar; charset=utf-8; method=REQUEST" }] : []),
      ],
      ...(ics ? { icalEvent: { method: "REQUEST", content: ics.ics } } : {}),
    });
    await db.emailMessage.update({ where: { id: messageId }, data: { status: "SENT", sentAt: new Date(), providerMessageId: info.messageId, error: null } });
    await db.emailAccount.update({ where: { id: account.id }, data: { status: "OK", lastError: null } });
    if (message.partyId) await db.activity.create({ data: { organisationId: message.organisationId, type: "email.sent", summary: `Email sent: ${message.subject}`, entityType: message.entityType ?? "email", entityId: message.entityId ?? message.id, partyId: message.partyId } });
    await writeAudit({ organisationId: message.organisationId, actorUserId: message.createdByUserId ?? undefined, action: "email.sent", entityType: "EmailMessage", entityId: message.id, after: { to: message.toEmail, subject: message.subject } });
    await emit(DOMAIN_EVENTS.emailSent, { organisationId: message.organisationId, emailId: message.id, partyId: message.partyId, entityType: message.entityType, entityId: message.entityId });
    return { id: messageId, status: "SENT" };
  } catch (error) {
    const text = error instanceof Error ? error.message : "Delivery failed.";
    await db.emailMessage.update({ where: { id: messageId }, data: { status: "FAILED", error: text.slice(0, 500) } });
    if (message.accountId) await db.emailAccount.updateMany({ where: { id: message.accountId }, data: { status: "ERROR", lastError: text.slice(0, 500) } });
    await emit(DOMAIN_EVENTS.emailFailed, { organisationId: message.organisationId, emailId: message.id, error: text.slice(0, 200) });
    return { id: messageId, status: "FAILED", error: text };
  }
}

/** Scheduler: deliver messages whose time has come. */
export async function deliverDueEmails(limit = 20) {
  const due = await db.emailMessage.findMany({ where: { status: "QUEUED", scheduledAt: { lte: new Date() }, html: { not: "" } }, orderBy: { scheduledAt: "asc" }, take: limit, select: { id: true } });
  for (const row of due) await deliverMessage(row.id);
  return due.length;
}

export async function verifyAccount(account: EmailAccount): Promise<{ ok: boolean; error?: string }> {
  try {
    await transportFor(account).verify();
    await db.emailAccount.update({ where: { id: account.id }, data: { status: "OK", lastError: null, lastVerifiedAt: new Date() } });
    return { ok: true };
  } catch (error) {
    const text = error instanceof Error ? error.message : "Could not connect.";
    await db.emailAccount.update({ where: { id: account.id }, data: { status: "ERROR", lastError: text.slice(0, 500) } });
    return { ok: false, error: text };
  }
}
