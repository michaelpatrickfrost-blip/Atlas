"use client";
import {useState} from "react";
import {connectGoal} from "@/app/(app)/kpis/actions";
import {GoalActionForm} from "./action-form";
import type {MeasureChoice} from "../services/workspace";
const field="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-sm";
export function ConnectGoalForm({id,expectedMetricId,target,unit,sliceLabel,measures}:{id:string;expectedMetricId:string;target:number;unit:string;sliceLabel:string;measures:MeasureChoice[]}){
 const [metricId,setMetric]=useState(expectedMetricId),[slice,setSlice]=useState(sliceLabel);
 const metric=measures.find(m=>m.id===metricId);
 return <GoalActionForm action={connectGoal.bind(null,id)} className="mt-4 space-y-4">
  <input type="hidden" name="expectedConnection" value={JSON.stringify([expectedMetricId,sliceLabel,target,unit])}/>
  <label className="block text-sm">Live source<select aria-label="Connect live source" name="metricId" required value={metricId} onChange={e=>{setMetric(e.target.value);setSlice(measures.find(m=>m.id===e.target.value)?.unit==="money"?"GBP":"");}} className={field}><option value="">Choose a business result</option>{measures.map(m=><option key={m.id} value={m.id}>{m.subject} · {m.name}</option>)}</select></label>
  {metric&&<p className="text-xs leading-relaxed text-slate-500">{metric.definition}</p>}
  {metric?.unit==="money"?<label className="block text-sm">Currency<input aria-label="Connection currency" name="sliceLabel" required value={slice} onChange={e=>setSlice(e.target.value.toUpperCase())} pattern="[A-Z]{3}" maxLength={3} className={field}/></label>:metric&&<label className="block text-sm">Measure group<select aria-label="Connection group" name="sliceLabel" value={slice} onChange={e=>setSlice(e.target.value)} className={field}><option value="">The whole measure</option>{metric.points.map(p=><option key={p.label}>{p.label}</option>)}</select></label>}
  <label className="block text-sm">Target {metric?.unit==="money"?"(major currency units)":metric?.unit==="percent"?"(%)":""}<input aria-label="Connection target" name="target" required type="number" min={0} max={metric?.unit==="percent"?100:undefined} step="any" defaultValue={unit==="money"?target/100:target} className={field}/></label>
  <p className="text-xs text-slate-500">The original goal, owner, period and history stay in place. Confirm the target in the new source’s unit; the current figure will come from that source.</p>
  <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Connect source</button>
 </GoalActionForm>;
}
