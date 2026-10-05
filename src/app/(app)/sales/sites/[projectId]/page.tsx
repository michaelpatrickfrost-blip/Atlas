import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { getSite } from "@/modules/sales/services/sites";
import { saveSiteAction, setDocumentSiteAction } from "../actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const panel = "rounded-2xl border border-slate-200 bg-white p-5";
const small = "rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900";
const STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
const word = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
const day = (value: Date | null) => (value ? value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const iso = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");
const tone = (status: string) => (["ACTIVE", "CONFIRMED", "ACCEPTED", "COMPLETED"].includes(status) ? "success" : ["CANCELLED", "DECLINED"].includes(status) ? "danger" : status === "ON_HOLD" ? "warning" : "neutral");

export default async function SiteDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  assertCapability(session, "sales.site.read");
  const organisationId = session.organisationId;
  const site = await getSite(organisationId, projectId);
  if (!site) notFound();
  const manage = can(session, "sales.site.manage"), seeQuotes = can(session, "sales.quote.read"), seeOrders = can(session, "sales.order.read");
  const partyId = site.party?.id ?? "";
  const mine = partyId ? { OR: [{ partyId }, { pricingPartyId: partyId }] } : {};
  const [parties, quotes, orders, members] = await Promise.all([
    manage ? db.party.findMany({ where: { organisationId }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" } }) : [],
    manage && seeQuotes ? db.quote.findMany({ where: { organisationId, projectId: null, ...mine }, select: { id: true, reference: true, totalAmount: true, totalCurrency: true, status: true }, orderBy: { createdAt: "desc" }, take: 200 }) : [],
    manage && seeOrders ? db.salesOrder.findMany({ where: { organisationId, projectId: null, commercialStatus: { not: "CANCELLED" }, ...mine }, select: { id: true, reference: true, grossAmount: true, currency: true, commercialStatus: true }, orderBy: { createdAt: "desc" }, take: 200 }) : [],
    site.members.length ? db.user.findMany({ where: { id: { in: site.members.map((member) => member.userId) } }, select: { id: true, name: true } }) : [],
  ]);
  const currency = site.quotes[0]?.totalCurrency ?? site.salesOrders[0]?.currency ?? "GBP";
  const quoted = site.quotes.filter((quote) => quote.status !== "DECLINED").reduce((sum, quote) => sum + quote.totalAmount, 0);
  const ordered = site.salesOrders.reduce((sum, order) => sum + order.grossAmount, 0);
  const next = `projectId=${site.id}${partyId ? `&customer=${partyId}` : ""}`;
  const hidden = <input type="hidden" name="siteId" value={site.id} />;

  return <div className="space-y-5">
    <Link href="/sales/sites" className="text-xs text-slate-500">← All sites</Link>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{site.reference}{site.opportunity ? ` · from ${site.opportunity.name}` : ""}</p>
        <h2 className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight">{site.name}<StatusPill label={word(site.status)} tone={tone(site.status)} /></h2>
        <p className="mt-2 text-sm text-slate-500">{site.party ? <Link href={`/customers/${site.party.id}`} className="text-blue-700">{site.party.name}</Link> : "No customer"} · {day(site.startAt)} to {day(site.targetAt)}</p>
        {site.notes && <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-slate-600">{site.notes}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {can(session, "sales.quote.create") && <Link href={`/sales/quotes/new?${next}`} className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">New quotation</Link>}
        {can(session, "sales.order.create") && <Link href={`/sales/orders/new?type=project&${next}`} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">New order</Link>}
        {manage && <CreateDialog label="Edit site" title="Edit site" variant="secondary"><ActionForm action={saveSiteAction}><div className="space-y-4">
          {hidden}
          <label className="block text-xs font-medium">Site name<input name="name" required maxLength={200} defaultValue={site.name} className={field} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium">Customer<select name="partyId" required defaultValue={partyId} className={field}><option value="">Choose a customer</option>{parties.map((party) => <option key={party.id} value={party.id}>{party.customerCode} · {party.name}</option>)}</select></label>
            <label className="block text-xs font-medium">Status<select name="status" defaultValue={STATUSES.includes(site.status) ? site.status : "PLANNED"} className={field}>{STATUSES.map((status) => <option key={status} value={status}>{word(status)}</option>)}</select></label>
            <label className="block text-xs font-medium">Start<input name="startAt" type="date" defaultValue={iso(site.startAt)} className={field} /></label>
            <label className="block text-xs font-medium">Target finish<input name="targetAt" type="date" defaultValue={iso(site.targetAt)} className={field} /></label>
          </div>
          <label className="block text-xs font-medium">Notes<textarea name="notes" rows={4} maxLength={5000} defaultValue={site.notes ?? ""} className={field} /></label>
          <Button type="submit" variant="primary">Save site</Button>
        </div></ActionForm></CreateDialog>}
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <figure className={panel}><figcaption className="text-xs text-slate-500">Quoted</figcaption><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(quoted, currency)}</p><p className="mt-2 text-xs text-slate-500">{site.quotes.length} quotation{site.quotes.length === 1 ? "" : "s"}</p></figure>
      <figure className={panel}><figcaption className="text-xs text-slate-500">Ordered</figcaption><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(ordered, currency)}</p><p className="mt-2 text-xs text-slate-500">{site.salesOrders.length} order{site.salesOrders.length === 1 ? "" : "s"}</p></figure>
      <figure className={panel}><figcaption className="text-xs text-slate-500">Call-off agreements</figcaption><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{site.agreements.length}</p><p className="mt-2 text-xs text-slate-500">{site.agreements.map((agreement) => agreement.reference).join(" · ") || "None open"}</p></figure>
    </div>

    {seeQuotes && <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Quotations</h3><p className="mt-1 text-xs text-slate-500">Every quotation issued against this site.</p></div>
        {manage && <CreateDialog label="Add existing quotation" title="Add an existing quotation" variant="secondary"><ActionForm action={setDocumentSiteAction}><div className="space-y-4">
          {hidden}<input type="hidden" name="kind" value="quote" />
          <label className="block text-xs font-medium">Quotation<select name="documentId" required className={field}><option value="">{quotes.length ? "Choose a quotation" : "No quotations for this customer are free to add"}</option>{quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.reference} · {word(quote.status)} · {formatMoney(quote.totalAmount, quote.totalCurrency)}</option>)}</select></label>
          <p className="text-xs text-slate-500">Only this customer&apos;s quotations that are not already on a site are listed.</p>
          <Button type="submit" variant="primary">Add to site</Button>
        </div></ActionForm></CreateDialog>}
      </div>
      {!site.quotes.length ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No quotations on this site yet.</p> : <ul className="mt-4 divide-y divide-slate-100">{site.quotes.map((quote) => <li key={quote.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <span><Link href={`/sales/quotes/${quote.id}`} className="text-sm font-medium text-blue-700">{quote.reference}</Link><span className="ml-2 text-xs text-slate-400">{quote.kind === "BLANKET" ? "Call-off" : "Standard"} · {day(quote.createdAt)}{quote.expiryDate ? ` · valid to ${day(quote.expiryDate)}` : ""}</span></span>
        <span className="flex items-center gap-3"><StatusPill label={word(quote.status)} tone={tone(quote.status)} /><span className="text-sm font-semibold tabular-nums">{formatMoney(quote.totalAmount, quote.totalCurrency)}</span>
          {manage && <ActionForm action={setDocumentSiteAction}><input type="hidden" name="kind" value="quote" /><input type="hidden" name="documentId" value={quote.id} /><input type="hidden" name="siteId" value="" /><button className={small}>Remove</button></ActionForm>}</span>
      </li>)}</ul>}
    </section>}

    {seeOrders && <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Sales orders</h3><p className="mt-1 text-xs text-slate-500">An order made from a site quotation is added automatically.</p></div>
        {manage && <CreateDialog label="Add existing order" title="Add an existing sales order" variant="secondary"><ActionForm action={setDocumentSiteAction}><div className="space-y-4">
          {hidden}<input type="hidden" name="kind" value="order" />
          <label className="block text-xs font-medium">Sales order<select name="documentId" required className={field}><option value="">{orders.length ? "Choose an order" : "No orders for this customer are free to add"}</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.reference} · {word(order.commercialStatus)} · {formatMoney(order.grossAmount, order.currency)}</option>)}</select></label>
          <Button type="submit" variant="primary">Add to site</Button>
        </div></ActionForm></CreateDialog>}
      </div>
      {!site.salesOrders.length ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No orders on this site yet.</p> : <ul className="mt-4 divide-y divide-slate-100">{site.salesOrders.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <span><Link href={`/sales/orders/${order.id}`} className="text-sm font-medium text-blue-700">{order.reference}</Link><span className="ml-2 text-xs text-slate-400">{day(order.createdAt)}</span></span>
        <span className="flex items-center gap-3"><StatusPill label={word(order.commercialStatus)} tone={tone(order.commercialStatus)} /><span className="text-sm font-semibold tabular-nums">{formatMoney(order.grossAmount, order.currency)}</span>
          {manage && <ActionForm action={setDocumentSiteAction}><input type="hidden" name="kind" value="order" /><input type="hidden" name="documentId" value={order.id} /><input type="hidden" name="siteId" value="" /><button className={small}>Remove</button></ActionForm>}</span>
      </li>)}</ul>}
    </section>}

    {!!members.length && <section className={panel}><h3 className="text-sm font-semibold">Team</h3><div className="mt-3 flex flex-wrap gap-2">{members.map((member) => <span key={member.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{member.name}</span>)}</div></section>}
  </div>;
}
