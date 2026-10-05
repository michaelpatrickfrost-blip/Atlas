import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/capabilities';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default async function GrowthPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.campaign.read');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Growth</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/marketing/growth/forms"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Forms</h3></Card></Link>
        <Link href="/marketing/growth/pages"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Landing Pages</h3></Card></Link>
        <Link href="/marketing/growth/social"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Social</h3></Card></Link>
        <Link href="/marketing/growth/experiments"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Experiments</h3></Card></Link>
      </div>
    </div>
  );
}
