import Link from 'next/link';
import { requireSession } from '@/core/auth/session';
import { assertCapability, can } from '@/core/permissions/check';
import { getPlanningCoverage } from '@/modules/planning/services/queries';
import { DataTable } from '@/components/ui/table';
import { StatusPill } from '@/components/ui/status-pill';
function date(value:string|null){return value?new Date(value).toLocaleDateString('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric'}):'No required date';}
export default async function PlanningPage({searchParams}:{searchParams:Promise<{q?:string;view?:string;product?:string}>}) {
 const session=await requireSession();assertCapability(session,'planning.demand.read');
 const coverage=await getPlanningCoverage();
 const filters=await searchParams;
 const q=typeof filters.q==='string'?filters.q.trim().toLowerCase():'';
 const view=filters.view==='shortages'?'shortages':filters.view==='units'?'units':'';
 const productId=typeof filters.product==='string'?filters.product:'';
 const rows=coverage.filter(p=>(!q||`${p.name} ${p.code} ${p.orders.map(o=>o.reference).join(' ')}`.toLowerCase().includes(q))&&(!view||(view==='shortages'?p.shortage>0:p.unitConflicts>0)));
 const selected=coverage.find(p=>p.id===productId);
 const orderCount=new Set(coverage.flatMap(p=>p.orders.map(o=>o.orderId))).size;
 const today=new Date();const midnight=new Date(`${today.toLocaleDateString('en-CA',{timeZone:'Europe/London'})}T00:00:00Z`);
 const weeks=Array.from({length:4},(_,index)=>new Date(midnight.getTime()+index*7*86400000));
 return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[.14em] text-blue-600">Demand · stock · exceptions</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Production planner workbench</h2><p className="mt-1 text-sm text-slate-500">Start with customer demand. Find the products that need attention.</p></div><div className="flex flex-wrap gap-2"><a href={`/api/planning/export?${new URLSearchParams({q,view})}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium">Download CSV</a><Link href="/planning/plans" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white">Product plans →</Link></div></div>
 <div className="grid gap-3 sm:grid-cols-3">{[['Confirmed orders',orderCount],['Still short after planned production',coverage.filter(p=>p.shortage>0).length],['Products with unit conflicts',coverage.filter(p=>p.unitConflicts>0).length]].map(([label,value])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></div>)}</div>
 <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-slate-600"><strong className="font-medium text-slate-800">Availability includes planned production.</strong> Forecasted stock is on hand, plus the larger of the production plan and open production orders, minus confirmed demand still to deliver. Reservations and quality holds reduce it. A delivery raises the finance draft on that date. This view does not reserve stock or promise a date. Blanket agreements and orders on hold are excluded.</div>
 <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"><label className="min-w-48 flex-1 text-xs text-slate-500">Search demand<input name="q" defaultValue={q} placeholder="Product, SKU or sales order" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"/></label><label className="text-xs text-slate-500">Focus<select name="view" defaultValue={view} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">All demand</option><option value="shortages">Stock shortages</option><option value="units">Unit conflicts</option></select></label><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">Apply</button><Link href="/planning" className="px-2 py-2 text-sm text-slate-500">Reset</Link></form>
 <section><h3 className="mb-3 text-sm font-semibold">Demand and stock coverage</h3><DataTable rows={rows} getHref={p=>`/planning?product=${p.id}`} emptyLabel="No confirmed product demand matches this view. Confirm product-backed orders in Sales to see them here." columns={[
 {header:'Product',render:p=><div><p className="font-medium">{p.name}</p><p className="mt-1 text-xs text-slate-400">{p.code} · {p.unitOfMeasure}</p></div>},
 {header:'On hand',align:'right',render:p=>p.onHand.toLocaleString('en-GB')},
 {header:'Incoming',align:'right',render:p=>p.incoming.toLocaleString('en-GB')},
 {header:'Still to deliver',align:'right',render:p=>p.demand.toLocaleString('en-GB')},
 {header:'Forecasted stock',align:'right',render:p=><span className={p.forecasted<0?'font-semibold text-amber-700':'tabular-nums'}>{p.forecasted.toLocaleString('en-GB')}</span>},
 {header:'Still short',align:'right',render:p=><span className={p.shortage?'font-semibold text-amber-700':'text-slate-400'}>{p.shortage.toLocaleString('en-GB')}</span>},
 {header:'First required',render:p=>date(p.orders.find(o=>o.requiredDate)?.requiredDate??null)},
 {header:'Attention',render:p=><StatusPill label={p.unitConflicts?'Check units':p.shortage?'Still short':'Available'} tone={p.unitConflicts||p.shortage?'warning':'neutral'}/>},
 ]}/></section>
 {selected&&<section id="product-demand" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-slate-400">{selected.code}</p><h3 className="mt-1 text-lg font-semibold">{selected.name} · demand chain</h3></div><Link href={`/stock/items/${selected.id}`} className="text-xs font-medium text-blue-600">Stock and movements →</Link></div><p className="text-xs leading-5 text-slate-500">On hand {selected.onHand.toLocaleString('en-GB')} · incoming production {selected.incoming.toLocaleString('en-GB')} · forecasted stock {selected.forecasted.toLocaleString('en-GB')}. Physical stock is compared once, in earliest-required-date order, against what is still to deliver.</p><DataTable rows={selected.orders} emptyLabel="No confirmed demand for this product." columns={[
 {header:'Sales order',render:o=>can(session,'sales.order.read')?<Link href={`/sales/orders/${o.orderId}`} className="font-medium text-blue-600">{o.reference}</Link>:o.reference},
 {header:'Required',render:o=>date(o.requiredDate)},
 {header:'Quantity',align:'right',render:o=>`${o.quantity} ${o.unitOfMeasure}`},
 {header:'Physical coverage',align:'right',render:o=>o.compatible?o.covered:'Check units'},
 {header:'Shortage',align:'right',render:o=>o.shortage??'Unknown'},
 ]}/>{selected.unitConflicts>0&&<p className="text-xs text-amber-700">Some demand uses a different unit from {selected.unitOfMeasure}. Those lines are excluded from net quantities until a valid conversion is established.</p>}</section>}
 <section><h3 className="mb-1 text-sm font-semibold">Four-week demand outlook</h3><p className="mb-3 text-xs text-slate-500">Demand in the product’s stock unit; overdue demand is included in the first period. Undated and later demand remain in the total above.</p><DataTable rows={rows} emptyLabel="Dated product demand will appear here." columns={[{header:'Product',render:p=>`${p.code} · ${p.unitOfMeasure}`},...weeks.map((week,index)=>({header:week.toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'}),align:'right' as const,render:(p:typeof coverage[number])=>p.orders.filter(o=>o.compatible&&o.requiredDate&&(index===0||new Date(o.requiredDate)>=week)&&new Date(o.requiredDate).getTime()<week.getTime()+7*86400000).reduce((sum,o)=>sum+o.quantity,0).toLocaleString('en-GB')}))]}/></section>
 <p className="text-xs leading-5 text-slate-500">The same availability is on the sales order, the stock list and the product. Planned production counts once, even when an open production order already covers it.</p>
 </div>;
}
