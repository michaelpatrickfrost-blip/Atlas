/** PostgreSQL JSONB normalises object key order. Evidence comparison must compare
 * values, not the insertion order used by the current source projection. */
function canonical(value:unknown):unknown{
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)]));
 return value;
}
export function planningSignature(value:{inputs?:unknown[];targets?:unknown[];planRevisions?:unknown[]}){
 const ordered=(items:unknown[]=[])=>items.map(item=>JSON.stringify(canonical(item))).sort();
 return JSON.stringify([ordered(value.inputs),ordered(value.targets),ordered(value.planRevisions)]);
}
