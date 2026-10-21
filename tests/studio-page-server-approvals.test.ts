import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Prisma, StudioDefinitionVersion } from "@/generated/prisma/client";
const mock = vi.hoisted(() => ({ membership: vi.fn(), version: vi.fn(), definition: vi.fn(), generation: vi.fn(), extension: vi.fn(), slot: vi.fn(), value: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: mock.membership } } }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => { throw new Error("No global registry in scoped approval."); } }));
import { sessionForUser, sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { entity, query } from "@/core/studio/registry/contracts";
import { pageSource } from "@/core/studio/registry/page-contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { pageProjectionSchema, type PageSourcePolicy } from "@/core/studio/pages/owner-contract";
import { buildPageApprovalsInTransaction, reconstructPageApprovalsInTransaction, reconstructPageMetadataInTransaction } from "@/core/studio/pages/server-approvals";
import { compilePage } from "@/core/studio/pages";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { ContractReference, EntityDescriptor } from "@/core/studio/registry/types";

// Real sealed field compilers, source factory, registry and genuine Session.
// Tenant/version/binding SQL calls are explicit collaborators, not PostgreSQL
// evidence. No value/fact query/condition evaluation/publishing is represented.
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const base = { version: 1, label: "Orders", capability: "example.order.read", lifecycle: "active" as const, classification: "confidential" as const };
const grants = [base.capability, "example.order.manage", "example.field.read", "example.field.write", "example.fact.read"];
const ref = ({id, version, schemaHash, contractHash}: ContractReference): ContractReference => ({id, version, schemaHash, contractHash});
const column = { id: "subject", valueType: "string" as const, nullable: false, classification: "confidential" as const };
const queryRef = { id: "example.order.page_get", version: 1 };
const membership = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: grants, deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
const transaction = { studioDefinitionVersion: { findFirst: mock.version }, studioDefinition: { findFirst: mock.definition },
  studioFieldGeneration: { findFirst: mock.generation }, studioExtensionRecord: { findFirst: mock.extension },
  studioFieldSlot: { findMany: mock.slot }, studioFieldValue: { findMany: mock.value } } as unknown as Prisma.TransactionClient;
beforeEach(() => { vi.resetAllMocks(); mock.membership.mockImplementation(async () => membership()); mock.generation.mockResolvedValue({ id: uuid(3) }); });
async function actor(capabilities = grants) {
  mock.membership.mockResolvedValueOnce({ ...membership(), grantedCapabilities: capabilities });
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("No actor."); return session;
}
async function fixture(conditional = false) {
  const session = await actor(), registry = new CapabilityRegistry(async () => true), recordAccess = vi.fn(async () => { throw new Error("No canonical data in metadata builder."); });
  const dataRead = vi.fn(async () => { throw new Error("No native facts in metadata builder."); });
  const native = { ...base, kind: "entity" as const, id: "example.order", key: "string" as const,
    fields: [{ id: "subject", type: "string" as const, nullable: false, classification: "confidential" as const, filterable: true, sortable: false, decision: false, template: false }],
    extensionPolicy: { customFields: true, recordTypes: false, pageVariants: false },
    record: { writeCapability: "example.order.manage", detailRoute: "/orders/{recordId}", labelField: "subject",
      listQuery: { id: "example.order.list", version: 1 }, getQuery: { id: "example.order.get", version: 1 },
      fieldPolicy: { types: ["string" as const], reservedKeys: ["subject"], referenceEntities: [], maxFields: 10 }, authorise: recordAccess } } satisfies EntityDescriptor;
  const oldQueries = ["list", "get"].map(suffix => query({ ...base, id: `example.order.${suffix}`, kind: "query", pagination: "none", maxCardinality: 1, costClass: "low",
    input: z.strictObject({}), output: z.string(), execute: dataRead }));
  const policy: PageSourcePolicy = { schemaVersion: 1, entity: { id: native.id, version: 2 }, accessMode: "ordinary_read", variants: false, fieldSourceVersions: [1, 2],
    nativeFields: [{ id: "subject", query: queryRef, columnId: "subject" }], queries: [{ query: queryRef, scope: "record", purpose: "fact", columns: [column] }],
    facts: [], commands: [], metrics: [], surfaces: [], maxQueryCost: 24 };
  registry.register("example", { contributions: [...oldQueries, entity(native), entity({ ...native, version: 2, record: { ...native.record,
    requiredFacts: { query: { id: "example.order.native_facts", version: 1 }, facts: [{ fieldId: "subject", type: "string", classification: "confidential", capability: "example.fact.read" }] } } }),
    query({ ...base, id: "example.order.native_facts", kind: "query", transaction: "required", pagination: "none", maxCardinality: 1, costClass: "low",
      input: z.strictObject({}), output: z.strictObject({ subject: z.string() }), execute: dataRead }),
    query({ ...base, ...queryRef, kind: "query", transaction: "required", pagination: "none", maxCardinality: 1, costClass: "low",
      input: z.strictObject({ id: z.string() }), output: pageProjectionSchema([column], 1), execute: dataRead }),
    pageSource({ ...base, id: "example.order.page", policy, callbacks: { authoriseRead: recordAccess,
      async bindQueryInput() { throw new Error("No binding in metadata builder."); }, async projectQueryOutput() { throw new Error("No projection in metadata builder."); } } })] });
  const entityRef = registry.describe(native.id, conditional ? 2 : 1), source = { id: entityRef.id, version: entityRef.version, schemaHash: entityRef.schemaHash, contractHash: entityRef.contractHash };
  const payload = { schemaVersion: 1, entity: source, storageGeneration: uuid(3), field: { key: "bespoke", label: "Business detail", classification: "confidential",
    storage: { type: "string", maxLength: 100 }, readCapability: "example.field.read", writeCapability: "example.field.write" } };
  const resolveMetadata = vi.fn(async () => registeredRequiredFactMetadata(session, registry, source, "subject"));
  const compiled = conditional ? await compileConditionalCustomField({ session, registry, definitionId: uuid(1), resolveMetadata },
    { ...payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "subject" }, operator: "present" }] } })
    : await compileCustomField(session, payload, registry);
  const stored: StudioDefinitionVersion & { definition: { kind: string; retiredAt: null }; configurationDependencies: [] } = {
    id: uuid(2), definitionId: uuid(1), organisationId: "company", version: 1, semanticVersion: "1.0.0", schemaVersion: compiled.plan.schemaVersion,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum,
    createdBy: "actor", publishedAt: new Date(), definition: { kind: "customField", retiredAt: null }, configurationDependencies: [],
  };
  const current = { id: uuid(1), organisationId: "company", key: "example.order.bespoke", activeVersionId: stored.id, activeVersion: stored };
  mock.version.mockResolvedValue(stored); mock.definition.mockResolvedValue(current);
  const authority = (currentSession: Session = session): FieldRuntimeAuthority => ({ session: currentSession, stamp: sessionAuthorityStamp(currentSession)!, transaction, registry });
  const request = { sourcePage: ref(registry.describe("example.order.page", 1)), customFields: [{ kind: "customField" as const, definitionId: stored.definitionId,
    versionId: stored.id, schemaVersion: stored.schemaVersion as 1 | 2, checksum: stored.checksum }] };
  return { session, registry, recordAccess, dataRead, resolveMetadata, compiled, stored, current, authority, request, policy };
}
const forms = ["desktop", "tablet", "phone"] as const;

describe("genuine server page approvals", () => {
  it("retains a separate metadata seal path for a genuine Create-only owner without manufacturing Read or touching protected data", async () => {
    const f = await fixture(true), creator = await actor(["example.order.create"]);
    await expect(reconstructPageMetadataInTransaction(f.authority(creator), f.request)).resolves.toBeTruthy();
    await expect(reconstructPageApprovalsInTransaction(f.authority(creator), f.request)).rejects.toThrow("FORBIDDEN");
    await expect(reconstructPageMetadataInTransaction({ ...f.authority(creator), session: { ...creator } }, f.request)).rejects.toThrow("genuine");
    expect(creator.capabilities.has(base.capability)).toBe(false);
    expect(f.recordAccess).not.toHaveBeenCalled(); expect(f.dataRead).not.toHaveBeenCalled();
    expect(mock.extension).not.toHaveBeenCalled(); expect(mock.value).not.toHaveBeenCalled();
  });
  it("reconstructs exact retained field source metadata and compiles canonical page dependencies without reading records/values/facts", async () => {
    const f = await fixture(), approvals = await buildPageApprovalsInTransaction(f.authority(), f.request);
    expect(approvals.entity.version).toBe(2); expect(approvals.customFields[0].entity).toEqual(f.compiled.payload.entity);
    expect(approvals.customFields[0].entity.version).toBe(1); expect(approvals.contracts.map(value => value.version)).toEqual([1]);
    const plan = compilePage({ schemaVersion: 1, entity: ref(approvals.entity), formFactors: forms, sections: [{ id: "main", label: "Order", help: "",
      columns: { desktop: 2, tablet: 2, phone: 1 }, formFactors: forms, components: [{ id: "extra", type: "fields", formFactors: forms,
        fields: [{ source: "extension", reference: f.request.customFields[0], mode: "edit" }] }] }], variants: [] }, approvals);
    expect(plan.dependencies.filter(value => value.id === "example.order").map(value => value.version)).toEqual([1, 2]);
    expect(plan.configurationDependencies).toEqual(f.request.customFields);
    expect(f.dataRead).not.toHaveBeenCalled(); expect(f.recordAccess).not.toHaveBeenCalled();
    expect(mock.extension).not.toHaveBeenCalled(); expect(mock.slot).not.toHaveBeenCalled(); expect(mock.value).not.toHaveBeenCalled();
    expect(mock.version).toHaveBeenCalledWith(expect.objectContaining({ where: { id: f.stored.id, definitionId: f.stored.definitionId, organisationId: "company" } }));
  });
  it("keeps metadata reconstruction independent from current denied field/condition grants while authoring enforces Read", async () => {
    const f = await fixture(true), current = await actor([base.capability]), calls = f.resolveMetadata.mock.calls.length;
    const approvals = await reconstructPageApprovalsInTransaction(f.authority(current), f.request);
    expect(approvals.customFields[0].reference.schemaVersion).toBe(2);
    expect(f.resolveMetadata).toHaveBeenCalledTimes(calls); expect(f.dataRead).not.toHaveBeenCalled();
    await expect(buildPageApprovalsInTransaction(f.authority(current), f.request)).rejects.toThrow("FORBIDDEN");
    const reader = await actor([base.capability, "example.field.read"]);
    await expect(buildPageApprovalsInTransaction(f.authority(reader), f.request)).resolves.toBeTruthy();
    expect(f.resolveMetadata).toHaveBeenCalledTimes(calls); expect(f.dataRead).not.toHaveBeenCalled();
    expect(reader.capabilities.has("example.field.write")).toBe(false); expect(reader.capabilities.has("example.fact.read")).toBe(false);
  });
  it("accepts a cosmetic active version but rejects structural/generation/required/access drift", async () => {
    const f = await fixture(), renamed = { ...f.compiled.payload, field: { ...f.compiled.payload.field, label: "Clearer label", help: "Helpful guidance" } };
    const cosmetic = await compileCustomField(f.session, renamed, f.registry);
    mock.definition.mockResolvedValue({ ...f.current, activeVersionId: uuid(5), activeVersion: { ...f.stored, id: uuid(5), payload: cosmetic.payload, compiledPlan: cosmetic.plan, checksum: cosmetic.checksum } });
    await expect(reconstructPageApprovalsInTransaction(f.authority(), f.request)).resolves.toBeTruthy();
    for (const patch of [{ storageGeneration: uuid(6) }, { field: { ...f.compiled.payload.field, required: true } },
      { field: { ...f.compiled.payload.field, readCapability: "example.fact.read" } }]) {
      const compiled = await compileCustomField(f.session, { ...f.compiled.payload, ...patch }, f.registry);
      mock.definition.mockResolvedValue({ ...f.current, activeVersionId: uuid(5), activeVersion: { ...f.stored, id: uuid(5), payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum } });
      await expect(reconstructPageApprovalsInTransaction(f.authority(), f.request)).rejects.toThrow("incompatible");
    }
  });
  it("rejects forged/copied authority, foreign/retired pin, changed seal and missing actual generation before value lookup", async () => {
    const f = await fixture(), copied = { ...f.session } as Session;
    await expect(reconstructPageApprovalsInTransaction({ ...f.authority(), session: copied }, f.request)).rejects.toThrow("genuine");
    expect(mock.version).not.toHaveBeenCalled();
    for (const patch of [{ organisationId: "foreign" }, { definition: { kind: "customField", retiredAt: new Date() } }, { checksum: "a".repeat(64) },
      { compiledPlan: { ...f.compiled.plan, payload: { ...f.compiled.payload, field: { ...f.compiled.payload.field, label: "tampered" } } } }]) {
      mock.version.mockResolvedValue({ ...f.stored, ...patch });
      await expect(reconstructPageApprovalsInTransaction(f.authority(), f.request)).rejects.toThrow();
    }
    mock.version.mockResolvedValue(f.stored); mock.generation.mockResolvedValue(null);
    await expect(reconstructPageApprovalsInTransaction(f.authority(), f.request)).rejects.toThrow("storage generation");
    expect(mock.value).not.toHaveBeenCalled(); expect(f.recordAccess).not.toHaveBeenCalled();
  });
  it("rejects stale active pointer and duplicate/foreign request metadata without inventing source support", async () => {
    const f = await fixture();
    await expect(reconstructPageApprovalsInTransaction(f.authority(), { ...f.request, organisationId: "foreign" } as typeof f.request)).rejects.toThrow();
    await expect(reconstructPageApprovalsInTransaction(f.authority(), { ...f.request, customFields: [...f.request.customFields, ...f.request.customFields] })).rejects.toThrow("Duplicate");
    mock.definition.mockResolvedValue({ ...f.current, activeVersionId: uuid(7) });
    await expect(reconstructPageApprovalsInTransaction(f.authority(), f.request)).rejects.toThrow("incompatible");
    const otherPolicy = { ...f.policy, fieldSourceVersions: [2] };
    f.registry.register("example", { contributions: [pageSource({ ...base, id: "example.order.page", version: 2, policy: otherPolicy,
      callbacks: { authoriseRead: f.recordAccess, async bindQueryInput() { return {}; }, async projectQueryOutput() { return { rows: [], nextCursor: null }; } } })] });
    await expect(reconstructPageApprovalsInTransaction(f.authority(), { ...f.request, sourcePage: ref(f.registry.describe("example.order.page", 2)) })).rejects.toThrow("incompatible");
    expect(mock.value).not.toHaveBeenCalled();
  });
});
