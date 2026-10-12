import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinitionVersion } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), states: vi.fn(), bindings: vi.fn(), generation: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const { ticketStudioContract } = await import("@/core/service-work/studio");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => {
    const registry = new CapabilityRegistry(available); registry.register("tickets", ticketStudioContract); return registry;
  } };
});
import { sessionForUser } from "@/core/auth/session";
import { fieldRuntimeAuthorityInTransaction } from "@/core/studio/fields/runtime-authority";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema, type FieldStorage } from "@/core/studio/fields/schema";
import { ticketSearchFieldsInTransaction, searchTicketAdditionalDetailReferences, searchTicketAdditionalDetails } from "@/core/service-work/field-search";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
// Genuine session issuance/runtime refresh, registry and sealed field compiler.
// SQL/membership/binding rows are explicit fixtures. Provider invocation is spied
// for API dispatch; existing studio-field-search suite covers the original engine.
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company }, moduleState: { findMany: m.states },
  studioFieldBinding: { findMany: m.bindings }, studioFieldGeneration: { findFirst: m.generation } } as unknown as Prisma.TransactionClient;
let transactionOpen: boolean;
let grants: string[], version: StudioDefinitionVersion, rows: Binding[];
type Binding = { organisationId: string; entityId: string; fieldKey: string; definitionId: string; definition: { id: string; organisationId: string; kind: string; key: string; revision: number; activeVersionId: string | null; activeVersion: StudioDefinitionVersion | null; retiredAt: Date | null } };
beforeEach(() => {
  vi.resetAllMocks(); transactionOpen = false; grants = ["tickets.ticket.read", "tickets.field.read"]; rows = [];
  m.member.mockImplementation(async ({ where }) => { const { organisationId, userId } = where.organisationId_userId;
    return { id: `${organisationId}-${userId}`, organisationId, userId, active: true, sessionVersion: 2, roles: [], grantedCapabilities: [...grants], deniedCapabilities: [],
      user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null }, organisation: { id: organisationId, name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } };
  });
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  m.company.mockImplementation(async ({ where }) => ({ id: where.id })); m.states.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }]);
  m.bindings.mockImplementation(async () => rows); m.generation.mockImplementation(async ({ where }) => ({ id: where.id })); m.transaction.mockImplementation(async operation => { transactionOpen = true; try { return await operation(tx); } finally { transactionOpen = false; } });
});
async function authority() { const session = await sessionForUser("company", "actor"); if (!session) throw Error("Missing fixture"); return fieldRuntimeAuthorityInTransaction(session, tx); }
async function configure(storage: FieldStorage = { type: "integer" }, indexed = true, conditional = false) {
  const a = await authority(), owner = a.registry.describe("tickets.ticket", 9);
  const author = { ...a.session, capabilities: new Set([...grants, "tickets.field.write"]) };
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1,
    entity: { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash }, storageGeneration: uuid(2),
    field: { key: "extra", label: "Visit count", help: "Team guidance", classification: "confidential", indexed, readCapability: "tickets.field.read", storage } });
  const compiled = conditional ? await compileConditionalCustomField({ session: author, registry: a.registry, definitionId: uuid(1),
    resolveMetadata: source => source.kind === "native" ? registeredRequiredFactMetadata(author, a.registry, payload.entity, source.fieldId) : Promise.reject(new Error("Unexpected condition")) },
    { ...payload, schemaVersion: 2, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } })
    : await compileCustomField(author, payload, a.registry);
  version = { id: uuid(3), definitionId: uuid(1), organisationId: "company", version: 1, semanticVersion: "1.0.0", schemaVersion: compiled.payload.schemaVersion,
    payload: compiled.payload as unknown as Prisma.JsonValue, compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum, createdBy: "author", publishedAt: new Date() };
  rows = [{ organisationId: "company", entityId: "tickets.ticket", fieldKey: "extra", definitionId: uuid(1), definition: { id: uuid(1), organisationId: "company", kind: "customField", key: "tickets.ticket.extra", revision: 4, activeVersionId: version.id, activeVersion: version, retiredAt: null } }];
  return a;
}
const observed = () => ({ definitionId: uuid(1), definitionRevision: 4, versionId: uuid(3), generationId: uuid(2) });
it("discovers current sealed indexed controls with native/field Read only and no values/default/Write grant", async () => {
  const a = await configure(), fields = await ticketSearchFieldsInTransaction(a);
  expect(fields).toEqual([{ ...observed(), label: "Visit count", help: "Team guidance", storage: { type: "integer" } }]);
  expect(m.bindings.mock.calls[0][0]).toMatchObject({ where: { organisationId: "company", entityId: "tickets.ticket" }, take: 101 });
  expect(grants).not.toContain("tickets.field.write"); expect(JSON.stringify(fields)).not.toMatch(/requiredIf|readCapability|writeCapability|defaultValue/);
});
it("reads a sealed conditional control as base metadata without native condition providers", async () => {
  const a = await configure({ type: "integer" }, true, true);
  expect(await ticketSearchFieldsInTransaction(a)).toMatchObject([{ label: "Visit count", ...observed() }]);
  expect(version.schemaVersion).toBe(2); expect(Object.keys(tx)).not.toContain("serviceWorkItem");
});
it("no configuration stays empty, retired/unindexed fields stay unavailable", async () => {
  const a = await authority(); expect(await ticketSearchFieldsInTransaction(a)).toEqual([]);
  await configure({ type: "integer" }, false); expect(await ticketSearchFieldsInTransaction(a)).toEqual([]);
  rows[0].definition.retiredAt = new Date(); expect(await ticketSearchFieldsInTransaction(a)).toEqual([]);
});
it("omits independently revoked field names, but denies revoked native access before binding discovery", async () => {
  const a = await configure(); grants = ["tickets.ticket.read"];
  expect(await ticketSearchFieldsInTransaction(a)).toEqual([]); m.bindings.mockClear(); grants = ["tickets.field.read"];
  await expect(ticketSearchFieldsInTransaction(a)).rejects.toThrow("FORBIDDEN"); expect(m.bindings).not.toHaveBeenCalled();
});
it.each(["foreign", "pointer", "checksum", "binding", "duplicates", "overflow", "revision", "schema"])("fails closed on %s metadata rather than hiding a broken setup", async mode => {
  const a = await configure();
  if (mode === "foreign") rows[0].organisationId = "other";
  if (mode === "pointer") rows[0].definition.activeVersionId = uuid(99);
  if (mode === "checksum") version.checksum = "f".repeat(64);
  if (mode === "binding") rows[0].fieldKey = "wrong";
  if (mode === "duplicates") rows.push(rows[0]);
  if (mode === "overflow") rows = Array.from({ length: 101 }, () => rows[0]);
  if (mode === "revision") rows[0].definition.revision = -1;
  if (mode === "schema") version.schemaVersion = 99;
  await expect(ticketSearchFieldsInTransaction(a)).rejects.toThrow();
});
it("genuine stamp/Serializable/session refresh happens before metadata", async () => {
  const a = await configure(); m.bindings.mockClear(); await expect(ticketSearchFieldsInTransaction({ ...a, session: { ...a.session } })).rejects.toThrow("FORBIDDEN"); expect(m.bindings).not.toHaveBeenCalled();
  m.raw.mockResolvedValue([{ transaction_isolation: "read committed" }]); await expect(ticketSearchFieldsInTransaction(a)).rejects.toThrow("serializable"); expect(m.bindings).not.toHaveBeenCalled();
});
it("dispatches only the original known read query and keeps empty scanned continuation", async () => {
  const a = await configure();
  // withFieldRuntimeAuthority genuinely builds a separate registry; spy its prototype.
  const prototype = vi.spyOn(Object.getPrototypeOf(a.registry), "invoke").mockImplementation(async () => {
    expect(transactionOpen).toBe(false); return { records: [], next: { after: "native-a", checksum: "a".repeat(64) } };
  });
  const input = { ...observed(), filter: { operator: "equals", value: { type: "integer", value: 0 } }, limit: 25 };
  expect(await searchTicketAdditionalDetails(a.session, input)).toMatchObject({ records: [], next: { after: "native-a" } });
  expect(prototype.mock.calls[0][1]).toMatchObject({ id: "tickets.ticket.field_search", version: 1 }); expect(prototype.mock.calls[0][2]).toEqual(input);
  await expect(searchTicketAdditionalDetails(a.session, { ...input, organisationId: "foreign" })).rejects.toThrow(); expect(prototype).toHaveBeenCalledTimes(1);
  prototype.mockRestore();
});
it("read-only reference choices reject stale or revoked metadata before native list provider", async () => {
  const a = await authority(), owner = a.registry.describe("tickets.ticket", 9);
  await configure({ type: "reference", entity: { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash } });
  const invoke = vi.spyOn(Object.getPrototypeOf(a.registry), "invoke").mockResolvedValue({ records: [{ id: "native-1", fields: { number: "TKT-1", subject: "Visible visit" } }] });
  expect(await searchTicketAdditionalDetailReferences(a.session, { ...observed(), search: "Visit" })).toEqual([{ id: "native-1", label: "TKT-1 · Visible visit" }]);
  expect(invoke.mock.calls[0][1]).toMatchObject({ id: "tickets.ticket.list", version: 1 }); expect(invoke.mock.calls[0][2]).toEqual({ search: "Visit", limit: 25 });
  await expect(searchTicketAdditionalDetailReferences(a.session, { ...observed(), definitionRevision: 3, search: "" })).rejects.toThrow("CONFLICT");
  grants = ["tickets.ticket.read"]; await expect(searchTicketAdditionalDetailReferences(a.session, { ...observed(), search: "" })).rejects.toThrow("FORBIDDEN"); expect(invoke).toHaveBeenCalledTimes(1); invoke.mockRestore();
});
