import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ session: vi.fn(), membership: vi.fn(), create: vi.fn(), audit: vi.fn(), enabled: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionForUser: m.session }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findFirst: m.membership }, auditEntry: { create: m.create, findFirst: m.audit } } }));
import { captureCustomerFieldMigrationPrincipal, openFieldMigrationSupportContext, resolveFieldMigrationPrincipal } from "@/core/studio/fields/principal";
const customer: Session = { userId: "user", membershipId: "member", organisationId: "company", organisationName: "Company",
  userName: "User", userEmail: "user@example.invalid", capabilities: new Set(["studio.definition.publish"]) };
const staff = { ...customer, organisationId: "internal", membershipId: "staff-member",
  capabilities: new Set([...customer.capabilities, "atlas.staff.manage", "atlas.companies.manage"]) };
const targetStaff = { ...staff, organisationId: "company", membershipId: "member" };
const stamp = { organisationId: "company", userId: "user", membershipId: "member", authVersion: 3, sessionVersion: 2 };
beforeEach(() => {
  vi.clearAllMocks();
  m.session.mockResolvedValue(customer); m.membership.mockResolvedValue({ id: "member", sessionVersion: 2, user: { authVersion: 3 } });
  m.enabled.mockResolvedValue(undefined); m.create.mockResolvedValue({ id: "audit" });
  m.audit.mockResolvedValue({ after: { ...stamp, fromOrganisationId: "internal" } });
});
it("captures only current real customer membership, without writing or retaining capabilities", async () => {
  const principal = await captureCustomerFieldMigrationPrincipal(customer);
  expect(principal).toEqual({ ...stamp, authority: "customer" });
  expect(m.membership.mock.calls[0][0].where).toMatchObject({ organisationId: "company", userId: "user", active: true,
    organisation: { kind: "CUSTOMER", status: "ACTIVE", archivedAt: null } });
  expect(m.create).not.toHaveBeenCalled();
  await expect(captureCustomerFieldMigrationPrincipal({ ...customer, membershipId: "metadata-only" })).rejects.toThrow("FORBIDDEN");
});
it("refreshes current permissions, membership, company and source availability before capture", async () => {
  m.session.mockResolvedValue(null); await expect(captureCustomerFieldMigrationPrincipal(customer)).rejects.toThrow("FORBIDDEN");
  m.session.mockResolvedValue({ ...customer, capabilities: new Set(["studio.definition.edit"]) });
  await expect(captureCustomerFieldMigrationPrincipal(customer)).rejects.toThrow("FORBIDDEN");
  m.session.mockResolvedValue(customer); m.membership.mockResolvedValue(null);
  await expect(captureCustomerFieldMigrationPrincipal(customer)).rejects.toThrow("FORBIDDEN");
  m.membership.mockResolvedValue({ id: "member", sessionVersion: 2, user: { authVersion: 3 } }); m.enabled.mockRejectedValue(new Error("disabled"));
  await expect(captureCustomerFieldMigrationPrincipal(customer)).rejects.toThrow("disabled"); expect(m.create).not.toHaveBeenCalled();
});
it("requires independent current staff authority, existing affiliation and an actual audit before support data context", async () => {
  await expect(openFieldMigrationSupportContext(customer, "company")).rejects.toThrow("FORBIDDEN");
  m.session.mockImplementation(async (org: string) => org === "internal" ? staff : targetStaff);
  const context = await openFieldMigrationSupportContext(staff, "company");
  expect(context.session).toBe(targetStaff); expect(context.principal).toEqual({ ...stamp, authority: "staff_support", auditId: "audit" });
  expect(m.create.mock.calls[0][0].data).toMatchObject({ organisationId: "company", actorUserId: "user",
    action: "studio.field.migration.support_opened", entityType: "Membership", entityId: "member", after: { ...stamp, fromOrganisationId: "internal" } });
  // No upsert, role or grant operation exists in the mocked database surface.
  m.session.mockResolvedValue(customer); await expect(openFieldMigrationSupportContext(staff, "company")).rejects.toThrow("FORBIDDEN");
  m.session.mockImplementation(async (org: string) => org === "internal" ? staff : null);
  await expect(openFieldMigrationSupportContext(staff, "company")).rejects.toThrow("FORBIDDEN");
});
it("does not return a support context when audit storage fails", async () => {
  m.session.mockImplementation(async (org: string) => org === "internal" ? staff : targetStaff);
  m.create.mockRejectedValue(new Error("audit unavailable"));
  await expect(openFieldMigrationSupportContext(staff, "company")).rejects.toThrow("audit unavailable");
});
it("rejects metadata context as support authority and cannot capture staff as customer", async () => {
  m.session.mockResolvedValue(targetStaff);
  await expect(openFieldMigrationSupportContext({ ...staff, organisationId: "company" }, "company")).rejects.toThrow("FORBIDDEN");
  await expect(captureCustomerFieldMigrationPrincipal(targetStaff)).rejects.toThrow("FORBIDDEN");
  expect(m.create).not.toHaveBeenCalled();
});
it("refreshes jobs without old capability snapshots and honours session/auth revocation and membership replacement", async () => {
  const principal = { ...stamp, authority: "customer" };
  expect(await resolveFieldMigrationPrincipal(principal)).toBe(customer);
  for (const changed of [{ ...stamp, membershipId: "replacement" }, { ...stamp, authVersion: 4 }, { ...stamp, sessionVersion: 3 }])
    await expect(resolveFieldMigrationPrincipal({ ...changed, authority: "customer" })).rejects.toThrow("FORBIDDEN");
  m.session.mockResolvedValue({ ...customer, capabilities: new Set() }); await expect(resolveFieldMigrationPrincipal(principal)).rejects.toThrow("FORBIDDEN");
  await expect(resolveFieldMigrationPrincipal({ ...principal, capabilities: ["studio.definition.publish"] })).rejects.toThrow();
});
it("binds staff support audit to exact tenant, actor, membership and captured versions; revoked staff cannot resume", async () => {
  const principal = { ...stamp, authority: "staff_support", auditId: "audit" };
  m.session.mockResolvedValue(targetStaff); expect(await resolveFieldMigrationPrincipal(principal)).toBe(targetStaff);
  expect(m.audit.mock.calls[0][0].where).toMatchObject({ id: "audit", organisationId: "company", actorUserId: "user", entityId: "member" });
  for (const after of [null, { ...stamp, organisationId: "other", fromOrganisationId: "internal" }, { ...stamp, sessionVersion: 1, fromOrganisationId: "internal" }]) {
    m.audit.mockResolvedValue({ after }); await expect(resolveFieldMigrationPrincipal(principal)).rejects.toThrow("FORBIDDEN");
  }
  m.audit.mockResolvedValue(null); await expect(resolveFieldMigrationPrincipal(principal)).rejects.toThrow("FORBIDDEN");
  m.session.mockResolvedValue(customer); await expect(resolveFieldMigrationPrincipal(principal)).rejects.toThrow("FORBIDDEN");
});
