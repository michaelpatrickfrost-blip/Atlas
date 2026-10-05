import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { EmailAccount } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { decryptSecret } from "@/core/security/secrets";

/** Reading a company or personal mailbox over IMAP, so replies appear in Atlas against the customer. */
function clientFor(account: EmailAccount) {
  return new ImapFlow({
    host: account.imapHost, port: account.imapPort, secure: account.imapSecurity === "SSL",
    ...(account.imapSecurity === "NONE" ? { tls: undefined, disableAutoIdle: true } : {}),
    auth: { user: account.imapUser || account.smtpUser, pass: decryptSecret(account.passwordEnc) },
    logger: false, socketTimeout: 40_000, greetingTimeout: 20_000, connectionTimeout: 20_000,
  });
}
const reason = (error: unknown) => {
  const e = error as { responseText?: string; message?: string; authenticationFailed?: boolean };
  if (e?.authenticationFailed) return "The inbox server refused the username or password. Use an app password if the mailbox has two-step sign-in.";
  return (e?.responseText || e?.message || "Could not connect to the inbox server.").slice(0, 400);
};

export async function verifyInbox(account: EmailAccount): Promise<{ ok: boolean; error?: string }> {
  if (!account.imapHost) return { ok: false, error: "No inbox server is set." };
  const client = clientFor(account);
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    lock.release();
    await client.logout();
    await db.emailAccount.update({ where: { id: account.id }, data: { imapStatus: "OK", imapError: null } });
    return { ok: true };
  } catch (error) {
    client.close();
    const text = reason(error);
    await db.emailAccount.update({ where: { id: account.id }, data: { imapStatus: "ERROR", imapError: text } });
    return { ok: false, error: text };
  }
}

/** Pulls mail that arrived since the last check. The first check takes the last 14 days, newest 60 at most. */
export async function syncInbox(account: EmailAccount, limit = 60): Promise<{ ok: boolean; added: number; error?: string }> {
  if (!account.imapHost || !account.imapEnabled) return { ok: false, added: 0, error: "Reading replies is switched off for this mailbox." };
  const client = clientFor(account);
  let added = 0, highest = account.imapLastUid;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const found = account.imapLastUid > 0
        ? await client.search({ uid: `${account.imapLastUid + 1}:*` }, { uid: true })
        : await client.search({ since: new Date(Date.now() - 14 * 86_400_000) }, { uid: true });
      const uids = (found || []).filter((uid) => uid > account.imapLastUid).sort((a, b) => a - b).slice(-limit);
      for (const uid of uids) {
        const message = await client.fetchOne(String(uid), { source: true, internalDate: true }, { uid: true });
        if (!message || !message.source) continue;
        const mail = await simpleParser(message.source);
        const from = mail.from?.value?.[0];
        const fromEmail = (from?.address ?? "").toLowerCase();
        highest = Math.max(highest, uid);
        if (!fromEmail || fromEmail === account.fromEmail.toLowerCase()) continue;
        const contact = await db.contact.findFirst({ where: { party: { organisationId: account.organisationId }, OR: [{ email: { equals: fromEmail, mode: "insensitive" } }, { alternativeEmail: { equals: fromEmail, mode: "insensitive" } }] }, select: { id: true, partyId: true } });
        const inReplyTo = typeof mail.inReplyTo === "string" ? mail.inReplyTo : null;
        const original = inReplyTo ? await db.emailMessage.findFirst({ where: { organisationId: account.organisationId, providerMessageId: inReplyTo }, select: { id: true, partyId: true, contactId: true } }) : null;
        const created = await db.emailInbound.createMany({ skipDuplicates: true, data: [{
          organisationId: account.organisationId, accountId: account.id, uid, messageId: mail.messageId ?? null, inReplyTo, fromEmail, fromName: (from?.name ?? "").slice(0, 200),
          subject: (mail.subject ?? "").slice(0, 500), text: (mail.text ?? "").slice(0, 20000), receivedAt: mail.date ?? (message.internalDate instanceof Date ? message.internalDate : new Date()),
          partyId: contact?.partyId ?? original?.partyId ?? null, contactId: contact?.id ?? original?.contactId ?? null, replyToMessageId: original?.id ?? null,
        }] });
        added += created.count;
      }
    } finally { lock.release(); }
    await client.logout();
    await db.emailAccount.update({ where: { id: account.id }, data: { imapStatus: "OK", imapError: null, imapSyncedAt: new Date(), imapLastUid: highest } });
    return { ok: true, added };
  } catch (error) {
    client.close();
    const text = reason(error);
    await db.emailAccount.update({ where: { id: account.id }, data: { imapStatus: "ERROR", imapError: text, imapSyncedAt: new Date() } });
    return { ok: false, added, error: text };
  }
}

/** Scheduler: check each reading mailbox about every five minutes, a few per tick. */
export async function syncDueInboxes(limit = 3) {
  const due = await db.emailAccount.findMany({ where: { active: true, imapEnabled: true, imapHost: { not: "" }, OR: [{ imapSyncedAt: null }, { imapSyncedAt: { lt: new Date(Date.now() - 5 * 60_000) } }] }, orderBy: { imapSyncedAt: { sort: "asc", nulls: "first" } }, take: limit });
  for (const account of due) await syncInbox(account);
  return due.length;
}
