import { describe, expect, it } from "vitest";
import { CUSTOMER_CAPABILITIES, STANDARD_ROLES } from "@/core/permissions/capabilities";
import { can } from "@/core/permissions/check";
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

describe("Customer Master capabilities", () => {
  it("declares a distinct capability per sensitive section, not one blanket customers.manage", () => {
    expect(CUSTOMER_CAPABILITIES.creditManage).not.toBe(CUSTOMER_CAPABILITIES.taxManage);
    expect(CUSTOMER_CAPABILITIES.bankRead).not.toBe(CUSTOMER_CAPABILITIES.bankReveal);
  });

  it("a session with only customers.read cannot see credit, tax or bank sections", () => {
    const session = sessionWith([CUSTOMER_CAPABILITIES.read]);
    expect(can(session, CUSTOMER_CAPABILITIES.creditRead)).toBe(false);
    expect(can(session, CUSTOMER_CAPABILITIES.taxRead)).toBe(false);
    expect(can(session, CUSTOMER_CAPABILITIES.bankRead)).toBe(false);
  });

  it("bankRead does not imply bankReveal — reading masked values is separate from revealing them", () => {
    const session = sessionWith([CUSTOMER_CAPABILITIES.bankRead]);
    expect(can(session, CUSTOMER_CAPABILITIES.bankReveal)).toBe(false);
  });

  it("the sales_user standard role has no finance/tax/bank capabilities", () => {
    const salesUser = STANDARD_ROLES.find((role) => role.key === "sales_user")!;
    expect(salesUser.capabilities).not.toContain(CUSTOMER_CAPABILITIES.taxManage);
    expect(salesUser.capabilities).not.toContain(CUSTOMER_CAPABILITIES.bankManage);
    expect(salesUser.capabilities).not.toContain(CUSTOMER_CAPABILITIES.bankReveal);
  });

  it("the finance_manager standard role can read commercial info but cannot manage it", () => {
    const financeManager = STANDARD_ROLES.find((role) => role.key === "finance_manager")!;
    expect(financeManager.capabilities).toContain(CUSTOMER_CAPABILITIES.commercialRead);
    expect(financeManager.capabilities).not.toContain(CUSTOMER_CAPABILITIES.commercialManage);
    expect(financeManager.capabilities).toContain(CUSTOMER_CAPABILITIES.bankReveal);
  });

  it("the admin role holds every declared customer capability", () => {
    const admin = STANDARD_ROLES.find((role) => role.key === "admin")!;
    for (const capability of Object.values(CUSTOMER_CAPABILITIES)) {
      expect(admin.capabilities).toContain(capability);
    }
  });
});
