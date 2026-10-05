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
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { addDealAction } from "./actions";

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
  const owner = ownerRestriction(session);
  const prospects = can(session, SALES_CAPABILITIES.prospectRead)
    ? await db.prospect.findMany({ where: { organisationId: session.organisationId, lifecycleStage: { in: ["NEW", "CONTACTED", "QUALIFIED", "NURTURE"] }, ...(owner ? { ownerUserId: owner } : {}) }, select: { id: true, companyName: true, estimatedValueAmount: true, contactFirstName: true, contactSurname: true, lifecycleStage: true, source: true, priorityScore: true, createdAt: true }, orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }], take: 200 })
    : [];
  const canAdd = can(session, SALES_CAPABILITIES.opportunityCreate) && canPush;
  const customers = canAdd ? await db.party.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" }, take: 2000 }) : [];
  const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
  const prospectStages = [["NEW", "New"], ["CONTACTED", "Contacted"], ["QUALIFIED", "Qualified"], ["NURTURE", "Nurture"]] as const;

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
        {canAdd && (
          <CreateDialog label="New deal" title="Add a deal to the pipeline">
            <ActionForm action={addDealAction}><div className="space-y-4">
              <input type="hidden" name="pipelineId" value={activePipeline.id} />
              <label className="block text-xs font-medium">Who is it for<select name="for" required className={field}><option value="">Choose a customer or prospect</option>{!!prospects.length && <optgroup label="Prospects">{prospects.map((prospect) => <option key={prospect.id} value={`prospect:${prospect.id}`}>{prospect.companyName}</option>)}</optgroup>}<optgroup label="Customers">{customers.map((customer) => <option key={customer.id} value={`party:${customer.id}`}>{customer.customerCode} · {customer.name}</option>)}</optgroup></select></label>
              <label className="block text-xs font-medium">Deal name<input name="name" maxLength={200} placeholder="Leave blank to use the company name" className={field} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium">Value (£)<input name="valueAmount" type="number" min={0} step="0.01" className={field} /></label>
                <label className="block text-xs font-medium">Expected close<input name="expectedCloseDate" type="date" className={field} /></label>
              </div>
              <p className="text-xs text-slate-500">The deal starts in {activePipeline.stages[0]?.name ?? "the first stage"}. Drag it along the board as it moves. A prospect becomes a customer record when it is added.</p>
              <div className="flex items-center gap-4"><Button type="submit" variant="primary">Add to pipeline</Button><Link href="/crm/prospect/new" className="text-xs font-medium text-blue-600">Someone new? Add a prospect →</Link></div>
            </div></ActionForm>
          </CreateDialog>
        )}
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

      {can(session, SALES_CAPABILITIES.prospectRead) && (
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">Prospects <span className="ml-1 font-normal text-[var(--color-ink-faint)]">{prospects.length}</span></h2>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Not yet a deal. Open a prospect to qualify it and turn it into an opportunity in the pipeline below.</p>
            </div>
            <div className="flex gap-4 text-xs font-medium"><Link href="/crm/prospect" className="text-[var(--color-atlas-blue)]">All prospects →</Link>{can(session, SALES_CAPABILITIES.prospectCreate) && <Link href="/crm/prospect/new" className="text-[var(--color-atlas-blue)]">New prospect →</Link>}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {prospectStages.map(([stage, label]) => {
              const cards = prospects.filter((prospect) => prospect.lifecycleStage === stage);
              return (
                <div key={stage} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3">
                  <p className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">{label} <span className="ml-1 font-normal text-[var(--color-ink-faint)]">{cards.length}</span></p>
                  <div className="mt-2 flex max-h-72 flex-col gap-2 overflow-y-auto">
                    {cards.map((prospect) => (
                      <div key={prospect.id} className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 hover:border-[var(--color-atlas-blue)]">
                        <Link href={`/crm/prospect/${prospect.id}`} className="block">
                          <p className="truncate text-sm font-medium text-[var(--color-ink)]">{prospect.companyName}</p>
                          <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">{[[prospect.contactFirstName, prospect.contactSurname].filter(Boolean).join(" "), prospect.source].filter(Boolean).join(" · ") || "No contact yet"}</p>
                        </Link>
                        {canAdd && <ActionForm action={addDealAction} className="mt-2"><input type="hidden" name="for" value={`prospect:${prospect.id}`} /><button className="rounded-lg bg-[var(--color-atlas-blue-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-atlas-blue)] hover:bg-blue-100">Add to pipeline →</button></ActionForm>}
                      </div>
                    ))}
                    {!cards.length && <p className="px-1 py-3 text-xs text-[var(--color-ink-faint)]">None</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <h2 className="-mb-2 text-sm font-semibold text-[var(--color-ink)]">Deals</h2>
      <PipelineBoard stages={activePipeline.stages} editable={can(session, SALES_CAPABILITIES.opportunityManage) && canPush} items={opportunities.map(item => ({id:item.id, name:item.name, stageId:item.stageId, valueAmount:item.valueAmount, valueCurrency:item.valueCurrency, party:{name:item.party.name}, nextActionAt:item.nextActionAt?.toISOString() ?? null}))} />
    </div>
  );
}
