import { requireSession } from '@/core/auth/session';

export default async function GrowthPage() {
  await requireSession();
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Growth</h1><p className="text-gray-600">Forms, pages, social & experiments</p></div>;
}
