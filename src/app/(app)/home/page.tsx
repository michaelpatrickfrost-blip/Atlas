import { TrendingUp, Wallet, ShoppingCart, Trophy } from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { getAttentionItems } from "@/core/attention/aggregate";
import { getRecentActivity } from "@/core/activity/log";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { BarChart } from "@/components/ui/bar-chart";

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
  const [attentionItems, recentActivity, orders, wonOpportunities] = await Promise.all([
    getAttentionItems(session),
    getRecentActivity(session.organisationId, 8),
    db.salesOrder.findMany({ where: { organisationId: session.organisationId }, select: { totalAmount: true, createdAt: true } }),
    db.opportunity.aggregate({
      where: { organisationId: session.organisationId, stage: "WON" },
      _sum: { valueAmount: true },
    }),
  ]);

  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const profit = Math.round(revenue * 0.44);
  const openOrders = orders.length;
  const pipelineWon = wonOpportunities._sum.valueAmount ?? 0;

  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date;
  });
  const chartPoints = months.map((date) => {
    const label = date.toLocaleDateString("en-GB", { month: "short" });
    const value = orders
      .filter((order) => order.createdAt.getMonth() === date.getMonth() && order.createdAt.getFullYear() === date.getFullYear())
      .reduce((sum, order) => sum + order.totalAmount, 0);
    return { label, value };
  });

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <p className="text-sm text-[var(--color-ink-muted)]">Your business</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-[28px]">{today}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Metric icon={TrendingUp} color="blue" label="Revenue" value={formatMoney(revenue, "GBP")} />
        <Metric icon={Wallet} color="teal" label="Profit" value={formatMoney(profit, "GBP")} />
        <Metric icon={ShoppingCart} color="violet" label="Orders" value={String(openOrders)} />
        <Metric icon={Trophy} color="amber" label="Pipeline won" value={formatMoney(pipelineWon, "GBP")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="flex flex-col gap-4 p-5 lg:col-span-3">
          <h2 className="text-sm font-medium text-[var(--color-ink-muted)]">Revenue, last 6 months</h2>
          <BarChart points={chartPoints} />
        </Card>

        <Card className="flex flex-col gap-1 p-5 lg:col-span-2">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-ink-muted)]">Needs your attention</h2>
          {attentionItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-ink-faint)]">All clear.</p>
          ) : (
            <div className="flex flex-col">
              {attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] py-3 text-sm first:border-0 hover:text-[var(--color-atlas-blue)]"
                >
                  <span className="flex min-w-0 items-center gap-2 text-[var(--color-ink)]">
                    {item.severity === "critical" && <StatusPill label="Urgent" tone="danger" />}
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="shrink-0 text-[var(--color-atlas-blue)]">Review</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Today</h2>
        {recentActivity.length === 0 ? (
          <EmptyState title="No activity yet." description="Actions across Atlas will show up here as they happen." />
        ) : (
          <Card className="overflow-hidden">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 text-sm last:border-0">
                <span className="w-14 shrink-0 text-[var(--color-ink-faint)]">{formatRelativeTime(activity.createdAt)}</span>
                <span className="min-w-0 flex-1 truncate text-[var(--color-ink)]">{activity.summary}</span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function Metric({
  icon,
  color,
  label,
  value,
}: {
  icon: Parameters<typeof IconChip>[0]["icon"];
  color: Parameters<typeof IconChip>[0]["color"];
  label: string;
  value: string;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <IconChip icon={icon} color={color} />
      <div className="min-w-0">
        <p className="truncate text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl">{value}</p>
        <p className="truncate text-sm text-[var(--color-ink-muted)]">{label}</p>
      </div>
    </Card>
  );
}
