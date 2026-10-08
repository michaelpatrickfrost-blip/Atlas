import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { periodFilter, recentPeriod } from "@/core/analytics/goal-period";
import type { AnalyticsProvider, GoalPeriod } from "@/core/analytics/types";
import type { Session } from "@/core/auth/session";
async function resolved(session:Session,period:GoalPeriod){assertCapability(session,"service.case.read");await assertModuleEnabled(session,"service");const count=await db.serviceCase.count({where:{AND:[serviceCaseScope(session),{status:{in:["RESOLVED","CLOSED"]},resolvedAt:periodFilter(period)}]}});return {points:[{label:"Resolved cases",value:count}],sampleSize:count};}
export const serviceGoalMetrics:AnalyticsProvider=[{id:"service.resolved",name:"Cases resolved",subject:"Customer Service",definition:"Visible cases currently resolved or closed, with resolution date in the goal period. Reopened cases are excluded; case/queue privacy applies.",grain:"One resolved case",capability:"service.case.read",href:"/service/cases",snapshot:false,goalSuggestion:{name:"Resolve customer cases",direction:"AT_LEAST"},goalQuery:resolved,query:async(s,since)=>(await resolved(s,recentPeriod(since))).points}];
