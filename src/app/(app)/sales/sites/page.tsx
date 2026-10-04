import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { listSites } from "@/modules/sales/services/sites";
import { formatMoney } from "@/core/shared/money";

export default async function SitesPage() {
  const session = await requireSession();
  assertCapability(session, "sales.site.read");
  const sites = await listSites(session.organisationId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Sites</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Big commercial projects — construction sites, major engagements — that
            accumulate multiple quotes over time. Each site groups all the work you
            do for one location.
          </p>
        </div>
        {can(session, "sales.site.manage") && (
          <Link
            href="/sales/sites/new"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            + New site
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {sites.map((site) => {
          const totalQuoted = site.quotes.reduce((sum, q) => sum + q.totalAmount, 0);
          return (
            <Link
              key={site.id}
              href={`/sales/sites/${site.id}`}
              className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center"
            >
              <div>
                <span className="font-medium">{site.name}</span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {site.reference} · {site.party?.name ?? "—"}
                </span>
              </div>
              <div className="text-sm text-slate-500">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
                  {site.status.replaceAll("_", " ")}
                </span>
                {site.opportunity && (
                  <span className="ml-2 text-xs text-slate-400">
                    from {site.opportunity.name}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-500">
                {site.quotes.length} quote{site.quotes.length !== 1 ? "s" : ""}
                {site._count.salesOrders > 0 && (
                  <span> · {site._count.salesOrders} order{site._count.salesOrders !== 1 ? "s" : ""}</span>
                )}
              </div>
              <div className="text-right text-sm font-medium">
                {totalQuoted > 0 ? formatMoney(totalQuoted, "GBP") : "—"}
              </div>
            </Link>
          );
        })}
        {!sites.length && (
          <p className="p-6 text-sm text-slate-500">
            No sites yet. Create a site to group multiple quotes for a big project
            or location.
          </p>
        )}
      </div>
    </div>
  );
}
