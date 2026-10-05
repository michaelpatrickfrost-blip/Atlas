import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { Card } from '@/components/ui/card';

export default async function Page() {
  const session = await requireSession();
  await assertCapability(session, 'finance.read');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold capitalize">accounting</h1>
      <Card className="p-6">
        <p className="text-gray-600">accounting section</p>
      </Card>
    </div>
  );
}
