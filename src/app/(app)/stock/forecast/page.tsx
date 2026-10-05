import { ExportMenu } from '@/components/ui/export-menu';
import Link from 'next/link';
import { requireSession } from '@/core/auth/session';
import { can } from '@/core/permissions/check';
import { DataTable } from '@/components/ui/table';
import { StatusPill } from '@/components/ui/status-pill';
import { CreateDialog } from '@/components/ui/create-dialog';
import { readStockForecast, USAGE_WINDOW_DAYS } from '@/modules/stock/services/forecast';
import { ORDER_COVER_DAYS, type ForecastState } from '@/modules/stock/domain/forecast';
import { PlanningForm } from '@/modules/stock/components/planning-form';
import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { makeFromForecastAction } from '../actions';
const sources={plan:'Production forecast',set:'Set by you',history:'From history',none:'No usage yet'};
const made=(supply:string)=>supply!=='BUY';
const field='mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';
const states:Record<ForecastState,{label:string;tone:'danger'|'warning'|'success'|'neutral'}>={ORDER_NOW:{label:'Order now',tone:'danger'},ORDER_SOON:{label:'Order soon',tone:'warning'},COVERED:{label:'Covered',tone:'success'},NO_USAGE:{label:'No usage yet',tone:'neutral'}};
const order:ForecastState[]=['ORDER_NOW','ORDER_SOON','COVERED','NO_USAGE'];
const whole=(value:number)=>Math.round(value).toLocaleString('en-GB');
const day=(value:string)=>new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export default async function ForecastPage({searchParams}:{searchParams:Promise<{q?:string;state?:string}>}) {
 const [session,rows,filters]=await Promise.all([requireSession(),readStockForecast(),searchParams]);
 const manage=can(session,'stock.manage'),make=can(session,'manufacturing.order.create'),buy=can(session,'finance.purchase.create')||can(session,'finance.overview.read'),plan=can(session,'manufacturing.plan.read');
 const due=(days:number)=>new Date(Date.now()+days*86_400_000).toISOString().slice(0,10);
 const q=typeof filters.q==='string'?filters.q.trim().toLowerCase():'';
 const state=order.find(value=>value===filters.state)??'';
 const visible=rows.filter(row=>(!q||`${row.code} ${row.name}`.toLowerCase().includes(q))&&(!state||row.state===state)).sort((a,b)=>order.indexOf(a.state)-order.indexOf(b.state)||(a.daysOfCover??Infinity)-(b.daysOfCover??Infinity));
 const count=(value:ForecastState)=>rows.filter(row=>row.state===value).length;
 return <div className="space-y-5">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight">See what runs out, and when.</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Usage is what left stock in the last {USAGE_WINDOW_DAYS} days, unless you set a monthly figure. Set safety stock and lead time on a product to get a reorder point.</p></div><ExportMenu href={`/api/stock/export?${new URLSearchParams({type:'forecast',q,state})}`}/></div>
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{order.map(value=><Link key={value} href={state===value?'/stock/forecast':`/stock/forecast?state=${value}`} className={`rounded-2xl border bg-white p-5 transition hover:border-blue-300 ${state===value?'border-blue-500 ring-2 ring-blue-100':'border-slate-200'}`}><p className="text-xs text-slate-500">{states[value].label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{count(value)}</p></Link>)}</div>
  <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"><label className="min-w-48 flex-1 text-xs text-slate-500">Search products<input name="q" defaultValue={q} placeholder="Product name or SKU" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"/></label><label className="text-xs text-slate-500">Cover<select name="state" defaultValue={state} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">All products</option>{order.map(value=><option key={value} value={value}>{states[value].label}</option>)}</select></label><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">Apply</button><Link href="/stock/forecast" className="px-2 py-2 text-sm text-slate-500">Reset</Link></form>
  <DataTable rows={visible} getHref={row=>`/stock/items/${row.id}`} emptyLabel={q||state?'No products match these filters.':'No products yet. Add products in the Products catalogue.'} columns={[
   {header:'Product',render:row=><div><p className="font-medium">{row.name}</p><p className="mt-1 text-xs text-slate-400">{row.code} · {row.unit} · {made(row.supply)?'Made here':'Bought in'}</p></div>},
   {header:'Available',align:'right',render:row=><span className={`tabular-nums ${row.available<0?'font-semibold text-red-700':'font-semibold'}`}>{whole(row.available)}<span className="mt-1 block text-xs font-normal text-slate-400">{whole(row.onHand)} on hand{row.incoming?` · ${whole(row.incoming)} coming`:''}{row.productionNeed?` · ${whole(row.productionNeed)} for production`:''}</span></span>},
   {header:'Usage a month',align:'right',render:row=><span className="tabular-nums">{row.usageSource==='none'?'—':whole(row.dailyUsage*30)}<span className="mt-1 block text-xs text-slate-400">{sources[row.usageSource]}</span></span>},
   {header:'Cover',align:'right',render:row=>row.daysOfCover==null?'—':<span className="tabular-nums">{row.daysOfCover>365?'Over a year':`${whole(Math.floor(row.daysOfCover))} days`}<span className="mt-1 block text-xs text-slate-400">{row.runsOutOn&&row.daysOfCover<=365?`Runs out ${day(row.runsOutOn)}`:''}</span></span>},
   {header:'Reorder at',align:'right',render:row=><span className="tabular-nums">{row.reorderPoint?whole(row.reorderPoint):'—'}<span className="mt-1 block text-xs text-slate-400">{row.leadTimeDays?`${row.leadTimeDays} day lead`:'No lead time'}{row.safetyStock?` · ${whole(row.safetyStock)} safety`:''}</span></span>},
   {header:'Suggested order',align:'right',render:row=>row.suggestedOrder?<span className="inline-flex items-center gap-3"><span className="font-semibold tabular-nums">{whole(row.suggestedOrder)}</span>{made(row.supply)?make&&<CreateDialog label="Make" title={`Make ${row.name}`}><ActionForm action={makeFromForecastAction}><div className="space-y-4"><input type="hidden" name="productId" value={row.id}/><p className="text-sm text-slate-600">Raises a planned production order. Components and work orders follow from the recipe when it is released.</p><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium">Quantity ({row.unit})<input name="quantity" type="number" min={1} step={1} defaultValue={row.suggestedOrder} required className={field}/></label><label className="block text-xs font-medium">Needed by<input name="requiredDate" type="date" defaultValue={due(row.leadTimeDays||5)} className={field}/></label></div><Button type="submit" variant="primary">Create production order</Button></div></ActionForm></CreateDialog>:buy&&<Link href={`/finance/documents/new?kind=PO&product=${row.id}&quantity=${row.suggestedOrder}`} className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700">Buy</Link>}</span>:'—'},
   {header:'Status',render:row=><StatusPill label={states[row.state].label} tone={states[row.state].tone}/>},
   ...(manage?[{header:'',align:'right' as const,render:(row:typeof visible[number])=><CreateDialog label="Edit" title={`Planning · ${row.name}`} variant="secondary"><PlanningForm productId={row.id} unit={row.unit} safetyStock={row.safetyStock} leadTimeDays={row.leadTimeDays} monthlyUsage={row.monthlyUsage} historyMonthly={row.usageSource==='history'?Math.round(row.dailyUsage*30):0}/></CreateDialog>}]:[]),
  ]}/>
  <p className="text-xs leading-5 text-slate-500">Available is on hand, plus planned production, minus confirmed demand still to deliver. Cover is available divided by daily usage. Reorder at is usage across the lead time plus safety stock. A suggested order brings the product back to the lead time plus {ORDER_COVER_DAYS} days of usage plus safety stock. Moves between places and stock-count corrections are not counted as usage. Stock needed by open production orders is taken off available. A figure in the production forecast for this month replaces usage; otherwise your expected usage a month does, and both are demand in the production planner (MRP), which reads the same safety stock and lead time.{plan&&<> <Link href="/manufacturing/plan" className="font-medium text-blue-600">Open the production plan →</Link></>}</p>
 </div>;
}
