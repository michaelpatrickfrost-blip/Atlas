import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ transaction: vi.fn(), resolve: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(),
  publication: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
import { cancelFieldMigrationPublication } from "@/core/studio/fields/migrations/cancellation";
const session: Session = { userId: "current-publisher", userName: "Publisher", userEmail: "publisher@example.invalid", membershipId: "current-member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish"]) };
const principal = { organisationId: "company", userId: session.userId, membershipId: session.membershipId, sessionVersion: 2, authVersion: 3, authority: "customer" as const };
const request = { preparationId: "00000000-0000-4000-8000-000000000001", revision: 0 };
let publication: { preparationId: string; organisationId: string; state: string; revision: number; publisherUserId: string };
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module }, organisation: { findFirst: m.company },
  studioFieldMigrationPublication: { findFirst: m.publication, updateMany: m.update }, auditEntry: { create: m.audit } };
beforeEach(() => {
  vi.clearAllMocks(); m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined); m.raw.mockResolvedValue([]);
  m.member.mockResolvedValue({ id: session.membershipId, sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: false });
  publication = { preparationId: request.preparationId, organisationId: "company", state: "PUBLISHED", revision: 0, publisherUserId: "revoked-creator" };
  m.publication.mockImplementation(async ({ where }) => where.preparationId === publication.preparationId && where.organisationId === publication.organisationId ? structuredClone(publication) : null);
  m.update.mockImplementation(async ({ where, data }) => { if (where.revision !== publication.revision) return { count: 0 }; publication.state = data.state; publication.revision = data.revision; return { count: 1 }; });
  m.audit.mockResolvedValue({ id: "audit" });
  m.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = structuredClone(publication); try { return await run(tx); } catch (error) { publication = before; throw error; }
  });
});

it("current authorised publisher cancels a stopped creator with sparse CAS/Audit, no live-data/native permission or reads", async () => {
  expect(await cancelFieldMigrationPublication(session, principal, request)).toEqual({ id: request.preparationId, revision: 1, state: "CANCELLED", replayed: false });
  expect(m.resolve).toHaveBeenCalledWith(principal);
  expect(m.publication).toHaveBeenCalledWith({ where: { preparationId: request.preparationId, organisationId: "company" }, select: { preparationId: true, revision: true, state: true } });
  expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "studio.field.migration.cancelled", actorUserId: session.userId,
    organisationId: "company", entityId: request.preparationId, after: { state: "CANCELLED", revision: 1 } }) });
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});

it("lost-response replay refreshes current principal and writes no state or Audit twice", async () => {
  const first = await cancelFieldMigrationPublication(session, principal, request); m.update.mockClear(); m.audit.mockClear();
  expect(await cancelFieldMigrationPublication(session, principal, request)).toEqual({ ...first, replayed: true });
  expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  m.resolve.mockRejectedValue(new Error("FORBIDDEN: current publisher revoked"));
  await expect(cancelFieldMigrationPublication(session, principal, request)).rejects.toThrow("current publisher revoked");
});

it("foreign scope, client organisation/principal/state, future revision and missing publish access cannot cancel", async () => {
  for (const value of [{ ...request, organisationId: "other" }, { ...request, principal }, { ...request, state: "CANCELLED" }])
    await expect(cancelFieldMigrationPublication(session, principal, value)).rejects.toThrow();
  await expect(cancelFieldMigrationPublication({ ...session, capabilities: new Set() }, principal, request)).rejects.toThrow("FORBIDDEN");
  await expect(cancelFieldMigrationPublication({ ...session, organisationId: "other" }, principal, request)).rejects.toThrow("FORBIDDEN");
  await expect(cancelFieldMigrationPublication(session, principal, { ...request, preparationId: "00000000-0000-4000-8000-000000000002" })).rejects.toThrow("stale or has changed");
  await expect(cancelFieldMigrationPublication(session, principal, { ...request, revision: 1 })).rejects.toThrow("stale or has changed");
  expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});

it("lost CAS or Audit failure rolls state back, and the same request can retry", async () => {
  m.update.mockResolvedValueOnce({ count: 0 }); await expect(cancelFieldMigrationPublication(session, principal, request)).rejects.toThrow("stale or has changed");
  m.audit.mockRejectedValueOnce(new Error("Audit unavailable")); await expect(cancelFieldMigrationPublication(session, principal, request)).rejects.toThrow("Audit unavailable");
  expect(publication).toMatchObject({ state: "PUBLISHED", revision: 0 });
  expect(await cancelFieldMigrationPublication(session, principal, request)).toMatchObject({ state: "CANCELLED", revision: 1 });
});
