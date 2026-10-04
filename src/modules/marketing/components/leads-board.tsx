import Link from 'next/link';
import type { Session } from '@/core/auth/session';
import { db } from '@/core/db/client';
import { acceptMarketingHandoff } from '@/modules/crm/services/marketing-handoff';
import { leadFeedback } from '../services/commands';
import { ActionForm } from './action-form';
import { Area, Choice } from './fields';

const STATUS: Record<string, string> = {
  MQL: 'Ready for Sales',
  HANDED_OFF: 'Passed to Sales',
  ACCEPTED: 'Accepted by Sales',
  REJECTED: 'Not a fit',
  RECYCLED: 'Back with Marketing',
};

export async function MarketingLeads({ session }: { session: Session }) {
  const rows = await db.marketingLead.findMany({
    where: { organisationId: session.organisationId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { profile: { include: { contact: { select: { firstName: true, surname: true } }, party: { select: { id: true, name: true } } } } },
  });
  const campaigns = await db.marketingCampaign.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true } });
  const names = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
  const canHand = session.capabilities.has('marketing.lead.manage') && session.capabilities.has('sales.prospect.create');
  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">People ready for Sales</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">These contacts have shown enough interest to pass across. Sales keeps the same customer record.</p>
      </section>
      {rows.length ? rows.map((lead) => {
        const person = `${lead.profile.contact.firstName} ${lead.profile.contact.surname}`.trim();
        return (
          <section key={lead.id} className="rounded-[28px] border border-slate-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{person || lead.profile.party.name}</h2>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{lead.profile.party.name}{lead.campaignId ? ` · ${names.get(lead.campaignId) ?? 'Campaign'}` : ''}</p>
              </div>
              <span className="rounded-full bg-[var(--color-atlas-blue-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-atlas-blue)]">{STATUS[lead.status] ?? 'In review'}</span>
            </div>
            {lead.dueAt && <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Follow up by {lead.dueAt.toLocaleDateString('en-GB')}</p>}
            {lead.feedback && <p className="mt-3 text-sm">{lead.feedback}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              {session.capabilities.has('customers.read') && <Link className="text-sm text-[var(--color-atlas-blue)]" href={`/customers/${lead.profile.party.id}`}>Open customer</Link>}
              {lead.prospectId && session.capabilities.has('sales.prospect.read') && <Link className="text-sm text-[var(--color-atlas-blue)]" href={`/crm/prospect/${lead.prospectId}`}>Open in Sales</Link>}
            </div>
            {canHand && !lead.prospectId && (
              <div className="mt-4 max-w-xs">
                <ActionForm action={acceptMarketingHandoff} label="Pass to Sales">
                  <input type="hidden" name="id" value={lead.id} />
                </ActionForm>
              </div>
            )}
            {session.capabilities.has('marketing.lead.manage') && (
              <div className="mt-4 max-w-md">
                <ActionForm action={leadFeedback} label="Record what Sales decided">
                  <input type="hidden" name="id" value={lead.id} />
                  <Choice name="status" label="Decision" options={[{ value: 'ACCEPTED', label: 'Accepted' }, { value: 'REJECTED', label: 'Not a fit' }, { value: 'RECYCLED', label: 'Send back to Marketing' }]} />
                  <Area name="feedback" label="Note" />
                </ActionForm>
              </div>
            )}
          </section>
        );
      }) : (
        <section className="rounded-[28px] border border-slate-200 p-8 text-sm text-[var(--color-ink-muted)]">Nobody is waiting to be passed to Sales.</section>
      )}
    </div>
  );
}
