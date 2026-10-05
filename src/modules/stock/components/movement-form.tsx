'use client';
import { useRef, useState } from 'react';
import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { adjustStock, transferStock } from '@/app/(app)/stock/actions';
import { placeLabel } from '@/modules/stock/domain/places';
import type { InventorySnapshot } from '@/core/planning/types';
const input='mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';
export type MovementMode='add'|'remove'|'count'|'transfer';
const copy:Record<MovementMode,{quantity:string;submit:string;help:string;reason:string}>={
 add:{quantity:'Quantity received',submit:'Add stock',help:'Adds to what is on hand here. A receipt that covers an order waiting for stock raises the delivery, then the invoice.',reason:'Reason (optional)'},
 remove:{quantity:'Quantity to remove',submit:'Remove stock',help:'Takes stock off the books: damaged, used, scrapped or written off. Stock cannot go below zero.',reason:'Reason'},
 count:{quantity:'Counted quantity',submit:'Save count',help:'Enter what is physically there. Atlas posts the difference as a correction and keeps the count in the ledger.',reason:'Note (optional)'},
 transfer:{quantity:'Quantity to move',submit:'Move stock',help:'A move inside one site arrives now. A move to another site leaves the source and stays in transit until that warehouse or yard receives it.',reason:'Reason'},
};
export function MovementForm({products,warehouses,balances,mode='add',productId}:{products:InventorySnapshot['products'];warehouses:InventorySnapshot['warehouses'];balances:InventorySnapshot['balances'];mode?:MovementMode;productId?:string}) {
 const key=useRef<string|null>(null),transfer=mode==='transfer',text=copy[mode];
 const live=products.filter(p=>p.active),firstProduct=productId??(live.length===1?live[0].id:''),firstPlace=warehouses.length===1?warehouses[0].id:'';
 const [product,setProduct]=useState(firstProduct),[place,setPlace]=useState(firstPlace);
 const chosen=products.find(p=>p.id===product),onHand=product&&place?balances.find(b=>b.productId===product&&b.warehouseId===place)?.quantity??0:null;
 async function submit(form:FormData) {
  key.current??=crypto.randomUUID();form.set('requestKey',key.current);
  if(!transfer)form.set('mode',mode);
  await (transfer?transferStock:adjustStock)(form);
  key.current=null;setProduct(firstProduct);setPlace(firstPlace);
 }
 return <ActionForm action={submit}><div className="space-y-4">
  <label className="block text-xs font-medium">Product<select name="productId" defaultValue={firstProduct} onChange={event=>setProduct(event.target.value)} required className={input}><option value="">Choose product</option>{products.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.code} · {p.name} ({p.unitOfMeasure})</option>)}</select></label>
  <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium">{transfer?'From':'Warehouse or yard'}<select name={transfer?'fromWarehouseId':'warehouseId'} defaultValue={firstPlace} onChange={event=>setPlace(event.target.value)} required className={input}><option value="">Choose a warehouse or yard</option>{warehouses.map(w=><option key={w.id} value={w.id}>{placeLabel(w)}</option>)}</select></label>{transfer&&<label className="block text-xs font-medium">To<select name="toWarehouseId" required className={input}><option value="">Choose a warehouse or yard</option>{warehouses.filter(w=>w.id!==place).map(w=><option key={w.id} value={w.id}>{placeLabel(w)}</option>)}</select></label>}</div>
  {onHand!=null&&<p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">On hand here now: <span className="font-semibold tabular-nums text-slate-900">{onHand.toLocaleString('en-GB')}</span> {chosen?.unitOfMeasure}</p>}
  <label className="block text-xs font-medium">{text.quantity}<input name="quantity" type="number" step="1" min={mode==='count'?0:1} max={mode==='remove'||transfer?Math.max(1,onHand??1000000):1000000} required className={input}/></label>
  <p className="text-xs leading-5 text-slate-500">{text.help}</p>
  <label className="block text-xs font-medium">{text.reason}<input name="reason" required={mode==='remove'||transfer} maxLength={1000} placeholder={mode==='add'?'Stock received':mode==='count'?'Who counted, or why':''} className={input}/></label>
  <label className="block text-xs font-medium">Reference (optional)<input name="reference" maxLength={150} placeholder="Delivery note, count sheet or transfer reference" className={input}/></label>
  <Button type="submit" variant="primary">{text.submit}</Button>
 </div></ActionForm>;
}
