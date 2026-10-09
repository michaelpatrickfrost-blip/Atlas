import { describe, expect, it } from "vitest";
import type { Session } from "@/core/auth/session";
import {
  canOpenCompanyAdmin,
  defaultSettingsHref,
  settingsLinks,
} from "@/app/(app)/settings/settings-menu";
const session = (caps: string[]) =>
  ({ capabilities: new Set(caps) }) as Session;
describe("company settings and personal profile boundary", () => {
  it.each([[],['customers.read'],['customers.create','core.audit.read'],['core.email.personal'],['finance.document.manage']].map(caps=>({caps})))('keeps business permissions out of company settings: $caps',({caps})=>{
    const s=session(caps);expect(canOpenCompanyAdmin(s)).toBe(false);expect(settingsLinks(s).map(l=>l.href)).toEqual(['/profile/settings']);expect(defaultSettingsHref(s)).toBe('/profile/settings');
  });
  it("supports delegated company administrators without granting company configuration", () => {
    const s = session(["core.users.manage", "customers.create"]);
    const labels = settingsLinks(s).map((l) => l.label);
    expect(labels).toContain("Users");
    expect(labels).toContain("Imports");
    expect(labels).not.toContain("Workspace");
    expect(labels).not.toContain("Brand");
    expect(canOpenCompanyAdmin(s)).toBe(true);
  });
  it("starts administrators at the overview and retains section-native permissions", () => {
    const s = session(["core.modules.manage"]);
    expect(defaultSettingsHref(s)).toBe("/settings?tab=overview");
    expect(settingsLinks(s).map((l) => l.label)).toContain("Workspace");
    expect(settingsLinks(s).map((l) => l.label)).not.toContain(
      "Access profiles",
    );
    expect(canOpenCompanyAdmin(s)).toBe(true);
  });
  it("keeps platform tools outside the company workspace", () => {
    const s = session([
      "core.modules.manage",
      "core.roles.manage",
      "core.it.manage",
      "atlas.companies.manage",
    ]);
    expect(
      settingsLinks(s)
        .map((l) => l.href)
        .join(" "),
    ).not.toContain("/atlas");
    expect(settingsLinks(s).map((l) => l.label)).toContain("Access profiles");
  });
});
