export class GoalInputError extends Error {}
export function goalDate(raw:string){const d=new Date(raw+"T00:00:00Z");if(!/^\d{4}-\d{2}-\d{2}$/.test(raw)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==raw)throw new GoalInputError("Choose a valid calendar date.");return d;}
