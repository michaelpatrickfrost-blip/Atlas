import {done} from './work';
export const DAY=86400000;
export type GanttTask={id:string;title:string;status:string;startAt:string|null;dueAt:string|null;owner:string;project:string;priority:string;estimatedMinutes:number;parentTaskId:string|null;version:number;editable:boolean;dependencies:{predecessorId:string;successorId:string;kind:string;lagDays:number}[]};
export type GanttMilestone={id:string;name:string;targetAt:string;complete:boolean};
export type GanttBaseline={id:string;name:string;createdAt:string;tasks:{id:string;startAt:string|null;dueAt:string|null}[]};
export function dayNumber(value:string){return Math.floor(new Date(value).getTime()/DAY);}
export function isoDay(day:number){return new Date(day*DAY).toISOString().slice(0,10);}
export function duration(task:{startAt:string|null;dueAt:string|null}){return task.startAt&&task.dueAt?dayNumber(task.dueAt)-dayNumber(task.startAt)+1:null;}
export function finishVariance(task:{dueAt:string|null},baseline:{dueAt:string|null}|undefined){return task.dueAt&&baseline?.dueAt?dayNumber(task.dueAt)-dayNumber(baseline.dueAt):null;}
/** Keep large projects navigable without rendering unbounded date columns. */
export function ganttWindow(tasks:GanttTask[],milestones:GanttMilestone[],anchor:number|null,zoom:string,today:number){
 const dates=[...tasks.flatMap(t=>[t.startAt,t.dueAt]),...milestones.map(m=>m.targetAt)].filter((d):d is string=>!!d).map(dayNumber);
 const first=dates.length?Math.min(...dates):today,last=dates.length?Math.max(...dates):today+27;
 const count=zoom==='Days'?42:zoom==='Weeks'?84:366,pixels=zoom==='Days'?32:zoom==='Weeks'?16:5;
 const start=anchor??first-3;
 return {start,count,pixels,end:start+count-1,first,last};
}
/** Baselines may contain older/deleted scope: expose only IDs visible in this view. */
export function baselineTasks(snapshot:unknown,visible:Set<string>):GanttBaseline['tasks']{
 if(!snapshot||typeof snapshot!=='object'||!('tasks' in snapshot)||!Array.isArray(snapshot.tasks))return [];
 return snapshot.tasks.flatMap((t:unknown)=>{
  if(!t||typeof t!=='object'||!('id' in t)||typeof t.id!=='string'||!visible.has(t.id))return [];
  const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(new Date(v).getTime())?v:null;
  return [{id:t.id,startAt:date('startAt' in t?t.startAt:null),dueAt:date('dueAt' in t?t.dueAt:null)}];
 });
}
export function ganttSummary(tasks:GanttTask[],today:number){return {open:tasks.filter(t=>!done(t.status)).length,overdue:tasks.filter(t=>!done(t.status)&&t.dueAt&&dayNumber(t.dueAt)<today).length,unscheduled:tasks.filter(t=>!done(t.status)&&(!t.startAt||!t.dueAt)).length,hours:tasks.filter(t=>!done(t.status)).reduce((n,t)=>n+t.estimatedMinutes,0)/60};}
export function scheduleDate(value:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Choose a valid calendar date.');
 const parsed=new Date(value+'T00:00:00.000Z');
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw new Error('Choose a valid calendar date.');
 return parsed;
}
