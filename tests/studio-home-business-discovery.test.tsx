import React from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ session: vi.fn(), enabled: vi.fn(), attention: vi.fn(), screens: vi.fn(), dashboards: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: m.session }));
vi.mock("@/core/modules/runtime", () => ({ enabledModulesForSession: m.enabled }));
vi.mock("@/core/attention/aggregate", () => ({ getAttentionOverview: m.attention }));
vi.mock("@/core/studio/pages/customer-catalog", () => ({ listCustomerScreens: m.screens }));
vi.mock("@/modules/analytics/services/studio-business-view", () => ({ listPublishedBusinessViews: m.dashboards }));
vi.mock("@/modules/kpis/services/workspace", () => ({ loadGoalWorkspace: vi.fn() }));
vi.mock("@/modules/kpis/components/goal-meter", () => ({ GoalMeter: () => null }));
vi.mock("@/components/ui/refresh-button", () => ({ RefreshButton: () => null }));
vi.mock("@/components/shell/app-directory", () => ({ AppDirectory: () => <div>Native apps</div> }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
import HomePage from "@/app/(app)/home/page";
const session: Session = { userId: "actor", membershipId: "member", organisationId: "internal", userName: "Staff", userEmail: "staff@example.test",
  organisationName: "Atlas", capabilities: new Set(["atlas.staff", "analytics.dashboard.read"]) };
beforeEach(() => {
  vi.clearAllMocks(); m.session.mockResolvedValue(session); m.enabled.mockResolvedValue(new Set(["analytics"]));
  m.attention.mockResolvedValue({ items: [], unavailableSources: 0 }); m.screens.mockResolvedValue([]); m.dashboards.mockResolvedValue([]);
});
it("Home uses the authenticated discovery wrapper for staff app availability and still renders native apps when no customer dashboards exist", async () => {
  const markup = renderToStaticMarkup(await HomePage());
  expect(m.dashboards).toHaveBeenCalledExactlyOnceWith(session);
  expect(markup).toContain("Native apps"); expect(markup).not.toContain("Your business dashboards");
});
it("Home displays only names/links returned by the genuine scoped discovery wrapper", async () => {
  m.dashboards.mockResolvedValue([{ definitionId: "approved", name: "Business overview" }]);
  const markup = renderToStaticMarkup(await HomePage());
  expect(markup).toContain('href="/business-dashboards/approved"'); expect(markup).toContain("Business overview");
});
it("Home preserves hard customer identity/seal failures instead of hiding them as unavailable owners", async () => {
  m.dashboards.mockRejectedValue(new Error("FORBIDDEN: current membership revoked"));
  await expect(HomePage()).rejects.toThrow("current membership revoked");
});
