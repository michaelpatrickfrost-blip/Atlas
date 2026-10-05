import { requireSession } from '@/core/auth/session';

export default async function AudiencePage() {
  await requireSession();
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Audience</h1><p className="text-gray-600">Build segments & target accounts</p></div>;
}
