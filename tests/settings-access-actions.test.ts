import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  session: vi.fn(),
  cap: vi.fn(),
  transaction: vi.fn(),
  roleRead: vi.fn(),
  roleFind: vi.fn(),
  roleList: vi.fn(),
  roleUpdate: vi.fn(),
  own: vi.fn(),
  memberRead: vi.fn(),
  memberUpdate: vi.fn(),
  remove: vi.fn(),
  add: vi.fn(),
  audit: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({ requireSession: m.session }));
vi.mock("@/core/permissions/check", () => ({ assertCapability: m.cap }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/modules/registry", () => ({ MODULE_CATALOGUE: [] }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/core/audit/log", () => ({ writeAudit: vi.fn() }));
import { saveRole, saveMemberRoles } from "@/app/(app)/settings/actions";
import { saveUserAccess } from "@/app/(app)/settings/user-actions";
import {
  roleAccessRevision,
  memberAccessRevision,
} from "@/core/permissions/access-revision";
const role = {
  id: "r",
  name: "Team",
  capabilities: ["core.chat.read", "core.chat.write"],
};
const member = {
  id: "other",
  sessionVersion: 0,
  grantedCapabilities: [],
  deniedCapabilities: [],
  roles: [{ roleId: "r", role }],
};
const tx = {
  role: {
    findFirstOrThrow: m.roleRead,
    findFirst: m.roleFind,
    findMany: m.roleList,
    update: m.roleUpdate,
  },
  roleOnMembership: {
    findFirst: m.own,
    deleteMany: m.remove,
    createMany: m.add,
  },
  membership: { findFirstOrThrow: m.memberRead, update: m.memberUpdate },
  auditEntry: { create: m.audit },
};
const form = (entries: Array<[string, string]>) => {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
};
const roleForm = () =>
  form([
    ["roleId", "r"],
    ["accessRevision", roleAccessRevision(role)],
    ["profileName", "New name"],
    ["capability", "core.chat.read"],
  ]);
const userForm = () =>
  form([
    ["membershipId", "other"],
    ["accessRevision", memberAccessRevision(member, [role])],
    ["roleId", "r"],
    ["capability", "core.chat.read"],
  ]);
beforeEach(() => {
  vi.clearAllMocks();
  m.session.mockResolvedValue({
    organisationId: "company",
    userId: "actor",
    membershipId: "me",
  });
  m.cap.mockReturnValue(undefined);
  m.transaction.mockImplementation(async (fn) => fn(tx));
  m.roleRead.mockResolvedValue(role);
  m.roleFind.mockResolvedValue(null);
  m.roleList.mockResolvedValue([role]);
  m.own.mockResolvedValue(null);
  m.memberRead.mockResolvedValue(member);
});
describe("profile mutation safety", () => {
  it("renames and saves a company-owned profile in one serializable audited transaction", async () => {
    await saveRole(roleForm());
    expect(m.roleRead).toHaveBeenCalledWith({
      where: { id: "r", organisationId: "company" },
    });
    expect(m.roleUpdate).toHaveBeenCalledWith({
      where: { id: "r", organisationId: "company" },
      data: { name: "New name", capabilities: ["core.chat.read"] },
    });
    expect(m.audit).toHaveBeenCalledTimes(1);
    expect(m.transaction.mock.calls[0][1]).toEqual({
      isolationLevel: "Serializable",
    });
  });
  it("rejects stale profiles and duplicate names before mutation", async () => {
    const f = roleForm();
    f.set("accessRevision", "stale");
    await expect(saveRole(f)).resolves.toEqual({
      error: expect.stringContaining("profile changed"),
    });
    expect(m.roleUpdate).not.toHaveBeenCalled();
    m.roleFind.mockResolvedValue({ id: "duplicate" });
    await expect(saveRole(roleForm())).resolves.toEqual({
      error: expect.stringContaining("already exists"),
    });
    expect(m.roleUpdate).not.toHaveBeenCalled();
  });
  it("protects the editor’s own company administration and rejects platform grants", async () => {
    const admin = { ...role, capabilities: ["core.modules.manage"] };
    m.roleRead.mockResolvedValue(admin);
    m.own.mockResolvedValue({});
    const f = roleForm();
    f.set("accessRevision", roleAccessRevision(admin));
    await expect(saveRole(f)).resolves.toEqual({
      error: expect.stringContaining("own access"),
    });
    f.append("capability", "atlas.staff.manage");
    await expect(saveRole(f)).resolves.toEqual({
      error: expect.stringContaining("Unknown"),
    });
    expect(m.roleUpdate).not.toHaveBeenCalled();
  });
  it("fails authorization before opening a transaction", async () => {
    m.cap.mockImplementation(() => {
      throw new Error("Denied");
    });
    await expect(saveRole(roleForm())).rejects.toThrow("Denied");
    await expect(saveUserAccess(userForm())).rejects.toThrow("Denied");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("atomically stores explicit exceptions and revokes older company sessions", async () => {
    await saveUserAccess(userForm());
    expect(m.memberRead.mock.calls[0][0].where).toEqual({
      id: "other",
      organisationId: "company",
    });
    expect(m.memberUpdate).toHaveBeenCalledWith({
      where: { id: "other", organisationId: "company" },
      data: {
        grantedCapabilities: [],
        deniedCapabilities: ["core.chat.write"],
        sessionVersion: { increment: 1 },
      },
    });
    expect(m.audit).toHaveBeenCalledTimes(1);
    expect(m.transaction.mock.calls[0][1]).toEqual({
      isolationLevel: "Serializable",
    });
  });
  it("blocks stale catalogue/membership edits, forged roles and self-editing before replacing assignments", async () => {
    m.roleList.mockResolvedValue([{ ...role, name: "Changed" }]);
    await expect(saveUserAccess(userForm())).resolves.toEqual({
      error: expect.stringContaining("profile changed"),
    });
    m.roleList.mockResolvedValue([role]);
    const f = userForm();
    f.set("roleId", "foreign");
    await expect(saveUserAccess(f)).resolves.toEqual({
      error: expect.stringContaining("Invalid role"),
    });
    f.set("membershipId", "me");
    await expect(saveUserAccess(f)).resolves.toEqual({
      error: expect.stringContaining("Another administrator"),
    });
    expect(m.remove).not.toHaveBeenCalled();
  });
  it("keeps legacy role-only writes behind the same role capability and snapshot boundary", async () => {
    await saveMemberRoles(userForm());
    expect(m.cap).toHaveBeenCalledWith(expect.anything(), "core.roles.manage");
    expect(m.memberUpdate).toHaveBeenCalledWith({
      where: { id: "other", organisationId: "company" },
      data: { sessionVersion: { increment: 1 } },
    });
    m.remove.mockClear();
    const f = userForm();
    f.delete("accessRevision");
    expect(await saveMemberRoles(f)).toEqual({
      error: expect.stringContaining("profile changed"),
    });
    expect(m.remove).not.toHaveBeenCalled();
  });
});
