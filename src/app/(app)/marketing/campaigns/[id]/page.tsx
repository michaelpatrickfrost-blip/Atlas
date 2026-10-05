import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  await assertCapability(session, 'marketing.campaign.read');

  const campaign = await db.marketingCampaign.findUnique({
    where: { id: params.id },
  });

  if (!campaign || campaign.organisationId !== session.organisationId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-gray-600 mt-1">{campaign.objective}</p>
        </div>
        <span className={`px-4 py-2 rounded-full font-medium ${
          campaign.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {campaign.status}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Budget</p>
          <p className="text-2xl font-bold">£{(Number(campaign.budgetMinor || 0) / 100).toFixed(0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Audience</p>
          <p className="text-2xl font-bold">–</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pipeline</p>
          <p className="text-2xl font-bold">£0</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-2xl font-bold">£0</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-medium mb-4">Overview</h3>
          <p className="text-sm text-gray-600">Campaign details and metrics</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-medium mb-4">Performance</h3>
          <p className="text-sm text-gray-600">Leads, opportunities, revenue</p>
        </Card>
      </div>
    </div>
  );
}
