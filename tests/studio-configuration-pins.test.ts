import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { checksum } from "@/core/studio/registry/contracts";
import { inspectConfigurationGraph, inspectConfigurationPin, loadSealedConfigurationVersion,
  type SealedConfigurationVersion } from "@/core/studio/configuration/pins";
import type { ConfigurationReference } from "@/core/studio/record-types";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session = { organisationId: "business-a" } as Session;
const find = vi.fn();
const tx = { studioDefinitionVersion: { findFirst: find } } as unknown as Prisma.TransactionClient;
function version(n: number, dependencies: ConfigurationReference[] = []) {
  const payload = { description: `Configuration ${n}` }, plan = { kind: "entityProfile", schemaVersion: 1, payload,
    configurationDependencies: dependencies };
  const reference = { kind: "entityProfile" as const, definitionId: id(n), versionId: id(n + 100), schemaVersion: 1 as const, checksum: checksum(plan) };
  const row: SealedConfigurationVersion = { id: reference.versionId, definitionId: reference.definitionId,
    organisationId: session.organisationId, schemaVersion: 1, checksum: reference.checksum, payload, compiledPlan: plan,
    definition: { kind: "entityProfile", retiredAt: null }, configurationDependencies: dependencies.map(ref => ({
      organisationId: session.organisationId, definitionId: reference.definitionId, versionId: reference.versionId,
      targetDefinitionId: ref.definitionId, targetVersionId: ref.versionId, targetKind: ref.kind,
      targetSchemaVersion: ref.schemaVersion, targetChecksum: ref.checksum })) };
  return { row, reference };
}
beforeEach(() => { find.mockReset(); });

it("loads only the exact immutable version in the authenticated tenant, without business/value columns", async () => {
  const current = version(1); find.mockResolvedValue(current.row);
  expect(await loadSealedConfigurationVersion(session, tx, current.reference)).toEqual(current.row);
  expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: id(101), definitionId: id(1), organisationId: "business-a" },
    select: expect.objectContaining({ configurationDependencies: expect.objectContaining({ take: 203 }) }) }));
  expect(find.mock.calls[0][0].select).not.toHaveProperty("fieldValues");
});
it.each(["tenant", "version", "definition", "kind", "retired", "schema", "checksum", "payload", "plan"])("rejects mismatched %s identity/seal", mode => {
  const current = version(1), row = structuredClone(current.row);
  if (mode === "tenant") row.organisationId = "business-b";
  if (mode === "version") row.id = id(999);
  if (mode === "definition") row.definitionId = id(999);
  if (mode === "kind") row.definition.kind = "recordType";
  if (mode === "retired") row.definition.retiredAt = new Date();
  if (mode === "schema") row.schemaVersion = 2;
  if (mode === "checksum") row.checksum = "f".repeat(64);
  if (mode === "payload") row.payload = { description: "Altered stored payload" };
  if (mode === "plan") row.compiledPlan = { kind: "entityProfile", schemaVersion: 1, payload: {} };
  expect(() => inspectConfigurationPin(session.organisationId, current.reference, row)).toThrow("DEPENDENCY_BROKEN");
});
it.each(["missing", "extra", "foreign", "changed", "duplicate"])("rejects %s configuration dependency rows", mode => {
  const child = version(2), parent = version(1, [child.reference]), row = structuredClone(parent.row);
  if (mode === "missing") row.configurationDependencies = [];
  if (mode === "extra" || mode === "duplicate") row.configurationDependencies.push(structuredClone(row.configurationDependencies[0]));
  if (mode === "foreign") row.configurationDependencies[0].organisationId = "business-b";
  if (mode === "changed") row.configurationDependencies[0].targetChecksum = "f".repeat(64);
  expect(() => inspectConfigurationPin(session.organisationId, parent.reference, row)).toThrow("DEPENDENCY_BROKEN");
});
it("does not accept duplicate plan pins hidden by set normalization", () => {
  const child = version(2), parent = version(1, [child.reference, child.reference]);
  parent.row.configurationDependencies.pop();
  expect(() => inspectConfigurationPin(session.organisationId, parent.reference, parent.row)).toThrow("DEPENDENCY_BROKEN");
});
it("legacy absent configuration-dependency shape is retained", () => {
  const current = version(1), plan = { kind: "entityProfile", schemaVersion: 1, payload: current.row.payload };
  current.row.compiledPlan = plan; current.row.checksum = checksum(plan); current.reference.checksum = current.row.checksum;
  const snapshot = structuredClone(current.row);
  expect(inspectConfigurationPin(session.organisationId, current.reference, current.row).configurationDependencies).toEqual([]);
  expect(current.row).toEqual(snapshot);
});
it("validates transitive tenant-scoped pins while caching immutable metadata", async () => {
  const leaf = version(3), middle = version(2, [leaf.reference]), root = version(1, [middle.reference, leaf.reference]);
  const rows = [root, middle, leaf]; find.mockImplementation(async ({ where }) => rows.find(item => item.row.id === where.id)?.row ?? null);
  const result = await inspectConfigurationGraph(session, tx, [root.reference], id(90));
  expect(result.size).toBe(3); expect(find).toHaveBeenCalledTimes(3);
  for (const [args] of find.mock.calls) expect(args.where.organisationId).toBe("business-a");
});
it("rejects a logical definition cycle across different published versions", async () => {
  const historical = version(1), next = version(2, [historical.reference]);
  find.mockResolvedValue(next.row);
  await expect(inspectConfigurationGraph(session, tx, [next.reference], id(1))).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(find).toHaveBeenCalledTimes(1);
});
it("rejects an absent transitive version instead of falling back to a current pointer", async () => {
  const leaf = version(3), parent = version(2, [leaf.reference]);
  find.mockImplementation(async ({ where }) => where.id === parent.row.id ? parent.row : null);
  await expect(inspectConfigurationGraph(session, tx, [parent.reference], id(90))).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(find).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: leaf.reference.versionId,
    definitionId: leaf.reference.definitionId, organisationId: "business-a" } }));
});
it("stops a chain before reading a fifth-level target", async () => {
  const chain = [version(5)];
  for (let n = 4; n > 0; n--) chain.unshift(version(n, [chain[0].reference]));
  find.mockImplementation(async ({ where }) => chain.find(item => item.row.id === where.id)?.row ?? null);
  await expect(inspectConfigurationGraph(session, tx, [chain[0].reference], id(90))).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(find).toHaveBeenCalledTimes(4);
});
