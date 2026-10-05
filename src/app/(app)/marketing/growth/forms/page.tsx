import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { Button } from '@/components/ui/button';

export default async function FormsPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.form.manage');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Forms</h1>
      <Button>New Form</Button>
      <p className="text-gray-600">No forms created yet</p>
    </div>
  );
}
