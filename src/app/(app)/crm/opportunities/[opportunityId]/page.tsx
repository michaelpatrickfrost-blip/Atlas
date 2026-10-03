import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { getOpportunity } from "@/modules/crm/services/opportunities-queries";
import { listLossReasons } from "@/modules/crm/services/pipelines";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  updateValueFormAction,
  updateCloseDateFormAction,
  setNextActionFormAction,
  setForecastCategoryFormAction,
  winFormAction,
  loseFormAction,
  addStakeholderFormAction,
  addMilestoneFormAction,
  logOpportunityActivityFormAction,
} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import { MilestoneToggle } from "@/app/(app)/crm/opportunities/[opportunityId]/milestone-toggle";

const inputClass = "rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]";
const FORECAST_LABEL: Record<string, string> = { PIPELINE: "Pipeline", BEST_CASE: "Best Case", COMMIT: "Commit", CLOSED: "Closed", OMITTED: "Omitted" };
const STAKEHOLDER_ROLES = ["DECISION_MAKER", "ECONOMIC_BUYER", "CHAMPION", "TECHNICAL_BUYER", "USER", "PROCUREMENT", "LEGAL", "INFLUENCER", "BLOCKER", "OTHER"] as const;
const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "TASK", "FOLLOW_UP", "DEMO", "SITE_VISIT", "PROPOSAL", "OTHER"] as const;

export default async function OpportunityRecordPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityRead);

  const { opportunityId } = await params;
  const opportunity = await getOpportunity(session.organisationId, opportunityId);
  if (!opportunity) notFound();

  const canManage = can(session, SALES_CAPABILITIES.opportunityManage);
  const canClose = can(session, SALES_CAPABILITIES.opportunityClose);

  const [availableContacts, lossReasons, owner] = await Promise.all([
    db.contact.findMany({ where: { partyId: opportunity.partyId } }),
    listLossReasons(session.organisationId),
    db.user.findUnique({ where: { id: opportunity.ownerUserId }, select: { name: true } }),
  ]);

  const now = new Date();
  const daysInStage = Math.floor((now.getTime() - opportunity.stageEnteredAt.getTime()) / (24 * 60 * 60 * 1000));
  const needsAttention: string[] = [];
  if (!opportunity.nextActionAt) needsAttention.push("No next action booked");
  else if (opportunity.nextActionAt < now) needsAttention.push(`Next action overdue — was due ${opportunity.nextActionAt.toLocaleDateString("en-GB")}`);
  if (daysInStage > (opportunity.stage.typicalDurationDays ?? 7) * 2) needsAttention.push(`${daysInStage} days in ${opportunity.stage.name} — typically ${opportunity.stage.typicalDurationDays ?? 7} days`);
  if (opportunity.expectedCloseDate && opportunity.expectedCloseDate < now && opportunity.status === "OPEN") needsAttention.push(`Expected close date passed — ${opportunity.expectedCloseDate.toLocaleDateString("en-GB")}`);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Linked quotations</h2>{can(session,SALES_CAPABILITIES.quoteCreate) && <Link href={`/sales/quotes/new?customer=${opportunity.partyId}&opportunity=${opportunity.id}`} className="text-sm text-[var(--color-atlas-blue)]">Create quotation →</Link>}</div>{can(session,SALES_CAPABILITIES.quoteRead) ? <div className="mt-3 flex flex-wrap gap-4">{opportunity.quotes.map(q=><Link key={q.id} href={`/sales/quotes/${q.id}`} className="text-sm text-[var(--color-atlas-blue)]">{q.reference} · {q.status}</Link>)}{!opportunity.quotes.length && <p className="text-xs text-[var(--color-ink-muted)]">No quotations linked yet.</p>}</div>:<p className="mt-3 text-xs text-[var(--color-ink-muted)]">Sales access is required to view quotations.</p>}</section>
      <div className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{opportunity.name}</h1>
            <Link href={`/customers/${opportunity.partyId}`} className="text-sm text-[var(--color-atlas-blue)] hover:underline">
              {opportunity.party.name}
            </Link>
          </div>
          {opportunity.status === "OPEN" && canClose && (
            <div className="flex gap-2">
              <form action={winFormAction.bind(null, opportunity.id)}>
                <Button type="submit" variant="primary">Mark won</Button>
              </form>
              <details className="relative">
                <summary className="inline-flex cursor-pointer list-none items-center justify-center rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-ink-faint)]">
                  Mark lost
                </summary>
                <form action={loseFormAction.bind(null, opportunity.id)} className="absolute right-0 z-10 mt-2 flex w-72 flex-col gap-2 rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg">
                  <select name="lossReasonId" className={inputClass}>
                    <option value="">Loss reason...</option>
                    {lossReasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>{reason.label}</option>
                    ))}
                  </select>
                  <input name="competitor" placeholder="Competitor (optional)" className={inputClass} />
                  <textarea name="lossNotes" placeholder="Notes" rows={2} className={`${inputClass} resize-none`} />
                  <Button type="submit" variant="danger">Confirm lost</Button>
                </form>
              </details>
            </div>
          )}
          {opportunity.status !== "OPEN" && <StatusPill label={opportunity.status} tone={opportunity.status === "WON" ? "success" : "danger"} />}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <HeaderStat label={opportunity.stage.name} value={formatMoney(opportunity.valueAmount, opportunity.valueCurrency)} />
          <HeaderStat label="Expected close" value={opportunity.expectedCloseDate?.toLocaleDateString("en-GB") ?? "Not set"} />
          <HeaderStat label="Owner" value={owner?.name ?? "—"} />
          <HeaderStat label="Forecast" value={FORECAST_LABEL[opportunity.forecastCategory]} />
        </div>
      </div>

      {needsAttention.length > 0 && opportunity.status === "OPEN" && (
        <Card className="flex flex-col gap-1 border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning-soft)] p-4">
          <p className="text-sm font-medium text-[var(--color-ink)]">Needs attention</p>
          {needsAttention.map((reason) => (
            <p key={reason} className="text-sm text-[var(--color-ink-muted)]">{reason}</p>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Next step</h2>
            <Card className="p-4">
              {opportunity.nextActionNote ? (
                <>
                  <p className="text-sm text-[var(--color-ink)]">{opportunity.nextActionNote}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">{opportunity.nextActionAt?.toLocaleString("en-GB")}</p>
                </>
              ) : (
                <p className="text-sm text-[var(--color-ink-faint)]">No next step set.</p>
              )}
              {canManage && opportunity.status === "OPEN" && (
                <form action={setNextActionFormAction.bind(null, opportunity.id)} className="mt-3 flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-3">
                  <input name="nextActionNote" placeholder="Next step" required defaultValue={opportunity.nextActionNote ?? ""} className={`${inputClass} flex-1`} />
                  <input name="nextActionAt" type="datetime-local" required className={inputClass} />
                  <Button type="submit" variant="secondary">Set</Button>
                </form>
              )}
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">People</h2>
            {opportunity.stakeholders.length === 0 ? (
              <EmptyState title="No stakeholders recorded." />
            ) : (
              <Card className="flex flex-col divide-y divide-[var(--color-border)]">
                {opportunity.stakeholders.map((stakeholder) => (
                  <div key={stakeholder.id} className="flex items-center justify-between p-3">
                    <span className="text-sm text-[var(--color-ink)]">{stakeholder.contact.firstName} {stakeholder.contact.surname}</span>
                    <div className="flex flex-wrap justify-end gap-1">
                      {stakeholder.roles.map((role) => (
                        <StatusPill key={role} label={role.replace(/_/g, " ")} tone="neutral" />
                      ))}
                    </div>
                  </div>
                ))}
              </Card>
            )}
            {canManage && availableContacts.length > 0 && (
              <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Add stakeholder</summary>
                <form action={addStakeholderFormAction.bind(null, opportunity.id)} className="mt-3 flex flex-col gap-3">
                  <select name="contactId" required className={inputClass}>
                    {availableContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>{contact.firstName} {contact.surname}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-3">
                    {STAKEHOLDER_ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                        <input type="checkbox" name="roles" value={role} />
                        {role.replace(/_/g, " ")}
                      </label>
                    ))}
                  </div>
                  <Button type="submit" variant="primary" className="self-start">Add</Button>
                </form>
              </details>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Deal plan</h2>
            {opportunity.milestones.length === 0 ? (
              <EmptyState title="No milestones yet." />
            ) : (
              <Card className="flex flex-col divide-y divide-[var(--color-border)]">
                {opportunity.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <MilestoneToggle milestoneId={milestone.id} opportunityId={opportunity.id} done={milestone.status === "DONE"} disabled={!canManage} />
                      <span className={`text-sm ${milestone.status === "DONE" ? "text-[var(--color-ink-faint)] line-through" : "text-[var(--color-ink)]"}`}>{milestone.label}</span>
                    </div>
                    {milestone.dueDate && <span className="text-xs text-[var(--color-ink-faint)]">{milestone.dueDate.toLocaleDateString("en-GB")}</span>}
                  </div>
                ))}
              </Card>
            )}
            {canManage && (
              <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Add milestone</summary>
                <form action={addMilestoneFormAction.bind(null, opportunity.id)} className="mt-3 flex flex-wrap items-end gap-3">
                  <input name="label" placeholder="Milestone" required className={`${inputClass} flex-1`} />
                  <input name="dueDate" type="date" className={inputClass} />
                  <Button type="submit" variant="primary">Add</Button>
                </form>
              </details>
            )}
          </section>

          {canManage && opportunity.status === "OPEN" && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Log activity</h2>
              <form action={logOpportunityActivityFormAction.bind(null, opportunity.id, opportunity.partyId)} className="flex flex-col gap-3 rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="grid grid-cols-2 gap-3">
                  <select name="type" defaultValue="CALL" className={inputClass}>
                    {ACTIVITY_TYPES.map((type) => (
                      <option key={type} value={type}>{type.replace("_", " ")}</option>
                    ))}
                  </select>
                  <input name="subject" placeholder="Subject" required className={inputClass} />
                </div>
                <textarea name="notes" rows={2} placeholder="Notes..." className={`${inputClass} resize-none`} />
                <Button type="submit" variant="secondary" className="self-start">Log activity</Button>
              </form>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Activity</h2>
            {opportunity.activities.length === 0 ? (
              <EmptyState title="No activity logged yet." />
            ) : (
              <div className="flex flex-col">
                {opportunity.activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 border-b border-[var(--color-border)] py-3 text-sm last:border-0">
                    <span className="w-28 shrink-0 text-[var(--color-ink-faint)]">{activity.createdAt.toLocaleDateString("en-GB")}</span>
                    <p className="text-[var(--color-ink)]">{activity.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {canManage && opportunity.status === "OPEN" && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Edit</h2>
              <Card className="flex flex-col gap-4 p-4">
                <form action={updateValueFormAction.bind(null, opportunity.id)} className="flex flex-col gap-2">
                  <label className="text-xs text-[var(--color-ink-muted)]">Value (£)</label>
                  <div className="flex gap-2">
                    <input name="valueAmount" type="number" step="0.01" min="0" defaultValue={opportunity.valueAmount / 100} className={inputClass} />
                    <Button type="submit" variant="secondary">Set</Button>
                  </div>
                </form>
                <form action={updateCloseDateFormAction.bind(null, opportunity.id)} className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
                  <label className="text-xs text-[var(--color-ink-muted)]">Expected close date</label>
                  <div className="flex gap-2">
                    <input name="expectedCloseDate" type="date" defaultValue={opportunity.expectedCloseDate?.toISOString().slice(0, 10)} className={inputClass} />
                    <Button type="submit" variant="secondary">Set</Button>
                  </div>
                </form>
                <form action={setForecastCategoryFormAction.bind(null, opportunity.id)} className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
                  <label className="text-xs text-[var(--color-ink-muted)]">Forecast category</label>
                  <div className="flex gap-2">
                    <select name="forecastCategory" defaultValue={opportunity.forecastCategory} className={inputClass}>
                      {Object.entries(FORECAST_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary">Set</Button>
                  </div>
                </form>
              </Card>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">History</h2>
            {opportunity.changeEvents.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)]">No changes recorded yet.</p>
            ) : (
              <Card className="flex flex-col divide-y divide-[var(--color-border)]">
                {opportunity.changeEvents.map((event) => (
                  <div key={event.id} className="p-3 text-xs">
                    <p className="text-[var(--color-ink)]">
                      {event.type.replace("_", " ").toLowerCase()}: {event.fromValue ?? "—"} → {event.toValue ?? "—"}
                    </p>
                    <p className="text-[var(--color-ink-faint)]">{event.createdAt.toLocaleString("en-GB")}</p>
                  </div>
                ))}
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="truncate text-lg font-semibold text-[var(--color-ink)]">{value}</p>
      <p className="truncate text-xs text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}
