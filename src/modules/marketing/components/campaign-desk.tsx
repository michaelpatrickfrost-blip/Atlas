import Link from 'next/link';
import { Megaphone, CalendarDays, Route, Users, Clock3, Palette, CheckCircle2 } from 'lucide-react';
import { WorkspaceHeading, WorkspaceStats, WorkspaceLinks } from '@/components/ui/workspace';
import type { Session } from '@/core/auth/session';
import { db } from '@/core/db/client';
import { StatusPill } from '@/components/ui/status-pill';
import { CAMPAIGN_TRANSITIONS } from '../domain/policy';
import { updateCampaign } from '../services/commands';
import { marketingDesk } from '../services/desk';
import { ActionForm } from './action-form';
import { Choice } from './fields';
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

export async function CampaignDesk({ session, focus, search, status }: { session: Session; focus?: string; search?: string; status?: string }) {
  const [desk, audiences] = await Promise.all([
    marketingDesk(session.organisationId),
    session.capabilities.has('marketing.audience.read')
      ? db.marketingAudience.findMany({ where: { organisationId: session.organisationId }, orderBy: { name: 'asc' }, take: 100, select: { id: true, name: true } })
      : [],
  ]);
  const allocated = new Map<string, number>();
  for (const line of desk.lines) if (line.campaignId) allocated.set(line.campaignId, (allocated.get(line.campaignId) ?? 0) + line.plannedMinor);
  const campaigns = desk.campaigns.filter(campaign => (!search || `${campaign.name} ${campaign.code} ${campaign.description ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())) && (!status || campaign.status === status));
  const selected = campaigns.find((campaign) => campaign.id === focus) ?? campaigns[0] ?? null;
  const canCreate = session.capabilities.has('marketing.campaign.create');
  const canManage = session.capabilities.has('marketing.campaign.manage');
  const next = selected ? (CAMPAIGN_TRANSITIONS[selected.status] ?? []).filter((status) => status !== 'LIVE') : [];
  const places = selected ? desk.lines.filter((line) => line.campaignId === selected.id) : [];
  const upcoming = selected ? desk.activities.filter((activity) => activity.campaignId === selected.id && activity.status !== 'COMPLETE').sort((a, b) => a.dueAt.localeCompare(b.dueAt)) : [];
  return (
    <div className="min-w-0 space-y-5"><WorkspaceHeading eyebrow="Marketing workspace" title="Great campaigns start with a clear plan" description="Connect the brief, audience, creative work and customer journey. Keep deadlines, ownership and spend in view, then measure what the campaign contributes." actions={canCreate && <Link href="/marketing/campaigns/new" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white">New campaign</Link>} /><WorkspaceStats items={[
      { label: "Campaigns", value: campaigns.length, hint: "Matching this view", icon: Megaphone },
      { label: "Creative in progress", value: campaigns.filter(campaign => campaign.status === "CONTENT").length, icon: Palette },
      { label: "Waiting for review", value: campaigns.filter(campaign => campaign.status === "APPROVAL").length, icon: Clock3 },
      { label: "Scheduled", value: campaigns.filter(campaign => campaign.status === "SCHEDULED").length, icon: CalendarDays },
    ]} /><WorkspaceLinks items={[
      { title: "Campaign calendar", description: "Plan dates, deliverables and owners", href: "/marketing/calendar", icon: CalendarDays },
      { title: "Customer journey", description: "Map stages, touchpoints and branches", href: "/marketing/journey", icon: Route },
      ...(session.capabilities.has("marketing.audience.read") ? [{ title: "Audiences", description: `${audiences.length} saved audiences · preview eligible contacts`, href: "/marketing/audiences", icon: Users }] : []),
      { title: "Campaign budgets", description: "Plan spend and send it for Finance review", href: "/marketing/budgets", icon: CheckCircle2 },
    ]} /><form className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4"><input aria-label="Search campaigns" name="q" type="search" defaultValue={search} placeholder="Search campaign name, code or brief" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" /><select name="status" aria-label="Campaign status" defaultValue={status ?? ""} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="">All campaign stages</option>{Object.entries(STAGE).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white">Search</button></form><div className="grid min-w-0 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-[28px] border border-slate-200 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Campaigns <span className="ml-1 text-sm font-normal text-[var(--color-ink-faint)]">{campaigns.length}</span></h2>

        </div>
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/marketing?${new URLSearchParams({ focus: campaign.id, ...(search ? { q: search } : {}), ...(status ? { status } : {}) })}`} className={`block rounded-2xl px-4 py-3 ${campaign.id === selected?.id ? 'bg-[var(--color-atlas-blue-soft)]' : 'bg-[var(--color-app-bg)]'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{campaign.name}</p>
                <StatusPill label={STAGE[campaign.status] ?? words(campaign.status)} tone={campaignTone(campaign.status)} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{money(campaign.budgetMinor, campaign.currency)} · {money(allocated.get(campaign.id) ?? 0, campaign.currency)} assigned</p>
            </Link>
          ))}
          {!campaigns.length && <p className="rounded-2xl bg-[var(--color-app-bg)] p-4 text-sm text-[var(--color-ink-muted)]">No campaigns match this view. Clear the search or create a campaign.</p>}
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
              <div className="flex items-center gap-3"><StatusPill label={STAGE[selected.status] ?? words(selected.status)} tone={campaignTone(selected.status)} /><Link href={`/marketing/campaigns/${selected.id}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">Open campaign</Link></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <Metric label="Planned budget" value={money(selected.budgetMinor, selected.currency)} />
              <Metric label="Allocated spend" value={money(allocated.get(selected.id) ?? 0, selected.currency)} />
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
              )) : <p className="text-sm text-[var(--color-ink-muted)]">No planned spend yet. Assign the budget to the channels and places where it will be used.</p>}
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
        {!selected && <section className="rounded-[28px] border border-slate-200 p-8 text-center"><h2 className="text-lg font-semibold">No campaigns yet</h2><p className="mt-1 text-sm text-[var(--color-ink-muted)]">Build the first one: brief, audience, channels, budget and launch plan.</p></section>}
      </div></div>
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
