import { describe, expect, it } from "vitest";
import { computeOpportunityReasons } from "@/modules/sales/services/work-queue";

const now = new Date("2026-10-03T12:00:00Z");

function stage(overrides: Partial<{ name: string; typicalDurationDays: number | null }> = {}) {
  return { name: "Proposal", typicalDurationDays: 7, ...overrides };
}

describe("computeOpportunityReasons", () => {
  it("flags an opportunity with no next action as high priority, with an explicit reason", () => {
    const { reasons, priority } = computeOpportunityReasons(
      { nextActionAt: null, stageEnteredAt: now, expectedCloseDate: null, stage: stage() },
      now,
    );
    expect(priority).toBe("high");
    expect(reasons).toContain("No next action set");
  });

  it("flags an overdue next action with the original due date in the reason", () => {
    const overdue = new Date("2026-10-01T09:00:00Z");
    const { reasons, priority } = computeOpportunityReasons(
      { nextActionAt: overdue, stageEnteredAt: now, expectedCloseDate: null, stage: stage() },
      now,
    );
    expect(priority).toBe("high");
    expect(reasons[0]).toContain("Next action overdue");
  });

  it("does not flag a future next action", () => {
    const future = new Date("2026-10-10T09:00:00Z");
    const { reasons, priority } = computeOpportunityReasons(
      { nextActionAt: future, stageEnteredAt: now, expectedCloseDate: null, stage: stage() },
      now,
    );
    expect(reasons).toHaveLength(0);
    expect(priority).toBe("normal");
  });

  it("flags unusually long time in stage, naming the stage and its typical duration", () => {
    const enteredStage = new Date("2026-09-01T12:00:00Z"); // 32 days ago
    const future = new Date("2026-10-10T09:00:00Z");
    const { reasons, priority } = computeOpportunityReasons(
      { nextActionAt: future, stageEnteredAt: enteredStage, expectedCloseDate: null, stage: stage({ name: "Negotiation", typicalDurationDays: 10 }) },
      now,
    );
    expect(priority).toBe("high");
    expect(reasons[0]).toContain("Negotiation");
    expect(reasons[0]).toContain("typically 10 days");
  });

  it("flags a passed expected close date", () => {
    const future = new Date("2026-10-10T09:00:00Z");
    const passedClose = new Date("2026-09-20T00:00:00Z");
    const { reasons, priority } = computeOpportunityReasons(
      { nextActionAt: future, stageEnteredAt: now, expectedCloseDate: passedClose, stage: stage() },
      now,
    );
    expect(priority).toBe("high");
    expect(reasons.some((r) => r.includes("Expected close date passed"))).toBe(true);
  });

  it("returns no reasons and normal priority for a healthy opportunity", () => {
    const future = new Date("2026-10-10T09:00:00Z");
    const { reasons, priority } = computeOpportunityReasons(
      { nextActionAt: future, stageEnteredAt: now, expectedCloseDate: future, stage: stage() },
      now,
    );
    expect(reasons).toHaveLength(0);
    expect(priority).toBe("normal");
  });
});
