import Link from 'next/link';
import type { Session } from '@/core/auth/session';
import { db } from '@/core/db/client';

const money = (value: number, currency: string) => new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(value / 100);

export async function PlanningWorkspace({ session }: { session: Session }) {
  const where = { organisationId: session.organisationId };
  const campaigns = await db.marketingCampaign.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 200 });
  const enabled = await db.moduleState.findMany({ where: { ...where, moduleId: { in: ['crm', 'sales'] }, enabled: true, entitled: true }, select: { moduleId: true } });
  const modules = new Set(enabled.map((item) => item.moduleId));
  const ids = campaigns.map((campaign) => campaign.id);
  const prospects = modules.has('crm') && session.capabilities.has('sales.prospect.read')
    ? await db.prospect.findMany({ where: { ...where, campaign: { in: ids } }, select: { id: true, companyName: true, lifecycleStage: true, campaign: true }, take: 500 })
    : null;
  const opportunities = modules.has('crm') && session.capabilities.has('sales.opportunity.read')
    ? await db.opportunity.findMany({ where: { ...where, campaign: { in: ids } }, select: { id: true, name: true, status: true, valueAmount: true, valueCurrency: true, campaign: true }, take: 500 })
    : null;
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">From campaign to Sales</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">Leads handed across from a campaign, and the opportunities Sales opened from them. Pipeline value is potential business, not posted invoice revenue.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/marketing/leads" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-medium text-white">Review handoffs</Link>
          {session.capabilities.has('marketing.report.read') && session.capabilities.has('sales.order.read') && modules.has('sales') && <Link href="/marketing/attribution" className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium">Order attribution</Link>}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 p-6">
          <h2 className="mb-4 text-lg font-semibold">Campaign leads</h2>
          {prospects === null ? <p className="text-sm text-[var(--color-ink-muted)]">CRM access is required.</p> : prospects.length ? prospects.map((prospect) => (
            <Link className="block border-b border-black/5 py-4" key={prospect.id} href={`/crm/prospect/${prospect.id}`}>
              <span className="font-medium">{prospect.companyName}</span>
              <p className="text-sm text-[var(--color-ink-muted)]">{campaigns.find((campaign) => campaign.id === prospect.campaign)?.name} · {prospect.lifecycleStage}</p>
            </Link>
          )) : <p className="text-sm text-[var(--color-ink-muted)]">Campaign handoffs appear here once they are sent to CRM.</p>}
        </section>
        <section className="rounded-[28px] border border-slate-200 p-6">
          <h2 className="mb-4 text-lg font-semibold">Campaign pipeline</h2>
          {opportunities === null ? <p className="text-sm text-[var(--color-ink-muted)]">CRM opportunity access is required.</p> : opportunities.length ? opportunities.map((opportunity) => (
            <Link className="block border-b border-black/5 py-4" key={opportunity.id} href={`/crm/opportunities/${opportunity.id}`}>
              <span className="font-medium">{opportunity.name}</span>
              <p className="text-sm text-[var(--color-ink-muted)]">{opportunity.status} · {money(opportunity.valueAmount, opportunity.valueCurrency)} · {campaigns.find((campaign) => campaign.id === opportunity.campaign)?.name}</p>
            </Link>
          )) : <p className="text-sm text-[var(--color-ink-muted)]">Linked opportunities appear as Sales qualifies campaign leads.</p>}
        </section>
      </div>
    </div>
  );
}
