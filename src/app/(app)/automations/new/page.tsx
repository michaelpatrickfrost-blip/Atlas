import { requireSession } from '@/core/auth/session';

export default async function NewPage() {
  await requireSession();
  return <div><h1 className="text-3xl font-bold">Create Automation</h1></div>;
}
