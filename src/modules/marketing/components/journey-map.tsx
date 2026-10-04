import Link from 'next/link';
import type { Session } from '@/core/auth/session';
import { db } from '@/core/db/client';
import { PLAN_CHANNELS, journeyMapSchema, journeyStageSchema, journeyTouchSchema } from '../domain/planning';
import { addJourneyStage, addJourneyTouch, createJourneyMap } from '../services/commands';
import { ActionForm } from './action-form';
import { Area, Choice, Field } from './fields';
import { channelClass } from './format';

export async function MarketingJourneyMap({ session, focus }: { session: Session; focus?: string }) {
  const programs = await db.marketingProgram.findMany({
    where: { organisationId: session.organisationId, kind: { in: ['JOURNEY_MAP', 'JOURNEY_STAGE', 'JOURNEY_TOUCH'] } },
    orderBy: { createdAt: 'asc' },
    take: 1000,
  });
  const campaigns = await db.marketingCampaign.findMany({
    where: { organisationId: session.organisationId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  const names = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
  const maps = programs.flatMap((program) => {
    if (program.kind !== 'JOURNEY_MAP') return [];
    const parsed = journeyMapSchema.safeParse(program.definition);
    if (!parsed.success) return [];
    return [{ id: program.id, name: program.name, campaignId: program.campaignId, who: parsed.data.who }];
  });
  const stages = programs.flatMap((program) => {
    if (program.kind !== 'JOURNEY_STAGE') return [];
    const parsed = journeyStageSchema.safeParse(program.definition);
    if (!parsed.success) return [];
    return [{ id: program.id, name: program.name, ...parsed.data }];
  });
  const touches = programs.flatMap((program) => {
    if (program.kind !== 'JOURNEY_TOUCH') return [];
    const parsed = journeyTouchSchema.safeParse(program.definition);
    if (!parsed.success) return [];
    return [{ id: program.id, name: program.name, ...parsed.data }];
  });
  const selected = maps.find((map) => map.id === focus) ?? maps[0] ?? null;
  const columns = selected ? stages.filter((stage) => stage.journeyId === selected.id).sort((a, b) => a.order - b.order) : [];
  const manage = session.capabilities.has('marketing.program.manage');
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Customer journey</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-muted)]">The path a customer takes, and every place they meet the company. Nothing here is sent.</p>
        </div>
        {maps.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {maps.map((map) => (
              <Link key={map.id} href={`/marketing/journey?focus=${map.id}`} className={`rounded-full px-3 py-1 text-sm ${map.id === selected?.id ? 'bg-[var(--color-atlas-blue-soft)] font-semibold text-[var(--color-atlas-blue)]' : 'bg-[var(--color-app-bg)]'}`}>{map.name}</Link>
            ))}
          </div>
        )}
      </div>
      {selected ? (
        <section className="rounded-[28px] border border-slate-200 p-6">
          <p className="text-xs text-[var(--color-ink-faint)]">{selected.campaignId ? names.get(selected.campaignId) ?? 'Campaign' : 'Not tied to a campaign'}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{selected.name}</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">For {selected.who}</p>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {columns.map((stage, index) => {
              const points = touches.filter((touch) => touch.stageId === stage.id);
              return (
                <div key={stage.id} className="w-64 shrink-0">
                  <p className="text-xs font-semibold text-[var(--color-ink-faint)]">{index + 1}</p>
                  <h3 className="text-lg font-semibold">{stage.name}</h3>
                  {stage.customerIntent && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{stage.customerIntent}</p>}
                  <div className="mt-3 space-y-2">
                    {points.map((touch) => (
                      <div key={touch.id} className="rounded-2xl bg-[var(--color-app-bg)] p-3">
                        <p className="font-medium">{touch.name}</p>
                        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{touch.moment}</p>
                        <p className="mt-2 text-xs">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${channelClass(touch.channel)}`}>{touch.channel}</span>
                          {touch.owner ? <span className="ml-2 text-[var(--color-ink-faint)]">{touch.owner}</span> : null}
                        </p>
                      </div>
                    ))}
                    {!points.length && <p className="rounded-2xl border border-dashed border-black/10 p-3 text-sm text-[var(--color-ink-faint)]">No touchpoint yet.</p>}
                  </div>
                </div>
              );
            })}
            {!columns.length && <p className="text-sm text-[var(--color-ink-muted)]">This journey has no stages yet.</p>}
          </div>
        </section>
      ) : (
        <section className="rounded-[28px] border border-slate-200 p-8 text-sm text-[var(--color-ink-muted)]">No journey yet. Name who it is for, and the five stages are ready for touchpoints.</section>
      )}
      {manage && (
        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-[28px] border border-slate-200 p-5">
            <h2 className="font-semibold">New journey</h2>
            <div className="mt-4">
              <ActionForm action={createJourneyMap} label="Start the map">
                <Field name="name" label="Journey name" />
                <Field name="who" label="Who is this for?" />
                <Choice name="campaignId" label="Campaign" optional options={campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name }))} />
              </ActionForm>
            </div>
          </section>
          {selected && (
            <section className="rounded-[28px] border border-slate-200 p-5">
              <h2 className="font-semibold">Add a stage</h2>
              <div className="mt-4">
                <ActionForm action={addJourneyStage} label="Add stage">
                  <input type="hidden" name="journeyId" value={selected.id} />
                  <Field name="name" label="Stage" />
                  <Area name="customerIntent" label="What is the customer doing?" required={false} />
                </ActionForm>
              </div>
            </section>
          )}
          {selected && columns.length > 0 && (
            <section className="rounded-[28px] border border-slate-200 p-5">
              <h2 className="font-semibold">Add a touchpoint</h2>
              <div className="mt-4">
                <ActionForm action={addJourneyTouch} label="Add touchpoint">
                  <Choice name="stageId" label="Stage" options={columns.map((stage) => ({ value: stage.id, label: stage.name }))} />
                  <Field name="name" label="Touchpoint" />
                  <Choice name="channel" label="Channel" options={PLAN_CHANNELS.map((channel) => ({ value: channel, label: channel }))} />
                  <Area name="moment" label="What happens" />
                  <Field name="owner" label="Who owns it" required={false} />
                </ActionForm>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
