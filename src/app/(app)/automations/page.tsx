import { requireSession } from '@/core/auth/session';

export default async function AutomationsPage() {
  const session = await requireSession();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Automations</h1>
      <p className="text-gray-600">No automations yet</p>
    </div>
  );
}
