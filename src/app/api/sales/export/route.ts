import {reportSummary} from '@/modules/sales/services/report-summary';
import {prepareSalesFilters} from '@/modules/sales/services/account-filters';
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {orderWhere,quoteWhere,type SalesFilters} from '@/modules/sales/services/list-filters';
import {selectedColumns} from '@/modules/sales/services/view-definition';
import {exportCsv,exportWorkbook,type ExportColumn,type ExportRow} from '@/modules/sales/services/export-file';
export const runtime='nodejs';
export async function GET(request:Request){
 const session=await requireSession();
 const params=new URL(request.url).searchParams,kind=params.get('kind')??'order';
 assertCapability(session,kind==='quote'?'sales.quote.read':'sales.order.read');
 if(!['quote','order','analysis'].includes(kind))return new Response('Choose orders, quotations or Sales analysis.',{status:400});
 if(kind==='analysis')assertCapability(session,'sales.report.read');await assertModuleEnabled(session,'sales');
 const format=params.get('format');if(!['csv','xlsx'].includes(format??''))return new Response('Choose CSV or Excel.',{status:400});
 const filters=Object.fromEntries([...params.entries()].filter(([key])=>!['kind','format','page'].includes(key))) as SalesFilters;
 let rows:ExportRow[]=[],columns:ExportColumn[]=[];
 try{
 const effective=await prepareSalesFilters(session.organisationId,filters);
 if(kind==='analysis'){
 const groups=await db.salesOrder.groupBy({by:['currency','commercialStatus','partyId','pricingPartyId','ownerUserId'],where:orderWhere(session.organisationId,effective),_sum:{netAmount:true,taxAmount:true,grossAmount:true},_count:{_all:true}});
 if(groups.length>5000)return new Response('Narrow your filters to export up to 5,000 groups.',{status:422});
 const [parties,members]=await Promise.all([db.party.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true,parentPartyId:true,customerGroup:true}}),db.membership.findMany({where:{organisationId:session.organisationId},include:{user:{select:{id:true,name:true}}}})]);
 rows=reportSummary(groups,parties,members.map(m=>m.user),filters.group??'status').map(r=>({group:r.label,currency:r.currency,count:r.count,net:r.net/100,tax:r.tax/100,total:r.gross/100}));columns=[{key:'group',label:'Group'},{key:'currency',label:'Currency'},{key:'count',label:'Orders',type:'number'},{key:'net',label:'Net',type:'money'},{key:'tax',label:'Tax',type:'money'},{key:'total',label:'Commercial order value',type:'money'}];
 }else{
 const [orders,quotes,members]=await Promise.all([kind==='order'?db.salesOrder.findMany({where:orderWhere(session.organisationId,effective),include:{party:true,pricingParty:true,_count:{select:{lines:true}}},orderBy:{updatedAt:'desc'},take:5001}):[],kind==='quote'?db.quote.findMany({where:quoteWhere(session.organisationId,effective),include:{party:true,pricingParty:true,_count:{select:{lines:true}}},orderBy:{updatedAt:'desc'},take:5001}):[],db.membership.findMany({where:{organisationId:session.organisationId},include:{user:{select:{id:true,name:true}}}})]);
 if(orders.length+quotes.length>5000)return new Response('Narrow your filters to export up to 5,000 documents.',{status:422});const names=new Map(members.map(m=>[m.userId,m.user.name]));
 rows=[...orders.map(o=>({number:o.reference,customer:o.party.name,pricingCustomer:o.pricingParty?.name??o.party.name,customerType:o.party.customerGroup,status:o.commercialStatus,owner:names.get(o.ownerUserId)??'Former member',po:o.customerPoReference??'',tags:o.tags.join(', '),delivery:o.requestedDeliveryDate,total:o.grossAmount/100,external:o.externalReference,currency:o.currency,net:o.netAmount/100,tax:o.taxAmount/100,created:o.createdAt,updated:o.updatedAt,promised:o.promisedDeliveryDate,postcode:(o.deliveryAddressSnapshot as {postcode?:string}|null)?.postcode,lines:o._count.lines})),...quotes.map(q=>({number:q.reference,customer:q.party.name,pricingCustomer:q.pricingParty?.name??q.party.name,customerType:q.party.customerGroup,status:q.status,owner:names.get(q.ownerUserId??'')??'Unassigned',po:q.customerPoReference??'',tags:q.tags.join(', '),delivery:q.expiryDate,total:q.totalAmount/100,external:q.externalReference,currency:q.totalCurrency,net:q.netAmount/100,tax:q.taxAmount/100,created:q.createdAt,updated:q.updatedAt,promised:null,postcode:(q.deliveryAddressSnapshot as {postcode?:string}|null)?.postcode,lines:q._count.lines}))];
 const available:ExportColumn[]=[{key:'number',label:'Number'},{key:'customer',label:'Invoice account'},{key:'pricingCustomer',label:'Pricing account'},{key:'customerType',label:'Customer type'},{key:'status',label:'Status'},{key:'owner',label:'Salesperson'},{key:'po',label:'Customer PO'},{key:'tags',label:'Tags'},{key:'delivery',label:kind==='order'?'Delivery requested':'Valid until',type:'date'},{key:'total',label:'Total',type:'money'},{key:'external',label:'Customer reference'},{key:'currency',label:'Currency'},{key:'net',label:'Net',type:'money'},{key:'tax',label:'Tax',type:'money'},{key:'created',label:'Created',type:'date'},{key:'updated',label:'Updated',type:'date'},{key:'promised',label:'Promised delivery',type:'date'},{key:'postcode',label:'Delivery postcode'},{key:'lines',label:'Line count',type:'number'}];
 const selected=selectedColumns(filters.columns);columns=available.filter(c=>selected.includes(c.key)||c.key==='currency'||(c.key==='tags'&&selected.includes('po')));
 }
 }catch(error){return new Response(error instanceof Error?error.message:'Check your export filters.',{status:400});}
 const title=kind==='analysis'?'Sales analysis':kind==='quote'?'Quotations':'Sales orders',body=format==='xlsx'?await exportWorkbook(columns,rows,title):exportCsv(columns,rows);
 return new Response(body,{headers:{'Content-Type':format==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="atlas-${kind}-${new Date().toISOString().slice(0,10)}.${format}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
