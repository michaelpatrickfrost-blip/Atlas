import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES } from "@/core/permissions/capabilities";
import { plannedProposals, readSuggestionDetail, getLatestMrpRun } from "@/modules/manufacturing/services/mrp-queries";
import { isModuleEnabled } from "@/core/modules/runtime";
import { db } from "@/core/db/client";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { SuggestionActions } from "./suggestion-actions";

const money = (minor: number) => `£${(minor / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const whole = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 6 });
const hours = (minutes: number) => `${(minutes / 60).toFixed(1)} h`;

const COST_LABELS: Record<string, string> = {
  material: "Materials",
  machine: "Machine",
  labour: "Labour",
  overhead: "Overhead",
  subcontract: "Subcontract",
  logistics: "Logistics",
};

export default async function PlannedOrdersPage() {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planRead);

  const run = await getLatestMrpRun(session.organisationId);
  if (!run) {
    return (
      <div className="rounded-3xl border border-[var(--color-border)] bg-white px-6 py-16 text-center">
        <p className="text-sm text-[var(--color-ink-muted)]">No planning run yet. Run MRP to see what needs making.</p>
      </div>
    );
  }

  const [proposals, allSuggestions] = await Promise.all([
    plannedProposals(session.organisationId),
    db.manufacturingSupplySuggestion.findMany({ where: { organisationId: session.organisationId, runId: run.runId }, include: { product: { select: { name: true, code: true, unitOfMeasure: true } } }, orderBy: { neededBy: "asc" } }),
  ]);
  const canPurchase = ["manufacturing.plan.firm", "finance.purchase.manage", "finance.overview.read", "core.products.read", "customers.read"].every((cap) => session.capabilities.has(cap)) && await isModuleEnabled(session, "finance");
  const canViewPurchase = ["finance.purchase.read", "finance.overview.read"].every((cap) => session.capabilities.has(cap)) && await isModuleEnabled(session, "finance");
  const canFirm = session.capabilities.has(MANUFACTURING_CAPABILITIES.planFirm);
  const canManage = session.capabilities.has(MANUFACTURING_CAPABILITIES.planManage);
  const decided = allSuggestions.filter((row) => row.status !== "PENDING");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Planned orders</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">
          Each proposal shows the materials it consumes, the machines it runs on, the hours it takes and what it costs.
          Firm Make proposals into production orders; review Buy proposals as purchase drafts.
        </p>
        <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Run {run.startedAt.toLocaleString("en-GB")} · {proposals.length} awaiting a decision · {decided.length} already actioned</p>
      </header>

      {proposals.length === 0 && (
        <div className="rounded-3xl border border-[var(--color-border)] bg-white px-6 py-16 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">Nothing is short. Confirmed demand and forecast are covered by stock or open production.</p>
        </div>
      )}

      <div className="space-y-5">
        {proposals.map((proposal) => {
          const suggestion = allSuggestions.find((row) => row.id === proposal.id)!;
          const shortages = (proposal.materials ?? []).filter((row) => row.shortage > 0);
          const cost = proposal.cost;
          return (
            <Card key={proposal.id} className="overflow-hidden p-0">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
                <div>
                  <p className="text-lg font-semibold">
                    {suggestion.kind === "MAKE" ? "Make" : suggestion.kind === "BUY" ? "Buy" : "Transfer"} {whole(proposal.quantity)} {suggestion.product.unitOfMeasure ?? "each"}{" "}
                    <Link href={`/products/${proposal.productId}`} className="text-[var(--color-atlas-blue)] hover:underline">{suggestion.product.name}</Link>{" "}
                    <span className="text-[var(--color-ink-faint)]">{suggestion.product.code}</span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                    Needed {proposal.requiredDate.toLocaleDateString("en-GB")}
                    {proposal.startDate && proposal.startDate < proposal.requiredDate && <> · start by {proposal.startDate.toLocaleDateString("en-GB")}</>}
                    {proposal.batchCount ? <> · {proposal.batchCount} batch{proposal.batchCount === 1 ? "" : "es"}</> : null}
                  </p>
                  <div className="mt-1 space-y-0.5 text-xs text-[var(--color-ink-faint)]">
                    {proposal.pegging.length === 0
                      ? <p>Safety stock requirement.</p>
                      : proposal.pegging.map((peg, index) => <p key={index}>{peg.sourceLabel} · {whole(peg.demandQuantity)}</p>)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill
                    label={suggestion.kind === "BUY" ? "Purchase required" : suggestion.kind === "TRANSFER" ? "Move required" : shortages.length ? "Components short" : "Materials ready"}
                    tone={suggestion.kind !== "MAKE" || shortages.length ? "warning" : "success"}
                  />
                  <span className="text-lg font-semibold tabular-nums">{cost ? money(Object.values(cost).reduce((sum, value) => sum + value, 0)) : "—"}</span>
                </div>
              </div>

              <div className="grid gap-6 px-5 py-5 lg:grid-cols-3">
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Materials</h3>
                  <div className="mt-2 space-y-2">
                    {(proposal.materials ?? []).length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No components on this recipe.</p>}
                    {(proposal.materials ?? []).map((material, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <Link href={`/products/${material.productId}`} className="text-[var(--color-atlas-blue)] hover:underline">{material.productName ?? "Component"}</Link>
                          <span className="tabular-nums">{whole(material.quantity)}</span>
                        </div>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          On hand {whole(material.onHand)} · cover {whole(material.covered)}
                          {material.shortage > 0 && <span className="ml-1 font-semibold text-amber-700">short {whole(material.shortage)}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Machines and hours</h3>
                  <div className="mt-2 space-y-2">
                    {(proposal.operations ?? []).length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No routing on this recipe.</p>}
                    {(proposal.operations ?? []).map((operation) => (
                      <div key={operation.sequence} className="text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{operation.name}</span>
                          <span className="tabular-nums">{hours(operation.durationMinutes)}</span>
                        </div>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          {operation.resourceName ?? operation.workCentreName ?? "No machine assigned"}
                          {operation.crewSize > 1 && <> · crew {operation.crewSize}</>}
                          <> · setup {whole(operation.setupMinutes / 60)} h, run {whole(operation.runMinutes / 60)} h</>
                        </p>
                      </div>
                    ))}
                    {proposal.hours && (
                      <p className="pt-1 text-xs text-[var(--color-ink-faint)]">
                        Total {whole(proposal.hours.setup + proposal.hours.run)} machine h · {whole(proposal.hours.crew)} man-hours
                      </p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Estimated cost</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    {!cost && <p className="text-[var(--color-ink-muted)]">No costed recipe.</p>}
                    {cost && Object.entries(cost).filter(([, value]) => value > 0).map(([kind, value]) => (
                      <div key={kind} className="flex items-baseline justify-between gap-3">
                        <span className="text-[var(--color-ink-muted)]">{COST_LABELS[kind] ?? kind}</span>
                        <span className="tabular-nums">{money(value)}</span>
                      </div>
                    ))}
                    {cost && (
                      <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-[var(--color-border)] pt-2 font-semibold">
                        <span>Total</span>
                        <span className="tabular-nums">{money(Object.values(cost).reduce((sum, value) => sum + value, 0))}</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {(canFirm || canManage) && (
                <div className="flex justify-end border-t border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-5 py-3">
                  <SuggestionActions id={proposal.id!} kind={suggestion.kind} status="PENDING" canFirm={canFirm} canManage={canManage} canPurchase={canPurchase} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {decided.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Already actioned this run</h2>
          <div className="mt-3 divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
            {decided.map((suggestion) => {
              const detail = readSuggestionDetail(suggestion.pegging);
              const total = detail.cost ? Object.values(detail.cost).reduce((sum, value) => sum + value, 0) : null;
              return (
                <div key={suggestion.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 text-sm">
                  <div>
                    <span className="font-medium">{suggestion.product.name}</span>{" "}
                    <span className="text-[var(--color-ink-faint)]">{suggestion.product.code}</span> · {whole(Number(suggestion.quantity))}
                    {total != null && <span className="text-[var(--color-ink-muted)]"> · {money(total)}</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusPill label={suggestion.status} tone={suggestion.status === "FIRMED" ? "success" : "neutral"} />
                    {suggestion.resultingOrderId && (suggestion.kind === "MAKE" || suggestion.kind === "BUY" && canViewPurchase) && (
                      <Link href={suggestion.kind === "BUY" ? `/finance/documents/${suggestion.resultingOrderId}` : `/manufacturing/produce/${suggestion.resultingOrderId}`} className="text-[var(--color-atlas-blue)] hover:underline">{suggestion.kind === "BUY" ? "View purchase draft" : "View production order"}</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
