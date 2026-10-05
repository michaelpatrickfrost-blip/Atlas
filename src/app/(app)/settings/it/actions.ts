"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { encryptSecret, decryptSecret } from "@/core/security/secrets";
import { sendEmail, verifyAccount } from "@/core/email/send";
import { syncInbox, verifyInbox } from "@/core/email/inbox";
import { sanitiseBlocks } from "@/core/email/blocks";
import { writeAudit } from "@/core/audit/log";
import { SOCIAL_PLATFORMS } from "@/core/email/presets";

const text = (f: FormData, k: string, max = 300, required = false) => {
  const v = String(f.get(k) ?? "").trim();
  if (v.length > max || (required && !v)) throw new Error(`Please enter ${k}.`);
  return v;
};
const refresh = () => { revalidatePath("/settings/it", "layout"); };

async function accountAccess(scope: string, ownerUserId: string | null) {
  const session = await requireSession();
  if (scope === "COMPANY") assertCapability(session, CORE_CAPABILITIES.itManage);
  else {
    assertCapability(session, CORE_CAPABILITIES.emailPersonal);
    if (ownerUserId && ownerUserId !== session.userId) throw new Error("That is another person's mailbox.");
  }
  return session;
}

export async function saveEmailAccount(f: FormData) {
  const scope = text(f, "scope", 20, true) === "PERSONAL" ? "PERSONAL" : "COMPANY";
  const session = await accountAccess(scope, null);
  const id = text(f, "id", 60);
  const existing = id ? await db.emailAccount.findFirst({ where: { id, organisationId: session.organisationId } }) : null;
  if (existing) await accountAccess(existing.scope, existing.ownerUserId);
  const fromEmail = text(f, "fromEmail", 200, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) throw new Error("Enter a valid sending address.");
  const password = String(f.get("password") ?? "");
  if (!existing && !password) throw new Error("Enter the mailbox password or app password.");
  const security = ["STARTTLS", "SSL", "NONE"].includes(text(f, "smtpSecurity", 20)) ? text(f, "smtpSecurity", 20) : "STARTTLS";
  const data = {
    label: text(f, "label", 100, true), fromName: text(f, "fromName", 100), fromEmail, replyTo: text(f, "replyTo", 200),
    smtpHost: text(f, "smtpHost", 200, true), smtpPort: Math.min(65535, Math.max(1, Number(text(f, "smtpPort", 6)) || 587)), smtpSecurity: security,
    smtpUser: text(f, "smtpUser", 200, true), imapHost: text(f, "imapHost", 200), imapPort: Math.min(65535, Math.max(1, Number(text(f, "imapPort", 6)) || 993)), imapSecurity: ["SSL", "STARTTLS", "NONE"].includes(text(f, "imapSecurity", 20)) ? text(f, "imapSecurity", 20) : "SSL", imapUser: text(f, "imapUser", 200), imapEnabled: f.get("imapEnabled") === "on" && !!text(f, "imapHost", 200), signatureHtml: text(f, "signatureHtml", 4000),
    dailyLimit: Math.min(5000, Math.max(1, Number(text(f, "dailyLimit", 6)) || 500)),
    ...(password ? { passwordEnc: encryptSecret(password) } : {}),
  };
  const saved = existing
    ? await db.emailAccount.update({ where: { id: existing.id }, data: { ...data, status: "UNVERIFIED" } })
    : await db.emailAccount.create({ data: { ...data, passwordEnc: encryptSecret(password), organisationId: session.organisationId, scope, ownerUserId: scope === "PERSONAL" ? session.userId : null } });
  const siblings = await db.emailAccount.count({ where: { organisationId: session.organisationId, scope: saved.scope, ownerUserId: saved.ownerUserId, active: true } });
  if (siblings === 1) await db.emailAccount.update({ where: { id: saved.id }, data: { isDefault: true } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: existing ? "email.account.updated" : "email.account.created", entityType: "EmailAccount", entityId: saved.id, after: { scope: saved.scope, fromEmail } });
  const fresh = await db.emailAccount.findUniqueOrThrow({ where: { id: saved.id } });
  const check = await verifyAccount(fresh);
  const inbox = fresh.imapHost ? await verifyInbox(fresh) : null;
  refresh();
  if (!check.ok) throw new Error(`Saved, but sending failed: ${check.error}`);
  if (inbox && !inbox.ok) throw new Error(`Saved and sending works, but the inbox could not be read: ${inbox.error}`);
}

async function owned(id: string) {
  const session = await requireSession();
  const account = await db.emailAccount.findFirst({ where: { id, organisationId: session.organisationId } });
  if (!account) throw new Error("That mailbox no longer exists.");
  await accountAccess(account.scope, account.ownerUserId);
  return { session, account };
}

export async function verifyEmailAccount(f: FormData) {
  const { account } = await owned(text(f, "id", 60, true));
  const result = await verifyAccount(account);
  refresh();
  if (!result.ok) throw new Error(`Connection failed: ${result.error}`);
}

export async function sendTestEmail(f: FormData) {
  const { session, account } = await owned(text(f, "id", 60, true));
  const to = text(f, "to", 200) || session.userEmail;
  const result = await sendEmail({ organisationId: session.organisationId, to, subject: `Test from ${account.label}`, accountId: account.id, actorUserId: session.userId, blocks: sanitiseBlocks([{ type: "heading", text: "Your mailbox is connected" }, { type: "text", text: "This test message was sent from Atlas using {{sender.name}}'s account. You can now send quotes, contracts and campaigns from this address." }]) });
  refresh();
  if (result.status !== "SENT") throw new Error(result.error ?? "The test email could not be sent.");
}

export async function makeDefaultAccount(f: FormData) {
  const { account } = await owned(text(f, "id", 60, true));
  await db.$transaction([
    db.emailAccount.updateMany({ where: { organisationId: account.organisationId, scope: account.scope, ownerUserId: account.ownerUserId }, data: { isDefault: false } }),
    db.emailAccount.update({ where: { id: account.id }, data: { isDefault: true } }),
  ]);
  refresh();
}

export async function setAccountActive(f: FormData) {
  const { account } = await owned(text(f, "id", 60, true));
  await db.emailAccount.update({ where: { id: account.id }, data: { active: text(f, "active", 5) === "true" } });
  refresh();
}

export async function deleteEmailAccount(f: FormData) {
  const { session, account } = await owned(text(f, "id", 60, true));
  await db.emailAccount.delete({ where: { id: account.id } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "email.account.deleted", entityType: "EmailAccount", entityId: account.id });
  refresh();
}

export async function saveSocialAccount(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.itManage);
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === text(f, "platform", 30, true));
  if (!platform) throw new Error("Choose a platform.");
  const credentials: Record<string, string> = {};
  for (const field of platform.fields) credentials[field.name] = text(f, field.name, 1000, true);
  const saved = await db.socialAccount.create({ data: { organisationId: session.organisationId, platform: platform.key, label: text(f, "label", 100) || platform.label, credentialsEnc: encryptSecret(JSON.stringify(credentials)), status: platform.api ? "UNVERIFIED" : "OK" } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "social.account.created", entityType: "SocialAccount", entityId: saved.id, after: { platform: platform.key } });
  refresh();
}

export async function deleteSocialAccount(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.itManage);
  await db.socialAccount.deleteMany({ where: { id: text(f, "id", 60, true), organisationId: session.organisationId } });
  refresh();
}

export async function checkSocialAccount(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.itManage);
  const account = await db.socialAccount.findFirst({ where: { id: text(f, "id", 60, true), organisationId: session.organisationId } });
  if (!account) throw new Error("That account no longer exists.");
  const { verifySocial } = await import("@/core/social/publish");
  const result = await verifySocial(account.platform, JSON.parse(decryptSecret(account.credentialsEnc)));
  await db.socialAccount.update({ where: { id: account.id }, data: { status: result.ok ? "OK" : "ERROR", lastError: result.ok ? null : (result.error ?? "").slice(0, 400) } });
  refresh();
  if (!result.ok) throw new Error(result.error ?? "Connection failed.");
}

export async function saveEmailTemplate(f: FormData) {
  const session = await requireSession();
  if (!can(session, CORE_CAPABILITIES.itManage) && !can(session, CORE_CAPABILITIES.emailSend) && !can(session, "marketing.content.create") && !can(session, "automations.rule.manage")) throw new Error("FORBIDDEN: missing capability to edit templates.");
  let blocks: unknown;
  try { blocks = JSON.parse(text(f, "blocks", 200000, true)); } catch { throw new Error("The template content is not valid."); }
  const data = { name: text(f, "name", 120, true), category: text(f, "category", 30) || "GENERAL", subject: text(f, "subject", 300, true), preheader: text(f, "preheader", 200), blocks: sanitiseBlocks(blocks) as never };
  const id = text(f, "id", 60);
  if (id) {
    const done = await db.emailTemplate.updateMany({ where: { id, organisationId: session.organisationId }, data: data });
    if (!done.count) throw new Error("That template no longer exists.");
  } else await db.emailTemplate.create({ data: { ...data, organisationId: session.organisationId, createdBy: session.userId } });
  revalidatePath("/settings/it/templates");
}

export async function deleteEmailTemplate(f: FormData) {
  const session = await requireSession();
  if (!can(session, CORE_CAPABILITIES.itManage) && !can(session, "automations.rule.manage")) throw new Error("FORBIDDEN: missing capability to delete templates.");
  await db.emailTemplate.deleteMany({ where: { id: text(f, "id", 60, true), organisationId: session.organisationId } });
  revalidatePath("/settings/it/templates");
}

/** Test receiving, then pull anything new now. */
export async function checkInboxNow(f: FormData) {
  const session = await requireSession();
  const account = await db.emailAccount.findFirst({ where: { id: text(f, "id", 60, true), organisationId: session.organisationId } });
  if (!account) throw new Error("That mailbox no longer exists.");
  await accountAccess(account.scope, account.ownerUserId);
  if (!account.imapHost) throw new Error("Add the inbox server under Edit settings first.");
  const check = await verifyInbox(account);
  if (!check.ok) { refresh(); throw new Error(check.error ?? "Could not read the inbox."); }
  if (account.imapEnabled) { const result = await syncInbox(account); refresh(); if (!result.ok) throw new Error(result.error ?? "Could not read the inbox."); }
  refresh();
}
