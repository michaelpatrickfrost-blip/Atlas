import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Edit2 } from 'lucide-react';

export default async function AutomationsPage() {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.read');

  const rules = await db.automation.findMany({
    where: { organisationId: session.organisationId },
    orderBy: { createdAt: 'desc' },
    include: {
      runs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const triggerLabels: Record<string, string> = {
    'sales.order.confirmed': 'Order Confirmed',
    'sales.quote.accepted': 'Quote Accepted',
    'finance.invoice.posted': 'Invoice Posted',
    'crm.lead.created': 'Lead Created',
    'logistics.shipment.delivered': 'Shipment Delivered',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-gray-600 mt-1">Set up business rules to automate repetitive tasks</p>
        </div>
        <Link href="/automations/new">
          <Button><Plus className="w-4 h-4 mr-2" />New Automation</Button>
        </Link>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No automations yet. Create one to get started.</p>
          <Link href="/automations/new"><Button>Create First Automation</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{rule.name}</h3>
                  <p className="text-sm text-gray-600">
                    When <span className="font-mono">{triggerLabels[rule.trigger] || rule.trigger}</span>
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded font-medium ${
                  rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex gap-2">
                <Link href={`/automations/${rule.id}`}>
                  <Button variant="outline" size="sm"><Edit2 className="w-4 h-4 mr-1" />Edit</Button>
                </Link>
                <Link href={`/automations/${rule.id}/runs`}>
                  <Button variant="outline" size="sm">History</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
