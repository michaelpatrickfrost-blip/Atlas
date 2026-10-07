import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const mock=vi.hoisted(()=>({ find:vi.fn() }));
vi.mock("@/core/db/client",()=>({db:{workTeam:{findMany:async()=>[]},employee:{findFirstOrThrow:mock.find}}}));
import { requireTeamEmployee, teamScope } from "@/modules/people/services/team-access";
import { canReadModel, deniedScalar, modelScope } from "@/server/data-api/read-policy";
const session=(caps:string[]=[]):Session=>({userId:"manager",organisationId:"org",membershipId:"m",userName:"Manager",userEmail:"m@example.com",organisationName:"Org",capabilities:new Set(["core.profile.self",...caps])});
beforeEach(()=>mock.find.mockReset());
describe("HR relationship authorization",()=>{
 it("allows only an assigned direct manager with team capability",async()=>{
  mock.find.mockResolvedValue({id:"staff",userId:"staff-user",status:"ACTIVE",manager:{userId:"manager",organisationId:"org"}});
  await expect(requireTeamEmployee(session(["people.team.manage"]),"staff")).resolves.toMatchObject({id:"staff"});
  await expect(requireTeamEmployee(session(),"staff")).rejects.toThrow("FORBIDDEN");
  expect(mock.find.mock.calls[0][0].where).toEqual({id:"staff",organisationId:"org"});
 });
 it("blocks another manager, foreign-company manager relationships, and own approvals",async()=>{
  const s=session(["people.team.manage"]);
  for(const manager of [{userId:"other",organisationId:"org"},{userId:"manager",organisationId:"foreign"}]) {
   mock.find.mockResolvedValue({id:"staff",userId:"staff-user",manager});
   await expect(requireTeamEmployee(s,"staff")).rejects.toThrow("FORBIDDEN");
  }
  mock.find.mockResolvedValue({id:"self",userId:"manager",manager:null});
  await expect(requireTeamEmployee(session(["people.employee.manage"]),"self")).rejects.toThrow("FORBIDDEN");
  await expect(requireTeamEmployee(session(),"self",true)).resolves.toMatchObject({id:"self"});
 });
 it("permits HR management outside their own team and uses server-derived scope",async()=>{
  mock.find.mockResolvedValue({id:"staff",userId:"staff-user",manager:null});
  await expect(requireTeamEmployee(session(["people.employee.manage"]),"staff")).resolves.toMatchObject({id:"staff"});
  expect(await teamScope(session(["people.team.manage"]),true)).toEqual({organisationId:"org",OR:[{manager:{userId:"manager",organisationId:"org"}}]});
 });
 it("limits generic manager absence reads to self and direct reports in this company",()=>{
  const scope=modelScope(session(["people.team.manage"]),"AbsenceRecord");
  expect(scope).toEqual({organisationId:"org",employee:{organisationId:"org",OR:[{userId:"manager"},{manager:{organisationId:"org",userId:"manager"}}]}});
 });
 it("never exposes private notes or timesheets through the generic query endpoint",()=>{
  const s=session(["people.employee.read","people.team.manage"]);
  for(const model of ["EmployeeNote","Timesheet","TimesheetEntry","ShiftTask"] as const) expect(canReadModel(s,model)).toBe(false);
  expect(deniedScalar(s,"Employee","notes")).toBe(true);
  expect(deniedScalar(s,"AbsenceRecord","notes")).toBe(true);
  expect(deniedScalar(s,"Employee","annualSalaryMinorUnits")).toBe(true);
 });
});
