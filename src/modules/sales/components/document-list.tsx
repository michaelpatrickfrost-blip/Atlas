import {prepareSalesFilters} from '../services/account-filters';
import Link from 'next/link';
import type {Prisma} from '@/generated/prisma/client';
import {requireSession} from '@/core/auth/session';
import {assertCapability,can} from '@/core/permissions/check';
import {db} from '@/core/db/client';
import {formatMoney} from '@/core/shared/money';
import {DataTable} from '@/components/ui/table';
import {SalesFilterBar} from './sales-filters';
import {orderWhere,quoteWhere,type SalesFilters} from '../services/list-filters';
import {selectedColumns} from '../services/view-definition';
export async function DocumentList({mode,filters}:{mode:'quote'|'order'|'document';filters:SalesFilters}){
 const session=await requireSession();
 if(mode==='document'){assertCapability(session,'sales.order.read');}else{assertCapability(session,mode==='quote'?'sales.quote.read':'sales.order.read');}
 const organisationId=session.organisationId,page=Math.max(1,Math.min(10000,Math.floor(Number(filters.page)||1)));
 let error='',where:Prisma.SalesOrderWhereInput={organisationId,id:'invalid-filter'},qw:Prisma.QuoteWhereInput={organisationId,id:'invalid-filter'};
 try{const effective=await prepareSalesFilters(organisationId,filters);if(mode==='order'||mode==='document')where=orderWhere(organisationId,effective);if(mode==='quote'||mode==='document')qw=quoteWhere(organisationId,effective);}catch(e){error=e instanceof Error?e.message:'Check your filter rules.';}
 const [orders,quotes,orderCount,quoteCount,customers,members,tagRows,views,workingDrafts]=await Promise.all([
 mode!=='quote'?db.salesOrder.findMany({where,include:{party:true,pricingParty:true,_count:{select:{lines:true}}},orderBy:{updatedAt:'desc'},take:50,skip:(page-1)*50}):[],
 mode!=='order'?db.quote.findMany({where:qw,include:{party:true,pricingParty:true,_count:{select:{lines:true}}},orderBy:{updatedAt:'desc'},take:50,skip:(page-1)*50}):[],
 mode!=='quote'?db.salesOrder.count({where}):0,
 mode!=='order'?db.quote.count({where:qw}):0,
 db.party.findMany({where:{organisationId,identityScrubbed:false},select:{id:true,name:true},orderBy:{name:'asc'}}),db.membership.findMany({where:{organisationId},include:{user:{select:{id:true,name:true}}}}),
 Promise.all([db.salesOrder.findMany({where:{organisationId},select:{tags:true,currency:true},distinct:['tags','currency']}),db.quote.findMany({where:{organisationId},select:{tags:true,totalCurrency:true},distinct:['tags','totalCurrency']})]).then(([o,q])=>[...o,...q]),
 mode!=='quote'?db.salesSavedView.findMany({where:{organisationId,ownerUserId:session.userId,mode:'order',archived:false},orderBy:{name:'asc'}}):[],
 mode==='quote'?db.salesWorkingDraft.findMany({where:{organisationId,ownerUserId:session.userId,archived:false},orderBy:{updatedAt:'desc'},take:30}):[]]);
 const count=orderCount+quoteCount;
 const names=new Map(members.map(m=>[m.userId,m.user.name]));
 const rows=[...orders.map(o=>({id:o.id,reference:o.reference,docType:'Order' as const,orderType:o.orderType as string|null,customer:o.party.name,customerDeleted:o.party.identityScrubbed,customerType:o.party.customerGroup,pricingCustomer:o.pricingParty?.name??o.party.name,partyId:o.partyId,status:o.commercialStatus,total:o.grossAmount,net:o.netAmount,tax:o.taxAmount,currency:o.currency,po:o.customerPoReference,external:o.externalReference,owner:o.ownerUserId,tags:o.tags,date:o.requestedDeliveryDate,promised:o.promisedDeliveryDate,created:o.createdAt,updated:o.updatedAt,postcode:(o.deliveryAddressSnapshot as {postcode?:string}|null)?.postcode,lineCount:o._count.lines})),...quotes.map(q=>({id:q.id,reference:q.reference,docType:'Quote' as const,orderType:null as string|null,customer:q.party.name,customerDeleted:q.party.identityScrubbed,customerType:q.party.customerGroup,pricingCustomer:q.pricingParty?.name??q.party.name,partyId:q.partyId,status:q.status,total:q.totalAmount,net:q.netAmount,tax:q.taxAmount,currency:q.totalCurrency,po:q.customerPoReference,external:q.externalReference,owner:q.ownerUserId,tags:q.tags,date:q.expiryDate,promised:null,created:q.createdAt,updated:q.updatedAt,postcode:(q.deliveryAddressSnapshot as {postcode?:string}|null)?.postcode,lineCount:q._count.lines}))];
 type Row=typeof rows[number];const columns:{key:string;header:string;render:(r:Row)=>React.ReactNode;align?:'right'}[]=[
 {key:'number',header:'Number',render:r=><Link className="font-semibold text-blue-600" href={`${r.docType==='Quote'?'/sales/quotes':'/sales/orders'}/${r.id}`}>{r.reference}</Link>},
 {key:'docType',header:'Type',render:r=>mode==='document'?<span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600">{r.docType}</span>:'—'},
 {key:'type',header:'Order type',render:r=>r.orderType?<span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600">{r.orderType.replaceAll('_',' ')}</span>:'—'},
 {key:'customer',header:'Invoice account',render:r=>r.customerDeleted?<span className="text-slate-500" title="Customer deleted; historical document retained">Deleted customer</span>:can(session,'customers.read')?<Link href={`/customers/${r.partyId}`}>{r.customer}</Link>:r.customer},
 {key:'pricingCustomer',header:'Pricing account',render:r=>r.pricingCustomer},{key:'customerType',header:'Customer type',render:r=>r.customerType??'—'},
 {key:'status',header:'Status',render:r=><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-medium text-blue-700">{r.status.replaceAll('_',' ')}</span>},
 {key:'owner',header:'Salesperson',render:r=>names.get(r.owner??'')??'Unassigned'},
 {key:'po',header:'PO',render:r=>r.po??'—'},
 {key:'tags',header:'Tags',render:r=>r.tags.length?<div className="flex flex-wrap gap-1">{r.tags.map(t=><span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">#{t}</span>)}</div>:'—'},
 {key:'delivery',header:mode==='order'?'Delivery requested':'Valid until',render:r=>r.date?.toLocaleDateString('en-GB')??'—'},
 {key:'total',header:'Total',render:r=>formatMoney(r.total,r.currency),align:'right'},
 {key:'external',header:'Customer reference',render:r=>r.external??'—'},
 {key:'currency',header:'Currency',render:r=>r.currency},
 {key:'net',header:'Net amount',render:r=>formatMoney(r.net,r.currency),align:'right'},
 {key:'tax',header:'Tax',render:r=>formatMoney(r.tax,r.currency),align:'right'},
 {key:'created',header:'Created',render:r=>r.created.toLocaleDateString('en-GB')},
 {key:'updated',header:'Last updated',render:r=>r.updated.toLocaleString('en-GB')},
 {key:'promised',header:'Promised delivery',render:r=>r.promised?.toLocaleDateString('en-GB')??'—'},
 {key:'postcode',header:'Delivery postcode',render:r=>r.postcode??'—'},
 {key:'lines',header:'Line count',render:r=>r.lineCount}];
 let visibleKeys=selectedColumns(filters.columns);
 if(mode==='document'){visibleKeys=[...new Set(['number','docType','customer','status','owner','po','tags','delivery','total'])];}
 const visible=visibleKeys,params=new URLSearchParams(Object.entries(filters).filter(([,v])=>!!v) as [string,string][]),link=(key:string,value:string)=>{const p=new URLSearchParams(params);p.set(key,value);if(key!=='page')p.delete('page');return '?'+p;};
 const title=mode==='document'?'All Sales':mode==='order'?'Orders':'Quotations';
 return <div className="min-w-0 space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm text-slate-500">{count} matching documents · search, organise and move work forward</p></div><div className="flex flex-wrap gap-2">{can(session,'sales.order.create')&&<Link href="/sales/orders/new" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white">+ New order</Link>}{can(session,'sales.quote.create')&&<Link href="/sales/quotes/new" className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700">+ New quote</Link>}</div></div><SalesFilterBar key={params.toString()} filters={filters} customers={customers} people={members.map(m=>m.user)} tags={[...new Set(tagRows.flatMap(r=>r.tags??[]))].sort()} currencies={[...new Set(['GBP','EUR','USD',...tagRows.map(r=>'currency' in r?r.currency:r.totalCurrency)])].sort()} mode={mode} showColumns savedViews={views.map(v=>({id:v.id,name:v.name,definition:v.definition as SalesFilters}))}/>{(mode==='order'||mode==='document')&&<p className="-mt-2 text-[11px] text-slate-400">Orders, call-offs and blanket agreements use the Type filter to distinguish them.</p>}{error&&<p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}<div className="flex flex-wrap gap-2">{['list','board'].map(v=><Link key={v} href={link('view',v)} className={`rounded-lg px-4 py-2 text-xs ${filters.view===v||(!filters.view&&v==='list')?'bg-blue-50 text-blue-600':'bg-white text-slate-500'}`}>{v==='list'?'List view':'Workflow board'}</Link>)}</div>{filters.view==='board'?<div><p className="mb-3 text-xs text-slate-400">Board shows the {rows.length} documents on this page.</p><div className="flex gap-4 overflow-x-auto pb-4">{(mode==='quote'?['DRAFT','SENT','ACCEPTED','DECLINED',null]:['DRAFT','PENDING_APPROVAL','CONFIRMED','ON_HOLD','CANCELLED','CLOSED',null]).map(status=><section key={status??'other'} className="min-w-64 flex-1 rounded-2xl bg-slate-100/80 p-3"><h3 className="mb-4 flex justify-between text-xs font-semibold text-slate-500">{status?status.replaceAll('_',' '):'Quote'}<span>{rows.filter(r=>status?r.status===status:r.docType==='Quote').length}</span></h3><div className="space-y-3">{rows.filter(r=>status?r.status===status:r.docType==='Quote').map(r=><Link key={r.id} href={`${r.docType==='Quote'?'/sales/quotes':'/sales/orders'}/${r.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"><p className="text-sm font-semibold">{r.reference}</p><p className="mt-2 text-xs text-slate-500">{r.customer}</p><p className="mt-4 text-sm font-medium">{formatMoney(r.total,r.currency)}</p><p className="mt-2 text-[10px] text-slate-400">{names.get(r.owner??'')??'Unassigned'}</p></Link>)}</div></section>)}</div></div>:<DataTable rows={rows} emptyLabel="No documents match these filters." columns={visible.flatMap(key=>columns.filter(c=>c.key===key))}/>}<div className="flex justify-between text-xs text-slate-500"><span>Page {page} · {rows.length} shown of {count}</span><div className="flex gap-4">{page>1&&<Link href={link('page',String(page-1))}>← Previous</Link>}{page*50<count&&<Link href={link('page',String(page+1))}>Next →</Link>}</div></div></div>;
}
