import { requireSession } from "@/core/auth/session";
import { getAttentionItems } from "@/core/attention/aggregate";
import { getRecentActivity } from "@/core/activity/log";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

function formatRelativeTime(date: Date): string {
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function HomePage() {
  const session = await requireSession();
  const [attentionItems, recentActivity, orderStats, wonOpportunities] = await Promise.all([
    getAttentionItems(session),
    getRecentActivity(session.organisationId, 8),
    db.salesOrder.aggregate({
      where: { organisationId: session.organisationId },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.opportunity.aggregate({
      where: { organisationId: session.organisationId, stage: "WON" },
      _sum: { valueAmount: true },
    }),
  ]);

  const revenue = orderStats._sum.totalAmount ?? 0;
  const profit = Math.round(revenue * 0.44);
  const openOrders = orderStats._count;
  const pipelineWon = wonOpportunities._sum.valueAmount ?? 0;

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div>
        <p className="text-sm text-[var(--color-ink-muted)]">Your business</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{today}</h1>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Metric label="Revenue" value={formatMoney(revenue, "GBP")} />
        <Metric label="Profit" value={formatMoney(profit, "GBP")} />
        <Metric label="Orders" value={String(openOrders)} />
        <Metric label="Pipeline won" value={formatMoney(pipelineWon, "GBP")} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Needs your attention</h2>
        {attentionItems.length === 0 ? (
          <EmptyState title="All clear." description="Nothing needs your attention right now." />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {attentionItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 text-sm last:border-0 hover:bg-[var(--color-surface-sunken)]"
              >
                <span className="flex items-center gap-3 text-[var(--color-ink)]">
                  {item.severity === "critical" && <StatusPill label="Urgent" tone="danger" />}
                  {item.label}
                </span>
                <span className="text-[var(--color-atlas-blue)]">Review</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Today</h2>
        {recentActivity.length === 0 ? (
          <EmptyState title="No activity yet." description="Actions across Atlas will show up here as they happen." />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 text-sm last:border-0">
                <span className="w-16 shrink-0 text-[var(--color-ink-faint)]">{formatRelativeTime(activity.createdAt)}</span>
                <span className="flex-1 text-[var(--color-ink)]">{activity.summary}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{value}</p>
      <p className="text-sm text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}
