import { describe, expect, it } from "vitest";
import type { Session } from "@/core/auth/session";
import { judgeGoal, readActual } from "@/modules/kpis/domain/progress";
import { goalWhere, planWhere } from "@/modules/kpis/services/access";
import { canReadModel, modelScope } from "@/server/data-api/read-policy";

const session = (userId: string, caps: string[]): Session => ({
  userId,
  organisationId: "org",
  membershipId: "m",
  userName: "Person",
  userEmail: "person@example.com",
  organisationName: "Org",
  capabilities: new Set(caps),
});

describe("goal scoring", () => {
  const start = new Date("2026-10-01T00:00:00Z");
  const end = new Date("2026-10-10T00:00:00Z");
  const midway = new Date("2026-10-05T12:00:00Z");

  it("scores a rising target against a straight line", () => {
    const shared = { target: 90, direction: "AT_LEAST" as const, startsAt: start, endsAt: end, now: midway };
    expect(judgeGoal({ ...shared, actual: 50 }).verdict).toBe("ahead");
    expect(judgeGoal({ ...shared, actual: 40 }).verdict).toBe("on_track");
    expect(judgeGoal({ ...shared, actual: 30 }).verdict).toBe("behind");
    expect(judgeGoal({ ...shared, actual: 20 }).verdict).toBe("at_risk");
    expect(judgeGoal({ ...shared, actual: 90 }).verdict).toBe("met");
  });

  it("treats a limit as over only when the allowance is passed", () => {
    const shared = { target: 100, direction: "AT_MOST" as const, startsAt: start, endsAt: end, now: midway };
    expect(judgeGoal({ ...shared, actual: 30 }).verdict).toBe("ahead");
    expect(judgeGoal({ ...shared, actual: 40 }).verdict).toBe("on_track");
    expect(judgeGoal({ ...shared, actual: 50 }).verdict).toBe("behind");
    expect(judgeGoal({ ...shared, actual: 50 }).summary).toContain("using the allowance faster");
    expect(judgeGoal({ ...shared, actual: 110 }).verdict).toBe("over");
  });

  it("does not add rates or mixed currencies", () => {
    expect(readActual([{ label: "A", value: 10 }, { label: "B", value: 20 }], "percent", "")).toMatchObject({ actual: null });
    expect(readActual([{ label: "A", value: 12 }], "percent", "A")).toMatchObject({ actual: 12 });
    expect(readActual([{ label: "GBP", value: 100 }, { label: "EUR", value: 50 }], "money", "")).toMatchObject({ actual: null });
    expect(readActual([{ label: "GBP", value: 100 }, { label: "EUR", value: 50 }], "money", "GBP")).toMatchObject({ actual: 100, currency: "GBP" });
    expect(readActual([{ label: "North", value: 2 }, { label: "South", value: 3 }], "count", "")).toMatchObject({ actual: 5 });
  });

  it("says a snapshot is a position rather than a period total", () => {
    const judged = judgeGoal({ actual: 4, target: 10, direction: "AT_LEAST", startsAt: start, endsAt: end, now: midway, snapshot: true });
    expect(judged.summary.startsWith("This is the current position")).toBe(true);
  });
});

describe("goal privacy", () => {
  const profile = session("person", ["core.profile.self"]);
  const scorecards = session("analyst", ["core.profile.self", "kpis.read"]);
  const hr = session("hr", ["core.profile.self", "people.conduct.read", "people.employee.read"]);
  const payroll = session("pay", ["core.profile.self", "people.employee.manage"]);
  const analytics = session("board", ["analytics.dashboard.read"]);

  it("keeps personal and draft plans off other people's reads", () => {
    expect(canReadModel(analytics, "Kpi")).toBe(false);
    expect(canReadModel(profile, "Kpi")).toBe(true);
    expect(modelScope(profile, "Kpi")).toEqual(goalWhere(profile));
    expect(modelScope(profile, "PerformancePlan")).toEqual(planWhere(profile));
    expect(JSON.stringify(modelScope(profile, "Kpi"))).not.toContain("COMPANY");
    expect(modelScope(scorecards, "Kpi")).toEqual(goalWhere(scorecards));
    const limited = goalWhere(scorecards);
    expect("OR" in limited && limited.OR?.[0]).toEqual({ visibility: "COMPANY" });
    expect(modelScope(hr, "Kpi")).toEqual({ organisationId: "org" });
    expect(modelScope(hr, "PerformancePlan")).toEqual({ organisationId: "org" });
    expect(modelScope(payroll, "Kpi")).toEqual(goalWhere(payroll));
    expect(JSON.stringify(modelScope(payroll, "PerformancePlan"))).not.toContain("\"organisationId\":\"org\"}");
    expect(modelScope(profile, "KpiUpdate")).toEqual({ kpi: goalWhere(profile) });
    expect(modelScope(profile, "PerformanceReview")).toEqual({ plan: planWhere(profile) });
    expect(canReadModel(profile, "DisciplinaryCase")).toBe(false);
  });
});
