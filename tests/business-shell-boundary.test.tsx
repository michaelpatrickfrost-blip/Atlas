import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";

vi.mock("@/core/modules/runtime", () => ({ getNavigableModules: async () => [] }));
vi.mock("@/core/auth/actions", () => ({ logoutAction: async () => {} }));
vi.mock("@/app/(app)/chat/chat-dock", () => ({ ChatDock: () => null }));
vi.mock("@/components/shell/notice-bell", () => ({ NoticeBell: () => null }));
vi.mock("@/components/shell/command-palette", () => ({ CommandPalette: () => null }));
vi.mock("@/components/shell/app-menu", () => ({ AppMenu: () => null }));
vi.mock("@/components/shell/shell-chrome", () => ({ NewWindow: () => null }));
vi.mock("@/components/shell/workspace-back", () => ({ WorkspaceBack: () => null }));
vi.mock("@/components/shell/company-mark", () => ({ CompanyMark: () => null }));
vi.mock("@/components/shell/topbar-variant", () => ({ TopbarVariant: ({ regular }: { regular: ReactNode }) => regular }));

import { AppDirectory } from "@/components/shell/app-directory";
import { Topbar } from "@/components/shell/topbar";

function session(staff: boolean): Session {
  return {
    userId: "user", userName: "Business User", userEmail: "user@example.test",
    organisationId: "company", organisationName: "Customer Company", membershipId: "membership",
    capabilities: new Set(["customers.read", "core.users.manage", "core.modules.manage", ...(staff ? ["atlas.companies.manage"] : [])]),
  };
}

describe("business workspace excludes platform administration", () => {
  for (const staff of [false, true]) {
    const identity = staff ? "Atlas staff supporting a company" : "customer administrator";
    it.each(["menu", "launcher"] as const)(`keeps %s company tools without platform links for ${identity}`, async (variant) => {
      const html = renderToStaticMarkup(await AppDirectory({ session: session(staff), variant }));
      expect(html).not.toMatch(/href="\/atlas(?:\/|")/);
      expect(html).not.toContain("Atlas Admin");
      expect(html).not.toContain("Connections");
      expect(html).toContain('href="/settings"');
      expect(html).toContain('href="/apps"');
      expect(html).toContain('href="/customers"');
    });
    it(`shows company context without a console return link for ${identity}`, () => {
      const html = renderToStaticMarkup(<Topbar session={session(staff)} />);
      expect(html).toContain("Customer Company");
      expect(html).not.toMatch(/href="\/atlas(?:\/|")/);
      expect(html).not.toContain("· Admin");
    });
  }
});
