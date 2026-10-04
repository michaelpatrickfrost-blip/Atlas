import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { projectScope } from "@/core/permissions/work-access";
import { db } from "@/core/db/client";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { formatMoney } from "@/core/shared/money";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { commitmentView } from "@/modules/sales/services/call-off-balance";
import { deliverAndInvoiceCallOff, invoiceCallOffDelivery } from "@/modules/sales/services/commercial";
import { CommercialLinks } from "@/modules/sales/components/commercial-links";
import { EchoRail } from "@/modules/audit/components/echo-rail";

export default async function AgreementPage({ params, searchParams }: { params: Promise<{ agreementId: string }>; searchParams: Promise<{ echo?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "sales.order.read");
  const { agreementId } = await params;
  const echo = (await searchParams).echo === "1";
  const agreement = await db.salesAgreement.findFirst({
    where: { id: agreementId, organisationId: session.organisationId },
    include: { party: true, project: true, opportunity: true, quote: true, lines: { orderBy: { lineNumber: "asc" }, include: { product: true } }, callOffs: { include: { lines: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!agreement) notFound();
  const liveOrders = agreement.callOffs.filter((order) => order.commercialStatus !== "CANCELLED");
  const open = commitmentView(agreement.lines, liveOrders);
  const delivered = commitmentView(agreement.lines, agreement.callOffs.filter((order) => order.commercialStatus === "CONFIRMED"));
  const orderIds = liveOrders.map((order) => order.id);
  const [projects, invoices, financeOn, books] = await Promise.all([
    can(session, "projects.read") ? db.project.findMany({ where: { AND: [projectScope(session), { partyId: agreement.partyId }] }, select: { id: true, name: true } }) : Promise.resolve([]),
    orderIds.length ? db.financeDocument.findMany({ where: { organisationId: session.organisationId, kind: "AR_INVOICE", status: { not: "CANCELLED" }, salesOrderId: { in: orderIds } }, select: { id: true, reference: true, status: true, documentDate: true, salesOrderId: true, lines: { select: { salesOrderLineId: true, quantity: true } } }, orderBy: { documentDate: "desc" } }) : Promise.resolve([]),
    getEnabledModuleIds(session.organisationId).then((ids) => ids.has("finance")),
    db.financeEntity.findFirst({ where: { organisationId: session.organisationId, currency: agreement.currency }, select: { id: true } }),
  ]);
  const orderLineToAgreement = new Map(liveOrders.flatMap((order) => order.lines.flatMap((line) => line.agreementLineId ? [[line.id, line.agreementLineId] as const] : [])));
  const invoiced = new Map<string, number>();
  for (const invoice of invoices) for (const line of invoice.lines) {
    const key = line.salesOrderLineId ? orderLineToAgreement.get(line.salesOrderLineId) : undefined;
    if (key) invoiced.set(key, (invoiced.get(key) ?? 0) + Number(String(line.quantity)));
  }
  const canDeliver = can(session, "sales.order.create") && can(session, "sales.order.confirm") && agreement.status === "ACTIVE";
  const seeFinance = can(session, "finance.receivables.read");
  const remaining = agreement.lines.reduce((sum, line) => sum + (open.get(line.id)?.remaining ?? 0), 0);
  return <div className="space-y-5">
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <Link href="/sales/agreements" className="text-sm text-slate-500">← Call-offs</Link>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.16em] text-blue-600">Call-off order · {agreement.status} · until {agreement.endsAt.toLocaleDateString("en-GB")}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h2 className="text-3xl font-semibold tracking-tight">{agreement.reference}</h2>{can(session, "echo.read") && <EchoRail entityType="SalesAgreement" entityId={agreement.id} title={agreement.reference} canWrite={can(session, "echo.write")} startOpen={echo} />}</div>
      <Link href={`/customers/${agreement.partyId}`} className="mt-3 inline-block text-sm text-blue-600">{agreement.party.name} →</Link>
      <p className="mt-3 max-w-2xl text-sm text-slate-500">This is the full order. Each delivery takes some of the items and raises an invoice for that quantity. {remaining} still open.</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
        {agreement.quote && <Link className="text-blue-600" href={`/sales/quotes/${agreement.quote.id}`}>Quotation {agreement.quote.reference}</Link>}
        {agreement.opportunity && can(session, "sales.opportunity.read") && <Link className="text-blue-600" href={`/crm/opportunities/${agreement.opportunity.id}`}>{agreement.opportunity.name}</Link>}
        {agreement.customerPoReference && <span>Customer PO {agreement.customerPoReference}</span>}
      </div>
    </div>
    <CommercialLinks target="agreement" recordId={agreement.id} partyId={agreement.partyId} opportunityId={agreement.opportunityId} project={agreement.project} projects={projects} canLink={can(session, "projects.manage") || can(session, "projects.read")} />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-semibold">On this order</h3></div>
      <div className="hidden grid-cols-[1.4fr_repeat(5,auto)] gap-3 border-b border-slate-100 px-5 py-2 text-xs text-slate-400 sm:grid"><span>Item</span><span>Price</span><span>Ordered</span><span>Delivered</span><span>Invoiced</span><span>Still open</span></div>
      {agreement.lines.map((line) => {
        const slot = open.get(line.id);
        return <div key={line.id} className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1.4fr_repeat(5,auto)] sm:items-center">
          <span className="font-medium">{line.product?.code ? `${line.product.code} · ` : ""}{line.description}</span>
          <span className="text-sm text-slate-500">{formatMoney(line.unitPriceAmount, agreement.currency)}</span>
          <span className="text-sm">{line.committedQuantity} {line.unitOfMeasure}</span>
          <span className="text-sm">{delivered.get(line.id)?.released ?? 0}</span>
          <span className="text-sm">{invoiced.get(line.id) ?? 0}</span>
          <span className="text-sm font-medium">{slot?.remaining ?? line.committedQuantity}</span>
        </div>;
      })}
    </section>
    {canDeliver && remaining > 0 && !books && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">{financeOn ? <>Set up finance books in {agreement.currency} before a quantity can be delivered and invoiced. {can(session, "finance.overview.read") && <Link href="/finance" className="font-medium underline">Open Finance</Link>}</> : "Turn on Finance before a quantity can be delivered and invoiced."}</p>}
    {canDeliver && remaining > 0 && <ActionForm action={deliverAndInvoiceCallOff} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <input type="hidden" name="agreementId" value={agreement.id} />
      <input type="hidden" name="opportunityId" value={agreement.opportunityId ?? ""} />
      <div><h3 className="text-sm font-semibold">Deliver and invoice this time</h3><p className="mt-1 text-xs text-slate-500">Enter only the quantity going out now. The invoice is a draft for that quantity, dated on the delivery. The rest of the order stays open.</p></div>
      {agreement.lines.map((line) => {
        const left = open.get(line.id)?.remaining ?? 0;
        if (left <= 0) return null;
        return <label key={line.id} className="grid gap-2 text-sm sm:grid-cols-[1fr_8rem] sm:items-center">{line.description}<input name={`qty:${line.id}`} type="number" min={0} max={left} defaultValue={0} className="rounded-xl border border-slate-200 px-3 py-2" /></label>;
      })}
      <label className="block text-xs text-slate-500">Delivery date<input type="date" name="requestedDeliveryDate" required className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
      <Button type="submit" variant="primary">Deliver and invoice</Button>
    </ActionForm>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold">Deliveries</h3>
      <div className="mt-3 space-y-3">{agreement.callOffs.map((order) => {
        const docs = invoices.filter((invoice) => invoice.salesOrderId === order.id);
        return <div key={order.id} className="text-sm">
          <Link href={`/sales/orders/${order.id}`} className="text-blue-600">{order.reference}</Link>
          <span className="text-slate-500"> · {order.commercialStatus.replaceAll("_", " ")}{order.requestedDeliveryDate ? ` · ${order.requestedDeliveryDate.toLocaleDateString("en-GB")}` : ""} · {order.lines.reduce((sum, line) => sum + line.orderedQuantity - line.cancelledQuantity, 0)} items</span>
          <div className="mt-1 flex flex-wrap items-center gap-3">{docs.map((invoice) => seeFinance ? <Link key={invoice.id} href={`/finance/documents/${invoice.id}`} className="text-emerald-700">{invoice.reference} · {invoice.documentDate.toLocaleDateString("en-GB")} · {invoice.status}</Link> : <span key={invoice.id} className="text-slate-600">{invoice.reference} · {invoice.status}</span>)}{!docs.length && order.commercialStatus === "CONFIRMED" && books && can(session, "sales.order.confirm") && <ActionForm action={invoiceCallOffDelivery} className="flex flex-wrap items-center gap-3"><input type="hidden" name="orderId" value={order.id} /><Button type="submit">Raise the invoice</Button></ActionForm>}{!docs.length && order.commercialStatus === "CONFIRMED" && !books && <span className="text-slate-400">No invoice yet. Finance books in {agreement.currency} are required.</span>}</div>
        </div>;
      })}{!agreement.callOffs.length && <p className="text-sm text-slate-400">Nothing has been delivered yet.</p>}</div>
    </section>
  </div>;
}
