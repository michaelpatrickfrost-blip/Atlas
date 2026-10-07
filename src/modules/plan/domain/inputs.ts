import type { PlanningInput, PlanningOrder } from '@/core/planning/business';
/** Orders consume weighted project demand first, per source/product/month. The
 * balance is then part of the forecast, which confirmed orders consume again only
 * at the overall product layer. A single order never consumes each input twice. */
export function inputContributions(inputs:PlanningInput[],orders:PlanningOrder[]) {
 const consumed=new Map<string,number>();
 const moneyConsumed=new Map<string,number>();
 for(const order of orders){
  const period=(order.requestedOn??order.promisedOn??order.bookedOn).slice(0,7);
  for(const [kind,id] of [['sales-project',order.projectId],['opportunity',order.opportunityId]] as const){
   if(!id)continue;
   const key=`${kind}|${id}|${order.productId}|${period}`;
   consumed.set(key,(consumed.get(key)??0)+order.quantity);
   const moneyKey=`${kind}|${id}|${period}|${order.currency}`;
   moneyConsumed.set(moneyKey,(moneyConsumed.get(moneyKey)??0)+order.valueMinor);
  }
 }
 return [...inputs].sort((a,b)=>a.id.localeCompare(b.id)).map(input=>{
  const raw=input.value,weighted=input.sourceInactive?0:raw*input.probability/100;
  const quantityKey=`${input.sourceType}|${input.sourceId}|${input.productId}|${input.periodKey}`;
  const amountKey=`${input.sourceType}|${input.sourceId}|${input.periodKey}|${'currency' in input?input.currency:'GBP'}`;
  const pool=input.metricKey==='sales_volume'?consumed:moneyConsumed;
  const key=input.metricKey==='sales_volume'?quantityKey:amountKey;
  const project=['sales-project','opportunity'].includes(input.sourceType);
  const used=project?Math.min(Math.max(0,weighted),pool.get(key)??0):0;
  if(project)pool.set(key,Math.max(0,(pool.get(key)??0)-used));
  return {...input,raw,weighted,consumed:used,contribution:weighted-used};
 });
}
export function monthlyPhasing(start:string,end:string,total:number) {
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(start)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(end)||end<start||!Number.isFinite(total))throw Error('Choose a valid monthly range and total.');
 const periods:string[]=[];const cursor=new Date(`${start}-01T00:00:00Z`);
 while(cursor.toISOString().slice(0,7)<=end){periods.push(cursor.toISOString().slice(0,7));if(periods.length>36)throw Error('Phase at most 36 months at once.');cursor.setUTCMonth(cursor.getUTCMonth()+1);}
 const each=Math.trunc(total*10000/periods.length)/10000;
 return periods.map((period,index)=>({period,value:index===periods.length-1?Math.round((total-each*(periods.length-1))*10000)/10000:each}));
}
