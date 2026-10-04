import Link from "next/link";
import { db } from "@/core/db/client";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { formatMoney } from "@/core/shared/money";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";

const QUOTE_STATUS_TONE: Record<string, StatusTone> = {
  DRAFT: "neutral",
  SENT: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
};

const ORDER_STATUS_TONE: Record<string, StatusTone> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  CONFIRMED: "success",
  ON_HOLD: "warning",
  CANCELLED: "danger",
  CLOSED: "neutral",
};

/** A salesperson looking at an account wants its quotes and its spend without
 *  leaving the record — this is that view, not just the linked-order counts
 *  Customer Master's generic metrics tiles give every module. */
export async function CustomerSalesHistory({ partyId, session }: { partyId: string; session: Session }) {
  const canQuotes = can(session, SALES_CAPABILITIES.quoteRead);
  const canOrders = can(session, SALES_CAPABILITIES.orderRead);
  if (!canQuotes && !canOrders) return null;

  const [quotes, orders] = await Promise.all([
    canQuotes
      ? db.quote.findMany({
          where: { organisationId: session.organisationId, partyId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, reference: true, status: true, totalAmount: true, totalCurrency: true, createdAt: true, expiryDate: true },
        })
      : [],
    canOrders
      ? db.salesOrder.findMany({
          where: { organisationId: session.organisationId, OR: [{ partyId }, { pricingPartyId: partyId }] },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, reference: true, commercialStatus: true, grossAmount: true, currency: true, createdAt: true, partyId: true },
        })
      : [],
  ]);

  const confirmed = orders.filter((o) => o.commercialStatus === "CONFIRMED" || o.commercialStatus === "CLOSED");
  const now = new Date();
  const thisYear = confirmed.filter((o) => o.createdAt.getFullYear() === now.getFullYear());
  const spendTotals = sumByCurrency(confirmed);
  const yearTotals = sumByCurrency(thisYear);

  return (
    <div className="flex flex-col gap-6">
      {canOrders && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Spend</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(yearTotals).map(([currency, amount]) => (
              <Card key={`ytd-${currency}`} className="p-4">
                <p className="truncate text-lg font-semibold text-[var(--color-ink)]">{formatMoney(amount, currency)}</p>
                <p className="truncate text-xs text-[var(--color-ink-muted)]">Spend this year ({currency})</p>
              </Card>
            ))}
            {Object.entries(spendTotals).map(([currency, amount]) => (
              <Card key={`total-${currency}`} className="p-4">
                <p className="truncate text-lg font-semibold text-[var(--color-ink)]">{formatMoney(amount, currency)}</p>
                <p className="truncate text-xs text-[var(--color-ink-muted)]">Lifetime spend ({currency})</p>
              </Card>
            ))}
            {!Object.keys(spendTotals).length && (
              <Card className="p-4 text-sm text-[var(--color-ink-muted)] sm:col-span-3">No confirmed orders yet.</Card>
            )}
          </div>

          {orders.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {orders.map((order) => {
                const tone = ORDER_STATUS_TONE[order.commercialStatus] ?? "neutral";
                return (
                  <Link key={order.id} href={`/sales/orders/${order.id}`}>
                    <Card className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm hover:border-[var(--color-atlas-blue)]/40">
                      <div>
                        <p className="font-medium text-[var(--color-ink)]">{order.reference}</p>
                        <p className="text-xs text-[var(--color-ink-muted)]">{order.createdAt.toLocaleDateString("en-GB")}{order.partyId !== partyId ? " · via linked account" : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-[var(--color-ink)]">{formatMoney(order.grossAmount, order.currency)}</span>
                        <StatusPill label={order.commercialStatus.replace("_", " ")} tone={tone} />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {canQuotes && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--color-ink-muted)]">Quotes</h2>
            {can(session, SALES_CAPABILITIES.quoteCreate) && (
              <Link href={`/sales/quotes/new?party=${partyId}`} className="text-sm font-medium text-[var(--color-atlas-blue)]">New quote</Link>
            )}
          </div>
          {quotes.length ? (
            <div className="flex flex-col gap-2">
              {quotes.map((quote) => {
                const tone = QUOTE_STATUS_TONE[quote.status] ?? "neutral";
                const expired = quote.status === "SENT" && quote.expiryDate && quote.expiryDate < now;
                return (
                  <Link key={quote.id} href={`/sales/quotes/${quote.id}`}>
                    <Card className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm hover:border-[var(--color-atlas-blue)]/40">
                      <div>
                        <p className="font-medium text-[var(--color-ink)]">{quote.reference}</p>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          {quote.createdAt.toLocaleDateString("en-GB")}
                          {quote.expiryDate ? ` · expires ${quote.expiryDate.toLocaleDateString("en-GB")}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-[var(--color-ink)]">{formatMoney(quote.totalAmount, quote.totalCurrency)}</span>
                        <StatusPill label={expired ? "Expired" : quote.status} tone={expired ? "danger" : tone} />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No quotes yet for this account." />
          )}
        </section>
      )}
    </div>
  );
}

function sumByCurrency(rows: { grossAmount: number; currency: string }[]) {
  return rows.reduce<Record<string, number>>((totals, row) => {
    totals[row.currency] = (totals[row.currency] ?? 0) + row.grossAmount;
    return totals;
  }, {});
}
