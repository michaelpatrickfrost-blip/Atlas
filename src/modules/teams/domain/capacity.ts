export function distributeWork(hours:number, startsOn:string|null, dueOn:string|null, workingDays:number[]) {
  if(!Number.isFinite(hours)||hours<0||!dueOn)return [];
  const start=new Date(`${startsOn??dueOn}T00:00:00Z`),end=new Date(`${dueOn}T00:00:00Z`),days:string[]=[];
  if(end<start||end.getTime()-start.getTime()>366*86400000)return [];
  for(let date=start;date<=end;date=new Date(date.getTime()+86400000))if(workingDays.includes(date.getUTCDay()))days.push(date.toISOString().slice(0,10));
  // A deadline on a non-working day is still a demand signal, never discarded.
  if(!days.length)days.push(dueOn);
  return days.map(day=>({day,hours:hours/days.length}));
}

/** Union blocked rota time so a break inside training is never deducted twice. */
export function shiftCapacityHours(shift:{startsAt:Date;endsAt:Date;breakMinutes:number;breakStartsAt:Date|null;activities?:{kind:string;startsAt:Date;endsAt:Date}[]},start:Date,end:Date) {
  const from=Math.max(start.getTime(),shift.startsAt.getTime()),until=Math.min(end.getTime(),shift.endsAt.getTime());
  if(until<=from)return 0;
  const ranges=(shift.activities??[]).filter(activity=>activity.kind!=="WORK").map(activity=>[activity.startsAt.getTime(),activity.endsAt.getTime()]);
  if(shift.breakStartsAt)ranges.push([shift.breakStartsAt.getTime(),shift.breakStartsAt.getTime()+shift.breakMinutes*60000]);
  const clipped=ranges.map(([a,b])=>[Math.max(a,from),Math.min(b,until)]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
  let blocked=0,lastStart=clipped[0]?.[0]??0,lastEnd=lastStart;
  for(const [a,b] of clipped){if(a>lastEnd){blocked+=lastEnd-lastStart;lastStart=a;lastEnd=b;}else lastEnd=Math.max(lastEnd,b);}
  blocked+=lastEnd-lastStart;
  // Untimed legacy breaks use a conservative proportional deduction until placed.
  const unknownBreak=shift.breakStartsAt?0:shift.breakMinutes*60000*(until-from)/(shift.endsAt.getTime()-shift.startsAt.getTime());
  return Math.max(0,until-from-blocked-unknownBreak)/3600000;
}
