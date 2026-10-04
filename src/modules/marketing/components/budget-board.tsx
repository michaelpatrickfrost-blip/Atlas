import Link from 'next/link';
import type { Session } from '@/core/auth/session';
import { ActionForm } from './action-form';
import { Area, Choice, Field } from './fields';
import { channelClass, money } from './format';
import { marketingDesk } from '../services/desk';
import { addBudgetLine, submitBudgetToFinance } from '../services/commands';
import { PLAN_CHANNELS } from '../domain/planning';

const FINANCE: Record<string, string> = {
  DRAFT: 'Not sent',
  WITH_FINANCE: 'Sent to Finance',
  APPROVED: 'Approved',
  RETURNED: 'Returned',
};

export async function MarketingBudgets({ session }: { session: Session }) {
  const desk = await marketingDesk(session.organisationId);
  const manage = session.capabilities.has('marketing.program.manage') && session.capabilities.has('marketing.campaign.manage');
  const canSend = manage && session.capabilities.has('finance.request.create');
  const places = new Map<string, { amount: number; currency: string }>();
  for (const line of desk.lines) {
    const key = `${line.place}\u0000${line.currency}`;
    const current = places.get(key);
    places.set(key, { amount: (current?.amount ?? 0) + line.plannedMinor, currency: line.currency });
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 p-6">
          <h2 className="text-lg font-semibold">Spend by place</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">A place is where the money goes: a market, a channel account, an event or a supplier.</p>
          <div className="mt-5 space-y-3">
            {[...places.entries()].sort((a, b) => b[1].amount - a[1].amount).map(([key, row]) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{key.split('\u0000')[0]}</span>
                  <span>{money(row.amount, row.currency)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full bg-[var(--color-atlas-blue)]" style={{ width: `${Math.max(8, Math.round((row.amount / Math.max(...[...places.values()].filter((item) => item.currency === row.currency).map((item) => item.amount), 1)) * 100))}%` }} />
                </div>
              </div>
            ))}
            {!places.size && <p className="text-sm text-[var(--color-ink-muted)]">Assign campaign money to a place to start the budget.</p>}
          </div>
        </section>
        {desk.campaigns.map((campaign) => {
          const lines = desk.lines.filter((line) => line.campaignId === campaign.id);
          const planned = lines.reduce((sum, line) => sum + line.plannedMinor, 0);
          return (
            <section key={campaign.id} className="rounded-[28px] border border-slate-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--color-ink-faint)]">{campaign.code}</p>
                  <h2 className="text-xl font-semibold tracking-tight">{campaign.name}</h2>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{money(planned, campaign.currency)} assigned of {money(campaign.budgetMinor, campaign.currency)}</p>
                </div>
                <Link className="text-sm text-[var(--color-atlas-blue)]" href={`/marketing?focus=${campaign.id}`}>Open campaign</Link>
              </div>
              <div className="mt-4 divide-y divide-black/5">
                {lines.map((line) => {
                  const label = FINANCE[line.approval] ?? 'Not sent';
                  return (
                    <div key={line.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                      <div>
                        <p className="font-medium">{line.place}</p>
                        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                          <span className={`mr-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${channelClass(line.channel)}`}>{line.channel}</span>
                          {line.name}{line.supplier ? ` · ${line.supplier}` : ''}
                        </p>
                        {line.notes && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{line.notes}</p>}
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">{money(line.plannedMinor, line.currency)}</p>
                        <p className="text-[var(--color-ink-faint)]">Forecast {money(line.forecastMinor, line.currency)}</p>
                        {line.financeDocumentId ? <Link className="mt-1 block text-[var(--color-atlas-blue)]" href={`/finance/documents/${line.financeDocumentId}`}>{label}</Link> : <p className="mt-1 text-[var(--color-ink-faint)]">{label}</p>}
                        {canSend && !line.financeDocumentId && line.plannedMinor > 0 && (
                          <ActionForm action={submitBudgetToFinance} label="Send to Finance">
                            <input type="hidden" name="id" value={line.id} />
                          </ActionForm>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!lines.length && <p className="py-4 text-sm text-[var(--color-ink-muted)]">No places yet. The envelope is {money(campaign.budgetMinor, campaign.currency)}.</p>}
              </div>
            </section>
          );
        })}
      </div>
      {manage && (
        <section className="h-fit rounded-[28px] border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Assign spend</h2>
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Use the campaign currency. Finance approves the amount; this does not pay anyone.</p>
          {desk.campaigns.length ? (
            <div className="mt-4">
              <ActionForm action={addBudgetLine} label="Add to a place">
                <Choice name="campaignId" label="Campaign" options={desk.campaigns.map((campaign) => ({ value: campaign.id, label: `${campaign.name} · ${campaign.currency}` }))} />
                <Field name="place" label="Place" />
                <Field name="name" label="What is it for?" />
                <Choice name="channel" label="Channel" options={PLAN_CHANNELS.map((channel) => ({ value: channel, label: channel }))} />
                <Field name="category" label="Cost type" />
                <Field name="supplier" label="Supplier or agency" required={false} />
                <Field name="planned" label="Amount" value="0.00" />
                <Field name="forecast" label="Forecast" value="0.00" />
                <Field name="currency" label="Currency" value={desk.campaigns[0]?.currency ?? 'GBP'} />
                <Area name="notes" label="Notes for Finance" required={false} />
              </ActionForm>
            </div>
          ) : <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Create a campaign before assigning its money. <Link className="text-[var(--color-atlas-blue)]" href="/marketing">Campaigns</Link></p>}
          {!canSend && <p className="mt-4 text-xs text-[var(--color-ink-faint)]">Sending a place to Finance needs permission to raise a spend request.</p>}
        </section>
      )}
    </div>
  );
}
