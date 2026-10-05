import { requireSession } from '@/core/auth/session';

export default async function WorkspacePage({ params }: { params: { workspace: string } }) {
  await requireSession();
  return <div><h1 className="text-3xl font-bold capitalize">{params.workspace}</h1></div>;
}
