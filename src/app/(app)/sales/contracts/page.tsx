import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { ShareLinkButton } from "@/app/(app)/_shared/share-link-button";
import { deleteContractAction, newContractAction, resendContractAction } from "./actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const small = "rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900";
const when = (value: Date | null) => (value ? value.toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" }) : "—");
const labels: Record<string, string> = { DRAFT: "Not sent", SENT: "Sent", VIEWED: "Opened", SIGNED: "Signed", DECLINED: "Declined" };
const tones: Record<string, "success" | "warning" | "danger" | "neutral"> = { DRAFT: "neutral", SENT: "warning", VIEWED: "warning", SIGNED: "success", DECLINED: "danger" };
const FILTERS = [["", "Everything"], ["waiting", "Waiting on the customer"], ["SIGNED", "Signed or approved"], ["DECLINED", "Declined"], ["DRAFT", "Not sent"]] as const;

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; customer?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const organisationId = session.organisationId, filters = await searchParams;
  const q = typeof filters.q === "string" ? filters.q.trim() : "", status = FILTERS.some(([value]) => value === filters.status) ? filters.status ?? "" : "", customer = typeof filters.customer === "string" ? filters.customer : "";
  const [rows, parties, accounts, contacts] = await Promise.all([
    db.contractDocument.findMany({
      where: { organisationId, status: status === "waiting" ? { in: ["SENT", "VIEWED"] } : status ? status : { not: "SUPERSEDED" }, ...(customer ? { partyId: customer } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }, { signerEmail: { contains: q, mode: "insensitive" } }, { signerName: { contains: q, mode: "insensitive" } }] } : {}) },
      select: { id: true, reference: true, title: true, kind: true, status: true, partyId: true, quoteId: true, orderId: true, signerEmail: true, signerName: true, signerIp: true, signerUserAgent: true, signatureImage: true, sentAt: true, viewedAt: true, signedAt: true, expiresAt: true, declinedReason: true, contentHash: true, fileName: true, fileSize: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: 200,
    }),
    db.party.findMany({ where: { organisationId }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" } }),
    db.emailAccount.findMany({ where: { organisationId, active: true, OR: [{ scope: "COMPANY" }, { scope: "PERSONAL", ownerUserId: session.userId }] }, select: { id: true, label: true, fromEmail: true }, orderBy: [{ scope: "desc" }, { isDefault: "desc" }] }),
    db.contact.findMany({ where: { party: { organisationId }, email: { not: null } }, select: { id: true, firstName: true, surname: true, email: true, party: { select: { name: true } } }, take: 2000 }),
  ]);
  const partyName = new Map(parties.map((party) => [party.id, party.name]));
  const all = await db.contractDocument.groupBy({ by: ["status"], where: { organisationId, status: { not: "SUPERSEDED" } }, _count: { _all: true } });
  const count = (...keys: string[]) => all.filter((row) => keys.includes(row.status)).reduce((sum, row) => sum + row._count._all, 0);
  const cards: [string, number, string][] = [["Waiting on the customer", count("SENT", "VIEWED"), "waiting"], ["Signed or approved", count("SIGNED"), "SIGNED"], ["Declined", count("DECLINED"), "DECLINED"], ["Not sent yet", count("DRAFT"), "DRAFT"]];
  const sender = accounts.length ? <label className="block text-xs font-medium">Send from<select name="accountId" className={field}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.label} · {account.fromEmail}</option>)}</select></label> : <p className="self-end text-xs text-slate-500">No email account is set up. Leave the email blank and use Get share link.</p>;
  const validity = <label className="block text-xs font-medium">Link stays open for<select name="validDays" defaultValue="30" className={field}>{[7, 14, 30, 60, 90].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-semibold tracking-tight">Contracts and approvals</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Upload a contract, send the customer a link in your branding, and they read it and sign online. Quotations sent for approval appear here too. Every step is recorded.</p></div>
      <CreateDialog label="New contract" title="Upload a contract and send it for signature"><ActionForm action={newContractAction}><div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium">Customer<select name="partyId" required defaultValue={customer} className={field}><option value="">Choose a customer</option>{parties.map((party) => <option key={party.id} value={party.id}>{party.customerCode} · {party.name}</option>)}</select></label>
          <label className="block text-xs font-medium">Title<input name="title" required maxLength={300} placeholder="Supply agreement 2027" className={field} /></label>
        </div>
        <label className="block text-xs font-medium">The contract (PDF, up to 10 MB)<input name="file" type="file" accept="application/pdf,.pdf" className={field} /></label>
        <label className="block text-xs font-medium">Or type the terms<textarea name="body" rows={5} maxLength={50000} className={field} /></label>
        <label className="block text-xs font-medium">Message shown to the signer (optional)<textarea name="message" rows={2} maxLength={2000} placeholder="Please read and sign. Call me if anything needs changing." className={field} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium">Signer&apos;s email<input name="to" type="email" list="contract-contacts" placeholder="Leave blank to send a link yourself" className={field} /><datalist id="contract-contacts">{contacts.map((person) => <option key={person.id} value={person.email ?? ""}>{person.firstName} {person.surname} · {person.party.name}</option>)}</datalist></label>
          {validity}
        </div>
        {sender}
        <p className="text-xs text-slate-500">The document is stored against the customer. A signed document cannot be changed or deleted.</p>
        <Button type="submit" variant="primary">Save and send</Button>
      </div></ActionForm></CreateDialog>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, key]) => <Link key={key} href={status === key ? "/sales/contracts" : `/sales/contracts?status=${key}`} className={`rounded-2xl border bg-white p-5 transition hover:border-blue-300 ${status === key ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p></Link>)}</div>

    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="min-w-48 flex-1 text-xs text-slate-500">Search<input name="q" defaultValue={q} placeholder="Title, reference or signer" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs text-slate-500">Customer<select name="customer" defaultValue={customer} className="mt-1.5 block max-w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">All customers</option>{parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select></label>
      <label className="text-xs text-slate-500">Status<select name="status" defaultValue={status} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2 text-sm">{FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">Apply</button><Link href="/sales/contracts" className="px-2 py-2 text-sm text-slate-500">Reset</Link>
    </form>

    {!rows.length ? <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">{q || status || customer ? "Nothing matches these filters." : "No contracts yet. Upload the first one with New contract, or use Send for approval on a quotation."}</p> : <ul className="space-y-3">{rows.map((row) => {
      const quote = row.kind === "QUOTE", done = row.status === "SIGNED";
      return <li key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{row.reference} · {quote ? "Quotation approval" : "Contract"}</p>
            <p className="mt-1 text-base font-semibold">{row.title}</p>
            <p className="mt-1 text-sm text-slate-500">{row.partyId ? <Link href={`/customers/${row.partyId}?tab=activity`} className="text-blue-700">{partyName.get(row.partyId) ?? "Customer"}</Link> : "No customer"}{row.quoteId ? <> · <Link href={`/sales/quotes/${row.quoteId}`} className="text-blue-700">Open quotation</Link></> : null}{row.orderId ? <> · <Link href={`/sales/orders/${row.orderId}`} className="text-blue-700">Open order</Link></> : null}</p>
          </div>
          <StatusPill label={quote && done ? "Approved" : labels[row.status] ?? row.status} tone={tones[row.status] ?? "neutral"} />
        </div>
        <ol className="mt-4 grid gap-2 text-xs sm:grid-cols-4">{([["Created", row.createdAt, ""], ["Sent", row.sentAt, row.signerEmail ?? "by link"], ["Opened", row.viewedAt ?? (done ? row.signedAt : null), ""], [row.status === "DECLINED" ? "Declined" : quote ? "Approved" : "Signed", done ? row.signedAt : null, done ? row.signerName ?? "" : row.status === "DECLINED" ? row.declinedReason ?? "" : row.expiresAt && ["SENT", "VIEWED"].includes(row.status) ? `open until ${row.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""]] as [string, Date | null, string][]).map(([label, at, note]) => <li key={label} className={`rounded-xl px-3 py-2 ${at || (label === "Declined") ? (label === "Declined" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900") : "bg-slate-50 text-slate-400"}`}><p className="font-semibold">{label}</p><p className="mt-0.5">{at ? when(at) : label === "Declined" ? "" : "Not yet"}</p>{note && <p className="mt-0.5 truncate opacity-80">{note}</p>}</li>)}</ol>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {row.fileName && <a href={`/api/contracts/${row.id}/file`} target="_blank" rel="noopener" className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">Open PDF</a>}
          {!done && <ShareLinkButton contractId={row.id} />}
          {!done && !!accounts.length && <CreateDialog label="Email it" title={`Email ${row.title}`} trigger={(open) => <button type="button" onClick={open} className={small}>{row.sentAt ? "Send again" : "Email it"}</button>}><ActionForm action={resendContractAction}><div className="space-y-4"><input type="hidden" name="id" value={row.id} /><label className="block text-xs font-medium">To<input name="to" type="email" required defaultValue={row.signerEmail ?? ""} list="contract-contacts" className={field} /></label>{sender}{validity}<p className="text-xs text-slate-500">Sending again makes a new link. The old one stops working.</p><Button type="submit" variant="primary">Send</Button></div></ActionForm></CreateDialog>}
          {!done && <ActionForm action={deleteContractAction}><input type="hidden" name="id" value={row.id} /><button className={small}>Delete</button></ActionForm>}
        </div>
        {(done || row.status === "DECLINED") && <details className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600"><summary className="cursor-pointer font-medium text-slate-800">Signing record</summary>
          <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-slate-400">{done ? "Signed by" : "Declined by"}</dt><dd className="font-medium text-slate-800">{row.signerName ?? row.signerEmail ?? "—"}</dd></div>
            <div><dt className="text-slate-400">When</dt><dd>{when(done ? row.signedAt : row.viewedAt)}</dd></div>
            <div><dt className="text-slate-400">Sent to</dt><dd>{row.signerEmail ?? "Shared by link"}</dd></div>
            <div><dt className="text-slate-400">Network address</dt><dd>{row.signerIp ?? "Not recorded"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-400">Device</dt><dd className="break-words">{row.signerUserAgent ?? "Not recorded"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-400">Document fingerprint (SHA-256){row.fileName ? ` · ${row.fileName}${row.fileSize ? ` · ${Math.round(row.fileSize / 1024)} KB` : ""}` : ""}</dt><dd className="break-all font-mono">{row.contentHash}</dd></div>
            {row.declinedReason && <div className="sm:col-span-2"><dt className="text-slate-400">Reason given</dt><dd>{row.declinedReason}</dd></div>}
          </dl>
          {/* eslint-disable-next-line @next/next/no-img-element -- the signer's drawn signature, stored as a data URL. */}
          {row.signatureImage && <div className="mt-3"><p className="text-slate-400">Drawn signature</p><img src={row.signatureImage} alt={`Signature of ${row.signerName ?? "the signer"}`} className="mt-1 h-24 rounded-lg border border-slate-200 bg-white" /></div>}
        </details>}
      </li>;
    })}</ul>}
  </div>;
}
