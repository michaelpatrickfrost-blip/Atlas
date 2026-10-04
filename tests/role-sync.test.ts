import { describe, expect, it, vi } from "vitest";
vi.mock("@/core/db/client", () => ({ db: {} }));
import { missingAdminCapabilities } from "@/core/permissions/role-sync";

describe("administrator capability catch-up", () => {
  it("adds capabilities of enabled modules the role predates", () => {
    const add = missingAdminCapabilities(["core.profile.self"], new Set(["manufacturing", "safety"]));
    expect(add).toContain("manufacturing.order.read");
    expect(add).toContain("safety.today.read");
  });
  it("does not grant modules the company has not enabled", () => {
    const add = missingAdminCapabilities([], new Set(["manufacturing"]));
    expect(add.some((c) => c.startsWith("finance."))).toBe(false);
    expect(add.some((c) => c.startsWith("safety."))).toBe(false);
  });
  it("is idempotent and never removes anything", () => {
    const first = missingAdminCapabilities([], new Set(["manufacturing"]));
    expect(missingAdminCapabilities(first, new Set(["manufacturing"]))).toEqual([]);
  });
});
