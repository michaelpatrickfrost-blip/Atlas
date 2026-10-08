import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { periodFilter, recentPeriod } from "@/core/analytics/goal-period";
import type { AnalyticsProvider, GoalPeriod } from "@/core/analytics/types";
import type { Session } from "@/core/auth/session";
async function production(session:Session,period:GoalPeriod,onTime:boolean){
 assertCapability(session,"manufacturing.order.read");await assertModuleEnabled(session,"manufacturing");
 const where={organisationId:session.organisationId,status:{in:["COMPLETE","CLOSED"] as ("COMPLETE"|"CLOSED")[]},actualFinish:periodFilter(period)};
 if(!onTime){const count=await db.manufacturingOrder.count({where});return {points:[{label:"Completed production orders",value:count}],sampleSize:count};}
 const rows=await db.manufacturingOrder.findMany({where:{...where,requiredDate:{not:null}},select:{actualFinish:true,requiredDate:true},take:10001});if(rows.length>10000)throw new Error("Narrow the production goal period below 10,000 completed orders.");
 const met=rows.filter(r=>r.actualFinish&&r.requiredDate&&r.actualFinish.toISOString().slice(0,10)<=r.requiredDate.toISOString().slice(0,10)).length;
 return {points:rows.length?[{label:"On-time production",value:met/rows.length*100}]:[],sampleSize:rows.length,note:`${met} of ${rows.length} completed orders met their required date. Orders without required dates excluded; calendar UTC days compared.`};
}
export const manufacturingAnalytics:AnalyticsProvider=[false,true].map(onTime=>({id:onTime?"manufacturing.on_time":"manufacturing.completed",name:onTime?"Production completed on time":"Production orders completed",subject:"Manufacturing",definition:onTime?"Completed/closed orders finished on or before their required calendar date, divided by completed orders with a required date. Uses actual finish within goal period; no eligible completions means no reading.":"Completed/closed production orders with actual finish in the goal period. Counts orders, not routing steps or mixed product quantities.",grain:"One completed production order",capability:"manufacturing.order.read",href:"/manufacturing/produce",snapshot:false,unit:onTime?"percent":"count",goalSuggestion:{name:onTime?"Finish production on time":"Complete production orders",direction:"AT_LEAST",...(onTime?{target:95}:{})},goalQuery:(s,p)=>production(s,p,onTime),query:async(s,since)=>(await production(s,recentPeriod(since),onTime)).points}));
