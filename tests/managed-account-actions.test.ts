import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  session: vi.fn(),
  cap: vi.fn(),
  actor: vi.fn(),
  actorTx: vi.fn(),
  transaction: vi.fn(),
  member: vi.fn(),
  duplicate: vi.fn(),
  update: vi.fn(),
  reset: vi.fn(),
  audit: vi.fn(),
  compare: vi.fn(),
  hash: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({ requireSession: m.session }));
vi.mock("@/core/permissions/check", () => ({ assertCapability: m.cap }));
vi.mock("@/core/modules/registry", () => ({ MODULE_CATALOGUE: [] }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: m.compare, hash: m.hash } }));
vi.mock("@/core/db/client", () => ({
  db: { user: { findUniqueOrThrow: m.actor }, $transaction: m.transaction },
}));
import {
  saveManagedUserDetails,
  setManagedUserPassword,
} from "@/app/(app)/settings/user-actions";
import { managedAccountRevision } from "@/core/auth/managed-account";
const member = {
  id: "target",
  userId: "target-user",
  active: true,
  sessionVersion: 2,
  user: {
    id: "target-user",
    name: "Original",
    email: "original@example.test",
    authVersion: 3,
    platformAdmin: null,
    _count: { memberships: 1 },
  },
};
const tx = {
  user: {
    findUniqueOrThrow: m.actorTx,
    findFirst: m.duplicate,
    update: m.update,
  },
  membership: { findFirstOrThrow: m.member },
  passwordReset: { updateMany: m.reset },
  auditEntry: { create: m.audit },
};
function form() {
  const f = new FormData();
  Object.entries({
    membershipId: "target",
    accountRevision: managedAccountRevision(member),
    name: "New name",
    email: "new@example.test",
    password: "new secure passphrase",
    confirmPassword: "new secure passphrase",
    currentPassword: "admin passphrase",
  }).forEach(([k, v]) => f.set(k, v));
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  m.session.mockResolvedValue({
    userId: "admin",
    membershipId: "self",
    organisationId: "company",
  });
  m.cap.mockReturnValue(undefined);
  m.actor.mockResolvedValue({ passwordHash: "admin-hash", authVersion: 4 });
  m.actorTx.mockResolvedValue({ authVersion: 4 });
  m.compare.mockResolvedValue(true);
  m.hash.mockResolvedValue("new-hash");
  m.member.mockResolvedValue(structuredClone(member));
  m.duplicate.mockResolvedValue(null);
  m.transaction.mockImplementation((fn) => fn(tx));
});
describe("company-admin account controls", () => {
  it("assigns a hash, revokes old authentication/codes and audits without credentials", async () => {
    expect(await setManagedUserPassword(form())).toBeUndefined();
    expect(m.member.mock.calls[0][0].where).toEqual({
      id: "target",
      organisationId: "company",
      active: true,
    });
    expect(m.update).toHaveBeenCalledWith({
      where: { id: "target-user", authVersion: 3 },
      data: { passwordHash: "new-hash", authVersion: { increment: 1 } },
    });
    expect(m.reset.mock.calls[0][0].where).toEqual({
      membership: { userId: "target-user" },
      usedAt: null,
    });
    expect(JSON.stringify(m.audit.mock.calls)).not.toMatch(
      /passphrase|new-hash|admin-hash/,
    );
    expect(m.transaction.mock.calls[0][1]).toEqual({
      isolationLevel: "Serializable",
    });
  });
  it("updates identity and invalidates sessions/codes on email changes", async () => {
    expect(await saveManagedUserDetails(form())).toBeUndefined();
    expect(m.update.mock.calls[0][0].data).toEqual({
      name: "New name",
      email: "new@example.test",
      authVersion: { increment: 1 },
    });
    expect(m.audit.mock.calls[0][0].data.after).toEqual({
      name: "New name",
      email: "new@example.test",
      sessionsRevoked: true,
    });
  });
  it("does not revoke authentication for a name-only update", async () => {
    const f = form();
    f.set("email", member.user.email);
    await saveManagedUserDetails(f);
    expect(m.update.mock.calls[0][0].data).toEqual({
      name: "New name",
      email: member.user.email,
    });
    expect(m.reset).not.toHaveBeenCalled();
  });
  it("rejects stale editor/actor, self, shared and staff targets before mutation", async () => {
    for (const action of [saveManagedUserDetails, setManagedUserPassword]) {
      const stale = form();
      stale.set("accountRevision", "stale");
      expect(await action(stale)).toEqual({
        error: expect.stringContaining("account changed"),
      });
      const self = form();
      self.set("membershipId", "self");
      expect(await action(self)).toEqual({ error: expect.any(String) });
      m.member.mockResolvedValue({
        ...member,
        user: { ...member.user, _count: { memberships: 2 } },
      });
      expect(await action(form())).toEqual({
        error: expect.stringContaining("shared accounts"),
      });
      m.member.mockResolvedValue({
        ...member,
        user: { ...member.user, platformAdmin: { id: "staff" } },
      });
      expect(await action(form())).toEqual({
        error: expect.stringContaining("platform"),
      });
      m.member.mockResolvedValue(member);
      m.actorTx.mockResolvedValue({ authVersion: 5 });
      expect(await action(form())).toEqual({
        error: expect.stringContaining("Sign in again"),
      });
      m.actorTx.mockResolvedValue({ authVersion: 4 });
    }
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
  it("requires the capability and correct administrator password", async () => {
    m.cap.mockImplementation(() => {
      throw new Error("Denied");
    });
    await expect(setManagedUserPassword(form())).rejects.toThrow("Denied");
    expect(m.actor).not.toHaveBeenCalled();
    m.cap.mockReturnValue(undefined);
    m.compare.mockResolvedValue(false);
    expect(await setManagedUserPassword(form())).toEqual({
      error: expect.stringContaining("Confirm your own password"),
    });
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("rejects weak, mismatched and byte-truncated passwords and duplicate sign-in email", async () => {
    for (const [password, confirm] of [
      ["tiny", "tiny"],
      ["🔐".repeat(20), "🔐".repeat(20)],
      ["valid long password", "other long password"],
    ]) {
      const f = form();
      f.set("password", password);
      f.set("confirmPassword", confirm);
      expect(await setManagedUserPassword(f)).toEqual({
        error: expect.any(String),
      });
    }
    m.duplicate.mockResolvedValue({ id: "another" });
    expect(await saveManagedUserDetails(form())).toEqual({
      error: expect.stringContaining("email cannot be used"),
    });
    expect(m.update).not.toHaveBeenCalled();
  });
});
