import { describe, expect, it } from "vitest";
import { explainRisk, DEFAULT_FIVE_BY_FIVE, QUALITATIVE_MATRIX, THREE_BY_THREE } from "@/modules/safety/domain/matrix";
import { assistRiddor, riddorDecisionComplete } from "@/modules/safety/domain/riddor";
import {
  authoriseCompetence, canOverrideControl, canReleaseHold, coverageGap, displayedPermitStatus,
  incidentRate, permitConflictHint, permitTransition, puwerOverall, storageIncompatibility, asbestosMessage,
} from "@/modules/safety/domain/work";

describe("safety risk matrix", () => {
  it("explains a 5×5 score and refuses to treat it as proof of control", () => {
    const result = explainRisk(DEFAULT_FIVE_BY_FIVE, 4, 5, null);
    expect(result.score).toBe(20);
    expect(result.label).toBe("Critical");
    expect(result.explanation).toContain("Likely (4) × Catastrophic (5) = 20");
    expect(result.explanation).toContain("does not by itself prove");
  });

  it("supports a 3×3 matrix and a qualitative rating with no score", () => {
    expect(explainRisk(THREE_BY_THREE, 2, 2, null).label).toBe("Medium");
    const qualitative = explainRisk(QUALITATIVE_MATRIX, null, null, "High");
    expect(qualitative.score).toBeNull();
    expect(qualitative.label).toBe("High");
  });
});

describe("RIDDOR assistance", () => {
  it("offers a category for review and never marks the event reportable by itself", () => {
    const help = assistRiddor({ workRelated: true, personClass: "EMPLOYEE", outcome: "SPECIFIED_INJURY" });
    expect(help.potentialCategory).toBe("Specified injury");
    expect(help.requiresResponsibleReview).toBe(true);
    expect(help.guidance).toContain("not a decision");
    expect(riddorDecisionComplete({ decision: "REPORTABLE", rationale: "Fracture confirmed by the responsible person after review of the injury." }).ok).toBe(true);
    expect(riddorDecisionComplete({ decision: "REPORTABLE", rationale: "short" }).ok).toBe(false);
  });
});

describe("control of work", () => {
  it("expires a live permit and blocks authorisation while isolation is still required", () => {
    const past = new Date("2026-10-01T00:00:00Z");
    expect(displayedPermitStatus("IN_PROGRESS", past, new Date("2026-10-03T00:00:00Z"))).toBe("EXPIRED");
    expect(permitTransition("CONTROLS_CONFIRMED", "AUTHORISED", true)).toBe(false);
    expect(permitTransition("ISOLATION_CONFIRMED", "AUTHORISED", true)).toBe(true);
  });

  it("will not clear a hold until repair, inspection and safety verification are all recorded", () => {
    expect(canReleaseHold({ repairComplete: true, inspectionComplete: true, safetyVerified: false }).ok).toBe(false);
    expect(canReleaseHold({ repairComplete: true, inspectionComplete: true, safetyVerified: true }).ok).toBe(true);
  });

  it("requires an expiring, named override", () => {
    const now = new Date("2026-10-03T12:00:00Z");
    expect(canOverrideControl({ who: "Sam", why: "Production trial", scope: "One cycle", approvedBy: "Alex", expiresAt: new Date("2026-10-03T13:00:00Z"), now }).ok).toBe(true);
    expect(canOverrideControl({ who: "Sam", why: "Production trial", scope: "One cycle", approvedBy: "", expiresAt: new Date("2026-10-03T13:00:00Z"), now }).ok).toBe(false);
  });

  it("flags a possible permit conflict as an additional check", () => {
    expect(permitConflictHint(["HOT_WORK", "LINE_OPENING"])).toContain("additional check");
  });
});

describe("operational gates", () => {
  it("refuses work when competence is missing or expired and does not use a job title", () => {
    const now = new Date("2026-10-03T00:00:00Z");
    expect(authoriseCompetence("FORKLIFT", [], now).authorised).toBe(false);
    expect(authoriseCompetence("FORKLIFT", [{ key: "FORKLIFT", expiresAt: new Date("2026-09-28T00:00:00Z") }], now).reason).toContain("expired");
    expect(authoriseCompetence(null, [], now).authorised).toBe(true);
  });

  it("marks equipment unsafe when a PUWER check fails", () => {
    expect(puwerOverall({ guarding: "PASS", interlocks: "FAIL" })).toBe("UNSAFE_FOR_USE");
    expect(puwerOverall({ guarding: "PASS", interlocks: "PASS" })).toBe("SAFE_FOR_USE");
  });

  it("does not invent chemical incompatibility or an asbestos-free area", () => {
    expect(storageIncompatibility(["flammable"], ["oxidiser"], [])).toBeNull();
    expect(storageIncompatibility(["flammable"], ["oxidiser"], [{ a: "flammable", b: "oxidiser", note: "Configured rule: keep apart." }])).toContain("Configured rule");
    expect(asbestosMessage(false)).toContain("not a statement");
  });

  it("states a first-aid gap and withholds a rate when hours are missing", () => {
    expect(coverageGap(1, 0)).toContain("requirement is 1");
    expect(incidentRate(4, null, "hours")).toBeNull();
    expect(incidentRate(4, 200000, "hours")).toBe("2.00 per 100,000 hours");
  });
});
