export function skillsMatch(skills: string[], required: string[]) {
  const known = new Set(skills.map(skill => skill.trim().toLowerCase()));
  return required.every(skill => known.has(skill.trim().toLowerCase()));
}

/** Workload staffing estimate. This is not an Erlang/service-level forecast. */
export function requiredPeople(input: { volume: number; handlingMinutes: number; shrinkagePercent: number; occupancyPercent: number; minimumPeople: number; startsAt: Date; endsAt: Date }) {
  const minutes = (input.endsAt.getTime() - input.startsAt.getTime()) / 60000;
  const productiveFraction = (1 - input.shrinkagePercent / 100) * input.occupancyPercent / 100;
  if (minutes <= 0 || productiveFraction <= 0) throw new Error("Enter a positive interval, occupancy and productive time.");
  return Math.max(input.minimumPeople, Math.ceil(input.volume * input.handlingMinutes / (minutes * productiveFraction)));
}

export function intervalCoverage(shifts: { startsAt: Date; endsAt: Date; breakMinutes: number; breakStartsAt: Date | null; skills: string[]; unavailable?: boolean; role?:string|null; activities?:{startsAt:Date;endsAt:Date;kind:string;label:string}[] }[], interval: { startsAt: Date; endsAt: Date; requiredSkills: string[];role?:string }) {
  const eligible = shifts.filter(shift => {
    if(shift.unavailable||shift.startsAt>interval.startsAt||shift.endsAt<interval.endsAt||!skillsMatch(shift.skills,interval.requiredSkills))return false;
    const activity=shift.activities?.filter(a=>a.startsAt<interval.endsAt&&a.endsAt>interval.startsAt)??[];
    if(activity.some(a=>a.kind!=="WORK"))return false;
    if(!interval.role)return true;
    return activity.length?activity.some(a=>a.kind==="WORK"&&a.label.toLowerCase()===interval.role!.toLowerCase()&&a.startsAt<=interval.startsAt&&a.endsAt>=interval.endsAt):(shift.role??"").toLowerCase()===interval.role.toLowerCase();
  });
  const unplacedBreaks = eligible.filter(shift => shift.breakMinutes > 0 && !shift.breakStartsAt).length;
  const available = eligible.filter(shift => {
    if (!shift.breakMinutes) return true;
    if (!shift.breakStartsAt) return false;
    return shift.breakStartsAt >= interval.endsAt || new Date(shift.breakStartsAt.getTime() + shift.breakMinutes * 60000) <= interval.startsAt;
  });
  return { scheduled: eligible.length, available: available.length, unplacedBreaks };
}
