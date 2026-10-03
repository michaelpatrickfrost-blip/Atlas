import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listOpportunities } from "@/modules/crm/services/opportunities-queries";
import { listPipelines, getDefaultPipeline } from "@/modules/crm/services/pipelines";
import { can } from "@/core/permissions/check";
import { EmptyState } from "@/components/ui/empty-state";
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

  const opportunities = await listOpportunities(session.organisationId, { pipelineId: activePipeline.id });

  return (
    <div className="flex flex-col gap-4">
      {pipelines.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto">
          {pipelines.map((pipeline) => (
            <Link
              key={pipeline.id}
              href={`/crm/pipeline?pipeline=${pipeline.id}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                pipeline.id === activePipeline.id ? "bg-[var(--color-atlas-blue-soft)] text-[var(--color-atlas-blue)]" : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
              }`}
            >
              {pipeline.name}
            </Link>
          ))}
        </div>
      )}

      <PipelineBoard stages={activePipeline.stages} editable={can(session, SALES_CAPABILITIES.opportunityManage)} items={opportunities.map(item => ({id:item.id, name:item.name, stageId:item.stageId, valueAmount:item.valueAmount, valueCurrency:item.valueCurrency, party:{name:item.party.name}, nextActionAt:item.nextActionAt?.toISOString() ?? null}))} />
    </div>
  );
}
