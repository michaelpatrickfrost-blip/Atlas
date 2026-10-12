import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
const m = vi.hoisted(() => ({ initial: vi.fn(), transaction: vi.fn(), resolve: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(),
  preparation: vi.fn(), publication: vi.fn(), execution: vi.fn(), create: vi.fn(), target: vi.fn(), audit: vi.fn(), inspect: vi.fn(), requiredInspect: vi.fn(), requiredCutoverReview: vi.fn(), metadata: vi.fn(),
  receipt: vi.fn(), receiptCreate: vi.fn(), publicationUpdate: vi.fn(), definition: vi.fn(), definitionUpdate: vi.fn(), generation: vi.fn(), modules: vi.fn(), draft: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction, studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
vi.mock("@/core/studio/fields/migrations/inspection", () => ({ inspectFieldMigrationReview: m.inspect, inspectCutoverRequiredFieldMigrationReview: m.requiredCutoverReview }));
vi.mock("@/core/studio/fields/migrations/execution-inspection", async importOriginal => ({
  ...await importOriginal<typeof import("@/core/studio/fields/migrations/execution-inspection")>(),
  inspectRequiredFieldMigrationExecution: m.requiredInspect,
}));
vi.mock("@/core/studio/fields/migrations/metadata", () => ({ compileFieldMigrationMetadata: m.metadata }));
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createRequiredFieldMigrationExecutionPin, readFieldMigrationExecutionProgress } from "@/core/studio/fields/migrations/execution-contract";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { checksum } from "@/core/studio/registry/contracts";
import { reviewedFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
vi.mock("@/core/studio/configuration/impact", () => ({ assertFieldConfigurationCompatibilityInTransaction: vi.fn() }));
import { cutoverReviewedFieldMigration } from "@/core/studio/fields/migrations/cutover";
import { startFieldMigrationExecution } from "@/core/studio/fields/migrations/execution-start";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
let available = true;
const registry = new CapabilityRegistry(async () => available); registry.register("tickets", ticketStudioContract);
// Owner preflight callback is a collaborator: prove service ordering/denial here,
// while genuine native/private policy and SQL proof remain separate acceptance.
const ownerPreflight = vi.spyOn(registry, "invokeQueryInTransaction");
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal = { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" as const };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const targetPayload = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 5), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
let sealed: ReturnType<typeof sealFieldMigrationReview> | ReturnType<typeof sealRequiredFieldMigrationReview>;
let prepared: { id: string; organisationId: string; definitionId: string; state: string; intent: unknown; intentChecksum: string; review: { id: string; organisationId: string; definitionId: string; review: unknown; checksum: string } };
let publication: ReturnType<typeof reviewedFieldPublicationPin> & { state: string; revision: number };
let target: { id: string; organisationId: string; definitionId: string; version: number; payload: unknown; compiledPlan: unknown; checksum: string; schemaVersion: number; createdBy: string };
type Row = { preparationId: string; organisationId: string; definitionId: string; entityId: string; pin: unknown; pinChecksum: string;
  state: string; revision: number; cursor: string | null; processedCount: number; failureCode: string | null };
let execution: Row | null;
function versionProjection(row: typeof target) { const { schemaVersion, createdBy, ...projection } = row; void schemaVersion; void createdBy; return projection; }
let sourceVersion: typeof target;
let definition: { id: string; organisationId: string; kind: string; activeVersionId: string; revision: number; latestVersion: number; retiredAt: null };
let receipt: { preparationId: string; organisationId: string; definitionId: string; sourceVersionId: string; targetVersionId: string; pin: unknown; pinChecksum: string; state: string; revision: number; createdBy: string } | null;
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module, count: m.modules }, organisation: { findFirst: m.company },
  studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationPublication: { findFirst: m.publication, updateMany: m.publicationUpdate },
  studioFieldMigrationExecution: { findFirst: m.execution, create: m.create }, studioDefinitionVersion: { findFirst: m.target }, auditEntry: { create: m.audit }, studioFieldMigrationCutover: { findFirst: m.receipt, create: m.receiptCreate },
  studioDefinition: { findFirst: m.definition, updateMany: m.definitionUpdate }, studioFieldGeneration: { findFirst: m.generation }, studioDraft: { findFirst: m.draft } };
const request = () => ({ preparationId: uuid(3), publicationRevision: 0, reviewChecksum: sealed.checksum });
beforeEach(async () => {
  vi.clearAllMocks(); ownerPreflight.mockResolvedValue(undefined); available = true; execution = null; receipt = null; m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined); m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("AS fresh") ? [{ fresh: true }] : []);
  m.member.mockResolvedValue({ sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  const a = await compileCustomField(session, source, registry), b = await compileCustomField(session, targetPayload, registry);
  const pinned = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: uuid(6), versionChecksum: a.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: b.checksum, payload: targetPayload },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 3) });
  sealed = sealFieldMigrationReview({ ...pinned.intent, cohort: { recordCount: 3, observationDigest: "a".repeat(64) }, summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  prepared = { id: uuid(3), organisationId: "company", definitionId: uuid(4), state: "REVIEWED", intent: pinned.intent, intentChecksum: pinned.checksum, review: { id: uuid(3), organisationId: "company", definitionId: uuid(4), review: sealed.review, checksum: sealed.checksum } };
  target = { id: uuid(8), organisationId: "company", definitionId: uuid(4), version: 2, payload: targetPayload, compiledPlan: b.plan, checksum: b.checksum, schemaVersion: 1, createdBy: "user" };
  sourceVersion = { id: uuid(6), organisationId: "company", definitionId: uuid(4), version: 1, payload: source, compiledPlan: a.plan, checksum: a.checksum, schemaVersion: 1, createdBy: "historical-author" };
  definition = { id: uuid(4), organisationId: "company", kind: "customField", activeVersionId: uuid(6), revision: 8, latestVersion: 2, retiredAt: null };
  publication = { ...reviewedFieldPublicationPin(sealed, versionProjection(target), "user", false), state: "PUBLISHED", revision: 0 };
  m.initial.mockImplementation(async ({ where }) => where.id === prepared.id && where.organisationId === prepared.organisationId ? structuredClone(prepared) : null);
  m.preparation.mockImplementation(async () => structuredClone(prepared)); m.publication.mockImplementation(async () => structuredClone(publication));
  m.execution.mockImplementation(async () => structuredClone(execution)); m.target.mockImplementation(async ({ where, select }) => { const row = where.id === sourceVersion.id ? sourceVersion : target; return Object.fromEntries(Object.keys(select).map(key => [key, structuredClone(row[key as keyof typeof row])])); }); m.inspect.mockImplementation(async () => structuredClone(sealed));
  m.create.mockImplementation(async ({ data }) => { execution = { ...data, state: "RUNNING", revision: 0, cursor: null, processedCount: 0, failureCode: null }; return structuredClone(execution); });
  m.receipt.mockImplementation(async () => structuredClone(receipt)); m.definition.mockImplementation(async () => structuredClone(definition));
  m.generation.mockResolvedValue({ id: targetPayload.storageGeneration }); m.modules.mockResolvedValue(1);
  m.draft.mockImplementation(async () => ({ revision: 10, baseVersionId: target.id, payload: target.payload }));
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

// Conditional inspector is deliberately delegated here. Real compiler/pin and
// start transaction are exercised; authority/whole-cohort row proof has its own
// executing inspector suite and still requires central runtime acceptance.
async function conditionalStartFixture(sourceConditional = false, targetConditional = true) {
  const payload = conditionalFieldPayloadSchema.parse({ ...targetPayload, schemaVersion: 2, entity: ref("tickets.ticket", 9),
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  const compile = (input: typeof payload) => compileConditionalCustomField({ session, registry, definitionId: uuid(4),
    resolveMetadata: async source => source.kind === "native" ? registeredRequiredFactMetadata(session, registry, input.entity, source.fieldId) : Promise.reject(new Error("Unexpected field fixture")) }, input);
  const compiled = targetConditional ? await compile(payload) : await compileCustomField(session, { schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field }, registry);
  const sourceCompiled = sourceConditional ? await compile(conditionalFieldPayloadSchema.parse({ ...payload, storageGeneration: source.storageGeneration, field: source.field })) : await compileCustomField(session, source, registry);
  const { cohort: _cohort, summary: _summary, ...reviewIntent } = sealed.review; void _cohort; void _summary;
  const intent = sealRequiredFieldMigrationIntent({ ...reviewIntent, schemaVersion: 2,
    source: { ...sealed.review.source, payload: sourceCompiled.payload, versionChecksum: sourceCompiled.checksum },
    target: { ...sealed.review.target, payload: compiled.payload, compiledChecksum: compiled.checksum }, ownerQuery: ref("tickets.ticket.field_migration", 4) });
  sealed = sealRequiredFieldMigrationReview({ ...intent.intent, cohort: { recordCount: 3, observationDigest: "a".repeat(64) },
    summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  prepared = { ...prepared, intent: intent.intent, intentChecksum: intent.checksum, review: { ...prepared.review, ...sealed } };
  target = { ...target, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum, schemaVersion: compiled.payload.schemaVersion };
  sourceVersion = { ...sourceVersion, payload: sourceCompiled.payload, compiledPlan: sourceCompiled.plan, checksum: sourceCompiled.checksum, schemaVersion: sourceCompiled.payload.schemaVersion };
  m.metadata.mockImplementation(async (_context, _registry, _company, _definitionId, input) => checksum(input) === checksum(compiled.payload) ? compiled : sourceCompiled);
  m.requiredCutoverReview.mockImplementation(async () => structuredClone(sealed));
  const identity = reviewedRequiredFieldPublicationPin(sealed, versionProjection(target), "user", false);
  publication = { ...identity, state: "PUBLISHED", revision: 0 };
  const pinned = createRequiredFieldMigrationExecutionPin(sealed, versionProjection(target), identity, registry.describe("tickets.ticket", 9), registry.describe("tickets.ticket.field_representation", 2));
  m.requiredInspect.mockImplementation(async () => ({ intent: intent.intent, stored: sealed, publication, target, registry,
    pin: pinned.pin, pinChecksum: pinned.checksum, existing: structuredClone(execution), progress: execution ? readFieldMigrationExecutionProgress(pinned.pin,
      { state: execution.state, revision: execution.revision, cursor: execution.cursor, processedCount: execution.processedCount, failureCode: execution.failureCode }) : null }));
  return pinned;
}
it("dispatches actual stored conditional start and replay to required inspection and preserves receipt1 with whole review2", async () => {
  const pinned = await conditionalStartFixture();
  expect(await startFieldMigrationExecution(session, request())).toMatchObject({ state: "RUNNING", revision: 0, replayed: false });
  expect(execution?.pin).toEqual(pinned.pin); expect(pinned.pin.schemaVersion).toBe(1);
  expect(pinned.pin.publication.reviewChecksum).toBe(sealed.checksum); expect(pinned.pin.ownerApproval).toEqual(ref("tickets.ticket.field_representation", 2));
  expect(m.requiredInspect).toHaveBeenCalledOnce(); expect(m.inspect).not.toHaveBeenCalled();
  m.audit.mockClear(); m.create.mockClear();
  expect(await startFieldMigrationExecution(session, request())).toMatchObject({ replayed: true, processedCount: 0 });
  expect(m.requiredInspect).toHaveBeenCalledTimes(2); expect(m.audit).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it("conditional start refresh conflicts and denied replay do not fall back or duplicate history", async () => {
  await conditionalStartFixture(); await startFieldMigrationExecution(session, request()); m.audit.mockClear(); m.create.mockClear();
  m.requiredInspect.mockRejectedValueOnce(new Error("FORBIDDEN: current condition/private access"));
  await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("current condition/private");
  for (const patch of [{ schemaVersion: 1 }, { schemaVersion: 3 }]) {
    m.initial.mockResolvedValueOnce({ ...prepared, intent: { ...(prepared.intent as object), ...patch } });
    await expect(startFieldMigrationExecution(session, request())).rejects.toThrow();
  }
  await expect(startFieldMigrationExecution(session, { ...request(), schemaVersion: 2 })).rejects.toThrow();
  expect(m.inspect).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it("conditional start Audit failure rolls back its receipt and exact retry creates one execution", async () => {
  await conditionalStartFixture(); m.audit.mockRejectedValueOnce(new Error("conditional start Audit unavailable"));
  await expect(startFieldMigrationExecution(session, request())).rejects.toThrow("conditional start Audit unavailable"); expect(execution).toBeNull();
  expect(await startFieldMigrationExecution(session, request())).toMatchObject({ replayed: false, revision: 0 });
  expect(execution?.pin).toMatchObject({ schemaVersion: 1, entity: ref("tickets.ticket", 9) }); expect(m.inspect).not.toHaveBeenCalled();
});


// Required execution and row review remain collaborators. Normal cutover service,
// stored dispatch, real identity/pin/compiler and shared activation/Audit primitive
// run against snapshotting tx mocks; real PostgreSQL atomicity is root-owned proof.
async function readyRequiredCutover(sourceConditional = false, targetConditional = true) {
  await conditionalStartFixture(sourceConditional, targetConditional);
  await startFieldMigrationExecution(session, request());
  execution!.state = "READY"; execution!.revision = 2; execution!.processedCount = 3; execution!.cursor = "ticket_z";
  m.audit.mockClear(); m.create.mockClear();
  return { ...request(), definitionRevision: 8, executionRevision: 2 };
}
it.each([[false, true], [true, false]])("normal required cutover/replay preserves protocol2 for source2=%s,target2=%s", async (source2, target2) => {
  const input = await readyRequiredCutover(source2, target2);
  const originalSource = structuredClone(sourceVersion), originalExecution = structuredClone(execution);
  expect(await cutoverReviewedFieldMigration(session, input)).toMatchObject({ state: "ACTIVATED", definitionRevision: 9, replayed: false });
  expect(receipt?.pin).toMatchObject({ schemaVersion: 1, publication: { reviewChecksum: sealed.checksum } });
  expect(m.audit.mock.calls.map(([arg]) => arg.data.action)).toEqual(["studio.definition.activated", "studio.field.migration.cutover"]);
  expect(m.metadata.mock.calls.at(-1)?.[4]).toEqual(target.payload); expect(sourceVersion).toEqual(originalSource); expect(execution).toEqual(originalExecution);
  for (const mock of [m.receiptCreate, m.publicationUpdate, m.definitionUpdate, m.audit]) mock.mockClear();
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: false });
  expect(await cutoverReviewedFieldMigration(session, input)).toMatchObject({ replayed: true });
  expect(m.requiredCutoverReview).toHaveBeenCalledOnce(); expect(m.inspect).not.toHaveBeenCalled();
  for (const mock of [m.receiptCreate, m.publicationUpdate, m.definitionUpdate, m.audit]) expect(mock).not.toHaveBeenCalled();
});
it("gates normal production conditional activation without accepted paired readiness before execution proof or writes", async () => {
  const input = await readyRequiredCutover(); m.requiredInspect.mockClear();
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: false });
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("STUDIO_RUNTIME_FEATURE_UNAVAILABLE");
  expect(m.requiredInspect).not.toHaveBeenCalled(); expect(m.receiptCreate).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  expect(definition.activeVersionId).toBe(sourceVersion.id); expect(publication.state).toBe("PUBLISHED");
});
it("normal conditional receipt/CAS/activation/both Audit failures restore exact state and permit retry", async () => {
  const input = await readyRequiredCutover(), before = structuredClone({ execution, receipt, publication, definition, sourceVersion, target });
  for (const reject of [() => m.receiptCreate.mockRejectedValueOnce(new Error("receipt unavailable")),
    () => m.publicationUpdate.mockResolvedValueOnce({ count: 0 }), () => m.definitionUpdate.mockResolvedValueOnce({ count: 0 }),
    () => m.audit.mockRejectedValueOnce(new Error("activation Audit unavailable")),
    () => { m.audit.mockResolvedValueOnce({ id: "activation" }).mockRejectedValueOnce(new Error("cutover Audit unavailable")); }]) {
    reject(); await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow();
    expect({ execution, receipt, publication, definition, sourceVersion, target }).toEqual(before);
  }
  expect(await cutoverReviewedFieldMigration(session, input)).toMatchObject({ replayed: false });
});
it("conditional requests and replay deny scalar mirror drift, native/coverage/compiler changes and invented client format", async () => {
  const input = await readyRequiredCutover();
  for (const patch of [{ id: uuid(99) }, { organisationId: "foreign" }, { definitionId: uuid(99) }, { intentChecksum: "a".repeat(64) }]) {
    m.initial.mockResolvedValueOnce({ ...prepared, ...patch }); await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow();
  }
  await expect(cutoverReviewedFieldMigration(session, { ...input, schemaVersion: 2 })).rejects.toThrow();
  m.requiredInspect.mockRejectedValueOnce(new Error("FORBIDDEN: actual private/condition/source coverage"));
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("private/condition/source");
  m.metadata.mockResolvedValueOnce({ checksum: "a".repeat(64) }); await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow();
  expect(receipt).toBeNull(); await cutoverReviewedFieldMigration(session, input); m.audit.mockClear();
  m.requiredCutoverReview.mockRejectedValueOnce(new Error("FORBIDDEN: current native condition drift"));
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("native condition drift"); expect(m.audit).not.toHaveBeenCalled();
});

it("conditional replay proves current private preflight before retained identity/freshness and stops on denial", async () => {
  const input = await readyRequiredCutover(); await cutoverReviewedFieldMigration(session, input);
  for (const mock of [ownerPreflight, m.preparation, m.target, m.receipt, m.raw, m.requiredCutoverReview, m.metadata, m.audit]) mock.mockClear();
  ownerPreflight.mockRejectedValueOnce(new Error("FORBIDDEN: owner private cohort access revoked"));
  await expect(cutoverReviewedFieldMigration(session, input)).rejects.toThrow("private cohort access revoked");
  expect(ownerPreflight).toHaveBeenCalledWith({ session, transaction: tx }, sealed.review.ownerQuery, { mode: "preflight" });
  // Receipt existence lookup is allowed; full retained identity never starts.
  expect(m.receipt).toHaveBeenCalledOnce(); expect(m.receipt.mock.calls[0][0].select).toEqual({ preparationId: true });
  for (const mock of [m.preparation, m.target, m.requiredCutoverReview, m.metadata, m.audit]) expect(mock).not.toHaveBeenCalled();
  expect(m.raw.mock.calls.every(([strings]) => !strings.join("?").includes("AS fresh"))).toBe(true);
  ownerPreflight.mockClear(); m.raw.mockClear(); m.receipt.mockClear();
  expect(await cutoverReviewedFieldMigration(session, input)).toMatchObject({ replayed: true });
  expect(ownerPreflight).toHaveBeenCalledOnce();
  expect(ownerPreflight.mock.invocationCallOrder[0]).toBeLessThan(m.preparation.mock.invocationCallOrder[0]);
  const freshnessIndex = m.raw.mock.calls.findIndex(([strings]) => strings.join("?").includes("AS fresh"));
  expect(freshnessIndex).toBeGreaterThanOrEqual(0);
  expect(ownerPreflight.mock.invocationCallOrder[0]).toBeLessThan(m.raw.mock.invocationCallOrder[freshnessIndex]);
  expect(m.audit).not.toHaveBeenCalled();
});
