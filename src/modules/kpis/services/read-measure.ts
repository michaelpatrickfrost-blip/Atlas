import { GoalInputError } from "../domain/input";
import type { Session } from "@/core/auth/session";
import type { AnalyticsMetric, GoalMeasurement } from "@/core/analytics/types";
import { goalPeriod } from "@/core/analytics/goal-period";
import { readActual } from "../domain/progress";
export type GoalReading = GoalMeasurement & { actual: number|null; currency?:string; blocked?:string };
export async function readGoalMeasure(session:Session,metric:AnalyticsMetric|undefined,start:Date,end:Date,slice:string):Promise<GoalReading>{
 if(metric?.id.startsWith("kpis."))return {points:[],actual:null,blocked:"Scorecards summarise goals. Choose a business source to measure an individual goal."};
 if(!metric)return {points:[],actual:null,blocked:"This source is unavailable to your profile or its app is disabled. Source access is required to score this goal."};
 if(!metric.goalQuery&&!metric.snapshot)return {points:[],actual:null,blocked:"This older measure cannot limit figures to the goal period. Connect a supported live result to score it accurately."};
 try {
  const period=goalPeriod(start,end);
  const result:GoalMeasurement=metric.goalQuery?await metric.goalQuery(session,period):{points:await metric.query(session,undefined)};
  if(result.points.some(p=>!Number.isFinite(p.value)))throw new Error("Invalid metric result.");
  if(!result.points.length&&(metric.unit==="percent"||metric.unit==="money"))return {...result,actual:null,blocked:"No eligible source records in this period. A missing result is not zero."};
  if(metric.unit==="money"&&slice&&!result.points.some(p=>p.label.toUpperCase()===slice.toUpperCase()))return {...result,actual:null,blocked:"No eligible source records for the selected currency in this period."};
  return {...result,...readActual(result.points,metric.unit,slice)};
 }catch{return {points:[],actual:null,blocked:"The source could not be read. Refresh to try again; no zero or manual fallback has been used."};}
}
export function validateGoalSelection(metric:AnalyticsMetric,slice:string){
 if(metric.id.startsWith("kpis."))throw new GoalInputError("Choose a business source; scorecards summarise existing goals.");
 if(!metric.goalQuery&&!metric.snapshot)throw new GoalInputError("Choose a measure that supports dated goals.");
 if(metric.unit==="money"&&!/^[A-Z]{3}$/.test(slice))throw new GoalInputError("Choose a three-letter currency for the goal, such as GBP.");
}
