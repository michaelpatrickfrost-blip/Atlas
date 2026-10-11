import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member } } }));
import { sessionAuthorityStamp, sessionForUser, type Session } from "@/core/auth/session";
import { checksum, entity, query } from "@/core/studio/registry/contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { nativeValidationPolicySchema, nativeValidationRequestSchema } from "@/core/studio/registry/entities";
import type { Context, Contribution, NativeValidationRequest, QueryDescriptor, RecordAnchor, RecordContext } from "@/core/studio/registry/types";

// Real contract factories, registry and opaque authenticated Sessions. The explicit
// owner collaborator below represents a live same-tx mutation receipt; it performs
// no SQL and does NOT prove actual domain receipts, atomicity or concurrency.
const operation = "example.work.reply", otherOperation = "example.work.watch";
const entityId = "example.work", queryId = "example.work.native_validation_reply";
const request: NativeValidationRequest = { recordId: "work", expectedRevision: 4 };
const tx = {} as Prisma.TransactionClient;
const input = nativeValidationRequestSchema;
const output = z.strictObject({ recordId: z.string(), organisationId: z.string(), revision: z.number().int().positive(), facts: z.strictObject({ status: z.enum(["OPEN", "CLOSED"]) }) });
const base = { label: "Work", lifecycle: "active" as const, classification: "confidential" as const };
const membership = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: [operation, otherOperation], deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
beforeEach(() => { vi.resetAllMocks(); m.member.mockImplementation(async () => structuredClone(membership())); });
async function actor(grants = [operation, otherOperation]) {
  m.member.mockResolvedValueOnce({ ...membership(), grantedCapabilities: grants });
  const session = await sessionForUser("company", "actor");
  if (!session) throw new Error("Missing authenticated fixture.");
  return session;
}
function sources(): Contribution[] {
  const readCapability = "example.work.read";
  const projections = ["list", "get"].map(suffix => query({ ...base, id: `${entityId}.${suffix}`, version: 1, capability: readCapability,
    kind: "query", input: z.strictObject({}), output: z.string(), pagination: "none", maxCardinality: 1, costClass: "low", async execute() { return "projection"; } }));
  return [...projections, ...[2, 9].map(version => entity({ ...base, id: entityId, version, capability: readCapability, kind: "entity", key: "string",
    fields: [{ id: "subject", type: "string", nullable: false, classification: "confidential", filterable: false, sortable: false, decision: false, template: false }],
    extensionPolicy: { customFields: true, recordTypes: false, pageVariants: false },
    record: { writeCapability: "example.work.manage", detailRoute: "/work/{recordId}", labelField: "subject",
      listQuery: { id: `${entityId}.list`, version: 1 }, getQuery: { id: `${entityId}.get`, version: 1 },
      fieldPolicy: { types: ["string"], reservedKeys: ["subject"], referenceEntities: [], maxFields: 20 },
      async authorise() { throw new Error("Ordinary record rights must not be borrowed."); } } }))];
}
function setup() {
  const available = vi.fn(async () => true);
  const registry = new CapabilityRegistry(available); registry.register("example", { contributions: sources() });
  return { registry, available, reference: registry.describe(entityId, 2) };
}
function owner(session: Session, anchor: RecordAnchor = { recordId: request.recordId, organisationId: "company", revision: 4 }, scopeOperation = operation) {
  const scopes = new WeakMap<object, { transaction: Prisma.TransactionClient; stamp: ReturnType<typeof sessionAuthorityStamp>; operation: string }>();
  const proof = {}; scopes.set(proof, { transaction: tx, stamp: sessionAuthorityStamp(session), operation: scopeOperation });
  const authorise = vi.fn(async (ctx: RecordContext, req: NativeValidationRequest, token: object): Promise<RecordAnchor> => {
    const scope = scopes.get(token), stamp = sessionAuthorityStamp(ctx.session);
    if (!scope || scope.transaction !== ctx.transaction || scope.stamp !== stamp || scope.operation !== scopeOperation
      || req.recordId !== request.recordId || req.expectedRevision !== request.expectedRevision) throw new Error("Invalid live owning proof.");
    return { recordId: anchor.recordId, organisationId: anchor.organisationId, revision: anchor.revision };
  });
  const facts = vi.fn(async () => ({ ...anchor, facts: { status: "OPEN" as const } }));
  function contribution(overrides: Partial<QueryDescriptor<NativeValidationRequest, z.infer<typeof output>>> = {}) {
    return query({ ...base, id: queryId, version: 1, capability: operation, kind: "query", input, output, pagination: "none", maxCardinality: 1, costClass: "low",
      transaction: "required", nativeValidation: { entityId, operation, fieldVersions: [2, 9], authorise },
      async execute(ctx, req) {
        if (!ctx.nativeValidationProof) throw new Error("Missing owning native proof.");
        await authorise(ctx, req, ctx.nativeValidationProof);
        return facts();
      }, ...overrides });
  }
  return { proof, authorise, facts, contribution, revoke: () => scopes.delete(proof) };
}
function withPolicy(registry: CapabilityRegistry, contribution: Contribution) { registry.register("example", { contributions: [contribution] }); }

describe("explicit owning native-validation registry bridge", () => {
  it("authorises metadata without facts, then invokes only typed facts for the exact narrow operation", async () => {
    const session = await actor(), o = owner(session), { registry, reference } = setup(); withPolicy(registry, o.contribution());
    const saved = registry.describe(queryId, 1);
    expect(saved.details.nativeValidation).toEqual({ entityId, operation, fieldVersions: [2, 9] });
    expect(Object.isFrozen(saved.details.nativeValidation)).toBe(true);
    const result = await registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, reference, request, operation, o.proof);
    expect(result).toEqual({ source: reference, query: saved, anchor: { recordId: "work", organisationId: "company", revision: 4 } });
    expect(o.facts).not.toHaveBeenCalled();
    expect(await registry.invokeNativeValidationFacts({ session, transaction: tx }, reference, request, operation, o.proof))
      .toEqual({ recordId: "work", organisationId: "company", revision: 4, facts: { status: "OPEN" } });
    expect(o.authorise.mock.invocationCallOrder[1]).toBeLessThan(o.facts.mock.invocationCallOrder[0]);
    for (const grant of ["example.work.read", "example.work.manage", "example.field.read", "example.field.write"]) expect(session.capabilities.has(grant)).toBe(false);
  });
  it("allows the exact cross-module owning capability without borrowing entity read or manage", async () => {
    const caseAssign = "service.case.assign", session = await actor([caseAssign]);
    const o = owner(session, { recordId: "work", organisationId: "company", revision: 4 }, caseAssign), { registry, reference } = setup();
    withPolicy(registry, o.contribution({ id: "example.work.native_validation_case_merge", capability: caseAssign,
      nativeValidation: { entityId, operation: caseAssign, fieldVersions: [2, 9], authorise: o.authorise } }));
    expect(await registry.invokeNativeValidationFacts({ session, transaction: tx }, reference, request, caseAssign, o.proof))
      .toMatchObject({ recordId: "work", revision: 4 });
    expect(session.capabilities.has("example.work.read")).toBe(false); expect(session.capabilities.has("example.work.manage")).toBe(false);
    await expect(registry.invokeNativeValidationFacts({ session, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow("current owner");
    expect(o.facts).toHaveBeenCalledTimes(1);
  });
  it("requires callback iff opted-in and rejects invalid policies atomically", async () => {
    const session = await actor(), o = owner(session);
    const invalid = [
      (c: Contribution) => { delete c.authoriseNativeValidationProof; },
      (c: Contribution) => { delete (c.metadata.details as Record<string, unknown>).nativeValidation; },
      (c: Contribution) => { c.metadata.kind = "command"; },
      (c: Contribution) => { delete (c.metadata.details as Record<string, unknown>).transaction; },
      (c: Contribution) => { c.metadata.capability = otherOperation; },
      (c: Contribution) => { (c.metadata.details as Record<string, unknown>).nativeValidation = { entityId, operation, fieldVersions: [1] }; },
      (c: Contribution) => { (c.metadata.details as Record<string, unknown>).nativeValidation = { entityId: "foreign.work", operation, fieldVersions: [2] }; },
      (c: Contribution) => { (c.metadata.details as Record<string, unknown>).nativeValidation = { entityId, operation, fieldVersions: [2, 2] }; },
      (c: Contribution) => { (c.metadata.details as Record<string, unknown>).nativeValidation = { entityId, operation, fieldVersions: ["2"] }; },
      (c: Contribution) => { (c.metadata.details as Record<string, unknown>).nativeValidation = { entityId, operation, fieldVersions: [2], extra: true }; },
    ];
    for (const corrupt of invalid) {
      const c = o.contribution(); corrupt(c); const registry = new CapabilityRegistry(async () => true);
      expect(() => registry.register("example", { contributions: [...sources(), c] })).toThrow();
      expect(() => registry.describe(entityId, 2)).toThrow("missing");
    }
  });
  it("validates closed factory metadata and callback request/output, without granting an untyped source", async () => {
    const session = await actor(), o = owner(session);
    expect(() => o.contribution({ nativeValidation: { entityId, operation, fieldVersions: [2], authorise: o.authorise, extra: true } as QueryDescriptor<NativeValidationRequest, z.infer<typeof output>>["nativeValidation"] })).toThrow();
    expect(() => o.contribution({ nativeValidation: { entityId, operation, fieldVersions: [2], authorise: undefined } as unknown as QueryDescriptor<NativeValidationRequest, z.infer<typeof output>>["nativeValidation"] })).toThrow("callback");
    const c = o.contribution();
    await expect(c.authoriseNativeValidationProof!({ session, transaction: tx }, { ...request, organisationId: "foreign" } as NativeValidationRequest, o.proof)).rejects.toThrow();
    expect(o.authorise).not.toHaveBeenCalled();
    const untyped = sources(); const e = untyped.find(c => c.metadata.kind === "entity")!;
    delete ((e.metadata.details.record as Record<string, unknown>).fieldPolicy); e.metadata.schemaHash = checksum(e.metadata.details);
    const registry = new CapabilityRegistry(async () => true);
    expect(() => registry.register("example", { contributions: [...untyped, o.contribution()] })).toThrow("typed-field");
  });
  it("rejects a foreign registered entity and duplicate or reassigned stable policy identities", async () => {
    const session = await actor(), o = owner(session), { registry } = setup(); withPolicy(registry, o.contribution());
    expect(() => withPolicy(registry, o.contribution({ id: "example.work.other_native_reply" }))).toThrow("stable");
    expect(() => withPolicy(registry, o.contribution({ version: 2, capability: otherOperation,
      nativeValidation: { entityId, operation: otherOperation, fieldVersions: [2], authorise: o.authorise } }))).toThrow("stable");
    const foreign = sources().map(c => { c.metadata.id = c.metadata.id.replaceAll("example", "foreign"); c.metadata.capability = c.metadata.capability.replaceAll("example", "foreign");
      if (c.metadata.kind === "entity") { const record = c.metadata.details.record as Record<string, unknown>; record.writeCapability = "foreign.work.manage";
        record.listQuery = { id: "foreign.work.list", version: 1 }; record.getQuery = { id: "foreign.work.get", version: 1 }; c.metadata.schemaHash = checksum(c.metadata.details); } return c; });
    registry.register("foreign", { contributions: foreign });
    expect(() => withPolicy(registry, o.contribution({ id: "example.work.foreign_validation", nativeValidation: { entityId: "foreign.work", operation, fieldVersions: [2], authorise: o.authorise } }))).toThrow("same owner");
  });
  it("uses the latest query version only, including discontinued policy and unsupported field ranges", async () => {
    const session = await actor(), o = owner(session), { registry, reference } = setup(); withPolicy(registry, o.contribution());
    withPolicy(registry, o.contribution({ version: 2, nativeValidation: { entityId, operation, fieldVersions: [9], authorise: o.authorise } }));
    await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow("current owner");
    expect(o.authorise).not.toHaveBeenCalled();
    expect((await registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, registry.describe(entityId, 9), request, operation, o.proof)).query.version).toBe(2);
    withPolicy(registry, o.contribution({ version: 3, nativeValidation: undefined }));
    await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, registry.describe(entityId, 9), request, operation, o.proof)).rejects.toThrow("current owner");
    expect(o.authorise).toHaveBeenCalledTimes(1); expect(o.facts).not.toHaveBeenCalled();
  });
  it("rejects expired latest query rather than falling back to supported older versions", async () => {
    const session = await actor(), o = owner(session), { registry, reference } = setup(); withPolicy(registry, o.contribution());
    withPolicy(registry, o.contribution({ version: 2, lifecycle: "deprecated", supportedUntil: "2000-01-01T00:00:00Z" }));
    await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow("expired");
    expect(o.authorise).not.toHaveBeenCalled(); expect(o.facts).not.toHaveBeenCalled();
  });
  it("requires genuine principal identity, server transaction and an explicit proof before owner or metadata access", async () => {
    const session = await actor(), o = owner(session), { registry, reference, available } = setup(); withPolicy(registry, o.contribution());
    const describe = vi.spyOn(registry, "describe");
    for (const context of [{ session: { ...session }, transaction: tx }, { session }])
      await expect(registry.resolveNativeValidationFieldPolicy(context, reference, request, operation, o.proof)).rejects.toThrow("genuine");
    await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, reference, request, operation, undefined as unknown as object)).rejects.toThrow("genuine");
    session.organisationId = "foreign";
    await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow("genuine");
    expect(describe).not.toHaveBeenCalled(); expect(available).not.toHaveBeenCalled(); expect(o.authorise).not.toHaveBeenCalled(); expect(o.facts).not.toHaveBeenCalled();
  });
  it("rejects malformed request, stale hashes, wrong source and unapproved operation before the owner callback", async () => {
    const session = await actor(), o = owner(session), { registry, reference } = setup(); withPolicy(registry, o.contribution());
    for (const req of [{ ...request, expectedRevision: "4" }, { ...request, expectedRevision: 0 }, { ...request, organisationId: "foreign" }, { recordId: "work" }])
      await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, reference, req as NativeValidationRequest, operation, o.proof)).rejects.toThrow();
    for (const source of [{ ...reference, schemaHash: "0".repeat(64) }, { ...reference, contractHash: "0".repeat(64) }, registry.describe(`${entityId}.get`, 1)])
      await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, source, request, operation, o.proof)).rejects.toThrow("source changed");
    await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, reference, request, otherOperation, o.proof)).rejects.toThrow("current owner");
    expect(o.authorise).not.toHaveBeenCalled(); expect(o.facts).not.toHaveBeenCalled();
  });
  it("enforces the actual current operation capability and module before proof/facts", async () => {
    const session = await actor(["example.work.read", "example.work.manage"]), o = owner(session), { registry, reference, available } = setup(); withPolicy(registry, o.contribution());
    await expect(registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow("FORBIDDEN");
    const permitted = await actor(), proof = owner(permitted); available.mockResolvedValue(false);
    await expect(registry.resolveNativeValidationFieldPolicy({ session: permitted, transaction: tx }, reference, request, operation, proof.proof)).rejects.toThrow("unavailable");
    expect(o.authorise).not.toHaveBeenCalled(); expect(proof.authorise).not.toHaveBeenCalled(); expect(o.facts).not.toHaveBeenCalled();
  });
  it("rejects forged, expired, foreign-transaction and different-current-session proofs without facts", async () => {
    const session = await actor(), o = owner(session), { registry, reference } = setup(); withPolicy(registry, o.contribution());
    await expect(registry.invokeNativeValidationFacts({ session, transaction: tx }, reference, request, operation, {})).rejects.toThrow("owning proof");
    await expect(registry.invokeNativeValidationFacts({ session, transaction: {} as Prisma.TransactionClient }, reference, request, operation, o.proof)).rejects.toThrow("owning proof");
    for (const req of [{ ...request, recordId: "other" }, { ...request, expectedRevision: 5 }])
      await expect(registry.invokeNativeValidationFacts({ session, transaction: tx }, reference, req, operation, o.proof)).rejects.toThrow("owning proof");
    const refreshed = await actor();
    await expect(registry.invokeNativeValidationFacts({ session: refreshed, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow("owning proof");
    o.revoke(); await expect(registry.invokeNativeValidationFacts({ session, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow("owning proof");
    expect(o.facts).not.toHaveBeenCalled();
  });
  it("rejects owner scope mismatch or malformed anchor before business facts", async () => {
    const session = await actor();
    for (const anchor of [{ recordId: "other", organisationId: "company", revision: 4 }, { recordId: "work", organisationId: "foreign", revision: 4 }, { recordId: "work", organisationId: "company", revision: 5 }, { recordId: "work", organisationId: "company", revision: 0 }]) {
      const o = owner(session, anchor), { registry, reference } = setup(); withPolicy(registry, o.contribution());
      await expect(registry.invokeNativeValidationFacts({ session, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow();
      expect(o.facts).not.toHaveBeenCalled();
    }
  });
  it("strips mutation and creation proofs from generic contexts and rejects JSON proof injection", async () => {
    const session = await actor(), o = owner(session), { registry } = setup(); withPolicy(registry, o.contribution());
    const queryRef = registry.describe(queryId, 1);
    await expect(registry.invoke(session, queryRef, request)).rejects.toThrow("transaction");
    const context: Context = { session, transaction: tx, nativeValidationProof: o.proof, initialisationProof: o.proof };
    await expect(registry.invokeQueryInTransaction(context, queryRef, request)).rejects.toThrow("Missing owning native proof");
    await expect(registry.invokeNativeValidationFacts(context, registry.describe(entityId, 2), { ...request, nativeValidationProof: o.proof } as NativeValidationRequest, operation, o.proof)).rejects.toThrow();
    expect(o.authorise).not.toHaveBeenCalled(); expect(o.facts).not.toHaveBeenCalled();
  });
  it("keeps existing entity descriptors/hashes unchanged and validates actual typed query output", async () => {
    const session = await actor(), o = owner(session), { registry, reference } = setup();
    const before = JSON.stringify(reference); withPolicy(registry, o.contribution()); expect(JSON.stringify(registry.describe(entityId, 2))).toBe(before);
    expect(registry.checkCompatibility([reference])).toEqual([]);
    o.facts.mockResolvedValue({ recordId: "work", organisationId: "company", revision: 4, facts: { status: "INVALID" } } as unknown as Awaited<ReturnType<typeof o.facts>>);
    await expect(registry.invokeNativeValidationFacts({ session, transaction: tx }, reference, request, operation, o.proof)).rejects.toThrow();
    expect(nativeValidationPolicySchema.safeParse({ entityId, operation, fieldVersions: [2], authorise: {} }).success).toBe(false);
  });
});
