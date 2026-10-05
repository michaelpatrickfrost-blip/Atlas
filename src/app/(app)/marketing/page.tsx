import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';

export default async function MarketingPage() {
  const session = await requireSession();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Marketing</h1>
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded"><p className="text-sm text-gray-600">Spend</p><p className="font-bold">£0</p></div>
        <div className="p-4 border rounded"><p className="text-sm text-gray-600">Leads</p><p className="font-bold">0</p></div>
        <div className="p-4 border rounded"><p className="text-sm text-gray-600">Campaigns</p><p className="font-bold">0</p></div>
        <div className="p-4 border rounded"><p className="text-sm text-gray-600">MQLs</p><p className="font-bold">0</p></div>
      </div>
    </div>
  );
}
