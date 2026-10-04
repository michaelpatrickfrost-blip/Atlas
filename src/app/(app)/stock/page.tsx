import Link from 'next/link';
import { db } from '@/core/db/client';
import { DataTable } from '@/components/ui/table';
import { StatusPill } from '@/components/ui/status-pill';
import { can } from '@/core/permissions/check';
import { readInventory } from '@/modules/stock/services/queries';
import { readAvailability } from '@/modules/stock/services/availability';
import { StockToolbar } from '@/modules/stock/components/toolbar';
import { placeLabel } from '@/modules/stock/domain/places';
import { categoryLabel } from '@/core/products/categories';
export default async function StockPage({searchParams}:{searchParams:Promise<{q?:string;warehouse?:string;state?:string}>}) {
 const [{session,...snapshot},chain]=await Promise.all([readInventory(),readAvailability()]);
 const available=new Map(chain.products.map(row=>[row.productId,row.available]));
 const categories=await db.productCategory.findMany({where:{organisationId:session.organisationId},select:{code:true,name:true}});
 const categoryName=new Map(categories.map(category=>[category.code,category.name]));
 const filters=await searchParams;
 const q=typeof filters.q==='string'?filters.q.trim().toLowerCase():'';
 const warehouse=typeof filters.warehouse==='string'?filters.warehouse:'';
 const state=filters.state==='empty'?'empty':filters.state==='stocked'?'stocked':'';
 const rows=snapshot.products.map(product=>{
  const balances=snapshot.balances.filter(b=>b.productId===product.id&&(!warehouse||b.warehouseId===warehouse));
  return {...product,quantity:balances.reduce((sum,b)=>sum+b.quantity,0),locations:balances.filter(b=>b.quantity>0).length};
 });
 const visible=rows.filter(p=>(!q||`${p.code} ${p.name} ${p.categoryCode??''} ${categoryName.get(p.categoryCode??'')??''}`.toLowerCase().includes(q))&&(!state||(state==='empty'?p.quantity===0:p.quantity>0)));
 const stocked=rows.filter(p=>p.quantity>0).length;
 return <div className="space-y-5">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight">Know what you have.</h2><p className="mt-1 text-sm text-slate-500">One product catalogue. Stock across every warehouse.</p></div><div className="flex flex-wrap gap-2"><a href={`/api/stock/export?${new URLSearchParams({q,warehouse,state})}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">Download CSV</a>{can(session,'stock.manage')&&<StockToolbar snapshot={snapshot}/>}</div></div>
  <div className="grid gap-3 sm:grid-cols-3">{[['Products with stock',stocked],['Without stock',rows.length-stocked],['Warehouses and yards',snapshot.warehouses.length]].map(([label,value])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></div>)}</div>
  <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"><label className="min-w-48 flex-1 text-xs text-slate-500">Search products<input name="q" defaultValue={q} placeholder="Product name or SKU" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"/></label><label className="text-xs text-slate-500">Warehouse<select name="warehouse" defaultValue={warehouse} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">All places</option>{snapshot.warehouses.map(w=><option key={w.id} value={w.id}>{placeLabel(w)}</option>)}</select></label><label className="text-xs text-slate-500">Stock state<select name="state" defaultValue={state} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">All products</option><option value="stocked">With stock</option><option value="empty">Without stock</option></select></label><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">Apply</button><Link href="/stock" className="px-2 py-2 text-sm text-slate-500">Reset</Link></form>
  <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">On-hand stock <span className="ml-2 font-normal text-slate-400">{visible.length} products</span></h3><span className="flex gap-4">{can(session,'core.products.read')&&<Link href="/products" className="text-xs font-medium text-blue-600">Open catalogue →</Link>}{can(session,'manufacturing.order.read')&&<Link href="/manufacturing/plant" className="text-xs font-medium text-blue-600">Plant and machines →</Link>}{can(session,'planning.demand.read')&&<Link href="/planning" className="text-xs font-medium text-blue-600">View production demand →</Link>}</span></div>
  <DataTable rows={visible} getHref={p=>`/stock/items/${p.id}`} emptyLabel={q||warehouse||state?'No products match these filters.':'Nothing is stocked yet. Add products in the Products catalogue.'} columns={[
   {header:'Product',render:p=><div><p className="font-medium">{p.name}</p><p className="mt-1 text-xs text-slate-400">{p.code}{p.itemClass?` · ${categoryLabel(p.itemClass)}`:''}{p.categoryCode?` · ${categoryName.get(p.categoryCode)??p.categoryCode}`:''}{!p.active?' · Archived':''}</p></div>},
   {header:'On hand',align:'right',render:p=><span className="font-semibold tabular-nums">{p.quantity.toLocaleString('en-GB')} <span className="font-normal text-slate-400">{p.unitOfMeasure}</span></span>},
   {header:'Available',align:'right',render:p=><span className={`tabular-nums ${(available.get(p.id)??0)<0?'font-semibold text-amber-700':''}`}>{(available.get(p.id)??p.quantity).toLocaleString('en-GB')}</span>},
   {header:'Warehouses with stock',align:'right',render:p=>p.locations},
   {header:'Stock state',render:p=><StatusPill label={p.quantity>0?'In stock':'No stock'} tone={p.quantity>0?'success':'neutral'}/>},
  ]}/>
  <p className="text-xs leading-5 text-slate-500">Available is on hand, plus planned production, minus confirmed demand still to deliver. An order placed without stock stays as that balance. When the product is received, Atlas raises the delivery and then the invoice. Reservations and quality holds reduce what can be picked. The same available figure is on the sales order and the production planner.</p>
 </div>;
}
