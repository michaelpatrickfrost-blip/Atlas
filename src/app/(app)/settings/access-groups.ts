import {CORE_CAPABILITIES,CUSTOMER_CAPABILITIES} from '@/core/permissions/capabilities';
import {hrAccessGroups} from '@/core/permissions/hr-access';
import {MODULE_CATALOGUE} from '@/core/modules/registry';
import type {AccessGroup} from '@/core/permissions/access-levels';
export function accessGroups():AccessGroup[]{const seen=new Set<string>();return [{id:'platform',name:'Company administration & shared tools',capabilities:Object.values(CORE_CAPABILITIES)},{id:'customers',name:'Customers & relationships',capabilities:Object.values(CUSTOMER_CAPABILITIES)},...MODULE_CATALOGUE.filter(m=>m.status!=='coming_soon').flatMap(m=>m.id==='people'?hrAccessGroups():[{id:m.id,name:m.name,capabilities:[...m.capabilities]}])].map(group=>({...group,capabilities:group.capabilities.filter(cap=>{if(seen.has(cap)||cap==='core.profile.self')return false;seen.add(cap);return true;})})).filter(group=>group.capabilities.length);}
