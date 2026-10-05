import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AutomationsPage() {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.read');

  const rules = await db.automation.findMany({
    where: { organisationId: session.organisationId },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Automations</h1>
        <Link href="/automations/new"><Button>New Automation</Button></Link>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No automations yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{rule.name}</h3>
              <p className="text-sm text-gray-600">{rule.enabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
