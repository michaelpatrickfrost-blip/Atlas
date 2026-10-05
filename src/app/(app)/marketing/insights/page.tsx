import { requireSession } from '@/core/auth/session';

export default async function InsightsPage() {
  await requireSession();
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Insights</h1><p className="text-gray-600">Marketing performance & revenue</p></div>;
}
