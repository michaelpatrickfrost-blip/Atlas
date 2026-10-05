import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function DetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.read');

  const rule = await db.automation.findUnique({
    where: { id: params.id },
  });

  if (!rule || rule.organisationId !== session.organisationId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/automations">
        <Button variant="secondary"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </Link>

      <h1 className="text-3xl font-bold">{rule.name}</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6"><p className="text-sm text-gray-600">Status</p><p className={rule.enabled ? 'text-green-600' : 'text-gray-600'}>{ rule.enabled ? 'Enabled' : 'Disabled'}</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600">Errors</p><p className="text-2xl font-bold">{rule.failCount}</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600">Version</p><p className="text-2xl font-bold">{rule.version}</p></Card>
      </div>

      <Card className="p-6">
        <p className="text-sm text-gray-600">Automation rule details and execution history</p>
      </Card>
    </div>
  );
}
