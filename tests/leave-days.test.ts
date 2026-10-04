import { describe, expect, it } from "vitest";
import { allowanceDays, leaveDayCount } from "@/modules/people/domain/leave-balance";
import { workingLeaveDays } from "@/modules/people/domain/working-time";

describe("holiday day counts", () => {
  it("counts contracted weekdays and ignores the weekend", () => {
    expect(workingLeaveDays(new Date("2026-10-05T00:00:00Z"), new Date("2026-10-11T00:00:00Z"), [1, 2, 3, 4, 5])).toBe(5);
  });
  it("accepts a half-day edit and a whole-day allowance", () => {
    expect(leaveDayCount("4.5")).toBe(4.5);
    expect(allowanceDays("28")).toBe(28);
    expect(() => leaveDayCount("4.25")).toThrow(/half-day/);
    expect(() => allowanceDays("28.5")).toThrow(/whole-day/);
  });
});
