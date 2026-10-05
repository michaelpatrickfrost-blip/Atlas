import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewAutomationPage() {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.manage');

  const templates = [
    { name: 'Order Shipped → Invoice', trigger: 'logistics.shipment.delivered', action: 'create_invoice' },
    { name: 'Quote Accepted → Create Order', trigger: 'sales.quote.accepted', action: 'create_order' },
    { name: 'MQL Created → Notify Sales', trigger: 'crm.lead.created', action: 'notify_user' },
    { name: 'Invoice Posted → Send Email', trigger: 'finance.invoice.posted', action: 'send_email' },
  ];

  return (
    <div className="space-y-6">
      <Link href="/automations">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Create Automation</h1>
        <p className="text-gray-600">Choose a template or build from scratch</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.name} className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-4">When {template.trigger}</p>
            <Button variant="outline" size="sm">Use Template</Button>
          </Card>
        ))}
      </div>

      <Button>Build Custom Rule</Button>
    </div>
  );
}
