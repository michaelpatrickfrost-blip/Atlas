import { beforeEach, expect, it, vi } from "vitest";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { checksum } from "@/core/studio/registry/contracts";
import type { PagePayload } from "@/core/studio/pages/schema";
const m = vi.hoisted(() => ({ stamp: vi.fn(), definition: vi.fn(), version: vi.fn(), seal: vi.fn(), compile: vi.fn(), catalog: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: m.stamp }));
vi.mock("@/core/studio/configuration/pins", () => ({ loadSealedConfigurationVersion: m.seal }));
vi.mock("@/core/studio/pages/definition-compiler", () => ({ compileStructuredPage: m.compile }));
vi.mock("@/core/studio/authoring/catalog", () => ({ pageEditorCatalogInTransaction: m.catalog }));
import { comparePageVersionInTransaction } from "@/core/studio/authoring/page-comparison";
const id = "80000000-0000-4000-8000-000000000001", versionId = "80000000-0000-4000-8000-000000000002";
const payload: PagePayload = { schemaVersion: 1, entity: { id: "sales.order", version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) },
  formFactors: ["desktop", "phone"], variants: [], sections: [{ id: "main", label: "Earlier order design", help: "", formFactors: ["desktop", "phone"],
    columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: "note", type: "instructions", text: "Earlier guidance", formFactors: ["desktop", "phone"] }] }] };
const plan = { kind: "page", schemaVersion: 1, payload }, seal = checksum(plan), stamp = {};
const authority = { session: { userId: "actor", organisationId: "business-a", capabilities: new Set(["studio.definition.read"]) }, stamp,
  transaction: { studioDefinition: { findFirst: m.definition }, studioDefinitionVersion: { findFirst: m.version } } } as unknown as FieldRuntimeAuthority;
const input = { definitionId: id, versionId, definitionRevision: 4, formFactor: "desktop" };
beforeEach(() => {
  vi.clearAllMocks(); m.stamp.mockReturnValue(stamp); m.definition.mockResolvedValue({ id });
  m.version.mockResolvedValue({ id: versionId, version: 1, schemaVersion: 1, checksum: seal });
  m.seal.mockResolvedValue({ payload, compiledPlan: plan, checksum: seal }); m.compile.mockResolvedValue({ payload, plan, checksum: seal });
  m.catalog.mockResolvedValue({ catalog: { nativeFields: [], customFields: [], facts: [], queries: [], actions: [], metrics: [], surfaces: [] } });
});
// Explicit metadata collaborators, not real SQL/genuine-principal/live evidence.
it("rejects absent genuine identity and read grant before any metadata query", async () => {
  m.stamp.mockReturnValue(null); await expect(comparePageVersionInTransaction(authority, input)).rejects.toThrow("FORBIDDEN");
  m.stamp.mockReturnValue(stamp); await expect(comparePageVersionInTransaction({ ...authority, session: { ...authority.session, capabilities: new Set() } }, input)).rejects.toThrow("FORBIDDEN");
  expect(m.definition).not.toHaveBeenCalled();
});
it("scopes the exact head and retained version to current tenant and rejects stale or foreign selection", async () => {
  m.definition.mockResolvedValue(null); await expect(comparePageVersionInTransaction(authority, input)).rejects.toThrow("CONFLICT");
  expect(m.definition).toHaveBeenCalledWith(expect.objectContaining({ where: { id, organisationId: "business-a", kind: "page", retiredAt: null, revision: 4 } }));
  expect(m.version).not.toHaveBeenCalled(); m.definition.mockResolvedValue({ id }); m.version.mockResolvedValue(null);
  await expect(comparePageVersionInTransaction(authority, input)).rejects.toThrow("unavailable");
  expect(m.version).toHaveBeenCalledWith(expect.objectContaining({ where: { id: versionId, definitionId: id, organisationId: "business-a" } }));
  expect(m.seal).not.toHaveBeenCalled();
});
it("checks both exact seal reconstruction and current compiler grants before sample labels", async () => {
  m.compile.mockResolvedValueOnce({ payload, plan, checksum: "f".repeat(64) });
  await expect(comparePageVersionInTransaction(authority, input)).rejects.toThrow("DEPENDENCY_BROKEN"); expect(m.catalog).not.toHaveBeenCalled();
  m.compile.mockRejectedValueOnce(new Error("FORBIDDEN: source access changed"));
  await expect(comparePageVersionInTransaction(authority, input)).rejects.toThrow("FORBIDDEN"); expect(m.catalog).not.toHaveBeenCalled();
});
it("rejects unavailable device and untrusted extra metadata instead of guessing", async () => {
  await expect(comparePageVersionInTransaction(authority, { ...input, formFactor: "tablet" })).rejects.toThrow("preview size");
  await expect(comparePageVersionInTransaction(authority, { ...input, organisationId: "business-b" })).rejects.toThrow();
  expect(m.catalog).not.toHaveBeenCalled();
});
it("returns the original shared inert sample model without any business query or state mutation", async () => {
  const result = await comparePageVersionInTransaction(authority, input);
  expect(result).toMatchObject({ versionId, definitionRevision: 4, label: "Version 1", model: { formFactor: "desktop", variantId: null,
    sections: [{ label: "Earlier order design", components: [{ type: "instructions", text: "Earlier guidance" }] }] } });
  expect(m.seal).toHaveBeenCalledWith(authority.session, authority.transaction, { kind: "page", definitionId: id, versionId, schemaVersion: 1, checksum: seal });
  expect(m.compile).toHaveBeenCalledWith(authority, payload); expect(m.catalog).toHaveBeenCalledWith(authority, payload);
});
