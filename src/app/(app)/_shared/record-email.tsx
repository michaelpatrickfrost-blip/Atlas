import Link from "next/link";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { loadEmailRecord, sendRecordContractAction, sendRecordEmailAction, type RecordKind } from "./record-email-actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const tone = (status: string) => (status === "SENT" || status === "SIGNED" ? "success" : status === "FAILED" || status === "DECLINED" ? "danger" : status === "QUEUED" || status === "VIEWED" ? "warning" : "neutral");
const when = (value: Date) => value.toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
const word = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

/** Email and contract sending for one record, with what has already been sent. */
export async function RecordEmail({ kind, recordId }: { kind: RecordKind; recordId: string }) {
  const session = await requireSession();
  const send = can(session, CORE_CAPABILITIES.emailSend), contract = can(session, CORE_CAPABILITIES.contractManage) && kind !== "invoice";
  if (!send && !contract) return null;
  const record = await loadEmailRecord(session, kind, recordId).catch(() => null);
  if (!record) return null;
  const organisationId = session.organisationId;
  const [accounts, contacts, messages, contracts] = await Promise.all([
    db.emailAccount.findMany({ where: { organisationId, active: true, OR: [{ scope: "COMPANY" }, { scope: "PERSONAL", ownerUserId: session.userId }] }, select: { id: true, label: true, fromEmail: true, scope: true, isDefault: true }, orderBy: [{ scope: "desc" }, { isDefault: "desc" }] }),
    db.contact.findMany({ where: { partyId: record.partyId, party: { organisationId }, email: { not: null } }, select: { id: true, firstName: true, surname: true, email: true, jobTitle: true }, orderBy: { surname: "asc" } }),
    db.emailMessage.findMany({ where: { organisationId, ...(kind === "customer" ? { partyId: record.partyId } : { entityType: record.entityType, entityId: record.id }) }, select: { id: true, toEmail: true, subject: true, status: true, error: true, createdAt: true, openedAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    contract ? db.contractDocument.findMany({ where: { organisationId, ...(kind === "quote" ? { quoteId: record.id } : kind === "order" ? { orderId: record.id } : { partyId: record.partyId }) }, select: { id: true, reference: true, title: true, status: true, signerEmail: true, signerName: true, sentAt: true, signedAt: true }, orderBy: { createdAt: "desc" }, take: 5 }) : [],
  ]);
  const company = (await db.organisation.findUnique({ where: { id: organisationId }, select: { name: true } }))?.name ?? "us";
  const inbound = kind === "customer" ? await db.emailInbound.findMany({ where: { organisationId, partyId: record.partyId }, select: { id: true, fromEmail: true, fromName: true, subject: true, text: true, receivedAt: true }, orderBy: { receivedAt: "desc" }, take: 8 }) : await db.emailInbound.findMany({ where: { organisationId, replyToMessageId: { in: messages.map((row) => row.id) } }, select: { id: true, fromEmail: true, fromName: true, subject: true, text: true, receivedAt: true }, orderBy: { receivedAt: "desc" }, take: 8 });
  const first = contacts[0];
  const about = record.reference ? `${record.label} ${record.reference}` : "";
  const subject = about ? `${about} from {{company.name}}` : "";
  const message = `Hello${first ? ` ${first.firstName}` : ""},\n\n${about ? `Please find ${record.pdf ? "attached " : ""}${record.label.toLowerCase()} ${record.reference}${record.total ? ` for ${record.total}` : ""}.` : ""}\n\nKind regards,\n{{sender.name}}`;
  const from = <label className="block text-xs font-medium">From<select name="accountId" className={field}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.label} · {account.fromEmail}{account.scope === "PERSONAL" ? " · yours" : ""}</option>)}</select></label>;
  const to = (label: string) => <label className="block text-xs font-medium">{label}<input name="to" type="email" required list={`contacts-${record.id}`} defaultValue={first?.email ?? ""} placeholder="name@company.com" className={field} /><datalist id={`contacts-${record.id}`}>{contacts.map((person) => <option key={person.id} value={person.email ?? ""}>{person.firstName} {person.surname}{person.jobTitle ? ` · ${person.jobTitle}` : ""}</option>)}</datalist></label>;
  const hidden = <><input type="hidden" name="kind" value={kind} /><input type="hidden" name="recordId" value={record.id} /></>;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-semibold">Email</h3><p className="mt-1 text-xs text-slate-500">{kind === "customer" ? "Email this customer. Everything sent to them from Atlas is listed here." : `Send this ${record.label.toLowerCase()} to the customer. Sent from your company's own mailbox, in your brand.`}</p></div>
      {accounts.length ? <div className="flex flex-wrap gap-2">
        {send && <CreateDialog label={about ? `Email ${record.label.toLowerCase()}` : "New email"} title={about ? `Email ${about}` : `Email ${record.customer}`}><ActionForm action={sendRecordEmailAction}><div className="space-y-4">
          {hidden}
          <div className="grid gap-4 sm:grid-cols-2">{from}{to("To")}</div>
          <label className="block text-xs font-medium">Copy to (optional)<input name="cc" placeholder="Separate addresses with commas" className={field} /></label>
          <label className="block text-xs font-medium">Subject<input name="subject" required maxLength={300} defaultValue={subject} className={field} /></label>
          <label className="block text-xs font-medium">Message<textarea name="message" required rows={9} maxLength={10000} defaultValue={message} className={field} /></label>
          {record.pdf && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="attachPdf" defaultChecked className="size-4 rounded border-slate-300" />Attach the PDF of {record.reference}</label>}
          <Button type="submit" variant="primary">Send email</Button>
        </div></ActionForm></CreateDialog>}
        {contract && <CreateDialog label="Send contract" title="Send a contract for signature" variant="secondary"><ActionForm action={sendRecordContractAction}><div className="space-y-4">
          {hidden}
          <div className="grid gap-4 sm:grid-cols-2">{from}{to("Signer's email")}</div>
          <label className="block text-xs font-medium">Contract title<input name="title" required maxLength={300} defaultValue={about ? `Agreement for ${about}` : `Agreement with ${record.customer}`} className={field} /></label>
          <label className="block text-xs font-medium">Terms<textarea name="body" required rows={10} maxLength={50000} defaultValue={`This agreement is between ${company} and ${record.customer}.\n\n${about ? `It covers ${record.label.toLowerCase()} ${record.reference}${record.total ? `, total ${record.total}` : ""}.\n\n` : ""}Terms:\n`} className={field} /></label>
          <p className="text-xs text-slate-500">The signer gets a private link, reads the terms and signs by typing their name. The link works for 30 days and needs no Atlas login.</p>
          <Button type="submit" variant="primary">Send for signature</Button>
        </div></ActionForm></CreateDialog>}
      </div> : <p className="text-xs text-slate-500">No email account is set up yet. {can(session, CORE_CAPABILITIES.itManage) ? <Link href="/settings/it" className="font-medium text-blue-600">Add one in Settings → IT →</Link> : "Ask an administrator to add one in Settings, IT."}</p>}
    </div>
    {!!contracts.length && <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{contracts.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><span className="font-medium">{row.reference} · {row.title}</span><span className="mt-1 block text-xs text-slate-500">{row.signedAt ? `Signed by ${row.signerName ?? row.signerEmail} on ${when(row.signedAt)}` : row.sentAt ? `Sent to ${row.signerEmail} on ${when(row.sentAt)}` : "Not sent"}</span></span><StatusPill label={word(row.status)} tone={tone(row.status)} /></li>)}</ul>}
    {!!inbound.length && <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{inbound.map((row) => <li key={row.id} className="py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><span className="font-medium">{row.subject || "(no subject)"}</span><StatusPill label="Received" tone="neutral" /></div><p className="mt-1 text-xs text-slate-500">From {row.fromName || row.fromEmail} · {when(row.receivedAt)}</p>{row.text && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{row.text.slice(0, 600)}</p>}</li>)}</ul>}
    {messages.length ? <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{messages.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><span className="font-medium">{row.subject}</span><span className="mt-1 block text-xs text-slate-500">To {row.toEmail} · {when(row.createdAt)}{row.openedAt ? ` · opened ${when(row.openedAt)}` : ""}{row.error ? ` · ${row.error}` : ""}</span></span><StatusPill label={word(row.status)} tone={tone(row.status)} /></li>)}</ul> : <p className="mt-4 text-xs text-slate-400">Nothing sent yet.</p>}
  </section>;
}
