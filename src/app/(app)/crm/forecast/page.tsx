import { ownerRestriction } from "@/modules/crm/services/visibility";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

const CATEGORIES = [
  { key: "CLOSED", label: "Closed" },
  { key: "COMMIT", label: "Commit" },
  { key: "BEST_CASE", label: "Best Case" },
  { key: "PIPELINE", label: "Pipeline" },
] as const;

/**
 * Forecast (§57-61). Deliberately scoped: stage-weighted/judgement split and
 * forecast category roll-up, drill-down into every number. Deferred:
 * forecast snapshots, manager-vs-rep forecast variance, hierarchy roll-up by
 * team/territory, Goals/Quotas targets (no Goals model exists yet — see
 * docs/modules/SALES_CRM.md).
 */
export default async function ForecastPage() {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.forecastRead);

  const ownerOnly = ownerRestriction(session);
  const opportunities = await db.opportunity.findMany({
    where: { organisationId: session.organisationId, status: "OPEN", ...(ownerOnly ? { ownerUserId: ownerOnly } : {}) },
    include: { party: true, stage: true },
  });

  const byCategory = CATEGORIES.map((category) => {
    const items = opportunities.filter((o) => o.forecastCategory === category.key);
    const total = items.reduce((sum, o) => sum + o.valueAmount, 0);
    const weighted = items.reduce((sum, o) => sum + Math.round((o.valueAmount * (o.probability ?? o.stage.defaultProbability)) / 100), 0);
    return { ...category, items, total, weighted };
  });

  const commitPlusClosed = byCategory.find((c) => c.key === "COMMIT")!.total + byCategory.find((c) => c.key === "CLOSED")!.total;
  const totalWeighted = byCategory.reduce((sum, c) => sum + c.weighted, 0);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-ink)]">Forecast</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{ownerOnly ? "Your open opportunities by forecast category." : "Organisation-wide, open opportunities by forecast category."}</p>
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white sm:grid-cols-4">
        {byCategory.map((category) => (
          <div key={category.key} className="border-b border-r border-[var(--color-border)] p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">{category.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{formatMoney(category.total, "GBP")}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{category.items.length} open</p>
          </div>
        ))}
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
        <div className="bg-white p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Commit + closed</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{formatMoney(commitPlusClosed, "GBP")}</p>
        </div>
        <div className="bg-white p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Stage-weighted pipeline</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{formatMoney(totalWeighted, "GBP")}</p>
        </div>
      </div>

      {byCategory.map((category) => (
        <section key={category.key}>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">{category.label}</h2>
          {category.items.length === 0 ? (
            <EmptyState title="Nothing in this category." />
          ) : (
            <Card className="flex flex-col divide-y divide-[var(--color-border)]">
              {category.items.map((opportunity) => (
                <Link key={opportunity.id} href={`/crm/opportunities/${opportunity.id}`} className="flex items-center justify-between p-3 text-sm hover:bg-[var(--color-surface-sunken)]">
                  <span className="text-[var(--color-ink)]">{opportunity.name}</span>
                  <span className="text-[var(--color-ink-muted)]">{opportunity.party.name}</span>
                  <span className="text-[var(--color-ink)]">{formatMoney(opportunity.valueAmount, opportunity.valueCurrency)}</span>
                </Link>
              ))}
            </Card>
          )}
        </section>
      ))}
    </div>
  );
}
