import { describe, expect, it } from "vitest";
import type { Session } from "@/core/auth/session";
import { canOpenCompanyAdmin, defaultSettingsHref, settingsLinks } from "@/app/(app)/settings/settings-menu";

function session(capabilities: string[]) {
  return { capabilities: new Set(capabilities) } as Session;
}

describe("company administration menu", () => {
  it("keeps company settings with company administrators", () => {
    const labels = settingsLinks(session(["core.users.manage", "customers.create"])).map((link) => link.label);
    expect(labels).not.toContain("Workspace");
    expect(labels).not.toContain("Brand");
    expect(labels).not.toContain("Sales rules");
    expect(labels).toContain("Users");
    expect(labels).toContain("Imports");
    expect(canOpenCompanyAdmin(session(["customers.read"]))).toBe(false);
    expect(defaultSettingsHref(session(["customers.read"]))).toBe("/profile");
  });

  it("opens workspace first for a company administrator", () => {
    const admin = session(["core.modules.manage"]);
    expect(settingsLinks(admin).map((link) => link.href)).toEqual([
      "/settings?tab=workspace",
      "/settings?tab=brand",
      "/sales/settings",
      "/settings/logistics",
      "/audit/access",
      "/settings?tab=managers",
      "/people/settings",
      "/settings?tab=security",
      "/profile",
    ]);
    expect(defaultSettingsHref(admin)).toBe("/settings?tab=workspace");
    expect(canOpenCompanyAdmin(admin)).toBe(true);
  });
});
