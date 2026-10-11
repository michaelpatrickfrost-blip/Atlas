import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { inspectFieldMigrationSettlementIdentity, inspectFieldMigrationSettlementWindow } from "@/core/studio/fields/migrations/settlement-inspection";
import { retainedCutoverFixture, settleCutoverFixture } from "./fixtures/studio-field-cutover";

let f: Awaited<ReturnType<typeof retainedCutoverFixture>>, fresh: boolean;
const m = { raw: vi.fn(), preparation: vi.fn(), publication: vi.fn(), execution: vi.fn(), receipt: vi.fn(), definition: vi.fn(), draft: vi.fn(), version: vi.fn() };
const tx = { $queryRaw: m.raw, studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationPublication: { findFirst: m.publication },
  studioFieldMigrationExecution: { findFirst: m.execution }, studioFieldMigrationCutover: { findFirst: m.receipt }, studioDefinition: { findFirst: m.definition },
  studioDraft: { findFirst: m.draft }, studioDefinitionVersion: { findFirst: m.version } } as unknown as Prisma.TransactionClient;
beforeEach(async () => {
  vi.clearAllMocks(); f = await retainedCutoverFixture(); fresh = true;
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("AS fresh") ? [{ fresh }] : []);
  for (const key of ["preparation", "publication", "execution", "receipt", "definition", "draft"] as const) m[key].mockImplementation(async () => structuredClone(f[key]));
  m.version.mockImplementation(async ({ where }: { where: { id: string } }) => structuredClone(where.id === f.source.id ? f.source : f.target));
});
it("locks and scopes actual history before checking the exact open rollback window", async () => {
  const inspected = await inspectFieldMigrationSettlementIdentity(tx, f.intent);
  expect(inspected.retained).toEqual(f.retained);
  await inspectFieldMigrationSettlementWindow(tx, inspected, "ROLLED_BACK");
  expect(m.receipt).toHaveBeenCalledWith(expect.objectContaining({ where: { preparationId: f.intent.id, organisationId: "company", definitionId: f.intent.definitionId } }));
  for (const [strings, ...values] of m.raw.mock.calls) {
    expect(values).toContain("company");
    expect(strings.join("?")).not.toMatch(/atlas_studio_(execution|publication|migration)_fresh\(/);
  }
  expect(m.raw.mock.calls.at(-1)?.[0].join("?")).toContain("atlas_studio_execution_source_fresh(pub) AND atlas_studio_execution_targets_fresh(pub)");
  expect(m.version.mock.calls.every(([arg]) => arg.where.organisationId === "company" && arg.where.definitionId === f.intent.definitionId)).toBe(true);
});
it.each(["ROLLED_BACK", "FINALIZED"] as const)("reads retained %s identity after a new active version without reopening its window", async disposition => {
  const packet = settleCutoverFixture(f, disposition);
  f.definition.activeVersionId = "00000000-0000-4000-8000-000000000099"; f.definition.revision += 7; f.definition.latestVersion += 2; f.draft.revision += 10;
  const inspected = await inspectFieldMigrationSettlementIdentity(tx, f.intent);
  expect(inspected.settlement).toEqual(packet);
  expect(m.draft).not.toHaveBeenCalled();
  await expect(inspectFieldMigrationSettlementWindow(tx, inspected, "FINALIZED")).rejects.toThrow("stale or has changed");
});
it("changed extensions close rollback eligibility but still permit metadata-only finalization", async () => {
  const inspected = await inspectFieldMigrationSettlementIdentity(tx, f.intent); fresh = false;
  await expect(inspectFieldMigrationSettlementWindow(tx, inspected, "ROLLED_BACK")).rejects.toThrow("stale or has changed");
  m.raw.mockClear();
  expect(await inspectFieldMigrationSettlementWindow(tx, inspected, "FINALIZED")).toBe(inspected);
  expect(m.raw).not.toHaveBeenCalled();
});
it("finalization does not relax actual active pointer, definition or draft CAS", async () => {
  for (const change of [() => { f.definition.activeVersionId = f.source.id; }, () => { f.definition.revision++; },
    () => { f.definition.retiredAt = new Date(); }, () => { f.draft.revision++; }, () => { f.draft.baseVersionId = f.source.id; }]) {
    f = await retainedCutoverFixture(); change();
    const inspected = await inspectFieldMigrationSettlementIdentity(tx, f.intent);
    await expect(inspectFieldMigrationSettlementWindow(tx, inspected, "FINALIZED")).rejects.toThrow("stale or has changed");
  }
});
it("denies missing/foreign or altered actual rows and immutable compiled versions", async () => {
  m.receipt.mockResolvedValue(null);
  await expect(inspectFieldMigrationSettlementIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  m.receipt.mockImplementation(async () => ({ ...structuredClone(f.receipt), organisationId: "foreign" }));
  await expect(inspectFieldMigrationSettlementIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  m.receipt.mockImplementation(async () => structuredClone(f.receipt));
  f.publication.targetChecksum = "f".repeat(64);
  await expect(inspectFieldMigrationSettlementIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  f = await retainedCutoverFixture(); f.source.compiledPlan = f.target.compiledPlan;
  await expect(inspectFieldMigrationSettlementIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  f = await retainedCutoverFixture(); f.target.version++;
  await expect(inspectFieldMigrationSettlementIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  expect(Object.keys(tx)).not.toContain("serviceWorkItem");
});
