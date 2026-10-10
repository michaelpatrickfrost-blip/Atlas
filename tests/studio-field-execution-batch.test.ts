import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ initial: vi.fn(), transaction: vi.fn(), resolve: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(),
  publication: vi.fn(), execution: vi.fn(), update: vi.fn(), audit: vi.fn(), inspect: vi.fn(), writer: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction, studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/fields/migrations/execution-inspection", () => ({ inspectFieldMigrationExecution: m.inspect }));
vi.mock("@/core/studio/fields/migrations/representation", () => ({ writeFieldMigrationRepresentation: m.writer }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { createFieldMigrationExecutionPin, readFieldMigrationExecutionProgress } from "@/core/studio/fields/migrations/execution-contract";
import { reviewedFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { executeFieldMigrationBatch, FieldMigrationExecutionError } from "@/core/studio/fields/migrations/execution-batch";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal = { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" as const };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const targetPayload = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 5), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
type Row = { preparationId: string; organisationId: string; definitionId: string; entityId: string; pin: unknown; pinChecksum: string;
  state: string; revision: number; cursor: string | null; processedCount: number; failureCode: string | null };
let row: Row, pin: ReturnType<typeof createFieldMigrationExecutionPin>, intent: ReturnType<typeof sealFieldMigrationIntent>;
let publication: ReturnType<typeof reviewedFieldPublicationPin> & { state: string };
let observations: Array<{ id: string; recordId: string }>, outcomes: string[], audits: string[];
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module }, organisation: { findFirst: m.company },
  studioFieldMigrationPublication: { findFirst: m.publication }, studioFieldMigrationExecution: { findFirst: m.execution, updateMany: m.update }, auditEntry: { create: m.audit } };
const request = (revision = 0, limit = 2) => ({ preparationId: uuid(3), revision, limit });
beforeEach(async () => {
  vi.clearAllMocks(); outcomes = []; audits = []; m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined);
  m.member.mockResolvedValue({ sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  const a = await compileCustomField(session, source, registry), b = await compileCustomField(session, targetPayload, registry);
  intent = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: uuid(6), versionChecksum: a.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: b.checksum, payload: targetPayload },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 3) });
  const stored = sealFieldMigrationReview({ ...intent.intent, cohort: { recordCount: 3, observationDigest: "a".repeat(64) }, summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  const target = { id: uuid(8), organisationId: "company", definitionId: uuid(4), version: 2, payload: targetPayload, compiledPlan: b.plan, checksum: b.checksum };
  publication = { ...reviewedFieldPublicationPin(stored, target, "user", false), state: "PUBLISHED" };
  pin = createFieldMigrationExecutionPin(stored, target, reviewedFieldPublicationPin(stored, target, "user", false), registry.describe("tickets.ticket", 5), registry.describe("tickets.ticket.field_representation", 1));
  row = { preparationId: uuid(3), organisationId: "company", definitionId: uuid(4), entityId: "tickets.ticket", pin: pin.pin, pinChecksum: pin.checksum,
    state: "RUNNING", revision: 0, cursor: null, processedCount: 0, failureCode: null };
  observations = ["A_ticket", "Z_ticket", "a_ticket"].map((recordId, i) => ({ id: uuid(i + 20), recordId }));
  m.initial.mockImplementation(async ({ where }) => where.id === uuid(3) && where.organisationId === "company" ? { id: uuid(3), intent: intent.intent, intentChecksum: intent.checksum } : null);
  m.inspect.mockImplementation(async () => ({ intent: intent.intent, stored, publication, target, registry, pin: pin.pin, pinChecksum: pin.checksum,
    existing: structuredClone(row), progress: readFieldMigrationExecutionProgress(pin.pin, { state: row.state, revision: row.revision, cursor: row.cursor, processedCount: row.processedCount, failureCode: row.failureCode }) }));
  m.raw.mockImplementation(async (parts: TemplateStringsArray, ...values: unknown[]) => parts.join("").includes('ORDER BY "recordId"')
    ? observations.filter(o => values[3] === null || o.recordId > String(values[3])).slice(0, Number(values[5])) : []);
  m.writer.mockImplementation(async (_authority, _inspection, id: string) => { const observation = observations.find(o => o.id === id)!; outcomes.push(id); return { observationId: observation.id, recordId: observation.recordId }; });
  m.publication.mockImplementation(async ({ where }) => where.state === publication.state && where.publisherUserId === "user" ? publication : null);
  m.execution.mockImplementation(async ({ where }) => Object.entries(where).every(([key, value]) => row[key as keyof Row] === value) ? structuredClone(row) : null);
  m.update.mockImplementation(async ({ where, data }) => { if (!Object.entries(where).every(([key, value]) => row[key as keyof Row] === value)) return { count: 0 }; row = { ...row, ...data }; return { count: 1 }; });
  m.audit.mockImplementation(async ({ data }) => { audits.push(data.action); return { id: "audit" }; });
  m.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = structuredClone({ row, outcomes, audits }); try { return await run(tx); } catch (error) { ({ row, outcomes, audits } = before); throw error; }
  });
});
it("commits bounded canonical prefix plus Audit, stops between batches and finishes only the exact cohort", async () => {
  const first = await executeFieldMigrationBatch(session, request());
  expect(first).toMatchObject({ revision: 1, state: "RUNNING", cursor: "Z_ticket", processedCount: 2, appended: 2, replayed: false });
  expect(outcomes).toEqual([uuid(20), uuid(21)]); expect(audits).toEqual(["studio.field.migration.execution_batched"]);
  expect(m.audit.mock.calls[0][0].data.after).toEqual({ pinChecksum: pin.checksum, fromRevision: 0, revision: 1, state: "RUNNING", resumed: false });
  expect(await executeFieldMigrationBatch(session, request(1))).toMatchObject({ revision: 2, state: "READY", cursor: "a_ticket", processedCount: 3, appended: 1 });
  expect(outcomes).toEqual([uuid(20), uuid(21), uuid(22)]); expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});
it("a lost response and completed replay recheck authority but never process the next batch or duplicate history", async () => {
  await executeFieldMigrationBatch(session, request()); m.writer.mockClear(); m.audit.mockClear();
  expect(await executeFieldMigrationBatch(session, request())).toMatchObject({ revision: 1, processedCount: 2, appended: 0, replayed: true });
  expect(m.writer).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  await executeFieldMigrationBatch(session, request(1)); m.writer.mockClear(); m.audit.mockClear();
  expect(await executeFieldMigrationBatch(session, request(2))).toMatchObject({ state: "READY", revision: 2, appended: 0, replayed: true });
  expect(m.writer).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("rollback after a later row failure leaves no targets from that batch and records only exact retained-prefix generic failure", async () => {
  m.writer.mockImplementationOnce(async () => { outcomes.push(uuid(20)); return { observationId: observations[0].id, recordId: observations[0].recordId }; }).mockRejectedValueOnce(new Error("private driver payload"));
  let failure: unknown; try { await executeFieldMigrationBatch(session, request()); } catch (e) { failure = e; }
  expect(failure).toBeInstanceOf(FieldMigrationExecutionError); expect(failure).toMatchObject({ code: "WRITE_FAILED", failureRecorded: true }); expect(String(failure)).not.toContain("private driver payload");
  expect(outcomes).toEqual([]); expect(row).toMatchObject({ state: "FAILED", revision: 1, cursor: null, processedCount: 0, failureCode: "WRITE_FAILED" });
  expect(audits).toEqual(["studio.field.migration.execution_failed"]); expect(m.audit.mock.calls[0][0].data.after).not.toHaveProperty("cursor");
  expect(await executeFieldMigrationBatch(session, request(1))).toMatchObject({ state: "RUNNING", revision: 3, processedCount: 2, appended: 2 });
  expect(outcomes).toEqual([uuid(20), uuid(21)]); expect(row.failureCode).toBeNull();
});
it("batch Audit failure rolls back values and cursor; recovery Audit failure cannot be reported as persisted", async () => {
  await executeFieldMigrationBatch(session, request(0, 1));
  m.audit.mockRejectedValueOnce(new Error("batch Audit down")).mockRejectedValueOnce(new Error("failure Audit down"));
  await expect(executeFieldMigrationBatch(session, request(1, 2))).rejects.toMatchObject({ code: "WRITE_FAILED", failureRecorded: false });
  expect(outcomes).toEqual([uuid(20)]); expect(row).toMatchObject({ revision: 1, processedCount: 1, state: "RUNNING", cursor: "A_ticket" });
  expect(await executeFieldMigrationBatch(session, request(1, 2))).toMatchObject({ state: "READY", processedCount: 3, revision: 2 });
});
it("private revocation blocks even replay before progress and may record only sparse failure, while revoked membership cannot", async () => {
  m.inspect.mockRejectedValueOnce(new Error("FORBIDDEN: private access removed"));
  await expect(executeFieldMigrationBatch(session, request())).rejects.toMatchObject({ code: "ACCESS_CHANGED", failureRecorded: true });
  expect(m.writer).not.toHaveBeenCalled(); expect(row).toMatchObject({ state: "FAILED", processedCount: 0 });
  m.resolve.mockRejectedValue(new Error("FORBIDDEN: initiating membership removed"));
  await expect(executeFieldMigrationBatch(session, request(1))).rejects.toMatchObject({ code: "ACCESS_CHANGED", failureRecorded: false });
  expect(row.revision).toBe(1); expect(outcomes).toEqual([]);
});
it("closed limits/client authority, future or stale revisions, changed prefix and lost CAS cannot advance another operation", async () => {
  for (const input of [{ ...request(), limit: 0 }, { ...request(), limit: 51 }, { ...request(), organisationId: "other" }, { ...request(), cursor: "a_ticket" }, { ...request(), pin: {} }])
    await expect(executeFieldMigrationBatch(session, input)).rejects.toThrow();
  await expect(executeFieldMigrationBatch({ ...session, organisationId: "other" }, request())).rejects.toThrow("stale or has changed");
  await expect(executeFieldMigrationBatch(session, request(1))).rejects.toMatchObject({ failureRecorded: false }); expect(row.revision).toBe(0);
  m.update.mockResolvedValueOnce({ count: 0 }); await expect(executeFieldMigrationBatch(session, request())).rejects.toMatchObject({ code: "REVIEW_CHANGED", failureRecorded: true }); expect(outcomes).toEqual([]);
});
it("an empty reviewed cohort becomes READY without values", async () => {
  pin.pin.cohort.recordCount = 0; observations = [];
  expect(await executeFieldMigrationBatch(session, request())).toMatchObject({ state: "READY", processedCount: 0, cursor: null, appended: 0, revision: 1 }); expect(m.writer).not.toHaveBeenCalled();
});

it("an incomplete empty page fails without partial progress, and failure during FAILED resume retains its previous prefix", async () => {
  observations = []; await expect(executeFieldMigrationBatch(session, request())).rejects.toMatchObject({ code: "REVIEW_CHANGED", failureRecorded: true });
  expect(row).toMatchObject({ state: "FAILED", processedCount: 0, revision: 1 });
  m.writer.mockRejectedValueOnce(new Error("write interrupted")); observations = [{ id: uuid(20), recordId: "A_ticket" }];
  await expect(executeFieldMigrationBatch(session, request(1))).rejects.toMatchObject({ code: "WRITE_FAILED", failureRecorded: false });
  expect(row).toMatchObject({ state: "FAILED", processedCount: 0, revision: 1, cursor: null }); expect(outcomes).toEqual([]);
});

it("reserves a SQL revision for cancellation instead of allowing progress/failure overflow to trap an operation", async () => {
  row.revision = 2147483646;
  await expect(executeFieldMigrationBatch(session, request(2147483646))).rejects.toMatchObject({ code: "REVIEW_CHANGED", failureRecorded: false });
  expect(row.revision).toBe(2147483646); expect(m.writer).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
  row.revision = 2147483645; row.state = "FAILED"; row.failureCode = "WRITE_FAILED";
  await expect(executeFieldMigrationBatch(session, request(2147483645))).rejects.toMatchObject({ code: "REVIEW_CHANGED", failureRecorded: false });
  expect(row.revision).toBe(2147483645); expect(m.writer).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
