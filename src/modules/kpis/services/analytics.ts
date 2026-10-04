import { db } from "@/core/db/client";
import type { AnalyticsProvider } from "@/core/analytics/types";
import { assertCapability } from "@/core/permissions/check";
export const kpisAnalytics: AnalyticsProvider = [
{id:"kpis.scorecards",name:"Team scorecards",subject:"Goals & KPIs",definition:"Shared department and team goals by team. Personal goals and performance plans are not included.",grain:"One shared goal",capability:"kpis.read",href:"/kpis",snapshot:true,query:async(session,since)=>{void since;assertCapability(session,"kpis.read");const rows=await db.kpi.groupBy({by:["teamName"],where:{organisationId:session.organisationId,visibility:"COMPANY"},_count:{_all:true}});return rows.map(r=>({label:String(r.teamName).replaceAll("_"," "),value:r._count._all}));}},
];
