import { requireSession } from '@/core/auth/session';

export default async function ContentPage() {
  await requireSession();
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Content</h1><p className="text-gray-600">Manage assets & launches</p></div>;
}
