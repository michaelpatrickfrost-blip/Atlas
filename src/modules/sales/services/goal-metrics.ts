import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { periodFilter, recentPeriod } from "@/core/analytics/goal-period";
import type { AnalyticsProvider, GoalPeriod } from "@/core/analytics/types";
import type { Session } from "@/core/auth/session";
async function orders(session:Session,period:GoalPeriod){
 assertCapability(session,"sales.order.read");await assertModuleEnabled(session,"sales");
 const rows=await db.salesOrder.groupBy({by:["currency"],where:{organisationId:session.organisationId,commercialStatus:{in:["CONFIRMED","ON_HOLD","CLOSED"]},confirmationDate:periodFilter(period)},_sum:{netAmount:true},_count:{_all:true}});
 return {points:rows.map(r=>({label:r.currency,value:r._sum.netAmount??0})),sampleSize:rows.reduce((n,r)=>n+r._count._all,0)};
}
export const salesGoalMetrics:AnalyticsProvider=[{id:"sales.confirmed.value",name:"Confirmed sales value",subject:"Sales",definition:"Current net value excluding tax of confirmed, on-hold or closed orders, by confirmation date. Cancelled/draft orders excluded. Currencies stay separate. This is order intake, not recognised revenue or profit.",grain:"One confirmed sales order",capability:"sales.order.read",href:"/sales/orders",snapshot:false,unit:"money",goalSuggestion:{name:"Grow confirmed sales value",direction:"AT_LEAST"},goalQuery:orders,query:async(s,since)=>(await orders(s,recentPeriod(since))).points}];
