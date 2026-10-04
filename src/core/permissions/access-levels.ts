export type AccessLevel='none'|'read'|'write'|'admin';
export type AccessGroup={id:string;name:string;capabilities:string[]};
/** Presets expand into the same granular capabilities enforced by business services. */
export function capabilityLevel(cap:string):Exclude<AccessLevel,'none'>{
 const action=cap.split('.').at(-1)??'';
 if(['read','self','view'].includes(action))return 'read';
 if(['decide','verify','post','execute','reopen','approve','reveal','delete','archive','cancel','configure','price_override','confirm'].includes(action)||cap==='finance.period.manage'||cap.startsWith('core.roles.')||cap.startsWith('core.users.')||cap.startsWith('core.modules.'))return 'admin';
 return 'write';
}
export function presetCapabilities(group:AccessGroup,level:AccessLevel){const rank={none:0,read:1,write:2,admin:3};return group.capabilities.filter(cap=>rank[capabilityLevel(cap)]<=rank[level]);}
export function effectiveRoleCapabilities(roles:Iterable<{capabilities:string[]}>,granted:string[]=[],denied:string[]=[]){const caps=new Set([...roles].flatMap(role=>role.capabilities));for(const cap of granted)caps.add(cap);for(const cap of denied)caps.delete(cap);return caps;}
export function capabilityOverrides(base:Set<string>,selected:Set<string>){return {grantedCapabilities:[...selected].filter(cap=>!base.has(cap)),deniedCapabilities:[...base].filter(cap=>!selected.has(cap))};}
