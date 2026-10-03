import { describe, expect, it } from "vitest";
import { SALES_CAPABILITIES, STANDARD_ROLES } from "@/core/permissions/capabilities";
import { can } from "@/core/permissions/check";
import { DOMAIN_EVENTS } from "@/core/events/bus";
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

describe("Sales & CRM capabilities", () => {
  it("separates prospect, opportunity, pipeline and forecast capabilities", () => {
    const values = Object.values(SALES_CAPABILITIES);
    expect(new Set(values).size).toBe(values.length);
    expect(SALES_CAPABILITIES.pipelineManage).not.toBe(SALES_CAPABILITIES.opportunityManage);
    expect(SALES_CAPABILITIES.forecastManage).not.toBe(SALES_CAPABILITIES.forecastRead);
  });

  it("a sales_user can read/manage prospects and opportunities but cannot manage the pipeline or forecast", () => {
    const salesUser = STANDARD_ROLES.find((role) => role.key === "sales_user")!;
    const session = sessionWith(salesUser.capabilities);
    expect(can(session, SALES_CAPABILITIES.prospectCreate)).toBe(true);
    expect(can(session, SALES_CAPABILITIES.opportunityManage)).toBe(true);
    expect(can(session, SALES_CAPABILITIES.pipelineManage)).toBe(false);
    expect(can(session, SALES_CAPABILITIES.forecastManage)).toBe(false);
  });

  it("a sales_manager can manage the pipeline and forecast; a sales_user cannot", () => {
    const salesManager = STANDARD_ROLES.find((role) => role.key === "sales_manager")!;
    expect(salesManager.capabilities).toContain(SALES_CAPABILITIES.pipelineManage);
    expect(salesManager.capabilities).toContain(SALES_CAPABILITIES.forecastManage);
    expect(salesManager.capabilities).toContain(SALES_CAPABILITIES.opportunityClose);
  });

  it("the admin role holds every declared sales capability", () => {
    const admin = STANDARD_ROLES.find((role) => role.key === "admin")!;
    for (const capability of Object.values(SALES_CAPABILITIES)) {
      expect(admin.capabilities).toContain(capability);
    }
  });
});

describe("Sales & CRM domain events", () => {
  it("declares the full prospect lifecycle", () => {
    expect(DOMAIN_EVENTS.salesProspectCreated).toBe("sales.prospect.created");
    expect(DOMAIN_EVENTS.salesProspectQualified).toBe("sales.prospect.qualified");
    expect(DOMAIN_EVENTS.salesProspectDisqualified).toBe("sales.prospect.disqualified");
    expect(DOMAIN_EVENTS.salesProspectConverted).toBe("sales.prospect.converted");
  });

  it("declares opportunity change and close events distinctly from won/lost", () => {
    expect(DOMAIN_EVENTS.salesOpportunityStageChanged).not.toBe(DOMAIN_EVENTS.salesOpportunityWon);
    expect(DOMAIN_EVENTS.salesOpportunityWon).not.toBe(DOMAIN_EVENTS.salesOpportunityLost);
  });
});
