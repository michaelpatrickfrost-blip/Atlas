import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';

export default async function AdjustmentsPage() {
  const session = await requireSession();
  await assertCapability(session, 'inventory.write');

  // Placeholder data - live queries will be added after schema stabilization
  const movements: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Adjustments</h1>
        <p className="text-gray-600 mt-1">Record and track manual inventory adjustments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Total Adjustments</p>
          <p className="text-2xl font-bold mt-1">{movements.length}</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Total Quantity Changed</p>
          <p className="text-2xl font-bold mt-1">
            {movements.reduce((sum, m) => sum + m.delta, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Products Touched</p>
          <p className="text-2xl font-bold mt-1">{new Set(movements.map((m) => m.productId)).size}</p>
        </div>
      </div>

      <div className="p-4 border rounded bg-blue-50">
        <h3 className="font-semibold text-sm">Create New Adjustment</h3>
        <p className="text-sm text-gray-600 mt-1">Coming soon: Form to record stock adjustments by location</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Adjustments</h2>
        {movements.length === 0 ? (
          <div className="p-6 border rounded text-center text-gray-600">
            <p>No stock adjustments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-right p-3">Quantity</th>
                  <th className="text-left p-3">Reason</th>
                  <th className="text-left p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{movement.product.name}</p>
                        <p className="text-gray-600">{movement.product.code}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          movement.delta > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {movement.delta > 0 ? 'Addition' : 'Reduction'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{Math.abs(movement.delta)}</td>
                    <td className="p-3">{movement.reason || '—'}</td>
                    <td className="p-3 text-gray-600">{movement.createdAt.toLocaleDateString()}</td>
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
