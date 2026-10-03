import { describe, expect, it } from "vitest";
import { can, canAny, assertCapability } from "@/core/permissions/check";
import type { Session } from "@/core/auth/session";

function sessionWith(capabilities: string[]): Session {
  return {
    userId: "u1",
    userName: "Test User",
    userEmail: "test@atlas.app",
    organisationId: "org1",
    organisationName: "Test Org",
    membershipId: "m1",
    capabilities: new Set(capabilities),
  };
}

describe("capability checks", () => {
  it("can() reflects membership capability set, never a hardcoded role name", () => {
    const session = sessionWith(["sales.quote.read"]);
    expect(can(session, "sales.quote.read")).toBe(true);
    expect(can(session, "sales.quote.approve")).toBe(false);
  });

  it("canAny() matches if at least one capability is present", () => {
    const session = sessionWith(["sales.quote.read"]);
    expect(canAny(session, ["sales.quote.approve", "sales.quote.read"])).toBe(true);
  });

  it("assertCapability() throws a FORBIDDEN error naming the missing capability", () => {
    const session = sessionWith([]);
    expect(() => assertCapability(session, "sales.quote.approve")).toThrowError(/FORBIDDEN.*sales\.quote\.approve/);
  });
});
