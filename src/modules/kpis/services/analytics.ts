import { db } from "@/core/db/client";
import type { AnalyticsProvider } from "@/core/analytics/types";
import { assertCapability } from "@/core/permissions/check";
import { loadScorecards } from "./scorecards";
export const kpisAnalytics: AnalyticsProvider = [
{id:"kpis.attainment",name:"Scorecard attainment",subject:"Goals & KPIs",definition:"Weighted attainment of shared company goals, capped at 100% per goal. Scorecards with any inaccessible or missing source are omitted; personal goals are excluded.",grain:"One strategy scorecard",capability:"kpis.read",href:"/kpis/scorecards",snapshot:true,unit:"percent",query:async(session)=>{assertCapability(session,"kpis.read");const cards=await loadScorecards(session);return cards.filter(card=>card.value!==null).map(card=>({label:card.title,value:card.value!}));}},
{id:"kpis.scorecards",name:"Team scorecards",subject:"Goals & KPIs",definition:"Shared department and team goals by team. Personal goals and performance plans are not included.",grain:"One shared goal",capability:"kpis.read",href:"/kpis",snapshot:true,query:async(session,since)=>{void since;assertCapability(session,"kpis.read");const rows=await db.kpi.groupBy({by:["teamName"],where:{organisationId:session.organisationId,visibility:"COMPANY"},_count:{_all:true}});return rows.map(r=>({label:String(r.teamName).replaceAll("_"," "),value:r._count._all}));}},
];
