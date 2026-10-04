import { describe, expect, it } from "vitest";
import { boundedNumber, taskDeadline, validateEmployeeTransition } from "../src/modules/people/domain/workflows";

describe("HR workflow policy", () => {
  it("preserves zero leave entitlement and rejects invalid financial/hour inputs", () => {
    expect(boundedNumber("0", "Leave", 0, 366, true)).toBe(0);
    for (const input of ["NaN", "Infinity", "-1", "", null]) expect(() => boundedNumber(input, "Salary", 0, 100)).toThrow();
    expect(() => boundedNumber("1.5", "Cadence", 1, 60, true)).toThrow();
  });
  it("sets pre-start, induction, training and probation task deadlines without changing the anchor", () => {
    const anchor = new Date("2026-10-03T00:00:00Z");
    expect(taskDeadline(anchor, "IT", "ONBOARDING", "Accounts").toISOString().slice(0,10)).toBe("2026-10-02");
    expect(taskDeadline(anchor, "Training", "ONBOARDING", "Mandatory training").toISOString().slice(0,10)).toBe("2026-10-10");
    expect(taskDeadline(anchor, "Induction", "ONBOARDING", "Schedule 30-day probation check-in").toISOString().slice(0,10)).toBe("2026-11-02");
    expect(taskDeadline(anchor, "IT", "OFFBOARDING", "Revoke accounts").getTime()).toBe(anchor.getTime());
    expect(anchor.toISOString()).toBe("2026-10-03T00:00:00.000Z");
  });
  it("blocks direct departure and incomplete onboarding/offboarding", () => {
    expect(() => validateEmployeeTransition("ACTIVE", "LEFT", 0)).toThrow();
    expect(() => validateEmployeeTransition("ONBOARDING", "ACTIVE", 2)).toThrow();
    expect(() => validateEmployeeTransition("OFFBOARDING", "LEFT", 1)).toThrow();
    expect(() => validateEmployeeTransition("LEFT", "ACTIVE", 0)).toThrow();
    expect(() => validateEmployeeTransition("ONBOARDING", "ACTIVE", 0)).not.toThrow();
    expect(() => validateEmployeeTransition("OFFBOARDING", "LEFT", 0)).not.toThrow();
    expect(() => validateEmployeeTransition("ACTIVE", "ON_LEAVE", 9)).not.toThrow();
  });
});
