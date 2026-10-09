import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { CampaignDesk } from '@/modules/marketing/components/campaign-desk';
import { requireMarketing } from '@/modules/marketing/services/queries';

export default async function Marketing({ searchParams }: { searchParams: Promise<{ focus?: string; q?: string; status?: string }> }) {
  const session = await requireSession();
  assertCapability(session, 'marketing.campaign.read');
  await requireMarketing(session);
  const query = await searchParams;
  return <CampaignDesk session={session} focus={query.focus} search={query.q} status={query.status} />;
}
