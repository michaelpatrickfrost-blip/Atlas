import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { Card } from "@/components/ui/card";
import { getDefaultPipeline } from "@/modules/sales/services/pipelines";

/**
 * A lean slice of the standard report pack (§118): funnel, pipeline by
 * stage, win/loss, loss reasons. Not the full 30-report pack or a custom
 * report builder — both deferred; see docs/modules/SALES_CRM.md. These use
 * the same primitives a future report builder would (grouped aggregates over
 * Prospect/Opportunity), not bespoke one-off queries.
 */
export default async function ReportsPage() {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.reportRead);

  const [prospectCount, qualifiedCount, pipeline, wonOpportunities, lostOpportunities, lossReasonCounts] = await Promise.all([
    db.prospect.count({ where: { organisationId: session.organisationId } }),
    db.prospect.count({ where: { organisationId: session.organisationId, lifecycleStage: { in: ["QUALIFIED", "CONVERTED"] } } }),
    getDefaultPipeline(session.organisationId),
    db.opportunity.findMany({ where: { organisationId: session.organisationId, status: "WON" }, select: { valueAmount: true, valueCurrency: true } }),
    db.opportunity.findMany({ where: { organisationId: session.organisationId, status: "LOST" }, select: { valueAmount: true, valueCurrency: true, lossReason: { select: { label: true } } } }),
    db.opportunity.groupBy({ by: ["lossReasonId"], where: { organisationId: session.organisationId, status: "LOST", lossReasonId: { not: null } }, _count: true }),
  ]);

  const opportunityCount = (wonOpportunities.length + lostOpportunities.length) || 1;
  const wonCount = wonOpportunities.length;
  const wonValue = wonOpportunities.reduce((sum, o) => sum + o.valueAmount, 0);
  const lostValue = lostOpportunities.reduce((sum, o) => sum + o.valueAmount, 0);
  const winRate = Math.round((wonCount / opportunityCount) * 100);

  const openByStage = pipeline
    ? await db.opportunity.groupBy({
        by: ["stageId"],
        where: { organisationId: session.organisationId, status: "OPEN", pipelineId: pipeline.id },
        _count: true,
        _sum: { valueAmount: true },
      })
    : [];

  const lossReasonLabels = await db.lossReason.findMany({ where: { organisationId: session.organisationId } });
  const lossReasonMap = new Map(lossReasonLabels.map((reason) => [reason.id, reason.label]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Reports</h1>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Funnel</h2>
        <Card className="flex flex-col divide-y divide-[var(--color-border)] p-0">
          <FunnelRow label="Prospects" count={prospectCount} of={prospectCount} />
          <FunnelRow label="Qualified / converted" count={qualifiedCount} of={prospectCount} />
          <FunnelRow label="Won" count={wonCount} of={prospectCount} />
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Pipeline by stage</h2>
        {pipeline && openByStage.length > 0 ? (
          <Card className="flex flex-col divide-y divide-[var(--color-border)]">
            {pipeline.stages.map((stage) => {
              const row = openByStage.find((s) => s.stageId === stage.id);
              return (
                <div key={stage.id} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-[var(--color-ink)]">{stage.name}</span>
                  <span className="text-[var(--color-ink-muted)]">{row?._count ?? 0} opportunities</span>
                  <span className="text-[var(--color-ink)]">{formatMoney(row?._sum.valueAmount ?? 0, "GBP")}</span>
                </div>
              );
            })}
          </Card>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">No open pipeline yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Win / loss</h2>
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xl font-semibold text-[var(--color-ink)]">{winRate}%</p>
            <p className="text-sm text-[var(--color-ink-muted)]">Win rate ({wonCount + lostOpportunities.length} closed)</p>
          </Card>
          <Card className="p-4">
            <p className="text-xl font-semibold text-[var(--color-ink)]">{formatMoney(wonValue, "GBP")}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">Won value</p>
          </Card>
          <Card className="p-4">
            <p className="text-xl font-semibold text-[var(--color-ink)]">{formatMoney(lostValue, "GBP")}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">Lost value</p>
          </Card>
        </div>
      </section>

      {lossReasonCounts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Loss reasons</h2>
          <Card className="flex flex-col divide-y divide-[var(--color-border)]">
            {lossReasonCounts.map((row) => (
              <div key={row.lossReasonId} className="flex items-center justify-between p-3 text-sm">
                <span className="text-[var(--color-ink)]">{row.lossReasonId ? lossReasonMap.get(row.lossReasonId) : "Unspecified"}</span>
                <span className="text-[var(--color-ink-muted)]">{row._count}</span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function FunnelRow({ label, count, of }: { label: string; count: number; of: number }) {
  const pct = of > 0 ? Math.round((count / of) * 100) : 0;
  return (
    <div className="flex items-center justify-between p-3 text-sm">
      <span className="text-[var(--color-ink)]">{label}</span>
      <span className="text-[var(--color-ink-muted)]">
        {count} · {pct}%
      </span>
    </div>
  );
}
