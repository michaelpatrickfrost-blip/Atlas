import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn(), compare: vi.fn(), cookie: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("@/core/db/client", () => ({ db: { user: { findUnique: mocks.findUnique }, membership: { update: mocks.update } } }));
vi.mock("bcryptjs", () => ({ default: { compare: mocks.compare } }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/core/auth/session", () => ({ createSessionCookie: mocks.cookie, clearSessionCookie: vi.fn() }));
vi.mock("@/core/admin/access", () => ({ platformCapabilities: (admin: unknown) => admin ? ["atlas.companies.manage"] : [] }));
import { loginAction } from "@/core/auth/actions";
const form = new FormData(); form.set("email", "user@example.test"); form.set("password", "test-only");
beforeEach(() => { vi.clearAllMocks(); mocks.compare.mockResolvedValue(true); });
describe("sign-in landing", () => {
  for (const staff of [false, true]) it(`lands ${staff ? "Atlas staff" : "company users"} on the app launcher`, async () => {
    mocks.findUnique.mockResolvedValue({ id: "user", passwordHash: "hash", platformAdmin: staff ? {} : null, memberships: [{ id: "member", organisationId: "company", active: true, organisation: { status: "ACTIVE", kind: staff ? "INTERNAL" : "CUSTOMER" } }] });
    await expect(loginAction(form)).rejects.toThrow("REDIRECT:/home");
    expect(mocks.cookie).toHaveBeenCalledWith({ userId: "user", organisationId: "company" });
  });
  it("does not establish a session or navigate on a rejected password", async () => {
    mocks.findUnique.mockResolvedValue({ passwordHash: "hash" }); mocks.compare.mockResolvedValue(false);
    expect(await loginAction(form)).toEqual({ error: "Incorrect email or password." });
    expect(mocks.cookie).not.toHaveBeenCalled(); expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
