import type {Session} from '@/core/auth/session';
import {assertCapability,can} from '@/core/permissions/check';
import {HR_CAPABILITIES as HR} from '@/core/permissions/capabilities';
import {assertModuleEnabled} from '@/core/modules/access';
import {getEnabledModuleIds} from '@/core/modules/runtime';
import {db} from '@/core/db/client';
export async function hrAccess(session:Session,manage=false){assertCapability(session,manage?HR.employeeManage:HR.employeeRead);await assertModuleEnabled(session,'people');}
export async function employeeOptions(session:Session){return db.employee.findMany({where:{organisationId:session.organisationId,status:{not:'LEFT'}},select:{id:true,firstName:true,lastName:true,email:true,status:true},orderBy:{lastName:'asc'}});}
export function pageNumber(raw?:string){const page=Number(raw??1);return Number.isSafeInteger(page)&&page>0?Math.min(page,100000):1;}
export const personSelect={id:true,firstName:true,lastName:true,department:true} as const;

export async function hrPageRestriction(session:Session,manage=false){if(!can(session,manage?HR.employeeManage:HR.employeeRead))return 'access';return (await getEnabledModuleIds(session.organisationId)).has('people')?null:'disabled';}
