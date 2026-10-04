import { db } from '@/core/db/client';
import { activitySchema, budgetLineSchema } from '../domain/planning';

export async function marketingDesk(organisationId: string) {
  const [campaigns, programs] = await Promise.all([
    db.marketingCampaign.findMany({ where: { organisationId }, orderBy: { updatedAt: 'desc' }, take: 200 }),
    db.marketingProgram.findMany({
      where: { organisationId, kind: { in: ['PLAN_ACTIVITY', 'BUDGET_LINE'] } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    }),
  ]);
  const names = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
  const activities = programs.flatMap((program) => {
    if (program.kind !== 'PLAN_ACTIVITY') return [];
    const parsed = activitySchema.safeParse(program.definition);
    if (!parsed.success) return [];
    return [{
      id: program.id,
      name: program.name,
      campaignId: program.campaignId,
      campaignName: (program.campaignId && names.get(program.campaignId)) || 'Campaign',
      updatedAt: program.updatedAt.toISOString(),
      startsAt: program.startsAt,
      ...parsed.data,
    }];
  });
  const lines = programs.flatMap((program) => {
    if (program.kind !== 'BUDGET_LINE') return [];
    const parsed = budgetLineSchema.safeParse(program.definition);
    if (!parsed.success) return [];
    return [{ id: program.id, name: program.name, campaignId: program.campaignId, ...parsed.data }];
  });
  return { campaigns, activities, lines };
}

export type MarketingDesk = Awaited<ReturnType<typeof marketingDesk>>;
