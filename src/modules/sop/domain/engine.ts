import type { PlanningInput,PlanningOrder,PlanningDelivery,PlanningProduct,PlanningSupply } from '@/core/planning/business';
export type ForecastMethod='auto'|'moving-average'|'weighted-average'|'seasonal-naive'|'exponential'|'croston-sba'|'manual';
export type SopSettings={productCodes?:string[];targetPlanId?:string|null;historyMonths:number;signal:'requested'|'bookings'|'shipments'|'deliveries';method:ForecastMethod;consumption:'consume'|'additive';priceChange:number;unitCostMinor:number|null;lateToleranceDays:number;inFullPercent:number};
export const DEFAULT_SETTINGS:SopSettings={historyMonths:36,signal:'requested',method:'auto',consumption:'consume',priceChange:0,unitCostMinor:null,lateToleranceDays:0,inFullPercent:100};
export function months(start:string,end:string){const result:string[]=[];const cursor=new Date(start.slice(0,7)+'-01T00:00:00Z');while(cursor.toISOString().slice(0,7)<=end.slice(0,7)){result.push(cursor.toISOString().slice(0,7));if(result.length>60)throw Error('Maximum planning window is 60 months.');cursor.setUTCMonth(cursor.getUTCMonth()+1);}return result;}
export function monthOffset(period:string,offset:number){const date=new Date(period.slice(0,7)+'-01T00:00:00Z');date.setUTCMonth(date.getUTCMonth()+offset);return date.toISOString().slice(0,7);}
export function accuracy(actual:number[],forecast:number[]){
 if(actual.length!==forecast.length||!actual.length) return null;
 const errors=actual.map((a,i)=>forecast[i]-a),absolute=errors.map(Math.abs),denominator=actual.reduce((s,a)=>s+Math.abs(a),0);
 const nonzero=actual.flatMap((a,i)=>a!==0?[Math.abs(errors[i]/a)*100]:[]);
 return {mae:absolute.reduce((s,a)=>s+a,0)/actual.length,rmse:Math.sqrt(errors.reduce((s,e)=>s+e*e,0)/actual.length),wape:denominator?absolute.reduce((s,a)=>s+a,0)/denominator*100:null,bias:denominator?errors.reduce((s,a)=>s+a,0)/denominator*100:null,mape:nonzero.length?nonzero.reduce((s,a)=>s+a,0)/nonzero.length:null,smape:actual.reduce((s,a,i)=>s+(Math.abs(a)+Math.abs(forecast[i])?200*absolute[i]/(Math.abs(a)+Math.abs(forecast[i])):0),0)/actual.length};
}
export function predict(history:number[],horizon:number,method:Exclude<ForecastMethod,'auto'>){
 if(!history.length||method==='manual')return Array(horizon).fill(0) as number[];
 let level=history[0];for(const value of history.slice(1))level=.3*value+.7*level;
 const recent=history.slice(-3),mean=recent.reduce((s,v)=>s+v,0)/recent.length,weighted=recent.reduce((s,v,i)=>s+v*(i+1),0)/(recent.length*(recent.length+1)/2);
 let size=0,interval=0,gap=1,seen=false;for(const value of history){if(value>0){if(!seen){size=value;interval=gap;seen=true;}else{size=.2*value+.8*size;interval=.2*gap+.8*interval;}gap=1;}else gap++;}
 return Array.from({length:horizon},(_,i)=>Math.max(0,method==='seasonal-naive'?(history[history.length-12+i%12]??mean):method==='moving-average'?mean:method==='weighted-average'?weighted:method==='croston-sba'?(interval?.9*size/interval:0):level));
}
export function baseline(history:number[],horizon:number,method:ForecastMethod){
 const candidates:Exclude<ForecastMethod,'auto'>[]=['moving-average','weighted-average','exponential',...(history.length>=18?['seasonal-naive' as const]:[]),...(history.filter(v=>v===0).length/history.length>.4?['croston-sba' as const]:[])];
 const holdout=Math.min(6,Math.max(1,history.length-3));
 const scores=history.length>=6?candidates.map(candidate=>{const actual:number[]=[],forecast:number[]=[];for(let i=history.length-holdout;i<history.length;i++){actual.push(history[i]);forecast.push(predict(history.slice(0,i),1,candidate)[0]);}return {method:candidate,...accuracy(actual,forecast)!};}).sort((a,b)=>a.mae-b.mae||a.method.localeCompare(b.method)):[];
 const selected=method==='auto'?(scores[0]?.method??'moving-average'):method;
 return {values:predict(history,horizon,selected),method:selected,validation:scores,classification:history.filter(v=>v>0).length<3?'insufficient history':history.filter(v=>v===0).length/history.length>.4?'intermittent':'regular',explanation:method==='manual'?'Manual planning: statistical baseline is zero.':method!=='auto'?`Planner selected ${selected}; holdout scores are comparisons, not automatic model selection.`:scores.length?`Lowest rolling holdout MAE across ${holdout} months; ties use model name.`:'Fewer than six historical months: moving average fallback, no best-fit claim.'};
}
export function serviceAt(quantity:number,due:string|null,events:Array<{quantity:number;deliveredOn:string|null;deliveryQuantityVerified?:boolean}>,asOf:string,policy:Pick<SopSettings,'lateToleranceDays'|'inFullPercent'>){
 if(!due)return {state:'unavailable',deliveredByDue:null,otif:null,basis:'No requested/promised delivery date'} as const;
 const cutoff=new Date(due+'T23:59:59.999Z');cutoff.setUTCDate(cutoff.getUTCDate()+policy.lateToleranceDays);
 const delivered=events.filter(e=>e.deliveredOn&&e.deliveryQuantityVerified!==false&&e.deliveredOn<=asOf&&new Date(e.deliveredOn)<=cutoff).reduce((s,e)=>s+Math.max(0,e.quantity),0);
 if(cutoff.toISOString().slice(0,10)>=asOf)return {state:'pending',deliveredByDue:delivered,otif:null,basis:'Delivery date has not passed'} as const;
 if(events.some(e=>e.deliveredOn&&e.deliveredOn<=asOf&&e.deliveryQuantityVerified===false))return {state:'unavailable',deliveredByDue:delivered,otif:null,basis:'Partial delivery has no verified received quantity'} as const;
 const evidence=events.some(e=>e.deliveredOn&&e.deliveredOn<=asOf);
 if(!evidence)return {state:'unavailable',deliveredByDue:null,otif:null,basis:'No actual delivery evidence'} as const;
 const pass=delivered+1e-8>=quantity*policy.inFullPercent/100;
 return {state:pass?'pass':'fail',deliveredByDue:delivered,otif:pass,basis:'Recorded customer delivery; calendar-day policy'} as const;
}
export function serviceRows(orders:PlanningOrder[],deliveries:PlanningDelivery[],asOf:string,policy:SopSettings){
 const byLine=new Map<string,PlanningDelivery[]>();for(const d of deliveries){const group=byLine.get(d.lineId);if(group)group.push(d);else byLine.set(d.lineId,[d]);}
 return orders.filter(o=>o.quantity>0).map(o=>{const events=byLine.get(o.lineId)??[],delivered=Math.min(o.quantity,events.filter(d=>d.deliveredOn&&d.deliveredOn<=asOf&&d.deliveryQuantityVerified!==false).reduce((s,d)=>s+d.quantity,0)),open=o.closed&&!events.some(e=>e.deliveryQuantityVerified===false)?0:Math.max(0,o.quantity-delivered),requested=serviceAt(o.quantity,o.requestedOn,events,asOf,policy),promise=serviceAt(o.quantity,o.promisedOn,events,asOf,policy),dispatchDue=events.map(e=>e.plannedDispatchOn).filter((d):d is string=>!!d).sort().at(-1)??null,dispatch=serviceAt(o.quantity,dispatchDue,events.map(e=>({quantity:e.quantity,deliveredOn:e.dispatchedOn})),asOf,policy);
 const reasons:string[]=[];if(o.onHold&&open)reasons.push('Sales order is on hold');if(events.some(e=>e.deliveryQuantityVerified===false))reasons.push('Partial delivery has no verified received quantity');if(open&&o.requestedOn&&o.requestedOn<asOf)reasons.push('Requested delivery date passed with an open balance');if(open&&!o.promisedOn)reasons.push('No confirmed delivery date');if(events.some(e=>e.eta&&o.promisedOn&&e.eta>o.promisedOn))reasons.push('Shipment ETA is beyond the promise');if(events.some(e=>e.plannedDispatchOn&&e.plannedDispatchOn<asOf&&!e.dispatchedOn))reasons.push('Planned dispatch has not been recorded');
 return {...o,delivered,open,requested,promise,dispatch,events,risk:open&&o.requestedOn&&o.requestedOn<asOf?'critical':reasons.length?'high':'low',reasons};});
}
export type DemandRow={productId:string;code:string;name:string;unit:string;period:string;baseline:number;confirmedOrders:number;fulfilled:number;remainingDemand:number;safetyStock:number;openOrders:number;projectRaw:number;projectWeighted:number;projectConsumed:number;projectRemaining:number;adjustment:number;consumed:number;remaining:number;consensus:number;opening:number|null;receipts:number;production:number;closing:number|null;constrained:number|null;atRisk:number|null;priceMinor:number;committedRevenueMinor:number;revenueMinor:number;costMinor:number|null;marginMinor:number|null;model:string;why:string;inputIds:string[];orderIds:string[]};
export function buildDemand(input:{products:PlanningProduct[];orders:PlanningOrder[];deliveries:PlanningDelivery[];inputs:PlanningInput[];stock:Array<{productId:string;quantity:number}>;supply:PlanningSupply[];startsOn:string;endsOn:string;asOf:string;currency:string;settings:SopSettings;supplyAvailable:boolean}){
 const periods=months(input.startsOn,input.endsOn);
 const historyEnd=monthOffset([periods[0],input.asOf.slice(0,7)].sort()[0],-1);
 const historyPeriods=months(monthOffset(historyEnd,1-input.settings.historyMonths),historyEnd);
 const periodIndex=(period:string)=>Number(period.slice(0,4))*12+Number(period.slice(5,7));
 const forecastGap=Math.max(0,periodIndex(periods[0])-periodIndex(historyEnd)-1);
 if(forecastGap>60)throw Error('The first forecast month must be within 60 months of the current month.');
 const service=serviceRows(input.orders,input.deliveries,input.asOf,input.settings),rows:DemandRow[]=[],models:Array<{productId:string;method:string;classification:string;explanation:string;validation:ReturnType<typeof baseline>['validation'];history:number[];historyPeriods:string[]}>=[];
 const groupByProduct=<T extends {productId:string|null}>(items:T[])=>{const groups=new Map<string,T[]>();for(const item of items){if(item.productId){const group=groups.get(item.productId);if(group)group.push(item);else groups.set(item.productId,[item]);}}return groups;};
 const ordersByProduct=groupByProduct(service.filter(o=>o.currency===input.currency));
 const inputsByProduct=groupByProduct(input.inputs.filter(i=>i.metricKey==='sales_volume'&&!i.sourceInactive));
 const deliveriesByProduct=groupByProduct(input.deliveries),supplyByProduct=groupByProduct(input.supply),stock=new Map(input.stock.map(s=>[s.productId,s.quantity]));
 const currentMonth=input.asOf.slice(0,7);
 for(const p of input.products){
  const orders=ordersByProduct.get(p.id)??[],sources=inputsByProduct.get(p.id)??[],deliveries=deliveriesByProduct.get(p.id)??[],supply=supplyByProduct.get(p.id)??[];
  if(!orders.length&&!sources.length&&!supply.length&&!deliveries.length)continue;
  const historyTotals=new Map<string,number>();
  const addHistory=(on:string|null,quantity:number)=>{if(on){const period=on.slice(0,7);historyTotals.set(period,(historyTotals.get(period)??0)+quantity);}};
  if(input.settings.signal==='shipments'||input.settings.signal==='deliveries')for(const d of deliveries){if(input.settings.signal==='deliveries'&&d.deliveryQuantityVerified===false)continue;addHistory(input.settings.signal==='shipments'?d.dispatchedOn:d.deliveredOn,d.quantity);}
  else for(const o of orders)addHistory(input.settings.signal==='bookings'?o.bookedOn:o.requestedOn,o.quantity);
  const history=historyPeriods.map(period=>historyTotals.get(period)??0),rawModel=baseline(history,periods.length+forecastGap,input.settings.method),model={...rawModel,values:rawModel.values.slice(forecastGap)};models.push({productId:p.id,...model,history,historyPeriods});
  let opening:number|null=input.supplyAvailable&&periods[0]>=currentMonth?(stock.get(p.id)??0):null;
  for(const [index,period]of periods.entries()){
   if(period===currentMonth&&index>0)opening=input.supplyAvailable?(stock.get(p.id)??0):null;
   const orderRows=orders.filter(o=>{const due=(o.requestedOn??o.promisedOn)?.slice(0,7);return due===period||index===0&&!!due&&due<period&&o.open>0;});
   const dispatched=(o:typeof orders[number])=>Math.min(o.quantity,o.dispatchedQuantity??o.events.filter(e=>e.dispatchedOn||e.deliveredOn).reduce((s,e)=>s+e.quantity,0));
   const confirmedOrders=orderRows.reduce((s,o)=>s+o.quantity,0),orderDemand=orderRows.reduce((s,o)=>s+(o.closed?0:Math.max(0,o.quantity-dispatched(o))),0),fulfilled=orderRows.reduce((s,o)=>s+(o.closed?o.quantity:dispatched(o)),0);
   const phased=sources.filter(s=>s.periodKey===period);let projectRaw=0,projectWeighted=0,projectConsumed=0,adjustment=0;
   const projectGroups=new Map<string,typeof phased>();for(const source of phased){if(['sales-project','opportunity'].includes(source.sourceType)){const key=source.sourceType+'|'+source.sourceId;projectGroups.set(key,[...(projectGroups.get(key)??[]),source]);}else adjustment+=source.value*source.probability/100;}
   for(const order of orderRows)if(order.projectId&&order.opportunityId&&projectGroups.has('sales-project|'+order.projectId)&&projectGroups.has('opportunity|'+order.opportunityId))throw Error(`Order ${order.reference} links both a planned project and opportunity for ${p.code} in ${period}. Keep one commercial demand source for this deal before generating consensus.`);
   for(const group of projectGroups.values()){const weighted=group.reduce((sum,g)=>sum+Math.max(0,g.value)*g.probability/100,0);projectRaw+=group.reduce((sum,g)=>sum+Math.max(0,g.value),0);projectWeighted+=weighted;const first=group[0];const converted=orderRows.filter(o=>first.sourceType==='sales-project'?o.projectId===first.sourceId:o.opportunityId===first.sourceId).reduce((sum,o)=>sum+o.quantity,0);projectConsumed+=Math.min(weighted,converted);}
   const base=model.values[index],projectRemaining=projectWeighted-projectConsumed,consumed=input.settings.consumption==='consume'?Math.min(base,confirmedOrders):0;
   const consensus=Math.max(confirmedOrders,base+confirmedOrders-consumed+projectRemaining+adjustment),remainingDemand=Math.max(orderDemand,consensus-fulfilled);
   const arrivals=supply.filter(s=>s.on.slice(0,7)===period),receipts=arrivals.filter(s=>s.type==='receipt').reduce((sum,a)=>sum+a.quantity,0),production=Math.max(arrivals.filter(s=>s.type==='production').reduce((sum,a)=>sum+a.quantity,0),arrivals.filter(s=>s.type==='plan').reduce((sum,a)=>sum+a.quantity,0));
   const available=opening==null?null:Math.max(0,opening+receipts+production),constrained=available==null?null:Math.min(remainingDemand,Math.max(0,available-p.safetyStock)),closing=available==null?null:available-remainingDemand;
   const priced=phased.filter(s=>s.unitPriceMinor!=null&&s.value>0),price=priced.length?priced.reduce((sum,i)=>sum+i.value*i.unitPriceMinor!,0)/priced.reduce((sum,i)=>sum+i.value,0):p.priceMinor;
   const priceMinor=Math.round(price*(1+input.settings.priceChange/100)),committedRevenueMinor=orderRows.reduce((sum,o)=>sum+o.valueMinor,0),revenueMinor=Math.round(committedRevenueMinor+Math.max(0,consensus-confirmedOrders)*priceMinor),costMinor=input.settings.unitCostMinor==null?null:Math.round(consensus*input.settings.unitCostMinor);
   rows.push({productId:p.id,code:p.code,name:p.name,unit:p.unit,period,baseline:base,confirmedOrders,fulfilled,remainingDemand,safetyStock:p.safetyStock,openOrders:orderDemand,projectRaw,projectWeighted,projectConsumed,projectRemaining,adjustment,consumed,remaining:base-consumed,consensus,opening,receipts,production,closing,constrained,atRisk:constrained==null?null:remainingDemand-constrained,priceMinor,committedRevenueMinor,revenueMinor,costMinor,marginMinor:costMinor==null?null:revenueMinor-costMinor,model:model.method,why:`Whole-period baseline ${base.toFixed(2)}; confirmed ${confirmedOrders}; forecast consumed ${consumed.toFixed(2)}; project weighted ${projectWeighted.toFixed(2)}, converted ${projectConsumed.toFixed(2)}; adjustments ${adjustment.toFixed(2)}. Fulfilled/closed ${fulfilled}; remaining supply requirement ${remainingDemand.toFixed(2)}. Safety stock ${p.safetyStock}. Production uses the larger of orders and plan.`,inputIds:phased.map(s=>s.id),orderIds:[...new Set(orderRows.map(o=>o.id))]});
   opening=available==null?null:Math.max(0,available-remainingDemand);
  }
 }
 return {rows:rows.filter(r=>r.consensus!==0||r.baseline!==0||r.opening!==0||r.receipts!==0||r.production!==0),models:models.filter(m=>m.history.some(v=>v!==0)||input.inputs.some(i=>i.productId===m.productId)),service};
}
export function forecastLagAccuracy(versions:Array<{createdOn:string;rows:Array<{productId:string;unit?:string;period:string;baseline:number;consensus:number}>}>,actuals:Map<string,number>,closedBefore:string){
 const index=(p:string)=>Number(p.slice(0,4))*12+Number(p.slice(5,7));
 const latest=new Map<string,{createdOn:string;row:typeof versions[number]['rows'][number];lag:number}>();
 for(const version of versions)for(const row of version.rows){if(row.period>=closedBefore)continue;const lag=index(row.period)-index(version.createdOn);if(lag<1)continue;const key=lag+'|'+row.productId+'|'+row.period,previous=latest.get(key);if(!previous||version.createdOn>previous.createdOn)latest.set(key,{createdOn:version.createdOn,row,lag});}
 const groups=new Map<string,{lag:number;unit:string;actual:number[];forecast:number[];baseline:number[]}>();
 for(const {row,lag} of latest.values()){const unit=row.unit??'units',key=lag+'|'+unit,actual=actuals.get(row.productId+'|'+row.period)??0;const group=groups.get(key)??{lag,unit,actual:[],forecast:[],baseline:[]};group.actual.push(actual);group.forecast.push(row.consensus);group.baseline.push(row.baseline);groups.set(key,group);}
 return [...groups.values()].sort((a,b)=>a.lag-b.lag||a.unit.localeCompare(b.unit)).map(g=>({lag:g.lag,unit:g.unit,count:g.actual.length,consensus:accuracy(g.actual,g.forecast)!,baseline:accuracy(g.actual,g.baseline)!,fva:g.actual.reduce((s,a)=>s+Math.abs(a),0)?accuracy(g.actual,g.baseline)!.wape!-accuracy(g.actual,g.forecast)!.wape!:null}));
}
/** Missing evidence remains visible in the denominator disclosure. Quantity
 * weights would mix kg and each, so commercial weighting uses one currency. */
export function serviceSummary(rows:ReturnType<typeof serviceRows>,basis:'requested'|'promise'|'dispatch',currency:string){
 const eligible=rows.filter(r=>r.currency===currency),measured=eligible.filter(r=>r[basis].otif!=null),passed=measured.filter(r=>r[basis].otif===true);
 const orders=new Map<string,typeof eligible>();for(const row of eligible){const group=orders.get(row.id);if(group)group.push(row);else orders.set(row.id,[row]);}
 const states=[...orders.values()].map(lines=>lines.some(l=>l[basis].state==='fail')?'fail':lines.some(l=>l[basis].state==='pending')?'pending':lines.some(l=>l[basis].state==='unavailable')?'unavailable':'pass');
 const measuredOrders=states.filter(s=>s==='pass'||s==='fail'),value=measured.reduce((sum,r)=>sum+Math.max(0,r.valueMinor),0);
 return {lines:eligible.length,measuredLines:measured.length,passLines:passed.length,lineRate:measured.length?passed.length/measured.length*100:null,unavailableLines:eligible.filter(r=>r[basis].state==='unavailable').length,pendingLines:eligible.filter(r=>r[basis].state==='pending').length,measuredOrders:measuredOrders.length,orderRate:measuredOrders.length?measuredOrders.filter(s=>s==='pass').length/measuredOrders.length*100:null,valueRate:value?passed.reduce((sum,r)=>sum+Math.max(0,r.valueMinor),0)/value*100:null};
}
