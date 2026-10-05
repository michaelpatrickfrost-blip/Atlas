import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';

export default async function ForecastPage() {
  const session = await requireSession();
  await assertCapability(session, 'inventory.read');

  // Placeholder - forecasts will be populated when migrations run
  const forecasts: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Forecast</h1>
        <p className="text-gray-600 mt-1">Demand predictions and reorder point optimization</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Total Forecasts</p>
          <p className="text-2xl font-bold mt-1">{forecasts.length}</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Avg Confidence</p>
          <p className="text-2xl font-bold mt-1">
            {forecasts.length > 0
              ? Math.round(
                  forecasts.reduce((acc, f) => acc + f.confidence, 0) / forecasts.length
                )
              : 0}
            %
          </p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Last 30 Days</p>
          <p className="text-2xl font-bold mt-1">
            {forecasts.filter((f) => {
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return f.createdAt >= thirtyDaysAgo;
            }).length}
          </p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Forecast Method</p>
          <p className="text-lg font-bold mt-1">Exponential Smoothing</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Forecasts</h2>
        {forecasts.length === 0 ? (
          <div className="p-6 border rounded text-center text-gray-600">
            <p>No forecasts available yet.</p>
            <p className="text-sm mt-2">Run forecasts from the Stock Levels page for individual products.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Forecast Date</th>
                  <th className="text-right p-3">Quantity</th>
                  <th className="text-center p-3">Confidence</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-left p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((forecast) => (
                  <tr key={forecast.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{forecast.product.name}</p>
                        <p className="text-gray-600">{forecast.product.code}</p>
                      </div>
                    </td>
                    <td className="p-3">{forecast.forecastDate.toLocaleDateString()}</td>
                    <td className="p-3 text-right font-mono">{forecast.quantity}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {forecast.confidence}%
                      </span>
                    </td>
                    <td className="p-3">{forecast.method}</td>
                    <td className="p-3 text-gray-600">{forecast.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-6 border rounded bg-amber-50">
        <h3 className="font-semibold">How Forecasting Works</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
          <li>Exponential smoothing analyzes historical demand patterns</li>
          <li>Reorder point = (Forecasted Demand × Lead Time) + Safety Stock</li>
          <li>Confidence increases with more historical data points</li>
          <li>Update product lead time and safety stock settings to improve accuracy</li>
        </ul>
      </div>
    </div>
  );
}
