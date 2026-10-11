import { expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
vi.mock("@/core/db/client", () => ({ db: {} }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { checksum } from "@/core/studio/registry/contracts";
import { entityDetailsSchema, fieldMigrationQueryPolicySchema, fieldSettlementPolicySchema,
  supportsFieldMigrationIntent, supportsFieldMigrationQueryIntent } from "@/core/studio/registry/entities";
import type { Contribution } from "@/core/studio/registry/types";

const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member",
  organisationId: "company", organisationName: "Company", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const entity = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket" && c.metadata.version === 8)!;
const snapshot = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket.field_migration" && c.metadata.version === 3)!;
const representation = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket.field_representation")!;
const settlement = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket.field_settlement")!;
function registry() { const r = new CapabilityRegistry(async () => true); r.register("tickets", ticketStudioContract); return r; }
function owner(snapshotVersions: (1 | 2)[] = [2], representationVersions: (1 | 2)[] = [2]): Contribution {
  const details = entityDetailsSchema.parse(entity.metadata.details), record = details.record!;
  const changed = { ...details, record: { ...record,
    migrationSnapshot: { ...record.migrationSnapshot!, query: { id: snapshot.metadata.id, version: 5 }, intentVersions: snapshotVersions },
    migrationRepresentation: { ...record.migrationRepresentation!, query: { id: representation.metadata.id, version: 3 }, intentVersions: representationVersions } } };
  return { ...entity, metadata: { ...entity.metadata, version: 10, details: changed, schemaHash: checksum(changed) } };
}
function callback(base: Contribution, purpose: "snapshot" | "representation", intentVersions: (1 | 2)[] = [2]): Contribution {
  // Test-only callbacks never invoke the legacy implementation with a new intent.
  return { metadata: { ...base.metadata, version: base === snapshot ? 5 : 3,
    details: { ...base.metadata.details, fieldMigration: { entityId: "tickets.ticket", purpose, intentVersions } } }, run: vi.fn() };
}
it("omission preserves exact legacy-only meaning and existing Tickets contract hashes", () => {
  const r = registry();
  expect(r.describe("tickets.ticket", 7).contractHash).toBe("5f69287becebbd7658245afc78b1a1eabf30b297e0613d5a07db7b9ecf9655d8");
  for (let version = 3; version <= 8; version++) {
    const details = entityDetailsSchema.parse(r.describe("tickets.ticket", version).details);
    expect(details.record!.migrationSnapshot).not.toHaveProperty("intentVersions");
    expect(supportsFieldMigrationIntent(details.record!.migrationSnapshot, 1)).toBe(true);
    expect(supportsFieldMigrationIntent(details.record!.migrationSnapshot, 2)).toBe(false);
  }
  for (const contribution of [snapshot, representation, settlement]) {
    const m = r.describe(contribution.metadata.id, contribution.metadata.version);
    expect(m.details).not.toHaveProperty("fieldMigration");
    expect(supportsFieldMigrationQueryIntent(m, "tickets.ticket", contribution === snapshot ? "snapshot" : "representation", 2)).toBe(false);
  }
  expect(supportsFieldMigrationIntent(undefined, 1)).toBe(false);
  expect(supportsFieldMigrationIntent({}, 3 as 1)).toBe(false);
});
it("requires ordered nonempty closed protocol versions and snapshot support for representations", () => {
  for (const intentVersions of [[], [1, 1], [2, 1], [3], ["2"], [1, 2, 2]]) {
    expect(() => fieldMigrationQueryPolicySchema.parse({ entityId: "tickets.ticket", purpose: "snapshot", intentVersions })).toThrow();
    expect(() => fieldSettlementPolicySchema.parse({ entityId: "tickets.ticket", sourceVersions: [2], targetVersions: [5], referenceVersions: [], intentVersions })).toThrow();
  }
  expect(() => entityDetailsSchema.parse(owner([2], [1]).metadata.details)).toThrow("snapshot-supported intent");
});
it("an entity cannot reinterpret old callbacks as conditional migration support; registration fails atomically", () => {
  const r = registry(), before = r.describe("tickets.ticket", 8);
  const candidate = owner();
  const details = entityDetailsSchema.parse(candidate.metadata.details);
  details.record!.migrationSnapshot!.query = { id: snapshot.metadata.id, version: 3 };
  candidate.metadata = { ...candidate.metadata, details, schemaHash: checksum(details) };
  expect(() => r.register("tickets", { contributions: [candidate, callback(representation, "representation")] })).toThrow("protocol approval");
  expect(() => r.describe("tickets.ticket", 10)).toThrow("missing");
  expect(() => r.describe(representation.metadata.id, 3)).toThrow("missing");
  expect(r.describe("tickets.ticket", 8)).toEqual(before);
});
it("pins entity and actual callback approvals independently without changing old source ranges or granting native writes", async () => {
  const r = registry(), old = r.describe("tickets.ticket", 8), oldQuery = r.describe(snapshot.metadata.id, 3);
  r.register("tickets", { contributions: [owner(), callback(snapshot, "snapshot"), callback(representation, "representation")] });
  const latest = r.describe("tickets.ticket", 10), details = entityDetailsSchema.parse(latest.details);
  expect(latest.contractHash).not.toBe(old.contractHash);
  expect(details.record!.migrationSnapshot!.sourceVersions).toEqual([2, 3, 4, 5]);
  expect(supportsFieldMigrationIntent(details.record!.migrationSnapshot, 1)).toBe(false);
  expect(supportsFieldMigrationIntent(details.record!.migrationSnapshot, 2)).toBe(true);
  expect(supportsFieldMigrationQueryIntent(r.describe(snapshot.metadata.id, 5), latest.id, "snapshot", 2)).toBe(true);
  expect(r.describe("tickets.ticket", 8)).toEqual(old); expect(r.describe(snapshot.metadata.id, 3)).toEqual(oldQuery);
  await expect(r.invoke(session, r.describe(snapshot.metadata.id, 5), {})).rejects.toThrow("shared server transaction");
});
it("rejects mismatched callback purpose, canonical owner, permission, transaction and protocol atomically", () => {
  const base = callback(snapshot, "snapshot");
  for (const bad of [callback(snapshot, "representation"), callback(snapshot, "snapshot", [1]),
    { ...base, metadata: { ...base.metadata, capability: "tickets.ticket.read" } },
    { ...base, metadata: { ...base.metadata, details: { ...base.metadata.details, transaction: undefined } } },
    { ...base, metadata: { ...base.metadata, details: { ...base.metadata.details, fieldMigration: { entityId: "finance.ticket", purpose: "snapshot", intentVersions: [2] } } } }]) {
    const r = registry();
    expect(() => r.register("tickets", { contributions: [owner(), bad, callback(representation, "representation")] })).toThrow();
    expect(() => r.describe("tickets.ticket", 10)).toThrow("missing");
    expect(() => r.describe(snapshot.metadata.id, 5)).toThrow("missing");
  }
});
it("current settlement covers intent formats explicitly and never falls back to an older query", async () => {
  const r = registry(), source = r.describe("tickets.ticket", 2), target = r.describe("tickets.ticket", 5);
  expect((await r.resolveFieldSettlement(session, source, r.describe("tickets.ticket", 9), 2)).version).toBe(2);
  r.register("tickets", { contributions: [{ ...settlement, run: vi.fn(), metadata: { ...settlement.metadata, version: 3,
    details: { ...settlement.metadata.details, fieldSettlement: { ...fieldSettlementPolicySchema.parse(settlement.metadata.details.fieldSettlement), intentVersions: [2] } } } }] });
  await expect(r.resolveFieldSettlement(session, source, target)).rejects.toThrow("current owning-domain coverage");
  expect((await r.resolveFieldSettlement(session, source, target, 2)).version).toBe(3);
  await expect(r.resolveFieldSettlement({ ...session, capabilities: new Set(["tickets.ticket.read"]) }, source, target, 2)).rejects.toThrow("FORBIDDEN");
});
