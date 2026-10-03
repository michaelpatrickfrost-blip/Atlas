import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listOpportunities } from "@/modules/sales/services/queries";
import { formatMoney } from "@/core/shared/money";
import { EmptyState } from "@/components/ui/empty-state";
import type { OpportunityStage } from "@/generated/prisma/client";

const STAGES: { key: OpportunityStage; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "PROPOSAL", label: "Proposal" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];

export default async function PipelinePage() {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityRead);

  const opportunities = await listOpportunities(session.organisationId);

  if (opportunities.length === 0) {
    return <EmptyState title="No opportunities yet." description="Opportunities you create will appear here, grouped by stage." />;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const items = opportunities.filter((opportunity) => opportunity.stage === stage.key);
        return (
          <div key={stage.key} className="flex w-64 shrink-0 flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-[var(--color-ink-muted)]">{stage.label}</span>
              <span className="text-xs text-[var(--color-ink-faint)]">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((opportunity) => (
                <div key={opportunity.id} className="rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)]">{opportunity.name}</p>
                  <p className="truncate text-xs text-[var(--color-ink-muted)]">{opportunity.party.name}</p>
                  <p className="mt-2 text-sm text-[var(--color-ink)]">{formatMoney(opportunity.valueAmount, opportunity.valueCurrency)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
