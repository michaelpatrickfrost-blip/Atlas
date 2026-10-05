import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NewAutomationPage() {
  const session = await requireSession();
  await assertCapability(session, 'automations.rule.manage');

  return (
    <div className="space-y-6">
      <Link href="/automations"><Button variant="secondary">Back</Button></Link>
      <h1 className="text-3xl font-bold">Create Automation</h1>
      <p className="text-gray-600">Choose a template or build from scratch</p>
    </div>
  );
}
