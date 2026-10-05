import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { AccountForm } from "./account-form";
import Link from "next/link";
import { checkInboxNow, deleteEmailAccount, makeDefaultAccount, sendTestEmail, setAccountActive, verifyEmailAccount } from "../actions";

const tone: Record<string, string> = { OK: "bg-emerald-50 text-emerald-700", ERROR: "bg-red-50 text-red-700", UNVERIFIED: "bg-amber-50 text-amber-700" };
const btn = "rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50";

export default async function EmailAccounts() {
  const session = await requireSession();
  const admin = can(session, CORE_CAPABILITIES.itManage);
  const personal = can(session, CORE_CAPABILITIES.emailPersonal);
  const accounts = await db.emailAccount.findMany({
    where: { organisationId: session.organisationId, OR: [...(admin ? [{ scope: "COMPANY" }] : [{ scope: "COMPANY", active: true }]), { scope: "PERSONAL", ownerUserId: session.userId }] },
    orderBy: [{ scope: "asc" }, { createdAt: "asc" }],
    select: { id: true, scope: true, label: true, fromName: true, fromEmail: true, replyTo: true, smtpHost: true, smtpPort: true, smtpSecurity: true, smtpUser: true, imapHost: true, imapPort: true, imapSecurity: true, imapUser: true, imapEnabled: true, imapStatus: true, imapError: true, imapSyncedAt: true, signatureHtml: true, dailyLimit: true, isDefault: true, active: true, status: true, lastError: true, ownerUserId: true },
  });
  const received = await db.emailInbound.findMany({ where: { organisationId: session.organisationId, accountId: { in: accounts.map((a) => a.id) } }, orderBy: { receivedAt: "desc" }, take: 15, select: { id: true, fromEmail: true, fromName: true, subject: true, receivedAt: true, partyId: true } });
  const recent = await db.emailMessage.findMany({ where: { organisationId: session.organisationId, ...(admin ? {} : { createdByUserId: session.userId }) }, orderBy: { createdAt: "desc" }, take: 12, select: { id: true, toEmail: true, subject: true, status: true, createdAt: true, error: true } });
  const section = (title: string, hint: string, scope: "COMPANY" | "PERSONAL", canEdit: boolean) => {
    const rows = accounts.filter((a) => a.scope === scope);
    return (
      <section className="space-y-4">
        <div><h3 className="text-lg font-semibold">{title}</h3><p className="text-sm text-slate-500">{hint}</p></div>
        {rows.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{a.label} {a.isDefault && <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">Default</span>} {!a.active && <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">Off</span>}</p>
                <p className="text-sm text-slate-500">{a.fromName ? `${a.fromName} <${a.fromEmail}>` : a.fromEmail} · {a.smtpHost}:{a.smtpPort}</p>
              </div>
              <span className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs ${tone[a.status] ?? tone.UNVERIFIED}`}>Sending: {a.status === "OK" ? "working" : a.status === "ERROR" ? "problem" : "not tested"}</span><span className={`rounded-full px-3 py-1 text-xs ${!a.imapHost ? "bg-slate-100 text-slate-600" : tone[a.imapStatus] ?? tone.UNVERIFIED}`}>Receiving: {!a.imapHost ? "not set up" : !a.imapEnabled ? "off" : a.imapStatus === "OK" ? "working" : a.imapStatus === "ERROR" ? "problem" : "not tested"}</span></span>
            </div>
            {a.lastError && <p className="mt-2 text-xs text-red-700">Sending: {a.lastError}</p>}
            {a.imapError && <p className="mt-2 text-xs text-red-700">Receiving: {a.imapError}</p>}
            {a.imapHost && <p className="mt-2 text-xs text-slate-500">Inbox {a.imapHost}:{a.imapPort}{a.imapSyncedAt ? ` · last checked ${a.imapSyncedAt.toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "short", timeStyle: "short" })}` : " · not checked yet"}</p>}
            {canEdit && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ActionForm action={verifyEmailAccount}><input type="hidden" name="id" value={a.id} /><button className={btn}>Test sending</button></ActionForm>
                {a.imapHost && <ActionForm action={checkInboxNow}><input type="hidden" name="id" value={a.id} /><button className={btn}>Check inbox now</button></ActionForm>}
                <ActionForm action={sendTestEmail} className="flex items-center gap-2"><input type="hidden" name="id" value={a.id} /><input name="to" type="email" placeholder={session.userEmail} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs" /><button className={btn}>Send test email</button></ActionForm>
                {!a.isDefault && <ActionForm action={makeDefaultAccount}><input type="hidden" name="id" value={a.id} /><button className={btn}>Make default</button></ActionForm>}
                <ActionForm action={setAccountActive}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="active" value={String(!a.active)} /><button className={btn}>{a.active ? "Turn off" : "Turn on"}</button></ActionForm>
                <ActionForm action={deleteEmailAccount}><input type="hidden" name="id" value={a.id} /><button className={`${btn} text-red-700`}>Remove</button></ActionForm>
              </div>
            )}
            {canEdit && <details className="mt-3"><summary className="cursor-pointer text-xs text-blue-700">Edit settings</summary><div className="mt-3"><AccountForm scope={scope} existing={a} /></div></details>}
          </div>
        ))}
        {!rows.length && <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">None yet.</p>}
        {canEdit && <details className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold">Add a {scope === "COMPANY" ? "company" : "personal"} mailbox</summary><div className="mt-4"><AccountForm scope={scope} /></div></details>}
      </section>
    );
  };
  return (
    <div className="max-w-4xl space-y-10">
      <div><h2 className="text-2xl font-semibold tracking-tight">Email accounts</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">Each mailbox has two halves: sending (SMTP) and receiving (IMAP). Set both and Atlas sends quotations, contracts and follow-ups from your own address and brings the replies back onto the customer. Passwords are stored encrypted and are never shown again.</p></div>
      {section("Company mailboxes", "Shared addresses such as sales@ or accounts@. Anyone allowed to send email can use them.", "COMPANY", admin)}
      {personal && section("Your mailboxes", "Only you can send from these. Add as many as you need.", "PERSONAL", true)}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Received</h3>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white text-sm">
          {received.map((m) => <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3"><span className="min-w-0 truncate">{m.subject || "(no subject)"} <span className="text-slate-400">from {m.fromName || m.fromEmail}</span></span><span className="shrink-0 text-xs text-slate-500">{m.partyId ? <Link href={`/customers/${m.partyId}?tab=activity`} className="text-blue-700">On the customer →</Link> : "Sender not a known contact"} · {m.receivedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></div>)}
          {!received.length && <p className="p-4 text-slate-500">Nothing received yet. Add the incoming server to a mailbox and tick &quot;Bring replies into Atlas&quot;.</p>}
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Sent</h3>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white text-sm">
          {recent.map((m) => <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3"><span className="min-w-0 truncate">{m.subject} <span className="text-slate-400">to {m.toEmail}</span></span><span className={`shrink-0 text-xs ${m.status === "SENT" ? "text-emerald-700" : m.status === "FAILED" ? "text-red-700" : "text-slate-500"}`} title={m.error ?? ""}>{m.status.toLowerCase()}</span></div>)}
          {!recent.length && <p className="p-4 text-slate-500">Nothing sent yet.</p>}
        </div>
      </section>
    </div>
  );
}
