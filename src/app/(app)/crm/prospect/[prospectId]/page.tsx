import { ownerRestriction } from "@/modules/crm/services/visibility";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { crmPushAllowed } from "@/core/permissions/manager-level";
import { crmManagerPolicy } from "@/modules/crm/services/manager-level";
import { getProspect, listIndustries } from "@/modules/crm/services/prospects-queries";
import { saveProspectGrouping } from "@/modules/crm/services/prospects";
import { Card } from "@/components/ui/card";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/core/shared/money";
import {
  qualifyFormAction,
  disqualifyFormAction,
  nurtureFormAction,
  logProspectActivityFormAction,
  convertProspectFormAction,
  assignProspectFormAction,
  assignProspectTaskFormAction,
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
  const [prospect, industries, policy] = await Promise.all([getProspect(session.organisationId, prospectId), listIndustries(session.organisationId), crmManagerPolicy(session.organisationId)]);
  if (!prospect) notFound();
  const ownerOnly = ownerRestriction(session);
  if (ownerOnly && prospect.ownerUserId !== ownerOnly) notFound();

  const canManage = can(session, SALES_CAPABILITIES.prospectManage);
  const canPush = canManage && crmPushAllowed(policy, session.capabilities);
  const canAssign = can(session, SALES_CAPABILITIES.prospectAssign);
  const colleagues = canAssign ? await db.membership.findMany({ where: { organisationId: session.organisationId, active: true }, select: { userId: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } }, take: 200 }) : [];
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
            {prospect.industry?.name ?? "No industry"}
            {prospect.tags.length > 0 && ` · ${prospect.tags.join(", ")}`}
            {prospect.contactFirstName && ` · ${prospect.contactFirstName} ${prospect.contactSurname}`}
          </p>
        </div>

        {canPush && active && prospect.lifecycleStage !== "QUALIFIED" && (
          <div className="flex flex-wrap gap-2">
            <ActionForm action={qualifyFormAction.bind(null, prospect.id)}>
              <Button type="submit" variant="primary">Qualify</Button>
            </ActionForm>
          </div>
        )}
      </div>

      {policy.crm && canManage && !canPush && active && (
        <Card className="p-4 text-sm text-[var(--color-ink-muted)]">A sales manager assigns the next task and pushes this prospect.</Card>
      )}

      {active && canPush && (
        <Card className="flex flex-col gap-3 p-4">
          <div><p className="text-sm font-medium text-[var(--color-ink)]">Convert to a deal in the pipeline</p><p className="mt-1 text-xs text-[var(--color-ink-muted)]">Creates the customer record if there is not one yet, and puts the deal in the first pipeline stage.</p></div>
          <ActionForm action={convertProspectFormAction.bind(null, prospect.id)} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--color-ink-muted)]">Opportunity name</span>
              <input name="opportunityName" required defaultValue={`${prospect.companyName} — new business`} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--color-ink-muted)]">Value (£)</span>
              <input name="valueAmount" type="number" step="0.01" min="0" defaultValue={prospect.estimatedValueAmount ? prospect.estimatedValueAmount / 100 : undefined} className={inputClass} />
            </label>
            <Button type="submit" variant="primary">Convert and add to pipeline</Button>
          </ActionForm>
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

          {canAssign && active && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Manager</h2>
              <Card className="flex flex-col gap-4 p-4">
                <ActionForm action={assignProspectFormAction.bind(null, prospect.id)} className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">Prospect owner
                    <select name="ownerUserId" defaultValue={prospect.ownerUserId ?? ""} className={inputClass}>
                      {colleagues.map((member) => <option key={member.userId} value={member.userId}>{member.user.name}</option>)}
                    </select>
                  </label>
                  <Button type="submit" variant="secondary">Assign prospect</Button>
                </ActionForm>
                <ActionForm action={assignProspectTaskFormAction.bind(null, prospect.id)} className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
                  <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">Task for
                    <select name="ownerUserId" defaultValue={prospect.ownerUserId ?? ""} className={inputClass}>
                      {colleagues.map((member) => <option key={member.userId} value={member.userId}>{member.user.name}</option>)}
                    </select>
                  </label>
                  <input name="subject" placeholder="Task" required className={inputClass} />
                  <input name="dueAt" type="date" className={inputClass} />
                  <Button type="submit" variant="secondary">Assign task</Button>
                </ActionForm>
              </Card>
            </section>
          )}

          {canManage && active && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Log activity</h2>
              <ActionForm action={logProspectActivityFormAction.bind(null, prospect.id)} className="flex flex-col gap-3 rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
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
              </ActionForm>
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
          {canManage && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Industry and tags</h2>
              <Card className="flex flex-col gap-3 p-4">
                <ActionForm action={saveProspectGrouping.bind(null, prospect.id)} className="flex flex-col gap-3">
                  <label className="text-xs text-[var(--color-ink-muted)]">Industry
                    <select name="industryId" defaultValue={prospect.industryId ?? ""} className={`${inputClass} mt-1 w-full`}>
                      <option value="">None</option>
                      {industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}
                    </select>
                  </label>
                  <input name="newIndustry" placeholder="Or create one, such as drainage" className={inputClass} />
                  <div className="flex flex-wrap gap-2">
                    {prospect.tags.map((tag) => (
                      <button key={tag} type="submit" name="removeTag" value={tag} className="rounded-full bg-[#eef1f6] px-2.5 py-1 text-xs text-[#1d1d1f]">{tag} ×</button>
                    ))}
                  </div>
                  <input name="tag" placeholder="Add a tag" className={inputClass} />
                  <Button type="submit" variant="secondary">Save grouping</Button>
                </ActionForm>
              </Card>
            </section>
          )}
          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Scoring</h2>
            <Card className="flex flex-col gap-3 p-4">
              <ScoreRow label="Fit" score={prospect.fitScore} factors={prospect.fitFactors} />
              <ScoreRow label="Engagement" score={prospect.engagementScore} factors={prospect.engagementFactors} />
              <ScoreRow label="Intent" score={prospect.intentScore} factors={prospect.intentFactors} />
            </Card>
          </section>

          {canPush && active && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Not ready to buy?</h2>
              <Card className="flex flex-col gap-4 p-4">
                <ActionForm action={nurtureFormAction.bind(null, prospect.id)} className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
                    Nurture — review on
                    <input name="nextReviewAt" type="date" className={inputClass} />
                  </label>
                  <input name="reason" placeholder="Reason (optional)" className={inputClass} />
                  <Button type="submit" variant="secondary">Move to nurture</Button>
                </ActionForm>
                <ActionForm action={disqualifyFormAction.bind(null, prospect.id)} className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
                  <input name="reason" placeholder="Disqualification reason" className={inputClass} />
                  <Button type="submit" variant="ghost">Disqualify</Button>
                </ActionForm>
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
