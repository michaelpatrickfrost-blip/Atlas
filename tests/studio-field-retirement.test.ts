import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), gate: vi.fn(), lock: vi.fn(), available: vi.fn(), change: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: mocks.transaction } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: mocks.gate }));
import { retireFieldDefinition } from "@/core/studio/fields/retirement";

const definitionId = "f654330c-b287-48f0-be34-acf8b9d51010";
const session: Session = { organisationId: "tenant-a", organisationName: "A", userId: "actor", userName: "Actor", userEmail: "actor@example.test", membershipId: "membership",
  capabilities: new Set(["studio.definition.publish"]) };
beforeEach(() => {
  vi.clearAllMocks(); mocks.gate.mockResolvedValue(undefined); mocks.available.mockResolvedValue({ id: "enabled" }); mocks.change.mockResolvedValue({ count: 1 }); mocks.audit.mockResolvedValue({ id: "audit" });
  mocks.transaction.mockImplementation(async operation => operation({ $queryRaw: mocks.lock, moduleState: { findFirst: mocks.available }, studioDefinition: { updateMany: mocks.change }, auditEntry: { create: mocks.audit } }));
});

describe("Studio field retirement boundary", () => {
  it("requires publication independently of edit permission before database work", async () => {
    await expect(retireFieldDefinition({ ...session, capabilities: new Set(["studio.definition.edit"]) }, { definitionId, revision: 2 })).rejects.toThrow("FORBIDDEN");
    expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.gate).not.toHaveBeenCalled();
  });
  it("rejects disabled Studio and untrusted organisation selectors", async () => {
    mocks.gate.mockRejectedValueOnce(new Error("disabled"));
    await expect(retireFieldDefinition(session, { definitionId, revision: 2 })).rejects.toThrow("disabled");
    await expect(retireFieldDefinition(session, { definitionId, revision: 2, organisationId: "tenant-b" })).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("locks/rechecks enablement and rejects a concurrent source disablement", async () => {
    mocks.available.mockResolvedValue(null);
    await expect(retireFieldDefinition(session, { definitionId, revision: 2 })).rejects.toThrow("Studio is unavailable");
    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.available).toHaveBeenCalledWith({ where: { organisationId: "tenant-a", moduleId: "studio", enabled: true, entitled: true }, select: { id: true } });
    expect(mocks.change).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("performs field-only tenant CAS and audit in one serializable transaction without clearing history", async () => {
    const retired = await retireFieldDefinition(session, { definitionId, revision: 2 });
    expect(retired.revision).toBe(3); expect(retired.retiredAt).toBeInstanceOf(Date);
    expect(mocks.change).toHaveBeenCalledWith({ where: { id: definitionId, organisationId: "tenant-a", kind: "customField", revision: 2, retiredAt: null }, data: { retiredAt: retired.retiredAt, revision: { increment: 1 } } });
    expect(mocks.change.mock.calls[0][0].data).not.toHaveProperty("activeVersionId");
    expect(mocks.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ organisationId: "tenant-a", actorUserId: "actor", action: "studio.field.retired", entityId: definitionId,
      before: { revision: 2 }, after: { revision: 3, retiredAt: retired.retiredAt.toISOString() } }) });
    expect(mocks.transaction.mock.calls[0][1]).toEqual({ isolationLevel: "Serializable" });
  });
  it("fails stale/foreign/non-field/already-retired CAS without a success audit", async () => {
    mocks.change.mockResolvedValue({ count: 0 });
    await expect(retireFieldDefinition(session, { definitionId, revision: 2 })).rejects.toThrow("CONFLICT");
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("propagates audit failure so the transaction cannot return successful retirement", async () => {
    mocks.audit.mockRejectedValue(new Error("audit failed"));
    await expect(retireFieldDefinition(session, { definitionId, revision: 2 })).rejects.toThrow("audit failed");
  });
  it("reports a serialization race as a refresh conflict without replaying the mutation", async () => {
    mocks.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("serialization failed", { code: "P2034", clientVersion: "7.10.0" }));
    await expect(retireFieldDefinition(session, { definitionId, revision: 2 })).rejects.toThrow("CONFLICT");
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
});
