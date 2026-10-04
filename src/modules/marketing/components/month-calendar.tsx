import Link from 'next/link';
import type { Session } from '@/core/auth/session';
import { ActionForm } from './action-form';
import { Choice, Field, Area } from './fields';
import { channelClass, dayKey, money, monthStamp, parseMonth, words } from './format';
import { marketingDesk } from '../services/desk';
import { addPlanActivity, updatePlanActivity } from '../services/commands';
import { PLAN_CHANNELS } from '../domain/planning';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthGrid({ year, month, marks, dense = false }: { year: number; month: number; marks: Map<string, { title: string; channel: string }[]>; dense?: boolean }) {
  const first = new Date(year, month - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(year, month, 0).getDate();
  const cells: Array<Date | null> = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, index) => new Date(year, month - 1, index + 1))];
  while (cells.length % 7) cells.push(null);
  const today = dayKey(new Date());
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
        {WEEKDAYS.map((day) => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className={dense ? 'h-9' : 'min-h-24 rounded-xl bg-black/[0.02]'} />;
          const key = dayKey(date);
          const items = marks.get(key) ?? [];
          const current = key === today;
          return (
            <div key={key} className={`${dense ? 'flex h-11 flex-col items-center justify-center rounded-lg text-xs' : 'min-h-24 rounded-xl p-2 text-sm'} ${current ? 'bg-[var(--color-atlas-blue-soft)] ring-1 ring-[var(--color-atlas-blue)]' : dense ? '' : 'bg-white'}`}>
              <p className={current ? 'font-semibold text-[var(--color-atlas-blue)]' : 'text-[var(--color-ink)]'}>{date.getDate()}</p>
              {!dense && items.slice(0, 3).map((item) => (
                <p key={`${key}-${item.title}`} className={`mt-1 truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ${channelClass(item.channel)}`}>{item.title}</p>
              ))}
              {!dense && items.length > 3 && <p className="mt-1 text-[11px] text-[var(--color-ink-faint)]">+{items.length - 3}</p>}
              {dense && items.length > 0 && <span className="mt-1 size-1.5 rounded-full bg-[var(--color-atlas-blue)]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export async function MarketingCalendar({ session, month }: { session: Session; month?: string }) {
  const { year, month: monthNumber } = parseMonth(month);
  const desk = await marketingDesk(session.organisationId);
  const marks = new Map<string, { title: string; channel: string }[]>();
  for (const activity of desk.activities) {
    const key = dayKey(activity.dueAt);
    const list = marks.get(key) ?? [];
    list.push({ title: activity.name, channel: activity.channel });
    marks.set(key, list);
  }
  const label = new Date(year, monthNumber - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const inMonth = desk.activities.filter((activity) => {
    const due = new Date(activity.dueAt);
    return due.getFullYear() === year && due.getMonth() + 1 === monthNumber;
  }).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const manage = session.capabilities.has('marketing.program.manage');
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-[28px] border border-slate-200 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--color-ink-muted)]">Delivery calendar</p>
            <h2 className="text-2xl font-semibold tracking-tight">{label}</h2>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-full border border-black/10 px-3 py-1.5 text-sm" href={`/marketing/calendar?month=${monthStamp(year, monthNumber, -1)}`}>Previous</Link>
            <Link className="rounded-full border border-black/10 px-3 py-1.5 text-sm" href="/marketing/calendar">Today</Link>
            <Link className="rounded-full border border-black/10 px-3 py-1.5 text-sm" href={`/marketing/calendar?month=${monthStamp(year, monthNumber, 1)}`}>Next</Link>
          </div>
        </div>
        <MonthGrid year={year} month={monthNumber} marks={marks} />
      </section>
      <div className="space-y-4">
        <section className="rounded-[28px] border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">On the board</h2>
          <div className="mt-4 space-y-3">
            {inMonth.length ? inMonth.map((activity) => (
              <article key={activity.id} className="rounded-2xl bg-[var(--color-app-bg)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{activity.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${channelClass(activity.channel)}`}>{activity.channel}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{new Date(activity.dueAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {activity.owner}</p>
                <p className="mt-2 text-sm">{activity.deliverable}</p>
                <p className="mt-2 text-xs text-[var(--color-ink-faint)]">{activity.campaignName} · {words(activity.status)}</p>
                {manage && (
                  <ActionForm action={updatePlanActivity} label="Update">
                    <input type="hidden" name="id" value={activity.id} />
                    <input type="hidden" name="updatedAt" value={activity.updatedAt} />
                    <Choice name="status" label="Progress" value={activity.status} options={['PLANNED', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED'].map((value) => ({ value, label: words(value) }))} />
                  </ActionForm>
                )}
              </article>
            )) : <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">Nothing is booked this month. Add a launch, a content deadline or a channel send.</p>}
          </div>
        </section>
        {manage && (
          <section className="rounded-[28px] border border-slate-200 p-5">
            <h2 className="text-lg font-semibold">Schedule work</h2>
            {desk.campaigns.length ? (
              <div className="mt-4">
                <ActionForm action={addPlanActivity} label="Add to calendar">
                  <Choice name="campaignId" label="Campaign" options={desk.campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name }))} />
                  <Field name="name" label="Activity" />
                  <Choice name="channel" label="Channel" options={PLAN_CHANNELS.map((channel) => ({ value: channel, label: channel }))} />
                  <Area name="deliverable" label="What needs to go out?" />
                  <Field name="owner" label="Owner" />
                  <Field name="startsAt" label="Starts" type="date" required={false} />
                  <Field name="dueAt" label="Due" type="date" />
                </ActionForm>
              </div>
            ) : <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Create a campaign first, then pin its work to the calendar. <Link className="text-[var(--color-atlas-blue)]" href="/marketing/campaigns">Open campaigns</Link></p>}
          </section>
        )}
      </div>
    </div>
  );
}

export function budgetSnapshot(campaigns: { id: string; currency: string; budgetMinor: number }[], lines: { campaignId: string | null; plannedMinor: number; currency: string; channel: string }[]) {
  const envelopes = new Map<string, number>();
  for (const campaign of campaigns) envelopes.set(campaign.currency, (envelopes.get(campaign.currency) ?? 0) + campaign.budgetMinor);
  const allocated = new Map<string, number>();
  const channels = new Map<string, { channel: string; currency: string; amount: number }>();
  for (const line of lines) {
    allocated.set(line.currency, (allocated.get(line.currency) ?? 0) + line.plannedMinor);
    const key = `${line.currency}:${line.channel}`;
    const current = channels.get(key) ?? { channel: line.channel, currency: line.currency, amount: 0 };
    current.amount += line.plannedMinor;
    channels.set(key, current);
  }
  return { envelopes, allocated, channels: [...channels.values()].sort((a, b) => b.amount - a.amount) };
}

export function BudgetMeters({ campaigns, lines }: { campaigns: { id: string; currency: string; budgetMinor: number }[]; lines: { campaignId: string | null; plannedMinor: number; currency: string; channel: string }[] }) {
  const { envelopes, channels } = budgetSnapshot(campaigns, lines);
  const peak = Math.max(1, ...channels.map((channel) => channel.amount));
  if (!envelopes.size && !channels.length) return <p className="text-sm text-[var(--color-ink-muted)]">Campaign budgets and channel allocations will show here.</p>;
  return (
    <div className="space-y-3">
      {channels.slice(0, 6).map((channel) => (
        <div key={`${channel.currency}-${channel.channel}`}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{channel.channel}</span>
            <span className="font-medium">{money(channel.amount, channel.currency)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/5">
            <div className="h-full rounded-full bg-[var(--color-atlas-blue)]" style={{ width: `${Math.max(8, Math.round((channel.amount / peak) * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
