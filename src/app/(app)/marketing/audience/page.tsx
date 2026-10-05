import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/capabilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function AudiencePage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.audience.read');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Audience</h1>
        <Link href="/marketing/audience/segments/new">
          <Button><Plus className="w-4 h-4 mr-2" />New Segment</Button>
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Link href="/marketing/audience/segments"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Segments</h3></Card></Link>
        <Link href="/marketing/audience/target-accounts"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Target Accounts</h3></Card></Link>
        <Link href="/marketing/audience/consent"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Consent</h3></Card></Link>
      </div>
    </div>
  );
}
