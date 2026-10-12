import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
const m = vi.hoisted(() => ({ membership: vi.fn(), inspect: vi.fn(), preflight: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.membership } } }));
vi.mock("@/core/studio/record-types/runtime-profile", () => ({ inspectRecordProfileInTransaction: m.inspect,
  preflightRecordProfileFields: m.preflight, resolveRecordProfileInTransaction: vi.fn() }));
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { readRecordTypeMetadataChoicesInTransaction, assertRecordTypeMetadataSelectorsInTransaction } from "@/core/studio/record-types/selection";
// Genuine Session + actual retained Tickets registry and original choice parsing.
// SQL, immutable profile reconstruction and field-policy I/O are explicit mocks;
// this proves bounded ordering/transport, not PostgreSQL/native privacy or seals.
const id = (n: number) => `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const bindings = vi.fn(), binding = vi.fn(), definitions = vi.fn();
let authority: FieldRuntimeAuthority, entity: { id: string; version: number; schemaHash: string; contractHash: string }, events: string[];
beforeEach(async () => {
  vi.restoreAllMocks(); vi.clearAllMocks(); events = [];
  m.membership.mockResolvedValue({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 1, active: true,
    grantedCapabilities: ["tickets.ticket.read", "studio.definition.read"], deniedCapabilities: [], roles: [],
    user: { name: "Actor", email: "actor@example.test", authVersion: 1, platformAdmin: null },
    organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("Actor absent");
  const registry = buildRegistry(async () => true), source = registry.describe("tickets.ticket", 9);
  entity = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash };
  const tx = { studioProfileBinding: { findMany: bindings, findFirst: binding }, studioDefinition: { findFirst: definitions } } as unknown as Prisma.TransactionClient;
  authority = { session, registry, transaction: tx, stamp: sessionAuthorityStamp(session)! };
  bindings.mockResolvedValue([{ definitionId: id(1), organisationId: "company", entityId: entity.id, kind: "recordType" }]);
  binding.mockResolvedValue({ definitionId: id(1), organisationId: "company", entityId: entity.id, kind: "recordType" });
  definitions.mockImplementation(async ({ where }) => { events.push("metadata"); return { id: where.id, organisationId: "company", kind: "recordType", retiredAt: null,
    activeVersionId: id(2), activeVersion: { id: id(2), definitionId: where.id, organisationId: "company", schemaVersion: 1, checksum: "a".repeat(64) } }; });
  m.inspect.mockImplementation(async (_, pin) => { events.push("seal"); return { entity, profile: { requiredFields: [] }, reference: pin, payload: {
    schemaVersion: 1, entity, label: "Customer complaint", help: "Customer complaint details", baseProfile: {
      kind: "entityProfile", definitionId: id(3), versionId: id(4), schemaVersion: 1, checksum: "b".repeat(64) }, overlay: {} } }; });
  m.preflight.mockImplementation(async () => { events.push("current-and-pinned-fields"); });
});
it("offers only stable ID and label after current/pinned field Read, without a record/Extend/value query", async () => {
  const native = vi.spyOn(authority.registry, "authoriseRecord");
  expect(await readRecordTypeMetadataChoicesInTransaction(authority, entity)).toEqual([{ id: id(1), label: "Customer complaint" }]);
  expect(events).toEqual(["metadata", "seal", "current-and-pinned-fields"]);
  expect(bindings.mock.calls[0][0]).toEqual({ where: { organisationId: "company", entityId: entity.id, kind: "recordType" },
    select: { organisationId: true, entityId: true, kind: true, definitionId: true }, orderBy: { definitionId: "asc" }, take: 101 });
  expect(native).not.toHaveBeenCalled(); expect(Object.keys(authority.transaction)).toEqual(["studioProfileBinding", "studioDefinition"]);
  expect(authority.session.capabilities.has("tickets.ticket.manage")).toBe(false);
});
it.each(["copy", "stamp", "tenant", "read", "module", "hash", "unsupported"])("rejects %s authority before labels or SQL", async mode => {
  let input = entity;
  if (mode === "copy") authority = { ...authority, session: { ...authority.session } };
  if (mode === "stamp") authority = { ...authority, stamp: { ...authority.stamp } };
  if (mode === "tenant") authority.session.organisationId = "other";
  if (mode === "read") authority.session.capabilities.clear();
  if (mode === "module") authority.registry = buildRegistry(async () => false);
  if (mode === "hash") input = { ...entity, contractHash: "f".repeat(64) };
  if (mode === "unsupported") { const source = authority.registry.describe("tickets.ticket", 1); input = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash }; }
  await expect(readRecordTypeMetadataChoicesInTransaction(authority, input)).rejects.toThrow();
  expect(bindings).not.toHaveBeenCalled(); expect(definitions).not.toHaveBeenCalled();
});
it("omits denied private field metadata before exposing type labels; invalid seals never disappear silently", async () => {
  m.preflight.mockRejectedValue(new Error("FORBIDDEN: field Read"));
  expect(await readRecordTypeMetadataChoicesInTransaction(authority, entity)).toEqual([]);
  m.inspect.mockRejectedValue(new Error("DEPENDENCY_BROKEN: seal"));
  await expect(readRecordTypeMetadataChoicesInTransaction(authority, entity)).rejects.toThrow("DEPENDENCY_BROKEN");
});
it.each(["duplicate", "bound", "foreign-binding", "foreign-definition", "foreign-version", "foreign-entity", "retired", "inactive"])("enforces %s metadata identity and eligibility", async mode => {
  if (mode === "duplicate") bindings.mockResolvedValue(Array.from({ length: 2 }, () => ({ definitionId: id(1), organisationId: "company", entityId: entity.id, kind: "recordType" })));
  if (mode === "bound") bindings.mockResolvedValue(Array.from({ length: 101 }, (_, n) => ({ definitionId: id(n + 10), organisationId: "company", entityId: entity.id, kind: "recordType" })));
  if (mode === "foreign-binding") bindings.mockResolvedValue([{ definitionId: id(1), organisationId: "other", entityId: entity.id, kind: "recordType" }]);
  const original = definitions.getMockImplementation()!;
  if (mode === "foreign-definition") definitions.mockImplementation(async args => ({ ...await original(args), organisationId: "other" }));
  if (mode === "foreign-version") definitions.mockImplementation(async args => { const row = await original(args); return { ...row, activeVersion: { ...row.activeVersion, definitionId: id(99) } }; });
  if (mode === "foreign-entity") m.inspect.mockResolvedValue({ entity: { ...entity, id: "other.entity" } });
  if (mode === "retired" || mode === "inactive") definitions.mockResolvedValue(null); // SQL WHERE retiredAt/null-active excludes both.
  if (mode === "retired" || mode === "inactive") expect(await readRecordTypeMetadataChoicesInTransaction(authority, entity)).toEqual([]);
  else await expect(readRecordTypeMetadataChoicesInTransaction(authority, entity)).rejects.toThrow();
});
it("checks only USED active selectors, rejects missing/foreign/retired/private choices, and keeps empty existing pages unchanged", async () => {
  await assertRecordTypeMetadataSelectorsInTransaction(authority, entity, []); expect(binding).not.toHaveBeenCalled();
  await assertRecordTypeMetadataSelectorsInTransaction(authority, entity, [id(1)]); expect(m.preflight).toHaveBeenCalled();
  binding.mockResolvedValue(null); await expect(assertRecordTypeMetadataSelectorsInTransaction(authority, entity, [id(1)])).rejects.toThrow();
  binding.mockResolvedValue({ definitionId: id(1), organisationId: "other", entityId: entity.id, kind: "recordType" });
  await expect(assertRecordTypeMetadataSelectorsInTransaction(authority, entity, [id(1)])).rejects.toThrow();
  binding.mockResolvedValue({ definitionId: id(1), organisationId: "company", entityId: entity.id, kind: "recordType" });
  definitions.mockResolvedValue(null); await expect(assertRecordTypeMetadataSelectorsInTransaction(authority, entity, [id(1)])).rejects.toThrow();
  definitions.mockImplementation(async ({ where }) => ({ id: where.id, organisationId: "company", kind: "recordType", retiredAt: null,
    activeVersionId: id(2), activeVersion: { id: id(2), definitionId: where.id, organisationId: "company", schemaVersion: 1, checksum: "a".repeat(64) } }));
  m.preflight.mockRejectedValue(new Error("FORBIDDEN: field Read"));
  await expect(assertRecordTypeMetadataSelectorsInTransaction(authority, entity, [id(1)])).rejects.toThrow("FORBIDDEN");
});
it("joins authorised type metadata to a record catalogue without reading actual facts or values", async () => {
  const { pageEditorCatalogInTransaction } = await import("@/core/studio/authoring/catalog");
  const { pagePayloadSchema } = await import("@/core/studio/pages/schema");
  const tx = authority.transaction as unknown as { studioDefinition: { findFirst: typeof definitions; findMany: ReturnType<typeof vi.fn> } };
  tx.studioDefinition.findMany = vi.fn(async () => []);
  const forms = ["desktop", "tablet", "phone"];
  const page = pagePayloadSchema.parse({ schemaVersion: 1, entity, formFactors: forms, sections: [{ id: "main", label: "Ticket", formFactors: forms,
    columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: "guide", type: "instructions", text: "Ticket help", formFactors: forms }] }] });
  const result = await pageEditorCatalogInTransaction(authority, page);
  expect(result.conditions.recordTypes).toMatchObject([{ id: id(1), label: "Customer complaint" }]);
  expect(result.conditions.recordTypes[0].whereUsedHref).toContain(`version=${id(2)}`);
  expect(result.conditions.recordTypes[0].sourceHref).toBe(`/design-studio/setup/${id(1)}`);
  expect(result.scope).toBe("record"); expect(Object.keys(result.conditions.recordTypes[0])).toEqual(["id", "label", "sourceHref", "whereUsedHref"]);
  m.preflight.mockRejectedValue(new Error("FORBIDDEN: private field Read"));
  const denied = await pageEditorCatalogInTransaction(authority, page);
  expect(denied.conditions.recordTypes).toEqual([]); expect(JSON.stringify(denied)).not.toContain("Customer complaint");
});
