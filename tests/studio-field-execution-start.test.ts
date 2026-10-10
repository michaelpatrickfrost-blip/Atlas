import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
const m = vi.hoisted(() => ({ initial: vi.fn(), transaction: vi.fn(), resolve: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(),
  preparation: vi.fn(), publication: vi.fn(), execution: vi.fn(), create: vi.fn(), target: vi.fn(), audit: vi.fn(), inspect: vi.fn(),
  receipt: vi.fn(), receiptCreate: vi.fn(), publicationUpdate: vi.fn(), definition: vi.fn(), definitionUpdate: vi.fn(), generation: vi.fn(), modules: vi.fn(), draft: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction, studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
vi.mock("@/core/studio/fields/migrations/inspection", () => ({ inspectFieldMigrationReview: m.inspect }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { checksum } from "@/core/studio/registry/contracts";
import { reviewedFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { cutoverReviewedFieldMigration } from "@/core/studio/fields/migrations/cutover";
import { startFieldMigrationExecution } from "@/core/studio/fields/migrations/execution-start";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
let available = true;
const registry = new CapabilityRegistry(async () => available); registry.register("tickets", ticketStudioContract);
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal = { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" as const };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const targetPayload = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 5), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
let sealed: ReturnType<typeof sealFieldMigrationReview>;
let prepared: { id: string; organisationId: string; definitionId: string; state: string; intent: unknown; intentChecksum: string; review: { review: unknown; checksum: string } };
let publication: ReturnType<typeof reviewedFieldPublicationPin> & { state: string; revision: number };
let target: { id: string; organisationId: string; definitionId: string; version: number; payload: unknown; compiledPlan: unknown; checksum: string };
type Row = { preparationId: string; organisationId: string; definitionId: string; entityId: string; pin: unknown; pinChecksum: string;
  state: string; revision: number; cursor: string | null; processedCount: number; failureCode: string | null };
let execution: Row | null;
let sourceVersion: typeof target;
let definition: { id: string; organisationId: string; kind: string; activeVersionId: string; revision: number; latestVersion: number; retiredAt: null };
let receipt: { preparationId: string; organisationId: string; definitionId: string; sourceVersionId: string; targetVersionId: string; pin: unknown; pinChecksum: string; state: string; revision: number; createdBy: string } | null;
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module, count: m.modules }, organisation: { findFirst: m.company },
  studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationPublication: { findFirst: m.publication, updateMany: m.publicationUpdate },
  studioFieldMigrationExecution: { findFirst: m.execution, create: m.create }, studioDefinitionVersion: { findFirst: m.target }, auditEntry: { create: m.audit }, studioFieldMigrationCutover: { findFirst: m.receipt, create: m.receiptCreate },
  studioDefinition: { findFirst: m.definition, updateMany: m.definitionUpdate }, studioFieldGeneration: { findFirst: m.generation }, studioDraft: { findFirst: m.draft } };
const request = () => ({ preparationId: uuid(3), publicationRevision: 0, reviewChecksum: sealed.checksum });
beforeEach(async () => {
  vi.clearAllMocks(); available = true; execution = null; receipt = null; m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined); m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("AS fresh") ? [{ fresh: true }] : []);
  m.member.mockResolvedValue({ sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  const a = await compileCustomField(session, source, registry), b = await compileCustomField(session, targetPayload, registry);
  const pinned = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: uuid(6), versionChecksum: a.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: b.checksum, payload: targetPayload },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 3) });
  sealed = sealFieldMigrationReview({ ...pinned.intent, cohort: { recordCount: 3, observationDigest: "a".repeat(64) }, summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  prepared = { id: uuid(3), organisationId: "company", definitionId: uuid(4), state: "REVIEWED", intent: pinned.intent, intentChecksum: pinned.checksum, review: { review: sealed.review, checksum: sealed.checksum } };
  target = { id: uuid(8), organisationId: "company", definitionId: uuid(4), version: 2, payload: targetPayload, compiledPlan: b.plan, checksum: b.checksum };
  sourceVersion = { id: uuid(6), organisationId: "company", definitionId: uuid(4), version: 1, payload: source, compiledPlan: a.plan, checksum: a.checksum };
  definition = { id: uuid(4), organisationId: "company", kind: "customField", activeVersionId: uuid(6), revision: 8, latestVersion: 2, retiredAt: null };
  publication = { ...reviewedFieldPublicationPin(sealed, target, "user", false), state: "PUBLISHED", revision: 0 };
  m.initial.mockImplementation(async ({ where }) => where.id === prepared.id && where.organisationId === prepared.organisationId ? structuredClone(prepared) : null);
  m.preparation.mockImplementation(async () => structuredClone(prepared)); m.publication.mockImplementation(async () => structuredClone(publication));
  m.execution.mockImplementation(async () => structuredClone(execution)); m.target.mockImplementation(async ({ where }) => structuredClone(where.id === sourceVersion.id ? sourceVersion : target)); m.inspect.mockImplementation(async () => structuredClone(sealed));
  m.create.mockImplementation(async ({ data }) => { execution = { ...data, state: "RUNNING", revision: 0, cursor: null, processedCount: 0, failureCode: null }; return structuredClone(execution); });
  m.receipt.mockImplementation(async () => structuredClone(receipt)); m.definition.mockImplementation(async () => structuredClone(definition));
  m.generation.mockResolvedValue({ id: targetPayload.storageGeneration }); m.modules.mockResolvedValue(1);
  m.draft.mockImplementation(async () => ({ revision: 10, baseVersionId: target.id, payload: targetPayload }));
  m.receiptCreate.mockImplementation(async ({ data }) => { receipt = { ...data, state: "ACTIVATED", revision: 0 }; return structuredClone(receipt); });
  m.publicationUpdate.mockImplementation(async ({ where, data }) => {
    if (where.organisationId !== publication.organisationId || where.preparationId !== publication.preparationId || where.state !== publication.state || where.revision !== publication.revision) return { count: 0 };
    publication = { ...publication, state: data.state, revision: publication.revision + 1 }; return { count: 1 };
  });
  m.definitionUpdate.mockImplementation(async ({ where, data }) => {
    if (where.organisationId !== definition.organisationId || where.id !== definition.id || where.activeVersionId !== definition.activeVersionId || where.revision !== definition.revision) return { count: 0 };
    definition = { ...definition, activeVersionId: data.activeVersionId, revision: definition.revision + 1 }; return { count: 1 };
  });
  m.audit.mockResolvedValue({ id: "audit" }); m.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = structuredClone({ execution, receipt, publication, definition }); try { return await run(tx); } catch (error) { ({ execution, receipt, publication, definition } = before); throw error; }
  });
});
it("pins the exact explicit owner approval and starts with zero progress plus atomic Audit, without target or native writes", async () => {
  expect(await startFieldMigrationExecution(session, request())).toEqual({ id: uuid(3), state: "RUNNING", revision: 0, cursor: null, processedCount: 0, failureCode: null, replayed: false });
  expect(execution?.pinChecksum).toBe(checksum(execution?.pin)); expect(execution?.pin).toMatchObject({ entity: ref("tickets.ticket", 5), ownerApproval: ref("tickets.ticket.field_representation", 1) });
  expect(m.inspect.mock.calls[0].at(-1)).toBe("publication"); expect(m.audit.mock.calls[0][0].data.after).toEqual({ pinChecksum: execution?.pinChecksum, state: "RUNNING", revision: 0 });
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});
it("lost-response start replays only after current execution inspection and does not append or duplicate Audit", async () => {
  await startFieldMigrationExecution(session, request()); m.create.mockClear(); m.audit.mockClear();
  expect(await startFieldMigrationExecution(session, request())).toMatchObject({ revision: 0, processedCount: 0, replayed: true });
  expect(m.inspect.mock.calls.at(-1)?.at(-1)).toBe("execution"); expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  execution!.revision = 2; execution!.processedCount = 1; execution!.cursor = "ticket_a"; execution!.state = "FAILED"; execution!.failureCode = "WRITE_FAILED";
  expect(await startFieldMigrationExecution(session, request())).toMatchObject({ state: "FAILED", revision: 2, processedCount: 1, replayed: true });
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("client tenant/pin/stage, foreign principal, stale publication/checksum or cancelled source cannot start", async () => {
  for (const input of [{ ...request(), organisationId: "other" }, { ...request(), pin: {} }, { ...request(), stage: "execution" }]) await expect(startFieldMigrationExecution(session, input)).rejects.toThrow();
  await expect(startFieldMigrationExecution({ ...session, organisationId: "other" }, request())).rejects.toThrow("stale or has changed");
  await expect(startFieldMigrationExecution(session, { ...request(), publicationRevision: 1 })).rejects.toThrow("stale or has changed");
  await expect(startFieldMigrationExecution(session, { ...request(), reviewChecksum: "f".repeat(64) })).rejects.toThrow("stale or has changed");
  publication.state = "CANCELLED"; await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed");
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("rechecks initiating authority, source module, private/written coverage and exact target compiler before progress", async () => {
  await expect(startFieldMigrationExecution({ ...session, capabilities: new Set(["tickets.ticket.read"]) }, request())).rejects.toThrow("FORBIDDEN"); expect(m.initial).not.toHaveBeenCalled();
  m.resolve.mockRejectedValueOnce(new Error("FORBIDDEN: departed member")); await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("departed member");
  available = false; await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("unavailable"); available = true;
  m.inspect.mockRejectedValueOnce(new Error("FORBIDDEN: written/private access removed")); await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("written/private");
  target.compiledPlan = {}; await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed");
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("changed archive, cross-scoped immutable target or invalid persisted pin/progress are rejected on replay", async () => {
  m.inspect.mockResolvedValueOnce(sealFieldMigrationReview({ ...sealed.review, cohort: { ...sealed.review.cohort, observationDigest: "f".repeat(64) } }));
  await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed");
  target.organisationId = "other"; await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed"); target.organisationId = "company";
  await startFieldMigrationExecution(session, request()); m.audit.mockClear();
  const exact = structuredClone(execution!); execution!.pinChecksum = "f".repeat(64); await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed");
  execution = structuredClone(exact); execution!.pin = { ...(execution!.pin as object), ownerApproval: ref("tickets.ticket.field_migration", 3) }; execution!.pinChecksum = checksum(execution!.pin);
  await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed");
  execution = structuredClone(exact); execution!.processedCount = 1; await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed");
  execution = structuredClone(exact); execution!.state = "CANCELLED"; await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed"); expect(m.audit).not.toHaveBeenCalled();
});
it("a failed start Audit rolls back the execution and an identical request can retry", async () => {
  m.audit.mockRejectedValueOnce(new Error("Audit unavailable")); await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("Audit unavailable"); expect(execution).toBeNull();
  expect(await startFieldMigrationExecution(session, request())).toMatchObject({ revision: 0, replayed: false });
});

async function readyCutover() {
  await startFieldMigrationExecution(session, request());
  execution!.state = "READY"; execution!.revision = 2; execution!.processedCount = 3; execution!.cursor = "ticket_z";
  m.audit.mockClear(); m.create.mockClear();
  return { ...request(), definitionRevision: 8, executionRevision: 2 };
}
it("explicit cutover reuses exact generation/module/source-pointer CAS and saves paired Audit atomically", async () => {
  const input = await readyCutover(), before = structuredClone(execution);
  expect(await cutoverReviewedFieldMigration(session, input)).toEqual({ id: uuid(3), state: "ACTIVATED", definitionRevision: 9, publicationRevision: 1,
    executionRevision: 2, sourceVersionId: uuid(6), targetVersionId: target.id, reviewChecksum: sealed.checksum, replayed: false });
  expect(receipt?.pinChecksum).toBe(checksum(receipt?.pin)); expect(definition.activeVersionId).toBe(target.id); expect(publication.state).toBe("CUTOVER");
  expect(m.definitionUpdate.mock.calls[0][0].where).toMatchObject({ organisationId: "company", revision: 8, activeVersionId: uuid(6), retiredAt: null });
  expect(m.generation).toHaveBeenCalled(); expect(m.audit.mock.calls.map(([arg]) => arg.data.action)).toEqual(["studio.definition.activated", "studio.field.migration.cutover"]);
  expect(execution).toEqual(before); expect(m.create).not.toHaveBeenCalled();
});
it("cutover replay inspects actual receipt/target-active metadata and current review without duplicate writes/Audit", async () => {
  const input = await readyCutover(); await cutoverReviewedFieldMigration(session, input);
  m.receiptCreate.mockClear(); m.publicationUpdate.mockClear(); m.definitionUpdate.mockClear(); m.audit.mockClear();
  expect(await cutoverReviewedFieldMigration(session, input)).toMatchObject({ definitionRevision: 9, publicationRevision: 1, replayed: true });
  expect(m.inspect.mock.calls.at(-1)?.at(-1)).toBe("cutover");
  for (const call of [m.receiptCreate, m.publicationUpdate, m.definitionUpdate, m.audit]) expect(call).not.toHaveBeenCalled();
  await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("stale or has changed");
});
it("cutover denies unfinished progress, stale confirmations and injected client scope/stage before activation", async () => {
  const input = await readyCutover(); execution!.state = "RUNNING"; execution!.processedCount = 1;
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("stale or has changed"); execution!.state = "READY"; execution!.processedCount = 3;
  for (const patch of [{ definitionRevision: 9 }, { publicationRevision: 1 }, { executionRevision: 1 }, { reviewChecksum: "f".repeat(64) },
    { organisationId: "other" }, { stage: "cutover" }, { canRollback: true }]) await expect(cutoverReviewedFieldMigration(session, { ...input, ...patch })).rejects.toThrow();
  expect(m.receiptCreate).not.toHaveBeenCalled(); expect(m.definitionUpdate).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("both activation and migration Audit failures roll back receipt/publication/pointer and allow exact retry", async () => {
  const input = await readyCutover();
  const before = structuredClone({ execution, receipt, publication, definition });
  m.audit.mockRejectedValueOnce(new Error("activation Audit unavailable"));
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("activation Audit unavailable");
  expect({ execution, receipt, publication, definition }).toEqual(before);
  m.audit.mockResolvedValueOnce({ id: "activation" }).mockRejectedValueOnce(new Error("cutover Audit unavailable"));
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("cutover Audit unavailable");
  expect({ execution, receipt, publication, definition }).toEqual(before);
  expect(await cutoverReviewedFieldMigration(session, input)).toMatchObject({ replayed: false });
});
it("publication or definition CAS and generation dependency failures cannot leave a receipt committed", async () => {
  const input = await readyCutover(); m.publicationUpdate.mockResolvedValueOnce({ count: 0 });
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("stale or has changed"); expect(receipt).toBeNull();
  m.definitionUpdate.mockResolvedValueOnce({ count: 0 });
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("CONFLICT"); expect(receipt).toBeNull(); expect(publication.state).toBe("PUBLISHED");
  m.generation.mockResolvedValueOnce(null);
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("storage generation"); expect(receipt).toBeNull(); expect(m.audit).not.toHaveBeenCalled();
});
it("cutover and replay require refreshed initiating authority, native/private/written coverage and source availability", async () => {
  const input = await readyCutover(); m.resolve.mockRejectedValueOnce(new Error("revoked initiating actor"));
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("revoked initiating actor");
  m.inspect.mockRejectedValueOnce(new Error("private/written access removed"));
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("private/written access removed"); expect(receipt).toBeNull();
  await cutoverReviewedFieldMigration(session, input); m.audit.mockClear(); m.definitionUpdate.mockClear();
  m.resolve.mockRejectedValueOnce(new Error("revoked initiating actor")); await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("revoked initiating actor");
  m.resolve.mockResolvedValue({ ...session, capabilities: new Set(["studio.definition.publish", "tickets.ticket.read"]) });
  m.inspect.mockImplementationOnce(async (context: { session: Session }) => { assertCapability(context.session, "tickets.ticket.manage"); return structuredClone(sealed); });
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("tickets.ticket.manage"); m.resolve.mockResolvedValue(session);
  available = false; await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("unavailable"); available = true;
  m.inspect.mockRejectedValueOnce(new Error("private/written access removed"));
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("private/written access removed");
  expect(m.audit).not.toHaveBeenCalled(); expect(m.definitionUpdate).not.toHaveBeenCalled();
});
it("replay refuses changed representation/draft/receipt/CAS and stale requests even when the active target is intact", async () => {
  const input = await readyCutover(); await cutoverReviewedFieldMigration(session, input); m.audit.mockClear();
  await expect(cutoverReviewedFieldMigration(session, { ...input, definitionRevision: 9 })).rejects.toThrow("stale or has changed");
  m.raw.mockImplementationOnce(async () => []).mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("AS fresh") ? [{ fresh: false }] : []);
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("stale or has changed");
  expect(m.audit).not.toHaveBeenCalled();
});
