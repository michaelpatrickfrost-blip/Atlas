import { getImplementedModules } from '@/core/modules/registry';
import { getEnabledModuleIds } from '@/core/modules/runtime';
import type { Session } from '@/core/auth/session';
import type { BusinessPlanningData, BusinessPlanningRequest } from './business';
/** Module-owned projections are the sole integration contract. Each provider
 * enforces source access and returns only authorised fields. No per-cell calls. */
export async function readBusinessPlanning(session:Session,request:BusinessPlanningRequest) {
 const enabled=await getEnabledModuleIds(session.organisationId);
 const result:Required<BusinessPlanningData>&{requiredModules:string[]}={sources:[],products:[],orders:[],deliveries:[],stock:[],supply:[],inputs:[],budgets:[],planRevisions:[],targets:[],requiredCapabilities:[],requiredModules:[],warnings:[]};
 const providers=getImplementedModules().filter(m=>enabled.has(m.id)&&m.businessPlanningProvider&&(!request.modules||request.modules.includes(m.id)));
 const pieces=await Promise.all(providers.map(async m=>({module:m.id,data:await m.businessPlanningProvider!(session,request)})));
 for(const {module,data} of pieces){
  for(const key of ['sources','products','orders','deliveries','stock','supply','inputs','budgets','planRevisions','targets','warnings'] as const) (result[key] as unknown[]).push(...(data[key]??[]));
  if(data.requiredCapabilities.length){result.requiredCapabilities.push(...data.requiredCapabilities);result.requiredModules.push(module);}
 }
 result.requiredCapabilities=[...new Set(result.requiredCapabilities)];
 return result;
}
