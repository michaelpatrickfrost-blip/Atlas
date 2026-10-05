import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewCampaignPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.campaign.manage');

  return (
    <div className="space-y-6">
      <Link href="/marketing/campaigns">
        <Button variant="secondary"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </Link>
      <h1 className="text-3xl font-bold">Create Campaign</h1>
      <form className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Name</label>
          <input type="text" placeholder="e.g., Q4 Growth Campaign" className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Objective</label>
          <textarea placeholder="What are you trying to achieve?" rows={3} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select className="w-full px-3 py-2 border rounded">
            <option>PLANNED</option>
            <option>LIVE</option>
            <option>PAUSED</option>
            <option>COMPLETED</option>
          </select>
        </div>
        <Button>Create Campaign</Button>
      </form>
    </div>
  );
}
