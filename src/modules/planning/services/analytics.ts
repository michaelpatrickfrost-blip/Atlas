import { db } from "@/core/db/client";
import type { AnalyticsProvider } from "@/core/analytics/types";
import { assertCapability } from "@/core/permissions/check";
export const planningAnalytics: AnalyticsProvider = [
{id:"planning.plans",name:"Production plans",subject:"Planning",definition:"Planner intentions created in the selected period, by bucket. Plans are not executable production orders.",grain:"One production plan",capability:"planning.demand.read",href:"/planning/plans",snapshot:false,query:async(session,since)=>{void since;assertCapability(session,"planning.demand.read");const rows=await db.productionPlan.groupBy({by:["bucket"],where:{organisationId:session.organisationId,createdAt:since?{gte:since}:undefined},_count:{_all:true}});return rows.map(r=>({label:String(r.bucket).replaceAll("_"," "),value:r._count._all}));}},
];
