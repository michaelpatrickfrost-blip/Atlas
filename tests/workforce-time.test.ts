import { describe, expect, it } from "vitest";
import { dateOnly, mondayOf, workingLeaveDays, hoursToMinutes } from "@/modules/people/domain/working-time";
import { calculateLeaveBalance } from "@/modules/people/domain/leave-balance";
import { londonInstant, paidMinutes } from "@/modules/scheduling/domain/time";
describe("workforce hours and dates",()=>{
 it("rejects invalid dates and normalises Sundays to the preceding Monday",()=>{
  expect(()=>dateOnly("2026-02-30")).toThrow();
  expect(mondayOf(dateOnly("2026-10-04")).toISOString().slice(0,10)).toBe("2026-09-28");
 });
 it("counts contracted workdays and honours saved leave quantities",()=>{
  const start=dateOnly("2026-10-05"),end=dateOnly("2026-10-11");
  expect(workingLeaveDays(start,end)).toBe(5);
  expect(workingLeaveDays(start,end,[2,4,6])).toBe(3);
  expect(calculateLeaveBalance({entitlementDays:25,approvedHolidays:[{startDate:start,endDate:end,bookedDays:3}]})).toEqual({entitlement:25,taken:3,remaining:22});
  expect(()=>workingLeaveDays(end,start)).toThrow();
 });
 it("validates timesheet actual hours in quarter-hour increments",()=>{
  expect(hoursToMinutes("7.75")).toBe(465);
  for(const value of ["-1","24.25","NaN","Infinity","1.1"])expect(()=>hoursToMinutes(value)).toThrow();
 });
 it("uses UK wall times in summer/winter and rejects the missing DST hour",()=>{
  expect(londonInstant("2026-07-01","09:00").toISOString()).toBe("2026-07-01T08:00:00.000Z");
  expect(londonInstant("2026-12-01","09:00").toISOString()).toBe("2026-12-01T09:00:00.000Z");
  expect(()=>londonInstant("2026-03-29","01:30")).toThrow("does not exist");
  expect(londonInstant("2026-10-25","01:30").toISOString()).toBe("2026-10-25T00:30:00.000Z");
 });
 it("deducts breaks and rejects zero/overlong shifts or invalid breaks",()=>{
  const start=londonInstant("2026-10-05","09:00"),end=londonInstant("2026-10-05","17:00");
  expect(paidMinutes(start,end,30)).toBe(450);
  expect(()=>paidMinutes(start,end,480)).toThrow();
  expect(()=>paidMinutes(start,end,-1)).toThrow();
  expect(()=>paidMinutes(start,start,0)).toThrow();
 });
});
