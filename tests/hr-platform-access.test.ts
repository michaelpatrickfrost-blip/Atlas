import {describe,it,expect,vi} from 'vitest';
import type {Session} from '@/core/auth/session';
vi.mock('@/core/db/client',()=>({db:{}}));
import {canReadModel,modelScope} from '@/server/data-api/read-policy';
const session=(caps:string[])=>({organisationId:'org',userId:'staff',capabilities:new Set(caps)} as Session);
describe('HR platform data API',()=>{
 it('employee reading and self-service do not expose applicants or vacancies',()=>{for(const cap of ['core.profile.self','people.employee.read','people.onboarding.manage'])for(const model of ['HrVacancy','HrApplication'] as const)expect(canReadModel(session([cap]),model)).toBe(false);expect(canReadModel(session(['people.employee.manage']),'HrApplication')).toBe(true);});
 it('recruitment scopes bind company and active entitlement',()=>{expect(modelScope(session(['people.employee.manage']),'HrApplication')).toEqual({organisationId:'org',organisation:{moduleStates:{some:{moduleId:'people',enabled:true,entitled:true}}}});});
 it('training self-service is restricted by company and linked login',()=>{expect(canReadModel(session(['core.profile.self']),'EmployeeTraining')).toBe(true);expect(modelScope(session(['core.profile.self']),'EmployeeTraining')).toMatchObject({organisationId:'org',employee:{organisationId:'org',userId:'staff'}});expect(modelScope(session(['people.employee.read']),'EmployeeTraining')).toMatchObject({organisationId:'org',employee:{organisationId:'org'}});});
});
