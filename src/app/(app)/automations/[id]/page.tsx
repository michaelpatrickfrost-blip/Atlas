import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, Edit2 } from 'lucide-react';

export default async function AutomationDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.read');

  const rule = await db.automation.findUnique({
    where: { id: params.id },
    include: { runs: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });

  if (!rule || rule.organisationId !== session.organisationId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/automations">
        <Button variant="secondary"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{rule.name}</h1>
          <p className="text-gray-600 mt-1">Automation rule</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/automations/${rule.id}/runs`}>
            <Button><Play className="w-4 h-4 mr-2" />History</Button>
          </Link>
          <Button><Edit2 className="w-4 h-4 mr-2" />Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="font-medium mb-2">Status</h3>
          <p className={`px-2 py-1 text-xs rounded font-medium w-fit ${
            rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {rule.enabled ? 'Enabled' : 'Disabled'}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-medium mb-2">Runs</h3>
          <p className="text-2xl font-bold">{rule.successCount}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-medium mb-2">Errors</h3>
          <p className="text-2xl font-bold">{rule.failCount}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-medium mb-4">When</h3>
        <p className="text-sm text-gray-600">Trigger: {rule.trigger || 'Not configured'}</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-medium mb-4">If</h3>
        <p className="text-sm text-gray-600">Conditions: {rule.conditions ? 'Configured' : 'Not configured'}</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-medium mb-4">Then</h3>
        <p className="text-sm text-gray-600">Actions: {rule.version > 0 ? 'Configured' : 'Not configured'}</p>
      </Card>

      {rule.runs.length > 0 && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">Recent Runs</h3>
          <div className="space-y-2">
            {rule.runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <span>{run.createdAt.toLocaleString()}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  run.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
