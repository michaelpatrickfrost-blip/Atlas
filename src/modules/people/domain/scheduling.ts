/** Auto-scheduling for appraisals and one-to-ones: cadence is an org-wide
 *  default with a per-employee override, and the "manager" an auto-generated
 *  review is assigned to is always the employee's actual line manager (their
 *  `manager.linkedUser`), falling back to whoever triggered the action only
 *  when the employee has no manager set. See src/app/(app)/people/appraisals/actions.ts
 *  and one-to-ones/actions.ts for where this is called. */

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function nextAppraisalDate(from: Date, employeeCadenceMonths: number | null, orgDefaultMonths: number): Date {
  return addMonths(from, employeeCadenceMonths ?? orgDefaultMonths);
}

export function nextOneToOneDate(from: Date, employeeCadenceWeeks: number | null, orgDefaultWeeks: number): Date {
  return addWeeks(from, employeeCadenceWeeks ?? orgDefaultWeeks);
}

export function cycleLabel(date: Date): string {
  const half = date.getMonth() < 6 ? "H1" : "H2";
  return `${date.getFullYear()} ${half} review`;
}
