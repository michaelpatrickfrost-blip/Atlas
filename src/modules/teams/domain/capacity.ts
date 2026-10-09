export function distributeWork(hours:number, startsOn:string|null, dueOn:string|null, workingDays:number[]) {
  if(!Number.isFinite(hours)||hours<0||!dueOn)return [];
  const start=new Date(`${startsOn??dueOn}T00:00:00Z`),end=new Date(`${dueOn}T00:00:00Z`),days:string[]=[];
  if(end<start||end.getTime()-start.getTime()>366*86400000)return [];
  for(let date=start;date<=end;date=new Date(date.getTime()+86400000))if(workingDays.includes(date.getUTCDay()))days.push(date.toISOString().slice(0,10));
  // A deadline on a non-working day is still a demand signal, never discarded.
  if(!days.length)days.push(dueOn);
  return days.map(day=>({day,hours:hours/days.length}));
}
