import { describe, expect, it } from "vitest";
import { contractedMonthMinutes, datesForWeekdays, dayCoverage, holidayBlockReason, monthDates, patternPaidMinutes, peopleForMinutes, planCover, requiredManMinutes } from "@/modules/scheduling/domain/planner";

describe("people planner", () => {
  it("turns call-centre traffic into man-hours after shrinkage", () => {
    expect(requiredManMinutes({ requiredMinutes: null, forecastVolume: 400, minutesPerUnit: 6, shrinkagePercent: 30 })).toBe(Math.ceil(2400 / 0.7));
    expect(requiredManMinutes({ requiredMinutes: 480, forecastVolume: 400, minutesPerUnit: 6, shrinkagePercent: 30 })).toBe(480);
    expect(peopleForMinutes(3429, patternPaidMinutes("08:00", "16:00", 30))).toBe(8);
  });

  it("counts a shortfall only from people who are still available", () => {
    const coverage = dayCoverage("2026-10-06", [
      { day: "2026-10-06", teamId: "", department: "Contact", workTypeId: "", requiredMinutes: null, forecastVolume: 100, minutesPerUnit: 6, shrinkagePercent: 0 },
    ], [
      { employeeId: "a", day: "2026-10-06", minutes: 450 },
      { employeeId: "b", day: "2026-10-06", minutes: 450 },
    ], new Set(["b"]));
    expect(coverage.required).toBe(600);
    expect(coverage.planned).toBe(450);
    expect(coverage.short).toBe(150);
    expect(coverage.absentMinutes).toBe(450);
  });

  it("closes holiday requests in a busy month and enforces the daily cap", () => {
    const rules = [{ name: "Christmas peak", startsOn: "2026-12-01", endsOn: "2026-12-24", teamId: "", department: "Contact", maxOffPerDay: 2, blockHolidays: false }];
    const ask = { id: "c", department: "Contact", teamIds: ["team"], days: ["2026-12-14"] };
    const others = [
      { id: "a", department: "Contact", teamIds: ["team"], days: ["2026-12-14"] },
      { id: "b", department: "Contact", teamIds: ["team"], days: ["2026-12-14"] },
      { id: "office", department: "Finance", teamIds: [], days: ["2026-12-14"] },
    ];
    expect(holidayBlockReason(ask, others, rules)).toMatch(/allows 2 people off/);
    expect(holidayBlockReason({ ...ask, department: "Finance" }, others, rules)).toBeNull();
    expect(holidayBlockReason(ask, others, [{ ...rules[0], blockHolidays: true, maxOffPerDay: null }])).toMatch(/closed/);
  });

  it("moves the largest gap to the teammate with unused hours and does not use them twice", () => {
    const moves = planCover([
      { shiftId: "early", day: "2026-10-06", minutes: 450, teamId: "line", department: "Production" },
      { shiftId: "late", day: "2026-10-06", minutes: 300, teamId: "line", department: "Production" },
    ], [
      { id: "sam", teamIds: ["line"], department: "Production", remainingMinutes: 800, absentDays: [], busyDays: [] },
      { id: "jo", teamIds: ["line"], department: "Production", remainingMinutes: 200, absentDays: [], busyDays: [] },
      { id: "off", teamIds: ["line"], department: "Production", remainingMinutes: 900, absentDays: ["2026-10-06"], busyDays: [] },
    ]);
    expect(moves).toEqual([{ shiftId: "early", employeeId: "sam" }, { shiftId: "late", employeeId: "jo" }]);
  });

  it("plans office weekdays across a month against contracted hours", () => {
    const october = monthDates("2026-10");
    const weekdays = datesForWeekdays(october, [1, 2, 3, 4, 5]);
    expect(weekdays).toHaveLength(22);
    expect(contractedMonthMinutes(37.5, [1, 2, 3, 4, 5], october)).toBe(22 * 7.5 * 60);
  });
});
