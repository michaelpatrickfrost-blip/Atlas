import Link from 'next/link';
import type { Session } from '@/core/auth/session';
import { db } from '@/core/db/client';
import { StatusPill } from '@/components/ui/status-pill';
import { CAMPAIGN_TRANSITIONS, CAMPAIGN_TYPES } from '../domain/policy';
import { createCampaign, updateCampaign } from '../services/commands';
import { marketingDesk } from '../services/desk';
import { ActionForm } from './action-form';
import { Area, Choice, Field } from './fields';
import { campaignTone, money, words } from './format';

const STAGE: Record<string, string> = {
  IDEA: 'Idea',
  PLANNING: 'Drafting',
  CONTENT: 'Creative',
  APPROVAL: 'In review',
  SCHEDULED: 'Scheduled',
  LIVE: 'Live',
  PAUSED: 'Paused',
  COMPLETED: 'Finished',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived',
};

export async function CampaignDesk({ session, focus }: { session: Session; focus?: string }) {
  const [desk, audiences] = await Promise.all([
    marketingDesk(session.organisationId),
    session.capabilities.has('marketing.audience.read')
      ? db.marketingAudience.findMany({ where: { organisationId: session.organisationId }, orderBy: { name: 'asc' }, take: 100, select: { id: true, name: true } })
      : [],
  ]);
  const allocated = new Map<string, number>();
  for (const line of desk.lines) if (line.campaignId) allocated.set(line.campaignId, (allocated.get(line.campaignId) ?? 0) + line.plannedMinor);
  const selected = desk.campaigns.find((campaign) => campaign.id === focus) ?? desk.campaigns[0] ?? null;
  const canCreate = session.capabilities.has('marketing.campaign.create');
  const canManage = session.capabilities.has('marketing.campaign.manage');
  const next = selected ? (CAMPAIGN_TRANSITIONS[selected.status] ?? []).filter((status) => status !== 'LIVE') : [];
  const places = selected ? desk.lines.filter((line) => line.campaignId === selected.id) : [];
  const upcoming = selected ? desk.activities.filter((activity) => activity.campaignId === selected.id && activity.status !== 'COMPLETE').sort((a, b) => a.dueAt.localeCompare(b.dueAt)) : [];
  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-[28px] border border-slate-200 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Campaigns</h2>
          <span className="text-sm text-[var(--color-ink-faint)]">{desk.campaigns.length}</span>
        </div>
        <div className="space-y-2">
          {desk.campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/marketing?focus=${campaign.id}`} className={`block rounded-2xl px-4 py-3 ${campaign.id === selected?.id ? 'bg-[var(--color-atlas-blue-soft)]' : 'bg-[var(--color-app-bg)]'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{campaign.name}</p>
                <StatusPill label={STAGE[campaign.status] ?? words(campaign.status)} tone={campaignTone(campaign.status)} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{money(campaign.budgetMinor, campaign.currency)} · {money(allocated.get(campaign.id) ?? 0, campaign.currency)} assigned</p>
            </Link>
          ))}
          {!desk.campaigns.length && <p className="rounded-2xl bg-[var(--color-app-bg)] p-4 text-sm text-[var(--color-ink-muted)]">No campaigns yet. Start one on the right.</p>}
        </div>
      </section>
      <div className="space-y-6">
        {selected ? (
          <section className="rounded-[28px] border border-slate-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--color-ink-faint)]">{selected.code} · {words(selected.type)}</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight">{selected.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">{selected.description || 'Say what this campaign is for.'}</p>
              </div>
              <StatusPill label={STAGE[selected.status] ?? words(selected.status)} tone={campaignTone(selected.status)} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <Metric label="Envelope" value={money(selected.budgetMinor, selected.currency)} />
              <Metric label="Assigned to places" value={money(allocated.get(selected.id) ?? 0, selected.currency)} />
              <Metric label="Runs" value={`${selected.startAt?.toLocaleDateString('en-GB') ?? 'Open'} – ${selected.endAt?.toLocaleDateString('en-GB') ?? 'Open'}`} />
              <Metric label="Goal" value={selected.goal ? `${selected.goal}${selected.goalTarget ? ` · ${selected.goalTarget}` : ''}` : 'Not set'} />
            </div>
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Spend by place</h3>
                <Link className="text-sm text-[var(--color-atlas-blue)]" href="/marketing/budgets">Assign spend</Link>
              </div>
              {places.length ? places.map((line) => (
                <div key={line.id} className="flex items-center justify-between gap-3 border-t border-black/5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{line.place}</p>
                    <p className="text-[var(--color-ink-muted)]">{line.name} · {line.channel}</p>
                  </div>
                  <p className="font-semibold">{money(line.plannedMinor, line.currency)}</p>
                </div>
              )) : <p className="text-sm text-[var(--color-ink-muted)]">Nothing is assigned yet. Put the envelope against the places it will be spent.</p>}
            </div>
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">On the calendar</h3>
                <Link className="text-sm text-[var(--color-atlas-blue)]" href="/marketing/calendar">Open calendar</Link>
              </div>
              {upcoming.length ? upcoming.slice(0, 4).map((activity) => (
                <p key={activity.id} className="border-t border-black/5 py-3 text-sm">{new Date(activity.dueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {activity.name} · {activity.channel}</p>
              )) : <p className="text-sm text-[var(--color-ink-muted)]">No dated work for this campaign.</p>}
            </div>
            <p className="mt-6 text-sm"><Link className="text-[var(--color-atlas-blue)]" href="/marketing/journey">Map the customer journey and its touchpoints</Link></p>
            {canManage && next.length > 0 && (
              <div className="mt-6 max-w-sm">
                <ActionForm action={updateCampaign} label="Update">
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="version" value={selected.version} />
                  <Choice name="status" label="Move this campaign" options={next.map((status) => ({ value: status, label: STAGE[status] ?? words(status) }))} />
                </ActionForm>
              </div>
            )}
          </section>
        ) : null}
        {canCreate && (
          <section className="rounded-[28px] border border-slate-200 p-6">
            <h2 className="text-lg font-semibold">New campaign</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Name it, set the envelope, then assign that money to places.</p>
            <div className="mt-5 max-w-3xl">
              <ActionForm action={createCampaign} label="Create campaign">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="name" label="Campaign name" />
                  <Field name="code" label="Code" />
                  <Choice name="type" label="Type" options={CAMPAIGN_TYPES.map((type) => ({ value: type, label: words(type) }))} />
                  <Field name="currency" label="Currency" value="GBP" />
                  <Field name="budgetAmount" label="Budget envelope" value="0.00" />
                  <Field name="goal" label="Goal" required={false} />
                  <Field name="goalTarget" label="Goal target" type="number" value="0" />
                  <Field name="startAt" label="Starts" type="date" required={false} />
                  <Field name="endAt" label="Ends" type="date" required={false} />
                  <Choice name="audienceId" label="Audience" optional options={audiences.map((audience) => ({ value: audience.id, label: audience.name }))} />
                  <Choice name="parentId" label="Part of" optional options={desk.campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name }))} />
                </div>
                <Area name="description" label="What is this for?" required={false} />
              </ActionForm>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--color-app-bg)] p-4">
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
