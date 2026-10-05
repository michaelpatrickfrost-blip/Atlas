import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default async function ContentPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.content.read');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Content & Product Marketing</h1>
      <div className="grid grid-cols-3 gap-4">
        <Link href="/marketing/content/library"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Library</h3></Card></Link>
        <Link href="/marketing/content/launches"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Launches</h3></Card></Link>
        <Link href="/marketing/content/brand"><Card className="p-6 hover:shadow-lg transition cursor-pointer"><h3 className="font-medium text-lg">Brand</h3></Card></Link>
      </div>
    </div>
  );
}
