import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { reviewedFieldPublicationPin, reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createFieldMigrationExecutionPin, createRequiredFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { createFieldMigrationCutoverPin, createRequiredFieldMigrationCutoverPin } from "@/core/studio/fields/migrations/cutover-contract";
import { closeAffectedFieldWriteWindows, type FieldWindowMutationCause } from "@/core/studio/fields/runtime-write-window";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
const m = vi.hoisted(() => ({ stamp: vi.fn(), raw: vi.fn(), select: vi.fn(), preparation: vi.fn(), legacy: vi.fn(), required: vi.fn(), window: vi.fn(), cutover: vi.fn(), publication: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: m.stamp }));
vi.mock("@/core/studio/fields/migrations/settlement-inspection", () => ({ inspectFieldMigrationSettlementIdentity: m.legacy,
  inspectRequiredFieldMigrationSettlementIdentity: m.required, inspectFieldMigrationSettlementWindow: m.window }));
let authority: FieldRuntimeAuthority;
let authenticated: FieldRuntimeAuthority["session"];
let genuine: FieldRuntimeAuthority["stamp"] | null;
let windows: Awaited<ReturnType<typeof fixture>>[];
// Real registry/closed compilers/seals/pins. Current WeakMap stamp issuance,
// immutable inspectors, visibility and SQL rows/mutations are bounded mocks.
// This proves orchestration, not actual owning permission or PostgreSQL rollback.
async function fixture(n = 0, conditional = false) {
  const f = await retainedCutoverFixture(), definitionId = uuid(n + 4);
  const ref = (id: string, version: number) => { const metadata = f.registry.describe(id, version);
    return { id, version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }; };
  const author = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field_b.read", "tickets.field_b.edit"]) };
  const field = { ...f.source.payload.field, key: `field_${n}`, readCapability: "tickets.field_b.read", writeCapability: "tickets.field_b.edit" };
  const a = await compileCustomField(author, { ...f.source.payload, storageGeneration: uuid(n + 1), field }, f.registry);
  const base = { ...f.target.payload, storageGeneration: uuid(n + 2), field: { ...field, storage: f.target.payload.field.storage } };
  const entity = ref("tickets.ticket", 9);
  const b = conditional ? await compileConditionalCustomField({ session: author, registry: f.registry, definitionId,
    resolveMetadata: async source => registeredRequiredFactMetadata(author, f.registry, entity, source.kind === "native" ? source.fieldId : "invalid") },
  { ...base, schemaVersion: 2, entity, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } })
    : await compileCustomField(author, base, f.registry);
  const source = { ...f.source, id: uuid(n + 5), definitionId, schemaVersion: a.plan.schemaVersion, checksum: a.checksum, payload: a.payload, compiledPlan: a.plan };
  const target = { ...f.target, id: uuid(n + 8), definitionId, schemaVersion: b.plan.schemaVersion, checksum: b.checksum, payload: b.payload, compiledPlan: b.plan };
  const input = { ...f.intent, schemaVersion: conditional ? 2 : 1, id: uuid(n + 3), definitionId,
    ownerQuery: ref("tickets.ticket.field_migration", conditional ? 4 : 3), source: { versionId: source.id, versionChecksum: source.checksum, payload: source.payload },
    target: { ...f.intent.target, draftId: uuid(n + 6), compiledChecksum: target.checksum, payload: target.payload } };
  const sealed = conditional ? sealRequiredFieldMigrationIntent(input) : sealFieldMigrationIntent(input);
  const review = { ...sealed.intent, cohort: f.stored.review.cohort, summary: f.stored.review.summary };
  const stored = conditional ? sealRequiredFieldMigrationReview(review) : sealFieldMigrationReview(review);
  const targetProjection = { id: target.id, organisationId: target.organisationId, definitionId, version: target.version, checksum: target.checksum, payload: target.payload, compiledPlan: target.compiledPlan };
  const published = { ...(conditional ? reviewedRequiredFieldPublicationPin(stored, targetProjection, "actor", false) : reviewedFieldPublicationPin(stored, targetProjection, "actor", false)), state: "PUBLISHED", revision: 0 };
  const identity = Object.fromEntries(Object.entries(published).filter(([key]) => key !== "state" && key !== "revision"));
  const owner = f.registry.describe("tickets.ticket", conditional ? 9 : 5), approval = f.registry.describe("tickets.ticket.field_representation", conditional ? 2 : 1);
  const pin = conditional ? createRequiredFieldMigrationExecutionPin(stored, targetProjection, identity, owner, approval) : createFieldMigrationExecutionPin(stored, targetProjection, identity, owner, approval);
  const execution = { ...f.execution, preparationId: sealed.intent.id, definitionId, pin: pin.pin, pinChecksum: pin.checksum };
  const baseline = { ...f.definition, id: definitionId, activeVersionId: source.id, revision: sealed.intent.definitionRevision + 1 };
  const retained = conditional ? createRequiredFieldMigrationCutoverPin(stored, execution, published, baseline) : createFieldMigrationCutoverPin(stored, execution, published, baseline);
  const publication = { ...published, state: "CUTOVER", revision: 1, createdAt: new Date("2026-10-11T10:00:00Z"), updatedAt: new Date("2026-10-11T10:00:00Z") };
  return { registry: f.registry, intent: sealed.intent, source, target, stored, retained, publication,
    definition: { ...f.definition, id: definitionId, activeVersionId: target.id },
    receipt: { ...f.receipt, preparationId: sealed.intent.id, definitionId, sourceVersionId: source.id, targetVersionId: target.id, pin: retained.pin, pinChecksum: retained.checksum },
    preparation: { ...f.preparation, id: sealed.intent.id, definitionId, intent: sealed.intent, intentChecksum: sealed.checksum,
      review: { ...f.preparation.review, id: sealed.intent.id, definitionId, ...stored } } };
}
function selected(g: Awaited<ReturnType<typeof fixture>>) {
  const generation = (payload: Pick<typeof g.source.payload, "storageGeneration" | "entity" | "field">) => ({ id: payload.storageGeneration, organisationId: "company", definitionId: g.intent.definitionId, entityId: payload.entity.id, valueType: payload.field.storage.type });
  return { ...g.publication, sourceGeneration: generation(g.intent.source.payload), targetGeneration: generation(g.intent.target.payload) };
}
function cause(trigger: FieldWindowMutationCause["trigger"] = "ordinary_field_save"): FieldWindowMutationCause {
  const metadata = authority.registry.describe("tickets.ticket", 9);
  return { entity: { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }, operationId: uuid(900), trigger };
}
beforeEach(async () => {
  vi.resetAllMocks(); windows = [await fixture(0), await fixture(100, true)];
  authenticated = { userId: "current-actor", userName: "Current", userEmail: "current@example.invalid", organisationId: "company", organisationName: "Company", membershipId: "current-member",
    capabilities: new Set(["tickets.ticket.create", "service.case.manage"]) };
  genuine = { userId: authenticated.userId, organisationId: authenticated.organisationId, membershipId: authenticated.membershipId, authVersion: 3, sessionVersion: 2 };
  authority = { session: authenticated, stamp: genuine, registry: windows[0].registry,
    transaction: { $queryRaw: m.raw, studioFieldMigrationPublication: { findMany: m.select, updateMany: m.publication },
      studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationCutover: { updateMany: m.cutover }, auditEntry: { create: m.audit } } as unknown as Prisma.TransactionClient };
  m.stamp.mockImplementation(session => session === authenticated ? genuine : null);
  m.raw.mockResolvedValue([{ transaction_isolation: "serializable" }]);
  m.select.mockImplementation(async () => windows.filter(g => ["PUBLISHED", "CUTOVER"].includes(g.publication.state)).map(selected));
  m.preparation.mockImplementation(async args => windows.find(g => g.intent.id === args.where.id)?.preparation ?? null);
  for (const inspector of [m.legacy, m.required]) inspector.mockImplementation(async (_, intent) => windows.find(g => g.intent.id === intent.id));
  m.cutover.mockResolvedValue({ count: 1 });
  m.publication.mockImplementation(async args => { const g = windows.find(g => g.intent.id === args.where.preparationId); if (g) Object.assign(g.publication, args.data); return { count: 1 }; });
  m.audit.mockResolvedValue({ id: "support-audit" });
});
it.each(["ordinary_field_save", "native_record_write", "native_record_creation"] as const)("closes unrelated legacy/required windows for complete-cohort %s without B/nativeRead/Publish grants", async trigger => {
  const resolve = vi.spyOn(authority.registry, "resolve"), query = vi.spyOn(authority.registry, "invokeQueryInTransaction"), record = vi.spyOn(authority.registry, "authoriseRecord");
  await closeAffectedFieldWriteWindows(authority, cause(trigger));
  expect(m.legacy).toHaveBeenCalledTimes(1); expect(m.required).toHaveBeenCalledTimes(1); expect(m.window).toHaveBeenCalledTimes(2);
  expect(m.cutover).toHaveBeenCalledTimes(2); expect(m.publication).toHaveBeenCalledTimes(2); expect(m.audit).toHaveBeenCalledTimes(2);
  expect(resolve).not.toHaveBeenCalled(); expect(query).not.toHaveBeenCalled(); expect(record).not.toHaveBeenCalled();
  expect([...authority.session.capabilities]).toEqual(["tickets.ticket.create", "service.case.manage"]);
  for (const [args] of m.cutover.mock.calls) expect(args.data).toMatchObject({ settledBy: "current-actor", settlementPin: { principal: { ...genuine, authority: "customer" } } });
  expect(m.audit.mock.calls.every(([args]) => args.data.after.trigger === trigger && args.data.after.operationId === uuid(900))).toBe(true);
  expect(windows.every(g => g.intent.principal.userId === "actor")).toBe(true);
  expect(m.raw.mock.calls.every(([sql]) => sql.join("") === "SHOW transaction_isolation")).toBe(true);
  expect(Object.keys(authority.transaction)).not.toContain("studioFieldValue");
  // Later legal operations in this same transaction naturally see COMPLETED.
  await closeAffectedFieldWriteWindows(authority, cause(trigger)); expect(m.cutover).toHaveBeenCalledTimes(2);
});
it("uses a bounded tenant source OR target selector, stable metadata order and no observation/record selection", async () => {
  windows.reverse(); await closeAffectedFieldWriteWindows(authority, cause("native_record_creation"));
  expect(m.select.mock.calls[0][0]).toMatchObject({ where: { organisationId: "company", state: { in: ["PUBLISHED", "CUTOVER"] },
    OR: [{ sourceGeneration: { entityId: "tickets.ticket" } }, { targetGeneration: { entityId: "tickets.ticket" } }] }, orderBy: [{ definitionId: "asc" }, { preparationId: "asc" }], take: 101 });
  expect(m.select.mock.calls[0][0].include.sourceGeneration.select).toEqual({ id: true, organisationId: true, definitionId: true, entityId: true, valueType: true });
  expect(m.preparation.mock.calls.map(([args]) => args.where.id)).toEqual([uuid(3), uuid(103)]);
  expect(m.cutover.mock.calls.map(([args]) => args.where.definitionId)).toEqual([uuid(4), uuid(104)]);
  expect(m.window.mock.invocationCallOrder.at(-1)!).toBeLessThan(m.cutover.mock.invocationCallOrder[0]);
});
it.each([false, true])("preflights every PUBLISHED window before any CUTOVER inspection/support/CAS with reversed=%s", async reverse => {
  windows[1].publication.state = "PUBLISHED"; if (reverse) windows.reverse();
  authority.session.capabilities.add("atlas.staff.manage"); authority.session.capabilities.add("atlas.companies.manage");
  await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow("FIELD_MIGRATION_IN_PROGRESS");
  expect(m.preparation).not.toHaveBeenCalled(); expect(m.legacy).not.toHaveBeenCalled(); expect(m.required).not.toHaveBeenCalled();
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.publication).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("inspects every strict metadata window before mutation and preserves exact draft/config denial", async () => {
  m.window.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("Reviewed draft or active config changed"));
  await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow("Reviewed draft");
  expect(m.legacy).toHaveBeenCalled(); expect(m.required).toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("requires actual current stamp/identity before any SQL or selection", async () => {
  const original = authority;
  for (const invalid of [{ ...original, session: { ...authenticated } }, { ...original, stamp: { ...original.stamp, authVersion: 99 } },
    { ...original, stamp: { ...original.stamp, sessionVersion: 99 } }, { ...original, stamp: { ...original.stamp, organisationId: "foreign" } },
    { ...original, session: { ...authenticated, userId: "foreign" } }, { ...original, session: { ...authenticated, membershipId: "foreign" } }]) {
    await expect(closeAffectedFieldWriteWindows(invalid, cause())).rejects.toThrow("FORBIDDEN");
  }
  for (const key of ["userId", "organisationId", "membershipId"] as const) {
    const saved = authenticated[key]; authenticated[key] = "foreign";
    await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow("FORBIDDEN"); authenticated[key] = saved;
  }
  genuine = null; await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow("FORBIDDEN");
  expect(m.raw).not.toHaveBeenCalled(); expect(m.select).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("requires caller-owned Serializable before selecting windows", async () => {
  for (const rows of [[], [{ transaction_isolation: "read committed" }], [{ transaction_isolation: "serializable" }, { transaction_isolation: "serializable" }]]) {
    m.raw.mockResolvedValue(rows); await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow("serializable");
  }
  expect(m.select).not.toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled();
});
it("rejects client extras, malformed cause, unsupported/changed refs and wrong owner/kind/policy without resolving permissions", async () => {
  const input = cause();
  for (const invalid of [{ ...input, organisationId: "foreign" }, { ...input, recordId: "client" }, { ...input, operationId: "invalid" }, { ...input, trigger: "delete" },
    { ...input, entity: { ...input.entity, version: 1 } }, { ...input, entity: { ...input.entity, version: 10 } },
    { ...input, entity: { ...input.entity, id: "sales.order" } }, { ...input, entity: { ...input.entity, schemaHash: "e".repeat(64) } },
    { ...input, entity: { ...input.entity, contractHash: "e".repeat(64) } }])
    await expect(closeAffectedFieldWriteWindows(authority, invalid as FieldWindowMutationCause)).rejects.toThrow();
  const metadata = authority.registry.describe(input.entity.id, input.entity.version), describe = vi.spyOn(authority.registry, "describe");
  for (const patch of [{ ownerModuleId: "sales" }, { kind: "query" }, { details: {} },
    { details: { ...metadata.details, extensionPolicy: { customFields: false, recordTypes: true, pageVariants: true } } }]) {
    describe.mockReturnValueOnce({ ...metadata, ...patch } as typeof metadata);
    await expect(closeAffectedFieldWriteWindows(authority, input)).rejects.toThrow();
  }
  expect(m.raw).not.toHaveBeenCalled(); expect(m.select).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("requires exact registered complete Ticket snapshot identity without querying retained values", async () => {
  const input = cause(), reference = windows[0].intent.ownerQuery;
  const metadata = authority.registry.describe(reference.id, reference.version), original = authority.registry.describe.bind(authority.registry);
  const describe = vi.spyOn(authority.registry, "describe");
  for (const patch of [{ kind: "entity" }, { ownerModuleId: "sales" }, { schemaHash: "e".repeat(64) }, { contractHash: "e".repeat(64) },
    { details: { ...metadata.details, transaction: "optional" } }]) {
    describe.mockImplementation((id, version) => id === reference.id && version === reference.version ? { ...metadata, ...patch } as typeof metadata : original(id, version));
    await expect(closeAffectedFieldWriteWindows(authority, input)).rejects.toThrow("FIELD_STORAGE_INVALID");
  }
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("denies overflow, duplicate preparation/definition, malformed and foreign selected metadata before inspection or mutation", async () => {
  const a = selected(windows[0]), b = selected(windows[1]);
  const cases = [Array.from({ length: 101 }, () => a), [a, a], [a, { ...b, definitionId: a.definitionId }], [a, { ...b, preparationId: a.preparationId }],
    [{ ...a, preparationId: "invalid" }], [{ ...a, targetChecksum: "invalid" }], [{ ...a, state: "COMPLETED" }], [{ ...a, organisationId: "foreign" }],
    [{ ...a, sourceGeneration: null }], [{ ...a, sourceGeneration: { ...a.sourceGeneration, organisationId: "foreign" } }],
    [{ ...a, sourceGeneration: { ...a.sourceGeneration, definitionId: uuid(999) } }], [{ ...a, targetGeneration: { ...a.targetGeneration, id: uuid(999) } }],
    [{ ...a, targetGeneration: { ...a.targetGeneration, entityId: "sales.order" } }], [{ ...a, sourceGenerationId: a.targetGenerationId }]];
  for (const rows of cases) { m.select.mockResolvedValueOnce(rows); await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow("FIELD_STORAGE_INVALID"); }
  expect(m.preparation).not.toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("denies source/target generation types, retained entity and unknown/corrupt intents before any settlement", async () => {
  const original = selected(windows[1]);
  for (const which of ["sourceGeneration", "targetGeneration"] as const) {
    m.select.mockResolvedValueOnce([selected(windows[0]), { ...original, [which]: { ...original[which], valueType: "string" } }]);
    await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow("FIELD_STORAGE_INVALID");
  }
  m.preparation.mockImplementationOnce(async () => windows[0].preparation).mockResolvedValueOnce({ ...windows[1].preparation, intentChecksum: "e".repeat(64) });
  await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow();
  m.preparation.mockImplementationOnce(async () => windows[0].preparation).mockResolvedValueOnce({ ...windows[1].preparation, intent: { ...windows[1].intent, schemaVersion: 3 } });
  await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow();
  const metadata = authority.registry.describe("tickets.ticket", 9), originalDescribe = authority.registry.describe.bind(authority.registry), describe = vi.spyOn(authority.registry, "describe");
  describe.mockImplementation((id, version) => id === "tickets.ticket" && version === 5 ? { ...metadata, ownerModuleId: "sales" } : originalDescribe(id, version));
  await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow("FIELD_STORAGE_INVALID");
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("no-ops outside open windows, and preserves current purpose-bound support for each selected window", async () => {
  m.select.mockResolvedValueOnce([]); await closeAffectedFieldWriteWindows(authority, cause()); expect(m.preparation).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  authority.session.capabilities.add("atlas.staff.manage");
  await expect(closeAffectedFieldWriteWindows(authority, cause("native_record_write"))).rejects.toThrow("FORBIDDEN"); expect(m.audit).not.toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled();
  authority.session.capabilities.add("atlas.companies.manage"); await closeAffectedFieldWriteWindows(authority, cause("native_record_write"));
  expect(m.audit).toHaveBeenCalledTimes(4);
  for (const [args] of m.cutover.mock.calls) expect(args.data.settlementPin.principal).toEqual({ ...genuine, authority: "staff_support", auditId: "support-audit" });
  expect(m.audit.mock.calls.filter(([args]) => args.data.action === "studio.field.migration.support_opened").every(([args]) => args.data.before.purpose === "native_record_write")).toBe(true);
});
it.each(["receipt", "publication", "audit", "support"])("propagates %s failures from the second finalizer for owning transaction rollback", async failure => {
  if (failure === "receipt") m.cutover.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
  if (failure === "publication") m.publication.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
  if (failure === "audit") m.audit.mockResolvedValueOnce({ id: "first" }).mockRejectedValueOnce(new Error("Audit failed"));
  if (failure === "support") {
    authority.session.capabilities.add("atlas.staff.manage"); authority.session.capabilities.add("atlas.companies.manage");
    m.audit.mockResolvedValueOnce({ id: "support-first" }).mockResolvedValueOnce({ id: "final-first" }).mockRejectedValueOnce(new Error("Support failed"));
  }
  await expect(closeAffectedFieldWriteWindows(authority, cause())).rejects.toThrow(failure === "audit" ? "Audit failed" : failure === "support" ? "Support failed" : "CONFLICT");
  expect(m.window).toHaveBeenCalledTimes(2);
  if (failure === "support") expect(m.cutover).toHaveBeenCalledTimes(1);
});
