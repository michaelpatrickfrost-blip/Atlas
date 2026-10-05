import { requireSession } from '@/core/auth/session';

export default async function StockPage() {
  const session = await requireSession();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Stock Management</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 border rounded"><h3 className="font-medium">Stock Levels</h3><p className="text-sm text-gray-600">View inventory</p></div>
        <div className="p-6 border rounded"><h3 className="font-medium">Adjustments</h3><p className="text-sm text-gray-600">Stock changes</p></div>
        <div className="p-6 border rounded"><h3 className="font-medium">Forecast</h3><p className="text-sm text-gray-600">Demand projection</p></div>
      </div>
    </div>
  );
}
