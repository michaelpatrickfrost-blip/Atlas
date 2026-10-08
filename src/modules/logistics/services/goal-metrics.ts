import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { periodFilter, recentPeriod } from "@/core/analytics/goal-period";
import type { AnalyticsProvider, GoalPeriod } from "@/core/analytics/types";
import type { Session } from "@/core/auth/session";
async function dispatched(session:Session,period:GoalPeriod){assertCapability(session,"logistics.shipment.read");await assertModuleEnabled(session,"logistics");const count=await db.shipment.count({where:{organisationId:session.organisationId,dispatchedAt:periodFilter(period),status:{in:["DISPATCHED","DELIVERED"]}}});return {points:[{label:"Dispatched shipments",value:count}],sampleSize:count};}
export const logisticsGoalMetrics:AnalyticsProvider=[{id:"logistics.dispatched",name:"Shipments dispatched",subject:"Logistics",definition:"Dispatched/delivered shipments by actual dispatch date in the goal period. Cancelled and planned shipments excluded. Counts shipments, not lines or freight cost.",grain:"One shipment",capability:"logistics.shipment.read",href:"/logistics/dispatch",snapshot:false,goalSuggestion:{name:"Dispatch customer shipments",direction:"AT_LEAST"},goalQuery:dispatched,query:async(s,since)=>(await dispatched(s,recentPeriod(since))).points}];
