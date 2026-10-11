import { beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
const m = vi.hoisted(() => ({ refresh: vi.fn(), principal: vi.fn(), rollback: vi.fn(), raw: vi.fn(), active: vi.fn(), written: vi.fn(), module: vi.fn(), company: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.principal }));
vi.mock("@/core/studio/fields/migrations/inspection", () => ({ inspectRollbackRequiredFieldMigrationReview: m.rollback }));
import type { FieldMigrationAuthority } from "@/core/studio/fields/migrations/authority";
import type { inspectRequiredFieldMigrationSettlementIdentity } from "@/core/studio/fields/migrations/settlement-inspection";
import { validateRequiredFieldMigrationSettlementCoverage } from "@/core/studio/fields/migrations/settlement-coverage";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { query } from "@/core/studio/registry/contracts";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

// Real registered owner/base compiler and sealed conditional metadata. Authority,
// storage and rollback bridge are unit fixtures; no actual SQL, private/native
// evaluation, receipt identity or terminal activation is claimed by this suite.
async function fixture(customFact = false, removal = false) {
  const old = await retainedCutoverFixture(), { session, registry } = old;
  const ref = (id: string, version: number) => { const d = registry.describe(id, version); return { id, version, schemaHash: d.schemaHash, contractHash: d.contractHash }; };
  const entity = ref("tickets.ticket", 9), source = { ...old.source, schemaVersion: 1, createdBy: session.userId };
  const fact = { kind: "field" as const, definitionId: uuid(91), versionId: uuid(92), checksum: "e".repeat(64) };
  const metadata = { ...fact, organisationId: "company", entity, generationId: uuid(93), dependencyClosure: [],
    field: { ...old.source.payload.field, key: "input_field", readCapability: "tickets.field.old_input" } };
  const creator = { ...session, capabilities: new Set([...session.capabilities, "tickets.field.old_input"]) };
  const plain = customFieldPayloadSchema.parse({ ...old.target.payload, entity });
  const conditional = conditionalFieldPayloadSchema.parse({ ...(removal ? { ...old.source.payload, entity } : plain), schemaVersion: 2, requiredIf: { match: "all",
    predicates: [{ source: customFact ? fact : { kind: "native", fieldId: "status" }, operator: "present" }] } });
  const compiled = await compileConditionalCustomField({ session: creator, registry, definitionId: old.intent.definitionId,
    resolveMetadata: async input => input.kind === "field" ? metadata : registeredRequiredFactMetadata(creator, registry, entity, input.fieldId) }, conditional);
  const plainCompiled = await compileCustomField(creator, plain, registry);
  const sourceVersion = removal ? { ...source, schemaVersion: 2, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum } : source;
  const targetCompiled = removal ? plainCompiled : compiled;
  const target = { ...old.target, schemaVersion: targetCompiled.payload.schemaVersion, createdBy: creator.userId, payload: targetCompiled.payload,
    compiledPlan: targetCompiled.plan, checksum: targetCompiled.checksum };
  const intent = sealRequiredFieldMigrationIntent({ ...old.intent, schemaVersion: 2, ownerQuery: ref("tickets.ticket.field_migration", 4),
    source: { ...old.intent.source, payload: sourceVersion.payload, versionChecksum: sourceVersion.checksum },
    target: { ...old.intent.target, payload: targetCompiled.payload, compiledChecksum: targetCompiled.checksum } }).intent;
  const stored = sealRequiredFieldMigrationReview({ ...intent, cohort: { recordCount: 2, observationDigest: "e".repeat(64) }, summary: { validCount: 2, invalidCount: 0, lossyCount: 0 } });
  return { ...old, intent, stored, source: sourceVersion, target };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
let f: Fixture, authority: FieldMigrationAuthority;
function install(next: Fixture) {
  f = next;
  authority = { session: { ...f.session, userId: "current-settler", membershipId: "current-member" },
    principal: { ...f.intent.principal, userId: "current-settler", membershipId: "current-member", authVersion: 11, sessionVersion: 12 },
    company: { id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true }, transaction: {
      $queryRaw: m.raw, studioDefinitionVersion: { findFirst: m.active, findMany: m.written }, moduleState: { findFirst: m.module }, organisation: { findFirst: m.company },
    } as unknown as FieldMigrationAuthority["transaction"] };
  m.refresh.mockImplementation(async () => ({ session: authority.session, transaction: authority.transaction, registry: f.registry,
    stamp: { organisationId: "company", userId: "current-settler", membershipId: "current-member", authVersion: 11, sessionVersion: 12 } }));
  m.principal.mockImplementation(async () => authority.session);
  m.company.mockImplementation(async () => authority.company); m.module.mockResolvedValue({ id: "enabled" });
  m.active.mockImplementation(async () => f.target); m.written.mockImplementation(async () => [f.source]);
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes('SELECT DISTINCT v."versionId"') ? [{ versionId: f.source.id }] : []);
  vi.spyOn(f.registry, "invokeQueryInTransaction").mockImplementation(async (_context, _policy, input) => (input as { mode: string }).mode === "preflight"
    ? { organisationId: "company", entityId: "tickets.ticket", mode: "preflight", count: 2, nativeAccessComplete: true }
    : { organisationId: "company", entityId: "tickets.ticket", mode: (input as { mode: string }).mode, nativeCoverageComplete: true, nativeReferenceCoverageComplete: true });
}
beforeEach(async () => { vi.restoreAllMocks(); vi.resetAllMocks(); install(await fixture()); });
const inspected = () => ({ ...f, state: "FINALIZED", settlement: null }) as unknown as Awaited<ReturnType<typeof inspectRequiredFieldMigrationSettlementIdentity>>;
const run = (mode: "rollback" | "history" = "history") => validateRequiredFieldMigrationSettlementCoverage(authority, f.registry, inspected(), mode);
const valueQueries = () => m.raw.mock.calls.filter(([strings]) => (strings as TemplateStringsArray).join("?").includes("SELECT DISTINCT"));

it("uses the genuine CURRENT different settler and support evidence without resolving or rewriting the original creator", async () => {
  const original = structuredClone(f.intent), principal = { ...authority.principal, authority: "staff_support" as const, auditId: "current-purpose-audit" };
  authority.principal = principal;
  m.principal.mockImplementation(async input => { if (input.userId === "actor") throw new Error("Creator revoked"); return authority.session; });
  await run();
  expect(m.refresh).toHaveBeenCalledWith(authority.session, authority.transaction);
  expect(m.principal).toHaveBeenCalledExactlyOnceWith(principal); expect(f.intent).toEqual(original);
  expect(m.rollback).not.toHaveBeenCalled();
  expect(f.registry.invokeQueryInTransaction).toHaveBeenLastCalledWith({ session: authority.session, transaction: authority.transaction },
    expect.objectContaining({ id: "tickets.ticket.field_settlement", version: 2 }), { preparationId: f.intent.id, mode: "history" });
});
it("rejects copied, stale, revoked or mismatched current authority before metadata, private coverage or written IDs", async () => {
  m.refresh.mockRejectedValueOnce(new Error("FORBIDDEN: copied session")); await expect(run()).rejects.toThrow("FORBIDDEN");
  for (const key of ["organisationId", "userId", "membershipId", "authVersion", "sessionVersion"] as const) {
    const principal = authority.principal; authority.principal = { ...principal, [key]: typeof principal[key] === "number" ? 99 : "foreign" };
    await expect(run()).rejects.toThrow(); authority.principal = principal;
  }
  m.principal.mockRejectedValueOnce(new Error("FORBIDDEN: current support revoked")); await expect(run()).rejects.toThrow("FORBIDDEN");
  expect(m.active).not.toHaveBeenCalled(); expect(valueQueries()).toHaveLength(0); expect(f.registry.invokeQueryInTransaction).not.toHaveBeenCalled();
});
it("completes private/native preflight before written IDs, even when the archive is empty", async () => {
  vi.mocked(f.registry.invokeQueryInTransaction).mockRejectedValueOnce(new Error("FORBIDDEN: private queue"));
  await expect(run()).rejects.toThrow("private queue"); expect(valueQueries()).toHaveLength(0); expect(m.written).not.toHaveBeenCalled();
  m.raw.mockResolvedValue([]); m.written.mockResolvedValue([]); await run();
  expect(vi.mocked(f.registry.invokeQueryInTransaction).mock.invocationCallOrder[1]).toBeLessThan(m.written.mock.invocationCallOrder[0]);
});
it("history retains its sealed custom-input graph with later active metadata and no old-input grant, without consulting today's inputs", async () => {
  install(await fixture(true)); f.definition.revision += 20; f.definition.retiredAt = new Date();
  const latest = await compileCustomField(authority.session, { schemaVersion: 1, entity: f.target.payload.entity,
    storageGeneration: f.target.payload.storageGeneration, field: { ...f.target.payload.field, label: "Current label" } }, f.registry);
  const active = { ...f.target, id: uuid(99), schemaVersion: 1, payload: latest.payload, compiledPlan: latest.plan, checksum: latest.checksum };
  f.definition.activeVersionId = active.id; m.active.mockResolvedValue(active);
  expect(authority.session.capabilities.has("tickets.field.old_input")).toBe(false);
  const resolve = vi.spyOn(f.registry, "resolve"); await run();
  expect(resolve.mock.calls.some(([, ref]) => ref.id === "tickets.ticket.required_facts")).toBe(false);
  expect(m.rollback).not.toHaveBeenCalled(); expect(m.active).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ where: { id: active.id, organisationId: "company", definitionId: f.intent.definitionId } }));
});
it("supports source2 rule removal to a schema1 target and delegates rollback with exactly the current actor and immutable intent", async () => {
  install(await fixture(false, true)); const original = structuredClone(f.intent); await run("rollback");
  expect(m.rollback).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ session: authority.session, principal: authority.principal, transaction: authority.transaction }), f.intent);
  expect(f.intent).toEqual(original); expect(f.target.schemaVersion).toBe(1);
  m.rollback.mockRejectedValueOnce(new Error("REVIEW_CHANGED: current condition drift")); await expect(run("rollback")).rejects.toThrow("condition drift");
  expect(f.registry.invokeQueryInTransaction).toHaveBeenLastCalledWith(expect.anything(), f.intent.ownerQuery, { mode: "preflight" });
});
it("enforces active/source/target/written field read and write, native read and manage, and production data permissions", async () => {
  for (const capability of ["tickets.ticket.read", "tickets.ticket.manage", "studio.definition.publish"]) {
    authority.session.capabilities.delete(capability); await expect(run()).rejects.toThrow("FORBIDDEN"); authority.session.capabilities.add(capability);
  }
  for (const capabilityKey of ["readCapability", "writeCapability"] as const) {
    const payload = { ...f.source.payload, field: { ...f.source.payload.field, [capabilityKey]: "tickets.field.historical" } };
    const compiled = await compileCustomField({ ...authority.session, capabilities: new Set([...authority.session.capabilities, "tickets.field.historical"]) }, payload, f.registry);
    m.written.mockResolvedValue([{ ...f.source, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum }]);
    await expect(run()).rejects.toThrow("FORBIDDEN");
    m.written.mockResolvedValue([f.source]);
  }
  authority.company.isTest = false; await expect(run()).rejects.toThrow("FORBIDDEN");
  expect(m.rollback).not.toHaveBeenCalled();
});
it("uses refreshed grants and enforces a newer active field policy before private preflight or written IDs", async () => {
  const freshSession = { ...authority.session, capabilities: new Set(["studio.definition.publish", "tickets.ticket.read"]) };
  m.refresh.mockResolvedValueOnce({ session: freshSession, transaction: authority.transaction, registry: f.registry,
    stamp: { ...authority.principal } });
  await expect(run()).rejects.toThrow("FORBIDDEN");
  expect(authority.session.capabilities.has("tickets.ticket.manage")).toBe(true);
  for (const capabilityKey of ["readCapability", "writeCapability"] as const) {
    const compiled = await compileCustomField({ ...authority.session, capabilities: new Set([...authority.session.capabilities, "tickets.field.current"]) },
      { schemaVersion: 1, entity: f.target.payload.entity, storageGeneration: f.target.payload.storageGeneration,
        field: { ...f.target.payload.field, [capabilityKey]: "tickets.field.current" } }, f.registry);
    m.active.mockResolvedValue({ ...f.target, schemaVersion: 1, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum });
    await expect(run()).rejects.toThrow("FORBIDDEN");
  }
  expect(valueQueries()).toHaveLength(0); expect(f.registry.invokeQueryInTransaction).not.toHaveBeenCalled();
});
it("rejects corrupt, foreign, missing, unsupported and substituted immutable written metadata", async () => {
  for (const patch of [{ organisationId: "foreign" }, { definitionId: uuid(100) }, { schemaVersion: 3 }, { checksum: "f".repeat(64) },
    { compiledPlan: f.target.compiledPlan }, { id: uuid(101) }]) {
    m.written.mockResolvedValue([{ ...f.source, ...patch }]); await expect(run()).rejects.toThrow();
  }
  m.written.mockResolvedValue([]); await expect(run()).rejects.toThrow("stale or has changed");
  m.written.mockResolvedValue([f.source, f.source]); await expect(run()).rejects.toThrow();
});
it("requires current company ownership, sealed source/target identity, dependency entitlement and valid owner scope/mode", async () => {
  for (const patch of [{ organisationId: "foreign" }, { id: uuid(100) }, { kind: "view" }]) {
    const original = f.definition; f.definition = { ...original, ...patch }; await expect(run()).rejects.toThrow(); f.definition = original;
  }
  m.company.mockResolvedValueOnce({ ...authority.company, archivedAt: new Date() }); await expect(run()).rejects.toThrow("FORBIDDEN");
  m.module.mockResolvedValueOnce(null); await expect(run()).rejects.toThrow("field source is unavailable");
  for (const result of [{ organisationId: "foreign" }, { entityId: "tickets.other" }, { mode: "rollback" }, { nativeReferenceCoverageComplete: false }]) {
    vi.mocked(f.registry.invokeQueryInTransaction).mockImplementationOnce(async () => ({})).mockResolvedValueOnce({ organisationId: "company", entityId: "tickets.ticket", mode: "history", nativeCoverageComplete: true, nativeReferenceCoverageComplete: true, ...result });
    await expect(run()).rejects.toThrow();
  }
});
it("rejects the latest unsupported settlement policy without selecting an older policy", async () => {
  registerPolicy([1], [9]); const resolved = vi.spyOn(f.registry, "resolveFieldSettlement");
  await expect(run()).rejects.toThrow("current owning-domain coverage"); expect(resolved).toHaveBeenCalledExactlyOnceWith(authority.session, f.intent.source.payload.entity, f.intent.target.payload.entity, 2);
  expect(valueQueries()).toHaveLength(0); expect(f.registry.invokeQueryInTransaction).not.toHaveBeenCalled();
});
function registerPolicy(intentVersions: Array<1 | 2>, referenceVersions: number[]) {
  f.registry.register("tickets", { contributions: [query({ id: "tickets.ticket.field_settlement", version: 3, label: "Current policy", kind: "query",
    capability: "tickets.ticket.manage", classification: "confidential", lifecycle: "active", input: z.unknown(), output: z.unknown(),
    transaction: "required", fieldSettlement: { entityId: "tickets.ticket", sourceVersions: [2, 9], targetVersions: [9], referenceVersions, intentVersions },
    pagination: "none", maxCardinality: 1, costClass: "high", execute: async () => ({}) })] });
}
it("requires actual base reference access and the latest owner's exact reference coverage", async () => {
  const ref = f.registry.describe("tickets.ticket", 1), entity = { id: ref.id, version: ref.version, schemaHash: ref.schemaHash, contractHash: ref.contractHash };
  const compiled = await compileCustomField(authority.session, { schemaVersion: 1, entity: f.target.payload.entity,
    storageGeneration: f.target.payload.storageGeneration, field: { ...f.target.payload.field, storage: { type: "reference", entity } } }, f.registry);
  const written = { ...f.target, schemaVersion: 1, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum };
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SELECT DISTINCT") ? [{ versionId: written.id }] : []);
  m.written.mockResolvedValue([written]);
  const original = f.registry.resolve.bind(f.registry), resolve = vi.spyOn(f.registry, "resolve").mockImplementation(async (session, reference) => {
    if (reference.id === entity.id && reference.version === entity.version) throw new Error("FORBIDDEN: historical reference read");
    return original(session, reference);
  });
  await expect(run()).rejects.toThrow("historical reference read"); resolve.mockRestore();
  registerPolicy([1, 2], [9]); await expect(run()).rejects.toThrow("stale or has changed");
  expect(f.registry.invokeQueryInTransaction).toHaveBeenLastCalledWith(expect.anything(), f.intent.ownerQuery, { mode: "preflight" });
});
