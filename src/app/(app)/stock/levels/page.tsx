import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';

export default async function StockLevelsPage() {
  const session = await requireSession();
  await assertCapability(session, 'inventory.read');

  const positions = await db.stockPosition.findMany({
    where: { organisationId: session.organisationId },
    include: {
      product: { select: { code: true, name: true } },
      warehouse: { select: { name: true } },
      location: { select: { code: true } },
    },
    orderBy: { id: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Levels</h1>
        <p className="text-gray-600 mt-1">Current inventory by location and warehouse</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold mt-1">
            {positions.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Unique Products</p>
          <p className="text-2xl font-bold mt-1">{new Set(positions.map((p) => p.productId)).size}</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Warehouses</p>
          <p className="text-2xl font-bold mt-1">{new Set(positions.map((p) => p.warehouseId)).size}</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Locations</p>
          <p className="text-2xl font-bold mt-1">{new Set(positions.map((p) => p.locationId)).size}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Stock Positions</h2>
        {positions.length === 0 ? (
          <div className="p-6 border rounded text-center text-gray-600">
            <p>No stock positions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Warehouse</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-right p-3">Quantity</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr key={position.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{position.product.name}</p>
                        <p className="text-gray-600">{position.product.code}</p>
                      </div>
                    </td>
                    <td className="p-3">{position.warehouse.name}</td>
                    <td className="p-3 font-mono">{position.location.code}</td>
                    <td className="p-3 text-right font-mono">{position.quantity}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {position.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
