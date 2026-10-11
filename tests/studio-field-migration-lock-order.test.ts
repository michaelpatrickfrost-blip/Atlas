import { beforeEach, expect, it, vi } from "vitest";
import type { FieldMigrationAuthority } from "@/core/studio/fields/migrations/authority";
const m = vi.hoisted(() => ({ initial: vi.fn(), authority: vi.fn(), raw: vi.fn(), publication: vi.fn(), inspect: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: vi.fn() }));
vi.mock("@/core/studio/fields/migrations/authority", () => ({ withFieldMigrationAuthority: m.authority }));
vi.mock("@/core/studio/fields/migrations/execution-inspection", () => ({ inspectFieldMigrationExecution: m.inspect, inspectRequiredFieldMigrationExecution: m.inspect }));
import { retainedCutoverFixture } from "./fixtures/studio-field-cutover";
import { sealRequiredFieldMigrationIntent } from "@/core/studio/fields/migrations/required-contracts";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { startFieldMigrationPreparation } from "@/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "@/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "@/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "@/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "@/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "@/core/studio/fields/migrations/execution-batch";
import { cancelFieldMigrationPublication } from "@/core/studio/fields/migrations/cancellation";
import { cutoverReviewedFieldMigration } from "@/core/studio/fields/migrations/cutover";
import { rollbackReviewedFieldMigration, finalizeReviewedFieldMigration } from "@/core/studio/fields/migrations/settlement";

let f: Awaited<ReturnType<typeof retainedCutoverFixture>>, authority: FieldMigrationAuthority;
let events: string[], queries: { sql: string; values: unknown[] }[];
const stopped = new Error("Stop before protected rows");
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture(); events = []; queries = [];
  const transaction = { $queryRaw: m.raw, studioFieldMigrationPublication: { findFirst: m.publication } } as unknown as FieldMigrationAuthority["transaction"];
  authority = { session: f.session, principal: f.intent.principal, transaction,
    company: { id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } };
  // Authentication and lower inspectors are bounded collaborators. Real shared
  // SQL helpers and lifecycle boundaries prove acquisition order/scoping here;
  // this does not establish PostgreSQL contention or snapshot freshness.
  m.authority.mockImplementation(async (_session, _principal, operation) => { events.push("authority"); return operation(authority); });
  m.initial.mockImplementation(async () => structuredClone(f.preparation));
  m.publication.mockImplementation(async ({ where, select }) => {
    expect(where).toEqual({ preparationId: f.intent.id, organisationId: "company" });
    expect(select).toEqual({ definitionId: true }); events.push("metadata"); return { definitionId: f.intent.definitionId };
  });
  m.raw.mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.join("?"); queries.push({ sql, values });
    if (sql.includes("pg_advisory_xact_lock")) { events.push("entity"); return []; }
    events.push("protected"); throw stopped;
  });
  m.inspect.mockImplementation(async () => { events.push("protected"); throw stopped; });
});
const preparation = () => startFieldMigrationPreparation(f.session, f.intent.principal, { operationId: f.intent.id, definitionId: f.intent.definitionId,
  definitionRevision: f.intent.definitionRevision, draftRevision: f.intent.target.draftRevision, conversion: f.intent.conversion });
const cancellation = () => cancelFieldMigrationPublication(f.session, f.intent.principal, { preparationId: f.intent.id, revision: 0 });
const cases = [
  { name: "collection", run: () => collectFieldMigrationBatch(f.session, { preparationId: f.intent.id, revision: 0 }) },
  { name: "sealing", run: () => sealFieldMigrationPreparation(f.session, { preparationId: f.intent.id, revision: 0 }) },
  { name: "publication", run: () => publishReviewedFieldMigration(f.session, { preparationId: f.intent.id, revision: 0,
    reviewChecksum: f.stored.checksum, acknowledgeWarnings: true, acknowledgeLoss: false }) },
  { name: "execution start", run: () => startFieldMigrationExecution(f.session, { preparationId: f.intent.id, publicationRevision: 0, reviewChecksum: f.stored.checksum }) },
  { name: "execution batch and sparse failure", run: () => executeFieldMigrationBatch(f.session, { preparationId: f.intent.id, revision: 0 }) },
  { name: "cutover", run: () => cutoverReviewedFieldMigration(f.session, { preparationId: f.intent.id, reviewChecksum: f.stored.checksum,
    definitionRevision: 8, publicationRevision: 0, executionRevision: 2 }) },
  { name: "rollback", run: () => rollbackReviewedFieldMigration(f.session, f.intent.principal, { preparationId: f.intent.id,
    cutoverChecksum: f.retained.checksum, cutoverRevision: 0, definitionRevision: 9, publicationRevision: 1 }) },
  { name: "finalization", run: () => finalizeReviewedFieldMigration(f.session, f.intent.principal, { preparationId: f.intent.id,
    cutoverChecksum: f.retained.checksum, cutoverRevision: 0, definitionRevision: 9, publicationRevision: 1 }) },
];
it.each(cases)("$name acquires exact deduplicated server tenant/entity before protected work", async ({ run, name }) => {
  await expect(run()).rejects.toThrow();
  expect(events).toEqual(name === "execution batch and sparse failure" ? ["authority", "entity", "protected", "authority", "entity", "protected"] : ["authority", "entity", "protected"]);
  for (const query of queries.filter(q => q.sql.includes("pg_advisory_xact_lock"))) {
    expect(query.sql).toContain("hashtextextended(?, 0)"); expect(query.values).toEqual([JSON.stringify(["company", "tickets.ticket"])]);
  }
});
it.each(cases)("$name applies the same early owning lock to stored protocol2 including rule removal", async ({ run }) => {
  const d = f.registry.describe("tickets.ticket", 9), entity = { id: d.id, version: d.version, schemaHash: d.schemaHash, contractHash: d.contractHash };
  const source = conditionalFieldPayloadSchema.parse({ ...f.intent.source.payload, schemaVersion: 2, entity,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  // Integrity fixture only: compiled/owner/row inspection is intentionally stopped
  // after lock acquisition. Source2->target1 keeps its closed2 stored identity.
  const sealed = sealRequiredFieldMigrationIntent({ ...f.intent, schemaVersion: 2, source: { ...f.intent.source, payload: source },
    target: { ...f.intent.target, payload: { ...f.intent.target.payload, entity } } });
  m.initial.mockResolvedValue({ ...f.preparation, intent: sealed.intent, intentChecksum: sealed.checksum });
  await expect(run()).rejects.toThrow(); expect(events.slice(0, 3)).toEqual(["authority", "entity", "protected"]);
  expect(queries.filter(q => q.sql.includes("pg_advisory_xact_lock"))[0].values).toEqual([JSON.stringify(["company", "tickets.ticket"])]);
});
it("preparation derives tenant primary binding before definition/draft row locks", async () => {
  await expect(preparation()).rejects.toThrow(stopped); expect(events).toEqual(["authority", "entity", "protected"]);
  expect(queries[0].sql).toContain("FROM studio_field_bindings b"); expect(queries[0].sql).toContain('b."organisationId"=? AND b."definitionId"=?::uuid');
  expect(queries[0].values).toEqual(["company", f.intent.definitionId]); expect(queries[1].sql).toContain("FOR SHARE OF d,draft");
});
it("cancellation discovers only actual scoped definition metadata, then bound entity before publication lock", async () => {
  await expect(cancellation()).rejects.toThrow(stopped); expect(events).toEqual(["authority", "metadata", "entity", "protected"]);
  expect(queries[0].sql).toContain("FROM studio_field_bindings b"); expect(queries[0].values).toEqual(["company", f.intent.definitionId]);
  expect(queries[1].sql).toContain("studio_field_migration_publications"); expect(queries[1].sql).toContain("FOR UPDATE");
});
it.each([...cases, { name: "preparation", run: preparation }, { name: "cancellation", run: cancellation }])("$name cannot lock or reach protected work after authority denial", async ({ run }) => {
  m.authority.mockRejectedValue(new Error("FORBIDDEN: revoked genuine current authority"));
  await expect(run()).rejects.toThrow(); expect(events).toEqual([]); expect(m.raw).not.toHaveBeenCalled(); expect(m.publication).not.toHaveBeenCalled();
});
it("cancellation missing metadata takes no entity or publication row lock", async () => {
  m.publication.mockResolvedValue(null); await expect(cancellation()).rejects.toThrow("stale or has changed"); expect(m.raw).not.toHaveBeenCalled();
});
