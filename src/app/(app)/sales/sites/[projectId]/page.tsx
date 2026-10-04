import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { getSite } from "@/modules/sales/services/sites";
import { formatMoney } from "@/core/shared/money";
import { db } from "@/core/db/client";
import { notFound } from "next/navigation";

export default async function SiteDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  assertCapability(session, "sales.site.read");
  const site = await getSite(session.organisationId, projectId);
  if (!site) notFound();

  const memberNames = site.members.length
    ? await db.user.findMany({
        where: { id: { in: site.members.map((m) => m.userId) } },
        select: { id: true, name: true },
      })
    : [];
  const memberMap = new Map(memberNames.map((u) => [u.id, u.name]));

  const totalQuoted = site.quotes.reduce((sum, q) => sum + q.totalAmount, 0);
  const totalOrdered = site.salesOrders.reduce((sum, o) => sum + o.grossAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sales/sites" className="text-sm text-slate-400 hover:text-blue-600">
          ← Back to Sites
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">{site.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {site.reference} · {site.party?.name ?? "No customer"}
              {site.opportunity && <span> · from {site.opportunity.name}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              {site.status.replaceAll("_", " ")}
            </span>
            {can(session, "sales.quote.create") && (
              <Link
                href={`/sales/quotes/new?projectId=${site.id}`}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + New quote for this site
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Quotes</p>
          <p className="mt-1 text-2xl font-semibold">{site.quotes.length}</p>
          <p className="mt-0.5 text-xs text-slate-500">{formatMoney(totalQuoted, "GBP")} total quoted</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Orders</p>
          <p className="mt-1 text-2xl font-semibold">{site.salesOrders.length}</p>
          <p className="mt-0.5 text-xs text-slate-500">{formatMoney(totalOrdered, "GBP")} total ordered</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Timeline</p>
          <p className="mt-1 text-sm text-slate-700">
            {site.startAt ? site.startAt.toLocaleDateString("en-GB") : "No start"}
            {site.targetAt ? ` → ${site.targetAt.toLocaleDateString("en-GB")}` : ""}
          </p>
        </div>
      </div>

      {site.notes && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Notes</p>
          <p className="mt-1 text-sm text-slate-700">{site.notes}</p>
        </div>
      )}

      {/* Quotes */}
      <div>
        <h3 className="text-lg font-semibold">Quotes</h3>
        <p className="mt-1 text-xs text-slate-500">All quotes issued against this site.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {site.quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/sales/quotes/${quote.id}`}
              className="grid gap-2 border-b border-slate-100 px-5 py-3.5 last:border-0 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center"
            >
              <div>
                <span className="font-medium">{quote.reference}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {quote.kind === "BLANKET" ? "Blanket" : "Standard"}
                </span>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium text-blue-700">
                {quote.status.replaceAll("_", " ")}
              </span>
              <span className="text-sm text-slate-500">
                {quote.createdAt.toLocaleDateString("en-GB")}
                {quote.expiryDate && <span> · exp {quote.expiryDate.toLocaleDateString("en-GB")}</span>}
              </span>
              <span className="text-right text-sm font-medium">
                {formatMoney(quote.totalAmount, quote.totalCurrency)}
              </span>
            </Link>
          ))}
          {!site.quotes.length && (
            <p className="p-5 text-sm text-slate-500">
              No quotes yet. Create a new quote and link it to this site.
            </p>
          )}
        </div>
      </div>

      {/* Orders */}
      {site.salesOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">Orders</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {site.salesOrders.map((order) => (
              <Link
                key={order.id}
                href={`/sales/orders/${order.id}`}
                className="grid gap-2 border-b border-slate-100 px-5 py-3.5 last:border-0 sm:grid-cols-[1.5fr_1fr_auto] sm:items-center"
              >
                <span className="font-medium">{order.reference}</span>
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-medium text-green-700">
                  {order.commercialStatus.replaceAll("_", " ")}
                </span>
                <span className="text-right text-sm font-medium">
                  {formatMoney(order.grossAmount, order.currency)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Team */}
      {site.members.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">Team</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {site.members.map((m) => (
              <span key={m.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {memberMap.get(m.userId) ?? m.userId}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
