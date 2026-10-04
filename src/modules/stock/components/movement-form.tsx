'use client';
import { useRef } from 'react';
import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { adjustStock, transferStock } from '@/app/(app)/stock/actions';
import { placeLabel } from '@/modules/stock/domain/places';
import type { InventorySnapshot } from '@/core/planning/types';
const input='mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';
export function MovementForm({products,warehouses,transfer=false,productId}:{products:InventorySnapshot['products'];warehouses:InventorySnapshot['warehouses'];transfer?:boolean;productId?:string}) {
 const key=useRef<string|null>(null);
 async function submit(form:FormData) {
  key.current??=crypto.randomUUID();form.set('requestKey',key.current);
  await (transfer?transferStock:adjustStock)(form);
  key.current=null;
 }
 return <ActionForm action={submit} className="space-y-4">
  <label className="block text-xs font-medium">Product<select name="productId" defaultValue={productId??''} required className={input}><option value="">Choose product</option>{products.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.code} · {p.name} ({p.unitOfMeasure})</option>)}</select></label>
  <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium">{transfer?'From':'Place'}<select name={transfer?'fromWarehouseId':'warehouseId'} required className={input}><option value="">Choose a warehouse or yard</option>{warehouses.map(w=><option key={w.id} value={w.id}>{placeLabel(w)}</option>)}</select></label>{transfer&&<label className="block text-xs font-medium">To<select name="toWarehouseId" required className={input}><option value="">Choose a warehouse or yard</option>{warehouses.map(w=><option key={w.id} value={w.id}>{placeLabel(w)}</option>)}</select></label>}</div>
  <label className="block text-xs font-medium">{transfer?'Quantity to move':'Quantity change'}<input name={transfer?'quantity':'delta'} type="number" step="1" min={transfer?1:-1000000} max={1000000} required className={input}/></label>
  <p className="text-xs leading-5 text-slate-500">{transfer?'A move inside one site arrives now. A move to another site leaves the source and stays in transit until that warehouse or yard receives it.':'Enter a positive quantity for a receipt or a negative quantity for an issue. A receipt that covers an order waiting for stock raises the delivery, then the invoice. Quantities use the product’s stock unit; adjustments cannot create negative stock.'}</p>
  <label className="block text-xs font-medium">Reason<input name="reason" required maxLength={1000} className={input}/></label>
  <label className="block text-xs font-medium">Reference<input name="reference" maxLength={150} placeholder="Delivery, count or transfer reference" className={input}/></label>
  <Button type="submit" variant="primary">{transfer?'Move stock':'Record movement'}</Button>
 </ActionForm>;
}
