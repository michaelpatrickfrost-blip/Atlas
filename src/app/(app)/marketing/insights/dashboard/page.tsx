import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { Card } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.analytics.read');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Executive Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6"><p className="text-sm text-gray-600">Total Spend</p><p className="text-3xl font-bold">£0</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600">Pipeline</p><p className="text-3xl font-bold">£0</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600">Revenue Won</p><p className="text-3xl font-bold">£0</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600">Margin</p><p className="text-3xl font-bold">£0</p></Card>
      </div>
    </div>
  );
}
