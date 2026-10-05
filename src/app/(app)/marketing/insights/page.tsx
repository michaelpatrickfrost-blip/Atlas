import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/capabilities';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default async function InsightsPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.analytics.read');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Insights</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/marketing/insights/dashboard"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Executive Dashboard</h3></Card></Link>
        <Link href="/marketing/insights/attribution"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Attribution</h3></Card></Link>
        <Link href="/marketing/insights/funnel"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Funnel</h3></Card></Link>
        <Link href="/marketing/insights/reports"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Reports</h3></Card></Link>
      </div>
    </div>
  );
}
