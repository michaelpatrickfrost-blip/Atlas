import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ session: { userId: "other-staff", userEmail: "other@example.test", organisationId: "internal", capabilities: new Set<string>() }, read: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session, createSessionCookie: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { user: { findUnique: state.read, findUniqueOrThrow: state.read }, organisation: { findFirstOrThrow: state.read }, $transaction: state.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { canCreateUsers } from "@/core/admin/access";
import { createAtlasStaff } from "@/app/(app)/atlas/admin-actions";
import { createCompanyAccount } from "@/app/(app)/atlas/actions";
import { createCompanyUser } from "@/app/(app)/atlas/setup-actions";
import { createUser } from "@/app/(app)/settings/actions";
import { createManagedUser } from "@/app/(app)/settings/user-actions";
beforeEach(() => { vi.clearAllMocks(); state.session.userEmail = "other@example.test"; state.session.capabilities = new Set(["atlas.staff.manage", "atlas.users.manage", "atlas.companies.manage", "core.users.manage"]); });
describe("Michael-only user provisioning", () => {
  it.each([createAtlasStaff, createCompanyAccount, createCompanyUser, createUser, createManagedUser])("rejects other staff at %s before reading or writing records", async action => {
    const form = new FormData(); form.set("userEmail", "kickablur@icloud.com"); form.set("email", "kickablur@icloud.com");
    await expect(action(form)).rejects.toThrow("Only Michael");
    expect(state.read).not.toHaveBeenCalled(); expect(state.transaction).not.toHaveBeenCalled();
  });
  it("requires both Michael's identity and independent platform permission", () => {
    expect(canCreateUsers(state.session)).toBe(false);
    state.session.userEmail = "KICKABLUR@ICLOUD.COM";
    expect(canCreateUsers(state.session)).toBe(true);
    state.session.capabilities = new Set(["core.users.manage"]);
    expect(canCreateUsers(state.session)).toBe(false);
    expect(canCreateUsers({ capabilities: new Set(["atlas.staff.manage"]) })).toBe(false);
  });
});
