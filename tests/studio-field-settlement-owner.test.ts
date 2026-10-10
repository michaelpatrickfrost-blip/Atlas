import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ moduleState: { findFirst: vi.fn() }, membership: { findFirst: vi.fn() }, serviceWorkItem: { findFirst: vi.fn(), count: vi.fn() },
  studioFieldMigrationPreparation: { findFirst: vi.fn() }, studioFieldMigrationCutover: { findFirst: vi.fn() }, $queryRaw: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: m }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { retainedCutoverFixture, settleCutoverFixture } from "./fixtures/studio-field-cutover";

let f: Awaited<ReturnType<typeof retainedCutoverFixture>>, changed: boolean;
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture(); changed = false;
  m.moduleState.findFirst.mockResolvedValue({ id: "enabled" }); m.membership.findFirst.mockResolvedValue({ id: "current-member" });
  m.serviceWorkItem.findFirst.mockResolvedValue(null); m.serviceWorkItem.count.mockResolvedValue(2);
  m.studioFieldMigrationPreparation.findFirst.mockImplementation(async () => f.preparation);
  m.studioFieldMigrationCutover.findFirst.mockImplementation(async () => f.receipt);
  m.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
    const sql = strings.join("?"); return sql.includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : sql.includes("AS changed") ? [{ changed }] : [];
  });
});
const currentActor = () => ({ ...f.session, userId: "current-actor", membershipId: "current-member" });
const query = (mode: "rollback" | "history") => f.registry.invokeQueryInTransaction({ session: currentActor(), transaction: m as unknown as Prisma.TransactionClient },
  f.registry.describe("tickets.ticket.field_settlement", 1), { preparationId: f.intent.id, mode });
it("resolves registered current owner settlement without changing sealed older descriptors", async () => {
  const policy = await f.registry.resolveFieldSettlement(currentActor(), f.intent.source.payload.entity, f.intent.target.payload.entity);
  expect(policy.id).toBe("tickets.ticket.field_settlement"); expect(policy.details.transaction).toBe("required");
  await expect(f.registry.resolveFieldSettlement(currentActor(), f.intent.source.payload.entity, f.intent.source.payload.entity)).rejects.toThrow("current owning-domain coverage");
  await expect(f.registry.resolveFieldSettlement({ ...currentActor(), capabilities: new Set(["tickets.ticket.read"]) }, f.intent.source.payload.entity, f.intent.target.payload.entity)).rejects.toThrow("FORBIDDEN");
});
it("requires owner transactional registration and rejects foreign/unsupported declared entity versions atomically", () => {
  const bad = ticketStudioContract.contributions.map(item => item.metadata.id === "tickets.ticket.field_settlement" ? { ...item, metadata: { ...item.metadata,
    details: { ...item.metadata.details, fieldSettlement: { entityId: "foreign.ticket", sourceVersions: [2], targetVersions: [5], referenceVersions: [1] } } } } : item);
  const registry = new CapabilityRegistry(async () => true);
  expect(() => registry.register("tickets", { contributions: bad })).toThrow("same owner");
  expect(() => registry.describe("tickets.ticket", 1)).toThrow("missing Studio contract");
});
it("latest unsupported policy does not silently fall back to an old settlement version", async () => {
  const policy = ticketStudioContract.contributions.find(item => item.metadata.id === "tickets.ticket.field_settlement")!;
  f.registry.register("tickets", { contributions: [{ ...policy, metadata: { ...policy.metadata, version: 2,
    details: { ...policy.metadata.details, fieldSettlement: { entityId: "tickets.ticket", sourceVersions: [3], targetVersions: [5], referenceVersions: [1] } } } }] });
  await expect(f.registry.resolveFieldSettlement(currentActor(), f.intent.source.payload.entity, f.intent.target.payload.entity)).rejects.toThrow("current owning-domain coverage");
});
it("uses current actor/private access before history, with exact native revisions required only for rollback", async () => {
  expect(await query("rollback")).toMatchObject({ organisationId: "company", mode: "rollback", nativeCoverageComplete: true });
  expect(m.membership.findFirst.mock.calls[0][0].where).toMatchObject({ userId: "current-actor", id: "current-member", active: true });
  expect(m.$queryRaw.mock.calls.some(([strings]) => strings.join("?").includes('o."nativeRevision" <> w.version'))).toBe(true);
  vi.clearAllMocks(); settleCutoverFixture(f, "FINALIZED");
  expect(await query("history")).toMatchObject({ mode: "history", nativeReferenceCoverageComplete: true });
  expect(m.$queryRaw.mock.calls.some(([strings]) => strings.join("?").includes('o."nativeRevision" <> w.version'))).toBe(false);
  const sql = m.$queryRaw.mock.calls.at(-1)![0].join("?");
  expect(sql).toContain('outcome."targetValueId"=v.id'); expect(sql).toContain('o."valueId"=v.id'); expect(sql).not.toContain("studio_drafts");
  await expect(query("rollback")).rejects.toThrow("current ticket history coverage");
});
it("private/revoked/module access fails before history metadata and malformed client tenant is rejected", async () => {
  m.serviceWorkItem.findFirst.mockResolvedValue({ id: "private" });
  await expect(query("history")).rejects.toThrow("MIGRATION_ACCESS_REQUIRED"); expect(m.studioFieldMigrationPreparation.findFirst).not.toHaveBeenCalled();
  m.serviceWorkItem.findFirst.mockResolvedValue(null); m.membership.findFirst.mockResolvedValue(null);
  await expect(query("history")).rejects.toThrow("current company membership");
  m.moduleState.findFirst.mockResolvedValue(null); await expect(query("history")).rejects.toThrow("Tickets is unavailable");
  await expect(f.registry.invokeQueryInTransaction({ session: currentActor(), transaction: m as unknown as Prisma.TransactionClient },
    f.registry.describe("tickets.ticket.field_settlement", 1), { preparationId: f.intent.id, mode: "history", organisationId: "foreign" })).rejects.toThrow();
});
it("actual missing/foreign references or removed canonical records deny without returning IDs, counts or values", async () => {
  changed = true; await expect(query("history")).rejects.toThrow("current ticket history coverage");
  changed = false; m.studioFieldMigrationCutover.findFirst.mockResolvedValue(null); await expect(query("history")).rejects.toThrow("current ticket history coverage");
});
