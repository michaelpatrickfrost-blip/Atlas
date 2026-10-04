import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listOpportunities } from "@/modules/crm/services/opportunities-queries";
import { listPipelines, getDefaultPipeline } from "@/modules/crm/services/pipelines";
import { can } from "@/core/permissions/check";
import { crmPushAllowed } from "@/core/permissions/manager-level";
import { crmManagerPolicy } from "@/modules/crm/services/manager-level";
import { ownerRestriction } from "@/modules/crm/services/visibility";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/core/shared/money";
import { PipelineBoard } from "./pipeline-board";

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

  const [opportunities, policy] = await Promise.all([
    listOpportunities(session.organisationId, { pipelineId: activePipeline.id, ownerUserId: ownerRestriction(session) }),
    crmManagerPolicy(session.organisationId),
  ]);
  const canPush = crmPushAllowed(policy, session.capabilities);

  const totals = opportunities.reduce<Record<string, number>>((sum, item) => {
    sum[item.valueCurrency] = (sum[item.valueCurrency] ?? 0) + item.valueAmount;
    return sum;
  }, {});
  const totalLabel = Object.entries(totals).map(([code, amount]) => formatMoney(amount, code)).join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-ink)]">Pipeline</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {opportunities.length} open {opportunities.length === 1 ? "deal" : "deals"}
            {totalLabel ? ` · ${totalLabel}` : ""}
            {policy.crm && !canPush ? " · A sales manager moves deals" : ""}
            {ownerRestriction(session) ? " · Showing your deals only" : ""}
          </p>
        </div>
        {pipelines.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {pipelines.map((pipeline) => (
              <Link
                key={pipeline.id}
                href={`/crm/pipeline?pipeline=${pipeline.id}`}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  pipeline.id === activePipeline.id ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
                }`}
              >
                {pipeline.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <PipelineBoard stages={activePipeline.stages} editable={can(session, SALES_CAPABILITIES.opportunityManage) && canPush} items={opportunities.map(item => ({id:item.id, name:item.name, stageId:item.stageId, valueAmount:item.valueAmount, valueCurrency:item.valueCurrency, party:{name:item.party.name}, nextActionAt:item.nextActionAt?.toISOString() ?? null}))} />
    </div>
  );
}
