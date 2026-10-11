import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, ServiceWorkItem, StudioDefinition, StudioDefinitionVersion, StudioFieldValue } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), states: vi.fn(), enabled: vi.fn(), create: vi.fn(), native: vi.fn(),
  definition: vi.fn(), definitions: vi.fn(), version: vi.fn(), generation: vi.fn(), extension: vi.fn(), slot: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const { ticketStudioContract } = await import("@/core/service-work/studio");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => { const registry = new CapabilityRegistry(available); registry.register("tickets", ticketStudioContract); return registry; } };
});
import { sessionForUser } from "@/core/auth/session";
import { createTicketWithFieldInitialisation } from "@/core/service-work/studio-create";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { evaluateInitialFieldRequirement, validateResultingFieldRequirements } from "@/core/studio/fields/required-runtime";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company }, moduleState: { findMany: m.states, findFirst: m.enabled },
  serviceWorkItem: { create: m.create, findFirst: m.native }, studioDefinition: { findFirst: m.definition, findMany: m.definitions },
  studioDefinitionVersion: { findFirst: m.version }, studioFieldGeneration: { findFirst: m.generation }, studioExtensionRecord: { findFirst: m.extension },
  studioFieldSlot: { findFirst: m.slot } } as unknown as Prisma.TransactionClient;
const data: Prisma.ServiceWorkItemUncheckedCreateInput = { organisationId: "company", kind: "TICKET", requesterUserId: "actor", queueId: "queue", number: "TKT-1", subject: "Created" };
const work = { ...data, id: "new", version: 1, status: "NEW", priority: "HIGH", mergedIntoId: null } as unknown as ServiceWorkItem;
const definitions = new Map<string, StudioDefinition & { activeVersion: StudioDefinitionVersion }>();
const values = new Map<string, StudioFieldValue & { schemaVersion: StudioDefinitionVersion }>();
const rootId = uuid(90), sourceId = uuid(2), extensionId = uuid(20);
let session: Session, revision: number;
let entity: Awaited<ReturnType<typeof compileCustomField>>["payload"]["entity"];
let source: Awaited<ReturnType<typeof compileCustomField>>, root: Awaited<ReturnType<typeof compileConditionalCustomField>>;
function stored(id: string, compiled: typeof source | typeof root) {
  const version: StudioDefinitionVersion = { id: uuid(id === sourceId ? 102 : id === rootId ? 190 : 103), definitionId: id, organisationId: "company", version: 1,
    semanticVersion: "1.0.0", schemaVersion: compiled.plan.schemaVersion, payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "actor", publishedAt: new Date() };
  definitions.set(id, { id, organisationId: "company", kind: "customField", key: `tickets.ticket.${compiled.payload.field.key}`, name: "Field", revision: 1,
    latestVersion: 1, activeVersionId: version.id, retiredAt: null, createdBy: "actor", createdAt: new Date(), updatedAt: new Date(), activeVersion: version });
  return version;
}
function stage(id: string, compiled: typeof source | typeof root, value: unknown, valueRevision = 1) {
  const version = definitions.get(id)!.activeVersion;
  values.set(id, { id: uuid(id === sourceId ? 40 + valueRevision : 60 + valueRevision), organisationId: "company", definitionId: id,
    generationId: compiled.payload.storageGeneration, slotId: uuid(id === sourceId ? 30 : 31), versionId: version.id, revision: valueRevision,
    ...encodeFieldValue(compiled.payload.field, value), createdBy: "actor", createdAt: new Date(), schemaVersion: version });
}
beforeEach(async () => {
  vi.resetAllMocks(); definitions.clear(); values.clear(); revision = 2;
  const member = { id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
    grantedCapabilities: ["tickets.ticket.create"], deniedCapabilities: [], roles: [],
    user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
    organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } };
  m.member.mockImplementation(async () => structuredClone(member));
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  m.company.mockResolvedValue({ id: "company" }); m.states.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }]);
  m.enabled.mockResolvedValue({ id: "enabled" }); m.create.mockResolvedValue(work); m.native.mockResolvedValue(work);
  m.definition.mockImplementation(async args => definitions.get(args.where.id) ?? null);
  m.definitions.mockImplementation(async () => [...definitions.values()].sort((a, b) => a.id.localeCompare(b.id)));
  m.version.mockImplementation(async args => [...definitions.values()].find(d => d.activeVersion.id === args.where.id)?.activeVersion ?? null);
  m.generation.mockImplementation(async args => ({ id: args.where.id })); m.extension.mockImplementation(async () => ({ id: extensionId, revision }));
  m.slot.mockImplementation(async args => { const row = values.get(args.where.definitionId); return row ? { id: row.slotId, revision: row.revision, activeValueId: row.id, activeValue: row } : null; });
  const principal = await sessionForUser("company", "actor"); if (!principal) throw new Error("Missing test principal."); session = principal;
  const registry = buildRegistry(async () => true), author = { ...session, capabilities: new Set([...session.capabilities, "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.secret"]) };
  const ref = (version: number) => { const e = registry.describe("tickets.ticket", version); return { id: e.id, version: e.version, schemaHash: e.schemaHash, contractHash: e.contractHash }; };
  entity = ref(7);
  source = await compileCustomField(author, { schemaVersion: 1, entity: ref(2), storageGeneration: uuid(202),
    field: { key: "flag", label: "Escalated", classification: "confidential", storage: { type: "boolean" } } }, registry);
  const sourceVersion = stored(sourceId, source), metadata = { kind: "field" as const, definitionId: sourceId, versionId: sourceVersion.id, checksum: sourceVersion.checksum,
    organisationId: "company", entity: source.payload.entity, generationId: source.payload.storageGeneration, field: source.payload.field, dependencyClosure: [] };
  root = await compileConditionalCustomField({ session: author, registry, definitionId: rootId,
    resolveMetadata: async input => input.kind === "native" ? registeredRequiredFactMetadata(author, registry, entity, input.fieldId) : metadata },
  { schemaVersion: 2, entity, storageGeneration: uuid(290), field: { key: "resolution_notes", label: "Resolution notes", classification: "confidential", storage: { type: "string" } },
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "priority" }, operator: "equals", value: { type: "enum", value: "HIGH" } },
      { source: { kind: "field", definitionId: sourceId, versionId: sourceVersion.id, checksum: sourceVersion.checksum }, operator: "equals", value: { type: "boolean", value: true } }] } });
  stored(rootId, root); stage(sourceId, source, true);
});
const request = () => ({ entity, recordId: "new", expectedRevision: 1 });
const fieldRequest = () => ({ definitionId: rootId, recordId: "new", expectedRevision: 1 });
it("reads actual staged values under genuine creation-only authority and validates the resulting state", async () => {
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _created, proof) => {
    expect((await evaluateInitialFieldRequirement(authority.session, tx, fieldRequest(), proof)).required).toBe(true);
    stage(rootId, root, "Reviewed"); revision++;
    const filled = await validateResultingFieldRequirements(authority.session, tx, request(), proof);
    expect(filled).toMatchObject({ recordRevision: 1, extensionRevision: 3, fieldsChecked: 2 });
    stage(sourceId, source, false, 2); stage(rootId, root, null, 2); revision++;
    const cleared = await validateResultingFieldRequirements(authority.session, tx, request(), proof);
    expect(cleared).toMatchObject({ extensionRevision: 4, fieldsChecked: 2 }); expect(cleared.fingerprint).not.toBe(filled.fingerprint);
    expect(authority.session.capabilities.has("tickets.ticket.read")).toBe(false); expect(authority.session.capabilities.has("tickets.ticket.manage")).toBe(false);
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
it("propagates a missing required target through the owning callback and expires the proof on failure", async () => {
  let retained: object | undefined;
  await expect(createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _created, proof) => {
    retained = proof; return validateResultingFieldRequirements(authority.session, tx, request(), proof);
  })).rejects.toThrow("Resolution notes is required");
  await expect(validateResultingFieldRequirements(session, tx, request(), retained!)).rejects.toThrow("FORBIDDEN");
  // The mock transaction establishes error propagation/proof scope. Actual
  // native/value/Audit SQL rollback is a separate central integration gate.
});
it("rejects other-record/copied proofs and client facts before any value lookup", async () => {
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _created, proof) => {
    for (const input of [{ ...request(), recordId: "existing" }, { ...request(), organisationId: "foreign" }, { ...request(), fields: { flag: false } }]) {
      m.slot.mockClear(); await expect(validateResultingFieldRequirements(authority.session, tx, input, proof)).rejects.toThrow(); expect(m.slot).not.toHaveBeenCalled();
    }
    m.extension.mockClear();
    await expect(evaluateInitialFieldRequirement(authority.session, tx, { ...fieldRequest(), recordId: "existing" }, proof)).rejects.toThrow("FIELD_STORAGE_INVALID");
    expect(m.extension).not.toHaveBeenCalled();
    await expect(validateResultingFieldRequirements(authority.session, tx, request(), { ...proof })).rejects.toThrow("FORBIDDEN");
    await expect(validateResultingFieldRequirements({ ...authority.session }, tx, request(), proof)).rejects.toThrow("FORBIDDEN");
    await expect(validateResultingFieldRequirements(authority.session, tx, request())).rejects.toThrow("FORBIDDEN");
  });
});
it("does not read optional unrelated private values during whole-record validation", async () => {
  const registry = buildRegistry(async () => true), author = { ...session, capabilities: new Set([...session.capabilities, "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.secret"]) };
  const privateField = await compileCustomField(author, { ...source.payload, storageGeneration: uuid(203), field: { ...source.payload.field, key: "private_flag", readCapability: "tickets.field.secret" } }, registry);
  stored(uuid(3), privateField); stage(sourceId, source, false);
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _created, proof) => {
    expect(await validateResultingFieldRequirements(authority.session, tx, request(), proof)).toMatchObject({ fieldsChecked: 3 });
    expect(m.slot.mock.calls.every(([args]) => args.where.definitionId !== uuid(3))).toBe(true);
  });
});
it("keeps independent written field and reference grants even when native conditions are false", async () => {
  const registry = buildRegistry(async () => true), author = { ...session, capabilities: new Set([...session.capabilities, "tickets.ticket.read", "tickets.ticket.manage", "tickets.field.secret"]) };
  const privateWritten = await compileCustomField(author, { ...source.payload, field: { ...source.payload.field, readCapability: "tickets.field.secret" } }, registry);
  const row = values.get(sourceId)!, written = { ...row.schemaVersion, id: uuid(104), payload: privateWritten.payload as unknown as Prisma.JsonValue,
    compiledPlan: privateWritten.plan as unknown as Prisma.JsonValue, checksum: privateWritten.checksum };
  values.set(sourceId, { ...row, versionId: written.id, schemaVersion: written }); m.native.mockResolvedValue({ ...work, priority: "LOW" });
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _created, proof) => {
    await expect(evaluateInitialFieldRequirement(authority.session, tx, fieldRequest(), proof)).rejects.toThrow("FORBIDDEN");
    const reference = await compileCustomField(author, { ...source.payload, field: { ...source.payload.field, storage: { type: "reference", entity } } }, registry);
    const version = stored(sourceId, reference);
    const metadata = { kind: "field" as const, definitionId: sourceId, versionId: version.id, checksum: version.checksum, organisationId: "company",
      entity: reference.payload.entity, generationId: reference.payload.storageGeneration, field: reference.payload.field, dependencyClosure: [] };
    const conditional = await compileConditionalCustomField({ session: author, registry, definitionId: rootId, resolveMetadata: async () => metadata },
      { ...root.payload, requiredIf: { match: "all", predicates: [{ source: { kind: "field", definitionId: sourceId, versionId: version.id, checksum: version.checksum }, operator: "present" }] } });
    stored(rootId, conditional);
    await expect(validateResultingFieldRequirements(authority.session, tx, request(), proof)).rejects.toThrow("FORBIDDEN");
  });
});
it("fails unavailable native facts and corrupt staged typed values instead of silently disabling a requirement", async () => {
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _created, proof) => {
    m.native.mockResolvedValue({ ...work, organisationId: "foreign" });
    await expect(validateResultingFieldRequirements(authority.session, tx, request(), proof)).rejects.toThrow("unavailable or changed");
    m.native.mockResolvedValue(work); const row = values.get(sourceId)!; values.set(sourceId, { ...row, fingerprint: "f".repeat(64) });
    await expect(validateResultingFieldRequirements(authority.session, tx, request(), proof)).rejects.toThrow("FIELD_STORAGE_INVALID");
  });
});
