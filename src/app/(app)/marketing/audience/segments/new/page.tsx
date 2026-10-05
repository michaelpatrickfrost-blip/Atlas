import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewSegmentPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.audience.manage');

  return (
    <div className="space-y-6">
      <Link href="/marketing/audience/segments">
        <Button variant="secondary"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </Link>
      <h1 className="text-3xl font-bold">Build Audience Segment</h1>
      <form className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Segment Name</label>
          <input type="text" placeholder="e.g., Dormant High-Value Customers" className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base Audience</label>
          <select className="w-full px-3 py-2 border rounded">
            <option>Customers</option>
            <option>Leads</option>
            <option>Prospects</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select className="w-full px-3 py-2 border rounded">
            <option>Dynamic (updates as data changes)</option>
            <option>Static (fixed membership)</option>
            <option>Snapshot (historical)</option>
          </select>
        </div>
        <div className="border-t pt-4">
          <p className="font-medium mb-3">Rules</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <select className="flex-1 px-3 py-2 border rounded"><option>Last Order</option></select>
              <select className="w-24 px-3 py-2 border rounded"><option>is more than</option></select>
              <input type="text" placeholder="90" className="w-20 px-3 py-2 border rounded" />
              <select className="w-24 px-3 py-2 border rounded"><option>days ago</option></select>
            </div>
          </div>
        </div>
        <Button>Create Segment</Button>
      </form>
    </div>
  );
}
