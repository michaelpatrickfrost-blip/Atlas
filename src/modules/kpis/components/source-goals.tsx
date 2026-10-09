import Link from "next/link";
import type {Session} from "@/core/auth/session";
import {can} from "@/core/permissions/check";
import {isModuleEnabled} from "@/core/modules/runtime";
import {getAnalyticsMetrics} from "@/core/analytics/catalogue";
import {loadGoalMarkers} from "../services/workspace";
import {GoalMeter} from "./goal-meter";
/** Shared targets only; source catalogue filters capabilities and entitlements. */
export async function SourceGoals({session,prefixes}:{session:Session;prefixes:string[]}){
 if(!can(session,"kpis.read")||!(await isModuleEnabled(session,"kpis")))return null;
 const metrics=(await getAnalyticsMetrics(session)).filter(m=>prefixes.some(p=>m.id.startsWith(p))&&m.goalSuggestion);
 if(!metrics.length)return null;
 const ids=new Set(metrics.map(m=>m.id));const goals=(await loadGoalMarkers(session,[...ids])).filter(g=>ids.has(g.metricId));
 return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">Connected goals</h3><Link href="/kpis" className="text-xs font-semibold text-blue-600">Open scorecards</Link></div><p className="text-xs text-slate-500">Goals use their own dates and source scope, independently of this page’s filters.</p>{goals.slice(0,3).map(g=><Link href={`/kpis/${g.id}`} key={g.id} className="block border-t border-slate-100 pt-3"><GoalMeter name={g.name} actual={g.score.actual} target={g.target} elapsed={g.score.elapsed} verdict={g.score.verdict} unit={g.unit} currency={g.score.currency} summary={g.score.summary}/></Link>)}{!goals.length&&<p className="text-sm text-slate-500">Turn this app’s results into targets that update from the underlying records.</p>}{can(session,"kpis.manage")&&<div className="flex flex-wrap gap-3">{metrics.map(m=><Link key={m.id} href={`/kpis/new?metric=${encodeURIComponent(m.id)}`} className="text-xs font-semibold text-blue-600">Set {m.name.toLowerCase()} target →</Link>)}</div>}</section>;
}
