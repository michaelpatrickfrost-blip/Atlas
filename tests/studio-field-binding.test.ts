import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { assertCosmeticFieldEvolution, assertFieldBinding, bindPublishedField } from "@/core/studio/fields/binding";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { compileDefinition, parseDefinitionPayload } from "@/core/studio/compiler";
const session: Session = { userId: "actor", userName: "Actor", userEmail: "a@example.test", organisationId: "tenant-a", organisationName: "A", membershipId: "m", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const registry = buildRegistry(async () => true);
function payload() {
  const { id, version, schemaHash, contractHash } = registry.describe("tickets.ticket", 2);
  return customFieldPayloadSchema.parse({ schemaVersion: 1, entity: { id, version, schemaHash, contractHash }, storageGeneration: "0168ac73-bfb6-4e4f-91a0-d3d7dcf7286b", field: { key: "contact_email", label: "Contact email", classification: "confidential", storage: { type: "email" } } });
}
const mocks = { lock: vi.fn(), binding: vi.fn(), count: vi.fn(), createBinding: vi.fn(), createGeneration: vi.fn(), generation: vi.fn(), baseline: vi.fn(), definition: vi.fn() };
const tx = { $queryRaw: mocks.lock, studioFieldBinding: { findFirst: mocks.binding, count: mocks.count, create: mocks.createBinding }, studioFieldGeneration: { findFirst: mocks.generation, create: mocks.createGeneration }, studioDefinition: { findFirst: mocks.definition }, studioDefinitionVersion: { findFirst: mocks.baseline } } as unknown as Prisma.TransactionClient;
beforeEach(() => { vi.clearAllMocks(); mocks.binding.mockResolvedValue(null); mocks.count.mockResolvedValue(0); mocks.generation.mockResolvedValue({ id: payload().storageGeneration }); mocks.baseline.mockResolvedValue({ payload: payload() }); mocks.definition.mockResolvedValue({ activeVersionId: "approved-source" }); });
describe("Versioned field publication binding", () => {
  it("uses closed dispatch and preserves the Phase 1 compiler output", async () => {
    const compiled = await compileDefinition(session, "customField", payload(), registry);
    expect(compiled.plan.kind).toBe("customField");
    expect((await compileDefinition(session, "capabilitySet", { schemaVersion: 1, description: "", references: [] }, registry)).plan.kind).toBe("capabilitySet");
    expect(() => parseDefinitionPayload("capabilitySet", payload())).toThrow();
    await expect(compileDefinition(session, "flow", {}, registry)).rejects.toThrow("No Studio compiler");
  });
  it("binds only the authenticated tenant and immutable published schema in the transaction", async () => {
    await bindPublishedField(tx, session, "definition", "tickets.ticket.contact_email", "version", payload());
    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.count).toHaveBeenCalledWith({ where: { organisationId: "tenant-a", entityId: "tickets.ticket" } });
    expect(mocks.createBinding).toHaveBeenCalledWith({ data: expect.objectContaining({ definitionId: "definition", organisationId: "tenant-a", entityId: "tickets.ticket", fieldKey: "contact_email", originVersionId: "version", initialGenerationId: payload().storageGeneration }) });
    expect(mocks.createGeneration).toHaveBeenCalledWith({ data: expect.objectContaining({ id: payload().storageGeneration, organisationId: "tenant-a", valueType: "email", originVersionId: "version" }) });
  });
  it("retained identities count towards the owner limit and cannot be renamed", async () => {
    mocks.count.mockResolvedValue(100);
    await expect(bindPublishedField(tx, session, "definition", "tickets.ticket.contact_email", "version", payload())).rejects.toThrow("field limit");
    await expect(bindPublishedField(tx, session, "definition", "another_key", "version", payload())).rejects.toThrow("permanent");
    expect(mocks.createBinding).not.toHaveBeenCalled();
  });
  it("requires matching generation, entity, type, field and tenant before activation", async () => {
    mocks.generation.mockResolvedValue(null);
    await expect(assertFieldBinding(tx, session, "definition", payload())).rejects.toThrow("tenant-owned");
    expect(mocks.generation).toHaveBeenCalledWith({ where: expect.objectContaining({ definitionId: "definition", organisationId: "tenant-a", entityId: "tickets.ticket", valueType: "email", binding: expect.objectContaining({ organisationId: "tenant-a", fieldKey: "contact_email" }) }), select: { id: true } });
  });
  it("permits labels/help without replacing history; unsafe evolution waits for the migration workstream", async () => {
    const previous = payload(), cosmetic = { ...previous, field: { ...previous.field, label: "Email address", help: "Your preferred contact" } };
    expect(() => assertCosmeticFieldEvolution(previous, cosmetic)).not.toThrow();
    for (const field of [{ ...previous.field, required: true }, { ...previous.field, unique: true }, { ...previous.field, key: "renamed" }, { ...previous.field, readCapability: "finance.document.read" }, { ...previous.field, storage: { type: "string" as const, minLength: 0, maxLength: 50, multiline: false } }]) expect(() => assertCosmeticFieldEvolution(previous, { ...previous, field })).toThrow("MIGRATION_REQUIRED");
    expect(() => assertCosmeticFieldEvolution(previous, { ...previous, storageGeneration: "98ca32d5-677c-4d5a-8ef9-dbc20f2a69f2" })).toThrow("MIGRATION_REQUIRED");
    mocks.binding.mockResolvedValue({ definitionId: "definition" });
    await bindPublishedField(tx, session, "definition", "tickets.ticket.contact_email", "version2", cosmetic);
    expect(mocks.createBinding).not.toHaveBeenCalled(); expect(mocks.createGeneration).not.toHaveBeenCalled();
    expect(mocks.baseline).toHaveBeenCalledWith({ where: { definitionId: "definition", organisationId: "tenant-a", id: "approved-source" }, select: { payload: true } });
  });
  it("uses the active source after cancellation/rollback and rejects obsolete target descendants", async () => {
    const source = payload(), obsolete = { ...source, storageGeneration: "98ca32d5-677c-4d5a-8ef9-dbc20f2a69f2" };
    mocks.binding.mockResolvedValue({ definitionId: "definition", originVersionId: "origin" });
    mocks.baseline.mockImplementation(async ({ where }) => ({ payload: where.id === "approved-source" ? source : obsolete }));
    await bindPublishedField(tx, session, "definition", "tickets.ticket.contact_email", "version3", { ...source, field: { ...source.field, label: "New source label" } });
    await expect(bindPublishedField(tx, session, "definition", "tickets.ticket.contact_email", "version3", obsolete)).rejects.toThrow("MIGRATION_REQUIRED");
    expect(mocks.definition).toHaveBeenCalledWith({ where: { id: "definition", organisationId: "tenant-a", kind: "customField" }, select: { activeVersionId: true } });
    expect(mocks.baseline.mock.calls.every(([query]) => query.where.id === "approved-source")).toBe(true);
    expect(mocks.createGeneration).not.toHaveBeenCalled();
  });
  it("uses immutable origin before first activation, rather than the latest publication", async () => {
    mocks.binding.mockResolvedValue({ definitionId: "definition", originVersionId: "origin" });
    mocks.definition.mockResolvedValue({ activeVersionId: null });
    await bindPublishedField(tx, session, "definition", "tickets.ticket.contact_email", "version2", payload());
    expect(mocks.baseline).toHaveBeenCalledWith({ where: { id: "origin", definitionId: "definition", organisationId: "tenant-a" }, select: { payload: true } });
  });
  it("fails closed if the tenant definition or its active schema is missing, without falling back", async () => {
    mocks.binding.mockResolvedValue({ definitionId: "definition", originVersionId: "origin" });
    mocks.definition.mockResolvedValue(null);
    await expect(bindPublishedField(tx, session, "definition", "tickets.ticket.contact_email", "version2", payload())).rejects.toThrow("tenant-owned definition");
    expect(mocks.baseline).not.toHaveBeenCalled();
    mocks.definition.mockResolvedValue({ activeVersionId: "unavailable-active" });
    mocks.baseline.mockResolvedValue(null);
    await expect(bindPublishedField(tx, session, "definition", "tickets.ticket.contact_email", "version2", payload())).rejects.toThrow("approved published baseline");
    expect(mocks.baseline).toHaveBeenCalledOnce();
    expect(mocks.baseline.mock.calls[0][0].where.id).toBe("unavailable-active");
  });
});
