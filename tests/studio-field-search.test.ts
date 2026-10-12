import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinitionVersion, StudioFieldValue } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), enabled: vi.fn(), states: vi.fn(), definition: vi.fn(),
  generation: vi.fn(), slots: vi.fn(), values: vi.fn(), nativeMany: vi.fn(), native: vi.fn(), queueMember: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const { ticketStudioContract } = await import("@/core/service-work/studio");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => {
    const registry = new CapabilityRegistry(available); registry.register("tickets", ticketStudioContract); return registry;
  } };
});
import { sessionForUser } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { query, checksum } from "@/core/studio/registry/contracts";
import { ticketStudioContract } from "@/core/service-work/studio";
import { fieldRuntimeAuthorityInTransaction } from "@/core/studio/fields/runtime-authority";
import { searchCurrentFieldValuesInTransaction } from "@/core/studio/fields/search";
import { fieldSearchRequestSchema, fieldSearchWindowSchema, fieldSearchWindowResultSchema } from "@/core/studio/fields/search-contract";
import { customFieldPayloadSchema, type FieldStorage } from "@/core/studio/fields/schema";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

// Genuine current session/registry/compiler/sealed readers and actual owner
// query are used. Membership, native/private rows, metadata and typed predicates
// are explicit in-memory SQL collaborators, not PostgreSQL/index/SSI evidence.
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company },
  moduleState: { findFirst: m.enabled, findMany: m.states }, studioDefinition: { findFirst: m.definition },
  studioFieldGeneration: { findFirst: m.generation }, studioFieldSlot: { findMany: m.slots }, studioFieldValue: { findMany: m.values },
  serviceWorkItem: { findMany: m.nativeMany, findFirst: m.native }, serviceQueueMember: { findFirst: m.queueMember } } as unknown as Prisma.TransactionClient;
let grants: string[], nativeRows: { id: string; organisationId: string; version: number; visible: boolean }[];
let version: StudioDefinitionVersion, definition: { id: string; organisationId: string; key: string; revision: number; activeVersionId: string; activeVersion: StudioDefinitionVersion; retiredAt: Date | null };
let slots: Slot[], values: Value[];
type Value = StudioFieldValue & { schemaVersion: StudioDefinitionVersion };
type Slot = { id: string; organisationId: string; entityId: string; definitionId: string; generationId: string; revision: number; activeValueId: string;
  extensionId: string; extension: { id: string; organisationId: string; entityId: string; recordId: string }; activeValue: Value };
const request = () => ({ definitionId: definition.id, definitionRevision: definition.revision, versionId: version.id, generationId: uuid(2),
  filter: { operator: "equals" as const, value: { type: "integer" as const, value: 0 } }, limit: 2 });
beforeEach(() => {
  vi.resetAllMocks(); grants = ["tickets.ticket.read", "tickets.field.read"];
  nativeRows = [{ id: "a", organisationId: "company", version: 4, visible: true }, { id: "b", organisationId: "company", version: 5, visible: true },
    { id: "c", organisationId: "company", version: 6, visible: true }, { id: "private", organisationId: "company", version: 7, visible: false }];
  slots = []; values = [];
  m.member.mockImplementation(async ({ where }) => {
    const { organisationId, userId } = where.organisationId_userId;
    return { id: `${organisationId}-${userId}`, organisationId, userId, active: true, sessionVersion: 2, roles: [], grantedCapabilities: [...grants], deniedCapabilities: [],
      user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
      organisation: { id: organisationId, name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } };
  });
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  m.company.mockImplementation(async ({ where }) => ({ id: where.id })); m.enabled.mockResolvedValue({ id: "enabled" });
  m.states.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }]); m.generation.mockImplementation(async ({ where }) => ({ id: where.id }));
  m.definition.mockImplementation(async ({ where }) => where.organisationId === definition.organisationId && definition.retiredAt === null ? definition : null);
  m.native.mockImplementation(async ({ where }) => {
    const row = nativeRows.find(row => row.id === where.AND[1].id && row.visible && row.organisationId === where.AND[0].organisationId);
    return row ? { ...row, status: "NEW", mergedIntoId: null, queueId: "queue", queue: { restricted: false } } : null;
  });
  m.nativeMany.mockImplementation(async ({ where, select, take }) => {
    const clause = where.AND[1];
    const rows = nativeRows.filter(row => row.visible && row.organisationId === where.AND[0].organisationId
      && (!clause.id?.gt || row.id > clause.id.gt) && (!clause.id?.in || clause.id.in.includes(row.id))).slice(0, take);
    return select.subject ? rows.map(row => ({ ...row, number: `TKT-${row.id}`, subject: `Allowed ${row.id}`, status: "NEW", type: "TASK", priority: "NORMAL", createdAt: new Date(0), updatedAt: new Date(0) })) : rows;
  });
  m.slots.mockImplementation(async ({ where }) => slots.filter(slot => slot.organisationId === where.organisationId && slot.generationId === where.generationId
    && where.extension.recordId.in.includes(slot.extension.recordId)));
  m.values.mockImplementation(async ({ where }) => values.filter(row => row.organisationId === where.organisationId && row.generationId === where.generationId
    && where.OR.some((pair: { id: string; slotId: string }) => pair.id === row.id && pair.slotId === row.slotId)
    && (where.fingerprint === undefined || row.fingerprint === where.fingerprint)
    && (where.currency === undefined || row.currency === where.currency)
    && ["integerValue", "decimalValue", "dateValue", "instantValue"].every(column => {
      const condition = where[column], actual = row[column as "integerValue" | "decimalValue" | "dateValue" | "instantValue"];
      if (condition === undefined) return true;
      if (actual === null) return false;
      for (const operator of ["gte", "lte"] as const) {
        const bound = condition[operator]; if (bound === undefined) continue;
        const comparison = typeof actual === "bigint" ? (actual < bound ? -1 : actual > bound ? 1 : 0)
          : actual instanceof Date ? actual.getTime() - bound.getTime() : actual.comparedTo(bound);
        if ((operator === "gte" && comparison < 0) || (operator === "lte" && comparison > 0)) return false;
      }
      return true;
    })));

  m.transaction.mockImplementation(async operation => operation(tx));
});
async function authority(company = "company") {
  const session = await sessionForUser(company, "actor"); if (!session) throw new Error("Missing unit session.");
  return fieldRuntimeAuthorityInTransaction(session, tx);
}
async function configure(storage: FieldStorage = { type: "integer" }, conditional = false) {
  const a = await authority(), metadata = a.registry.describe("tickets.ticket", 9), entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(2), field: { key: "extra", label: "Extra", classification: "confidential", indexed: true,
    readCapability: "tickets.field.read", writeCapability: "tickets.field.write", storage } });
  const author = { ...a.session, capabilities: new Set([...a.session.capabilities, "tickets.field.write"]) };
  const compiled = conditional ? await compileConditionalCustomField({ session: author, registry: a.registry, definitionId: uuid(1),
    resolveMetadata: source => source.kind === "native" ? registeredRequiredFactMetadata(author, a.registry, entity, source.fieldId) : Promise.reject(new Error("Unexpected input graph")) },
    { ...payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } })
    : await compileCustomField(author, payload, a.registry);
  version = { id: uuid(3), definitionId: uuid(1), organisationId: "company", version: 1, semanticVersion: "1.0.0", schemaVersion: compiled.payload.schemaVersion,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "author", publishedAt: new Date() };
  definition = { id: uuid(1), organisationId: "company", key: "tickets.ticket.extra", revision: 3, activeVersionId: version.id, activeVersion: version, retiredAt: null };
  return { authority: a, payload: compiled.payload };
}
function save(payload: Awaited<ReturnType<typeof configure>>["payload"], recordId: string, raw: unknown, written = version, generationId = uuid(2)) {
  const n = values.length, slotId = uuid(20 + n), extensionId = uuid(30 + n);
  const row = { id: uuid(40 + n), ...encodeFieldValue(payload.field, raw), organisationId: "company", definitionId: definition.id,
    generationId, slotId, versionId: written.id, revision: 1, createdBy: "author", createdAt: new Date(), schemaVersion: written } as Value;
  const slot: Slot = { id: slotId, organisationId: "company", entityId: "tickets.ticket", definitionId: definition.id, generationId,
    revision: 1, activeValueId: row.id, extensionId, extension: { id: extensionId, organisationId: "company", entityId: "tickets.ticket", recordId }, activeValue: row };
  values.push(row); slots.push(slot); return { row, slot };
}

it("matches exact indexed zero and false without field Write/authoring, returns anchors and native projection only", async () => {
  let configured = await configure(); save(configured.payload, "a", 0); save(configured.payload, "b", 1);
  const result = await searchCurrentFieldValuesInTransaction(configured.authority, request());
  expect(result.records.map(row => row.recordId)).toEqual(["a"]); expect(result.next?.after).toBe("b");
  expect(m.values).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ fingerprint: encodeFieldValue(configured.payload.field, 0).fingerprint }) }));
  const queryRef = configured.authority.registry.describe("tickets.ticket.field_search", 1);
  const projected = await configured.authority.registry.invoke(configured.authority.session, queryRef, request()) as { records: { fields: unknown }[] };
  expect(projected.records[0].fields).toEqual(expect.objectContaining({ subject: "Allowed a" })); expect(JSON.stringify(projected)).not.toContain("integerValue");
  values = []; slots = []; configured = await configure({ type: "boolean" }); save(configured.payload, "a", false); save(configured.payload, "b", true);
  expect((await searchCurrentFieldValuesInTransaction(configured.authority, { ...request(), filter: { operator: "equals", value: { type: "boolean", value: false } } })).records.map(row => row.recordId)).toEqual(["a"]);
});
it("uses the bounded indexed-read deadline through the registered owning query and preserves supplied transactions", async () => {
  const { authority: a, payload } = await configure(); save(payload, "a", 0);
  const queryRef = a.registry.describe("tickets.ticket.field_search", 1);
  m.transaction.mockClear();
  const result = await a.registry.invoke(a.session, queryRef, request());
  expect(result).toEqual(expect.objectContaining({ records: [expect.objectContaining({ id: "a" })] }));
  expect(m.transaction).toHaveBeenCalledTimes(1);
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable", timeout: 20_000 });

  // The original optional owner callback can share a genuine caller-owned
  // transaction. Do not open a nested transaction or rewrite its deadline.
  const contribution = ticketStudioContract.contributions.find(item => item.metadata.id === queryRef.id && item.metadata.version === queryRef.version);
  if (!contribution?.run) throw new Error("Missing registered search callback.");
  m.transaction.mockClear();
  expect(await contribution.run({ session: a.session, transaction: tx }, request())).toEqual(result);
  expect(m.transaction).not.toHaveBeenCalled();
  expect(a.registry.describe(queryRef.id, queryRef.version)).toEqual(queryRef);
});
it("advances scanned windows even without matches and binds cursor to actor/tenant/config/filter", async () => {
  const { authority: a, payload } = await configure(); save(payload, "a", 8); save(payload, "b", 9); save(payload, "c", 0);
  const first = await searchCurrentFieldValuesInTransaction(a, request()); expect(first.records).toEqual([]); expect(first.next?.after).toBe("b");
  const next = await searchCurrentFieldValuesInTransaction(a, { ...request(), cursor: first.next }); expect(next.records.map(row => row.recordId)).toEqual(["c"]); expect(next.next).toBeNull();
  await expect(searchCurrentFieldValuesInTransaction(a, { ...request(), filter: { operator: "equals", value: { type: "integer", value: 8 } }, cursor: first.next })).rejects.toThrow("CONFLICT");
  await expect(searchCurrentFieldValuesInTransaction(a, { ...request(), cursor: { after: "b", checksum: "f".repeat(64) } })).rejects.toThrow("CONFLICT");
  const foreign = await authority("foreign"); await expect(searchCurrentFieldValuesInTransaction(foreign, request())).rejects.toThrow("FIELD_UNAVAILABLE");
});
it("checks every selected written field grant before the protected predicate, including nonmatching values", async () => {
  const { authority: a, payload } = await configure(); const author = { ...a.session, capabilities: new Set([...a.session.capabilities, "tickets.field.old", "tickets.field.write"]) };
  const compiled = await compileCustomField(author, { ...payload, field: { ...payload.field, readCapability: "tickets.field.old" } }, a.registry);
  const old = { ...version, id: uuid(4), payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  save(payload, "a", 0); save(payload, "b", 900, old);
  await expect(searchCurrentFieldValuesInTransaction(a, request())).rejects.toThrow("tickets.field.old"); expect(m.values).not.toHaveBeenCalled();
  expect(m.slots.mock.calls[0][0].select.activeValue.select).not.toHaveProperty("integerValue");
  grants.push("tickets.field.old"); expect((await searchCurrentFieldValuesInTransaction(a, request())).records.map(row => row.recordId)).toEqual(["a"]);
});
it("denies revoked/stale/copied authority and current grants/modules before native windows or typed matching", async () => {
  const { authority: a } = await configure(); grants = []; await expect(searchCurrentFieldValuesInTransaction(a, request())).rejects.toThrow("FORBIDDEN");
  expect(m.nativeMany).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled();
  await expect(searchCurrentFieldValuesInTransaction({ ...a, session: { ...a.session } }, request())).rejects.toThrow("FORBIDDEN");
  grants = ["tickets.ticket.read", "tickets.field.read"]; m.states.mockResolvedValue([]);
  await expect(searchCurrentFieldValuesInTransaction(a, request())).rejects.toThrow("DEPENDENCY_BROKEN"); expect(m.values).not.toHaveBeenCalled();
});
it("excludes private native rows, absent anchors, obsolete generations and history pointers", async () => {
  const { authority: a, payload } = await configure(); save(payload, "private", 0); save(payload, "a", 0, version, uuid(99)); save(payload, "b", 1);
  const result = await searchCurrentFieldValuesInTransaction(a, request()); expect(result.records).toEqual([]);
  expect(m.slots.mock.calls[0][0].where.extension.recordId.in).toEqual(["a", "b"]); expect(m.slots.mock.calls[0][0].where.generationId).toBe(uuid(2));
  expect(m.values.mock.calls[0][0].where.OR).toEqual([{ id: values[2].id, slotId: values[2].slotId }]);
});
it("uses exact range columns and rejects nonindexed, structured, wrong-type/range and unknown/coerced requests", async () => {
  const { authority: a, payload } = await configure(); save(payload, "a", -1); save(payload, "b", 1);
  expect((await searchCurrentFieldValuesInTransaction(a, { ...request(), filter: { operator: "gte", value: { type: "integer", value: 0 } } })).records.map(row => row.recordId)).toEqual(["b"]);
  expect(m.values.mock.calls[0][0].where.integerValue).toEqual({ gte: 0n });
  for (const filter of [{ operator: "contains", value: { type: "integer", value: 0 } }, { operator: "equals", value: { type: "integer", value: "0" } }, { operator: "gte", value: null }])
    expect(fieldSearchRequestSchema.safeParse({ ...request(), filter }).success).toBe(false);
  expect(fieldSearchRequestSchema.safeParse({ ...request(), organisationId: "company" }).success).toBe(false);
  expect(fieldSearchRequestSchema.safeParse({ ...request(), limit: 51 }).success).toBe(false);
  await expect(searchCurrentFieldValuesInTransaction(a, { ...request(), filter: { operator: "equals", value: { type: "boolean", value: false } } })).rejects.toThrow("FIELD_SEARCH_INVALID");
  const compiled = await compileCustomField({ ...a.session, capabilities: new Set([...grants, "tickets.field.write"]) }, { ...payload, field: { ...payload.field, indexed: false } }, a.registry);
  definition.activeVersion = { ...version, payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  await expect(searchCurrentFieldValuesInTransaction(a, request())).rejects.toThrow("FIELD_SEARCH_UNSUPPORTED");
});
it("reads sealed2 without evaluating its condition graph/facts and validates stored mirrors before matches", async () => {
  const { authority: a, payload } = await configure({ type: "integer" }, true); const saved = save(payload, "a", 0);
  expect((await searchCurrentFieldValuesInTransaction(a, request())).records.map(row => row.recordId)).toEqual(["a"]);
  expect(m.nativeMany).toHaveBeenCalledTimes(1); // only owner window, no native fact query
  saved.slot.activeValueId = uuid(98); m.values.mockClear(); await expect(searchCurrentFieldValuesInTransaction(a, request())).rejects.toThrow("FIELD_STORAGE_INVALID"); expect(m.values).not.toHaveBeenCalled();
  definition.retiredAt = new Date(); await expect(searchCurrentFieldValuesInTransaction(a, request())).rejects.toThrow("FIELD_UNAVAILABLE");
});
it("reference equality proves literal target Read before protected matching, even without any match", async () => {
  const { authority: a } = await configure(); const ref = a.registry.describe("tickets.ticket", 9);
  const configured = await configure({ type: "reference", entity: { id: ref.id, version: ref.version, schemaHash: ref.schemaHash, contractHash: ref.contractHash } });
  save(configured.payload, "a", "private");
  await expect(searchCurrentFieldValuesInTransaction(configured.authority, { ...request(), filter: { operator: "equals", value: { type: "reference", value: "private" } } })).rejects.toThrow("Ticket unavailable");
  expect(m.values).not.toHaveBeenCalled();
});
it("registers owner window policies atomically, rejects second IDs/capability drift, and latest unsupported fails without fallback", async () => {
  const { authority: a } = await configure(); const source = a.registry.describe("tickets.ticket", 9);
  const base = { version: 2, label: "Search window", capability: "tickets.ticket.read", lifecycle: "active" as const, classification: "confidential" as const,
    kind: "query" as const, input: fieldSearchWindowSchema, output: fieldSearchWindowResultSchema, transaction: "required" as const,
    pagination: "cursor" as const, maxCardinality: 50, costClass: "medium" as const, execute: async () => ({ records: [], next: null }) };
  expect(() => a.registry.register("tickets", { contributions: [query({ ...base, id: "tickets.ticket.other_window", fieldSearch: { entityId: source.id, fieldVersions: [9] } })] })).toThrow("One stable");
  expect(() => a.registry.describe("tickets.ticket.other_window", 2)).toThrow("missing");
  expect(() => a.registry.register("tickets", { contributions: [query({ ...base, id: "tickets.ticket.bad_window", capability: "tickets.ticket.manage", fieldSearch: { entityId: source.id, fieldVersions: [9] } })] })).toThrow("same owner");
  a.registry.register("tickets", { contributions: [query({ ...base, id: "tickets.ticket.field_search_window", fieldSearch: { entityId: source.id, fieldVersions: [2] } })] });
  await expect(a.registry.invokeFieldSearchWindow({ session: a.session, transaction: tx }, source, { limit: 2 })).rejects.toThrow("does not approve");
  await expect(a.registry.invokeFieldSearchWindow({ session: { ...a.session }, transaction: tx }, source, { limit: 2 })).rejects.toThrow("genuine");
  const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
  expect(registry.describe("tickets.ticket.list", 1)).toEqual(a.registry.describe("tickets.ticket.list", 1));
  expect(checksum(registry.describe("tickets.ticket", 9))).toBe(checksum(source));
});
it("rejects foreign/duplicate/unordered/oversize owner windows before field/value reads", async () => {
  const { authority: a } = await configure(), source = a.registry.describe("tickets.ticket", 9);
  for (const response of [ { records: [{ recordId: "a", organisationId: "foreign", revision: 4 }], next: null },
    { records: [{ recordId: "b", organisationId: "company", revision: 5 }, { recordId: "a", organisationId: "company", revision: 4 }], next: null },
    { records: [{ recordId: "a", organisationId: "company", revision: 4 }], next: "b" } ]) {
    const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
    registry.register("tickets", { contributions: [query({ id: "tickets.ticket.field_search_window", version: 2, label: "Broken", kind: "query", capability: "tickets.ticket.read",
      lifecycle: "active", classification: "confidential", input: fieldSearchWindowSchema, output: fieldSearchWindowResultSchema, transaction: "required", fieldSearch: { entityId: source.id, fieldVersions: [9] },
      pagination: "cursor", maxCardinality: 50, costClass: "medium", execute: async () => response })] });
    await expect(registry.invokeFieldSearchWindow({ session: a.session, transaction: tx }, source, { limit: 2 })).rejects.toThrow("FIELD_STORAGE_INVALID");
  }
  expect(m.slots).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled();
});

it("fails closed when the latest stable window ID drops its opt-in entirely", async () => {
  const { authority: a } = await configure(), source = a.registry.describe("tickets.ticket", 9);
  a.registry.register("tickets", { contributions: [query({ id: "tickets.ticket.field_search_window", version: 2, label: "No longer opted in", kind: "query",
    capability: "tickets.ticket.read", lifecycle: "active", classification: "confidential", input: fieldSearchWindowSchema,
    output: fieldSearchWindowResultSchema, pagination: "cursor", maxCardinality: 50, costClass: "medium", execute: async () => ({ records: [], next: null }) })] });
  await expect(a.registry.invokeFieldSearchWindow({ session: a.session, transaction: tx }, source, { limit: 2 })).rejects.toThrow("does not approve");
  expect(m.nativeMany).not.toHaveBeenCalled();
});
it("distinguishes explicit current null from missing slots and retains stale schema/generation/cursor denial", async () => {
  const { authority: a, payload } = await configure(); save(payload, "a", null);
  const result = await searchCurrentFieldValuesInTransaction(a, { ...request(), filter: { operator: "equals", value: null } });
  expect(result.records.map(row => row.recordId)).toEqual(["a"]);
  for (const changed of [{ definitionRevision: 2 }, { versionId: uuid(999) }, { generationId: uuid(999) }]) {
    await expect(searchCurrentFieldValuesInTransaction(a, { ...request(), ...changed })).rejects.toThrow("CONFLICT");
  }
  await expect(searchCurrentFieldValuesInTransaction(a, request(), "projects.project")).rejects.toThrow("owning surface");
});

it.each([
  { storage: { type: "decimal", precision: 28, scale: 10 }, low: "0.0000000001", high: "0.0000000003", bound: "0.0000000002", column: "decimalValue" },
  { storage: { type: "money", precision: 28, scale: 10, currencies: ["GBP", "USD"] }, low: { amount: "1.10", currency: "GBP" }, high: { amount: "2.20", currency: "GBP" }, bound: { amount: "1.50", currency: "GBP" }, column: "decimalValue" },
  { storage: { type: "date" }, low: "2026-10-01", high: "2026-10-20", bound: "2026-10-10", column: "dateValue" },
  { storage: { type: "datetime", timezone: "UTC" }, low: "2026-10-11T00:00:00.000Z", high: "2026-10-11T12:00:00.000Z", bound: "2026-10-11T06:00:00.000Z", column: "instantValue" },
])("uses existing typed $column index family without numeric/date coercion", async ({ storage, low, high, bound, column }) => {
  const { authority: a, payload } = await configure(storage as FieldStorage); save(payload, "a", low); save(payload, "b", high);
  const result = await searchCurrentFieldValuesInTransaction(a, { ...request(), filter: { operator: "gte", value: { type: storage.type, value: bound } } });
  expect(result.records.map(row => row.recordId)).toEqual(["b"]);
  expect(m.values.mock.calls[0][0].where[column]).toHaveProperty("gte");
  if (storage.type === "money") expect(m.values.mock.calls[0][0].where.currency).toBe("GBP");
});
