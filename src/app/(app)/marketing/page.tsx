import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { Card } from '@/components/ui/card';

export default async function MarketingPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.campaign.read');

  const campaigns = await db.marketingCampaign.findMany({
    where: { organisationId: session.organisationId },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing</h1>
        <p className="text-gray-600">Campaign management, audience, content & revenue attribution</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-600">This Month Spend</p><p className="text-2xl font-bold">£0</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-600">New Leads</p><p className="text-2xl font-bold">0</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-600">Live Campaigns</p><p className="text-2xl font-bold">{campaigns.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-600">MQLs</p><p className="text-2xl font-bold">0</p></Card>
      </div>
    </div>
  );
}
