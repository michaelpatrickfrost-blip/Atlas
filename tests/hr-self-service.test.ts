import { beforeEach, describe, expect, it, vi } from "vitest";
const mock=vi.hoisted(()=>({
 session: {userId:"manager",organisationId:"org",membershipId:"m",userName:"Manager",userEmail:"manager@example.com",organisationName:"Org",capabilities:new Set<string>()},
 find:vi.fn(), first:vi.fn(),noteCreate:vi.fn(),sheetUpdate:vi.fn(),sheetFind:vi.fn(),entriesDelete:vi.fn(),entriesCreate:vi.fn(),absenceCount:vi.fn(),absenceCreate:vi.fn(), transaction:vi.fn(), audit:vi.fn(),
}));
vi.mock("@/core/auth/session",()=>({requireSession:async()=>mock.session}));
vi.mock("@/core/modules/access",()=>({assertModuleEnabled:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/core/db/client",()=>({db:{workTeam:{findMany:async()=>[]}, employee:{findFirstOrThrow:mock.find,findFirst:mock.first},employeeNote:{create:mock.noteCreate}, timesheet:{findFirstOrThrow:mock.sheetFind,update:mock.sheetUpdate}, $transaction:mock.transaction, auditEntry:{create:mock.audit} }}));
import { getMyHR, getTeamEmployee, addPrivateNote } from "@/app/(app)/people/self-service";
import { saveTimesheet, reviewTimesheet } from "@/app/(app)/people/timesheets/actions";
import { requestLeave } from "@/app/(app)/people/absence/actions";
import { mondayOf, addDays } from "@/modules/people/domain/working-time";
beforeEach(()=>{
 vi.clearAllMocks();mock.session.capabilities=new Set(["core.profile.self","people.team.manage"]);
 mock.find.mockResolvedValue({id:"staff",userId:"staff-user",status:"ACTIVE",manager:{userId:"manager",organisationId:"org"}});
});
describe("HR dedicated action privacy and workflow gates",()=>{
 it("self HR requests select no private notes, salary or appraisal content",async()=>{
  await getMyHR(); const query=mock.first.mock.calls[0][0];
  expect(query.where).toEqual({organisationId:"org",userId:"manager"});
  expect(query.select.privateNotes).toBeUndefined();expect(query.select.notes).toBeUndefined();expect(query.select.annualSalaryMinorUnits).toBeUndefined();expect(query.select.appraisals).toBeUndefined();
 });
 it("manager note reads explicitly exclude HR-only notes",async()=>{
  await getTeamEmployee("staff");
  expect(mock.find.mock.calls[1][0].select.privateNotes.where).toEqual({audience:"MANAGER_HR"});
 });
 it("a manager cannot create HR-only notes or notes for themselves",async()=>{
  const form=new FormData();form.set("body","private HR detail");form.set("audience","HR_ONLY");
  await expect(addPrivateNote("staff",form)).rejects.toThrow("HR-only");expect(mock.noteCreate).not.toHaveBeenCalled();
  mock.find.mockResolvedValue({id:"self",userId:"manager",manager:null});form.set("audience","MANAGER_HR");
  await expect(addPrivateNote("self",form)).rejects.toThrow("FORBIDDEN");
 });
 it("submitted timesheets cannot be overwritten",async()=>{
  const form=new FormData();form.set("employeeId","staff");form.set("weekStart",mondayOf(new Date()).toISOString().slice(0,10));form.set("hours_0","8");
  mock.transaction.mockImplementation(async callback=>callback({timesheet:{findFirst:async()=>({id:"locked",status:"SUBMITTED"}),update:mock.sheetUpdate},timesheetEntry:{deleteMany:mock.entriesDelete,createMany:mock.entriesCreate}}));
  await expect(saveTimesheet(form)).rejects.toThrow("locked");expect(mock.sheetUpdate).not.toHaveBeenCalled();expect(mock.entriesDelete).not.toHaveBeenCalled();
 });
 it("no one approves their own timesheet",async()=>{
  mock.session.capabilities.add("people.employee.manage");mock.sheetFind.mockResolvedValue({employeeId:"self"});mock.find.mockResolvedValue({id:"self",userId:"manager",manager:null});
  const form=new FormData();form.set("decision","APPROVED");
  await expect(reviewTimesheet("sheet",form)).rejects.toThrow("FORBIDDEN");expect(mock.sheetUpdate).not.toHaveBeenCalled();
 });
 it("duplicate holiday requests are rejected before a record is saved",async()=>{
  mock.session.capabilities.add("people.holiday.self");
  const start=addDays(mondayOf(new Date()),14);const form=new FormData();form.set("startDate",start.toISOString().slice(0,10));form.set("endDate",start.toISOString().slice(0,10));
  mock.absenceCount.mockResolvedValue(1);
  mock.transaction.mockImplementation(async callback=>callback({employee:{findFirstOrThrow:async()=>({id:"own",workingDays:[1,2,3,4,5],annualLeaveDaysEntitlement:25})},absenceRecord:{count:mock.absenceCount,create:mock.absenceCreate}}));
  await expect(requestLeave(form)).rejects.toThrow("already");expect(mock.absenceCreate).not.toHaveBeenCalled();
 });
});
