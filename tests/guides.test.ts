import { expect, it } from "vitest";
import {
  GUIDES,
  visibleGuides,
  canFollowStep,
  guideForPath,
} from "@/core/guides/catalogue";
it("keeps stock handoff guidance available to Warehouse without Manufacturing rights", () => {
  const visible = visibleGuides(new Set(["stock.read"]), new Set(["stock"]));
  expect(visible.some((g) => g.id === "production-handoff")).toBe(true);
  expect(visible.some((g) => g.id === "manufacturing")).toBe(false);
  expect(guideForPath("/stock/handoffs")).toBe("production-handoff");
});
it("requires both app and explicit capability for Procurement guidance", () => {
  expect(
    visibleGuides(
      new Set(["finance.overview.read"]),
      new Set(["finance"]),
    ).some((g) => g.id === "procurement"),
  ).toBe(false);
  expect(
    visibleGuides(new Set(["finance.purchase.read"]), new Set()).some(
      (g) => g.id === "procurement",
    ),
  ).toBe(false);
  expect(
    visibleGuides(
      new Set(["finance.purchase.read"]),
      new Set(["finance"]),
    ).some((g) => g.id === "procurement"),
  ).toBe(true);
});
it("hides unauthorised source links while retaining plain working instructions", () => {
  const guide = GUIDES.find((g) => g.id === "manufacturing")!;
  const handoff = guide.steps.find((s) => s.href === "/stock/handoffs")!;
  expect(canFollowStep(handoff, new Set(), new Set(["stock"]))).toBe(false);
  expect(canFollowStep(handoff, new Set(["stock.read"]), new Set())).toBe(
    false,
  );
  expect(
    canFollowStep(handoff, new Set(["stock.read"]), new Set(["stock"])),
  ).toBe(true);
  expect(handoff.detail.length).toBeGreaterThan(50);
});
it("gives every guide preparation, actual steps, an outcome and blocker help with unique routes", () => {
  expect(new Set(GUIDES.map((g) => g.id)).size).toBe(GUIDES.length);
  for (const guide of GUIDES) {
    expect(guide.before.length).toBeGreaterThan(0);
    expect(guide.steps.length).toBeGreaterThan(2);
    expect(guide.outcome).toBeTruthy();
    expect(guide.troubleshoot.length).toBeGreaterThan(0);
    for (const s of guide.steps)
      if (s.href) expect(s.href.startsWith("/")).toBe(true);
  }
});
