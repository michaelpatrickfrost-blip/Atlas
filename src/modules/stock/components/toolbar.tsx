import Link from 'next/link';
import { CreateDialog } from '@/components/ui/create-dialog';
import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { createPlaceAction } from '@/app/(app)/stock/actions';
import { MovementForm } from './movement-form';
import type { InventorySnapshot } from '@/core/planning/types';
const field='mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';
/** Stock actions. With nothing set up it offers the next step, never a dead end. */
export function StockToolbar({snapshot,productId}:{snapshot:InventorySnapshot;productId?:string}) {
 if(!snapshot.warehouses.length)return <CreateDialog label="Add a warehouse" title="Add your first warehouse or yard"><ActionForm action={createPlaceAction}><div className="space-y-4"><p className="text-sm text-slate-600">Stock is held in a warehouse or yard. Add one, then add stock to it.</p><label className="block text-xs font-medium">Kind<select name="kind" className={field}><option value="WAREHOUSE">Warehouse</option><option value="YARD">Yard</option></select></label><input type="hidden" name="siteId" value=""/><label className="block text-xs font-medium">Name<input name="name" required maxLength={150} placeholder="Main warehouse" className={field}/></label><label className="block text-xs font-medium">Code<input name="code" required maxLength={20} placeholder="MAIN" className={field}/></label><Button type="submit" variant="primary">Add warehouse</Button></div></ActionForm></CreateDialog>;
 if(!snapshot.products.some(p=>p.active))return <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Add a product</Link>;
 const form={products:snapshot.products,warehouses:snapshot.warehouses,balances:snapshot.balances,productId};
 return <div className="flex flex-wrap gap-2">
  <CreateDialog label="Add stock" title="Add stock"><MovementForm {...form} mode="add"/></CreateDialog>
  <CreateDialog label="Remove stock" title="Remove stock" variant="secondary"><MovementForm {...form} mode="remove"/></CreateDialog>
  <CreateDialog label="Stock count" title="Record a stock count" variant="secondary"><MovementForm {...form} mode="count"/></CreateDialog>
  {snapshot.warehouses.length>1&&<CreateDialog label="Move stock" title="Move between warehouses and yards" variant="secondary"><MovementForm {...form} mode="transfer"/></CreateDialog>}
 </div>;
}
