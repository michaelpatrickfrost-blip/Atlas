export const BUCKETS=['DAY','WEEK','MONTH','QUARTER','YEAR'] as const;
export function planningDate(value:unknown):Date {
 const text=String(value??'');if(!/^\d{4}-\d{2}-\d{2}$/.test(text))throw new Error('Enter a valid calendar date.');
 const date=new Date(`${text}T00:00:00Z`);if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==text)throw new Error('Enter a valid calendar date.');return date;
}
export function planWindow(form:FormData) {
 const startsOn=planningDate(form.get('startsOn')),endsOn=planningDate(form.get('endsOn'));
 if(endsOn<startsOn||endsOn.getTime()-startsOn.getTime()>5*366*86400000)throw new Error('Choose a planning window up to five years, with the end after the start.');
 const bucket=String(form.get('bucket')??'WEEK');if(!BUCKETS.includes(bucket as typeof BUCKETS[number]))throw new Error('Choose a valid planning interval.');
 return {startsOn,endsOn,bucket:bucket as typeof BUCKETS[number]};
}
export function plannedQuantity(value:unknown):string {
 const text=String(value??'').trim();if(!/^\d{1,12}(\.\d{1,6})?$/.test(text)||Number(text)<=0)throw new Error('Enter a positive quantity, with up to six decimal places.');
 return text.replace(/^0+(?=\d)/,'').replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
}
