import { beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Prisma, StudioDefinition, StudioDefinitionVersion, StudioFieldValue } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), refresh: vi.fn(), raw: vi.fn(), definition: vi.fn(), definitions: vi.fn(), version: vi.fn(), generation: vi.fn(), extension: vi.fn(), slot: vi.fn(), facts: vi.fn(), bases: vi.fn(), profileBinding: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member } } }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
import { sessionForUser, sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { checksum, query } from "@/core/studio/registry/contracts";
import { ticketStudioContract } from "@/core/service-work/studio";
import { entityDetailsSchema, nativeValidationRequestSchema } from "@/core/studio/registry/entities";
import { nativeRequiredResultSchema } from "@/core/studio/fields/required-inputs";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { validateNativeResultingFieldRequirements, validateResultingFieldRequirements } from "@/core/studio/fields/required-runtime";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { entityProfilePayloadSchema } from "@/core/studio/record-types/schema";
import { resolveEntityProfile } from "@/core/studio/record-types/resolver";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { ContractReference, NativeValidationRequest, RecordContext } from "@/core/studio/registry/types";

// Real authenticated Session issuance, registry/fact declarations, sealed plans,
// compilers/readers/provider/evaluator/codec. SQL and explicit live owner proof
// collaborator are mocked: no actual owning effect, DB atomicity/concurrency proof.
const operation = "tickets.ticket.watch", record = { recordId: "native", expectedRevision: 7 };
const rootId = uuid(90), sourceId = uuid(2), extensionId = uuid(20);
let registry: CapabilityRegistry, session: Session, author: Session, entity: ContractReference, proof: object;
let authority: FieldRuntimeAuthority;
let events: string[];
const definitions = new Map<string, StudioDefinition & { activeVersion: StudioDefinitionVersion }>();
const versions = new Map<string, StudioDefinitionVersion>();
type Value = StudioFieldValue & { schemaVersion: StudioDefinitionVersion };
const values = new Map<string, Value>();
const scopes = new WeakMap<object, { session: Session; transaction: Prisma.TransactionClient; recordId: string; revision: number }>();
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition, findMany: m.definitions }, studioDefinitionVersion: { findFirst: m.version },
  studioFieldGeneration: { findFirst: m.generation }, studioExtensionRecord: { findFirst: m.extension }, studioFieldSlot: { findFirst: m.slot },
  studioProfileBinding: { findMany: m.bases, findFirst: m.profileBinding } } as unknown as Prisma.TransactionClient;
const membership = (grants: string[]) => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true, grantedCapabilities: grants, deniedCapabilities: [], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
async function actor(grants = [operation]) {
  m.member.mockResolvedValue(membership(grants));
  const result = await sessionForUser("company", "actor"); if (!result) throw new Error("Missing fixture actor"); return result;
}
function liveToken(actor: Session, scope = record, transaction = tx) {
  const result = {}; scopes.set(result, { session: actor, transaction, recordId: scope.recordId, revision: scope.expectedRevision }); return result;
}
async function authorise(context: RecordContext, request: NativeValidationRequest, token: object) {
  const scope = scopes.get(token), stamp = sessionAuthorityStamp(context.session), pinned = scope && sessionAuthorityStamp(scope.session);
  if (!scope || !stamp || !pinned || scope.transaction !== context.transaction || stamp.userId !== pinned.userId || stamp.organisationId !== pinned.organisationId
    || stamp.authVersion !== pinned.authVersion || stamp.sessionVersion !== pinned.sessionVersion || request.recordId !== scope.recordId || request.expectedRevision !== scope.revision)
    throw new Error("FORBIDDEN: live owner proof required");
  events.push("proof"); return { recordId: request.recordId, organisationId: "company", revision: request.expectedRevision };
}
function stored(id: string, definitionId: string, compiled: Awaited<ReturnType<typeof compileCustomField>> | Awaited<ReturnType<typeof compileConditionalCustomField>>) {
  const version: StudioDefinitionVersion = { id, definitionId, organisationId: "company", version: 1, semanticVersion: "1.0.0", schemaVersion: compiled.plan.schemaVersion,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() };
  versions.set(id, version); definitions.set(definitionId, { id: definitionId, organisationId: "company", kind: "customField", key: `tickets.ticket.${compiled.payload.field.key}`, name: "Field", revision: 1,
    latestVersion: 1, activeVersionId: id, retiredAt: null, createdBy: "actor", createdAt: new Date(), updatedAt: new Date(), activeVersion: version }); return version;
}
const base = (key: string, generation: number) => ({ schemaVersion: 1, entity, storageGeneration: uuid(generation), field: { key, label: key, classification: "confidential", storage: { type: "integer" } } });
function putValue(version: StudioDefinitionVersion, value: unknown) {
  const plan = version.payload as unknown as Awaited<ReturnType<typeof compileCustomField>>["payload"];
  values.set(version.definitionId, { id: uuid(Number(version.id.slice(-3)) + 400), organisationId: "company", definitionId: version.definitionId, generationId: plan.storageGeneration, slotId: uuid(Number(version.id.slice(-3)) + 500),
    versionId: version.id, revision: 1, ...encodeFieldValue(plan.field, value), createdBy: "actor", createdAt: new Date(), schemaVersion: version });
}
async function conditional(predicates?: unknown[]) {
  const source = definitions.get(sourceId)!.activeVersion, payload = source.payload as unknown as Awaited<ReturnType<typeof compileCustomField>>["payload"];
  const metadata = { kind: "field", organisationId: "company", entity, definitionId: sourceId, versionId: source.id, checksum: source.checksum, generationId: payload.storageGeneration, field: payload.field, dependencyClosure: [] };
  const compiled = await compileConditionalCustomField({ session: author, registry, definitionId: rootId, resolveMetadata: async input => input.kind === "native" ? registeredRequiredFactMetadata(author, registry, entity, input.fieldId) : metadata },
    { ...base("target", 210), schemaVersion: 2, requiredIf: { match: "all", predicates: predicates ?? [
      { source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } },
      { source: { kind: "field", definitionId: sourceId, versionId: source.id, checksum: source.checksum }, operator: "present" },
    ] } });
  return stored(uuid(190), rootId, compiled);
}
function validate(input = { entity, ...record }, token = proof, op = operation, auth = authority) { return validateNativeResultingFieldRequirements(auth, input, op, token); }
function registerNativeQuery() {
  registry.register("tickets", { contributions: [query({ id: "tickets.ticket.native_validation_watch", version: 1, label: "Native validation", kind: "query", capability: operation, lifecycle: "active", classification: "confidential",
    input: nativeValidationRequestSchema, output: nativeRequiredResultSchema, transaction: "required", pagination: "none", maxCardinality: 1, costClass: "low",
    nativeValidation: { entityId: "tickets.ticket", operation, fieldVersions: [2, 3, 4, 5, 6, 7, 8, 9], authorise },
    async execute(context, request) { if (!context.nativeValidationProof) throw new Error("Missing owner proof"); await authorise(context, request, context.nativeValidationProof); events.push("facts"); return m.facts(); } })] });
}
beforeEach(async () => {
  vi.resetAllMocks(); definitions.clear(); versions.clear(); values.clear(); events = [];
  registry = new CapabilityRegistry(async () => true);
  registry.register("tickets", { contributions: ticketStudioContract.contributions.filter(c => c.metadata.details.nativeValidation === undefined) });
  registerNativeQuery();
  const metadata = registry.describe("tickets.ticket", 6); entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  author = await actor([operation, "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.secret"]); session = await actor(); proof = liveToken(session);
  authority = { session, stamp: sessionAuthorityStamp(session)!, transaction: tx, registry };
  m.refresh.mockImplementation(async current => { const stamp = sessionAuthorityStamp(current); if (!stamp) throw new Error("FORBIDDEN"); return { session: current, stamp, transaction: tx, registry }; });
  m.raw.mockResolvedValue([]); m.definition.mockImplementation(async args => definitions.get(args.where.id) ?? null); m.definitions.mockImplementation(async () => [...definitions.values()].filter(d => d.kind === "customField").sort((a, b) => a.id.localeCompare(b.id)));
  m.version.mockImplementation(async args => versions.get(args.where.id) ?? null); m.generation.mockImplementation(async args => ({ id: args.where.id }));
  m.bases.mockResolvedValue([]);
  m.extension.mockResolvedValue({ id: extensionId, organisationId: "company", entityId: entity.id, recordId: record.recordId, revision: 4 });
  m.slot.mockImplementation(async args => {
    events.push(`${args.select ? "metadata" : "value"}:${args.where.definitionId}`);
    const row = values.get(args.where.definitionId); if (!row) return null;
    const slot = { id: row.slotId, organisationId: "company", extensionId, definitionId: row.definitionId, generationId: row.generationId, revision: row.revision, activeValueId: row.id, activeValue: row };
    if (!args.select) return slot;
    const { id, organisationId, definitionId, generationId, slotId, versionId, revision, valueType, schemaVersion } = row;
    return { ...slot, activeValue: { id, organisationId, definitionId, generationId, slotId, versionId, revision, valueType, schemaVersion } };
  });
  m.facts.mockResolvedValue({ recordId: record.recordId, organisationId: "company", revision: record.expectedRevision, fields: { status: "RESOLVED", priority: "NORMAL" } });
  const source = stored(uuid(102), sourceId, await compileCustomField(author, base("source", 202), registry)); putValue(source, 0); putValue(await conditional(), 0); events = [];
});
it("validates real sealed native/typed requirements for a watch-only actor, including zero, without borrowing ordinary Read/Write/Studio", async () => {
  const ordinary = vi.spyOn(registry, "authoriseRecord"), initial = vi.spyOn(registry, "authoriseCurrentFieldInitialisation"), queryRead = vi.spyOn(registry, "invokeQueryInTransaction");
  const result = await validate(); expect(result).toMatchObject({ recordRevision: 7, extensionRevision: 4, fieldsChecked: 2 });
  expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/); expect(ordinary).not.toHaveBeenCalled(); expect(initial).not.toHaveBeenCalled(); expect(queryRead).not.toHaveBeenCalled();
  expect(m.facts).toHaveBeenCalledTimes(1); expect(events.indexOf(`metadata:${sourceId}`)).toBeLessThan(events.indexOf("facts"));
  expect(events.indexOf(`metadata:${sourceId}`)).toBeLessThan(events.indexOf(`value:${sourceId}`));
  await expect(validateResultingFieldRequirements(session, tx, { entity, ...record })).rejects.toThrow("FORBIDDEN");
});
it("does not treat native proof as creation or bypass unconditional required targets", async () => {
  const version = stored(uuid(191), rootId, await compileCustomField(author, { ...base("target", 210), field: { ...base("target", 210).field, required: true } }, registry));
  values.delete(rootId); await expect(validate()).rejects.toThrow("target is required"); expect(m.facts).not.toHaveBeenCalled();
  putValue(version, 0); expect(await validate()).toMatchObject({ fieldsChecked: 2 });
});
it("skips optional unconditional private fields and false conditional targets without target written/value reads", async () => {
  stored(uuid(103), sourceId, await compileCustomField(author, { ...base("source", 202), field: { ...base("source", 202).field, readCapability: "tickets.field.secret" } }, registry));
  await conditional([{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "CLOSED" } }]);
  values.delete(rootId); events = []; expect(await validate()).toMatchObject({ fieldsChecked: 2 });
  expect(events.filter(e => e.startsWith("value:") || e.startsWith("metadata:"))).toEqual([]);
});
it("denies current and pinned input field Read before protected native facts or typed columns", async () => {
  const privateVersion = stored(uuid(103), sourceId, await compileCustomField(author, { ...base("source", 202), field: { ...base("source", 202).field, readCapability: "tickets.field.secret" } }, registry));
  putValue(privateVersion, 0); putValue(await conditional(), 0); events = [];
  await expect(validate()).rejects.toThrow("FORBIDDEN"); expect(m.facts).not.toHaveBeenCalled(); expect(events.filter(e => e.startsWith("value:"))).toEqual([]);
});
it("preflights applicable old written Read before first native facts, retaining current and pinned independent access", async () => {
  const publicVersion = definitions.get(sourceId)!.activeVersion;
  const privateVersion = stored(uuid(103), sourceId, await compileCustomField(author, { ...base("source", 202), field: { ...base("source", 202).field, readCapability: "tickets.field.secret" } }, registry));
  putValue(privateVersion, 0); definitions.get(sourceId)!.activeVersion = publicVersion; definitions.get(sourceId)!.activeVersionId = publicVersion.id;
  await expect(validate()).rejects.toThrow("FORBIDDEN"); expect(events).toContain(`metadata:${sourceId}`); expect(m.facts).not.toHaveBeenCalled(); expect(events.filter(e => e.startsWith("value:"))).toEqual([]);
});
it.each(["foreign", "revision", "schema", "pointer", "checksum"])("denies %s written metadata before any fact or value projection", async corruption => {
  const value = values.get(sourceId)!;
  if (corruption === "foreign") value.organisationId = "foreign";
  if (corruption === "revision") value.revision = 0;
  if (corruption === "schema") value.schemaVersion = { ...value.schemaVersion, schemaVersion: 3 };
  if (corruption === "pointer") value.versionId = uuid(999);
  if (corruption === "checksum") value.schemaVersion = { ...value.schemaVersion, checksum: "f".repeat(64) };
  await expect(validate()).rejects.toThrow(); expect(m.facts).not.toHaveBeenCalled(); expect(events.filter(e => e.startsWith("value:"))).toEqual([]);
});
it("preflights the complete required field set before the first field's protected facts", async () => {
  const extra = uuid(99); const version = stored(uuid(199), extra, await compileCustomField(author, { ...base("later", 299), field: { ...base("later", 299).field, required: true } }, registry));
  const privateVersion = stored(uuid(198), extra, await compileCustomField(author, { ...base("later", 299), field: { ...base("later", 299).field, required: true, readCapability: "tickets.field.secret" } }, registry));
  putValue(privateVersion, 1); definitions.get(extra)!.activeVersion = version; definitions.get(extra)!.activeVersionId = version.id;
  await expect(validate()).rejects.toThrow("FORBIDDEN"); expect(m.facts).not.toHaveBeenCalled(); expect(events.filter(e => e.startsWith("value:"))).toEqual([]);
});
it("never grants reference metadata or another affected Ticket record ordinary Read", async () => {
  const source = stored(uuid(103), sourceId, await compileCustomField(author, { ...base("source", 202), field: { ...base("source", 202).field, storage: { type: "reference", entity } } }, registry));
  putValue(source, "other_affected"); putValue(await conditional(), 0);
  await expect(validate()).rejects.toThrow("FORBIDDEN"); expect(m.facts).not.toHaveBeenCalled();
  session = await actor([operation, "tickets.ticket.read"]); authority = { ...authority, session, stamp: sessionAuthorityStamp(session)! }; proof = liveToken(session);
  const ordinary = vi.spyOn(registry, "authoriseRecord").mockRejectedValue(new Error("FORBIDDEN: other record private"));
  await expect(validate()).rejects.toThrow("other record private"); expect(ordinary).toHaveBeenCalledWith(expect.anything(), entity, { recordId: "other_affected", intent: "read" });
});
it("denies copied/stale/foreign/expired proof and unknown operations before field or value lookup", async () => {
  const initialProof = vi.spyOn(registry, "authoriseCurrentFieldInitialisation");
  for (const token of [{}, liveToken(session, { recordId: "other", expectedRevision: 7 }), liveToken(session, { recordId: "native", expectedRevision: 8 }), liveToken(session, record, {} as Prisma.TransactionClient)]) {
    await expect(validate(undefined, token)).rejects.toThrow("FORBIDDEN");
  }
  await expect(validate(undefined, proof, "tickets.ticket.manage")).rejects.toThrow("DEPENDENCY_BROKEN");
  scopes.delete(proof); await expect(validate()).rejects.toThrow("FORBIDDEN");
  expect(initialProof).not.toHaveBeenCalled(); expect(m.extension).not.toHaveBeenCalled(); expect(m.slot).not.toHaveBeenCalled(); expect(m.facts).not.toHaveBeenCalled();
});
it("requires genuine matching authority, strict server shape and current refresh before metadata", async () => {
  for (const forged of [{ ...authority, session: { ...session } }, { ...authority, stamp: { ...authority.stamp } }]) await expect(validate(undefined, proof, operation, forged)).rejects.toThrow("FORBIDDEN");
  await expect(validate({ entity, ...record, organisationId: "foreign" } as typeof record & { entity: ContractReference })).rejects.toThrow();
  m.refresh.mockRejectedValue(new Error("FORBIDDEN: current authority revoked")); await expect(validate()).rejects.toThrow("revoked");
  expect(m.extension).not.toHaveBeenCalled(); expect(m.facts).not.toHaveBeenCalled();
});
it.each(["scope", "revision", "missing_fact"])("propagates %s fact result errors with no fallback to ordinary/creation", async change => {
  m.facts.mockResolvedValue({ recordId: "native", organisationId: change === "scope" ? "foreign" : "company", revision: change === "revision" ? 8 : 7, fields: change === "missing_fact" ? {} : { status: "RESOLVED" } });
  const ordinary = vi.spyOn(registry, "invokeQueryInTransaction"), creation = vi.spyOn(registry, "invokeInitialRecordFacts");
  await expect(validate()).rejects.toThrow(); expect(ordinary).not.toHaveBeenCalled(); expect(creation).not.toHaveBeenCalled(); expect(events).not.toContain(`value:${rootId}`);
});
it("propagates value corruption and required failure for caller-owned atomic rollback", async () => {
  values.get(sourceId)!.fingerprint = "f".repeat(64); await expect(validate()).rejects.toThrow("FIELD_STORAGE_INVALID");
  putValue(definitions.get(sourceId)!.activeVersion, 0); values.delete(rootId); await expect(validate()).rejects.toThrow("target is required");
});

function activeProfile(requiredId = sourceId) {
  const required = versions.get(definitions.get(requiredId)!.activeVersionId!)!;
  const pin = { kind: "customField" as const, definitionId: requiredId, versionId: required.id, schemaVersion: 1 as const, checksum: required.checksum };
  const payload = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: { requiredFields: [pin] } });
  const resolved = resolveEntityProfile(payload)!;
  const metadata = registry.describe(entity.id, entity.version);
  const plan = { kind: "entityProfile", schemaVersion: 1, payload, resolvedProfile: resolved.profile,
    dependencies: [{ ...entity, ownerModuleId: metadata.ownerModuleId, kind: metadata.kind, classification: metadata.classification }],
    configurationDependencies: resolved.configurationDependencies };
  const id = uuid(170), definitionId = uuid(70);
  const profile = { id, definitionId, organisationId: "company", schemaVersion: 1, payload, compiledPlan: plan, checksum: checksum(plan),
    definition: { kind: "entityProfile", retiredAt: null }, configurationDependencies: [{ organisationId: "company", definitionId, versionId: id,
      targetDefinitionId: pin.definitionId, targetVersionId: pin.versionId, targetKind: pin.kind, targetSchemaVersion: pin.schemaVersion, targetChecksum: pin.checksum }] };
  const originalVersion = m.version.getMockImplementation()!, originalDefinition = m.definition.getMockImplementation()!;
  m.version.mockImplementation(async args => args.where.id === id ? profile : { ...await originalVersion(args),
    definition: { kind: "customField", retiredAt: null }, configurationDependencies: [] });
  m.definition.mockImplementation(async args => args.where.id === definitionId ? { id: definitionId, organisationId: "company", kind: "entityProfile",
    activeVersionId: id, activeVersion: profile, retiredAt: null } : originalDefinition(args));
  m.bases.mockResolvedValue([{ definitionId }]); m.profileBinding.mockResolvedValue({ originVersionId: id });
}
it("adds profile requirements to optional global fields and keeps actual zero/false present for a native-only actor", async () => {
  definitions.delete(rootId); activeProfile();
  const ordinary = vi.spyOn(registry, "authoriseRecord");
  expect(await validate()).toMatchObject({ fieldsChecked: 1 }); expect(ordinary).not.toHaveBeenCalled();
  const boolean = stored(uuid(103), sourceId, await compileCustomField(author, { ...base("source", 202), field: { ...base("source", 202).field, storage: { type: "boolean" } } }, registry));
  putValue(boolean, false); activeProfile(); expect(await validate()).toMatchObject({ fieldsChecked: 1 });
  expect(m.facts).not.toHaveBeenCalled();
});
it("never lets a false condition or optional global policy waive a profile-required field", async () => {
  definitions.delete(rootId); activeProfile(); values.delete(sourceId);
  await expect(validate()).rejects.toThrow("source is required");
  putValue(definitions.get(sourceId)!.activeVersion, null);
  await expect(validate()).rejects.toThrow("source is required"); expect(m.facts).not.toHaveBeenCalled();
});
it("preflights a profile-required field's old written policy before any typed projection without lending native Read", async () => {
  definitions.delete(rootId); activeProfile();
  const current = definitions.get(sourceId)!.activeVersion;
  const privateVersion = stored(uuid(103), sourceId, await compileCustomField(author, { ...base("source", 202), field: { ...base("source", 202).field, readCapability: "tickets.field.secret" } }, registry));
  putValue(privateVersion, 0); definitions.get(sourceId)!.activeVersion = current; definitions.get(sourceId)!.activeVersionId = current.id;
  events = []; await expect(validate()).rejects.toThrow("FORBIDDEN");
  expect(events.filter(event => event.startsWith("value:"))).toEqual([]); expect(m.facts).not.toHaveBeenCalled();
});

it("retains independent approved native field/fact grants before facts, without requiring owning native Read", async () => {
  registry = new CapabilityRegistry(async () => true);
  registry.register("tickets", { contributions: ticketStudioContract.contributions.filter(c => c.metadata.details.nativeValidation === undefined).map(c => {
    if (c.metadata.id !== "tickets.ticket" || c.metadata.version !== 6) return c;
    const details = structuredClone(c.metadata.details) as unknown as z.infer<typeof entityDetailsSchema>;
    details.fields.find(field => field.id === "status")!.capability = "tickets.field.secret";
    details.record!.requiredFacts!.facts.find(fact => fact.fieldId === "status")!.capability = "tickets.fact.status";
    return { ...c, metadata: { ...c.metadata, details: details as unknown as Record<string, unknown>, schemaHash: checksum(details) } };
  }) }); registerNativeQuery();
  const metadata = registry.describe("tickets.ticket", 6); entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  author = await actor([operation, "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.secret", "tickets.fact.status"]);
  const source = stored(uuid(102), sourceId, await compileCustomField(author, base("source", 202), registry)); putValue(source, 0); putValue(await conditional(), 0);
  authority = { ...authority, registry }; events = [];
  await expect(validate()).rejects.toThrow("FORBIDDEN"); expect(m.facts).not.toHaveBeenCalled(); expect(events.filter(e => e.startsWith("value:"))).toEqual([]);
  session = await actor([operation, "tickets.field.secret"]); authority = { ...authority, session, stamp: sessionAuthorityStamp(session)! }; proof = liveToken(session);
  await expect(validate()).rejects.toThrow("FORBIDDEN"); expect(m.facts).not.toHaveBeenCalled();
  session = await actor([operation, "tickets.field.secret", "tickets.fact.status"]); authority = { ...authority, session, stamp: sessionAuthorityStamp(session)! }; proof = liveToken(session);
  expect(await validate()).toMatchObject({ fieldsChecked: 2 }); expect(m.facts).toHaveBeenCalledTimes(1);
});
