import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinitionVersion } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
const m = vi.hoisted(() => ({ refresh: vi.fn(), principal: vi.fn(), raw: vi.fn(), company: vi.fn(), definition: vi.fn(), version: vi.fn(), generation: vi.fn(), extension: vi.fn(), value: vi.fn(), slot: vi.fn(), publication: vi.fn(), execution: vi.fn(), observation: vi.fn(), cutover: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.principal }));
vi.mock("@/core/studio/fields/migrations/cutover-inspection", async importOriginal => ({
  ...await importOriginal<typeof import("@/core/studio/fields/migrations/cutover-inspection")>(), inspectRequiredFieldMigrationCutoverIdentity: m.cutover,
}));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { checksum } from "@/core/studio/registry/contracts";
import { customFieldPayloadSchema, type FieldStorage } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema, type VersionedFieldPayload } from "@/core/studio/fields/required-contract";
import { compileFieldMigrationMetadata } from "@/core/studio/fields/migrations/metadata";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview, requiredFieldMigrationObservationDigest, type RequiredFieldMigrationIntent } from "@/core/studio/fields/migrations/required-contracts";
import { inspectRequiredFieldMigrationRecord, inspectPublishedRequiredFieldMigrationRecord, inspectExecutingRequiredFieldMigrationRecord, observeExecutingRequiredFieldMigrationRecord, inspectCutoverRequiredFieldMigrationRecord, observeCutoverRequiredFieldMigrationRecord, inspectRollbackRequiredFieldMigrationRecord, observeRollbackRequiredFieldMigrationRecord, observePublishedRequiredFieldMigrationRecord, observeRequiredFieldMigrationRecord, observeFieldMigrationRecord } from "@/core/studio/fields/migrations/observation";
import { reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { validatePublishedRequiredFieldMigrationSourceCoverage, validateExecutingRequiredFieldMigrationSourceCoverage, validateCutoverRequiredFieldMigrationSourceCoverage, validateRollbackRequiredFieldMigrationSourceCoverage, validateRequiredFieldMigrationSourceCoverage, validateFieldMigrationSourceCoverage } from "@/core/studio/fields/migrations/coverage";
import { createRequiredFieldMigrationExecutionPin, createRequiredFieldMigrationOutcomePin } from "@/core/studio/fields/migrations/execution-contract";
import { encodeFieldValue } from "@/core/studio/fields/codec";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const root = uuid(4), inputId = uuid(14);
const company = { id: "company", kind: "CUSTOMER" as const, status: "ACTIVE" as const, archivedAt: null, isTest: true };
const actor: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const stamp = { organisationId: "company", userId: "actor", membershipId: "member", authVersion: 1, sessionVersion: 2 };
const anchor = { recordId: "record", organisationId: "company", revision: 7 };
const tx = { $queryRaw: m.raw, organisation: { findFirst: m.company }, studioDefinition: { findFirst: m.definition }, studioDefinitionVersion: { findFirst: m.version, findMany: m.version },
  studioFieldGeneration: { findFirst: m.generation }, studioExtensionRecord: { findFirst: m.extension }, studioFieldValue: { findFirst: m.value }, studioFieldSlot: { findFirst: m.slot },
  studioFieldMigrationPublication: { findFirst: m.publication }, studioFieldMigrationExecution: { findFirst: m.execution }, studioFieldMigrationObservation: { findFirst: m.observation } } as unknown as Prisma.TransactionClient;
let registry: CapabilityRegistry, session: Session, intent: RequiredFieldMigrationIntent;
let sourceVersion: StudioDefinitionVersion, rootRow: { id: string; organisationId: string; kind: string; key: string; retiredAt: null; revision: number; latestVersion: number; activeVersionId: string; activeVersion: StudioDefinitionVersion; draft: { id: string; definitionId: string; organisationId: string; revision: number; baseVersionId: string; payload: Prisma.JsonValue } };
let fact: ReturnType<typeof vi.spyOn>, native: ReturnType<typeof vi.spyOn>;
function ref(version = 9) { const r = registry.describe("tickets.ticket", version); return { id: r.id, version, schemaHash: r.schemaHash, contractHash: r.contractHash }; }
function payload(generation: number, conditional = true, storage: FieldStorage = { type: "boolean" }, required = false): VersionedFieldPayload {
  const base = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(), storageGeneration: uuid(generation),
    field: { key: "detail", label: "Detail", classification: "confidential", storage, required } });
  return conditional ? conditionalFieldPayloadSchema.parse({ ...base, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } }] } }) : base;
}
async function prepare(source = payload(1, false), target = payload(2)) {
  rootRow = { id: root, organisationId: "company", kind: "customField", key: "tickets.ticket.detail", retiredAt: null, revision: 1, latestVersion: 1,
    activeVersionId: uuid(5), activeVersion: {} as StudioDefinitionVersion,
    draft: { id: uuid(6), definitionId: root, organisationId: "company", revision: 2, baseVersionId: uuid(5), payload: target as unknown as Prisma.JsonValue } };
  const context = { session, transaction: tx }, from = await compileFieldMigrationMetadata(context, registry, company, root, source), to = await compileFieldMigrationMetadata(context, registry, company, root, target);
  sourceVersion = { id: uuid(5), definitionId: root, organisationId: "company", version: 1, schemaVersion: source.schemaVersion,
    semanticVersion: "1.0.0", payload: from.payload as unknown as Prisma.JsonValue, compiledPlan: from.plan as unknown as Prisma.JsonValue, checksum: from.checksum, createdBy: "actor", publishedAt: new Date() };
  rootRow.activeVersion = sourceVersion;
  const query = registry.describe("tickets.ticket.field_migration", 4);
  intent = sealRequiredFieldMigrationIntent({ schemaVersion: 2, id: uuid(3), organisationId: "company", definitionId: root, definitionRevision: 1,
    principal: { ...stamp, authority: "customer" }, source: { versionId: sourceVersion.id, versionChecksum: from.checksum, payload: from.payload },
    target: { draftId: uuid(6), draftRevision: 2, compiledChecksum: to.checksum, payload: to.payload }, conversion: { kind: "same_type" },
    ownerQuery: { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash } }).intent;
  fact.mockClear(); native.mockClear(); m.value.mockClear();
  return intent;
}
async function stored(raw: unknown, written: VersionedFieldPayload = intent.source.payload) {
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, root, written);
  const version = { ...sourceVersion, schemaVersion: written.schemaVersion, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum };
  const value = { id: uuid(9), revision: 2, versionId: version.id, ...encodeFieldValue(written.field, raw), schemaVersion: version };
  m.extension.mockResolvedValue({ id: uuid(7), revision: 4, slots: [{ id: uuid(8), revision: 2, activeValueId: value.id }] });
  m.value.mockResolvedValue(value);
  return value;
}
const inspect = () => inspectRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor);
const inspectPublished = () => inspectPublishedRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor);
async function publishedFixture() {
  // Read-only unit metadata fixture, not proof of the actual publication API.
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  const observation = await observeRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor);
  const stream = requiredFieldMigrationObservationDigest(); stream.append(observation);
  const digest = stream.finish(), sealed = sealRequiredFieldMigrationReview({ ...intent, cohort: { recordCount: digest.recordCount, observationDigest: digest.observationDigest }, summary: digest.summary });
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, root, intent.target.payload);
  const target = { ...sourceVersion, id: uuid(25), version: 2, schemaVersion: intent.target.payload.schemaVersion,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  const pin = reviewedRequiredFieldPublicationPin(sealed, { id: target.id, organisationId: target.organisationId, definitionId: target.definitionId,
    version: target.version, payload: target.payload, compiledPlan: target.compiledPlan, checksum: target.checksum }, session.userId, false);
  const publication = { ...pin, state: "PUBLISHED", review: { id: intent.id, definitionId: root, organisationId: "company", review: sealed.review as unknown as Prisma.JsonValue, checksum: sealed.checksum }, targetVersion: target };
  rootRow.revision++; rootRow.latestVersion = 2; rootRow.draft.revision++; rootRow.draft.baseVersionId = target.id;
  m.publication.mockResolvedValue(publication);
  m.raw.mockImplementation(async (sql: TemplateStringsArray) => sql.join("").includes("atlas_studio_publication_fresh") ? [{ fresh: true }] : []);
  fact.mockClear(); m.value.mockClear();
  return { publication, observation };
}
beforeEach(async () => {
  vi.resetAllMocks(); session = { ...actor, capabilities: new Set(actor.capabilities) }; registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
  // Actual owner descriptors; transaction/authority/facts remain explicit unit fixtures.
  m.refresh.mockImplementation(async selected => ({ session: selected, stamp, transaction: tx, registry } satisfies FieldRuntimeAuthority));
  m.principal.mockResolvedValue(session); m.raw.mockResolvedValue([]); m.company.mockResolvedValue(company);
  m.definition.mockImplementation(async args => args.where.id === root && (args.where.revision === undefined || args.where.revision === rootRow.revision) ? rootRow : null);
  m.generation.mockImplementation(async args => ({ id: args.where.id })); m.extension.mockResolvedValue(null);
  native = vi.spyOn(registry, "authoriseRecord").mockImplementation(async (context, reference, input) => {
    await registry.resolve(context.session, reference); return { ...anchor, recordId: (input as { recordId: string }).recordId };
  });
  fact = vi.spyOn(registry, "invokeQueryInTransaction").mockResolvedValue({ ...anchor, fields: { status: "RESOLVED", priority: "NORMAL" } });
  await prepare();
});
it("reviews actual unanchored presence and condition evidence without mutations or raw facts in the archive", async () => {
  const result = await inspect();
  expect(result.convertedValue).toBeNull(); expect(result.observation).toMatchObject({ recordId: anchor.recordId, nativeRevision: 7, extension: null,
    requirement: { targetRequired: true }, result: { kind: "invalid", code: "FIELD_REQUIRED" } });
  const archive = await observeRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor);
  expect(archive).toEqual(result.observation); expect(JSON.stringify(archive)).not.toContain("RESOLVED"); expect(archive).not.toHaveProperty("convertedValue");
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  const optional = await inspect(); expect(optional.observation.result).toEqual({ kind: "valid", isNull: true, targetFingerprint: checksum(null), lossy: false });
  expect(optional.observation.requirement.targetEvaluationChecksum).not.toBe(result.observation.requirement.targetEvaluationChecksum);
});
it("keeps false and zero present and treats empty multi-selection as absent even when isNull is false", async () => {
  for (const [storage, raw] of [[{ type: "boolean" }, false], [{ type: "integer" }, 0]] as const) {
    await prepare(payload(1, false, storage), payload(2, true, storage)); await stored(raw);
    const result = await inspect(); expect(result.observation.result).toMatchObject({ kind: "valid", isNull: false }); expect(result.convertedValue?.value).toBe(raw);
  }
  const storage: FieldStorage = { type: "multi_enum", options: [{ id: "a", label: "A", retired: false }], valueSetVersion: 1, maxSelections: 2 };
  await prepare(payload(1, false, storage), payload(2, true, storage)); await stored([]);
  expect((await inspect()).observation.result).toEqual({ kind: "invalid", code: "FIELD_REQUIRED" });
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  const optional = await inspect(); expect(optional.convertedValue).toEqual({ type: "multi_enum", value: [] }); expect(optional.observation.result).toMatchObject({ kind: "valid", isNull: false });
});
it("requires real source rules and never lets a false condition relax unconditional requirements", async () => {
  await prepare(payload(1), payload(2, false)); expect((await inspect()).observation.result).toEqual({ kind: "invalid", code: "INVALID_SOURCE" });
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } }); expect((await inspect()).observation.result.kind).toBe("valid");
  await prepare(payload(1, false), payload(2, true, { type: "boolean" }, true)); expect((await inspect()).observation.result).toEqual({ kind: "invalid", code: "FIELD_REQUIRED" });
});
it("rejects source/draft/hash drift before facts or business columns and leaves the legacy entry closed", async () => {
  const saved = structuredClone(rootRow);
  for (const change of [() => { rootRow.activeVersionId = uuid(99); }, () => { rootRow.draft.revision++; },
    () => { rootRow.activeVersion.checksum = "f".repeat(64); }, () => { rootRow.draft.payload = {} as Prisma.JsonValue; }]) {
    rootRow = structuredClone(saved); change(); fact.mockClear();
    await expect(inspect()).rejects.toThrow(); expect(fact).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
  }
  await expect(observeFieldMigrationRecord({ session, transaction: tx }, registry, company, intent as unknown as Parameters<typeof observeFieldMigrationRecord>[3], anchor)).rejects.toThrow("review is invalid");
});
it("denies copied sessions through the actual authority bridge before any caller transaction query", async () => {
  const actual = await vi.importActual<typeof import("@/core/studio/fields/runtime-authority")>("@/core/studio/fields/runtime-authority");
  m.refresh.mockImplementation(actual.fieldRuntimeAuthorityInTransaction); m.raw.mockClear(); m.company.mockClear();
  await expect(inspect()).rejects.toThrow("authenticated company access"); expect(m.raw).not.toHaveBeenCalled(); expect(m.company).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
});
it("checks tenant/current identity, support Audit, production access and native owner permission before storage", async () => {
  await expect(inspectRequiredFieldMigrationRecord({ session, transaction: tx }, intent, { ...anchor, organisationId: "foreign" })).rejects.toThrow("stale or has changed");
  intent.principal.authVersion++; await expect(inspect()).rejects.toThrow("stale or has changed"); intent.principal.authVersion--;
  m.principal.mockRejectedValueOnce(new Error("FORBIDDEN: support Audit unavailable")); await expect(inspect()).rejects.toThrow("support Audit");
  m.company.mockResolvedValueOnce({ ...company, isTest: false }); await expect(inspect()).rejects.toThrow("studio.test.live_data");
  session.capabilities.delete("tickets.ticket.manage"); await expect(inspect()).rejects.toThrow("tickets.ticket.manage"); session.capabilities.add("tickets.ticket.manage");
  native.mockRejectedValueOnce(new Error("private native denied")); await expect(inspect()).rejects.toThrow("private native denied"); expect(m.value).not.toHaveBeenCalled();
  native.mockResolvedValueOnce({ ...anchor, revision: 8 }); await expect(inspect()).rejects.toThrow("stale or has changed");
});
it("rejects a retained legacy owner/query instead of reinterpreting it as format2", async () => {
  await prepare(payload(1, false), { ...payload(2), entity: ref(8) });
  await expect(inspect()).rejects.toThrow("stale or has changed"); expect(m.extension).not.toHaveBeenCalled(); expect(fact).not.toHaveBeenCalled();
});
it("authorises the written field and native/reference owner before columns/fingerprint classification", async () => {
  session.capabilities.add("tickets.field.secret");
  await stored(false, { ...intent.source.payload, field: { ...intent.source.payload.field, readCapability: "tickets.field.secret" } });
  session.capabilities.delete("tickets.field.secret");
  await expect(inspect()).rejects.toThrow("tickets.field.secret"); expect(m.value).toHaveBeenCalledTimes(1); expect(m.value.mock.calls[0][0]).toHaveProperty("select");
  m.value.mockClear(); const storedRow = await stored(false); storedRow.schemaVersion.definitionId = uuid(99);
  await expect(inspect()).rejects.toThrow("stale or has changed"); expect(m.value).toHaveBeenCalledTimes(1);
});
it("denies unavailable/stale/foreign facts before source decoding rather than making them optional", async () => {
  await stored(false);
  for (const facts of [{ ...anchor, fields: {} }, { ...anchor, revision: 8, fields: { status: "NEW" } }, { ...anchor, organisationId: "foreign", fields: { status: "NEW" } }]) {
    fact.mockResolvedValue(facts); m.value.mockClear(); await expect(inspect()).rejects.toThrow("FIELD_REQUIREMENT_INVALID"); expect(m.value).not.toHaveBeenCalled();
  }
  fact.mockRejectedValue(new Error("native facts denied")); await expect(inspect()).rejects.toThrow("native facts denied"); expect(m.value).not.toHaveBeenCalled();
});
it("keeps semantic evidence stable only for identical values/rules while exact envelopes still record revision drift", async () => {
  await stored(false); const first = await inspect();
  m.extension.mockResolvedValue({ id: uuid(7), revision: 5, slots: [{ id: uuid(8), revision: 2, activeValueId: uuid(9) }] });
  const later = await inspect(); expect(later.observation.requirement).toEqual(first.observation.requirement); expect(later.observation.extension?.revision).toBe(5);
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  expect((await inspect()).observation.requirement.targetEvaluationChecksum).not.toBe(first.observation.requirement.targetEvaluationChecksum);
  m.extension.mockResolvedValueOnce({ id: uuid(7), revision: 5 }).mockResolvedValueOnce({ id: uuid(7), revision: 6, slots: [] });
  await expect(inspect()).rejects.toThrow("stale or has changed");
});
it("records closed storage failures without bypassing actual condition access", async () => {
  const row = await stored(false); row.fingerprint = "f".repeat(64);
  expect((await inspect()).observation.result).toEqual({ kind: "invalid", code: "FIELD_STORAGE_INVALID" });
  fact.mockRejectedValue(new Error("facts denied")); await expect(inspect()).rejects.toThrow("facts denied");
});
it("uses actual current/pinned/written field inputs with independent Read, not their Write grant", async () => {
  const inputPayload = customFieldPayloadSchema.parse({ ...payload(11, false), field: { ...payload(11, false).field, key: "flag", readCapability: "tickets.field.secret", writeCapability: "tickets.field.edit" } });
  session.capabilities.add("tickets.field.secret"); session.capabilities.add("tickets.field.edit");
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, inputId, inputPayload);
  const version = { ...sourceVersion, id: uuid(15), definitionId: inputId, payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  const input = { ...rootRow, id: inputId, key: "tickets.ticket.flag", activeVersionId: version.id, activeVersion: version };
  const inputValue = { id: uuid(19), organisationId: "company", definitionId: inputId, generationId: inputPayload.storageGeneration, slotId: uuid(18), versionId: version.id, revision: 1,
    ...encodeFieldValue(inputPayload.field, true), createdBy: "actor", createdAt: new Date(), schemaVersion: version };
  m.definition.mockImplementation(async args => args.where.id === root ? rootRow : args.where.id === inputId ? input : null);
  m.version.mockResolvedValue(version);
  m.extension.mockResolvedValue({ id: uuid(7), revision: 4, slots: [] });
  m.slot.mockResolvedValue({ id: uuid(18), revision: 1, activeValueId: inputValue.id, activeValue: inputValue });
  const target = conditionalFieldPayloadSchema.parse({ ...payload(2), requiredIf: { match: "all", predicates: [
    { source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } },
    { source: { kind: "field", definitionId: inputId, versionId: version.id, checksum: version.checksum }, operator: "equals", value: { type: "boolean", value: true } },
  ] } });
  await prepare(payload(1, false), target); session.capabilities.delete("tickets.field.edit");
  const required = await inspect(); expect(required.observation.result).toEqual({ kind: "invalid", code: "FIELD_REQUIRED" });
  Object.assign(inputValue, encodeFieldValue(inputPayload.field, false));
  const optional = await inspect(); expect(optional.observation.result.kind).toBe("valid"); expect(optional.observation.requirement.targetEvaluationChecksum).not.toBe(required.observation.requirement.targetEvaluationChecksum);
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } }); session.capabilities.delete("tickets.field.secret"); m.value.mockClear(); m.slot.mockClear();
  await expect(inspect()).rejects.toThrow("tickets.field.secret"); expect(m.value).not.toHaveBeenCalled(); expect(m.slot).not.toHaveBeenCalled();
  session.capabilities.add("tickets.field.secret"); version.checksum = "f".repeat(64);
  await expect(inspect()).rejects.toThrow("sealed field metadata changed");
});
it("keeps independent reference denials ahead of corrupt fingerprint classification", async () => {
  const storage: FieldStorage = { type: "reference", entity: ref(8) };
  await prepare(payload(1, false, storage), payload(2, true, storage));
  const row = await stored("private-reference"); row.fingerprint = "f".repeat(64);
  native.mockImplementation(async (...[context, reference, input]: Parameters<CapabilityRegistry["authoriseRecord"]>) => {
    await registry.resolve(context.session, reference); const recordId = (input as { recordId: string }).recordId;
    if (recordId === "private-reference") throw new Error("reference owner denied");
    return { ...anchor, recordId };
  });
  await expect(inspect()).rejects.toThrow("reference owner denied");
  row.referenceValue = null; await expect(inspect()).rejects.toThrow("stale or has changed");
});
it("reads a retained conditional written schema without changing its rule or inventing a value", async () => {
  await prepare(payload(1), payload(2)); await stored(false);
  const row = await inspect(); expect(row.convertedValue).toEqual({ type: "boolean", value: false }); expect(row.observation.result.kind).toBe("valid");
  expect(fact).toHaveBeenCalledTimes(2);
});
it("reinspects a source-active publication using exact review/target pins and private preflight before SQL/value freshness", async () => {
  const { observation } = await publishedFixture();
  expect((await inspectPublished()).observation).toEqual(observation);
  expect(await observePublishedRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor)).toEqual(observation);
  expect(m.definition).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ revision: intent.definitionRevision + 1 }) }));
  expect(m.publication).toHaveBeenCalledWith(expect.objectContaining({ where: { preparationId: intent.id, organisationId: "company", definitionId: root, state: "PUBLISHED" } }));
  const preflight = fact.mock.calls.findIndex((call: Parameters<CapabilityRegistry["invokeQueryInTransaction"]>) => (call[2] as { mode: string }).mode === "preflight");
  const freshness = m.raw.mock.calls.findIndex(call => (call[0] as TemplateStringsArray).join("").includes("atlas_studio_publication_fresh"));
  expect(fact.mock.invocationCallOrder[preflight]).toBeLessThan(m.raw.mock.invocationCallOrder[freshness]);
  await expect(inspect()).rejects.toThrow("stale or has changed");
});
it("rejects changed publication identity, frozen target and saved draft lineage before reading source values", async () => {
  const { publication } = await publishedFixture(), savedRoot = structuredClone(rootRow), saved = structuredClone(publication);
  const mutations = [() => { rootRow.revision++; }, () => { rootRow.draft.revision++; }, () => { rootRow.draft.baseVersionId = uuid(99); },
    () => { rootRow.latestVersion++; }, () => { publication.review.organisationId = "foreign"; }, () => { publication.review.id = uuid(99); },
    () => { publication.review.checksum = "f".repeat(64); }, () => { publication.targetVersion.schemaVersion = 1; },
    () => { publication.targetVersion.createdBy = "another"; }, () => { publication.targetVersion.payload = {} as Prisma.JsonValue; },
    () => { publication.targetVersion.compiledPlan = {}; }, () => { publication.targetGenerationId = uuid(99); }, () => { publication.publisherUserId = "another"; }];
  for (const mutate of mutations) {
    rootRow = structuredClone(savedRoot); Object.assign(publication, structuredClone(saved)); mutate(); m.value.mockClear();
    await expect(inspectPublished()).rejects.toThrow(); expect(m.value).not.toHaveBeenCalled();
  }
});
it("denies missing or stale publications and private/native/condition access without allowing execution-stage fallback", async () => {
  await publishedFixture();
  m.publication.mockResolvedValueOnce(null); await expect(inspectPublished()).rejects.toThrow("stale or has changed");
  m.raw.mockImplementation(async (sql: TemplateStringsArray) => sql.join("").includes("atlas_studio_publication_fresh") ? [{ fresh: false }] : []);
  await expect(inspectPublished()).rejects.toThrow("stale or has changed"); expect(m.value).not.toHaveBeenCalled();
  m.raw.mockImplementation(async (sql: TemplateStringsArray) => sql.join("").includes("atlas_studio_publication_fresh") ? [{ fresh: true }] : []);
  fact.mockRejectedValueOnce(new Error("private cohort denied")); await expect(inspectPublished()).rejects.toThrow("private cohort denied");
  native.mockResolvedValueOnce({ ...anchor, revision: 8 }); await expect(inspectPublished()).rejects.toThrow("stale or has changed");
  fact.mockImplementation(async (...[_context, _reference, input]: Parameters<CapabilityRegistry["invokeQueryInTransaction"]>) => (input as { mode: string }).mode === "preflight" ? {} : { ...anchor, fields: {} });
  await expect(inspectPublished()).rejects.toThrow("FIELD_REQUIREMENT_INVALID"); expect(m.value).not.toHaveBeenCalled();
  const actual = await vi.importActual<typeof import("@/core/studio/fields/runtime-authority")>("@/core/studio/fields/runtime-authority");
  m.refresh.mockImplementation(actual.fieldRuntimeAuthorityInTransaction); m.raw.mockClear();
  await expect(inspectPublished()).rejects.toThrow("authenticated company access"); expect(m.raw).not.toHaveBeenCalled();
});
it("locks exact publication coverage without preparation fallback and rejects changed source pointers or denied owner coverage", async () => {
  let fresh = true, changed = false;
  m.version.mockResolvedValue([]);
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => {
    const sql = strings.join("");
    if (sql.includes("atlas_studio_publication_fresh")) return [{ fresh }];
    if (sql.includes("SELECT EXISTS")) return [{ changed }];
    return [];
  });
  const run = () => validatePublishedRequiredFieldMigrationSourceCoverage({ session, transaction: tx }, registry, company, intent);
  await expect(run()).resolves.toBeUndefined();
  const receipt = m.raw.mock.calls.find(call => (call[0] as TemplateStringsArray).join("").includes("atlas_studio_publication_fresh"));
  expect(receipt?.slice(1)).toEqual([intent.id, session.organisationId, checksum(intent)]);
  expect((receipt?.[0] as TemplateStringsArray).join("")).toContain("p.state='REVIEWED' AND pub.state='PUBLISHED'");
  expect(m.raw.mock.calls.some(call => (call[0] as TemplateStringsArray).join("").includes("atlas_studio_migration_fresh"))).toBe(false);
  fresh = false; await expect(run()).rejects.toThrow("stale or has changed"); fresh = true;
  changed = true; await expect(run()).rejects.toThrow("stale or has changed"); changed = false;
  fact.mockRejectedValueOnce(new Error("private cohort denied")); m.raw.mockClear(); await expect(run()).rejects.toThrow("private cohort denied");
  expect(m.raw.mock.calls.some(call => (call[0] as TemplateStringsArray).join("").includes("FOR SHARE OF e"))).toBe(false);
  m.raw.mockClear(); await expect(validateFieldMigrationSourceCoverage({ session, transaction: tx }, registry, company,
    intent as unknown as Parameters<typeof validateFieldMigrationSourceCoverage>[3], "execution")).rejects.toThrow("review is invalid");
  expect(m.raw).not.toHaveBeenCalled();
  await expect(validateRequiredFieldMigrationSourceCoverage({ session, transaction: tx }, registry, company, intent)).rejects.toThrow("stale or has changed");
});

function executionCoverageFixture() {
  // Real coverage service/owner descriptors, explicit SQL and private-authority
  // unit fixtures. This does not prove real protocol2 start or batch execution.
  const approval = registry.describe("tickets.ticket.field_representation", 2);
  const reference = { id: approval.id, version: approval.version, schemaHash: approval.schemaHash, contractHash: approval.contractHash };
  const state = { fresh: true, sourceChanged: false, approval: reference as unknown };
  m.version.mockResolvedValue([]);
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => {
    const sql = strings.join("");
    if (sql.includes("atlas_studio_execution_fresh")) return [{ fresh: state.fresh, ownerApproval: state.approval }];
    if (sql.includes("atlas_studio_execution_source_fresh")) return [{ changed: state.sourceChanged }];
    return [];
  });
  return { state, run: () => validateExecutingRequiredFieldMigrationSourceCoverage({ session, transaction: tx }, registry, company, intent) };
}

it("uses actual source-active execution coverage after private preflight without invoking the preparation/publication predicates", async () => {
  const { run } = executionCoverageFixture();
  await expect(run()).resolves.toBeUndefined();
  const sql = m.raw.mock.calls.map(call => (call[0] as TemplateStringsArray).join(""));
  const freshIndex = sql.findIndex(text => text.includes("atlas_studio_execution_fresh"));
  expect(freshIndex).toBeGreaterThan(0);
  expect(sql[freshIndex]).toContain("x.state IN ('RUNNING','READY','FAILED')");
  expect(m.raw.mock.calls[freshIndex].slice(1)).toEqual([intent.id, session.organisationId, checksum(intent)]);
  expect(sql.some(text => text.includes("atlas_studio_execution_source_fresh"))).toBe(true);
  expect(sql.some(text => text.includes("atlas_studio_migration_fresh") || text.includes("atlas_studio_publication_fresh") || text.includes("SELECT EXISTS"))).toBe(false);
  expect(fact.mock.calls[0][2]).toEqual({ mode: "preflight" });
  expect(fact.mock.invocationCallOrder[0]).toBeLessThan(m.raw.mock.invocationCallOrder[freshIndex]);
  expect(fact.mock.calls[1][2]).toEqual({ mode: "coverage", preparationId: intent.id });
  expect(m.value).not.toHaveBeenCalled();
});

it("denies conditional execution lineage drift, obsolete owning representation approval and source/private coverage failure", async () => {
  const { run, state } = executionCoverageFixture();
  state.fresh = false; await expect(run()).rejects.toThrow("stale or has changed"); state.fresh = true;
  state.sourceChanged = true; await expect(run()).rejects.toThrow("stale or has changed"); state.sourceChanged = false;
  const exact = state.approval, obsolete = registry.describe("tickets.ticket.field_representation", 1);
  state.approval = { id: obsolete.id, version: obsolete.version, schemaHash: obsolete.schemaHash, contractHash: obsolete.contractHash };
  await expect(run()).rejects.toThrow("stale or has changed"); state.approval = exact;
  fact.mockRejectedValueOnce(new Error("private preflight denied")); m.raw.mockClear();
  await expect(run()).rejects.toThrow("private preflight denied");
  expect(m.raw.mock.calls.some(call => (call[0] as TemplateStringsArray).join("").includes("atlas_studio_execution_fresh"))).toBe(false);
  expect(m.version).not.toHaveBeenCalled();
  fact.mockImplementationOnce(async () => undefined).mockRejectedValueOnce(new Error("native cohort changed")); m.raw.mockClear();
  await expect(run()).rejects.toThrow("native cohort changed");
  expect(m.raw.mock.calls.some(call => (call[0] as TemplateStringsArray).join("").includes("FOR SHARE OF e"))).toBe(false);
  expect(m.value).not.toHaveBeenCalled();
});

it("keeps current and written field permissions and tenant/owner protocol requirements during conditional execution coverage", async () => {
  const { run } = executionCoverageFixture();
  const exact = session;
  session = { ...session, organisationId: "other" }; m.raw.mockClear();
  await expect(run()).rejects.toThrow("stale or has changed"); expect(m.raw).not.toHaveBeenCalled(); session = exact;
  session = { ...exact, capabilities: new Set(["studio.definition.publish", "tickets.ticket.read"]) };
  await expect(run()).rejects.toThrow("tickets.ticket.manage"); session = exact;
  await expect(validateExecutingRequiredFieldMigrationSourceCoverage({ session, transaction: tx }, registry, { ...company, isTest: false }, intent)).rejects.toThrow("studio.test.live_data");
  const written = structuredClone(intent.source.payload); written.field.readCapability = "tickets.field.secret";
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => {
    const sql = strings.join("");
    if (sql.includes("atlas_studio_execution_fresh")) {
      const approval = registry.describe("tickets.ticket.field_representation", 2);
      return [{ fresh: true, ownerApproval: { id: approval.id, version: approval.version, schemaHash: approval.schemaHash, contractHash: approval.contractHash } }];
    }
    if (sql.includes("atlas_studio_execution_source_fresh")) return [{ changed: false }];
    if (sql.includes("SELECT DISTINCT")) return [{ versionId: sourceVersion.id }];
    return [];
  });
  m.version.mockResolvedValue([{ ...sourceVersion, payload: written }]);
  await expect(run()).rejects.toThrow("tickets.field.secret"); expect(m.value).not.toHaveBeenCalled();
});

// Actual observer/codec/compiler/current-owner bodies; authority, transaction and
// immutable archive/outcomes are explicit unit fixtures, not runtime execution.
async function executingFixture(mode: "anchored" | "unanchored" | "empty-slot" = "anchored", converted = true) {
  if (mode === "anchored") await stored(false);
  if (mode === "empty-slot") m.extension.mockResolvedValue({ id: uuid(7), revision: 4, slots: [] });
  const { publication, observation } = await publishedFixture();
  const sealed = { review: publication.review.review, checksum: publication.review.checksum };
  const owner = registry.describe("tickets.ticket", 9), approval = registry.describe("tickets.ticket.field_representation", 2);
  const { review: excludedReview, targetVersion, state: excludedState, ...publicationPin } = publication;
  void excludedReview; void excludedState;
  const expected = createRequiredFieldMigrationExecutionPin(sealed, { id: targetVersion.id, organisationId: targetVersion.organisationId, definitionId: targetVersion.definitionId,
    version: targetVersion.version, checksum: targetVersion.checksum, payload: targetVersion.payload, compiledPlan: targetVersion.compiledPlan }, publicationPin, owner, approval);
  const execution = { preparationId: intent.id, organisationId: "company", definitionId: root, entityId: "tickets.ticket",
    pin: expected.pin, pinChecksum: expected.checksum, state: "RUNNING", revision: converted ? 1 : 0,
    cursor: converted ? anchor.recordId : null, processedCount: converted ? 1 : 0, failureCode: null };
  const row = { id: uuid(30), preparationId: intent.id, organisationId: "company", definitionId: root, entityId: "tickets.ticket",
    sourceGenerationId: intent.source.payload.storageGeneration, recordId: anchor.recordId, nativeRevision: anchor.revision,
    extensionId: observation.extension?.id ?? null, extensionRevision: observation.extension?.revision ?? null,
    slotId: observation.extension?.slot?.id ?? null, slotRevision: observation.extension?.slot?.revision ?? null,
    valueId: observation.extension?.slot?.value?.id ?? null, observation, outcome: null as unknown };
  const target = { id: uuid(33), revision: 1, versionId: targetVersion.id,
    ...encodeFieldValue(intent.target.payload.field, mode === "anchored" ? false : null), schemaVersion: targetVersion };
  let outcome: ReturnType<typeof createRequiredFieldMigrationOutcomePin> | undefined;
  if (converted) {
    outcome = createRequiredFieldMigrationOutcomePin(expected.pin, sealed, { id: row.id, preparationId: row.preparationId,
      organisationId: row.organisationId, definitionId: row.definitionId, entityId: row.entityId, sourceGenerationId: row.sourceGenerationId,
      recordId: row.recordId, nativeRevision: row.nativeRevision, observation }, { extensionId: observation.extension?.id ?? uuid(31), slotId: uuid(32), valueId: target.id });
    row.outcome = { ...outcome, extensionId: outcome.target.extensionId, extensionRevision: outcome.target.extensionRevision,
      targetSlotId: outcome.target.slotId, targetValueId: outcome.target.valueId, targetFingerprint: outcome.target.fingerprint,
      targetIsNull: outcome.target.isNull, outcome };
  }
  const envelope = { id: outcome?.target.extensionId ?? observation.extension?.id ?? uuid(31), revision: outcome?.target.extensionRevision ?? observation.extension?.revision ?? 1 };
  m.extension.mockImplementation(async args => {
    if (!converted && mode === "unanchored") return null;
    const targetRead = args.select?.slots?.where.generationId === intent.target.payload.storageGeneration;
    const slots = targetRead ? converted ? [{ id: uuid(32), revision: 1, activeValueId: target.id }] : []
      : mode === "anchored" ? [{ id: uuid(8), revision: 2, activeValueId: uuid(9) }] : [];
    return { ...envelope, slots };
  });
  m.value.mockImplementation(async args => args.where.generationId === intent.target.payload.storageGeneration ? target : null);
  // Preserve the actual encoded source/version for metadata and full column reads.
  if (mode === "anchored") {
    const written = { ...sourceVersion, schemaVersion: intent.source.payload.schemaVersion };
    const source = { id: uuid(9), revision: 2, versionId: written.id, ...encodeFieldValue(intent.source.payload.field, false), schemaVersion: written };
    m.value.mockImplementation(async args => args.where.generationId === intent.target.payload.storageGeneration ? target : source);
  }
  m.execution.mockResolvedValue(execution); m.observation.mockResolvedValue(row);
  const freshness = { fresh: true };
  m.raw.mockImplementation(async sql => (sql as TemplateStringsArray).join("").includes("atlas_studio_execution_fresh") ? [{ fresh: freshness.fresh }] : []);
  m.raw.mockClear(); m.value.mockClear(); fact.mockClear();
  return { row, execution, envelope, target, publication, observation, freshness };
}
const inspectExecuting = () => inspectExecutingRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor);

it("reinspects unchanged unconverted execution rows under execution freshness without publication fallback", async () => {
  const fixture = await executingFixture("anchored", false);
  expect((await inspectExecuting()).observation).toEqual(fixture.observation);
  expect(await observeExecutingRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor)).toEqual(fixture.observation);
  const sql = m.raw.mock.calls.map(call => (call[0] as TemplateStringsArray).join(""));
  expect(sql.some(value => value.includes("atlas_studio_execution_fresh"))).toBe(true);
  expect(sql.some(value => value.includes("atlas_studio_publication_fresh"))).toBe(false);
  fixture.row.outcome = null; fixture.envelope.revision++;
  await expect(inspectExecuting()).rejects.toThrow();
});

it("proves own converted anchored, newly anchored and previously empty-slot envelopes before restoring archive meaning", async () => {
  for (const mode of ["anchored", "unanchored", "empty-slot"] as const) {
    m.extension.mockResolvedValue(null); await prepare();
    const fixture = await executingFixture(mode);
    const current = await inspectExecuting();
    expect(current.observation).toEqual(fixture.observation);
    expect(current.convertedValue).toEqual(mode === "anchored" ? { type: "boolean", value: false } : null);
    expect(m.value.mock.calls.some(call => call[0].where.generationId === intent.target.payload.storageGeneration && !call[0].select)).toBe(true);
    fixture.envelope.revision++;
    await expect(inspectExecuting()).rejects.toThrow("stale or has changed");
  }
});

it("rejects missing execution, progress/pin/archive/outcome mirrors and false SQL freshness before accepting lineage", async () => {
  const fixture = await executingFixture(), savedRow = structuredClone(fixture.row), savedExecution = structuredClone(fixture.execution);
  const mutations = [() => { fixture.execution.pinChecksum = "f".repeat(64); }, () => { fixture.execution.pin.publication.reviewChecksum = "f".repeat(64); },
    () => { fixture.execution.processedCount = 2; }, () => { fixture.row.organisationId = "foreign"; }, () => { fixture.row.extensionRevision = 6; },
    () => { fixture.row.outcome = null; }, () => { (fixture.row.outcome as { observationChecksum: string }).observationChecksum = "f".repeat(64); },
    () => { (fixture.row.outcome as { outcome: { target: { extensionRevision: number } } }).outcome.target.extensionRevision++; },
    () => { (fixture.row.outcome as { targetVersionId: string }).targetVersionId = uuid(99); }];
  for (const mutate of mutations) {
    Object.assign(fixture.row, structuredClone(savedRow)); Object.assign(fixture.execution, structuredClone(savedExecution)); mutate();
    await expect(inspectExecuting()).rejects.toThrow();
  }
  Object.assign(fixture.row, structuredClone(savedRow)); Object.assign(fixture.execution, structuredClone(savedExecution));
  m.execution.mockResolvedValueOnce(null); await expect(inspectExecuting()).rejects.toThrow();
  fixture.freshness.fresh = false; m.value.mockClear(); await expect(inspectExecuting()).rejects.toThrow(); expect(m.value).not.toHaveBeenCalled();
});

it("independently decodes actual targets and rejects content, written policy, pointer and native/condition drift", async () => {
  const fixture = await executingFixture(), saved = structuredClone(fixture.target);
  fixture.target.booleanValue = true; await expect(inspectExecuting()).rejects.toThrow("stale or has changed");
  Object.assign(fixture.target, structuredClone(saved)); fixture.target.versionId = uuid(99); await expect(inspectExecuting()).rejects.toThrow();
  Object.assign(fixture.target, structuredClone(saved)); fixture.target.revision = 2; await expect(inspectExecuting()).rejects.toThrow();
  Object.assign(fixture.target, structuredClone(saved));
  fact.mockResolvedValue({ ...anchor, fields: { status: "RESOLVED", priority: "NORMAL" } }); await expect(inspectExecuting()).rejects.toThrow();
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  native.mockResolvedValueOnce({ ...anchor, revision: 8 }); await expect(inspectExecuting()).rejects.toThrow();
  fixture.target.schemaVersion.payload = { ...intent.target.payload, field: { ...intent.target.payload.field, readCapability: "tickets.field.secret" } } as unknown as Prisma.JsonValue;
  m.value.mockClear(); await expect(inspectExecuting()).rejects.toThrow("tickets.field.secret");
  const targetCalls = m.value.mock.calls.filter(call => call[0].where.generationId === intent.target.payload.storageGeneration);
  expect(targetCalls).toHaveLength(1); expect(targetCalls[0][0]).toHaveProperty("select");
});

it("retains tenant, genuine authority and private preflight denials before execution freshness or typed columns", async () => {
  await executingFixture();
  fact.mockRejectedValueOnce(new Error("private cohort denied"));
  await expect(inspectExecuting()).rejects.toThrow("private cohort denied"); expect(m.value).not.toHaveBeenCalled();
  expect(m.raw.mock.calls.some(call => (call[0] as TemplateStringsArray).join("").includes("atlas_studio_execution_fresh"))).toBe(false);
  const exact = session; session = { ...exact, organisationId: "foreign" }; await expect(inspectExecuting()).rejects.toThrow(); session = exact;
  const actual = await vi.importActual<typeof import("@/core/studio/fields/runtime-authority")>("@/core/studio/fields/runtime-authority");
  m.refresh.mockImplementation(actual.fieldRuntimeAuthorityInTransaction); m.raw.mockClear();
  await expect(inspectExecuting()).rejects.toThrow("authenticated company access"); expect(m.raw).not.toHaveBeenCalled();
});

it("requires exact source pointers and supports conditional rule removal without choosing protocol from the target schema", async () => {
  await prepare(payload(1), payload(2, false));
  const fixture = await executingFixture();
  expect((await inspectExecuting()).observation).toEqual(fixture.observation);
  expect(fixture.publication.targetVersion.schemaVersion).toBe(1);
  const extensionRead = m.extension.getMockImplementation()!;
  m.extension.mockImplementation(async args => {
    const actual = await extensionRead(args);
    if (args.select?.slots?.where.generationId === intent.source.payload.storageGeneration && actual) {
      actual.slots[0].revision++;
    }
    return actual;
  });
  await expect(inspectExecuting()).rejects.toThrow();
});

it("evaluates a custom-field condition against the actual converted envelope and its independent Read grant", async () => {
  const inputPayload = customFieldPayloadSchema.parse({ ...payload(11, false), field: { ...payload(11, false).field,
    key: "flag", readCapability: "tickets.field.secret", writeCapability: "tickets.field.edit" } });
  session.capabilities.add("tickets.field.secret"); session.capabilities.add("tickets.field.edit");
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, inputId, inputPayload);
  const version = { ...sourceVersion, id: uuid(15), definitionId: inputId, payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  const input = { ...rootRow, id: inputId, key: "tickets.ticket.flag", activeVersionId: version.id, activeVersion: version };
  const inputValue = { id: uuid(19), organisationId: "company", definitionId: inputId, generationId: inputPayload.storageGeneration,
    slotId: uuid(18), versionId: version.id, revision: 1, ...encodeFieldValue(inputPayload.field, false),
    createdBy: "actor", createdAt: new Date(), schemaVersion: version };
  m.definition.mockImplementation(async args => args.where.id === root ? rootRow : args.where.id === inputId ? input : null);
  m.version.mockResolvedValue(version);
  m.slot.mockResolvedValue({ id: uuid(18), revision: 1, activeValueId: inputValue.id, activeValue: inputValue });
  const target = conditionalFieldPayloadSchema.parse({ ...payload(2), requiredIf: { match: "all", predicates: [
    { source: { kind: "field", definitionId: inputId, versionId: version.id, checksum: version.checksum }, operator: "equals", value: { type: "boolean", value: true } },
  ] } });
  await prepare(payload(1, false), target);
  const fixture = await executingFixture("empty-slot");
  session.capabilities.delete("tickets.field.edit");
  expect((await inspectExecuting()).observation).toEqual(fixture.observation);
  session.capabilities.delete("tickets.field.secret"); m.value.mockClear(); m.slot.mockClear();
  await expect(inspectExecuting()).rejects.toThrow("tickets.field.secret");
  expect(m.value).not.toHaveBeenCalled(); expect(m.slot).not.toHaveBeenCalled();
  session.capabilities.add("tickets.field.secret"); fixture.envelope.revision++;
  await expect(inspectExecuting()).rejects.toThrow();
});


// Post-cutover metadata inspector is an explicit unit collaborator. The actual
// authority/compiler/condition/source/target decoder and own-outcome bodies run;
// actual SQL/receipt orchestration is verified in the separate identity suite.
async function cutoverFixture(mode: "anchored" | "unanchored" | "empty-slot" = "anchored") {
  const f = await executingFixture(mode);
  f.execution.state = "READY";
  rootRow.revision++;
  rootRow.activeVersionId = f.publication.targetVersion.id;
  rootRow.activeVersion = f.publication.targetVersion;
  f.publication.state = "CUTOVER";
  m.version.mockImplementation(async args => args.where.id === sourceVersion.id ? sourceVersion : null);
  m.cutover.mockResolvedValue({ stored: { review: f.publication.review.review, checksum: f.publication.review.checksum },
    existing: f.execution, target: f.publication.targetVersion, executionPin: f.execution.pin });
  return f;
}
const inspectCutover = () => inspectCutoverRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor);
it("reinspects actual target-active cutover rows using retained source and all own outcomes without source-active fallback", async () => {
  for (const mode of ["anchored", "unanchored", "empty-slot"] as const) {
    m.extension.mockResolvedValue(null); await prepare();
    const f = await cutoverFixture(mode);
    expect((await inspectCutover()).observation).toEqual(f.observation);
    expect(await observeCutoverRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor)).toEqual(f.observation);
    expect(m.definition).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ revision: intent.definitionRevision + 2 }) }));
    expect(m.version).toHaveBeenCalledWith(expect.objectContaining({ where: { id: intent.source.versionId, definitionId: root, organisationId: "company" } }));
    expect(m.publication).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ state: "CUTOVER" }) }));
    expect(m.execution).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ state: { in: ["READY"] } }) }));
    expect(m.cutover).toHaveBeenCalledWith(tx, intent);
    expect(m.value.mock.calls.some(call => call[0].where.generationId === intent.target.payload.storageGeneration && !call[0].select)).toBe(true);
    expect(m.raw.mock.calls.some(call => /atlas_studio_(execution|publication|migration)_fresh\(/.test((call[0] as TemplateStringsArray).join("")))).toBe(false);
    await expect(inspectExecuting()).rejects.toThrow();
  }
});
it("denies cutover source-active or stale metadata and missing own outcomes rather than normalising an unexplained envelope", async () => {
  const f = await cutoverFixture(), saved = structuredClone(rootRow);
  for (const mutate of [() => { rootRow.revision--; }, () => { rootRow.activeVersionId = sourceVersion.id; rootRow.activeVersion = sourceVersion; },
    () => { rootRow.draft.baseVersionId = uuid(99); }]) {
    rootRow = structuredClone(saved); mutate(); m.value.mockClear();
    await expect(inspectCutover()).rejects.toThrow(); expect(m.value).not.toHaveBeenCalled();
  }
  rootRow = structuredClone(saved);
  m.version.mockResolvedValueOnce({ ...sourceVersion, schemaVersion: 2 }); m.value.mockClear();
  await expect(inspectCutover()).rejects.toThrow(); expect(m.value).not.toHaveBeenCalled();
  const outcome = f.row.outcome; f.row.outcome = null;
  await expect(inspectCutover()).rejects.toThrow(); f.row.outcome = outcome;
  f.envelope.revision++; await expect(inspectCutover()).rejects.toThrow();
});
it("requires owning private preflight before cutover freshness and denies retained receipt or native/condition/typed target drift", async () => {
  const f = await cutoverFixture(); m.value.mockClear();
  fact.mockRejectedValueOnce(new Error("private cutover preflight denied"));
  await expect(inspectCutover()).rejects.toThrow("private cutover preflight denied");
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
  m.cutover.mockRejectedValueOnce(new Error("cutover receipt changed"));
  await expect(inspectCutover()).rejects.toThrow("cutover receipt changed"); expect(m.value).not.toHaveBeenCalled();
  fact.mockResolvedValue({ ...anchor, fields: { status: "RESOLVED", priority: "NORMAL" } });
  await expect(inspectCutover()).rejects.toThrow();
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  f.target.booleanValue = true; await expect(inspectCutover()).rejects.toThrow();
});
it("keeps cutover protocol2 while removing a source rule into a schema1 target", async () => {
  await prepare(payload(1), payload(2, false));
  const f = await cutoverFixture();
  expect(f.publication.targetVersion.schemaVersion).toBe(1);
  expect((await inspectCutover()).observation).toEqual(f.observation);
  session.capabilities.delete("tickets.ticket.manage"); m.value.mockClear();
  await expect(inspectCutover()).rejects.toThrow("tickets.ticket.manage"); expect(m.value).not.toHaveBeenCalled();
});

it("keeps cutover coverage private preflight before lineage, exact source SQL and current owning representation approval", async () => {
  const f = await cutoverFixture();
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("").includes("NOT atlas_studio_execution_source_fresh") ? [{ changed: false }] : []);
  m.version.mockImplementation(async args => typeof args.where.id === "object" ? [] : args.where.id === sourceVersion.id ? sourceVersion : null);
  const run = () => validateCutoverRequiredFieldMigrationSourceCoverage({ session, transaction: tx }, registry, company, intent);
  await expect(run()).resolves.toBeUndefined();
  const preflight = fact.mock.calls.findIndex((call: Parameters<CapabilityRegistry["invokeQueryInTransaction"]>) => (call[2] as { mode: string }).mode === "preflight");
  expect(fact.mock.invocationCallOrder[preflight]).toBeLessThan(m.cutover.mock.invocationCallOrder[0]);
  const sourceSQL = m.raw.mock.calls.find(call => (call[0] as TemplateStringsArray).join("").includes("NOT atlas_studio_execution_source_fresh"));
  expect(sourceSQL?.[0].join("")).toContain("pub.state='CUTOVER' AND c.state='ACTIVATED'");
  m.cutover.mockClear(); fact.mockRejectedValueOnce(new Error("cutover private cohort denied"));
  await expect(run()).rejects.toThrow("cutover private cohort denied"); expect(m.cutover).not.toHaveBeenCalled();
  const old = registry.describe("tickets.ticket.field_representation", 1);
  f.execution.pin.ownerApproval = { id: old.id, version: old.version, schemaHash: old.schemaHash, contractHash: old.contractHash };
  await expect(run()).rejects.toThrow();
});

function currentSettler() {
  session = { ...session, userId: "current-settler", membershipId: "current-membership", capabilities: new Set(session.capabilities) };
  const principal = { organisationId: "company", userId: session.userId, membershipId: session.membershipId, authVersion: 11, sessionVersion: 12, authority: "customer" as const };
  m.refresh.mockImplementation(async selected => ({ session: selected, stamp: principal, transaction: tx, registry } satisfies FieldRuntimeAuthority));
  m.principal.mockImplementation(async selected => { if (selected.userId === intent.principal.userId) throw new Error("original creator revoked"); return session; });
  return { session, principal, company, transaction: tx };
}
it("proves rollback under a different current settler even when original creator authority is revoked, preserving every original pin", async () => {
  const f = await cutoverFixture(), originalIntent = structuredClone(intent), authority = currentSettler();
  m.principal.mockClear(); fact.mockClear(); native.mockClear();
  const inspected = await inspectRollbackRequiredFieldMigrationRecord(authority, intent, anchor);
  expect(inspected.observation).toEqual(f.observation);
  expect(await observeRollbackRequiredFieldMigrationRecord(authority, intent, anchor)).toEqual(f.observation);
  expect(intent).toEqual(originalIntent); expect(f.publication.publisherUserId).toBe("actor"); expect(f.publication.targetVersion.createdBy).toBe("actor");
  expect(m.principal.mock.calls.every(([principal]) => principal.userId === "current-settler")).toBe(true);
  expect(fact.mock.calls.every((call: Parameters<CapabilityRegistry["invokeQueryInTransaction"]>) => call[0].session.userId === "current-settler")).toBe(true);
  expect(native.mock.calls.every((call: Parameters<CapabilityRegistry["authoriseRecord"]>) => call[0].session.userId === "current-settler")).toBe(true);
  await expect(inspectCutover()).rejects.toThrow();
  f.publication.targetVersion.createdBy = "current-settler";
  await expect(inspectRollbackRequiredFieldMigrationRecord(authority, intent, anchor)).rejects.toThrow();
});
it("denies current rollback stamp/support/private and required input access before target columns without borrowing creator grants", async () => {
  await cutoverFixture(); const authority = currentSettler(); m.value.mockClear(); m.cutover.mockClear();
  await expect(inspectRollbackRequiredFieldMigrationRecord({ ...authority, principal: { ...authority.principal, authVersion: 10 } }, intent, anchor)).rejects.toThrow();
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
  m.principal.mockRejectedValueOnce(new Error("current support Audit unavailable"));
  await expect(inspectRollbackRequiredFieldMigrationRecord(authority, intent, anchor)).rejects.toThrow("current support Audit unavailable");
  expect(m.value).not.toHaveBeenCalled();
  fact.mockRejectedValueOnce(new Error("current private scope denied"));
  await expect(inspectRollbackRequiredFieldMigrationRecord(authority, intent, anchor)).rejects.toThrow("current private scope denied"); expect(m.value).not.toHaveBeenCalled();
  session.capabilities.delete("tickets.ticket.manage");
  await expect(inspectRollbackRequiredFieldMigrationRecord(authority, intent, anchor)).rejects.toThrow("tickets.ticket.manage"); expect(m.value).not.toHaveBeenCalled();
});
it("different-settler rollback coverage keeps actual sealed2, private preflight and original source/cohort guards", async () => {
  const f = await cutoverFixture(), authority = currentSettler();
  m.version.mockImplementation(async args => typeof args.where.id === "object" ? [] : args.where.id === sourceVersion.id ? sourceVersion : null);
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("").includes("NOT atlas_studio_execution_source_fresh") ? [{ changed: false }] : []);
  const run = () => validateRollbackRequiredFieldMigrationSourceCoverage(authority, intent);
  await expect(run()).resolves.toBeUndefined(); expect(m.cutover).toHaveBeenCalledWith(tx, intent);
  expect(f.execution.pin.publication.publisherUserId).toBe("actor");
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("").includes("NOT atlas_studio_execution_source_fresh") ? [{ changed: true }] : []);
  await expect(run()).rejects.toThrow();
  m.cutover.mockClear(); m.principal.mockRejectedValueOnce(new Error("current access revoked"));
  await expect(run()).rejects.toThrow("current access revoked"); expect(m.cutover).not.toHaveBeenCalled();
});
