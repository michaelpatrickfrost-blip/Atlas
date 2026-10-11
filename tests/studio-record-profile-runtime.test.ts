import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { checksum } from "@/core/studio/registry/contracts";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { entityProfilePayloadSchema, recordTypePayloadSchema, type ConfigurationReference } from "@/core/studio/record-types/schema";
import { resolveEntityProfile, resolveRecordTypeProfile } from "@/core/studio/record-types/resolver";
import { inspectRecordProfileInTransaction, preflightRecordProfileFields, resolveRecordProfileInTransaction } from "@/core/studio/record-types/runtime-profile";
import { recordTypeAssignmentProvenanceSchema } from "@/core/studio/record-types/assignment-contract";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { reconstructPageMetadataInTransaction } from "@/core/studio/pages/server-approvals";
import { compilePage } from "@/core/studio/pages/compiler";
import { pagePayloadSchema } from "@/core/studio/pages/schema";
const mocks = vi.hoisted(() => ({ stamps: new WeakMap<object, object>() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: (session: object) => mocks.stamps.get(session) }));
const uuid = (n: number) => `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.test", organisationId: "business",
  organisationName: "Business", membershipId: "member", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage", "tickets.field.read", "tickets.field.write"]) };
const registry = buildRegistry(async () => true), owner = registry.describe("tickets.ticket", 9);
const entity = { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash };
const dependency = { ...entity, ownerModuleId: owner.ownerModuleId, kind: owner.kind, classification: owner.classification };
const version = vi.fn(), definition = vi.fn(), binding = vi.fn(), bases = vi.fn(), extension = vi.fn(), generation = vi.fn();
const tx = { studioDefinitionVersion: { findFirst: version }, studioDefinition: { findFirst: definition },
  studioProfileBinding: { findFirst: binding, findMany: bases }, studioExtensionRecord: { findFirst: extension },
  studioFieldGeneration: { findFirst: generation } } as unknown as Prisma.TransactionClient;
const stamp = { userId: "actor", organisationId: "business", membershipId: "member", authVersion: 1, sessionVersion: 1 };
const authority = { session, stamp, transaction: tx, registry } as FieldRuntimeAuthority;
function envelope(n: number, kind: "entityProfile" | "recordType" | "customField" | "page", payload: object, plan: object) {
  const id = uuid(n + 100), definitionId = uuid(n), hash = checksum(plan);
  const references = (plan as { configurationDependencies?: ConfigurationReference[] }).configurationDependencies ?? [];
  return { pin: { kind, definitionId, versionId: id, schemaVersion: 1, checksum: hash } as ConfigurationReference,
    row: { id, definitionId, organisationId: "business", schemaVersion: 1, payload, compiledPlan: plan, checksum: hash,
      definition: { id: definitionId, organisationId: "business", kind, retiredAt: null as Date | null, key: `${entity.id}.${kind}` },
      configurationDependencies: references.map(ref => ({ organisationId: "business", definitionId, versionId: id,
        targetDefinitionId: ref.definitionId, targetVersionId: ref.versionId, targetKind: ref.kind, targetSchemaVersion: ref.schemaVersion, targetChecksum: ref.checksum })) } };
}
let field: ReturnType<typeof envelope>, base: ReturnType<typeof envelope>, type: ReturnType<typeof envelope>, rows: ReturnType<typeof envelope>["row"][];
beforeEach(async () => {
  vi.restoreAllMocks(); vi.clearAllMocks(); mocks.stamps.set(session, stamp);
  const compiled = await compileCustomField(session, customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(500),
    field: { key: "count", label: "Count", readCapability: "tickets.field.read", writeCapability: "tickets.field.write", classification: "confidential", storage: { type: "integer" } } }), registry);
  field = envelope(2, "customField", compiled.payload, compiled.plan);
  const payload = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: { requiredFields: [field.pin] } });
  const resolved = resolveEntityProfile(payload)!;
  base = envelope(1, "entityProfile", payload, { kind: "entityProfile", schemaVersion: 1, payload,
    resolvedProfile: resolved.profile, dependencies: [dependency], configurationDependencies: resolved.configurationDependencies });
  const overlay = recordTypePayloadSchema.parse({ schemaVersion: 1, entity, baseProfile: base.pin, label: "Complaint", overlay: {} });
  const materialised = resolveRecordTypeProfile({ reference: base.pin, payload }, overlay, uuid(3));
  type = envelope(3, "recordType", overlay, { kind: "recordType", schemaVersion: 1, payload: overlay,
    resolvedProfile: materialised.profile, dependencies: [dependency], configurationDependencies: materialised.configurationDependencies });
  rows = [field.row, base.row, type.row];
  version.mockImplementation(async ({ where }) => rows.find(row => row.id === where.id && row.definitionId === where.definitionId && row.organisationId === where.organisationId) ?? null);
  definition.mockImplementation(async ({ where }) => {
    const row = rows.find(value => value.definitionId === where.id && value.organisationId === where.organisationId);
    return row ? { ...row.definition, activeVersionId: row.id, activeVersion: row, key: row === field.row ? `${entity.id}.count` : row.definition.key } : null;
  });
  binding.mockImplementation(async ({ where }) => ({ originVersionId: rows.find(row => row.definitionId === where.definitionId)!.id }));
  bases.mockResolvedValue([{ definitionId: base.pin.definitionId }]); generation.mockResolvedValue({ id: uuid(500) }); extension.mockResolvedValue(null);
  vi.spyOn(registry, "authoriseRecord").mockResolvedValue({ recordId: "native", organisationId: "business", revision: 7 });
});
const request = { entity, recordId: "native", expectedRevision: 7 };
it("reconstructs exact materialised base and overlay seals without invoking facts, values, commands or authoring Write", async () => {
  const readonly = { ...session, capabilities: new Set(["tickets.ticket.read", "tickets.field.read"]) };
  mocks.stamps.set(readonly, stamp);
  const result = await inspectRecordProfileInTransaction({ ...authority, session: readonly }, type.pin);
  expect(result.profile.requiredFields).toEqual([field.pin]); expect(result.baseProfile).toEqual(base.pin);
  expect(Object.keys(tx)).not.toContain("studioFieldValue");
  expect(version.mock.calls.every(([args]) => args.where.organisationId === "business")).toBe(true);
});
it("reconstructs a sealed Page profile for genuine Create-only validation without ordinary Read or Write", async () => {
  const creator = { ...session, capabilities: new Set(["tickets.ticket.create"]) };
  mocks.stamps.set(creator, stamp);
  const context = { ...authority, session: creator }, source = registry.describePageSourceForEntity(entity).metadata;
  const approvals = await reconstructPageMetadataInTransaction(context, { sourcePage: { id: source.id, version: source.version,
    schemaHash: source.schemaHash, contractHash: source.contractHash }, customFields: [] });
  const payload = pagePayloadSchema.parse({ schemaVersion: 1, entity, formFactors: ["phone"], sections: [{ id: "main", label: "Help",
    formFactors: ["phone"], columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: "help", type: "instructions", text: "Contact your team", formFactors: ["phone"] }] }] });
  const pagePlan = compilePage(payload, approvals), page = envelope(4, "page", payload, pagePlan);
  const profilePayload = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: { page: page.pin, requiredFields: [] } });
  const resolved = resolveEntityProfile(profilePayload)!;
  const dependencies = new Map([dependency, ...pagePlan.dependencies].map(value => [`${value.id}@${value.version}`, value]));
  const profile = envelope(1, "entityProfile", profilePayload, { kind: "entityProfile", schemaVersion: 1, payload: profilePayload,
    resolvedProfile: resolved.profile, dependencies: [...dependencies.values()].sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version),
    configurationDependencies: resolved.configurationDependencies });
  rows = [profile.row, page.row];
  const result = await inspectRecordProfileInTransaction(context, profile.pin);
  expect(result.profile.page).toEqual(page.pin);
  expect(creator.capabilities.has("tickets.ticket.read")).toBe(false);
  expect(creator.capabilities.has("tickets.ticket.manage")).toBe(false);
  expect(Object.keys(tx)).not.toContain("serviceWorkItem");
  page.row.checksum = "0".repeat(64);
  await expect(inspectRecordProfileInTransaction(context, profile.pin)).rejects.toThrow("DEPENDENCY_BROKEN");
});
it.each(["resolved", "dependency", "mirror", "origin", "retired"])("rejects %s corruption even when a malicious materialised frame is self-checksummed", async mode => {
  if (mode === "resolved") { const plan = { ...(type.row.compiledPlan as object), resolvedProfile: { page: null, requiredFields: [], allowedProcesses: [], defaultDecisions: [] } };
    type.row.compiledPlan = plan; type.row.checksum = checksum(plan); type.pin.checksum = type.row.checksum; }
  if (mode === "dependency") { const plan = { ...(type.row.compiledPlan as object), dependencies: [] };
    type.row.compiledPlan = plan; type.row.checksum = checksum(plan); type.pin.checksum = type.row.checksum; }
  if (mode === "mirror") type.row.configurationDependencies = [];
  if (mode === "origin") binding.mockResolvedValue({ originVersionId: uuid(999) });
  if (mode === "retired") type.row.definition.retiredAt = new Date();
  await expect(inspectRecordProfileInTransaction(authority, type.pin)).rejects.toThrow();
});
it("uses the active base for an unassigned record and leaves an unpublished/inactive base without runtime effect", async () => {
  expect(await resolveRecordProfileInTransaction(authority, request)).toMatchObject({ baseProfile: base.pin, recordType: null, profile: { requiredFields: [field.pin] } });
  definition.mockResolvedValue({ ...base.row.definition, activeVersionId: null, activeVersion: null });
  expect(await resolveRecordProfileInTransaction(authority, request)).toMatchObject({ baseProfile: null, recordType: null, profile: null });
});
it("resolves an assigned stable type using today's active version and its retained exact base, never today's replacement base", async () => {
  const provenance = recordTypeAssignmentProvenanceSchema.parse({ schemaVersion: 1, operationId: uuid(90), organisationId: "business", entity,
    recordId: "native", nativeRevision: 7, extensionId: uuid(80), extensionRevision: 2, previousExtensionRevision: 1, previousAssignmentId: null,
    recordType: type.pin, baseProfile: base.pin, resolvedProfileChecksum: checksum(resolveEntityProfile(base.row.payload)!.profile),
    requestChecksum: checksum({ operationId: uuid(90), entity, recordId: "native", recordRevision: 7,
      extensionRevision: 1, recordType: type.pin }), createdBy: "actor" });
  extension.mockResolvedValue({ id: uuid(80), revision: 4, recordTypeAssignmentId: uuid(90), recordTypeAssignment: { id: uuid(90), extensionId: uuid(80),
    extensionRevision: 2, nativeRevision: 7, previousAssignmentId: null, organisationId: "business", entityId: entity.id, recordId: "native",
    createdBy: "actor", provenance, checksum: checksum(provenance), requestChecksum: provenance.requestChecksum,
    recordTypeDefinitionId: type.pin.definitionId, recordTypeVersionId: type.pin.versionId, baseProfileDefinitionId: base.pin.definitionId, baseProfileVersionId: base.pin.versionId } });
  const result = await resolveRecordProfileInTransaction(authority, request);
  expect(result).toMatchObject({ recordType: type.pin, baseProfile: base.pin, assignmentId: uuid(90) });
  expect(bases).not.toHaveBeenCalled();
});
it("rejects stale, private, foreign or untrusted identity before any profile/extension metadata lookup", async () => {
  await expect(resolveRecordProfileInTransaction({ ...authority, session: { ...session } }, request)).rejects.toThrow("FORBIDDEN");
  expect(extension).not.toHaveBeenCalled();
  vi.mocked(registry.authoriseRecord).mockRejectedValue(new Error("private record"));
  await expect(resolveRecordProfileInTransaction(authority, request)).rejects.toThrow("private"); expect(extension).not.toHaveBeenCalled();
});
it("checks both pinned and current field Read policies and generation compatibility while allowing a cosmetic label", async () => {
  const profile = resolveEntityProfile(base.row.payload)!.profile;
  const reader = { ...authority, session: { ...session, capabilities: new Set(["tickets.ticket.read"]) } };
  await expect(preflightRecordProfileFields(reader, profile, entity.id, { kind: "ordinary" })).rejects.toThrow("FORBIDDEN");
  const payload = customFieldPayloadSchema.parse(field.row.payload);
  const cosmetic = await compileCustomField(session, { ...payload, field: { ...payload.field, label: "Packages" } }, registry);
  const active = envelope(4, "customField", cosmetic.payload, cosmetic.plan);
  active.row.definitionId = field.pin.definitionId;
  definition.mockResolvedValue({ activeVersionId: active.row.id, activeVersion: active.row, key: `${entity.id}.count` });
  await expect(preflightRecordProfileFields(authority, profile, entity.id, { kind: "ordinary" })).resolves.toBeUndefined();
  const changed = await compileCustomField(session, { ...payload, storageGeneration: uuid(501) }, registry);
  const newGeneration = envelope(5, "customField", changed.payload, changed.plan);
  newGeneration.row.definitionId = field.pin.definitionId;
  definition.mockResolvedValue({ activeVersionId: newGeneration.row.id, activeVersion: newGeneration.row, key: `${entity.id}.count` });
  await expect(preflightRecordProfileFields(authority, profile, entity.id, { kind: "ordinary" })).rejects.toThrow("RECORD_PROFILE_INVALID");
});
it("preflights the real sealed profile in Create-only mode without calling ordinary Read, requiring the exact owner INSERT proof", async () => {
  const creator = { ...session, capabilities: new Set(["tickets.ticket.create", "tickets.field.read"]) }, proof = {};
  mocks.stamps.set(creator, stamp);
  const ordinary = vi.spyOn(registry, "authoriseRecord"), resolve = vi.spyOn(registry, "resolve");
  vi.spyOn(registry, "authoriseCurrentFieldInitialisation").mockImplementation(async (context, reference, token) => {
    if (context.session !== creator || context.transaction !== tx || reference.id !== entity.id || token !== proof) throw new Error("FORBIDDEN: INSERT proof");
    return { recordId: "native", organisationId: "business", revision: 7 };
  });
  expect(await resolveRecordProfileInTransaction({ ...authority, session: creator }, request, { kind: "initial", proof }))
    .toMatchObject({ baseProfile: base.pin, profile: { requiredFields: [field.pin] } });
  expect(ordinary).not.toHaveBeenCalled(); expect(resolve).not.toHaveBeenCalled();
  await expect(resolveRecordProfileInTransaction({ ...authority, session: creator }, request, { kind: "initial", proof: {} })).rejects.toThrow("INSERT proof");
});

function retainAssignedProfile() {
  const provenance = recordTypeAssignmentProvenanceSchema.parse({ schemaVersion: 1, operationId: uuid(90), organisationId: "business", entity,
    recordId: "native", nativeRevision: 7, extensionId: uuid(80), extensionRevision: 2, previousExtensionRevision: 1, previousAssignmentId: null,
    recordType: type.pin, baseProfile: base.pin, resolvedProfileChecksum: checksum(resolveEntityProfile(base.row.payload)!.profile),
    requestChecksum: checksum({ operationId: uuid(90), entity, recordId: "native", recordRevision: 7,
      extensionRevision: 1, recordType: type.pin }), createdBy: "actor" });
  extension.mockResolvedValue({ id: uuid(80), revision: 4, recordTypeAssignmentId: uuid(90), recordTypeAssignment: { id: uuid(90), extensionId: uuid(80),
    extensionRevision: 2, nativeRevision: 7, previousAssignmentId: null, organisationId: "business", entityId: entity.id, recordId: "native",
    createdBy: "actor", provenance, checksum: checksum(provenance), requestChecksum: provenance.requestChecksum,
    recordTypeDefinitionId: type.pin.definitionId, recordTypeVersionId: type.pin.versionId, baseProfileDefinitionId: base.pin.definitionId, baseProfileVersionId: base.pin.versionId } });
}
function replaceCurrentWithEmptyProfile() {
  const payload = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: {} });
  const resolved = resolveEntityProfile(payload)!;
  const freshBase = envelope(10, "entityProfile", payload, { kind: "entityProfile", schemaVersion: 1, payload,
    resolvedProfile: resolved.profile, dependencies: [dependency], configurationDependencies: [] });
  freshBase.pin.definitionId = base.pin.definitionId; freshBase.row.definitionId = base.pin.definitionId;
  const overlay = recordTypePayloadSchema.parse({ schemaVersion: 1, entity, baseProfile: freshBase.pin, label: "General enquiry", overlay: {} });
  const materialised = resolveRecordTypeProfile({ reference: freshBase.pin, payload }, overlay, type.pin.definitionId);
  const freshType = envelope(11, "recordType", overlay, { kind: "recordType", schemaVersion: 1, payload: overlay,
    resolvedProfile: materialised.profile, dependencies: [dependency], configurationDependencies: materialised.configurationDependencies });
  freshType.pin.definitionId = type.pin.definitionId; freshType.row.definitionId = type.pin.definitionId;
  freshType.row.configurationDependencies = freshType.row.configurationDependencies.map(edge => ({ ...edge, definitionId: type.pin.definitionId }));
  rows.push(freshBase.row, freshType.row);
  const original = definition.getMockImplementation()!;
  definition.mockImplementation(async input => input.where.id === type.pin.definitionId
    ? { ...freshType.row.definition, activeVersionId: freshType.row.id, activeVersion: freshType.row }
    : original(input));
}
it("checks retained required-field Read even after the current assigned type no longer uses that field", async () => {
  retainAssignedProfile(); replaceCurrentWithEmptyProfile();
  const reader = { ...session, capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
  mocks.stamps.set(reader, stamp);
  await expect(resolveRecordProfileInTransaction({ ...authority, session: reader }, request)).rejects.toThrow("FORBIDDEN");
  expect(Object.keys(tx)).not.toContain("studioFieldValue");
  expect(await resolveRecordProfileInTransaction(authority, request)).toMatchObject({ profile: { requiredFields: [] }, assignmentId: uuid(90) });
});
it("retained policy reads preserve no-Write ordinary validation and genuine Create-only proof mode", async () => {
  retainAssignedProfile(); replaceCurrentWithEmptyProfile();
  const creator = { ...session, capabilities: new Set(["tickets.ticket.create", "tickets.field.read"]) }, proof = {};
  mocks.stamps.set(creator, stamp);
  vi.spyOn(registry, "authoriseCurrentFieldInitialisation").mockResolvedValue({ recordId: "native", organisationId: "business", revision: 7 });
  const ordinary = vi.spyOn(registry, "authoriseRecord");
  await expect(resolveRecordProfileInTransaction({ ...authority, session: creator }, request, { kind: "initial", proof }))
    .resolves.toMatchObject({ profile: { requiredFields: [] } });
  expect(ordinary).not.toHaveBeenCalled(); expect(creator.capabilities.has("tickets.field.write")).toBe(false);
  const revoked = { ...creator, capabilities: new Set(["tickets.ticket.create"]) }; mocks.stamps.set(revoked, stamp);
  await expect(resolveRecordProfileInTransaction({ ...authority, session: revoked }, request, { kind: "initial", proof })).rejects.toThrow("FORBIDDEN");
});
it("requires retained reference metadata Read even when the current profile drops that reference", async () => {
  const target = registry.describe("tickets.ticket", 1), ref = { id: target.id, version: target.version, schemaHash: target.schemaHash, contractHash: target.contractHash };
  const compiled = await compileCustomField(session, customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(500),
    field: { key: "count", label: "Related ticket", readCapability: "tickets.field.read", classification: "confidential", storage: { type: "reference", entity: ref } } }), registry);
  field.row.payload = compiled.payload; field.row.compiledPlan = compiled.plan; field.row.checksum = compiled.checksum; field.pin.checksum = compiled.checksum;
  // Rebuild sealed profile pin mirrors to retain that actual reference schema.
  const payload = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: { requiredFields: [field.pin] } });
  const resolved = resolveEntityProfile(payload)!;
  base = envelope(1, "entityProfile", payload, { kind: "entityProfile", schemaVersion: 1, payload,
    resolvedProfile: resolved.profile, dependencies: [dependency], configurationDependencies: resolved.configurationDependencies });
  const overlay = recordTypePayloadSchema.parse({ schemaVersion: 1, entity, baseProfile: base.pin, label: "Complaint", overlay: {} });
  const materialised = resolveRecordTypeProfile({ reference: base.pin, payload }, overlay, uuid(3));
  type = envelope(3, "recordType", overlay, { kind: "recordType", schemaVersion: 1, payload: overlay,
    resolvedProfile: materialised.profile, dependencies: [dependency], configurationDependencies: materialised.configurationDependencies });
  rows = [field.row, base.row, type.row]; retainAssignedProfile(); replaceCurrentWithEmptyProfile();
  const original = registry.resolve.bind(registry);
  vi.spyOn(registry, "resolve").mockImplementation(async (current, reference) => {
    if (reference.id === ref.id && reference.version === ref.version) throw new Error("FORBIDDEN: current reference Read revoked");
    return original(current, reference);
  });
  await expect(resolveRecordProfileInTransaction(authority, request)).rejects.toThrow("reference Read revoked");
  expect(Object.keys(tx)).not.toContain("studioFieldValue");
});
it("retained field policies retain the explicit native validation proof without inventing ordinary record visibility", async () => {
  retainAssignedProfile(); replaceCurrentWithEmptyProfile();
  const native = { ...session, capabilities: new Set(["tickets.field.read"]) }, proof = {};
  mocks.stamps.set(native, stamp);
  const access = { kind: "native_validation" as const, request: { recordId: "native", expectedRevision: 7 }, operation: "tickets.ticket.update", proof };
  const policy = vi.spyOn(registry, "resolveNativeValidationFieldPolicy").mockResolvedValue({ source: owner,
    anchor: { recordId: "native", organisationId: "business", revision: 7 } } as never);
  const ordinary = vi.spyOn(registry, "authoriseRecord");
  await expect(resolveRecordProfileInTransaction({ ...authority, session: native }, request, access)).resolves.toMatchObject({ profile: { requiredFields: [] } });
  expect(policy).toHaveBeenCalledWith({ session: native, transaction: tx }, entity, access.request, access.operation, proof);
  expect(ordinary).not.toHaveBeenCalled(); expect(Object.keys(tx)).not.toContain("studioFieldValue");
});
