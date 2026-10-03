import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listOpportunities } from "@/modules/sales/services/opportunities-queries";
import { listPipelines, getDefaultPipeline } from "@/modules/sales/services/pipelines";
import { formatMoney } from "@/core/shared/money";
import { EmptyState } from "@/components/ui/empty-state";
import { MoveStageSelect } from "@/app/(app)/sales/pipeline/move-stage-select";

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ pipeline?: string }> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityRead);

  const { pipeline: pipelineParam } = await searchParams;
  const [pipelines, defaultPipeline] = await Promise.all([
    listPipelines(session.organisationId),
    getDefaultPipeline(session.organisationId),
  ]);

  const activePipeline = (pipelineParam ? pipelines.find((p) => p.id === pipelineParam) : null) ?? defaultPipeline;

  if (!activePipeline) {
    return <EmptyState title="No sales pipeline configured yet." description="An administrator needs to set up a pipeline before opportunities can be tracked." />;
  }

  const opportunities = await listOpportunities(session.organisationId, { pipelineId: activePipeline.id });

  return (
    <div className="flex flex-col gap-4">
      {pipelines.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto">
          {pipelines.map((pipeline) => (
            <Link
              key={pipeline.id}
              href={`/sales/pipeline?pipeline=${pipeline.id}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                pipeline.id === activePipeline.id ? "bg-[var(--color-atlas-blue-soft)] text-[var(--color-atlas-blue)]" : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
              }`}
            >
              {pipeline.name}
            </Link>
          ))}
        </div>
      )}

      {opportunities.length === 0 ? (
        <EmptyState title="No open opportunities yet." description="Opportunities you create or convert from a prospect will appear here, grouped by stage." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {activePipeline.stages.map((stage) => {
            const items = opportunities.filter((opportunity) => opportunity.stageId === stage.id);
            const stageTotal = items.reduce((sum, item) => sum + item.valueAmount, 0);
            return (
              <div key={stage.id} className="flex w-72 shrink-0 flex-col gap-2">
                <div className="flex items-baseline justify-between px-1">
                  <span className="text-sm font-medium text-[var(--color-ink-muted)]">{stage.name}</span>
                  <span className="text-xs text-[var(--color-ink-faint)]">
                    {items.length} · {formatMoney(stageTotal, "GBP")}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((opportunity) => (
                    <div key={opportunity.id} className="rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 hover:border-[var(--color-border-strong)]">
                      <Link href={`/sales/opportunities/${opportunity.id}`} className="block">
                        <p className="truncate text-sm font-medium text-[var(--color-ink)]">{opportunity.name}</p>
                        <p className="truncate text-xs text-[var(--color-ink-muted)]">{opportunity.party.name}</p>
                        <p className="mt-2 text-sm text-[var(--color-ink)]">{formatMoney(opportunity.valueAmount, opportunity.valueCurrency)}</p>
                        {opportunity.nextActionAt == null && <p className="mt-1 text-xs text-[var(--color-status-warning)]">No next action</p>}
                      </Link>
                      <div className="mt-2">
                        <MoveStageSelect opportunityId={opportunity.id} stageId={opportunity.stageId} stages={activePipeline.stages} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
