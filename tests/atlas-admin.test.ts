import { beforeEach, describe, expect, it, vi } from "vitest";
import { companyExportScopes, protectedExportField, type ExportColumn } from "@/core/admin/export-scope";
import { ATLAS_STAFF_ROLES, platformCapabilities } from "@/core/admin/access";
const state = vi.hoisted(() => ({ session: { userId: "staff", membershipId: "staff-m", organisationId: "internal", capabilities: new Set<string>() }, member: vi.fn(), roles: vi.fn(), org: vi.fn(), user: vi.fn(), transaction: vi.fn(), write: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session, createSessionCookie: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { user: { findUniqueOrThrow: state.user }, $transaction: state.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: async (value: string) => value === "correct-password" } }));
import { archiveAtlasCompany, saveAtlasUserAccess, saveAtlasUserProfile, issueAtlasUserRecovery, updateAtlasStaff, saveAtlasCompanyBrand } from "@/app/(app)/atlas/admin-actions";
const form = (values: Record<string, string | string[]>) => { const result = new FormData(); for (const [key, value] of Object.entries(values)) for (const item of Array.isArray(value) ? value : [value]) result.append(key, item); return result; };
beforeEach(() => {
  vi.clearAllMocks(); state.session.capabilities = new Set();
  state.user.mockResolvedValue({ passwordHash: "hash" });
  state.transaction.mockImplementation(async callback => callback({
    $queryRaw: vi.fn(), membership: { findFirstOrThrow: state.member, update: state.write, updateMany: state.write },
    role: { findMany: state.roles }, roleOnMembership: { deleteMany: state.write, createMany: state.write },
    organisation: { findFirstOrThrow: state.org, update: state.write }, user: { update: state.write },
    passwordReset: { count: vi.fn().mockResolvedValue(0), updateMany: state.write, create: state.write },
    platformAdministrator: { findUniqueOrThrow: vi.fn().mockResolvedValue({ role: "OWNER", active: true }), count: vi.fn().mockResolvedValue(1), update: state.write },
    auditEntry: { create: state.audit },
  }));
});
describe("Atlas staff policy", () => {
  it("gives every active staff classification full platform permissions", () => {
    for (const role of Object.keys(ATLAS_STAFF_ROLES)) expect(platformCapabilities({ role, active: true })).toContain("atlas.data.export");
    expect(platformCapabilities({ role: "EMPLOYEE", active: false })).toEqual([]);
    expect(platformCapabilities({ role: "CUSTOMER", active: true })).toEqual([]);
  });
  it("denies customer administrators before database access", async () => {
    state.session.capabilities.add("core.users.manage");
    for (const action of [archiveAtlasCompany, saveAtlasUserAccess, saveAtlasUserProfile, issueAtlasUserRecovery, updateAtlasStaff, saveAtlasCompanyBrand]) await expect(action(form({ organisationId: "other" }))).rejects.toThrow("FORBIDDEN");
    expect(state.transaction).not.toHaveBeenCalled(); expect(state.user).not.toHaveBeenCalled();
  });
  it("never accepts a platform permission through the company access editor", async () => {
    state.session.capabilities.add("atlas.users.manage");
    await expect(saveAtlasUserAccess(form({ organisationId: "customer-a", membershipId: "a", capability: "atlas.staff.manage" }))).rejects.toThrow("Company roles cannot grant");
    expect(state.transaction).not.toHaveBeenCalled();
  });
  it("looks up a target user within the explicitly selected company", async () => {
    state.session.capabilities.add("atlas.users.manage"); state.member.mockRejectedValue(new Error("No matching tenant member"));
    await expect(saveAtlasUserAccess(form({ organisationId: "customer-a", membershipId: "foreign-member" }))).rejects.toThrow("No matching tenant");
    expect(state.member.mock.calls[0][0].where).toMatchObject({ id: "foreign-member", organisationId: "customer-a", organisation: { kind: "CUSTOMER", archivedAt: null } });
    expect(state.write).not.toHaveBeenCalled();
  });
  it("rejects staff identities and shared identities in the company profile editor", async () => {
    state.session.capabilities.add("atlas.users.manage");
    const data = form({ organisationId: "customer-a", membershipId: "a", name: "User", email: "user@example.test" });
    state.member.mockResolvedValue({ user: { platformAdmin: { role: "OWNER" }, _count: { memberships: 1 } } });
    await expect(saveAtlasUserProfile(data)).rejects.toThrow("Atlas team");
    state.member.mockResolvedValue({ user: { platformAdmin: null, _count: { memberships: 2 } } });
    await expect(saveAtlasUserProfile(data)).rejects.toThrow("shared identity"); expect(state.write).not.toHaveBeenCalled();
  });
  it("requires the administrator's password before recovery and archive", async () => {
    state.session.capabilities = new Set(["atlas.users.manage", "atlas.companies.archive"]);
    await expect(issueAtlasUserRecovery(form({ currentPassword: "wrong" }))).rejects.toThrow("Confirm your own password");
    await expect(archiveAtlasCompany(form({ currentPassword: "wrong" }))).rejects.toThrow("Confirm your own password");
    expect(state.transaction).not.toHaveBeenCalled();
  });
  it("archives records, revokes sessions and restores only to suspended", async () => {
    state.session.capabilities.add("atlas.companies.archive");
    state.org.mockResolvedValue({ name: "Company A", status: "ACTIVE", archivedAt: null });
    await archiveAtlasCompany(form({ organisationId: "customer-a", confirmName: "Company A", currentPassword: "correct-password", reason: "Customer leaving" }));
    expect(state.write).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "ARCHIVED", archiveReason: "Customer leaving" }) }));
    expect(state.write).toHaveBeenCalledWith({ where: { organisationId: "customer-a" }, data: { sessionVersion: { increment: 1 } } });
    state.org.mockResolvedValue({ name: "Company A", status: "ARCHIVED", archivedAt: new Date() });
    await archiveAtlasCompany(form({ organisationId: "customer-a", confirmName: "Company A", currentPassword: "correct-password", mode: "restore" }));
    expect(state.write).toHaveBeenCalledWith({ where: { id: "customer-a" }, data: { status: "SUSPENDED", archivedAt: null, archiveReason: null } });
  });
  it("requires exact company confirmation and preserves the last Owner", async () => {
    state.session.capabilities = new Set(["atlas.companies.archive", "atlas.staff.manage"]);
    state.org.mockResolvedValue({ name: "Company A" });
    await expect(archiveAtlasCompany(form({ organisationId: "customer-a", confirmName: "wrong", currentPassword: "correct-password", reason: "Leaving" }))).rejects.toThrow("exactly");
    await expect(updateAtlasStaff(form({ userId: "other-owner", staffRole: "EMPLOYEE", status: "ACTIVE", currentPassword: "correct-password" }))).rejects.toThrow("at least one active");
    expect(state.write).not.toHaveBeenCalled();
  });
  it("saves branding to the selected tenant, preserving unsubmitted profile fields", async () => {
    state.session.capabilities.add("atlas.companies.manage");
    state.org.mockResolvedValue({ companyProfile: { legalName: "Before", registrationNumber: "KEEP", website: "https://example.test" }, logoDataUrl: null });
    await saveAtlasCompanyBrand(form({ organisationId: "customer-a", legalName: "After", accentColour: "#123456" }));
    expect(state.org).toHaveBeenCalledWith({ where: { id: "customer-a", kind: "CUSTOMER", archivedAt: null } });
    expect(state.write).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "customer-a" }, data: expect.objectContaining({ companyProfile: expect.objectContaining({ legalName: "After", registrationNumber: "KEEP", website: "https://example.test" }) }) }));
  });
});
describe("complete company export scope", () => {
  const columns = [
    ["organisations", "id"], ["parties", "organisationId"], ["parents", "organisationId"], ["children", "parentId"], ["grandchildren", "childId"], ["users", "id"], ["private_global", "userId"], ["password_resets", "membershipId"], ["platform_administrators", "userId"], ["memberships", "organisationId"],
  ].map(([table, column]) => ({ table, column, type: "text" })) satisfies ExportColumn[];
  it("includes indirect children without following a shared user into other tenants", () => {
    const scopes = companyExportScopes(columns, [
      { table: "children", parent: "parents", columns: ["parentId"], parentColumns: ["id"] },
      { table: "grandchildren", parent: "children", columns: ["childId"], parentColumns: ["id"] },
      { table: "private_global", parent: "users", columns: ["userId"], parentColumns: ["id"] },
    ]);
    expect(scopes.get("parties")).toBe('r."organisationId" = $1');
    expect(scopes.get("grandchildren")).toContain('parent1."parentId" = parent0."id"');
    expect(scopes.has("private_global")).toBe(false); expect(scopes.has("password_resets")).toBe(false); expect(scopes.has("platform_administrators")).toBe(false);
    expect(scopes.get("users")).toContain('m."organisationId"=$1');
  });
  it("excludes authentication and encrypted service credentials", () => {
    for (const field of ["passwordHash", "passwordEnc", "credentialsEnc", "tokenHash", "token", "authVersion", "sessionVersion"]) expect(protectedExportField(field)).toBe(true);
    for (const field of ["name", "content", "contentHash", "bankAccountNumber"]) expect(protectedExportField(field)).toBe(false);
  });
});
