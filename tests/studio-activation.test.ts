import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ binding: vi.fn(), count: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/fields/binding", () => ({ assertFieldBinding: m.binding }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileDefinition } from "@/core/studio/compiler";
import { canonicalJson } from "@/core/studio/registry/contracts";
import { activateCompiledVersionInTransaction } from "@/core/studio/definitions/activation";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id: meta.id, version: meta.version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const tx = { moduleState: { count: m.count }, studioDefinition: { updateMany: m.update }, auditEntry: { create: m.audit } } as unknown as Prisma.TransactionClient;
let current = { activeVersionId: uuid(3), revision: 7 };
beforeEach(() => {
  vi.clearAllMocks(); current = { activeVersionId: uuid(3), revision: 7 }; m.binding.mockResolvedValue(undefined); m.count.mockResolvedValue(1); m.audit.mockResolvedValue({ id: "audit" });
  m.update.mockImplementation(async ({ where, data }) => {
    if (where.revision !== current.revision || (where.activeVersionId !== undefined && where.activeVersionId !== current.activeVersionId)) return { count: 0 };
    current = { activeVersionId: data.activeVersionId, revision: current.revision + 1 }; return { count: 1 };
  });
});
async function fixture(field = false) {
  const compiled = field ? await compileDefinition(session, "customField", { schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(2),
    field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "string" } } }, registry)
    : await compileDefinition(session, "capabilitySet", { schemaVersion: 1, description: "Sources", references: [ref("tickets.ticket.get", 1)] }, registry);
  const version = { id: uuid(4), organisationId: session.organisationId, definitionId: uuid(1), version: 2,
    checksum: compiled.checksum, compiledPlan: JSON.parse(canonicalJson(compiled.plan)) as Prisma.JsonValue };
  return { compiled, version };
}
it("preserves scoped source modules, definition CAS, result and activation Audit in caller's transaction", async () => {
  const { compiled, version } = await fixture();
  expect(await activateCompiledVersionInTransaction(tx, session, uuid(1), 7, version, compiled)).toEqual({ revision: 8 });
  expect(m.count).toHaveBeenCalledWith({ where: { organisationId: "company", moduleId: { in: ["tickets"] }, enabled: true, entitled: true } });
  expect(m.update).toHaveBeenCalledWith({ where: { id: uuid(1), organisationId: "company", revision: 7, retiredAt: null }, data: { activeVersionId: uuid(4), revision: { increment: 1 } } });
  expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organisationId: "company", actorUserId: "user", action: "studio.definition.activated", entityId: uuid(1) }) }));
  expect(m.binding).not.toHaveBeenCalled(); expect(current).toEqual({ activeVersionId: uuid(4), revision: 8 });
});
it("denies missing publish capability and foreign/inconsistent immutable version before binding/count/CAS/Audit", async () => {
  const { compiled, version } = await fixture();
  await expect(activateCompiledVersionInTransaction(tx, { ...session, capabilities: new Set() }, uuid(1), 7, version, compiled)).rejects.toThrow("FORBIDDEN");
  for (const change of [{ organisationId: "other" }, { definitionId: uuid(99) }])
    await expect(activateCompiledVersionInTransaction(tx, session, uuid(1), 7, { ...version, ...change }, compiled)).rejects.toThrow("FORBIDDEN");
  for (const change of [{ checksum: "f".repeat(64) }, { compiledPlan: {} }])
    await expect(activateCompiledVersionInTransaction(tx, session, uuid(1), 7, { ...version, ...change }, compiled)).rejects.toThrow("DEPENDENCY_BROKEN");
  for (const effect of [m.binding, m.count, m.update, m.audit]) expect(effect).not.toHaveBeenCalled();
});
it("keeps custom-field generation binding mandatory before source modules and activation", async () => {
  const { compiled, version } = await fixture(true);
  m.binding.mockRejectedValueOnce(new Error("DEPENDENCY_BROKEN: field has no tenant generation"));
  await expect(activateCompiledVersionInTransaction(tx, session, uuid(1), 7, version, compiled)).rejects.toThrow("tenant generation");
  expect(m.count).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  await activateCompiledVersionInTransaction(tx, session, uuid(1), 7, version, compiled, uuid(3));
  expect(m.binding).toHaveBeenCalledWith(tx, session, uuid(1), compiled.payload);
  expect(m.update.mock.calls[0][0].where.activeVersionId).toBe(uuid(3));
});
it("disabled source and lost definition revision or active pointer fail before activation Audit", async () => {
  const { compiled, version } = await fixture();
  m.count.mockResolvedValueOnce(0);
  await expect(activateCompiledVersionInTransaction(tx, session, uuid(1), 7, version, compiled)).rejects.toThrow("source module unavailable");
  expect(m.update).not.toHaveBeenCalled();
  await expect(activateCompiledVersionInTransaction(tx, session, uuid(1), 6, version, compiled)).rejects.toThrow("CONFLICT");
  await expect(activateCompiledVersionInTransaction(tx, session, uuid(1), 7, version, compiled, uuid(99))).rejects.toThrow("CONFLICT");
  expect(current).toEqual({ activeVersionId: uuid(3), revision: 7 }); expect(m.audit).not.toHaveBeenCalled();
});
it("activation Audit errors propagate to the owning transaction rather than claiming successful activation", async () => {
  const { compiled, version } = await fixture(), before = structuredClone(current);
  m.audit.mockRejectedValue(new Error("Audit unavailable"));
  const transaction = async () => {
    try { return await activateCompiledVersionInTransaction(tx, session, uuid(1), 7, version, compiled); }
    catch (error) { current = before; throw error; }
  };
  await expect(transaction()).rejects.toThrow("Audit unavailable"); expect(m.update).toHaveBeenCalledOnce(); expect(m.audit).toHaveBeenCalledOnce(); expect(current).toEqual(before);
});
