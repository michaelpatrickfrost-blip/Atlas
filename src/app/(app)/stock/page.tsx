import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function StockPage() {
  const session = await requireSession();
  await assertCapability(session, 'inventory.stock.read');

  const locations = await db.storeLocation.findMany({
    where: { organisationId: session.organisationId },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Management</h1>
        <Link href="/stock/adjust">
          <Button><Plus className="w-4 h-4 mr-2" />Adjust Stock</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/stock/levels">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg">Stock Levels</h3>
            <p className="text-sm text-gray-600 mt-1">View inventory by location</p>
          </Card>
        </Link>

        <Link href="/stock/adjustments">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg">Adjustments</h3>
            <p className="text-sm text-gray-600 mt-1">Stock gains & losses</p>
          </Card>
        </Link>

        <Link href="/stock/forecast">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg">Forecast</h3>
            <p className="text-sm text-gray-600 mt-1">Demand & supply projection</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
