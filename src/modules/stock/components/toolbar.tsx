import { CreateDialog } from '@/components/ui/create-dialog';
import { MovementForm } from './movement-form';
import type { InventorySnapshot } from '@/core/planning/types';
export function StockToolbar({snapshot,productId}:{snapshot:InventorySnapshot;productId?:string}) {
 if(!snapshot.products.some(p=>p.active)||!snapshot.warehouses.length)return <p className="text-sm text-slate-500">Add a warehouse and a product to start recording stock.</p>;
 return <div className="flex flex-wrap gap-2"><CreateDialog label="Record movement" title="Receive or adjust stock"><MovementForm {...snapshot} productId={productId}/></CreateDialog>{snapshot.warehouses.length>1&&<CreateDialog label="Move stock" title="Move between warehouses and yards" variant="secondary"><MovementForm {...snapshot} transfer productId={productId}/></CreateDialog>}</div>;
}
