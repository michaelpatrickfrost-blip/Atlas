import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  session: { userId: "admin", organisationId: "internal", capabilities: new Set<string>() },
  administrator: vi.fn(), existing: vi.fn(), create: vi.fn(), membership: vi.fn(), reset: vi.fn(), staff: vi.fn(), audit: vi.fn(), transaction: vi.fn(), refresh: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session, createSessionCookie: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { user: { findUniqueOrThrow: state.administrator }, $transaction: state.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: state.refresh }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: async (value: string) => value === "correct-password", hash: async () => "random-password-hash" } }));
import { createAtlasStaff } from "@/app/(app)/atlas/admin-actions";
const form = (extra: Record<string, string> = {}) => {
  const result = new FormData();
  for (const [key, value] of Object.entries({ name: "New Employee", email: "employee@example.test", staffRole: "EMPLOYEE", currentPassword: "correct-password", ...extra })) result.set(key, value);
  return result;
};
beforeEach(() => {
  vi.clearAllMocks(); state.session.capabilities = new Set(["atlas.staff.manage"]);
  state.administrator.mockResolvedValue({ passwordHash: "hash" }); state.existing.mockResolvedValue(null);
  state.create.mockResolvedValue({ id: "new-staff" }); state.membership.mockResolvedValue({ id: "staff-membership" });
  state.transaction.mockImplementation(async callback => callback({
    $queryRaw: vi.fn(), user: { findUnique: state.existing, create: state.create, update: vi.fn() },
    organisation: { upsert: vi.fn().mockResolvedValue({ id: "internal", kind: "INTERNAL", status: "ACTIVE" }) },
    membership: { upsert: state.membership }, platformAdministrator: { create: state.staff },
    passwordReset: { updateMany: vi.fn(), create: state.reset }, auditEntry: { create: state.audit },
  }));
});
describe("Atlas employee creation errors", () => {
  it("still rejects customer permissions before reading identities", async () => {
    state.session.capabilities = new Set(["core.users.manage"]);
    await expect(createAtlasStaff(form())).rejects.toThrow("FORBIDDEN");
    expect(state.administrator).not.toHaveBeenCalled(); expect(state.transaction).not.toHaveBeenCalled();
  });
  it("returns a production-safe password explanation before any writes", async () => {
    expect(await createAtlasStaff(form({ currentPassword: "wrong" }))).toEqual({ error: expect.stringContaining("Your administrator password was not recognised") });
    expect(state.transaction).not.toHaveBeenCalled(); expect(state.create).not.toHaveBeenCalled();
  });
  it("returns identity and role validation without writes", async () => {
    expect(await createAtlasStaff(form({ email: "invalid" }))).toEqual({ error: "Enter a name and valid email." });
    expect(await createAtlasStaff(form({ staffRole: "CUSTOMER" }))).toEqual({ error: "Choose an Atlas staff role." });
    expect(state.transaction).not.toHaveBeenCalled();
  });
  it("explains existing and duplicate accounts without granting access", async () => {
    state.existing.mockResolvedValue({ id: "existing", platformAdmin: null });
    expect(await createAtlasStaff(form())).toEqual({ error: expect.stringContaining("existing-account confirmation") });
    state.existing.mockResolvedValue({ id: "existing", platformAdmin: { role: "EMPLOYEE" } });
    expect(await createAtlasStaff(form({ existingAccount: "on" }))).toEqual({ error: expect.stringContaining("already listed") });
    expect(state.staff).not.toHaveBeenCalled(); expect(state.membership).not.toHaveBeenCalled();
  });
  it("creates staff with a one-use code after a valid password retry", async () => {
    await createAtlasStaff(form({ currentPassword: "wrong" }));
    const result = await createAtlasStaff(form());
    expect(result).toMatchObject({ code: expect.stringMatching(/^[a-f0-9]{64}$/), expiresAt: expect.any(String) });
    expect(state.staff).toHaveBeenCalledWith({ data: { userId: "new-staff", role: "EMPLOYEE" } });
    expect(state.reset).toHaveBeenCalledWith({ data: expect.objectContaining({ membershipId: "staff-membership", purpose: "PLATFORM" }) });
    expect(state.audit).toHaveBeenCalledTimes(1); expect(state.refresh).toHaveBeenCalled();
  });
  it("keeps an existing person's password after explicit confirmation", async () => {
    state.existing.mockResolvedValue({ id: "existing", platformAdmin: null });
    expect(await createAtlasStaff(form({ existingAccount: "on" }))).toEqual({ message: expect.stringContaining("keeps their existing password") });
    expect(state.create).not.toHaveBeenCalled(); expect(state.reset).not.toHaveBeenCalled();
  });
});
