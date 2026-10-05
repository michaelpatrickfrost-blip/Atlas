export default function StockPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Stock Management</h1>
      <div className="grid grid-cols-3 gap-4">
        <a href="/stock/levels" className="block">
          <div className="p-6 border rounded hover:shadow-lg cursor-pointer transition">
            <h3 className="font-medium">Stock Levels</h3>
            <p className="text-sm text-gray-600">View current inventory across all locations</p>
          </div>
        </a>
        <a href="/stock/adjustments" className="block">
          <div className="p-6 border rounded hover:shadow-lg cursor-pointer transition">
            <h3 className="font-medium">Adjustments</h3>
            <p className="text-sm text-gray-600">Record manual stock movements</p>
          </div>
        </a>
        <a href="/stock/forecast" className="block">
          <div className="p-6 border rounded hover:shadow-lg cursor-pointer transition">
            <h3 className="font-medium">Forecast</h3>
            <p className="text-sm text-gray-600">AI-powered demand projection & reorder optimization</p>
          </div>
        </a>
      </div>
      <div className="p-6 border rounded bg-blue-50">
        <h2 className="font-semibold">Demand Forecasting</h2>
        <p className="text-sm text-gray-700 mt-2">
          Automatic stock forecasting uses exponential smoothing to predict demand and optimize safety stock levels.
          Reorder points are calculated based on lead time, average daily demand, and safety stock settings.
        </p>
      </div>
    </div>
  );
}
