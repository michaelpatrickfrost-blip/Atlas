import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ session: { userId: "other-staff", userEmail: "other@example.test", organisationId: "internal", capabilities: new Set<string>() }, read: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session, createSessionCookie: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { user: { findUnique: state.read, findUniqueOrThrow: state.read }, organisation: { findFirstOrThrow: state.read }, $transaction: state.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { canCreateUsers, canCreateBusinessUsers, platformCapabilities } from "@/core/admin/access";
import { createAtlasStaff } from "@/app/(app)/atlas/admin-actions";
import { createCompanyAccount } from "@/app/(app)/atlas/actions";
import { createCompanyUser } from "@/app/(app)/atlas/setup-actions";
import { createUser } from "@/app/(app)/settings/actions";
import { createManagedUser } from "@/app/(app)/settings/user-actions";
beforeEach(() => { vi.clearAllMocks(); state.session.userEmail = "other@example.test"; state.session.capabilities = new Set(["atlas.staff.manage", "atlas.users.manage", "atlas.companies.manage", "core.users.manage"]); });
describe("Michael-only user provisioning", () => {
  it.each([createAtlasStaff, createCompanyAccount, createCompanyUser, createUser, createManagedUser])("rejects other staff at %s before reading or writing records", async action => {
    const form = new FormData(); form.set("userEmail", "kickablur@icloud.com"); form.set("email", "kickablur@icloud.com");
    await expect(action(form)).rejects.toThrow(action === createAtlasStaff ? "Only Michael" : "Atlas administrator");
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


it("grants business provisioning only through independent Atlas administrator permissions",()=>{
 const admin={userEmail:"admin@example.test",capabilities:new Set(platformCapabilities({role:"ADMIN",active:true}))};
 expect(canCreateBusinessUsers(admin)).toBe(true);expect(canCreateUsers(admin)).toBe(false);
 expect(canCreateBusinessUsers({...admin,capabilities:new Set(platformCapabilities({role:"EMPLOYEE",active:true}))})).toBe(false);
 expect(canCreateBusinessUsers({...admin,capabilities:new Set(["core.users.manage","atlas.business_users.create"])})).toBe(false);
});

it.each([createUser,createManagedUser])("does not provision business identities in the internal Atlas workspace",async action=>{
 state.session.capabilities.add("atlas.business_users.create");
 const count=vi.fn().mockResolvedValue(0),create=vi.fn();
 state.transaction.mockImplementation(async callback=>callback({organisation:{count},user:{create}}));
 const form=new FormData();form.set("name","Business fixture");form.set("email","fixture@example.test");form.set("password","Valid-test-password-123");
 await expect(action(form)).rejects.toThrow("selected customer company");
 expect(count).toHaveBeenCalledWith({where:{id:state.session.organisationId,kind:"CUSTOMER",archivedAt:null}});expect(create).not.toHaveBeenCalled();
});
