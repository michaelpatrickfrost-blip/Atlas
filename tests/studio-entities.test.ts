import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { entity, query } from "@/core/studio/registry/contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import type { EntityDescriptor, RecordContext } from "@/core/studio/registry/types";
const session: Session = { userId: "actor", userName: "Actor", userEmail: "a@example.test", organisationId: "tenant-a", organisationName: "A", membershipId: "m", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const descriptor = (authorise: NonNullable<EntityDescriptor["record"]>["authorise"]): EntityDescriptor => ({
  id: "tickets.ticket", version: 1, label: "Ticket", capability: "tickets.ticket.read", lifecycle: "active", classification: "confidential", kind: "entity", key: "string",
  fields: [{ id: "number", label: "Number", type: "string", nullable: false, classification: "confidential", filterable: true, sortable: false, decision: false, template: false }],
  extensionPolicy: { customFields: true, recordTypes: true, pageVariants: true },
  record: { writeCapability: "tickets.ticket.manage", detailRoute: "/tickets/{recordId}", labelField: "number", listQuery: { id: "tickets.ticket.list", version: 1 }, getQuery: { id: "tickets.ticket.get", version: 1 }, authorise },
});
const goodOwner = async (ctx: RecordContext, input: { recordId: string }) => ({ recordId: input.recordId, organisationId: ctx.session.organisationId, revision: 4 });
function setup(d = descriptor(goodOwner), available = true) {
  const registry = new CapabilityRegistry(async () => available);
  const reads = ["list", "get"].map(operation => query({ id: `tickets.ticket.${operation}`, version: 1, label: operation, capability: "tickets.ticket.read", lifecycle: "active", classification: "confidential", kind: "query", input: z.strictObject({}), output: z.null(), pagination: "none", maxCardinality: 1, costClass: "low", execute: async () => null }));
  registry.register("tickets", { contributions: [entity(d), ...reads] });
  return { registry, reference: registry.describe("tickets.ticket", 1) };
}
const transaction = {} as Prisma.TransactionClient;
describe("Studio owner record contracts", () => {
  it("validates reference read versions atomically without changing old absent metadata/hash or granting invocation", () => {
    const source = descriptor(goodOwner); source.record!.fieldPolicy = { types: ["string"], reservedKeys: ["id"], referenceEntities: [], maxFields: 10 };
    const old = setup(source).reference;
    const upgraded: EntityDescriptor = { ...source, version: 2, record: { ...source.record!, fieldPolicy: { ...source.record!.fieldPolicy!, types: ["string", "reference"], referenceEntities: [source.id] },
      migrationSnapshot: { query: { id: "tickets.ticket.snapshot", version: 1 }, sourceVersions: [2], referenceVersions: [1, 2] } } };
    const reads = ["list", "get"].map(operation => query({ id: `tickets.ticket.${operation}`, version: 1, label: operation, capability: "tickets.ticket.read", lifecycle: "active", classification: "confidential", kind: "query", input: z.strictObject({}), output: z.null(), pagination: "none", maxCardinality: 1, costClass: "low", execute: async () => null }));
    const snapshot = query({ id: "tickets.ticket.snapshot", version: 1, label: "Snapshot", capability: "tickets.ticket.manage", lifecycle: "active", classification: "confidential", kind: "query", input: z.strictObject({}), output: z.null(), pagination: "none", maxCardinality: 1, costClass: "low", transaction: "required", execute: async () => null });
    const register = (candidate: EntityDescriptor) => { const registry = new CapabilityRegistry(async () => true); registry.register("tickets", { contributions: [entity(source), entity(candidate), ...reads, snapshot] }); return registry; };
    const badVersion = { ...upgraded, record: { ...upgraded.record!, migrationSnapshot: { ...upgraded.record!.migrationSnapshot!, referenceVersions: [99] } } };
    expect(() => register(badVersion)).toThrow("registered native read versions");
    const badType = { ...upgraded, record: { ...upgraded.record!, fieldPolicy: { ...upgraded.record!.fieldPolicy!, types: ["string"] as const } } };
    expect(() => register(badType)).toThrow("reference field policy");
    const badEntity = { ...upgraded, record: { ...upgraded.record!, fieldPolicy: { ...upgraded.record!.fieldPolicy!, referenceEntities: [] } } };
    expect(() => register(badEntity)).toThrow("canonical entity");
    const duplicate = { ...upgraded, record: { ...upgraded.record!, migrationSnapshot: { ...upgraded.record!.migrationSnapshot!, referenceVersions: [1, 1] } } };
    expect(() => register(duplicate)).toThrow("Duplicate migration reference");
    const registry = register(upgraded);
    expect(registry.describe(source.id, 1)).toEqual(old); expect(entityDetailsSchema.parse(old.details).record?.migrationSnapshot).toBeUndefined();
    expect(entityDetailsSchema.parse(registry.describe(source.id, 2).details).record?.migrationSnapshot?.referenceVersions).toEqual([1, 2]);
  });
  it("validates migration opt-ins atomically against owner capability, shared transaction and supported field versions", () => {
    const source = descriptor(goodOwner);
    source.record!.fieldPolicy = { types: ["string"], reservedKeys: ["id"], referenceEntities: [], maxFields: 10 };
    const upgraded = { ...source, version: 2, record: { ...source.record!, migrationSnapshot: { query: { id: "tickets.ticket.snapshot", version: 1 }, sourceVersions: [1, 2] } } };
    const projections = ["list", "get"].map(operation => query({ id: `tickets.ticket.${operation}`, version: 1, label: operation, capability: "tickets.ticket.read", lifecycle: "active", classification: "confidential", kind: "query", input: z.strictObject({}), output: z.null(), pagination: "none", maxCardinality: 1, costClass: "low", execute: async () => null }));
    const ownerQuery = (capability = "tickets.ticket.manage", required = true) => query({ id: "tickets.ticket.snapshot", version: 1, label: "Snapshot", capability, lifecycle: "active", classification: "confidential", kind: "query", input: z.strictObject({}), output: z.null(), pagination: "none", maxCardinality: 1, costClass: "low", ...(required ? { transaction: "required" as const } : {}), execute: async () => null });
    for (const invalid of [ownerQuery("tickets.ticket.read"), ownerQuery(undefined, false)]) {
      const registry = new CapabilityRegistry(async () => true);
      expect(() => registry.register("tickets", { contributions: [entity(source), entity(upgraded), ...projections, invalid] })).toThrow("transactional owner query");
      expect(() => registry.describe(source.id, 1)).toThrow("missing Studio contract");
    }
    const unsupported = { ...upgraded, record: { ...upgraded.record, migrationSnapshot: { ...upgraded.record.migrationSnapshot, sourceVersions: [3] } } };
    expect(() => new CapabilityRegistry(async () => true).register("tickets", { contributions: [entity(source), entity(unsupported), ...projections, ownerQuery()] })).toThrow("source entity versions");
    const duplicate = { ...upgraded, record: { ...upgraded.record, migrationSnapshot: { ...upgraded.record.migrationSnapshot, sourceVersions: [1, 1] } } };
    expect(() => entity(duplicate)).toThrow("Duplicate migration source");
    const registry = new CapabilityRegistry(async () => true);
    registry.register("tickets", { contributions: [entity(source), entity(upgraded), ...projections, ownerQuery()] });
    expect(registry.describe(source.id, 2).details.record).toHaveProperty("migrationSnapshot");
  });
  it("requires owner opt-in, unique native IDs and registered read projections", () => {
    const noOwner = descriptor(goodOwner); delete noOwner.record;
    expect(() => entity(noOwner)).toThrow("owner record policy");
    const duplicate = descriptor(goodOwner); duplicate.fields = [...duplicate.fields, ...duplicate.fields];
    expect(() => entity(duplicate)).toThrow("Duplicate native field");
    expect(() => new CapabilityRegistry(async () => true).register("tickets", { contributions: [entity(descriptor(goodOwner))] })).toThrow("registered owner queries");
    const forged = entity(descriptor(goodOwner)); delete forged.authoriseRecord;
    expect(() => new CapabilityRegistry(async () => true).register("tickets", { contributions: [forged] })).toThrow("owner record authorisation");
  });
  it("pins write policy and owner routes into compatibility hashes; display rename is safe", () => {
    const first = setup();
    const policy = descriptor(goodOwner); policy.record!.writeCapability = "tickets.ticket.update";
    expect(setup(policy).registry.checkCompatibility([first.reference])).toHaveLength(1);
    const rename = descriptor(goodOwner); rename.label = "Internal ticket";
    expect(setup(rename).registry.checkCompatibility([first.reference])).toEqual([]);
    expect(Object.isFrozen(first.reference.details.record)).toBe(true);
  });
  it("returns only an owner-checked canonical anchor and rejects client scope and native patches", async () => {
    const { registry, reference } = setup();
    expect(await registry.authoriseRecord({ session }, reference, { recordId: "ticket", intent: "read" })).toEqual({ recordId: "ticket", organisationId: "tenant-a", revision: 4 });
    await expect(registry.authoriseRecord({ session }, reference, { recordId: "ticket", intent: "read", organisationId: "tenant-b" })).rejects.toThrow();
    await expect(registry.authoriseRecord({ session, transaction }, reference, { recordId: "ticket", intent: "extend", expectedRevision: 4, status: "CLOSED" })).rejects.toThrow();
    await expect(registry.invoke(session, reference, {})).rejects.toThrow("descriptive");
  });
  it("requires native write permission, transaction and matching positive owner revision before extensions", async () => {
    const authorise = vi.fn(goodOwner), { registry, reference } = setup(descriptor(authorise));
    const input = { recordId: "ticket", intent: "extend", expectedRevision: 4 };
    await expect(registry.authoriseRecord({ session }, reference, input)).rejects.toThrow("atomic transaction");
    await expect(registry.authoriseRecord({ session: { ...session, capabilities: new Set(["tickets.ticket.read", "studio.definition.edit"]) }, transaction }, reference, input)).rejects.toThrow("tickets.ticket.manage");
    await expect(registry.authoriseRecord({ session, transaction }, reference, { ...input, expectedRevision: undefined })).rejects.toThrow("expected owner revision");
    expect(authorise).not.toHaveBeenCalled();
    await expect(registry.authoriseRecord({ session, transaction }, reference, { ...input, expectedRevision: 3 })).rejects.toThrow("record changed");
    expect(await registry.authoriseRecord({ session, transaction }, reference, input)).toEqual({ recordId: "ticket", organisationId: "tenant-a", revision: 4 });
  });
  it("rejects disabled modules, missing read rights and incorrectly scoped owner output", async () => {
    const disabled = setup(undefined, false);
    await expect(disabled.registry.authoriseRecord({ session }, disabled.reference, { recordId: "ticket", intent: "read" })).rejects.toThrow("unavailable");
    const { registry, reference } = setup();
    await expect(registry.authoriseRecord({ session: { ...session, capabilities: new Set() } }, reference, { recordId: "ticket", intent: "read" })).rejects.toThrow("FORBIDDEN");
    for (const bad of [{ recordId: "ticket", organisationId: "tenant-b", revision: 4 }, { recordId: "other", organisationId: "tenant-a", revision: 4 }, { recordId: "ticket", organisationId: "tenant-a", revision: 0 }]) {
      const test = setup(descriptor(async () => bad));
      await expect(test.registry.authoriseRecord({ session }, test.reference, { recordId: "ticket", intent: "read" })).rejects.toThrow();
    }
  });
});
