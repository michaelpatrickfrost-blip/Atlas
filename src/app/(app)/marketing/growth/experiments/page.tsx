import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { Button } from '@/components/ui/button';

export default async function ExperimentsPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.campaign.manage');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Experiments</h1>
      <Button>New Experiment</Button>
      <p className="text-gray-600">No experiments running</p>
    </div>
  );
}
