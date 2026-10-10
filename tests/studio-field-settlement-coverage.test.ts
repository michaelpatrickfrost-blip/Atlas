import { beforeEach, expect, it, vi } from "vitest";
import type { FieldMigrationAuthority } from "@/core/studio/fields/migrations/authority";
import type { inspectFieldMigrationSettlementIdentity } from "@/core/studio/fields/migrations/settlement-inspection";
import { validateFieldMigrationSettlementCoverage } from "@/core/studio/fields/migrations/settlement-coverage";
import { retainedCutoverFixture, settleCutoverFixture } from "./fixtures/studio-field-cutover";
import { compileCustomField } from "@/core/studio/compiler/fields";

let f: Awaited<ReturnType<typeof retainedCutoverFixture>>, authority: FieldMigrationAuthority;
const m = { raw: vi.fn(), active: vi.fn(), written: vi.fn(), module: vi.fn() };
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture();
  authority = { session: { ...f.session, userId: "independent", membershipId: "current" }, principal: { ...f.intent.principal, userId: "independent", membershipId: "current" },
    company: { id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true },
    transaction: { $queryRaw: m.raw, studioDefinitionVersion: { findFirst: m.active, findMany: m.written }, moduleState: { findFirst: m.module } } as unknown as FieldMigrationAuthority["transaction"] };
  m.active.mockImplementation(async () => f.target); m.written.mockImplementation(async () => [f.source]); m.module.mockResolvedValue({ id: "enabled" });
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes('SELECT DISTINCT v."versionId"') ? [{ versionId: f.source.id }] : []);
  vi.spyOn(f.registry, "invokeQueryInTransaction").mockImplementation(async (_context, _policy, input) => ({ organisationId: "company", entityId: "tickets.ticket",
    mode: (input as { mode: string }).mode, nativeCoverageComplete: true, nativeReferenceCoverageComplete: true }));
});
const inspected = () => ({ ...f, state: f.receipt.state, settlement: null }) as unknown as Awaited<ReturnType<typeof inspectFieldMigrationSettlementIdentity>>;
it("checks current actor, immutable written schema and actual active policy before owner coverage", async () => {
  settleCutoverFixture(f, "FINALIZED"); f.definition.revision += 10;
  await validateFieldMigrationSettlementCoverage(authority, f.registry, inspected(), "history");
  expect(f.registry.invokeQueryInTransaction).toHaveBeenCalledWith({ session: authority.session, transaction: authority.transaction },
    expect.objectContaining({ id: "tickets.ticket.field_settlement" }), { preparationId: f.intent.id, mode: "history" });
  expect(m.written.mock.calls[0][0].where).toMatchObject({ organisationId: "company", definitionId: f.intent.definitionId });
});
it("enforces a newer active field restriction even when retained source/target permissions remain", async () => {
  const payload = { ...f.target.payload, field: { ...f.target.payload.field, writeCapability: "tickets.field.new_policy" } };
  const allowed = { ...authority.session, capabilities: new Set([...authority.session.capabilities, "tickets.field.new_policy"]) };
  const compiled = await compileCustomField(allowed, payload, f.registry);
  m.active.mockResolvedValue({ ...f.target, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum });
  await expect(validateFieldMigrationSettlementCoverage(authority, f.registry, inspected(), "history")).rejects.toThrow("FORBIDDEN");
  expect(f.registry.invokeQueryInTransaction).not.toHaveBeenCalled();
});
it("enforces retained written restrictions and rejects missing or corrupted schema metadata", async () => {
  const payload = { ...f.source.payload, field: { ...f.source.payload.field, readCapability: "tickets.field.old_policy" } };
  const compiled = await compileCustomField({ ...authority.session, capabilities: new Set([...authority.session.capabilities, "tickets.field.old_policy"]) }, payload, f.registry);
  m.written.mockResolvedValue([{ ...f.source, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum }]);
  await expect(validateFieldMigrationSettlementCoverage(authority, f.registry, inspected(), "history")).rejects.toThrow("FORBIDDEN");
  m.written.mockResolvedValue([]); await expect(validateFieldMigrationSettlementCoverage(authority, f.registry, inspected(), "history")).rejects.toThrow("stale or has changed");
  m.written.mockResolvedValue([{ ...f.source, compiledPlan: f.target.compiledPlan }]);
  await expect(validateFieldMigrationSettlementCoverage(authority, f.registry, inspected(), "rollback")).rejects.toThrow("stale or has changed");
});
it("rejects disabled source, production live-data denial and forged owner scope", async () => {
  m.module.mockResolvedValue(null); await expect(validateFieldMigrationSettlementCoverage(authority, f.registry, inspected(), "history")).rejects.toThrow("field source is unavailable");
  m.module.mockResolvedValue({ id: "enabled" }); authority.company.isTest = false;
  await expect(validateFieldMigrationSettlementCoverage(authority, f.registry, inspected(), "history")).rejects.toThrow("FORBIDDEN");
  authority.company.isTest = true;
  vi.mocked(f.registry.invokeQueryInTransaction).mockResolvedValue({ organisationId: "foreign", entityId: "tickets.ticket", mode: "history", nativeCoverageComplete: true, nativeReferenceCoverageComplete: true });
  await expect(validateFieldMigrationSettlementCoverage(authority, f.registry, inspected(), "history")).rejects.toThrow("stale or has changed");
});
