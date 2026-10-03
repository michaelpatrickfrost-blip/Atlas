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

  const opportunities = await db.opportunity.findMany({
    where: { organisationId: session.organisationId, status: "OPEN" },
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
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Forecast</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Organisation-wide, open opportunities by forecast category.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {byCategory.map((category) => (
          <Card key={category.key} className="p-4">
            <p className="text-xl font-semibold text-[var(--color-ink)]">{formatMoney(category.total, "GBP")}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{category.label}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{category.items.length} opportunities</p>
          </Card>
        ))}
      </div>

      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">Commit + Closed</p>
          <p className="text-xl font-semibold text-[var(--color-ink)]">{formatMoney(commitPlusClosed, "GBP")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--color-ink-muted)]">Stage-weighted pipeline</p>
          <p className="text-xl font-semibold text-[var(--color-ink)]">{formatMoney(totalWeighted, "GBP")}</p>
        </div>
      </Card>

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
