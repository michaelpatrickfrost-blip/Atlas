import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const state = vi.hoisted(() => ({ session: null as Session | null, authoring: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ getSession: async () => state.session, requireSession: async () => { if (!state.session) throw new Error("UNAUTHENTICATED"); return state.session; } }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("@/core/studio/authoring/context", () => ({ withStudioAuthoringAuthority: state.authoring }));
vi.mock("@/app/(studio)/design-studio/actions", () => ({ createVisualScreen: vi.fn() }));
vi.mock("@/app/(studio)/design-studio/layouts", () => ({ screenLayouts: vi.fn() }));
import CustomerStudioEntry from "@/app/(app)/studio/page";
import StudioLayout from "@/app/(studio)/design-studio/layout";
import { PageMotion } from "@/components/shell/page-motion";
import StudioWorkspace from "@/app/(studio)/design-studio/page";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
const actor = (capabilities: string[]): Session => ({ userId: "actor", userName: "Designer", userEmail: "designer@example.test",
  organisationId: "company", organisationName: "Business", membershipId: "member", capabilities: new Set(capabilities) });
beforeEach(() => {
  vi.clearAllMocks(); state.session = null;
  state.authoring.mockResolvedValue({ businessName: "Selected business", pages: [], layouts: [], canEdit: true,
    canDesignDocuments: false, canSetupTickets: false, canDesignDashboards: false });
});
it("routes a signed-out standalone entry to sign-in before metadata authoring runs", async () => {
  await expect(StudioLayout({ children: "design" })).rejects.toThrow("REDIRECT:/login");
  await expect(StudioWorkspace({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/login");
  expect(state.authoring).not.toHaveBeenCalled();
});
it("keeps the standalone shell permission boundary after sign-in", async () => {
  state.session = actor([]);
  await expect(StudioLayout({ children: "design" })).rejects.toThrow("FORBIDDEN");
  state.session = actor([CAP.read]);
  const result = await StudioLayout({ children: "design" });
  expect(result.props.children.type).toBe(PageMotion);
  expect(result.props.children.props.children).toBe("design");
});
it("sends unselected authorised staff to the existing business selector without creating access", async () => {
  state.session = actor([CAP.read, "atlas.staff.manage", "atlas.companies.manage"]);
  await expect(StudioWorkspace({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/atlas/studio");
  expect(state.authoring).not.toHaveBeenCalled();
  state.session.capabilities.delete("atlas.companies.manage");
  await expect(StudioWorkspace({ searchParams: Promise.resolve({}) })).rejects.toThrow("FORBIDDEN");
  expect(state.authoring).not.toHaveBeenCalled();
});
it("passes explicit staff selection and a customer's own workspace to the existing authority", async () => {
  state.session = actor([CAP.read, "atlas.staff.manage", "atlas.companies.manage"]);
  await StudioWorkspace({ searchParams: Promise.resolve({ business: "selected-business" }) });
  expect(state.authoring).toHaveBeenLastCalledWith(state.session, CAP.read, "selected-business", expect.any(Function));
  state.session = actor([CAP.read]);
  await StudioWorkspace({ searchParams: Promise.resolve({}) });
  expect(state.authoring).toHaveBeenLastCalledWith(state.session, CAP.read, undefined, expect.any(Function));
});

it("opens the standalone visual designer from the customer's existing Studio app entry", async () => {
  state.session = actor([CAP.read]);
  await expect(CustomerStudioEntry()).rejects.toThrow("REDIRECT:/design-studio");
  expect(state.authoring).not.toHaveBeenCalled();
  state.session = actor([]);
  await expect(CustomerStudioEntry()).rejects.toThrow("FORBIDDEN");
  state.session = actor([CAP.read, "atlas.staff.manage", "atlas.companies.manage"]);
  await expect(CustomerStudioEntry()).rejects.toThrow("REDIRECT:/atlas/studio");
});
