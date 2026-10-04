export const TASK_STATUSES=['BACKLOG','TODO','READY','IN_PROGRESS','REVIEW','WAITING','BLOCKED','DONE','CANCELLED'] as const;
export const PROJECT_STATUSES=['IDEA','PLANNED','PLANNING','READY','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'] as const;
export const HEALTHS=['ON_TRACK','WATCH','AT_RISK','OFF_TRACK','NO_UPDATE'] as const;
export const PRIORITIES=['CRITICAL','HIGH','NORMAL','LOW','NONE'] as const;
export const TASK_TYPES=['TASK','ACTION','ISSUE','REQUEST','BUG','DECISION','APPROVAL','REVIEW','FOLLOW_UP','DELIVERABLE'] as const;
export const PROJECT_TYPES=['PERSONAL','TEAM','DEPARTMENT','CROSS_FUNCTIONAL','CUSTOMER','SUPPLIER','OPERATIONAL','CAPITAL','PRODUCT','IMPLEMENTATION','CHANGE','STRATEGIC','CONFIDENTIAL'] as const;
export const done=(status:string)=>['DONE','CANCELLED'].includes(status);
export function choice(value:unknown,allowed:readonly string[],label:string){if(typeof value!=='string'||!allowed.includes(value))throw new Error(`Choose a valid ${label}.`);return value;}
export function integer(value:unknown,min:number,max:number,label:string){const n=Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error(`Enter ${label} between ${min} and ${max}.`);return n;}
export function dateValue(value:unknown){if(!value)return null;const d=new Date(String(value));if(!Number.isFinite(d.getTime()))throw new Error('Enter a valid date.');return d;}
export function assertDateRange(start:Date|null,end:Date|null){if(start&&end&&start>end)throw new Error('Finish must be on or after the start.');}
export function assertAcyclic(edges:Array<{predecessorId:string;successorId:string}>,from:string,to:string){if(from===to)throw new Error('A task cannot depend on itself.');const seen=new Set<string>(),queue=[to];while(queue.length){const id=queue.pop()!;if(id===from)throw new Error('This dependency would create a cycle.');if(seen.has(id))continue;seen.add(id);queue.push(...edges.filter(e=>e.predecessorId===id).map(e=>e.successorId));}}
export type WorkTask={id:string;title:string;status:string;startAt:Date|null;dueAt:Date|null;estimatedMinutes:number;weight:number;priority:string};
export function progress(tasks:WorkTask[],method:string,manual=0){if(method==='MANUAL')return manual;const weight=(t:WorkTask)=>method==='EFFORT'?t.estimatedMinutes:method==='WEIGHTED_TASKS'?t.weight:1;const included=tasks.filter(t=>t.status!=='CANCELLED'),total=included.reduce((n,t)=>n+weight(t),0);return total?Math.round(100*included.filter(t=>t.status==='DONE').reduce((n,t)=>n+weight(t),0)/total):0;}
export function dependencyConflicts(tasks:WorkTask[],edges:Array<{predecessorId:string;successorId:string;lagDays:number;kind:string}>){const byId=new Map(tasks.map(t=>[t.id,t]));return edges.flatMap(e=>{const a=byId.get(e.predecessorId),b=byId.get(e.successorId);if(!a||!b||done(a.status))return [];const source=e.kind.startsWith('START')?a.startAt:a.dueAt,target=e.kind.endsWith('START')?b.startAt:b.dueAt;if(!source||!target)return [];const days=Math.ceil((source.getTime()+e.lagDays*86400000-target.getTime())/86400000);return days>0?[{predecessor:a,successor:b,days}]:[];});}
export function signals(tasks:WorkTask[],now=new Date()){return tasks.flatMap(t=>done(t.status)?[]:[...(t.status==='BLOCKED'||t.status==='WAITING'?[{taskId:t.id,title:t.title,reason:t.status==='BLOCKED'?'Blocked work':'Waiting on a handoff'}]:[]),...(t.dueAt&&t.dueAt<now?[{taskId:t.id,title:t.title,reason:'Deadline passed'}]:[])]);}
export function nextOccurrence(date:Date,recurrence:string){const d=new Date(date);if(recurrence==='DAILY')d.setUTCDate(d.getUTCDate()+1);else if(recurrence==='WEEKLY')d.setUTCDate(d.getUTCDate()+7);else if(['MONTHLY','QUARTERLY','ANNUALLY'].includes(recurrence)){const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+(recurrence==='MONTHLY'?1:recurrence==='QUARTERLY'?3:12));const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));}else throw new Error('Unsupported recurrence.');return d;}

/** Calendar-day constraint propagation. It suggests dates, never writes them.
 * Unknown dates are reported explicitly instead of inventing durations. */
export function scheduleForecast(tasks:WorkTask[],edges:Array<{predecessorId:string;successorId:string;kind:string;lagDays:number}>,target:Date|null){
 const incomplete=tasks.filter(t=>!done(t.status)),known=incomplete.filter(t=>t.startAt&&t.dueAt),byId=new Map(known.map(t=>[t.id,t])),links=edges.filter(e=>byId.has(e.predecessorId)&&byId.has(e.successorId)),day=86400000;
 if(!known.length)return {forecast:null as Date|null,critical:[] as string[],slack:{} as Record<string,number>,missingDates:incomplete.length};
 const duration=new Map(known.map(t=>[t.id,Math.max(0,(t.dueAt!.getTime()-t.startAt!.getTime())/day)])),starts=new Map(known.map(t=>[t.id,t.startAt!.getTime()/day])),degree=new Map(known.map(t=>[t.id,links.filter(e=>e.successorId===t.id).length])),queue=known.filter(t=>degree.get(t.id)===0).map(t=>t.id),order:string[]=[];
 const offset=(e:typeof links[number])=>e.lagDays+(e.kind.startsWith('FINISH')?duration.get(e.predecessorId)!:0)-(e.kind.endsWith('FINISH')?duration.get(e.successorId)!:0);
 while(queue.length){const id=queue.shift()!;order.push(id);for(const e of links.filter(e=>e.predecessorId===id)){starts.set(e.successorId,Math.max(starts.get(e.successorId)!,starts.get(id)!+offset(e)));degree.set(e.successorId,degree.get(e.successorId)!-1);if(degree.get(e.successorId)===0)queue.push(e.successorId);}}
 if(order.length!==known.length)throw new Error('Schedule contains a dependency cycle.');
 const finish=Math.max(...known.map(t=>starts.get(t.id)!+duration.get(t.id)!)),deadline=target?target.getTime()/day:finish,latest=new Map(known.map(t=>[t.id,deadline-duration.get(t.id)!]));
 for(const id of [...order].reverse())for(const e of links.filter(e=>e.predecessorId===id))latest.set(id,Math.min(latest.get(id)!,latest.get(e.successorId)!-offset(e)));
 const slack=Object.fromEntries(known.map(t=>[t.id,Math.floor(latest.get(t.id)!-starts.get(t.id)!)]));return {forecast:new Date(finish*day),critical:known.filter(t=>slack[t.id]<=0).map(t=>t.id),slack,missingDates:incomplete.length-known.length};
}
export function distributeEffort(task:{startAt:Date|null;dueAt:Date|null;estimatedMinutes:number},from:Date,days=7,workingDays=[1,2,3,4,5]){
 const result=Array(days).fill(0) as number[],start=task.startAt??task.dueAt,end=task.dueAt??task.startAt;if(!start||!end)return result;
 const first=Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate()),last=Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate()),dates:number[]=[];
 for(let date=first;date<=last&&dates.length<3660;date+=86400000)if(workingDays.includes(new Date(date).getUTCDay()))dates.push(date);
 if(!dates.length)dates.push(last);const share=task.estimatedMinutes/dates.length,anchor=Date.UTC(from.getUTCFullYear(),from.getUTCMonth(),from.getUTCDate());for(const date of dates){const index=(date-anchor)/86400000;if(index>=0&&index<days)result[index]+=share;}return result;
}
