import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), transaction: vi.fn(), modules: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => new CapabilityRegistry(available) };
});
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import { withFieldRuntimeAuthority, fieldRuntimeAuthorityInTransaction } from "@/core/studio/fields/runtime-authority";
import { ticketStudioContract } from "@/core/service-work/studio";

const fixture = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: ["tickets.ticket.read"], deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null as Date | null, auditAccess: null, restrictedAccessAreas: [] } });
let row: ReturnType<typeof fixture>;
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company }, moduleState: { findMany: m.modules } } as unknown as Prisma.TransactionClient;
beforeEach(() => {
  vi.resetAllMocks(); row = fixture(); m.member.mockImplementation(async () => structuredClone(row));
  m.raw.mockResolvedValue([]); m.company.mockImplementation(async () => row.organisation.kind === "CUSTOMER" && row.organisation.status === "ACTIVE" && row.organisation.archivedAt === null ? { id: "company" } : null);
  m.modules.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }]);
  m.transaction.mockImplementation(async operation => operation(tx));
});
async function authenticated() { const session = await sessionForUser("company", "actor"); expect(session).not.toBeNull(); return session!; }
it("refreshes genuine server identity in the shared serializable transaction without Studio authoring", async () => {
  const session = await authenticated(), stamp = sessionAuthorityStamp(session);
  expect(stamp).toEqual({ userId: "actor", organisationId: "company", membershipId: "member", authVersion: 3, sessionVersion: 2 }); expect(Object.isFrozen(stamp)).toBe(true);
  expect(Object.keys(session)).not.toContain("authVersion"); expect(JSON.stringify(session)).not.toContain("sessionVersion");
  await withFieldRuntimeAuthority(session, async authority => {
    expect(authority.transaction).toBe(tx); expect(authority.stamp).toEqual(stamp);
    expect(authority.session.capabilities).toEqual(new Set(["core.profile.self", "tickets.ticket.read"]));
    expect(authority.session).not.toBe(session);
  });
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  expect(m.member).toHaveBeenCalledTimes(2);
  for (const [strings, ...values] of m.raw.mock.calls) {
    const sql = strings.join("?"); expect(sql).toContain("FOR SHARE");
    expect(values).toContain(sql.includes("platform_administrators") ? "actor" : sql.includes("module_states") ? "company" : "member");
  }
  expect(m.modules).toHaveBeenCalledWith({ where: { organisationId: "company" }, select: { moduleId: true, enabled: true, entitled: true } });
});
it("cloned metadata/untrusted Session cannot inherit the private stamp; changing a stamped tenant fails before transaction", async () => {
  const session = await authenticated(), operation = vi.fn();
  await expect(withFieldRuntimeAuthority({ ...session }, operation)).rejects.toThrow("FORBIDDEN");
  session.organisationId = "foreign"; await expect(withFieldRuntimeAuthority(session, operation)).rejects.toThrow("FORBIDDEN");
  expect(operation).not.toHaveBeenCalled(); expect(m.transaction).not.toHaveBeenCalled();
});
it("refreshes revoked capabilities rather than using a stale capability set", async () => {
  const session = await authenticated(); row.deniedCapabilities = ["tickets.ticket.read"];
  await withFieldRuntimeAuthority(session, async authority => { expect(authority.session.capabilities.has("tickets.ticket.read")).toBe(false); });
  expect(session.capabilities.has("tickets.ticket.read")).toBe(true);
});
it("rejects changed authentication/session versions and revoked membership or company before callback", async () => {
  for (const change of [() => { row.user.authVersion++; }, () => { row.sessionVersion++; }, () => { row.active = false; },
    () => { row.organisation.status = "SUSPENDED"; }, () => { row.organisation.archivedAt = new Date(); }]) {
    row = fixture(); const session = await authenticated(), operation = vi.fn(); change();
    await expect(withFieldRuntimeAuthority(session, operation)).rejects.toThrow("FORBIDDEN"); expect(operation).not.toHaveBeenCalled();
  }
});
it("does not allow a mismatched current membership or internal platform company", async () => {
  const session = await authenticated(), operation = vi.fn(); row.id = "another-membership";
  await expect(withFieldRuntimeAuthority(session, operation)).rejects.toThrow("FORBIDDEN");
  row = fixture(); row.organisation.kind = "INTERNAL";
  await expect(withFieldRuntimeAuthority(session, operation)).rejects.toThrow("FORBIDDEN"); expect(operation).not.toHaveBeenCalled();
});
it("pins source module availability to the tenant transaction, including entitlement", async () => {
  const session = await authenticated();
  for (const state of [{ enabled: false, entitled: true }, { enabled: true, entitled: false }, { enabled: true, entitled: true }]) {
    m.modules.mockResolvedValue([{ moduleId: "tickets", ...state }]);
    await withFieldRuntimeAuthority(session, async ({ session: fresh, registry }) => {
      registry.register("tickets", ticketStudioContract); const reference = registry.describe("tickets.ticket", 1);
      if (state.enabled && state.entitled) await expect(registry.resolve(fresh, reference)).resolves.toMatchObject({ id: "tickets.ticket" });
      else await expect(registry.resolve(fresh, reference)).rejects.toThrow("unavailable");
      await expect(registry.resolve({ ...fresh, organisationId: "foreign" }, reference)).rejects.toThrow("unavailable");
    });
  }
});
it("refreshes native-operation authority in the caller's exact transaction without opening a nested transaction", async () => {
  const session = await authenticated();
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  row.deniedCapabilities = ["tickets.ticket.read"];
  const authority = await fieldRuntimeAuthorityInTransaction(session, tx);
  expect(authority.transaction).toBe(tx); expect(authority.session).not.toBe(session);
  expect(authority.session.capabilities.has("tickets.ticket.read")).toBe(false);
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.member).toHaveBeenLastCalledWith(expect.objectContaining({ where: { organisationId_userId: { userId: "actor", organisationId: "company" } } }));
  expect(m.raw.mock.calls[0][0].join("")).toBe("SHOW transaction_isolation");
});
it("rejects unsafe or unprovable native transaction isolation before reading authority or module state", async () => {
  const session = await authenticated();
  for (const isolation of [[], [{ transaction_isolation: "read committed" }], [{ transaction_isolation: "repeatable read" }],
    [{ transaction_isolation: "serializable" }, { transaction_isolation: "serializable" }]]) {
    m.raw.mockResolvedValue(isolation); m.member.mockClear();
    await expect(fieldRuntimeAuthorityInTransaction(session, tx)).rejects.toThrow("serializable");
    expect(m.member).not.toHaveBeenCalled(); expect(m.company).not.toHaveBeenCalled(); expect(m.modules).not.toHaveBeenCalled();
  }
  expect(m.transaction).not.toHaveBeenCalled();
});
it("rejects cloned or tenant-mutated native-operation sessions before touching the caller transaction", async () => {
  const session = await authenticated();
  await expect(fieldRuntimeAuthorityInTransaction({ ...session }, tx)).rejects.toThrow("FORBIDDEN");
  session.organisationId = "foreign";
  await expect(fieldRuntimeAuthorityInTransaction(session, tx)).rejects.toThrow("FORBIDDEN");
  expect(m.raw).not.toHaveBeenCalled(); expect(m.transaction).not.toHaveBeenCalled();
});
it("rejects current native-operation authentication revocation and propagates caller transaction failure", async () => {
  const session = await authenticated();
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  row.sessionVersion++;
  await expect(fieldRuntimeAuthorityInTransaction(session, tx)).rejects.toThrow("FORBIDDEN");
  row.sessionVersion--; const failure = new Error("Native transaction failed"); m.raw.mockRejectedValueOnce(failure);
  await expect(fieldRuntimeAuthorityInTransaction(session, tx)).rejects.toBe(failure);
  expect(m.transaction).not.toHaveBeenCalled();
});
