import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { periodFilter, recentPeriod } from "@/core/analytics/goal-period";
import type { AnalyticsProvider, GoalPeriod } from "@/core/analytics/types";
import type { Session } from "@/core/auth/session";
async function satisfaction(session:Session,period:GoalPeriod,service:boolean){
 assertCapability(session,"csat.result.read");await assertModuleEnabled(session,"csat");
 let ids:string[]=[];if(service){assertCapability(session,"service.case.read");await assertModuleEnabled(session,"service");ids=(await db.serviceCase.findMany({where:serviceCaseScope(session),select:{id:true}})).map(c=>c.id);}
 const where={organisationId:session.organisationId,respondedAt:periodFilter(period),invalidatedAt:null,score:{gte:1,lte:5},survey:{organisationId:session.organisationId,scale:5},...(service?{entityType:"ServiceCase",entityId:{in:ids}}:{})};
 const [all,happy]=await Promise.all([db.csatResponse.count({where}),db.csatResponse.count({where:{...where,score:{gte:4,lte:5}}})]);
 return {points:all?[{label:service?"Service CSAT":"All CSAT",value:happy/all*100}]:[],sampleSize:all,note:`${happy} of ${all} valid responses scored 4 or 5. Based on response date; invalidated and non-five-point surveys excluded.`};
}
export const csatGoalMetrics:AnalyticsProvider=[false,true].map(service=>({id:service?"csat.service.satisfaction":"csat.satisfaction",name:service?"Customer service CSAT":"Customer satisfaction",subject:service?"Customer Service":"Satisfaction",definition:service?"Percentage of valid five-point service-case responses scored 4 or 5 during the goal period. Only cases this profile can read; invalidated responses excluded. No responses means no reading.":"Percentage of valid five-point survey responses scored 4 or 5, by response date. No responses means no reading.",grain:"One valid customer response",capability:"csat.result.read",requiredCapabilities:service?["service.case.read"]:[],requiredModules:service?["service"]:[],href:"/csat",snapshot:false,unit:"percent",goalSuggestion:{name:service?"Maintain excellent service CSAT":"Improve customer satisfaction",direction:"AT_LEAST",target:90},goalQuery:(s,p)=>satisfaction(s,p,service),query:async(s,since)=>(await satisfaction(s,recentPeriod(since),service)).points}));
