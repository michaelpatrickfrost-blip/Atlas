import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { checksum } from "@/core/studio/registry/contracts";
import type { ConfigurationReference } from "@/core/studio/record-types";
import { assertNoActiveConfigurationDependantsInTransaction, whereUsedConfigurationInTransaction } from "@/core/studio/configuration/usage";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session = { organisationId: "business-a" } as Session;
type Definition = { id: string; organisationId: string; kind: string; name: string; activeVersionId: string | null;
  retiredAt: Date | null; activeVersion: { id: string; definitionId: string; organisationId: string } | null };
type Edge = { organisationId: string; definitionId: string; versionId: string; targetDefinitionId: string; targetVersionId: string;
  targetKind: string; targetSchemaVersion: number; targetChecksum: string };
type Row = { id: string; definitionId: string; organisationId: string; schemaVersion: number; payload: { name: string };
  compiledPlan: { kind: string; schemaVersion: number; payload: { name: string }; configurationDependencies: ConfigurationReference[] };
  checksum: string; definition: Definition; configurationDependencies: Edge[] };
function version(n: number, dependencies: ConfigurationReference[] = [], options: { active?: boolean; retired?: boolean; definitionId?: string } = {}) {
  const definitionId = options.definitionId ?? id(n), payload = { name: `Version ${n}` };
  const compiledPlan = { kind: "entityProfile", schemaVersion: 1, payload, configurationDependencies: dependencies };
  const pin: ConfigurationReference = { kind: "entityProfile", definitionId, versionId: id(n + 10000), schemaVersion: 1, checksum: checksum(compiledPlan) };
  const definition: Definition = { id: definitionId, organisationId: "business-a", kind: pin.kind, name: payload.name,
    activeVersionId: options.active ? pin.versionId : null, retiredAt: options.retired ? new Date("2026-10-11T12:00:00.000Z") : null,
    activeVersion: options.active ? { id: pin.versionId, definitionId, organisationId: "business-a" } : null };
  const edges = dependencies.map(target => ({ organisationId: "business-a", definitionId, versionId: pin.versionId,
    targetDefinitionId: target.definitionId, targetVersionId: target.versionId, targetKind: target.kind,
    targetSchemaVersion: target.schemaVersion, targetChecksum: target.checksum }));
  const row: Row = { id: pin.versionId, definitionId, organisationId: "business-a", schemaVersion: 1, payload, compiledPlan,
    checksum: pin.checksum, definition, configurationDependencies: edges };
  return { pin, row };
}
const findDefinition = vi.fn(), findVersion = vi.fn(), findEdges = vi.fn();
const tx = { studioDefinition: { findFirst: findDefinition }, studioDefinitionVersion: { findFirst: findVersion },
  studioConfigurationDependency: { findMany: findEdges } } as unknown as Prisma.TransactionClient;
let rows: Row[];
function fixture(...versions: ReturnType<typeof version>[]) { rows = versions.map(value => value.row); }
beforeEach(() => {
  vi.clearAllMocks(); rows = [];
  findDefinition.mockImplementation(async ({ where }) => rows.find(row => row.definitionId === where.id && row.organisationId === where.organisationId)?.definition ?? null);
  findVersion.mockImplementation(async ({ where }) => rows.find(row => row.id === where.id && row.definitionId === where.definitionId && row.organisationId === where.organisationId) ?? null);
  findEdges.mockImplementation(async ({ where, take }) => rows.flatMap(row => row.configurationDependencies).filter(edge =>
    edge.organisationId === where.organisationId && edge.targetDefinitionId === where.targetDefinitionId
    && (where.targetVersionId === undefined || edge.targetVersionId === where.targetVersionId))
    .sort((a, b) => `${a.definitionId}@${a.versionId}`.localeCompare(`${b.definitionId}@${b.versionId}`)).slice(0, take));
});
describe("bounded sealed configuration where-used metadata", () => {
  it("finds an active ancestor through an inactive retained base and blocks mutation", async () => {
    const field = version(1), base = version(2, [field.pin]), type = version(3, [base.pin], { active: true }); fixture(field, base, type);
    const result = await whereUsedConfigurationInTransaction(session, tx, { definitionId: field.pin.definitionId });
    expect(result.usages).toMatchObject([{ definitionId: base.pin.definitionId, active: false, depth: 1, activeAncestorVersionIds: [type.pin.versionId] },
      { definitionId: type.pin.definitionId, active: true, depth: 2, activeAncestorVersionIds: [type.pin.versionId] }]);
    await expect(assertNoActiveConfigurationDependantsInTransaction(session, tx, { definitionId: field.pin.definitionId })).rejects.toThrow("CONFIGURATION_IN_USE");
    for (const [args] of findEdges.mock.calls) {
      expect(args.where.organisationId).toBe("business-a"); expect(args.take).toBeLessThanOrEqual(501); expect(args.take).toBeGreaterThan(0);
      expect(args.select).not.toHaveProperty("draft"); expect(args.select).not.toHaveProperty("fieldValues");
    }
  });
  it("shows retired history unchanged and cannot hide an active ancestor behind a retired intermediate", async () => {
    const field = version(1), base = version(2, [field.pin], { retired: true }), type = version(3, [base.pin], { active: true }); fixture(field, base, type);
    const before = structuredClone(rows);
    expect((await whereUsedConfigurationInTransaction(session, tx, { definitionId: field.pin.definitionId })).usages[0]).toMatchObject({ retiredAt: "2026-10-11T12:00:00.000Z", active: false });
    await expect(assertNoActiveConfigurationDependantsInTransaction(session, tx, { definitionId: field.pin.definitionId })).rejects.toThrow("CONFIGURATION_IN_USE");
    expect(rows).toEqual(before);
  });
  it("allows inactive-only historic edges and distinguishes stable definitions from exact version impact", async () => {
    const old = version(1), current = version(2, [], { definitionId: old.pin.definitionId, active: true });
    old.row.definition = current.row.definition;
    const oldParent = version(3, [old.pin]); fixture(old, current, oldParent);
    expect((await whereUsedConfigurationInTransaction(session, tx, { definitionId: old.pin.definitionId })).usages).toHaveLength(1);
    expect((await whereUsedConfigurationInTransaction(session, tx, { definitionId: old.pin.definitionId, versionId: current.pin.versionId })).usages).toEqual([]);
    await expect(assertNoActiveConfigurationDependantsInTransaction(session, tx, { definitionId: old.pin.definitionId })).resolves.toBeUndefined();
  });
  it("paginates metadata with a checksum-bound stable identity and detects pointer, seal, retirement or tenant changes", async () => {
    const field = version(1), parents = [version(2, [field.pin]), version(3, [field.pin]), version(4, [field.pin])]; fixture(field, ...parents);
    const request = { definitionId: field.pin.definitionId, limit: 1 };
    const first = await whereUsedConfigurationInTransaction(session, tx, request); expect(first.next).not.toBeNull();
    const next = await whereUsedConfigurationInTransaction(session, tx, { ...request, cursor: first.next! }); expect(next.usages[0].definitionId).toBe(parents[1].pin.definitionId);
    parents[2].row.definition.retiredAt = new Date();
    await expect(whereUsedConfigurationInTransaction(session, tx, { ...request, cursor: first.next! })).rejects.toThrow("CONFLICT");
    parents[2].row.definition.retiredAt = null; parents[2].row.definition.activeVersionId = parents[2].pin.versionId;
    parents[2].row.definition.activeVersion = { id: parents[2].pin.versionId, definitionId: parents[2].pin.definitionId, organisationId: "business-a" };
    await expect(whereUsedConfigurationInTransaction(session, tx, { ...request, cursor: first.next! })).rejects.toThrow("CONFLICT");
    await expect(whereUsedConfigurationInTransaction({ organisationId: "business-b" } as Session, tx, { ...request, cursor: first.next! })).rejects.toThrow("DEPENDENCY_BROKEN");
    await expect(whereUsedConfigurationInTransaction(session, tx, { ...request, cursor: { ...first.next!, after: `${id(999)}@${id(888)}` } })).rejects.toThrow("CONFLICT");
  });
  it.each(["source_tenant", "source_id", "target_checksum", "source_seal", "missing_mirror", "active_foreign"])("fails closed on %s corruption", async mode => {
    const field = version(1), parent = version(2, [field.pin], { active: true }); fixture(field, parent);
    if (mode === "source_tenant") parent.row.organisationId = "foreign";
    if (mode === "source_id") parent.row.id = id(999);
    if (mode === "target_checksum") parent.row.configurationDependencies[0].targetChecksum = "f".repeat(64);
    if (mode === "source_seal") parent.row.checksum = "f".repeat(64);
    if (mode === "missing_mirror") parent.row.configurationDependencies = [];
    if (mode === "active_foreign") parent.row.definition.activeVersion!.organisationId = "foreign";
    // Preserve the incoming lookup for the missing-mirror case: it represents
    // an inconsistent stored reverse edge against an incomplete version mirror.
    if (mode === "missing_mirror") findEdges.mockResolvedValueOnce([{ organisationId: "business-a", definitionId: parent.pin.definitionId,
      versionId: parent.pin.versionId, targetDefinitionId: field.pin.definitionId, targetVersionId: field.pin.versionId,
      targetKind: field.pin.kind, targetSchemaVersion: field.pin.schemaVersion, targetChecksum: field.pin.checksum }]);
    await expect(assertNoActiveConfigurationDependantsInTransaction(session, tx, { definitionId: field.pin.definitionId })).rejects.toThrow("DEPENDENCY_BROKEN");
  });
  it("rejects a logical cycle across distinct retained versions", async () => {
    const field = version(1), parent = version(2, [field.pin]), laterField = version(3, [parent.pin], { definitionId: field.pin.definitionId });
    fixture(field, parent, laterField);
    await expect(assertNoActiveConfigurationDependantsInTransaction(session, tx, { definitionId: field.pin.definitionId, versionId: field.pin.versionId })).rejects.toThrow("DEPENDENCY_BROKEN");
  });
  it("accepts four reverse levels and rejects a fifth before loading its source", async () => {
    const versions = [version(1)]; for (let n = 2; n <= 6; n++) versions.push(version(n, [versions.at(-1)!.pin]));
    fixture(...versions.slice(0, 5));
    expect((await whereUsedConfigurationInTransaction(session, tx, { definitionId: id(1) })).usages).toHaveLength(4);
    fixture(...versions); findVersion.mockClear();
    await expect(whereUsedConfigurationInTransaction(session, tx, { definitionId: id(1) })).rejects.toThrow("DEPENDENCY_BROKEN");
    expect(findVersion.mock.calls.some(([args]) => args.where.id === versions[5].pin.versionId)).toBe(false);
  });
  it("fails on bounded row/node overflow and on excessive shared traversal paths", async () => {
    const field = version(1), parents = Array.from({ length: 501 }, (_, n) => version(n + 2, [field.pin])); fixture(field, ...parents);
    await expect(whereUsedConfigurationInTransaction(session, tx, { definitionId: field.pin.definitionId })).rejects.toThrow("DEPENDENCY_BROKEN");
    expect(findVersion).not.toHaveBeenCalled();
    const middle = Array.from({ length: 80 }, (_, n) => version(n + 2, [field.pin]));
    const tops = Array.from({ length: 3 }, (_, n) => version(n + 100, middle.map(value => value.pin)));
    const ancestor = version(200, tops.map(value => value.pin)); fixture(field, ...middle, ...tops, ancestor);
    await expect(whereUsedConfigurationInTransaction(session, tx, { definitionId: field.pin.definitionId })).rejects.toThrow("DEPENDENCY_BROKEN");
    expect(findVersion.mock.calls.length).toBeLessThan(100);
  });
  it("rejects invalid requests before metadata reads and ignores no tenant supplied by clients", async () => {
    for (const request of [{ definitionId: id(1), organisationId: "foreign" }, { definitionId: "bad" }, { definitionId: id(1), limit: 51 }])
      await expect(whereUsedConfigurationInTransaction(session, tx, request as never)).rejects.toThrow();
    expect(findDefinition).not.toHaveBeenCalled(); expect(findVersion).not.toHaveBeenCalled(); expect(findEdges).not.toHaveBeenCalled();
  });
});
