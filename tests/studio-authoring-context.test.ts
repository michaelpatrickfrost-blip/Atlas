import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { openStudioBusiness, withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), refresh: vi.fn(), sessionForUser: vi.fn(), field: vi.fn(),
  company: vi.fn(), membership: vi.fn(), module: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: mocks.transaction } }));
vi.mock("@/core/auth/session", () => ({ sessionForUser: mocks.sessionForUser }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ nativeFieldMutationSessionInTransaction: mocks.refresh, fieldRuntimeAuthorityInTransaction: mocks.field }));
const actor: Session = { userId: "staff", organisationId: "internal", organisationName: "Atlas", membershipId: "atlas-member",
  userName: "Staff", userEmail: "staff@example.test", capabilities: new Set(["atlas.staff.manage", "atlas.companies.manage", CAP.read, CAP.edit, CAP.publish]) };
const selected: Session = { ...actor, organisationId: "business-a", organisationName: "Business A", membershipId: "support-member" };
const tx = { organisation: { findFirst: mocks.company }, membership: { upsert: mocks.membership }, moduleState: { findFirst: mocks.module }, auditEntry: { create: mocks.audit } };
beforeEach(() => {
  vi.clearAllMocks(); mocks.transaction.mockImplementation(async work => work(tx));
  mocks.refresh.mockResolvedValue({ session: actor }); mocks.sessionForUser.mockResolvedValue(selected);
  mocks.field.mockImplementation(async session => ({ session, transaction: tx }));
  mocks.company.mockResolvedValue({ id: selected.organisationId }); mocks.module.mockResolvedValue({ id: "enabled" });
});
it("explicitly opens a selected customer business through the existing audited affiliation policy", async () => {
  expect(await openStudioBusiness(actor, selected.organisationId)).toEqual({ organisationId: selected.organisationId });
  expect(mocks.company).toHaveBeenCalledWith({ where: { id: selected.organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null }, select: { id: true } });
  expect(mocks.membership).toHaveBeenCalledWith({ where: { organisationId_userId: { organisationId: selected.organisationId, userId: actor.userId } }, create: { organisationId: selected.organisationId, userId: actor.userId }, update: { active: true } });
  expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organisationId: selected.organisationId, actorUserId: actor.userId, action: "atlas.studio.opened" }) }));
  expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});
it("resolves the genuine selected membership for later actions without creating access or copying the metadata context", async () => {
  const operation = vi.fn(async authority => authority.session);
  expect(await withStudioAuthoringAuthority(actor, CAP.edit, selected.organisationId, operation)).toBe(selected);
  expect(mocks.sessionForUser).toHaveBeenCalledWith(selected.organisationId, actor.userId, tx);
  expect(mocks.field).toHaveBeenCalledWith(selected, tx);
  expect(mocks.membership).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
});
it.each(["source_revoked", "target_revoked", "module_disabled", "business_unavailable", "publisher_denied"])("denies %s before the authoring operation", async mode => {
  if (mode === "source_revoked") mocks.refresh.mockRejectedValue(new Error("FORBIDDEN: revoked"));
  if (mode === "target_revoked") mocks.sessionForUser.mockResolvedValue(null);
  if (mode === "module_disabled") mocks.module.mockResolvedValue(null);
  if (mode === "business_unavailable") mocks.company.mockResolvedValue(null);
  if (mode === "publisher_denied") mocks.sessionForUser.mockResolvedValue({ ...selected, capabilities: new Set(["atlas.staff.manage", "atlas.companies.manage", CAP.read]) });
  const operation = vi.fn();
  await expect(withStudioAuthoringAuthority(actor, CAP.publish, selected.organisationId, operation)).rejects.toThrow();
  expect(operation).not.toHaveBeenCalled(); expect(mocks.membership).not.toHaveBeenCalled();
});
it("prevents a customer selecting another business or provisioning support membership", async () => {
  const customer = { ...selected, capabilities: new Set([CAP.read, CAP.edit]) };
  mocks.refresh.mockResolvedValue({ session: customer });
  await expect(withStudioAuthoringAuthority(customer, CAP.edit, "business-b", vi.fn())).rejects.toThrow("FORBIDDEN");
  await expect(openStudioBusiness(customer, "business-b")).rejects.toThrow("FORBIDDEN");
  expect(mocks.membership).not.toHaveBeenCalled(); expect(mocks.company).not.toHaveBeenCalled();
});
it("uses a customer's own current principal when no target is supplied", async () => {
  const customer = { ...selected, capabilities: new Set([CAP.read, CAP.edit]) };
  mocks.refresh.mockResolvedValue({ session: customer });
  expect(await withStudioAuthoringAuthority(customer, CAP.read, undefined, async authority => authority.session)).toBe(customer);
  expect(mocks.sessionForUser).not.toHaveBeenCalled(); expect(mocks.membership).not.toHaveBeenCalled();
});
