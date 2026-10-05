import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/capabilities';
import { db } from '@/core/db/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function CampaignsPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.campaign.read');

  const campaigns = await db.marketingCampaign.findMany({
    where: { organisationId: session.organisationId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-600">Create & manage marketing campaigns</p>
        </div>
        <Link href="/marketing/campaigns/new">
          <Button><Plus className="w-4 h-4 mr-2" />New Campaign</Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No campaigns yet. Create one.</p>
          <Link href="/marketing/campaigns/new">
            <Button>Create First Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/marketing/campaigns/${campaign.id}`}>
              <Card className="p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{campaign.name}</h3>
                    {campaign.objective && <p className="text-sm text-gray-600 mt-1">{campaign.objective}</p>}
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    campaign.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
