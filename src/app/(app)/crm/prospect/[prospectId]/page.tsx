import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { getProspect } from "@/modules/crm/services/prospects-queries";
import { Card } from "@/components/ui/card";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/core/shared/money";
import {
  qualifyFormAction,
  disqualifyFormAction,
  nurtureFormAction,
  logProspectActivityFormAction,
  convertProspectFormAction,
} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import type { ProspectLifecycleStage } from "@/generated/prisma/client";

const STAGE_TONE: Record<ProspectLifecycleStage, StatusTone> = {
  NEW: "neutral",
  CONTACTED: "neutral",
  QUALIFIED: "success",
  NURTURE: "warning",
  DISQUALIFIED: "danger",
  CONVERTED: "success",
};

const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "TASK", "FOLLOW_UP", "DEMO", "SITE_VISIT", "PROPOSAL", "OTHER"] as const;

const inputClass = "rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]";

export default async function ProspectRecordPage({ params }: { params: Promise<{ prospectId: string }> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectRead);

  const { prospectId } = await params;
  const prospect = await getProspect(session.organisationId, prospectId);
  if (!prospect) notFound();

  const canManage = can(session, SALES_CAPABILITIES.prospectManage);
  const active = prospect.lifecycleStage !== "CONVERTED" && prospect.lifecycleStage !== "DISQUALIFIED";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{prospect.companyName}</h1>
            <StatusPill label={prospect.lifecycleStage.replace("_", " ")} tone={STAGE_TONE[prospect.lifecycleStage]} />
          </div>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {prospect.contactFirstName && `${prospect.contactFirstName} ${prospect.contactSurname} · `}
            {prospect.source ?? "No source recorded"}
          </p>
        </div>

        {canManage && active && prospect.lifecycleStage !== "QUALIFIED" && (
          <div className="flex flex-wrap gap-2">
            <form action={qualifyFormAction.bind(null, prospect.id)}>
              <Button type="submit" variant="primary">Qualify</Button>
            </form>
          </div>
        )}
      </div>

      {prospect.lifecycleStage === "QUALIFIED" && canManage && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm font-medium text-[var(--color-ink)]">Convert to opportunity</p>
          <form action={convertProspectFormAction.bind(null, prospect.id)} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--color-ink-muted)]">Opportunity name</span>
              <input name="opportunityName" required defaultValue={`${prospect.companyName} — new business`} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--color-ink-muted)]">Value (£)</span>
              <input name="valueAmount" type="number" step="0.01" min="0" defaultValue={prospect.estimatedValueAmount ? prospect.estimatedValueAmount / 100 : undefined} className={inputClass} />
            </label>
            <Button type="submit" variant="primary">Convert</Button>
          </form>
        </Card>
      )}

      {prospect.lifecycleStage === "CONVERTED" && prospect.opportunity && (
        <Card className="flex items-center justify-between p-4">
          <p className="text-sm text-[var(--color-ink)]">Converted to opportunity</p>
          <a href={`/crm/opportunities/${prospect.opportunity.id}`} className="text-sm text-[var(--color-atlas-blue)] hover:underline">
            {prospect.opportunity.name} →
          </a>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Identity</h2>
            <Card className="grid grid-cols-2 gap-4 p-4 text-sm">
              <Field label="Job title" value={prospect.jobTitle ?? "—"} />
              <Field label="Email" value={prospect.email ?? "—"} />
              <Field label="Phone" value={prospect.phone ?? "—"} />
              <Field label="Website" value={prospect.website ?? "—"} />
              <Field label="Country" value={prospect.country ?? "—"} />
              <Field label="Estimated value" value={prospect.estimatedValueAmount ? formatMoney(prospect.estimatedValueAmount, prospect.estimatedValueCurrency ?? "GBP") : "—"} />
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Origin & attribution</h2>
            <Card className="grid grid-cols-2 gap-4 p-4 text-sm">
              <Field label="Original source" value={prospect.originalSource ?? "—"} />
              <Field label="Most recent source" value={prospect.source ?? "—"} />
              <Field label="Campaign" value={prospect.campaign ?? "—"} />
              <Field label="Referrer" value={prospect.referrer ?? "—"} />
            </Card>
          </section>

          {canManage && active && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Log activity</h2>
              <form action={logProspectActivityFormAction.bind(null, prospect.id)} className="flex flex-col gap-3 rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
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
            {prospect.activities.length === 0 ? (
              <EmptyState title="No activity logged yet." />
            ) : (
              <div className="flex flex-col">
                {prospect.activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 border-b border-[var(--color-border)] py-3 text-sm last:border-0">
                    <span className="w-28 shrink-0 text-[var(--color-ink-faint)]">{activity.createdAt.toLocaleDateString("en-GB")}</span>
                    <div>
                      <p className="text-[var(--color-ink)]">{activity.subject}</p>
                      {activity.notes && <p className="text-xs text-[var(--color-ink-muted)]">{activity.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Scoring</h2>
            <Card className="flex flex-col gap-3 p-4">
              <ScoreRow label="Fit" score={prospect.fitScore} factors={prospect.fitFactors} />
              <ScoreRow label="Engagement" score={prospect.engagementScore} factors={prospect.engagementFactors} />
              <ScoreRow label="Intent" score={prospect.intentScore} factors={prospect.intentFactors} />
            </Card>
          </section>

          {canManage && active && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Not ready to buy?</h2>
              <Card className="flex flex-col gap-4 p-4">
                <form action={nurtureFormAction.bind(null, prospect.id)} className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
                    Nurture — review on
                    <input name="nextReviewAt" type="date" className={inputClass} />
                  </label>
                  <input name="reason" placeholder="Reason (optional)" className={inputClass} />
                  <Button type="submit" variant="secondary">Move to nurture</Button>
                </form>
                <form action={disqualifyFormAction.bind(null, prospect.id)} className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
                  <input name="reason" placeholder="Disqualification reason" className={inputClass} />
                  <Button type="submit" variant="ghost">Disqualify</Button>
                </form>
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--color-ink)]">{value}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}

function ScoreRow({ label, score, factors }: { label: string; score: number | null; factors: unknown }) {
  const factorList = Array.isArray(factors) ? (factors as { label: string; points: number }[]) : [];
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-ink-muted)]">{label}</span>
        <span className="text-sm font-medium text-[var(--color-ink)]">{score == null ? "Not scored" : score}</span>
      </div>
      {factorList.length > 0 && (
        <ul className="mt-1 flex flex-col gap-0.5">
          {factorList.map((factor) => (
            <li key={factor.label} className="text-xs text-[var(--color-ink-faint)]">
              {factor.points > 0 ? "+" : ""}
              {factor.points} {factor.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
